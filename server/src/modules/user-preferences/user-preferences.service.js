import * as userPreferencesModel from './user-preferences.model.js';

export const DEFAULT_PREFERENCES = {
  theme: 'system',
  defaultPageSize: 25,
  visibleColumns: {},
};

// Formats preferences by merging stored settings over default values
function formatWithDefaults(stored = {}) {
  const safeStored = stored || {};
  return {
    theme: safeStored.theme || DEFAULT_PREFERENCES.theme,
    defaultPageSize: safeStored.defaultPageSize || DEFAULT_PREFERENCES.defaultPageSize,
    visibleColumns: {
      ...DEFAULT_PREFERENCES.visibleColumns,
      ...(safeStored.visibleColumns || {}),
    },
  };
}

// Retrieves preferences for a user, returning defaults if no row exists without writing to DB
export async function getPreferences(userId) {
  const stored = await userPreferencesModel.findByUserId(userId);
  return formatWithDefaults(stored);
}

// Updates preferences, merging top-level keys and dataset-specific visibleColumns
export async function updatePreferences(userId, updates) {
  const existing = (await userPreferencesModel.findByUserId(userId)) || {};

  // MERGE RULE:
  // 1. Top-level keys (theme, defaultPageSize) sent in the request replace the old values.
  // 2. Inside visibleColumns, only the sent dataset IDs are replaced, while column configurations
  //    for other datasets are retained. This allows independent per-dataset view customization.
  const existingVisibleColumns = existing.visibleColumns || {};
  const mergedVisibleColumns =
    updates.visibleColumns !== undefined
      ? { ...existingVisibleColumns, ...updates.visibleColumns }
      : existingVisibleColumns;

  const merged = {
    theme: updates.theme !== undefined ? updates.theme : (existing.theme || DEFAULT_PREFERENCES.theme),
    defaultPageSize:
      updates.defaultPageSize !== undefined
        ? updates.defaultPageSize
        : (existing.defaultPageSize || DEFAULT_PREFERENCES.defaultPageSize),
    visibleColumns: mergedVisibleColumns,
  };

  const saved = await userPreferencesModel.upsert(userId, merged);
  return formatWithDefaults(saved);
}
