'use client';

import { useState, useCallback } from 'react';
import type { Condition, SortItem, SearchConfig } from '@/types/search';

export type SearchState = {
  search: string;
  searchMode: 'fulltext' | 'partial';
  logic: 'AND' | 'OR';
  conditions: Condition[];
  sort: SortItem[];
  page: number;
  pageSize: number;
};

// Manages all search, filter, sorting, and pagination parameters in unified state
export function useSearchState(initialPageSize = 25) {
  const [state, setState] = useState<SearchState>({
    search: '',
    searchMode: 'fulltext',
    logic: 'AND',
    conditions: [],
    sort: [],
    page: 1,
    pageSize: initialPageSize,
  });

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setSearchMode = useCallback((searchMode: 'fulltext' | 'partial') => {
    setState((prev) => ({ ...prev, searchMode, page: 1 }));
  }, []);

  const setLogic = useCallback((logic: 'AND' | 'OR') => {
    setState((prev) => ({ ...prev, logic, page: 1 }));
  }, []);

  const setConditions = useCallback((conditions: Condition[]) => {
    setState((prev) => ({ ...prev, conditions, page: 1 }));
  }, []);

  const addCondition = useCallback((condition: Condition) => {
    setState((prev) => ({
      ...prev,
      conditions: [...prev.conditions, condition],
      page: 1,
    }));
  }, []);

  const updateCondition = useCallback((index: number, updated: Condition) => {
    setState((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => (i === index ? updated : c)),
      page: 1,
    }));
  }, []);

  const removeCondition = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
      page: 1,
    }));
  }, []);

  const clearConditions = useCallback(() => {
    setState((prev) => ({ ...prev, conditions: [], page: 1 }));
  }, []);

  const toggleSort = useCallback((field: string) => {
    setState((prev) => {
      const existingIndex = prev.sort.findIndex((s) => s.field === field);

      let newSort: SortItem[];
      if (existingIndex === -1) {
        // Enforce MAX_SORT_COLUMNS (max 3)
        if (prev.sort.length >= 3) {
          return prev;
        }
        newSort = [...prev.sort, { field, direction: 'asc' }];
      } else if (prev.sort[existingIndex].direction === 'asc') {
        newSort = prev.sort.map((s, i) =>
          i === existingIndex ? { ...s, direction: 'desc' as const } : s
        );
      } else {
        // asc -> desc -> removed
        newSort = prev.sort.filter((_, i) => i !== existingIndex);
      }

      return { ...prev, sort: newSort, page: 1 };
    });
  }, []);

  const clearSort = useCallback(() => {
    setState((prev) => ({ ...prev, sort: [], page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const loadConfig = useCallback((config: SearchConfig) => {
    setState((prev) => ({
      ...prev,
      search: config.search || '',
      searchMode: config.searchMode || 'fulltext',
      logic: config.logic || 'AND',
      conditions: config.conditions || [],
      sort: config.sort || [],
      page: 1,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      search: '',
      searchMode: 'fulltext',
      logic: 'AND',
      conditions: [],
      sort: [],
      page: 1,
      pageSize: initialPageSize,
    });
  }, [initialPageSize]);

  return {
    state,
    setSearch,
    setSearchMode,
    setLogic,
    setConditions,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    toggleSort,
    clearSort,
    setPage,
    setPageSize,
    loadConfig,
    reset,
  };
}
