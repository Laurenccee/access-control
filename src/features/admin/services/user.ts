import { createClient } from '@/lib/supabase/server';

export const UserService = {
  /**
   * TASK 4: View personal profile only
   */
  async getOwnProfile(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'username, role_id, last_seen, created_at, lockout_until, email, deleted_at, is_active',
      )
      .eq('id', userId)
      .single();

    if (error) throw new Error('Unauthorized access to profile.');
    return data;
  },
};
