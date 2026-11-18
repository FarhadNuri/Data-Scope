'use client';

import { useEffect } from 'react';

export type DrawerProps = {
  isOpen: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

// Right-docked slide-over panel for record details and inspection
export function Drawer({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: DrawerProps) {
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
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] h-full bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-none text-xs flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
          <div className="flex-1 pr-2">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1 leading-none mt-0.5"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end space-x-2 bg-gray-50 dark:bg-gray-950">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
