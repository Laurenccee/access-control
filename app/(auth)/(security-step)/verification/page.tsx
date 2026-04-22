import NavBar from '@/components/layouts/NavBar';
import SecurityQuestionForm from '@/features/auth/components/SecurityQuestionForm';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function VerificationPage() {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // 1. Verify session exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // 2. Fetch the question via Admin Client
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(
      `
    security_questions!inner (
      question_text
    )
  `,
    )
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Supabase Error:', error);
    redirect('/sign-in');
  }

  const questionText = (profile.security_questions as any)?.question_text;

  return (
    // min-h-screen ensures the background covers the whole page
    <div className="flex flex-col flex-1 w-full">
      {/* Navigation Bar: Remove flex-1 so it doesn't grow */}
      <NavBar />

      {/* Content Area: flex-1 takes up the remaining height */}
      <section className="flex-1 flex items-center justify-center p-4">
        <SecurityQuestionForm question={questionText} />
      </section>
    </div>
  );
}
