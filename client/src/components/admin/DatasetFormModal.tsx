'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as datasetsService from '@/services/datasets.service';
import type { Dataset } from '@/types/dataset';

type DatasetFormModalProps = {
  isOpen: boolean;
  dataset?: Dataset | null;
  onClose: () => void;
  onSaved: () => void;
};

export function DatasetFormModal({
  isOpen,
  dataset,
  onClose,
  onSaved,
}: DatasetFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataset) {
      setName(dataset.name);
      setDescription(dataset.description || '');
      setCategory(dataset.category || '');
      setDataSource(dataset.dataSource || '');
    } else {
      setName('');
      setDescription('');
      setCategory('');
      setDataSource('');
    }
    setError(null);
  }, [dataset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Dataset name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (dataset) {
        await datasetsService.updateDataset(dataset.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          dataSource: dataSource.trim() || undefined,
        });
      } else {
        await datasetsService.createDataset({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          dataSource: dataSource.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={dataset ? `Edit Dataset: ${dataset.name}` : 'New Dataset'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {dataset ? 'Save Changes' : 'Create Dataset'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <ErrorMessage message={error} />}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Customers"
          disabled={loading}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Master customer directory"
          disabled={loading}
        />
        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Sales"
          disabled={loading}
        />
        <Input
          label="Data Source"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          placeholder="e.g. PostgreSQL, CRM Sync"
          disabled={loading}
        />
      </form>
    </Modal>
  );
}
