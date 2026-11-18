'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatasetPicker } from '@/components/explorer/DatasetPicker';
import { AddFieldModal } from '@/components/admin/AddFieldModal';
import * as datasetsService from '@/services/datasets.service';
import type { Dataset, DatasetField } from '@/types/dataset';

export default function AdminFieldsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [fields, setFields] = useState<DatasetField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<DatasetField | null>(null);

  // Load datasets on mount
  useEffect(() => {
    datasetsService.listDatasets({ pageSize: 100 })
      .then((res) => {
        setDatasets(res.data);
        if (res.data.length > 0) setSelectedDatasetId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load datasets'));
  }, []);

  const fetchFields = useCallback(async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await datasetsService.getFields(selectedDatasetId);
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleToggleFlag = async (field: DatasetField, flag: 'isFilterable' | 'isSortable' | 'isSearchable') => {
    if (!selectedDatasetId) return;
    const newVal = !field[flag];
    try {
      await datasetsService.updateField(selectedDatasetId, field.id, { [flag]: newVal });
      setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, [flag]: newVal } : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    }
  };

  const handleDelete = async () => {
    if (!selectedDatasetId || !fieldToDelete) return;
    try {
      await datasetsService.deleteField(selectedDatasetId, fieldToDelete.id);
      setFieldToDelete(null);
      fetchFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
      setFieldToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Schema Fields</h1>
          <DatasetPicker datasets={datasets} selectedId={selectedDatasetId} onSelect={setSelectedDatasetId} />
        </div>
        {selectedDatasetId && (
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            + Add Field
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && fields.length === 0 ? (
        <div className="p-8 text-center"><Spinner text="Loading schema fields..." /></div>
      ) : fields.length === 0 ? (
        <p className="p-8 text-center text-gray-400 italic text-xs">No fields configured for this dataset</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium text-center">Filterable</th>
                <th className="px-3 py-2 font-medium text-center">Sortable</th>
                <th className="px-3 py-2 font-medium text-center">Searchable</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
              {fields.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-gray-100">{f.key}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{f.label}</td>
                  <td className="px-3 py-2"><Badge text={f.type} color="blue" /></td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={f.isFilterable} onChange={() => handleToggleFlag(f, 'isFilterable')} className="rounded border-gray-300 text-blue-600" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={f.isSortable} onChange={() => handleToggleFlag(f, 'isSortable')} className="rounded border-gray-300 text-blue-600" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={f.isSearchable} onChange={() => handleToggleFlag(f, 'isSearchable')} className="rounded border-gray-300 text-blue-600" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => setFieldToDelete(f)} className="text-red-500 hover:underline font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDatasetId && isAddOpen && (
        <AddFieldModal isOpen={isAddOpen} datasetId={selectedDatasetId} onClose={() => setIsAddOpen(false)} onSaved={fetchFields} />
      )}

      <ConfirmDialog
        isOpen={Boolean(fieldToDelete)}
        title="Delete Field"
        message={`Delete field "${fieldToDelete?.label}" (${fieldToDelete?.key})? Existing values in records may become inaccessible.`}
        confirmLabel="Delete Field"
        onConfirm={handleDelete}
        onCancel={() => setFieldToDelete(null)}
      />
    </div>
  );
}
