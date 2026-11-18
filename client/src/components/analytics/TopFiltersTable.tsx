'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/format';
import * as analyticsService from '@/services/analytics.service';
import type { TopFilter } from '@/types/analytics';

type TopFiltersTableProps = {
  datasetId?: string;
};

export function TopFiltersTable({ datasetId }: TopFiltersTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [scope, setScope] = useState<'me' | 'all'>('me');
  const [data, setData] = useState<TopFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    analyticsService
      .getTopFilters({ datasetId, limit: 10, scope })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load top filters'))
      .finally(() => setLoading(false));
  }, [datasetId, scope]);

  return (
    <div className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-xs flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Top Filter Conditions</h3>

        {isAdmin && (
          <div className="flex border border-gray-200 dark:border-gray-800 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setScope('me')}
              className={`px-2 py-0.5 text-[11px] font-medium ${
                scope === 'me'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
              }`}
            >
              Me
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2 py-0.5 text-[11px] font-medium ${
                scope === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
              }`}
            >
              All users
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState text="No data yet" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300">Field</th>
                <th className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300">Operator</th>
                <th className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300 text-right">Usage Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-gray-900 dark:text-gray-100">
                    {item.field}
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge text={item.operator} color="gray" />
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300 font-medium">
                    {formatNumber(item.usedCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
