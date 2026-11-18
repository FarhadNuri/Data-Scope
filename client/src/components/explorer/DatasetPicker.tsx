'use client';

import type { Dataset } from '@/types/dataset';

type DatasetPickerProps = {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

// Dropdown selector listing accessible datasets and record counts
export function DatasetPicker({
  datasets,
  selectedId,
  onSelect,
  disabled = false,
}: DatasetPickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="dataset-select" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Dataset:
      </label>
      <select
        id="dataset-select"
        value={selectedId || ''}
        disabled={disabled || datasets.length === 0}
        onChange={(e) => onSelect(e.target.value)}
        className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 font-medium"
      >
        {datasets.length === 0 && (
          <option value="" disabled>
            No datasets available
          </option>
        )}
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.totalRecords.toLocaleString()} records)
          </option>
        ))}
      </select>
    </div>
  );
}
