// app/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileView from '@/features/user/components/ProfileView';

export default async function UserProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Fetch only the logged-in user's data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-6">
      {/* URL remains /user - ID is hidden from user */}
      <ProfileView profile={profile} isOwner={true} />
    </div>
  );
}
