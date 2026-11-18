'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { isConditionComplete, serializeCondition } from '@/components/explorer/operators';
import * as recordsService from '@/services/records.service';
import type { DataRecord } from '@/types/record';
import type { SearchRequest } from '@/types/search';
import type { PaginationMeta } from '@/types/api';
import type { DatasetField } from '@/types/dataset';
import type { SearchState } from './useSearchState';

export function useSearch(
  datasetId: string | null,
  fields: DatasetField[],
  state: SearchState
) {
  const [rows, setRows] = useState<DataRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Debounce free-text search input by 350ms
  const debouncedSearch = useDebounce(state.search, 350);

  // Latest request wins: prevents outdated async responses from overwriting newer queries
  const latestRequestId = useRef(0);

  // Function to manually re-trigger the current search (e.g. after record edit/delete/create)
  const reload = () => setReloadTrigger((prev) => prev + 1);

  // Partial mode requires at least 3 characters before querying the trigram index
  const isPartialSearchTooShort =
    state.searchMode === 'partial' &&
    debouncedSearch.trim().length > 0 &&
    debouncedSearch.trim().length < 3;

  useEffect(() => {
    if (!datasetId) {
      setRows([]);
      setMeta(null);
      setLoading(false);
      setError(null);
      return;
    }

    const currentReqId = ++latestRequestId.current;
    setLoading(true);
    setError(null);

    const effectiveSearch = isPartialSearchTooShort ? undefined : debouncedSearch.trim() || undefined;

    const fieldTypeMap = new Map(fields.map((f) => [f.key, f.type]));
    const completeConditions = state.conditions
      .filter(isConditionComplete)
      .map((c) => serializeCondition(c, fieldTypeMap.get(c.field)));

    const requestBody: SearchRequest = {
      search: effectiveSearch,
      searchMode: state.searchMode,
      logic: state.logic,
      conditions: completeConditions,
      sort: state.sort.length > 0 ? state.sort : undefined,
      page: state.page,
      pageSize: state.pageSize,
    };

    recordsService
      .searchRecords(datasetId, requestBody)
      .then((res) => {
        if (currentReqId === latestRequestId.current) {
          setRows(res.data);
          setMeta(res.meta);
        }
      })
      .catch((err) => {
        if (currentReqId === latestRequestId.current) {
          setError(err instanceof Error ? err.message : 'Search request failed');
        }
      })
      .finally(() => {
        if (currentReqId === latestRequestId.current) {
          setLoading(false);
        }
      });
  }, [
    datasetId,
    fields,
    debouncedSearch,
    isPartialSearchTooShort,
    state.searchMode,
    state.logic,
    state.conditions,
    state.sort,
    state.page,
    state.pageSize,
    reloadTrigger,
  ]);

  return {
    rows,
    meta,
    loading,
    error,
    reload,
  };
}
