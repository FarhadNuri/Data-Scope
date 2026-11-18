'use client';

export type ErrorDetail = {
  field?: string;
  path?: string;
  message: string;
};

export type ErrorMessageProps = {
  message: string;
  details?: ErrorDetail[];
  onRetry?: () => void;
  className?: string;
};

// Red bordered error box showing error messages and field details
export function ErrorMessage({
  message,
  details,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      className={`p-3 border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 rounded text-xs ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{message}</p>
          {details && details.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside space-x-0 space-y-0.5 text-[11px] opacity-90">
              {details.map((d, i) => (
                <li key={i}>
                  {d.field || d.path ? (
                    <span className="font-mono font-semibold">{d.field || d.path}: </span>
                  ) : null}
                  {d.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-3 underline text-[11px] font-semibold hover:opacity-80 shrink-0"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
