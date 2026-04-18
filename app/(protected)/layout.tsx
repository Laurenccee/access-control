import { Button } from '@/components/ui/button';
import SignOutButton from '@/features/auth/components/SignOutButton';
import { createClient } from '@/lib/supabase/server';
import { ActivityTracker } from '@/provider/ActivityTracker';
import Link from 'next/link';
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
      <header className="sticky top-0 z-50 w-full border-b-2 bg-card/95 backdrop-blur px-4 md:px-6 py-3">
        <div className="mx-auto flex max-w-screen-2xl justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/verification"
              className="hover:opacity-90 transition-opacity"
            >
              <p className="text-lg md:text-2xl uppercase text-primary">
                Access Control Panel
              </p>
            </Link>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-8 py-16">
        <div className="mx-auto max-w-screen-2xl">{children}</div>
      </main>
      <footer className="w-full bg-accent-foreground border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 My App. All rights reserved.</p>
      </footer>
    </>
  );
}
