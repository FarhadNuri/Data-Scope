import type { SearchConfig } from './search';

// A saved search configuration preset
export type SavedView = {
  id: string;
  name: string;
  datasetId: string;
  config: SearchConfig;
  owner: {
    id: string;
    name: string;
  };
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
};
