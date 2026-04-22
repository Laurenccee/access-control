'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  CreateUser,
  CreateUserSchema,
  UpdateProfile,
  UpdateProfileSchema,
} from '../schemas/user';
import { hashSecurityAnswer, logActivity } from '@/lib/helper/auth';
import { set } from 'zod';

export async function addUserAction(values: CreateUser) {
  const supabaseAdmin = await createAdminClient();
  const supabase = await createClient();

  // 1. Authorization (Admin check)
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

  // 2. Validation (CreateUserSchema should now exclude password/security fields)
  const validatedFields = CreateUserSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid form data.' };

  const data = validatedFields.data;

  // 3. Create Auth User with a random complex password nobody knows
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: 'P@ssw0rd!',
      email_confirm: false, // Auto-confirm so they can use the reset flow
      user_metadata: { role_id: data.role_id },
    });

  if (authError) return { success: false, message: authError.message };

  const userId = authData.user.id;

  try {
    // 4. Insert Profile (NO security answer here)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: data.username,
        email: data.email,
        role_id: data.role_id,
        setup_complete: false,
      });

    if (profileError) throw profileError;

    // 5. Trigger Password Reset Email immediately
    // This allows the user to set their own password safely

    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_CREATE: ${data.username} (Reset Email Sent)`,
      status: 'SUCCESS',
    });

    revalidatePath('/admin-console');
    return { success: true, message: 'User created. Reset email sent.' };
  } catch (error: any) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return {
      success: false,
      message: error.message || 'User creation failed.',
    };
  }
}

export async function updateUserAction(targetUserId: string, values: any) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // 1. Identify the Requester (Who is clicking the button?)
  const {
    data: { user: requester },
  } = await supabase.auth.getUser();
  if (!requester) return { success: false, message: 'Not authenticated.' };

  // 2. Fetch Requester's Profile to check Role
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role_id, username')
    .eq('id', requester.id)
    .single();

  const isAdmin = requesterProfile?.role_id === 0;
  const isSelf = requester.id === targetUserId;

  // 3. Security Gate: Only Admin or the User themselves can proceed
  if (!isAdmin && !isSelf) {
    return { success: false, message: 'Unauthorized access.' };
  }

  // 4. Validation
  const validatedFields = UpdateProfileSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid data.' };

  const { username, email } = validatedFields.data;

  try {
    // 5. Build Update Object Dynamically (The RBAC Logic)
    let hashedAnswer = undefined;
    if (isSelf && values.security_answer) {
      // You must have a hashSecurityAnswer function available
      hashedAnswer = await hashSecurityAnswer(values.security_answer);
    }
    const profileUpdates: any = { username, email };

    // Only allow role updates if the requester is an ADMIN
    if (isAdmin && values.role_id !== undefined) {
      profileUpdates.role_id = values.role_id;
    }

    // Only allow security question/answer updates if the user is updating their own profile
    if (isSelf && values.security_question_id !== undefined) {
      profileUpdates.security_question_id = values.security_question_id;
    }
    if (isSelf && values.security_answer !== undefined) {
      profileUpdates.security_answer_hash = hashedAnswer;
    }

    // 6. Execute Updates
    // Update Auth Email via Admin Client (allows changing other users' emails)
    await supabaseAdmin.auth.admin.updateUserById(targetUserId, { email });

    // Update Profile Table
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetUserId);

    if (error) throw error;

    // 7. Log Activity (Task 7)
    await logActivity(supabaseAdmin, {
      userId: requester.id,
      username: requesterProfile?.username || 'System',
      event:
        isAdmin && !isSelf ? `ADMIN_UPDATE_USER: ${targetUserId}` : `UPDATE`,
      status: 'SUCCESS',
    });

    revalidatePath('/admin-console');
    revalidatePath('/user');

    return { success: true, message: 'Update successful.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Update failed.' };
  }
}

export async function triggerPasswordResetAction(email: string) {
  const supabaseAdmin = await createAdminClient();

  console.log('RedirectTo:', `${process.env.SITE_URL}/reset`);
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.SITE_URL}/reset`,
  });

  if (error) return { success: false, message: error.message };

  return { success: true, message: 'Recovery email sent to user.' };
}
