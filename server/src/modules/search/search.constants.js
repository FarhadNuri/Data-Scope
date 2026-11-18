// Search configuration limits and allowed operator mappings

export const MAX_CONDITIONS = 10;
export const MAX_SORT_COLUMNS = 3;
export const MAX_SEARCH_LENGTH = 200;
export const MAX_PAGE_SIZE = 100;
export const MAX_OFFSET = 10000;
export const MAX_IN_VALUES = 20;
export const MIN_PARTIAL_SEARCH_LENGTH = 3;

// Role-based restrictions for Viewer accounts
export const VIEWER_ALLOWED_OPERATORS = ['eq', 'contains'];
export const VIEWER_MAX_CONDITIONS = 3;

// Universal operators applicable to any field type
export const UNIVERSAL_OPERATORS = ['isEmpty', 'isNotEmpty'];

// Allowed operators by field type (per docs/02 Part D7)
export const OPERATORS_BY_TYPE = {
  text: ['eq', 'neq', 'contains', 'startsWith', ...UNIVERSAL_OPERATORS],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', ...UNIVERSAL_OPERATORS],
  date: ['eq', 'before', 'after', 'between', 'lastDays', ...UNIVERSAL_OPERATORS],
  select: ['eq', 'neq', 'in', ...UNIVERSAL_OPERATORS],
  boolean: ['eq', ...UNIVERSAL_OPERATORS],
};

// Built-in system columns that exist physically on dataset_records table
export const SYSTEM_FIELDS = {
  created_at: { key: 'created_at', type: 'date', isFilterable: true, isSortable: true },
  updated_at: { key: 'updated_at', type: 'date', isFilterable: true, isSortable: true },
};
