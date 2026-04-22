'use client';

import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { signOutAction } from '../actions/auth';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (result?.success === false) {
          toast.error(result.message || 'Logout failed');
          return;
        }
        toast.success('Signed out');
        router.replace('/');
      } catch {
        toast.error('An unexpected error occurred');
      }
    });
  };
  return (
    <Button onClick={handleSignOut} disabled={isPending}>
      {isPending ? 'Signing out...' : 'Sign Out'}
      {isPending ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <LogOut size={22} />
      )}
    </Button>
  );
}
