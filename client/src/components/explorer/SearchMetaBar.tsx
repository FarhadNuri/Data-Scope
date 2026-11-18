'use client';

import { Badge } from '@/components/ui/Badge';
import type { PaginationMeta } from '@/types/api';

type SearchMetaBarProps = {
  meta: PaginationMeta | null;
  loading?: boolean;
};

// Response metadata indicator demonstrating execution duration and Redis cache status
export function SearchMetaBar({ meta, loading = false }: SearchMetaBarProps) {
  if (!meta) return null;

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 py-1 border-b border-gray-100 dark:border-gray-900">
      <div className="flex items-center space-x-3">
        <span>
          Total:{' '}
          <strong className="text-gray-800 dark:text-gray-200">
            {meta.totalItems.toLocaleString()}
          </strong>
        </span>

        {meta.tookMs !== undefined && (
          <span>
            Time:{' '}
            <strong className="text-gray-800 dark:text-gray-200">
              {meta.tookMs}ms
            </strong>
          </span>
        )}

        {meta.cached !== undefined && (
          <Badge
            text={meta.cached ? 'Cache: HIT' : 'Cache: MISS'}
            color={meta.cached ? 'green' : 'gray'}
          />
        )}
      </div>

      {loading && (
        <span className="text-[11px] text-gray-400">Updating results...</span>
      )}
    </div>
  );
}
