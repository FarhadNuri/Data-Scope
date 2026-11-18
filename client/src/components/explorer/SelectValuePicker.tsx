'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import * as datasetsService from '@/services/datasets.service';
import type { Operator } from '@/types/search';

type SelectValuePickerProps = {
  datasetId: string;
  fieldId: string;
  operator: Operator;
  value: unknown;
  onChange: (newValue: unknown) => void;
  disabled?: boolean;
};

export function SelectValuePicker({
  datasetId,
  fieldId,
  operator,
  value,
  onChange,
  disabled = false,
}: SelectValuePickerProps) {
  const [filterText, setFilterText] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedFilter = useDebounce(filterText, 350);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    datasetsService
      .getFieldValues(datasetId, fieldId, debouncedFilter.trim() || undefined, 50)
      .then((data) => {
        if (!cancelled) setOptions(data || []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [datasetId, fieldId, debouncedFilter]);

  // Operator 'in': multi-select checkbox list (capped at max 20 values)
  if (operator === 'in') {
    const selectedList = Array.isArray(value) ? (value as string[]) : [];

    const handleToggle = (opt: string) => {
      if (selectedList.includes(opt)) {
        onChange(selectedList.filter((v) => v !== opt));
      } else {
        if (selectedList.length >= 20) return;
        onChange([...selectedList, opt]);
      }
    };

    return (
      <div className="w-full max-w-xs space-y-1">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter values..."
          disabled={disabled}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        />

        <div className="border border-gray-300 dark:border-gray-700 rounded p-1.5 max-h-32 overflow-y-auto bg-white dark:bg-gray-950 space-y-1 text-xs">
          {loading && <p className="text-[11px] text-gray-400 p-1">Loading...</p>}
          {!loading && options.length === 0 && (
            <p className="text-[11px] text-gray-400 p-1">No values match</p>
          )}
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center space-x-2 px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer text-gray-800 dark:text-gray-200"
            >
              <input
                type="checkbox"
                checked={selectedList.includes(opt)}
                onChange={() => handleToggle(opt)}
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-0"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>

        <p className="text-[10px] text-gray-500">
          Selected: {selectedList.length}/20
        </p>
      </div>
    );
  }

  // Operator 'eq' or 'neq': single select with filter input
  return (
    <div className="flex items-center space-x-1.5 w-full max-w-xs">
      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Narrow options..."
        disabled={disabled}
        className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      />
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      >
        <option value="" disabled>
          {loading ? 'Loading...' : 'Select value...'}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
