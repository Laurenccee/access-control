'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import * as crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { SecurityQuestionData, SecurityQuestionSchema } from '../schemas/auth';
import { cookies } from 'next/headers';

export async function verifySecurityAction(values: SecurityQuestionData) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // Validate input schema
  const validatedFields = SecurityQuestionSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid payload.' };

  // Check for active auth session from the first login stage
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { success: false, message: 'Session expired.' };

  // Fetch security hash using Admin Client (bypasses RLS for internal check)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('username, security_answer_hash, role_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile)
    return { success: false, message: 'Profile not found.' };

  // Hash user input and compare with stored database hash
  const hashedInput = crypto
    .createHash('sha256')
    .update(validatedFields.data.answer.trim().toLowerCase())
    .digest('hex');

  if (hashedInput !== profile.security_answer_hash) {
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      username: profile.username,
      event_type: '2-FACTOR_AUTH',
      status: 'FAILURE',
    });
    return { success: false, message: 'Incorrect answer.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('2fa-verified', 'true', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  const redirectTo = profile.role_id === 0 ? '/admin-console' : '/dashboard';

  // Log successful 2nd-factor verification
  await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    username: profile.username,
    event_type: '2-FACTOR_AUTH',
    status: 'SUCCESS',
  });

  revalidatePath('/', 'layout');
  return { success: true, redirectTo };
}
