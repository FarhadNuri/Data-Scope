export type SpinnerProps = {
  className?: string;
  text?: string;
};

// Plain text loading indicator without animation
export function Spinner({ className = '', text = 'Loading...' }: SpinnerProps) {
  return (
    <div className={`text-xs text-gray-500 dark:text-gray-400 select-none ${className}`}>
      {text}
    </div>
  );
}
