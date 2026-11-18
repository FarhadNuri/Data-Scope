'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import * as datasetsService from '@/services/datasets.service';
import { useDatasetFields } from '@/hooks/useDatasetFields';
import { useSearchState } from '@/hooks/useSearchState';
import { useSearch } from '@/hooks/useSearch';
import { DatasetPicker } from '@/components/explorer/DatasetPicker';
import { GlobalSearchBar } from '@/components/explorer/GlobalSearchBar';
import { FilterBuilder } from '@/components/explorer/FilterBuilder';
import { ColumnPicker } from '@/components/explorer/ColumnPicker';
import { SearchMetaBar } from '@/components/explorer/SearchMetaBar';
import { SortSummary } from '@/components/explorer/SortSummary';
import { DataTable } from '@/components/explorer/DataTable';
import { RecordDrawer } from '@/components/records/RecordDrawer';
import { NewRecordModal } from '@/components/records/NewRecordModal';
import { SavedViewsMenu } from '@/components/views/SavedViewsMenu';
import { SaveViewModal } from '@/components/views/SaveViewModal';
import { RecentSearches } from '@/components/views/RecentSearches';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Dataset } from '@/types/dataset';
import type { SearchConfig } from '@/types/search';

export default function ExplorerPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);

  // Modals & drawers state
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false);

  const searchState = useSearchState(preferences.defaultPageSize || 25);
  const { fields, loading: fieldsLoading } = useDatasetFields(selectedDatasetId);
  const { rows, meta, loading: searchLoading, error: searchError, reload } = useSearch(
    selectedDatasetId,
    fields,
    searchState.state
  );

  const canManageRecords = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  // Sync initial page size when defaultPageSize preference loads
  useEffect(() => {
    if (preferences.defaultPageSize && searchState.state.pageSize !== preferences.defaultPageSize) {
      searchState.setPageSize(preferences.defaultPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.defaultPageSize]);

  // Load accessible datasets on initial mount
  useEffect(() => {
    async function loadDatasets() {
      setDatasetsLoading(true);
      setDatasetsError(null);
      try {
        const res = await datasetsService.listDatasets({ pageSize: 100 });
        setDatasets(res.data);
        if (res.data.length > 0) {
          setSelectedDatasetId(res.data[0].id);
        }
      } catch (err) {
        setDatasetsError(err instanceof Error ? err.message : 'Failed to load datasets');
      } finally {
        setDatasetsLoading(false);
      }
    }

    loadDatasets();
  }, []);

  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    searchState.reset();
  };

  const visibleColumns =
    (selectedDatasetId && preferences.visibleColumns?.[selectedDatasetId]) ||
    fields.map((f) => f.key);

  const handleVisibleColumnsChange = (newCols: string[]) => {
    if (!selectedDatasetId) return;
    updatePreferences({
      visibleColumns: { [selectedDatasetId]: newCols },
    });
  };

  const handleResetColumns = () => {
    if (!selectedDatasetId) return;
    updatePreferences({
      visibleColumns: { [selectedDatasetId]: fields.map((f) => f.key) },
    });
  };

  const currentSearchConfig: SearchConfig = {
    search: searchState.state.search || undefined,
    searchMode: searchState.state.searchMode,
    logic: searchState.state.logic,
    conditions: searchState.state.conditions,
    sort: searchState.state.sort.length > 0 ? searchState.state.sort : undefined,
    columns: visibleColumns,
  };

  if (datasetsLoading) {
    return (
      <div className="p-8 text-center">
        <Spinner text="Loading datasets..." />
      </div>
    );
  }

  if (datasetsError) {
    return (
      <div className="p-4">
        <ErrorMessage message={datasetsError} />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="p-8">
        <EmptyState text="No datasets available for your account." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Dataset selector, Saved Views, Recent Searches, Actions, and Column visibility */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <DatasetPicker
            datasets={datasets}
            selectedId={selectedDatasetId}
            onSelect={handleSelectDataset}
            disabled={searchLoading}
          />
          {selectedDatasetId && (
            <>
              <SavedViewsMenu
                datasetId={selectedDatasetId}
                currentConfig={currentSearchConfig}
                onSelectView={searchState.loadConfig}
              />
              <RecentSearches
                datasetId={selectedDatasetId}
                onSelectHistory={searchState.loadConfig}
                searchTrigger={meta?.tookMs}
              />
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canManageRecords && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSaveViewOpen(true)}
              >
                Save View
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewRecordOpen(true)}
              >
                + New Record
              </Button>
            </>
          )}
          {fields.length > 0 && (
            <ColumnPicker
              fields={fields}
              visibleColumns={visibleColumns}
              onChange={handleVisibleColumnsChange}
              onReset={handleResetColumns}
            />
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar
        search={searchState.state.search}
        searchMode={searchState.state.searchMode}
        onSearchChange={searchState.setSearch}
        onModeChange={searchState.setSearchMode}
      />

      {/* Dynamic Filter Query Builder */}
      {selectedDatasetId && user && (
        <FilterBuilder
          datasetId={selectedDatasetId}
          fields={fields}
          conditions={searchState.state.conditions}
          logic={searchState.state.logic}
          role={user.role}
          onAddCondition={searchState.addCondition}
          onUpdateCondition={searchState.updateCondition}
          onRemoveCondition={searchState.removeCondition}
          onClearConditions={searchState.clearConditions}
          onLogicChange={searchState.setLogic}
        />
      )}

      {/* Backend validation error notification */}
      {searchError && <ErrorMessage message={searchError} />}

      {/* Search Metadata & Sorting Status */}
      <SearchMetaBar meta={meta} loading={searchLoading} />
      <SortSummary
        sort={searchState.state.sort}
        fields={fields}
        onClearSort={searchState.clearSort}
      />

      {/* Data Table */}
      {fieldsLoading ? (
        <div className="p-8 text-center">
          <Spinner text="Loading schema fields..." />
        </div>
      ) : (
        <DataTable
          fields={fields}
          rows={rows}
          sort={searchState.state.sort}
          onSortToggle={searchState.toggleSort}
          onRowClick={(record) => {
            setSelectedRecordId(record.id);
            setIsDrawerOpen(true);
          }}
          loading={searchLoading}
          visibleColumns={visibleColumns}
        />
      )}

      {/* Pagination Bar */}
      {meta && (
        <Pagination
          page={searchState.state.page}
          pageSize={searchState.state.pageSize}
          totalItems={meta.totalItems}
          totalPages={meta.totalPages}
          onPageChange={searchState.setPage}
          onPageSizeChange={searchState.setPageSize}
        />
      )}

      {/* Slide-over Inspection Drawer */}
      {selectedDatasetId && (
        <RecordDrawer
          isOpen={isDrawerOpen}
          datasetId={selectedDatasetId}
          recordId={selectedRecordId}
          fields={fields}
          onClose={() => setIsDrawerOpen(false)}
          onReloadTable={reload}
        />
      )}

      {/* Create Record Modal */}
      {selectedDatasetId && (
        <NewRecordModal
          isOpen={isNewRecordOpen}
          datasetId={selectedDatasetId}
          fields={fields}
          onClose={() => setIsNewRecordOpen(false)}
          onRecordCreated={reload}
        />
      )}

      {/* Save View Modal */}
      {selectedDatasetId && (
        <SaveViewModal
          isOpen={isSaveViewOpen}
          datasetId={selectedDatasetId}
          config={currentSearchConfig}
          onClose={() => setIsSaveViewOpen(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
