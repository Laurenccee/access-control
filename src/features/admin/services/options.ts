import { createClient } from '@/lib/supabase/server';

export const SelectionsOptions = {
  async getAllSecurityOptions() {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('security_questions')
      .select('id, question_text');

    if (error) {
      console.error(
        '[SECURITY CRITICAL] Failed to fetch security questions:',
        error.message,
      );
      throw new Error('Access to security questions denied.');
    }
    return data;
  },
  async getAllRoles() {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('roles')
      .select('id, role_name');

    if (error) {
      console.error(
        '[SECURITY CRITICAL] Failed to fetch roles:',
        error.message,
      );
      throw new Error('Access to roles denied.');
    }
    return data;
  },
};
