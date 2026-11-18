'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { RecordForm } from './RecordForm';
import { formatNumber, formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api';
import * as recordsService from '@/services/records.service';
import type { DataRecord } from '@/types/record';
import type { DatasetField } from '@/types/dataset';

type RecordDataTabProps = {
  record: DataRecord;
  datasetId: string;
  fields: DatasetField[];
  onRecordUpdated: () => void;
  onRecordDeleted: () => void;
};

export function RecordDataTab({
  record,
  datasetId,
  fields,
  onRecordUpdated,
  onRecordDeleted,
}: RecordDataTabProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<
    { field?: string; path?: string; message: string }[] | undefined
  >(undefined);

  const editableFields = fields.filter((f) => f.key !== 'created_at' && f.key !== 'updated_at');

  const handleSave = async (submittedValues: Record<string, unknown>) => {
    // Collect ONLY the keys that were actually modified
    const changedKeys: Record<string, unknown> = {};
    for (const key of Object.keys(submittedValues)) {
      if (record.data?.[key] !== submittedValues[key]) {
        changedKeys[key] = submittedValues[key];
      }
    }

    if (Object.keys(changedKeys).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    setErrorDetails(undefined);
    try {
      await recordsService.updateRecord(datasetId, record.id, changedKeys);
      setIsEditing(false);
      onRecordUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setError('You only have view access to this dataset.');
      } else if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details);
      } else {
        setError('Failed to update record');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await recordsService.deleteRecord(datasetId, record.id);
      setIsConfirmOpen(false);
      onRecordDeleted();
    } catch (err) {
      setError(
        err instanceof ApiError && err.statusCode === 403
          ? 'You only have view access to this dataset.'
          : err instanceof Error ? err.message : 'Failed to delete record'
      );
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <RecordForm
        datasetId={datasetId}
        fields={fields}
        initialValues={record.data}
        onSubmit={handleSave}
        onCancel={() => { setIsEditing(false); setError(null); }}
        submitLabel="Save Changes"
        loading={saving}
        error={error}
        errorDetails={errorDetails}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <div className="border border-gray-200 dark:border-gray-800 rounded divide-y divide-gray-100 dark:divide-gray-800">
        {editableFields.map((field) => {
          const raw = record.data?.[field.key];
          let formatted: React.ReactNode = String(raw ?? '—');
          if (raw === null || raw === undefined || raw === '') {
            formatted = <span className="text-gray-400 dark:text-gray-600">—</span>;
          } else if (field.type === 'number' && typeof raw === 'number') {
            formatted = formatNumber(raw);
          } else if (field.type === 'date' && typeof raw === 'string') {
            formatted = formatDate(raw);
          } else if (field.type === 'boolean') {
            formatted = raw ? 'Yes' : 'No';
          }

          return (
            <div key={field.id || field.key} className="p-2.5 flex justify-between items-center text-xs">
              <span className="font-medium text-gray-500 dark:text-gray-400">{field.label || field.key}</span>
              <span className="text-gray-900 dark:text-gray-100 text-right">{formatted}</span>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
            Delete Record
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
            Edit Record
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Record"
        message="Are you sure you want to permanently delete this record? This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Record'}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
