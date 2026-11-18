'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { TopNav } from '@/components/layout/TopNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <TopNav />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4">{children}</main>
      </div>
    </AuthGuard>
  );
}
