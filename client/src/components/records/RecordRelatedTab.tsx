'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Badge } from '@/components/ui/Badge';
import * as recordsService from '@/services/records.service';
import type { RelatedRecord } from '@/types/record';
import type { PaginationMeta } from '@/types/api';

type RecordRelatedTabProps = {
  datasetId: string;
  recordId: string;
};

export function RecordRelatedTab({ datasetId, recordId }: RecordRelatedTabProps) {
  const [items, setItems] = useState<RelatedRecord[]>([]);
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
      .getRelated(datasetId, recordId, 1, 10)
      .then((res) => {
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load related records');
      })
      .finally(() => setLoading(false));
  }, [datasetId, recordId]);

  const handleLoadMore = async () => {
    if (!meta || page >= meta.totalPages || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await recordsService.getRelated(datasetId, recordId, nextPage, 10);
      setItems((prev) => [...prev, ...res.data]);
      setMeta(res.meta);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more relations');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="py-6"><Spinner /></div>;
  if (error) return <ErrorMessage message={error} />;
  if (items.length === 0) return <EmptyState text="No related records found" />;

  const outgoing = items.filter((r) => r.direction === 'outgoing');
  const incoming = items.filter((r) => r.direction === 'incoming');
  const canLoadMore = meta ? page < meta.totalPages : false;

  const renderList = (list: RelatedRecord[], emptyLabel: string) => {
    if (list.length === 0) {
      return <p className="text-gray-400 dark:text-gray-600 text-xs italic">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-2">
        {list.map((item, idx) => {
          const firstThree = Object.entries(item.record.data || {})
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v !== null && v !== undefined ? String(v) : '—'}`)
            .join(' · ');

          return (
            <div
              key={item.record.id + idx}
              className="p-2.5 border border-gray-200 dark:border-gray-800 rounded bg-gray-50/50 dark:bg-gray-950/50 text-xs flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <Badge text={item.relationType} color="blue" />
                <span className="font-mono text-[10px] text-gray-500 truncate">
                  ID: {item.record.id}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 truncate">
                {firstThree || 'No attributes'}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-xs text-gray-700 dark:text-gray-300">Outgoing Relations</h3>
        {renderList(outgoing, 'No outgoing relations')}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-xs text-gray-700 dark:text-gray-300">Incoming Relations</h3>
        {renderList(incoming, 'No incoming relations')}
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
