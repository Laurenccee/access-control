'use client';

import ResetProfileForm from '@/features/auth/components/ResetProfileForm';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center w-full p-4">
      <ResetProfileForm />
    </div>
  );
}
