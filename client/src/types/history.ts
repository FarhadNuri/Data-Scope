import type { SearchConfig } from './search';

// A single distinct query execution logged in the user's search history
export type SearchHistoryItem = {
  id: string;
  datasetId: string;
  datasetName: string;
  config: SearchConfig;
  resultCount: number;
  tookMs: number;
  createdAt: string;
};
