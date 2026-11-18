'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import * as datasetsService from '@/services/datasets.service';
import type { DatasetField } from '@/types/dataset';

type RecordFieldInputProps = {
  datasetId: string;
  field: DatasetField;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean;
};

export function RecordFieldInput({
  datasetId,
  field,
  value,
  onChange,
  disabled = false,
}: RecordFieldInputProps) {
  const [selectOptions, setSelectOptions] = useState<string[]>([]);

  useEffect(() => {
    if (field.type === 'select' && field.id) {
      datasetsService
        .getFieldValues(datasetId, field.id, undefined, 100)
        .then((vals) => setSelectOptions(vals))
        .catch(() => setSelectOptions([]));
    }
  }, [datasetId, field.id, field.type]);

  const label = field.label || field.key;

  if (field.type === 'boolean') {
    const stringVal = value === true ? 'true' : value === false ? 'false' : '';
    return (
      <Select
        label={label}
        value={stringVal}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'true') onChange(true);
          else if (val === 'false') onChange(false);
          else onChange(null);
        }}
        options={[
          { value: '', label: 'Select boolean...' },
          { value: 'true', label: 'Yes (true)' },
          { value: 'false', label: 'No (false)' },
        ]}
      />
    );
  }

  if (field.type === 'select') {
    const stringVal = typeof value === 'string' ? value : '';
    // Ensure current value is included in options if not present
    const allOptions = Array.from(new Set([...(stringVal ? [stringVal] : []), ...selectOptions]));
    return (
      <Select
        label={label}
        value={stringVal}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        options={[
          { value: '', label: 'Select option...' },
          ...allOptions.map((opt) => ({ value: opt, label: opt })),
        ]}
      />
    );
  }

  if (field.type === 'number') {
    const numVal = value !== null && value !== undefined ? String(value) : '';
    return (
      <Input
        label={label}
        type="number"
        value={numVal}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? null : Number(val));
        }}
        placeholder="Enter number..."
      />
    );
  }

  if (field.type === 'date') {
    let dateStr = '';
    if (typeof value === 'string' && value) {
      dateStr = value.includes('T') ? value.split('T')[0] : value;
    }
    return (
      <Input
        label={label}
        type="date"
        value={dateStr}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  // Default to text
  return (
    <Input
      label={label}
      type="text"
      value={typeof value === 'string' ? value : value ? String(value) : ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}...`}
    />
  );
}
