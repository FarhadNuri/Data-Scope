'use client';

import type { SortItem } from '@/types/search';
import type { DatasetField } from '@/types/dataset';

type SortSummaryProps = {
  sort: SortItem[];
  fields: DatasetField[];
  onClearSort: () => void;
};

// Summary indicator displaying active multi-column sort directions
export function SortSummary({ sort, fields, onClearSort }: SortSummaryProps) {
  if (sort.length === 0) return null;

  const fieldLabelMap = new Map(fields.map((f) => [f.key, f.label || f.key]));

  const summaryText = sort
    .map((s) => {
      const label = fieldLabelMap.get(s.field) || s.field;
      const arrow = s.direction === 'asc' ? '↑' : '↓';
      return `${label} ${arrow}`;
    })
    .join(', ');

  return (
    <div className="flex items-center justify-between py-1 text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center space-x-2">
        <span>
          Sorted by: <strong className="text-gray-900 dark:text-gray-100">{summaryText}</strong>
        </span>
        {sort.length >= 3 && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            (Max 3 sort columns)
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onClearSort}
        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
      >
        Clear sort
      </button>
    </div>
  );
}
