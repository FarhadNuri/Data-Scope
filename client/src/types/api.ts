// Metadata returned alongside paginated list responses and search results
export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  tookMs?: number;   // search only
  cached?: boolean;  // search only
};
