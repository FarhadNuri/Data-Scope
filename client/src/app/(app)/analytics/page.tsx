'use client';

import { useState, useEffect } from 'react';
import * as datasetsService from '@/services/datasets.service';
import * as analyticsService from '@/services/analytics.service';
import { KpiCards } from '@/components/analytics/KpiCards';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { GrowthChart } from '@/components/analytics/GrowthChart';
import { SearchActivityChart } from '@/components/analytics/SearchActivityChart';
import { TopFiltersTable } from '@/components/analytics/TopFiltersTable';
import { DatasetPicker } from '@/components/explorer/DatasetPicker';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Dataset } from '@/types/dataset';
import type { DatasetSummary } from '@/types/analytics';

export default function AnalyticsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Load accessible datasets
  useEffect(() => {
    setDatasetsLoading(true);
    setDatasetsError(null);
    datasetsService
      .listDatasets({ pageSize: 100 })
      .then((res) => {
        setDatasets(res.data);
        if (res.data.length > 0) {
          setSelectedDatasetId(res.data[0].id);
        }
      })
      .catch((err) => setDatasetsError(err instanceof Error ? err.message : 'Failed to load datasets'))
      .finally(() => setDatasetsLoading(false));
  }, []);

  // Load summary for the selected dataset
  useEffect(() => {
    if (!selectedDatasetId) {
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);
    analyticsService
      .getSummary(selectedDatasetId)
      .then(setSummary)
      .catch((err) => setSummaryError(err instanceof Error ? err.message : 'Failed to load dataset summary'))
      .finally(() => setSummaryLoading(false));
  }, [selectedDatasetId]);

  if (datasetsLoading) {
    return (
      <div className="p-8 text-center">
        <Spinner text="Loading analytics..." />
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

  return (
    <div className="space-y-6">
      {/* 1. Platform KPI Overview (Admin only) */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Platform Overview</h2>
        <KpiCards />
      </section>

      {/* 2. Dataset-Specific Visualizations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dataset Analytics</h2>
          <DatasetPicker
            datasets={datasets}
            selectedId={selectedDatasetId}
            onSelect={setSelectedDatasetId}
          />
        </div>

        {selectedDatasetId ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DistributionChart
                title="By Category"
                data={summary?.byCategory || []}
                loading={summaryLoading}
                error={summaryError}
              />
              <DistributionChart
                title="By Status"
                data={summary?.byStatus || []}
                loading={summaryLoading}
                error={summaryError}
              />
            </div>

            <GrowthChart datasetId={selectedDatasetId} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No dataset selected.</p>
        )}
      </section>

      {/* 3. Query Activity & Usage */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Search Activity & Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchActivityChart />
          <TopFiltersTable datasetId={selectedDatasetId || undefined} />
        </div>
      </section>
    </div>
  );
}
