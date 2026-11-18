'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spinner } from '@/components/ui/Spinner';
import { SharedUsersList } from './SharedUsersList';
import * as viewsService from '@/services/saved-views.service';
import * as usersService from '@/services/users.service';
import type { SavedView } from '@/types/saved-view';
import type { AdminUser } from '@/types/auth';

type ShareViewModalProps = {
  isOpen: boolean;
  view: SavedView;
  onClose: () => void;
};

export function ShareViewModal({ isOpen, view, onClose }: ShareViewModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [sharedWith, setSharedWith] = useState<{ id: string; name: string; email: string }[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [analystInput, setAnalystInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    viewsService
      .shareView(view.id, [])
      .then((res) => setSharedWith(res.sharedWith || []))
      .catch(() => setSharedWith([]));

    if (isAdmin) {
      usersService
        .listUsers({ pageSize: 100 })
        .then((res) => setAllUsers(res.data.filter((u) => u.id !== user?.id)))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isOpen, view.id, isAdmin, user?.id]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const ids = isAdmin
      ? selectedUserIds
      : analystInput.split(',').map((s) => s.trim()).filter(Boolean);

    if (ids.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await viewsService.shareView(view.id, ids);
      setSharedWith(res.sharedWith || []);
      setSelectedUserIds([]);
      setAnalystInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share view');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnshare = async (targetUserId: string) => {
    try {
      await viewsService.unshareView(view.id, targetUserId);
      setSharedWith((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share');
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`Share View: "${view.name}"`}
      onClose={onClose}
      footer={<Button variant="secondary" size="sm" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4 text-xs">
        {error && <ErrorMessage message={error} />}
        {loading ? (
          <div className="py-4 text-center"><Spinner /></div>
        ) : (
          <>
            {isAdmin ? (
              <div className="space-y-2">
                <label className="font-semibold text-gray-700 dark:text-gray-300 block">
                  Select users to share with:
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded p-2 divide-y divide-gray-100 dark:divide-gray-800">
                  {allUsers.map((u) => (
                    <label key={u.id} className="flex items-center space-x-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{u.name}</span>
                      <span className="text-gray-500 text-[11px]">({u.email})</span>
                    </label>
                  ))}
                </div>
                <Button variant="primary" size="sm" onClick={handleShare} loading={submitting} disabled={selectedUserIds.length === 0}>
                  Share View
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  label="Target User IDs (comma separated)"
                  placeholder="e.g. b8c41bf6-..., 3a1f8c02-..."
                  value={analystInput}
                  onChange={(e) => setAnalystInput(e.target.value)}
                />
                <p className="text-[11px] text-gray-500">Ask an admin for the user ID.</p>
                <Button variant="primary" size="sm" onClick={handleShare} loading={submitting} disabled={!analystInput.trim()}>
                  Share View
                </Button>
              </div>
            )}

            <SharedUsersList sharedWith={sharedWith} onUnshare={handleUnshare} />
          </>
        )}
      </div>
    </Modal>
  );
}
