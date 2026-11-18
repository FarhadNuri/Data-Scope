type BadgeColor = 'gray' | 'green' | 'blue' | 'red' | 'yellow';

export type BadgeProps = {
  text: string;
  color?: BadgeColor;
  className?: string;
};

// Minimalist status/role badge
export function Badge({ text, color = 'gray', className = '' }: BadgeProps) {
  let colorClasses = '';

  switch (color) {
    case 'green':
      colorClasses =
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900';
      break;
    case 'blue':
      colorClasses =
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
      break;
    case 'red':
      colorClasses =
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
      break;
    case 'yellow':
      colorClasses =
        'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900';
      break;
    case 'gray':
    default:
      colorClasses =
        'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold border rounded ${colorClasses} ${className}`}
    >
      {text}
    </span>
  );
}
