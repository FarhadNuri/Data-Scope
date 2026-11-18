// A dataset data record containing dynamic JSON payload in `data`
export type DataRecord = {
  id: string;
  datasetId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

// Represents a change made to a single field on a record
export type RecordChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

// An entry in the record audit history log
export type RecordHistoryItem = {
  id: string;
  changedBy: { id: string; name: string } | null;
  changedAt: string;
  changes: RecordChange[];
};

// A related record linked through the record relationships table
export type RelatedRecord = {
  relationType: string;
  direction: 'outgoing' | 'incoming';
  record: {
    id: string;
    datasetId: string;
    data: Record<string, unknown>;
  };
};
