'use client';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
};

// Reusable button with plain styling and no animations
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  title,
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded border disabled:opacity-50 select-none';

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700';
      break;
    case 'danger':
      variantClasses =
        'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60';
      break;
    case 'secondary':
    default:
      variantClasses =
        'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800';
      break;
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {loading ? '...' : children}
    </button>
  );
}
