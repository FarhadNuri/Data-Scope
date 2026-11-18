'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

// Demo credentials constant per docs/06 E1
const DEMO_USERS = [
  { label: 'Admin', email: 'admin@datascope.dev', password: 'Password123!' },
  { label: 'Analyst', email: 'analyst@datascope.dev', password: 'Password123!' },
  { label: 'Viewer', email: 'viewer@datascope.dev', password: 'Password123!' },
];

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/explorer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoPass);
      router.replace('/explorer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded p-6 shadow-none">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sign in to DataScope</h1>
        <p className="text-xs text-gray-500 mt-1">Internal data exploration & analytics console</p>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 rounded text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="name@datascope.dev"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-1.5 px-3 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-none"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">One-click demo logins:</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.label}
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin(demo.email, demo.password)}
              className="py-1 px-2 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-50"
            >
              {demo.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 text-center">
          Demo accounts with pre-seeded permissions
        </p>
      </div>
    </div>
  );
}
