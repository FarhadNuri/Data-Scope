'use client';

import { useEffect } from 'react';

export type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
};

// Plain dialog overlay with backdrop and Escape key listener (no animations)
export function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-md',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-none text-xs flex flex-col`}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1 leading-none"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end space-x-2 bg-gray-50 dark:bg-gray-950 rounded-b">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
