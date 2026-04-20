'use client';

import { useContext } from 'react';
import AuthContext from '@/features/auth/contexts/AuthContext';
import { ROLES } from '@/lib/constant/roles';

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. Check your Root Layout.',
    );
  }

  const isAuthenticated = context.user !== null;
  const isAdmin = context.role === ROLES.ADMIN && isAuthenticated;
  const isUser = context.role === ROLES.USER && isAuthenticated;

  return {
    ...context,
    isAuthenticated,
    isAdmin,
    isUser,
  };
}
