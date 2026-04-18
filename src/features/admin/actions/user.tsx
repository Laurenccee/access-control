'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateUser, CreateUserSchema } from '../schemas/user';
import { hashSecurityAnswer, logActivity } from '@/lib/helper/auth';

export async function addUserAction(values: CreateUser) {
  const supabaseAdmin = await createAdminClient();

  // 1. Authorization Check (We need admin details for the log)
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, message: 'Unauthorized.' };

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role_id, username')
    .eq('id', adminUser.id)
    .single();

  if (adminProfile?.role_id !== 0)
    return { success: false, message: 'Access Denied.' };

  // 2. Validation
  const validatedFields = CreateUserSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid form data.' };

  const data = validatedFields.data;

  // 3. Create Auth User
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false,
      user_metadata: { role_id: data.role_id, created_by: adminUser.id },
    });

  if (authError) {
    return { success: false, message: authError.message };
  }

  const userId = authData.user.id;

  try {
    const hashedAnswer = await hashSecurityAnswer(data.security_answer);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: data.username.toLowerCase(), // Normalize username to lowercase
        email: data.email,
        security_question_id: data.security_question_id,
        security_answer_hash: hashedAnswer,
        role_id: data.role_id,
        is_active: true,
      });

    if (profileError) throw profileError;

    // --- SUCCESS LOG ---
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_CREATE: ${data.username}`,
      status: 'SUCCESS',
    });

    revalidatePath('/admin-console');
    return { success: true };
  } catch (error: any) {
    await supabaseAdmin.auth.admin.deleteUser(userId);

    // --- FAILURE LOG ---
    const errorMsg =
      error?.code === '23505' ? 'Duplicate Username/Email' : 'Database Error';
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_CREATE: ${data.username} (${errorMsg})`,
      status: 'FAILURE',
    });

    return {
      success: false,
      message:
        error?.code === '23505'
          ? 'Conflict: Username or email in use.'
          : 'Creation failed.',
    };
  }
}
