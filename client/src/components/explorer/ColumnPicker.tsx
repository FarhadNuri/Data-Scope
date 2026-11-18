'use client';

import { useState, useRef, useEffect } from 'react';
import type { DatasetField } from '@/types/dataset';

type ColumnPickerProps = {
  fields: DatasetField[];
  visibleColumns: string[];
  onChange: (newVisible: string[]) => void;
  onReset: () => void;
};

export function ColumnPicker({
  fields,
  visibleColumns,
  onChange,
  onReset,
}: ColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleToggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      // Must keep at least one column visible
      if (visibleColumns.length <= 1) return;
      onChange(visibleColumns.filter((k) => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-1"
      >
        <span>Columns ({visibleColumns.length}/{fields.length})</span>
        <span className="text-[10px]">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded p-2 z-40 shadow-none text-xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Visible Columns</span>
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {fields.map((f) => {
              const isChecked = visibleColumns.includes(f.key);
              const isOnlyOne = isChecked && visibleColumns.length <= 1;

              return (
                <label
                  key={f.key}
                  className={`flex items-center space-x-2 px-1 py-0.5 rounded select-none ${
                    isOnlyOne ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isOnlyOne}
                    onChange={() => handleToggle(f.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-0"
                  />
                  <span className="truncate text-gray-800 dark:text-gray-200">{f.label || f.key}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
