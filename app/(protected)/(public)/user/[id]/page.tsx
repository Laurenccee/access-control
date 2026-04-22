// app/profile/[id]/page.tsx
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ProfileView from '@/features/user/components/ProfileView';
import { is } from 'zod/v4/locales';

export default async function AdminUserLookup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.user_metadata?.role !== 0) redirect('/user');

  const isOwner = user?.id === id;

  // 3. Admin can fetch any profile by ID
  const [profileRes, questionsRes, rolesRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('*, security_questions(question_text)')
      .eq('id', id)
      .single(),
    supabaseAdmin.from('security_questions').select('id, question_text'),
    supabaseAdmin.from('roles').select('id, role_name'),
  ]);

  if (profileRes.error || !profileRes.data) return notFound();

  return (
    <div className="p-6">
      {/* 4. Pass the dynamic isOwner value */}
      <ProfileView
        profile={profileRes.data}
        isOwner={isOwner}
        securityQuestions={questionsRes.data || []}
        roles={(rolesRes.data as any) || []}
      />
    </div>
  );
}
