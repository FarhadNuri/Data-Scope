'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { PreferencesModal } from '../preferences/PreferencesModal';
import type { Role } from '../../types/auth';

function getRoleBadgeClass(role: Role) {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
    case 'ANALYST':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
    case 'VIEWER':
      return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}

export function TopNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  if (!user) return null;

  const isAdminActive = pathname.startsWith('/admin');

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/explorer" className="font-semibold text-sm tracking-tight text-gray-900 dark:text-gray-100">
            DataScope
          </Link>

          <nav className="flex items-center space-x-1">
            <Link
              href="/explorer"
              className={`px-2.5 py-1 rounded ${
                pathname.startsWith('/explorer')
                  ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Explorer
            </Link>

            <Link
              href="/analytics"
              className={`px-2.5 py-1 rounded ${
                pathname.startsWith('/analytics')
                  ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Analytics
            </Link>

            {user.role === 'ADMIN' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`px-2.5 py-1 rounded inline-flex items-center space-x-1 ${
                    isAdminActive
                      ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span>Admin</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {adminMenuOpen && (
                  <div
                    className="absolute left-0 mt-1 w-36 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded py-1 z-50 shadow-none"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <Link
                      href="/admin/users"
                      className="block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Users
                    </Link>
                    <Link
                      href="/admin/datasets"
                      className="block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Datasets
                    </Link>
                    <Link
                      href="/admin/fields"
                      className="block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Fields
                    </Link>
                    <Link
                      href="/admin/permissions"
                      className="block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Permissions
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-gray-600 dark:text-gray-400 font-medium">{user.name}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold border rounded ${getRoleBadgeClass(
              user.role
            )}`}
          >
            {user.role}
          </span>

          <button
            type="button"
            onClick={() => setPreferencesOpen(true)}
            className="px-2 py-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded border border-gray-200 dark:border-gray-800"
          >
            Preferences
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded border border-gray-200 dark:border-gray-800"
          >
            Logout
          </button>
        </div>
      </div>

      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </header>
  );
}
