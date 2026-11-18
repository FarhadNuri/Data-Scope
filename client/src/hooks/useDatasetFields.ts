'use client';

import { useState, useEffect, useCallback } from 'react';
import * as datasetsService from '@/services/datasets.service';
import type { Dataset, DatasetField } from '@/types/dataset';

// System audit timestamp fields available for filtering and sorting
const SYSTEM_FIELDS: DatasetField[] = [
  {
    id: 'system_created_at',
    key: 'created_at',
    label: 'Created at',
    type: 'date',
    isFilterable: true,
    isSortable: true,
    isSearchable: false,
  },
  {
    id: 'system_updated_at',
    key: 'updated_at',
    label: 'Updated at',
    type: 'date',
    isFilterable: true,
    isSortable: true,
    isSearchable: false,
  },
];

export function useDatasetFields(datasetId: string | null) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [fields, setFields] = useState<DatasetField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!datasetId) {
      setDataset(null);
      setFields([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await datasetsService.getDataset(datasetId);
      setDataset(data);
      // Append created_at and updated_at as system date fields
      setFields([...(data.fields || []), ...SYSTEM_FIELDS]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset fields');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    load();
  }, [load]);

  return { dataset, fields, loading, error, reload: load };
}
