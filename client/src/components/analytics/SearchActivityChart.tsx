'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/format';
import * as analyticsService from '@/services/analytics.service';
import type { ActivityPoint } from '@/types/analytics';

export function SearchActivityChart() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [days, setDays] = useState<number>(30);
  const [scope, setScope] = useState<'me' | 'all'>('me');
  const [data, setData] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    analyticsService
      .getSearchActivity({ days, scope })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load search activity'))
      .finally(() => setLoading(false));
  }, [days, scope]);

  return (
    <div className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-xs flex flex-col h-[300px]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Search Activity & Latency</h3>

        <div className="flex items-center space-x-2">
          {/* Admin Scope Toggle */}
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

          {/* Days select */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-[11px] px-2 py-0.5 text-gray-700 dark:text-gray-300"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
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
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888888' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#888888' }} tickFormatter={(v) => formatNumber(v)} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#888888' }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line yAxisId="left" type="monotone" dataKey="searches" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} name="Searches" />
              <Line yAxisId="right" type="monotone" dataKey="avgTookMs" stroke="#6b7280" strokeWidth={2} strokeDasharray="3 3" dot={false} isAnimationActive={false} name="Avg Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
