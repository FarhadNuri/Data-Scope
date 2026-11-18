'use client';

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
import type { CountItem } from '@/types/analytics';

type DistributionChartProps = {
  title: string;
  data: CountItem[];
  loading?: boolean;
  error?: string | null;
};

export function DistributionChart({
  title,
  data,
  loading = false,
  error,
}: DistributionChartProps) {
  return (
    <div className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-xs flex flex-col h-[280px]">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>

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
                dataKey="label"
                tick={{ fontSize: 10, fill: '#888888' }}
                interval={0}
                angle={-15}
                textAnchor="end"
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
                formatter={(val: unknown) => [formatNumber(Number(val) || 0), 'Records']}
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
