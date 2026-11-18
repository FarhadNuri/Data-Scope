import { api } from '../lib/api';
import type { Preferences } from '../types/preferences';

// Fetches the stored preferences for the logged-in user
export async function getPreferences() {
  const res = await api<Preferences>('/preferences');
  return res.data;
}

// Persists updated preferences (theme, defaultPageSize, or dataset visibleColumns)
export async function savePreferences(partial: Partial<Preferences>) {
  const res = await api<Preferences>('/preferences', {
    method: 'PUT',
    body: partial,
  });
  return res.data;
}
