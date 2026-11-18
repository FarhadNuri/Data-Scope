'use client';

import { getAllowedOperators } from './operators';
import { SelectValuePicker } from './SelectValuePicker';
import type { DatasetField } from '@/types/dataset';
import type { Condition, Operator } from '@/types/search';
import type { Role } from '@/types/auth';

type ConditionRowProps = {
  datasetId: string;
  fields: DatasetField[];
  condition: Condition;
  role: Role;
  onChange: (updated: Condition) => void;
  onRemove: () => void;
};

export function ConditionRow({
  datasetId,
  fields,
  condition,
  role,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const filterableFields = fields.filter((f) => f.isFilterable);
  const currentField = fields.find((f) => f.key === condition.field) || filterableFields[0];
  const fieldType = currentField?.type || 'text';
  const allowedOperators = getAllowedOperators(fieldType, role);

  const handleFieldChange = (newKey: string) => {
    const newField = fields.find((f) => f.key === newKey);
    const ops = getAllowedOperators(newField?.type || 'text', role);
    onChange({ field: newKey, operator: ops[0]?.value || 'eq', value: undefined });
  };

  const handleOperatorChange = (newOp: Operator) => {
    onChange({
      ...condition,
      operator: newOp,
      value: newOp === 'isEmpty' || newOp === 'isNotEmpty' ? undefined : '',
    });
  };

  const renderValueInput = () => {
    const op = condition.operator;
    if (op === 'isEmpty' || op === 'isNotEmpty') {
      return <span className="text-[11px] text-gray-400 italic">No value needed</span>;
    }
    if (op === 'between') {
      const arr = Array.isArray(condition.value) ? condition.value : ['', ''];
      const inputType = fieldType === 'date' ? 'date' : 'number';
      return (
        <div className="flex items-center space-x-1">
          <input
            type={inputType}
            value={arr[0] ?? ''}
            onChange={(e) => onChange({ ...condition, value: [e.target.value, arr[1]] })}
            placeholder={fieldType === 'date' ? 'From' : 'Min'}
            className="w-28 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type={inputType}
            value={arr[1] ?? ''}
            onChange={(e) => onChange({ ...condition, value: [arr[0], e.target.value] })}
            placeholder={fieldType === 'date' ? 'To' : 'Max'}
            className="w-28 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          />
        </div>
      );
    }
    if (op === 'lastDays') {
      return (
        <input
          type="number"
          min={1}
          value={typeof condition.value === 'number' || typeof condition.value === 'string' ? condition.value : ''}
          onChange={(e) => onChange({ ...condition, value: e.target.value ? Number(e.target.value) : '' })}
          placeholder="e.g. 30"
          className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        />
      );
    }
    if (fieldType === 'select') {
      return (
        <SelectValuePicker
          datasetId={datasetId}
          fieldId={currentField.id}
          operator={condition.operator}
          value={condition.value}
          onChange={(v) => onChange({ ...condition, value: v })}
        />
      );
    }
    if (fieldType === 'boolean') {
      const isTrue = condition.value === true || condition.value === 'true';
      const isFalse = condition.value === false || condition.value === 'false';
      return (
        <select
          value={isTrue ? 'true' : isFalse ? 'false' : ''}
          onChange={(e) => onChange({ ...condition, value: e.target.value === 'true' })}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        >
          <option value="" disabled>Select...</option>
          <option value="true">True / Yes</option>
          <option value="false">False / No</option>
        </select>
      );
    }
    return (
      <input
        type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
        value={typeof condition.value === 'string' || typeof condition.value === 'number' ? condition.value : ''}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        placeholder="Value..."
        className="w-48 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-900">
      <select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-medium"
      >
        {filterableFields.map((f) => (
          <option key={f.key} value={f.key}>{f.label || f.key}</option>
        ))}
      </select>
      <select
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as Operator)}
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      >
        {allowedOperators.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
      <div className="flex-1 min-w-[200px] flex items-center">{renderValueInput()}</div>
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs px-1.5 py-1 rounded"
        title="Remove condition"
      >
        ✕
      </button>
    </div>
  );
}
