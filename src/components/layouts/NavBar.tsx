'use client';

import SignOutButton from '@/features/auth/components/SignOutButton';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ThemeToggle } from '../shared/ThemeToggle';

export default function NavBar() {
  // Gina Check if ang user hay Admin
  const { isAdmin } = useAuth();

  // Gina Check if current page is the verification page to conditionally render the title
  const isVerificationPage =
    typeof window !== 'undefined' &&
    window.location.pathname === '/verification';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 bg-card/95 backdrop-blur px-4 md:px-6 py-3">
        <div className="mx-auto flex max-w-screen-2xl justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Pag may user nga wala pa na verify, hindi ipakita ang link sa verification page */}
            {!isVerificationPage && (
              <Link
                href="/verification"
                className="hover:opacity-90 transition-opacity"
              >
                <p className="text-lg md:text-2xl uppercase text-primary">
                  {isAdmin ? 'Admin Access Control' : 'User Dashboard'}
                </p>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Darkmode or Lightmode Toggle */}
            <ThemeToggle />
            {/* Sign Out Button */}
            <SignOutButton />
          </div>
        </div>
      </header>
    </>
  );
}
