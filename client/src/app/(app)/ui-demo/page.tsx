'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function UiDemoPage() {
  const [inputText, setInputText] = useState('Sample text');
  const [selectVal, setSelectVal] = useState('2');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      <div>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">UI Component Gallery</h1>
        <p className="text-xs text-gray-500">
          Temporary showcase of the 12 reusable developer-console UI components (Prompt 3).
        </p>
      </div>

      {/* 1. Buttons */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">1. Buttons</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" size="sm">Small Primary</Button>
          <Button variant="secondary" size="sm">Small Secondary</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="secondary" disabled>Disabled</Button>
        </div>
      </section>

      {/* 2. Inputs & Selects */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">2. Inputs & Selects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Standard Input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type something..."
          />
          <Input
            label="Input with Error"
            value="invalid_payload"
            onChange={() => {}}
            error="This field contains an invalid format"
          />
          <Select
            label="Category Select"
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            options={[
              { value: '1', label: 'Option One' },
              { value: '2', label: 'Option Two' },
              { value: '3', label: 'Option Three' },
            ]}
          />
          <Select
            label="Disabled Select"
            value="1"
            disabled
            onChange={() => {}}
            options={[{ value: '1', label: 'Locked Option' }]}
          />
        </div>
      </section>

      {/* 3. Badges & Spinner */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">3. Badges & Spinner</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge text="ADMIN" color="red" />
          <Badge text="ANALYST" color="blue" />
          <Badge text="VIEWER" color="gray" />
          <Badge text="ACTIVE" color="green" />
          <Badge text="PENDING" color="yellow" />
          <div className="h-4 border-r border-gray-300 dark:border-gray-700 mx-2" />
          <Spinner text="Loading dataset..." />
        </div>
      </section>

      {/* 4. Error Message & Empty State */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">4. Error Message & Empty State</h2>
        <ErrorMessage
          message="Failed to execute search query"
          details={[
            { field: 'revenue', message: 'Must be a positive numeric value' },
            { field: 'country', message: 'Unknown filter operator: eqq' },
          ]}
          onRetry={() => alert('Retry triggered')}
        />
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded">
          <EmptyState text="No records match your current filter conditions." />
        </div>
      </section>

      {/* 5. Tabs */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">5. Tabs</h2>
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Record Data' },
            { id: 'tab2', label: 'Audit History' },
            { id: 'tab3', label: 'Relationships' },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 pt-2">Active tab content: <strong>{activeTab}</strong></p>
      </section>

      {/* 6. Overlays: Modal, Drawer & Confirm Dialog */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">6. Overlays & Dialogs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setIsDrawerOpen(true)}>Open Drawer (Right Side)</Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Open Confirm Dialog</Button>
        </div>

        <Modal
          isOpen={isModalOpen}
          title="Save Current Search View"
          onClose={() => setIsModalOpen(false)}
          footer={
            <>
              <Button size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>Save View</Button>
            </>
          }
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Modal content with backdrop click and Escape key dismissal.
          </p>
        </Modal>

        <Drawer
          isOpen={isDrawerOpen}
          title="Record Inspection Drawer"
          onClose={() => setIsDrawerOpen(false)}
          footer={
            <Button size="sm" onClick={() => setIsDrawerOpen(false)}>Done</Button>
          }
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Fixed 560px right-side drawer for displaying record details, edit forms, audit history, and graph relationships.
          </p>
        </Drawer>

        <ConfirmDialog
          isOpen={isConfirmOpen}
          title="Delete Record"
          message="Are you sure you want to delete this record? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            alert('Confirmed');
            setIsConfirmOpen(false);
          }}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </section>

      {/* 7. Pagination */}
      <section className="p-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">7. Pagination</h2>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={100000}
          totalPages={4000}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        <div className="pt-2 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPage(400)}
          >
            Jump to offset 10,000 (Page 400 at size 25) to test limit warning
          </Button>
          <Button
            size="sm"
            onClick={() => setPage(1)}
          >
            Reset to Page 1
          </Button>
        </div>
      </section>
    </div>
  );
}
