import SetupProfileForm from '@/features/auth/components/SetupProfileForm';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import React from 'react';

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  const user = await supabase.auth.getUser();

  // 3. Admin can fetch any profile by ID
  const [questionsRes] = await Promise.all([
    supabaseAdmin.from('security_questions').select('id, question_text'),
  ]);
  return (
    <div>
      <SetupProfileForm securityQuestions={questionsRes.data || []} />
    </div>
  );
}
