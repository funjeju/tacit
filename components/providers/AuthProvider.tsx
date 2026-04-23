'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange((user) => setUser(user));
    return unsub;
  }, [setUser]);

  return <>{children}</>;
}
