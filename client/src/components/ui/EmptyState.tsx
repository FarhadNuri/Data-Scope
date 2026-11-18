export type EmptyStateProps = {
  text?: string;
  children?: React.ReactNode;
  className?: string;
};

// Simple centered gray placeholder for empty lists or tables
export function EmptyState({
  text = 'No items found',
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-4 text-center text-xs text-gray-500 dark:text-gray-400 ${className}`}
    >
      {children || <p>{text}</p>}
    </div>
  );
}
