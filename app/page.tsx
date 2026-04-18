import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const userRole = user.user_metadata?.role;

  if (userRole === 0) {
    redirect('/admin-console');
  } else {
    redirect('/user');
  }
}
