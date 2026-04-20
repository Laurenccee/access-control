'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  CreateUser,
  CreateUserSchema,
  UpdateUser,
  UpdateUserSchema,
} from '../schemas/user';
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

/**
 * UpdateUserAction
 * Synchronizes Supabase Auth and the Profiles table.
 * * Logic:
 * - Verifies Admin permissions.
 * - Only updates password if a non-empty string is provided.
 * - Only updates security_answer_hash if a new answer is provided.
 * - Logs all attempts to the activity log.
 */
export async function UpdateUserAction(userId: string, values: UpdateUser) {
  const supabaseAdmin = await createAdminClient();

  // 1. Authorization Check
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) return { success: false, message: 'Unauthorized session.' };

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role_id, username')
    .eq('id', adminUser.id)
    .single();

  if (adminProfile?.role_id !== 0) {
    return {
      success: false,
      message: 'Access Denied: Admin privileges required.',
    };
  }

  // 2. Data Validation
  const validatedFields = UpdateUserSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data provided.' };
  }

  const data = validatedFields.data;
  const {
    username,
    email,
    role_id,
    security_question_id,
    password,
    security_answer,
  } = validatedFields.data;

  try {
    // 3. Conditional Auth Update (Email and Password)
    const authUpdateData: any = { email: email };

    // STRICT CHECK: Only include password if it is not an empty string or just whitespace
    if (data.password && data.password.trim() !== '') {
      if (data.password.length < 8) {
        return {
          success: false,
          message: 'New password must be at least 8 characters.',
        };
      }
      authUpdateData.password = data.password;
    }

    // Update Supabase Auth identities
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdateData,
    );

    if (authError) throw authError;

    // 4. Prepare Profile Table Updates
    const profileUpdates: any = {
      username: username,
      email: email,
      role_id: role_id,
      security_question_id: security_question_id,
    };

    // STRICT CHECK: Only re-hash if a new security answer is provided
    if (data.security_answer && data.security_answer.trim() !== '') {
      profileUpdates.security_answer_hash = await hashSecurityAnswer(
        data.security_answer,
      );
    }

    // 5. Execute Database Update
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileError) throw profileError;

    // 6. Record Success in Activity Logs
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_UPDATE: ${data.username}`,
      status: 'SUCCESS',
    });

    // 7. Refresh Cache/UI
    revalidatePath('/admin-console');
    revalidatePath(`/profile/${userId}`);

    return {
      success: true,
      message: 'Personnel profile updated successfully!',
    };
  } catch (error: any) {
    // 8. Record Failure in Activity Logs
    const errorMsg = error?.message || 'Unknown Database Error';

    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_UPDATE: ${data.username} (${errorMsg})`,
      status: 'FAILURE',
    });

    console.error('UpdateUserAction Failure:', error);

    return {
      success: false,
      message:
        error?.code === '23505'
          ? 'Conflict: Username or email already in use.'
          : 'Update failed. Contact system administrator.',
    };
  }
}
