// Stored user preferences for UI presentation
export type Preferences = {
  theme: 'light' | 'dark' | 'system';
  defaultPageSize: 10 | 25 | 50 | 100;
  visibleColumns: Record<string, string[]>; // key = dataset id
};
