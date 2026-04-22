import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const supabase = await createClient();

  // 1. Get the session directly from the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, send to login
  if (!user) {
    redirect('/sign-in');
  }

  // 2. Fetch the role from the database (Server-to-Server)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', user.id)
    .single();

  // 3. Perform the redirect
  // Note: Using 0 for Admin as we discussed earlier
  if (profile?.role_id === 0) {
    redirect('/admin-console');
  } else {
    redirect('/user');
  }
}
