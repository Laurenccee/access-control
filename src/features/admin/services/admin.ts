import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  username: string;
  event_type: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO';
  details?: string;
}

/**
 * SECURITY & DATA SERVICE
 */
export const SecurityService = {
  // --- ADMIN ACTIONS (TASK 4 & 7) ---

  async getAllIdentities() {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null);

    if (error) {
      console.error(
        '[SECURITY CRITICAL] Failed to fetch directory:',
        error.message,
      );
      throw new Error('Access to user directory denied.');
    }
    return data;
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

    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) throw new Error('Deletion protocol failed.');

    // Task 7: Log the deletion
    await this.logEvent({
      username: adminName,
      event_type: 'USER_DELETION',
      status: 'WARNING',
      details: `Deleted user ID: ${userId}`,
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

  // --- LOGGING ENGINE (TASK 7) ---

  async logEvent({ username, event_type, status, details }: AuditLogEntry) {
    const supabase = await createClient();

    // We use .insert().select() to ensure the write was successful
    const { error } = await supabase.from('activity_logs').insert([
      {
        username,
        event_type,
        status,
        details,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) console.error('[AUDIT FAIL]:', error.message);
  },
};
