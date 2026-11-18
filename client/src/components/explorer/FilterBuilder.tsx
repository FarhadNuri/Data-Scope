'use client';

import { useState } from 'react';
import { ConditionRow } from './ConditionRow';
import { isConditionComplete, serializeCondition } from './operators';
import * as recordsService from '@/services/records.service';
import type { DatasetField } from '@/types/dataset';
import type { Condition, SearchRequest } from '@/types/search';
import type { Role } from '@/types/auth';

type FilterBuilderProps = {
  datasetId: string;
  fields: DatasetField[];
  conditions: Condition[];
  logic: 'AND' | 'OR';
  role: Role;
  onAddCondition: (c: Condition) => void;
  onUpdateCondition: (index: number, updated: Condition) => void;
  onRemoveCondition: (index: number) => void;
  onClearConditions: () => void;
  onLogicChange: (logic: 'AND' | 'OR') => void;
};

export function FilterBuilder({
  datasetId,
  fields,
  conditions,
  logic,
  role,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onClearConditions,
  onLogicChange,
}: FilterBuilderProps) {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors?: { path?: string; message: string }[];
  } | null>(null);

  const maxConditions = role === 'VIEWER' ? 3 : 10;
  const isLimitReached = conditions.length >= maxConditions;
  const filterable = fields.filter((f) => f.isFilterable);

  const handleAdd = () => {
    if (isLimitReached || filterable.length === 0) return;
    onAddCondition({ field: filterable[0].key, operator: 'eq', value: '' });
    setValidation(null);
  };

  const handleCheck = async () => {
    setValidating(true);
    setValidation(null);
    try {
      const typeMap = new Map(fields.map((f) => [f.key, f.type]));
      const serialized = conditions
        .filter(isConditionComplete)
        .map((c) => serializeCondition(c, typeMap.get(c.field)));

      const body: SearchRequest = { logic, conditions: serialized, page: 1, pageSize: 25 };
      const res = await recordsService.validateSearch(datasetId, body);
      setValidation(res);
    } catch (err) {
      setValidation({
        valid: false,
        errors: [{ message: err instanceof Error ? err.message : 'Validation failed' }],
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded p-3 bg-gray-50 dark:bg-gray-900/60 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Filters:</span>
          {role !== 'VIEWER' ? (
            <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => onLogicChange('AND')}
                className={`px-2 py-0.5 text-[11px] font-semibold ${logic === 'AND' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => onLogicChange('OR')}
                className={`px-2 py-0.5 text-[11px] font-semibold ${logic === 'OR' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
              >
                OR
              </button>
            </div>
          ) : (
            <span className="text-gray-500 font-mono text-[11px]">(Match all: AND)</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={validating || conditions.length === 0}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {validating ? 'Checking...' : 'Check'}
          </button>
          {conditions.length > 0 && (
            <button
              type="button"
              onClick={() => { onClearConditions(); setValidation(null); }}
              className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {validation && (
        <div className={`p-2 rounded text-xs border ${validation.valid ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'}`}>
          {validation.valid ? (
            <p className="font-medium">✓ Filters are valid</p>
          ) : (
            <div className="space-y-0.5">
              <p className="font-semibold">Validation issues:</p>
              {validation.errors?.map((e, i) => (
                <p key={i} className="text-[11px]">{e.path ? `${e.path}: ` : ''}{e.message}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {conditions.length > 0 ? (
        <div className="space-y-1">
          {conditions.map((cond, idx) => (
            <ConditionRow
              key={idx}
              datasetId={datasetId}
              fields={fields}
              condition={cond}
              role={role}
              onChange={(u) => { onUpdateCondition(idx, u); setValidation(null); }}
              onRemove={() => { onRemoveCondition(idx); setValidation(null); }}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 py-1">No active filter conditions.</p>
      )}

      <div className="flex items-center space-x-3 pt-1">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isLimitReached}
          className="px-2.5 py-1 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
        >
          + Add condition
        </button>
        {isLimitReached && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            {role === 'VIEWER' ? 'Viewers can add up to 3 conditions.' : 'Maximum 10 conditions reached.'}
          </span>
        )}
      </div>
    </div>
  );
}
