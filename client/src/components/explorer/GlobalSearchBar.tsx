'use client';

type GlobalSearchBarProps = {
  search: string;
  searchMode: 'fulltext' | 'partial';
  onSearchChange: (value: string) => void;
  onModeChange: (mode: 'fulltext' | 'partial') => void;
  disabled?: boolean;
};

// Global search input with fulltext vs trigram mode toggle and character limit guards
export function GlobalSearchBar({
  search,
  searchMode,
  onSearchChange,
  onModeChange,
  disabled = false,
}: GlobalSearchBarProps) {
  const showPartialHint =
    searchMode === 'partial' &&
    search.trim().length > 0 &&
    search.trim().length < 3;

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
            maxLength={200}
            placeholder={
              searchMode === 'fulltext'
                ? 'Search records (full-text index)...'
                : 'Partial match search (trigram contains)...'
            }
            className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={searchMode}
          onChange={(e) => onModeChange(e.target.value as 'fulltext' | 'partial')}
          disabled={disabled}
          className="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
        >
          <option value="fulltext">Full-text</option>
          <option value="partial">Partial (contains)</option>
        </select>
      </div>

      {showPartialHint && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Type at least 3 characters for partial matching.
        </p>
      )}
    </div>
  );
}
