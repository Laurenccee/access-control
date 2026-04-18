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

      <footer className="w-full bg-accent-foreground border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 My App. All rights reserved.</p>
      </footer>
    </div>
  );
}
