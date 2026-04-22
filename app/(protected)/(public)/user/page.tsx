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
  const [profileRes, questionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, security_questions(question_text)')
      .eq('id', user.id)
      .single(),
    supabase.from('security_questions').select('id, question_text'),
  ]);

  return (
    <div className="p-6">
      {/* URL remains /user - ID is hidden from user */}
      <ProfileView
        profile={profileRes.data}
        isOwner={true}
        securityQuestions={questionsRes.data || []}
        roles={[]}
      />
    </div>
  );
}
