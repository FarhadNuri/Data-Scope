'use client';

import { useId } from 'react';

export type InputProps = {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
};

// Accessible text/number input with an associated label and error message
export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  maxLength,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-1.5 text-xs rounded border bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 disabled:opacity-50 focus:outline-none ${
          error
            ? 'border-red-400 dark:border-red-600 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500'
        }`}
      />

      {error && (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
