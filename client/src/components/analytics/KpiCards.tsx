'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatNumber } from '@/lib/format';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as analyticsService from '@/services/analytics.service';
import type { Overview } from '@/types/analytics';

export function KpiCards() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);
    analyticsService
      .getOverview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-xs text-gray-500 italic">
        Platform overview is available to admins.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-800 rounded text-center">
        <Spinner text="Loading platform overview..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) return null;

  const cards = [
    { label: 'Total Datasets', value: data.totalDatasets },
    { label: 'Total Records', value: data.totalRecords },
    { label: 'Total Users', value: data.totalUsers },
    { label: '7-Day Searches', value: data.searchesLast7Days },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded shadow-none text-xs"
        >
          <span className="text-gray-500 dark:text-gray-400 block text-[11px] mb-1">
            {c.label}
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatNumber(c.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
