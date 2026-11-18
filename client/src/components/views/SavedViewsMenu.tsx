'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ShareViewModal } from './ShareViewModal';
import * as viewsService from '@/services/saved-views.service';
import type { SavedView } from '@/types/saved-view';
import type { SearchConfig } from '@/types/search';

type SavedViewsMenuProps = {
  datasetId: string;
  currentConfig: SearchConfig;
  onSelectView: (config: SearchConfig) => void;
};

export function SavedViewsMenu({
  datasetId,
  currentConfig,
  onSelectView,
}: SavedViewsMenuProps) {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [isOpen, setIsOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewToShare, setViewToShare] = useState<SavedView | null>(null);
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchViews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await viewsService.listViews({ datasetId, scope: 'all' });
      setViews(res.data);
    } catch {
      setViews([]);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    if (isOpen) fetchViews();
  }, [isOpen, fetchViews]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleUpdate = async (e: React.MouseEvent, view: SavedView) => {
    e.stopPropagation();
    try {
      const updated = await viewsService.updateView(view.id, { config: currentConfig });
      setViews((prev) => prev.map((v) => (v.id === view.id ? updated : v)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update view');
    }
  };

  const handleDelete = async () => {
    if (!viewToDelete) return;
    try {
      await viewsService.deleteView(viewToDelete.id);
      setViews((prev) => prev.filter((v) => v.id !== viewToDelete.id));
      setViewToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete view');
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        Saved Views ▾
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded shadow-lg z-30 text-xs">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center font-semibold text-gray-700 dark:text-gray-300">
            <span>Saved Views</span>
            <button onClick={fetchViews} className="text-blue-600 dark:text-blue-400 font-normal hover:underline">
              Refresh
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="p-4 text-center"><Spinner /></div>
            ) : views.length === 0 ? (
              <p className="p-4 text-center text-gray-400 italic">No saved views for this dataset</p>
            ) : (
              views.map((view) => {
                const isOwner = user?.id === view.owner?.id;
                return (
                  <div
                    key={view.id}
                    onClick={() => { onSelectView(view.config); setIsOpen(false); }}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex flex-col space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{view.name}</span>
                      {view.isShared && <Badge text="Shared with you" color="blue" />}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>By {view.owner?.name || 'Unknown'}</span>
                      {isOwner && !isViewer && (
                        <div className="flex space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => handleUpdate(e, view)} className="text-blue-600 hover:underline">
                            Update
                          </button>
                          <button onClick={() => { setIsOpen(false); setViewToShare(view); }} className="text-gray-600 hover:underline">
                            Share
                          </button>
                          <button onClick={() => setViewToDelete(view)} className="text-red-500 hover:underline">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {viewToShare && (
        <ShareViewModal isOpen={Boolean(viewToShare)} view={viewToShare} onClose={() => setViewToShare(null)} />
      )}

      <ConfirmDialog
        isOpen={Boolean(viewToDelete)}
        title="Delete Saved View"
        message={`Delete "${viewToDelete?.name}"? This removes the view and all its shares.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setViewToDelete(null)}
      />
    </div>
  );
}
