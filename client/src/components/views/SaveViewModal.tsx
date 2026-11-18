'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { describeConfig } from '@/lib/describe-config';
import { ApiError } from '@/lib/api';
import * as viewsService from '@/services/saved-views.service';
import type { SearchConfig } from '@/types/search';
import type { SavedView } from '@/types/saved-view';

type SaveViewModalProps = {
  isOpen: boolean;
  datasetId: string;
  config: SearchConfig;
  onClose: () => void;
  onSaved: (view: SavedView) => void;
};

export function SaveViewModal({
  isOpen,
  datasetId,
  config,
  onClose,
  onSaved,
}: SaveViewModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const description = describeConfig(config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a name for the saved view.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const saved = await viewsService.createView({
        name: trimmed,
        datasetId,
        config,
      });
      setName('');
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError('You already have a view with this name for this dataset.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save view');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Save Current View"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            Save View
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <ErrorMessage message={error} />}

        <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded border border-gray-200 dark:border-gray-800 text-xs">
          <span className="font-medium text-gray-500 dark:text-gray-400 block mb-1">
            Search configuration to save:
          </span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {description}
          </span>
        </div>

        <Input
          label="View Name"
          value={name}
          maxLength={100}
          placeholder="e.g. Active German Enterprise Customers"
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </form>
    </Modal>
  );
}
