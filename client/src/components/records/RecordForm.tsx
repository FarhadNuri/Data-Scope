'use client';

import { useState } from 'react';
import { RecordFieldInput } from './RecordFieldInput';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { DatasetField } from '@/types/dataset';

type RecordFormProps = {
  datasetId: string;
  fields: DatasetField[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  readOnly?: boolean;
  loading?: boolean;
  error?: string | null;
  errorDetails?: { field?: string; path?: string; message: string }[];
};

export function RecordForm({
  datasetId,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  readOnly = false,
  loading = false,
  error,
  errorDetails,
}: RecordFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...initialValues });

  // Exclude built-in system timestamps from editable fields
  const editableFields = fields.filter(
    (f) => f.key !== 'created_at' && f.key !== 'updated_at'
  );

  const handleFieldChange = (key: string, val: unknown) => {
    setValues((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || loading) return;

    // Convert values before submitting: clean empty strings to null
    const cleaned: Record<string, unknown> = {};
    for (const f of editableFields) {
      const v = values[f.key];
      if (v === '' || v === undefined) {
        cleaned[f.key] = null;
      } else {
        cleaned[f.key] = v;
      }
    }
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <ErrorMessage message={error} details={errorDetails} />}

      <div className="space-y-3">
        {editableFields.map((field) => (
          <RecordFieldInput
            key={field.id || field.key}
            datasetId={datasetId}
            field={field}
            value={values[field.key]}
            onChange={(val) => handleFieldChange(field.key, val)}
            disabled={readOnly || loading}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
