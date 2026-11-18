'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ApiError } from '@/lib/api';
import * as datasetsService from '@/services/datasets.service';
import type { FieldType } from '@/types/dataset';

type AddFieldModalProps = {
  isOpen: boolean;
  datasetId: string;
  onClose: () => void;
  onSaved: () => void;
};

const KEY_REGEX = /^[a-z][a-z0-9_]{0,49}$/;
const RESERVED_KEYS = new Set(['id', 'created_at', 'updated_at']);

export function AddFieldModal({ isOpen, datasetId, onClose, onSaved }: AddFieldModalProps) {
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [isFilterable, setIsFilterable] = useState(true);
  const [isSortable, setIsSortable] = useState(true);
  const [isSearchable, setIsSearchable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = key.trim();
    if (!cleanKey) return setError('Field key is required');
    if (!KEY_REGEX.test(cleanKey)) return setError('Key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores (max 50 chars)');
    if (RESERVED_KEYS.has(cleanKey)) return setError(`"${cleanKey}" is a reserved system field name and cannot be used`);
    if (!label.trim()) return setError('Label is required');

    setLoading(true);
    setError(null);
    try {
      await datasetsService.createField(datasetId, {
        key: cleanKey,
        label: label.trim(),
        type,
        isFilterable,
        isSortable,
        isSearchable,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError && err.statusCode === 409
          ? `A field with key "${cleanKey}" already exists on this dataset`
          : err instanceof Error ? err.message : 'Failed to add field'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Add Schema Field"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>Add Field</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <ErrorMessage message={error} />}

        <Input
          label="Field Key (database column identifier)"
          value={key}
          onChange={(e) => setKey(e.target.value.toLowerCase())}
          placeholder="e.g. employee_count"
          required
          disabled={loading}
        />
        <Input
          label="Display Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Employee Count"
          required
          disabled={loading}
        />
        <Select
          label="Field Type"
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
          disabled={loading}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Number' },
            { value: 'date', label: 'Date' },
            { value: 'select', label: 'Select (categorical)' },
            { value: 'boolean', label: 'Boolean (Yes/No)' },
          ]}
        />

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Capabilities</label>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={isFilterable} onChange={(e) => setIsFilterable(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              <span>Filterable</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={isSortable} onChange={(e) => setIsSortable(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              <span>Sortable</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={isSearchable} onChange={(e) => setIsSearchable(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              <span>Searchable</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
