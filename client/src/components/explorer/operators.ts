import type { FieldType } from '../../types/dataset';
import type { Operator, Condition } from '../../types/search';
import type { Role } from '../../types/auth';

export type OperatorOption = {
  value: Operator;
  label: string;
};

// Operator definitions and labels mapped by field type
export const OPERATORS_BY_TYPE: Record<FieldType, OperatorOption[]> = {
  text: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  number: [
    { value: 'eq', label: 'Equals (=)' },
    { value: 'neq', label: 'Not equals (≠)' },
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'gte', label: 'Greater or equal (≥)' },
    { value: 'lt', label: 'Less than (<)' },
    { value: 'lte', label: 'Less or equal (≤)' },
    { value: 'between', label: 'Between' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  date: [
    { value: 'eq', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'lastDays', label: 'In last N days' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  select: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'in', label: 'In (any of)' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'eq', label: 'Is' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
};

// Returns allowed operators for a field type, respecting the VIEWER role limits
export function getAllowedOperators(type: FieldType, role: Role): OperatorOption[] {
  const all = OPERATORS_BY_TYPE[type] || [];
  if (role === 'VIEWER') {
    // Viewers may only use 'eq' and 'contains' (contains is only valid for text fields)
    if (type === 'text') {
      return all.filter((op) => op.value === 'eq' || op.value === 'contains');
    }
    return all.filter((op) => op.value === 'eq');
  }
  return all;
}

// Checks whether a condition has all required values filled
export function isConditionComplete(condition: Condition): boolean {
  if (!condition.field || !condition.operator) return false;
  if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
    return true;
  }
  if (condition.operator === 'between') {
    const arr = condition.value as unknown[];
    return Array.isArray(arr) && arr.length === 2 && arr[0] !== undefined && arr[0] !== '' && arr[1] !== undefined && arr[1] !== '';
  }
  if (condition.operator === 'in') {
    return Array.isArray(condition.value) && condition.value.length > 0;
  }
  if (condition.operator === 'lastDays') {
    const n = Number(condition.value);
    return !isNaN(n) && n > 0;
  }
  return condition.value !== undefined && condition.value !== null && condition.value !== '';
}

// Formats condition values into correct JSON types expected by backend query builder
export function serializeCondition(condition: Condition, type?: FieldType): Condition {
  if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
    return { field: condition.field, operator: condition.operator };
  }
  if (condition.operator === 'between' && Array.isArray(condition.value)) {
    const [from, to] = condition.value;
    if (type === 'number') {
      return { field: condition.field, operator: condition.operator, value: [Number(from), Number(to)] };
    }
    if (type === 'date') {
      return {
        field: condition.field,
        operator: condition.operator,
        value: [new Date(from).toISOString(), new Date(to).toISOString()],
      };
    }
    return condition;
  }
  if (condition.operator === 'lastDays') {
    return { field: condition.field, operator: condition.operator, value: parseInt(String(condition.value), 10) };
  }
  if (type === 'number') {
    return { field: condition.field, operator: condition.operator, value: Number(condition.value) };
  }
  if (type === 'boolean') {
    return { field: condition.field, operator: condition.operator, value: condition.value === true || condition.value === 'true' };
  }
  if (type === 'date' && condition.value) {
    return { field: condition.field, operator: condition.operator, value: new Date(String(condition.value)).toISOString() };
  }
  return condition;
}
