'use client';

import { useState, useEffect } from 'react';
import { timeAgo, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as recordsService from '@/services/records.service';
import type { RecordHistoryItem } from '@/types/record';
import type { PaginationMeta } from '@/types/api';

type RecordHistoryTabProps = {
  datasetId: string;
  recordId: string;
};

function formatVal(v: unknown): string {
  if (v === null || v === undefined || v === '') return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

export function RecordHistoryTab({ datasetId, recordId }: RecordHistoryTabProps) {
  const [items, setItems] = useState<RecordHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    recordsService
      .getHistory(datasetId, recordId, 1, 10)
      .then((res) => {
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => setLoading(false));
  }, [datasetId, recordId]);

  const handleLoadMore = async () => {
    if (!meta || page >= meta.totalPages || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await recordsService.getHistory(datasetId, recordId, nextPage, 10);
      setItems((prev) => [...prev, ...res.data]);
      setMeta(res.meta);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more history');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="py-6"><Spinner /></div>;
  if (error) return <ErrorMessage message={error} />;
  if (items.length === 0) return <EmptyState text="No audit history for this record" />;

  const canLoadMore = meta ? page < meta.totalPages : false;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-gray-200 dark:border-gray-800 rounded bg-gray-50/50 dark:bg-gray-950/50 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {item.changedBy?.name || 'System / Anonymous'}
              </span>
              <span title={formatDateTime(item.changedAt)}>
                {timeAgo(item.changedAt)}
              </span>
            </div>

            <div className="space-y-1 pl-1 border-l-2 border-gray-300 dark:border-gray-700">
              {item.changes.map((change, idx) => (
                <div key={idx} className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{change.field}</span>
                  {': '}
                  <span className="text-red-500 line-through">{formatVal(change.oldValue)}</span>
                  {' → '}
                  <span className="text-green-600 dark:text-green-400">{formatVal(change.newValue)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {canLoadMore && (
        <div className="pt-2 text-center">
          <Button
            variant="secondary"
            size="sm"
            loading={loadingMore}
            onClick={handleLoadMore}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
