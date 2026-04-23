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

  // 1. Gina identify ang requester para ma check if Admin
  // or User mismo ang ga request sa user creation
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

  // 2. Gina Validate ang form data gamit ang Zod schema,
  // kung may error sa validation ga return it error message
  const validatedFields = CreateUserSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid form data.' };

  const data = validatedFields.data;

  // 3. Pag Validated na ang data, ga create na it new user gamit ang
  // Supabase Admin API, ga set it temporary password para makasulod dayon sa reset flow
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: 'P@ssw0rd!', // Temporary password, user must reset
      email_confirm: false,
      user_metadata: { role_id: data.role_id },
    });

  if (authError) return { success: false, message: authError.message };

  const userId = authData.user.id;

  try {
    // 4. Ga create na it profile sa profiles table, kung may error deretso
    // ga delete ang created user sa auth para malikawan ang abandoned accounts
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: data.username,
        email: data.email,
        role_id: data.role_id,
        is_setup_complete: false,
      });

    if (profileError) throw profileError;

    // 5. Ga logs ang activity nga may user creation, para may logs
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_CREATE: ${data.username}`,
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

  // 1. Gina identify ang requester para ma check if Admin
  // or User mismo ang ga request sa user creation
  const {
    data: { user: requester },
  } = await supabase.auth.getUser();
  if (!requester) return { success: false, message: 'Not authenticated.' };

  // 2. Gina fetch ang requester profile para ma determine if Admin or User.
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role_id, username')
    .eq('id', requester.id)
    .single();

  const isAdmin = requesterProfile?.role_id === 0;
  const isSelf = requester.id === targetUserId;

  // 3. gina check if ang requester may authority nga mag update it user,
  // Admins can update anyone, users can only update themselves
  if (!isAdmin && !isSelf) {
    return { success: false, message: 'Unauthorized access.' };
  }

  // 4. Gina Validate ang form data gamit ang Zod schema,
  // kung may error sa validation ga return it error message
  const validatedFields = UpdateProfileSchema.safeParse(values);
  if (!validatedFields.success)
    return { success: false, message: 'Invalid data.' };

  const { username, email } = validatedFields.data;

  try {
    // 5. Para sa pah hash or encrypt it security answer ng user.
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

    // 6. Gina update ang user email sa auth schema kung nag change ang email, gamit ang Supabase Admin API
    await supabaseAdmin.auth.admin.updateUserById(targetUserId, { email });

    // Update Profile Table
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetUserId);

    if (error) throw error;

    // 7. Log the activity with more context: if admin is updating another user, log it as
    // ADMIN_UPDATE_USER with the target user ID, if user is updating their own profile, log it as UPDATE
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

  // 1. Gina identify ang requester para ma check if Admin
  // or User mismo ang ga request sa user creation
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  // 2. Kung wala sang profile nga na match sa email, ga return it error message
  if (!profile) {
    return {
      success: false,
      message: 'No user found with this email address.',
    };
  }
  // 3. Kung may profile nga na match, ga trigger ang password reset email gamit ang Supabase Admin API
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.SITE_URL}/reset`,
  });

  if (error) return { success: false, message: error.message };

  return { success: true, message: 'Recovery email sent to user.' };
}

export async function resetUserLockout(userId: string, adminName: string) {
  const supabaseAdmin = await createAdminClient();
  const supabase = await createClient();

  // 1. Reset lockout fields in profiles table
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ failed_attempts: 0, lockout_until: null })
    .eq('id', userId);

  await logActivity(supabaseAdmin, {
    userId: userId,
    username: adminName,
    event: 'LOCKOUT_RESET',
    status: 'SUCCESS',
  });

  if (error) throw new Error('Failed to reset user lockout.');

  return { success: true };
}
