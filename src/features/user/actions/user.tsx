'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUsername(userId: string, newUsername: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/user/${userId}`);
}

export async function softDeleteUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/user/${userId}`);
}
