// app/profile/[id]/page.tsx
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ProfileView from '@/features/user/components/ProfileView';

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

  // 1. Check if the user is actually an admin
  const isAdmin = user?.user_metadata?.role === 0;

  if (!isAdmin) {
    redirect('/user');
  }

  // 2. Determine if the Admin is looking at their OWN record
  const isOwner = user?.id === id;

  // 3. Admin can fetch any profile by ID
  const { data: targetProfile, error } = await supabaseAdmin
    .from('profiles')
    .select(
      `
    *,
    security_questions!inner (
      question_text
    )
  `,
    )
    .eq('id', id)
    .single();

  console.log('Fetched profile for ID:', id, targetProfile);
  if (error || !targetProfile) {
    return notFound();
  }

  return (
    <div className="p-6">
      {/* 4. Pass the dynamic isOwner value */}
      <ProfileView profile={targetProfile} isOwner={isOwner} />
    </div>
  );
}
