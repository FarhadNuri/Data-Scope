'use client';

import { useState } from 'react';

export type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  maxOffset?: number;
  className?: string;
};

// Data table pagination bar with page size selection and MAX_OFFSET guard
export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  maxOffset = 10000,
  className = '',
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState('');

  // The next page would request offset = page * pageSize.
  // The server limits offset to MAX_OFFSET (10,000).
  const nextOffsetExceeded = page * pageSize >= maxOffset;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages && !nextOffsetExceeded;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages && (p - 1) * pageSize < maxOffset) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <span>
            Page <strong className="text-gray-900 dark:text-gray-100">{totalPages > 0 ? page : 0}</strong> of{' '}
            <strong className="text-gray-900 dark:text-gray-100">{totalPages}</strong>
          </span>
          <span className="text-gray-400">({totalItems.toLocaleString()} records)</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-xs"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleJump} className="flex items-center space-x-1">
            <span className="text-gray-500">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder="#"
              className="w-12 px-1.5 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-xs"
            />
            <button
              type="submit"
              disabled={!jumpPage}
              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 disabled:opacity-40"
            >
              Go
            </button>
          </form>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => onPageChange(page - 1)}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => onPageChange(page + 1)}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {page < totalPages && nextOffsetExceeded && (
        <div className="p-2 border border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 rounded text-[11px]">
          You reached the 10,000 record limit. Narrow your filters to see more.
        </div>
      )}
    </div>
  );
}
