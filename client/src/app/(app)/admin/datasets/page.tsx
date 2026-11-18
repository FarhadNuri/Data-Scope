'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatasetFormModal } from '@/components/admin/DatasetFormModal';
import { formatNumber } from '@/lib/format';
import * as datasetsService from '@/services/datasets.service';
import type { Dataset } from '@/types/dataset';

export default function AdminDatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formDataset, setFormDataset] = useState<Dataset | null | undefined>(undefined);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await datasetsService.listDatasets({ pageSize: 100 });
      setDatasets(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleDelete = async () => {
    if (!datasetToDelete) return;
    try {
      await datasetsService.deleteDataset(datasetToDelete.id);
      setDatasetToDelete(null);
      fetchDatasets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dataset');
      setDatasetToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dataset Management</h1>
        <Button variant="primary" size="sm" onClick={() => setFormDataset(null)}>
          + New Dataset
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && datasets.length === 0 ? (
        <div className="p-8 text-center"><Spinner text="Loading datasets..." /></div>
      ) : datasets.length === 0 ? (
        <p className="p-8 text-center text-gray-400 italic text-xs">No datasets found</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium text-right">Total Records</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{d.name}</td>
                  <td className="px-3 py-2 text-gray-500">{d.category || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{d.dataSource || '—'}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatNumber(d.totalRecords)}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormDataset(d)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatasetToDelete(d)}
                      className="text-red-500 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formDataset !== undefined && (
        <DatasetFormModal
          isOpen={true}
          dataset={formDataset}
          onClose={() => setFormDataset(undefined)}
          onSaved={fetchDatasets}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(datasetToDelete)}
        title="Delete Dataset"
        message={`Delete "${datasetToDelete?.name}"? This also deletes all records, fields, permissions and saved views.`}
        confirmLabel="Delete Dataset"
        onConfirm={handleDelete}
        onCancel={() => setDatasetToDelete(null)}
      />
    </div>
  );
}
