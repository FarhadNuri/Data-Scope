'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types/auth';

type AuthGuardProps = {
  children: React.ReactNode;
  roles?: Role[];
};

// Route protection component checking login state and role permissions
export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Prevent flash of protected UI while session check is in-flight
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  // Not authenticated; redirect is triggered in useEffect
  if (!user) {
    return null;
  }

  // Role check: if the user's role is not allowed, display access denied message
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 rounded text-sm text-center">
        You do not have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
