'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/format';
import * as analyticsService from '@/services/analytics.service';
import type { GrowthPoint } from '@/types/analytics';

type GrowthChartProps = {
  datasetId: string;
};

export function GrowthChart({ datasetId }: GrowthChartProps) {
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('month');
  const [data, setData] = useState<GrowthPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    analyticsService
      .getGrowth(datasetId, { interval })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load growth data'))
      .finally(() => setLoading(false));
  }, [datasetId, interval]);

  return (
    <div className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-xs flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Record Creation Growth</h3>
        <div className="flex border border-gray-200 dark:border-gray-800 rounded overflow-hidden">
          {(['day', 'week', 'month'] as const).map((int) => (
            <button
              key={int}
              type="button"
              onClick={() => setInterval(int)}
              className={`px-2 py-0.5 text-[11px] font-medium capitalize ${
                interval === int
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              {int}
            </button>
          ))}
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
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: '#888888' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888888' }}
                tickFormatter={(v) => formatNumber(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
                formatter={(val: unknown) => [formatNumber(Number(val) || 0), 'Records Created']}
              />
              <Bar
                dataKey="count"
                fill="#2563eb"
                isAnimationActive={false}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
