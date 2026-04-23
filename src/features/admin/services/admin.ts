import { logActivity } from '@/lib/helper/auth';
import { createAdminClient, createClient } from '@/lib/supabase/server';

/**
 * SECURITY & DATA SERVICE
 */
export const SecurityService = {
  // --- ADMIN ACTIONS (TASK 4 & 7) ---

  async getAllIdentities({ limit = 5, offset = 0 } = {}) {
    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(
        '[SECURITY CRITICAL] Failed to fetch directory:',
        error.message,
      );
      throw new Error('Access to user directory denied.');
    }
    return { users: data, total: count ?? 0 };
  },

  async getSystemLogs() {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new Error('Could not retrieve audit trail.');
    return data ? data.reverse() : [];
  },

  async revokeAccess(userId: string, adminName: string) {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) throw new Error('Deletion protocol failed.');

    // Task 7: Log the deletion
    await logActivity(supabaseAdmin, {
      userId: userId,
      username: adminName,
      event: 'USER_DELETION',
      status: 'SUCCESS',
    });

    return { success: true };
  },

  // --- USER ACTIONS (TASK 4) ---

  async getPersonalProfile(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('username, role_id')
      .eq('id', userId)
      .single();

    if (error || !data) throw new Error('Identity verification failed.');
    return data;
  },
};
