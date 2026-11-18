'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePreferences } from '@/context/PreferencesContext';

type PreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { preferences, updatePreferences } = usePreferences();
  const [error, setError] = useState<string | null>(null);

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setError(null);
    try {
      await updatePreferences({ theme });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    }
  };

  const handlePageSizeChange = async (size: number) => {
    setError(null);
    try {
      await updatePreferences({ defaultPageSize: size as 10 | 25 | 50 | 100 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page size');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="User Preferences"
      onClose={onClose}
      footer={
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2 border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 rounded text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Interface Theme
          </label>
          <select
            value={preferences.theme}
            onChange={(e) =>
              handleThemeChange(e.target.value as 'light' | 'dark' | 'system')
            }
            className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value="system">System (follows OS)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            Theme changes apply immediately and persist across sessions.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Default Page Size
          </label>
          <select
            value={preferences.defaultPageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10 rows per page</option>
            <option value={25}>25 rows per page</option>
            <option value={50}>50 rows per page</option>
            <option value={100}>100 rows per page</option>
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            Sets the initial table page size for new search sessions.
          </p>
        </div>
      </div>
    </Modal>
  );
}
