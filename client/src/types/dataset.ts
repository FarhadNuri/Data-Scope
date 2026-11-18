// Supported field types for dataset schema fields
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

// A single schema field definition belonging to a dataset
export type DatasetField = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  isFilterable: boolean;
  isSortable: boolean;
  isSearchable: boolean;
};

// Dataset metadata record
export type Dataset = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  dataSource: string;
  totalRecords: number;
  createdAt: string;
  updatedAt: string;
};

// Dataset with its associated schema fields
export type DatasetWithFields = Dataset & {
  fields: DatasetField[];
};

// Explicit dataset permission levels
export type PermissionLevel = 'view' | 'manage';

// User permission assigned to a specific dataset
export type DatasetPermission = {
  userId: string;
  name?: string;
  email?: string;
  level: PermissionLevel;
};
