'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { describeConfig } from '@/lib/describe-config';
import { timeAgo, formatNumber } from '@/lib/format';
import * as historyService from '@/services/search-history.service';
import type { SearchHistoryItem } from '@/types/history';
import type { SearchConfig } from '@/types/search';

type RecentSearchesProps = {
  datasetId: string;
  onSelectHistory: (config: SearchConfig) => void;
  searchTrigger?: number;
};

export function RecentSearches({
  datasetId,
  onSelectHistory,
  searchTrigger,
}: RecentSearchesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyService.listHistory({ datasetId, pageSize: 20 });
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  // When a new search finishes in Explorer, refresh history after 500ms delay
  useEffect(() => {
    if (searchTrigger && searchTrigger > 0 && isOpen) {
      const timer = setTimeout(fetchHistory, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTrigger, isOpen, fetchHistory]);

  // Close popover on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleHideOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await historyService.hideOne(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Ignore hide failures
    }
  };

  const handleClearAll = async () => {
    try {
      await historyService.hideAll();
      setItems([]);
      setIsConfirmClearOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        Recent
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded shadow-lg z-30 text-xs">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center font-semibold text-gray-700 dark:text-gray-300">
            <span>Recent Searches</span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(true)}
                className="text-red-500 hover:underline font-normal text-[11px]"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {loading && items.length === 0 ? (
              <div className="p-4 text-center"><Spinner /></div>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-gray-400 italic">No recent searches</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { onSelectHistory(item.config); setIsOpen(false); }}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex-1 pr-2 overflow-hidden">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {describeConfig(item.config)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {formatNumber(item.resultCount)} results · {item.tookMs}ms · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleHideOne(e, item.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1 text-sm leading-none"
                    title="Remove from history"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear Search History"
        message="Are you sure you want to clear your search history? This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={handleClearAll}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
}
