'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import * as crypto from 'crypto';
import { promisify } from 'util'; // Required to use await with scrypt
import { revalidatePath } from 'next/cache';
import { SecurityQuestionData, SecurityQuestionSchema } from '../schemas/auth';
import { cookies } from 'next/headers';

const scrypt = promisify(crypto.scrypt);

export async function verifySecurityAction(values: SecurityQuestionData) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  const validatedFields = SecurityQuestionSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid payload.' };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { success: false, message: 'Session expired.' };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('username, security_answer_hash, role_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.security_answer_hash)
    return { success: false, message: 'Profile not found.' };

  // --- NEW SCRYPT VERIFICATION LOGIC ---
  try {
    // 1. Split the stored string into salt and hash
    const [salt, originalHash] = profile.security_answer_hash.split(':');

    if (!salt || !originalHash) {
      console.error('Invalid hash format in database');
      return { success: false, message: 'Security data error.' };
    }

    // 2. Normalize user input (Match your updateAction exactly)
    const normalizedInput = validatedFields.data.answer.trim().toLowerCase();

    // 3. Re-hash the attempt using the extracted salt
    // Key length (64) must match your hashing function!
    const derivedKey = (await scrypt(normalizedInput, salt, 64)) as Buffer;
    const attemptHash = derivedKey.toString('hex');

    // 4. Compare the hashes
    if (attemptHash !== originalHash) {
      await supabaseAdmin.from('activity_logs').insert({
        user_id: user.id,
        username: profile.username,
        event_type: '2-FACTOR_AUTH',
        status: 'FAILURE',
      });
      return { success: false, message: 'Incorrect answer.' };
    }
  } catch (err) {
    console.error('Hashing error:', err);
    return { success: false, message: 'Verification process failed.' };
  }
  // --- END NEW LOGIC ---

  const cookieStore = await cookies();
  cookieStore.set('2fa-verified', 'true', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  const redirectTo = profile.role_id === 0 ? '/admin-console' : '/dashboard';

  await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    username: profile.username,
    event_type: '2-FACTOR_AUTH',
    status: 'SUCCESS',
  });

  revalidatePath('/', 'layout');
  return { success: true, redirectTo };
}
