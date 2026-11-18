'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-md w-full border border-gray-200 dark:border-gray-800 p-8 rounded text-center bg-gray-50 dark:bg-gray-900">
        <h1 className="text-xl font-bold mb-2">404 — Page Not Found</h1>
        <p className="text-xs text-gray-500 mb-6">
          The requested page could not be found.
        </p>
        <Link
          href="/explorer"
          className="inline-block px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Return to Explorer
        </Link>
      </div>
    </main>
  );
}
