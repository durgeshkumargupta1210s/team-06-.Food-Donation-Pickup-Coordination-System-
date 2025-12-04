'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
        Loading your session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Sign in to continue</p>
        <button
          type="button"
          onClick={signIn}
          className="rounded-full bg-emerald-600 px-6 py-3 text-white shadow-lg transition hover:bg-emerald-500"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
