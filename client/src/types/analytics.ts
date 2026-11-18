// Platform-wide aggregation overview metrics (Admin only)
export type Overview = {
  totalDatasets: number;
  totalRecords: number;
  totalUsers: number;
  searchesLast7Days: number;
};

// Generic label-count pair for categorical summaries
export type CountItem = {
  label: string;
  count: number;
};

// Dataset breakdown by categorical fields
export type DatasetSummary = {
  totalRecords: number;
  byCategory: CountItem[];
  byStatus: CountItem[];
};

// Time-series growth data point
export type GrowthPoint = {
  period: string;
  count: number;
};

// Daily search activity aggregation
export type ActivityPoint = {
  date: string;
  searches: number;
  avgTookMs: number;
};

// Aggregate filter usage tracking
export type TopFilter = {
  field: string;
  operator: string;
  usedCount: number;
};
