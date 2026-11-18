'use client';

import { formatNumber, formatDate, formatDateTime, truncate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DatasetField } from '@/types/dataset';
import type { DataRecord } from '@/types/record';
import type { SortItem } from '@/types/search';

type DataTableProps = {
  fields: DatasetField[];
  rows: DataRecord[];
  sort: SortItem[];
  onSortToggle: (fieldKey: string) => void;
  onRowClick?: (record: DataRecord) => void;
  loading?: boolean;
  visibleColumns?: string[];
};

function renderCellValue(field: DatasetField, record: DataRecord) {
  // System fields are stored on the root record object
  let raw: unknown;
  if (field.key === 'created_at') raw = record.createdAt;
  else if (field.key === 'updated_at') raw = record.updatedAt;
  else raw = record.data?.[field.key];

  if (raw === null || raw === undefined || raw === '') {
    return <span className="text-gray-400 dark:text-gray-600">—</span>;
  }

  switch (field.type) {
    case 'number':
      return typeof raw === 'number' ? formatNumber(raw) : String(raw);
    case 'date':
      return typeof raw === 'string'
        ? field.key.includes('_at')
          ? formatDateTime(raw)
          : formatDate(raw)
        : String(raw);
    case 'boolean':
      return raw ? 'Yes' : 'No';
    case 'text':
    case 'select':
    default:
      return truncate(String(raw), 45);
  }
}

export function DataTable({
  fields,
  rows,
  sort,
  onSortToggle,
  onRowClick,
  loading = false,
  visibleColumns,
}: DataTableProps) {
  const displayFields =
    visibleColumns && visibleColumns.length > 0
      ? fields.filter((f) => visibleColumns.includes(f.key))
      : fields;

  if (rows.length === 0 && !loading) {
    return <EmptyState text="No records match your search" />;
  }

  const sortMap = new Map(sort.map((s, idx) => [s.field, { dir: s.direction, index: idx + 1 }]));

  return (
    <div className={`overflow-x-auto border border-gray-200 dark:border-gray-800 rounded ${loading ? 'opacity-60' : ''}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 select-none">
          <tr>
            {displayFields.map((f) => {
              const sortInfo = sortMap.get(f.key);
              return (
                <th
                  key={f.id || f.key}
                  onClick={() => f.isSortable && onSortToggle(f.key)}
                  className={`px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap ${
                    f.isSortable ? 'cursor-pointer hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{f.label || f.key}</span>
                    {sortInfo && (
                      <span className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                        {sortInfo.dir === 'asc' ? '▲' : '▼'}
                        {sort.length > 1 && <span>{sortInfo.index}</span>}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {displayFields.map((f) => (
                <td
                  key={f.id || f.key}
                  className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap"
                >
                  {renderCellValue(f, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
