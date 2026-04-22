import { ThemeToggle } from '@/components/shared/ThemeToggle';
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content expands to push footer down */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
