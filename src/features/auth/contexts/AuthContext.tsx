'use client';

import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: number | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export default function AuthProvider({
  children,
  initialUser,
  initialRole,
}: {
  children: ReactNode;
  initialUser: User | null;
  initialRole: number | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<number | null>(initialRole);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const supabase = createClient();

  const ssrRoleConsumed = useRef(false);

  useEffect(() => {
    setUser(initialUser);
    setRole(initialRole);
    if (initialUser) setIsLoading(false);
  }, [initialUser, initialRole]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          if (session.user.id !== user?.id) {
            setUser(session.user);
            const { data } = await supabase
              .from('profiles')
              .select('role_id')
              .eq('id', session.user.id)
              .single();
            setRole(data?.role_id || null);
          } else if (!ssrRoleConsumed.current) {
            ssrRoleConsumed.current = true;
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
        }
        setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase, user?.id]);
  return (
    <AuthContext.Provider value={{ user, role, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
