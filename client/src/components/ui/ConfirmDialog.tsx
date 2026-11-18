'use client';

import { Modal } from './Modal';
import { Button } from './Button';

export type ConfirmDialogProps = {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

// Confirmation modal built on top of the base Modal component
export function ConfirmDialog({
  isOpen,
  message,
  title = 'Please Confirm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-xs text-gray-700 dark:text-gray-300 py-1">{message}</p>
    </Modal>
  );
}
