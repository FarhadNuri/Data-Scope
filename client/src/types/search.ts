// Allowed filter comparison operators supported by the backend
export type Operator =
  | 'eq' | 'neq' | 'contains' | 'startsWith'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'before' | 'after' | 'lastDays' | 'in'
  | 'isEmpty' | 'isNotEmpty';

// A single filter condition row in the search query builder
export type Condition = {
  field: string;
  operator: Operator;
  value?: unknown;
};

// Sort ordering applied to a single column
export type SortItem = {
  field: string;
  direction: 'asc' | 'desc';
};

// The persistent configuration of a search (without pagination parameters)
export type SearchConfig = {
  search?: string;
  searchMode?: 'fulltext' | 'partial';
  logic?: 'AND' | 'OR';
  conditions?: Condition[];
  sort?: SortItem[];
  columns?: string[];
};

// Full search request body dispatched to POST /datasets/:id/records/search
export type SearchRequest = SearchConfig & {
  page: number;
  pageSize: number;
};
