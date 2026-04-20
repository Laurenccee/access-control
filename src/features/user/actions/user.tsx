'use server';

import { logActivity } from '@/lib/helper/auth';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function softDeleteUser(userId: string) {
  const supabaseAdmin = await createAdminClient();
  const supabase = await createClient();

  // 1. Authorization Check
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

  // 2. Fetch target username for logging before we delete/deactivate
  const { data: targetUser } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  try {
    // 3. Update Database
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // 4. Success Log
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_DEACTIVATE: ${targetUser?.username || userId}`,
      status: 'SUCCESS',
    });

    revalidatePath('/admin-console');
    return { success: true };
  } catch (error: any) {
    // 5. Failure Log
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_DEACTIVATE: ${targetUser?.username || userId}`,
      status: 'FAILURE',
    });

    return { success: false, message: error.message };
  }
}

export async function reactivateUser(userId: string) {
  const supabaseAdmin = await createAdminClient();
  const supabase = await createClient();

  // 1. Authorization
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

  try {
    // 2. Fetch target for logging
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    // 3. Update Database (Resetting flags)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: true,
        deleted_at: null,
      })
      .eq('id', userId);

    if (error) throw error;

    // 4. Success Log
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_REACTIVATE: ${targetUser?.username || userId}`,
      status: 'SUCCESS',
    });

    revalidatePath('/admin-console');
    return { success: true, message: 'User account reactivated.' };
  } catch (error: any) {
    // 5. Failure Log
    await logActivity(supabaseAdmin, {
      userId: adminUser.id,
      username: adminProfile.username || 'Admin',
      event: `USER_REACTIVATE: ${adminProfile?.username || userId}`,
      status: 'FAILURE',
    });

    return { success: false, message: error.message };
  }
}
