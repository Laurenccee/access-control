'use client';

import { useContext } from 'react';
import { ROLES } from '@/lib/constant/roles';
import { AuthContext } from '@/features/auth/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  const { user, role, isLoading } = context;

  const isAuthenticated = !!user;
  // Use ROLES constant but ensure we handle potential nulls
  const isAdmin = isAuthenticated && role === ROLES.ADMIN;
  const isUser = isAuthenticated && role === ROLES.USER;

  return {
    user,
    role,
    isLoading, // Extremely important for redirects
    isAuthenticated,
    isAdmin,
    isUser,
  };
}
