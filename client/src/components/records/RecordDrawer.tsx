'use client';

import { useState, useEffect, useCallback } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs } from '@/components/ui/Tabs';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { formatDateTime } from '@/lib/format';
import { RecordDataTab } from './RecordDataTab';
import { RecordHistoryTab } from './RecordHistoryTab';
import { RecordRelatedTab } from './RecordRelatedTab';
import * as recordsService from '@/services/records.service';
import type { DataRecord } from '@/types/record';
import type { DatasetField } from '@/types/dataset';

type RecordDrawerProps = {
  isOpen: boolean;
  datasetId: string;
  recordId: string | null;
  fields: DatasetField[];
  onClose: () => void;
  onReloadTable: () => void;
};

const TABS = [
  { id: 'data', label: 'Record Data' },
  { id: 'history', label: 'Audit History' },
  { id: 'related', label: 'Relationships' },
];

export function RecordDrawer({
  isOpen,
  datasetId,
  recordId,
  fields,
  onClose,
  onReloadTable,
}: RecordDrawerProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [record, setRecord] = useState<DataRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!datasetId || !recordId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await recordsService.getRecord(datasetId, recordId);
      setRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load record');
    } finally {
      setLoading(false);
    }
  }, [datasetId, recordId]);

  useEffect(() => {
    if (isOpen && recordId) {
      setActiveTab('data');
      fetchRecord();
    } else {
      setRecord(null);
      setError(null);
    }
  }, [isOpen, recordId, fetchRecord]);

  const handleRecordUpdated = () => {
    fetchRecord();
    onReloadTable();
  };

  const handleRecordDeleted = () => {
    onClose();
    onReloadTable();
  };

  const header = (
    <div>
      <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
        {record ? `Record ${record.id.slice(0, 8)}...` : 'Record Details'}
      </h2>
      {record && (
        <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
          <div className="font-mono break-all select-all">
            <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span> {record.id}
          </div>
          <div className="flex flex-wrap gap-x-3 text-[10px] text-gray-400">
            <span>Created: {formatDateTime(record.createdAt)}</span>
            <span>Updated: {formatDateTime(record.updatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Drawer isOpen={isOpen} title={header} onClose={onClose}>
      {loading && !record && (
        <div className="py-8"><Spinner /></div>
      )}

      {error && <ErrorMessage message={error} />}

      {record && (
        <div className="space-y-4">
          <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

          <div className="pt-2">
            {activeTab === 'data' && (
              <RecordDataTab
                record={record}
                datasetId={datasetId}
                fields={fields}
                onRecordUpdated={handleRecordUpdated}
                onRecordDeleted={handleRecordDeleted}
              />
            )}
            {activeTab === 'history' && (
              <RecordHistoryTab datasetId={datasetId} recordId={record.id} />
            )}
            {activeTab === 'related' && (
              <RecordRelatedTab datasetId={datasetId} recordId={record.id} />
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
