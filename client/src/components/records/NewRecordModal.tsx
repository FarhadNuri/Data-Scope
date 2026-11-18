'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { RecordForm } from './RecordForm';
import { ApiError } from '@/lib/api';
import * as recordsService from '@/services/records.service';
import type { DatasetField } from '@/types/dataset';

type NewRecordModalProps = {
  isOpen: boolean;
  datasetId: string;
  fields: DatasetField[];
  onClose: () => void;
  onRecordCreated: () => void;
};

export function NewRecordModal({
  isOpen,
  datasetId,
  fields,
  onClose,
  onRecordCreated,
}: NewRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<
    { field?: string; path?: string; message: string }[] | undefined
  >(undefined);

  if (!isOpen) return null;

  const handleCreate = async (values: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    setErrorDetails(undefined);

    try {
      await recordsService.createRecord(datasetId, values);
      onClose();
      onRecordCreated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setError('You only have view access to this dataset.');
      } else if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details);
      } else {
        setError('Failed to create record');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Create New Record" onClose={onClose}>
      <RecordForm
        datasetId={datasetId}
        fields={fields}
        onSubmit={handleCreate}
        onCancel={onClose}
        submitLabel="Create Record"
        loading={loading}
        error={error}
        errorDetails={errorDetails}
      />
    </Modal>
  );
}
