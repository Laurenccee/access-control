import NavBar from '@/components/layouts/NavBar';
import { createClient } from '@/lib/supabase/server';
import { ActivityTracker } from '@/provider/ActivityTracker';
import React from 'react';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <>
      <ActivityTracker userId={user?.id} />
      <NavBar />
      <main className="flex-1 px-8 py-16">
        <div className="mx-auto max-w-screen-2xl">{children}</div>
      </main>
    </>
  );
}
