'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../../components/layout/LoginForm';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect straight to the Explorer workspace
  useEffect(() => {
    if (!loading && user) {
      router.replace('/explorer');
    }
  }, [loading, user, router]);

  if (loading || user) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <LoginForm />
    </main>
  );
}
