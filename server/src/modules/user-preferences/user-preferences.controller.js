import * as userPreferencesService from './user-preferences.service.js';
import { validatePreferences } from './user-preferences.validation.js';

// GET /api/v1/preferences
export async function getPreferences(req, res) {
  const data = await userPreferencesService.getPreferences(req.user.id);
  res.json({ success: true, data });
}

// PUT /api/v1/preferences
export async function updatePreferences(req, res) {
  const validated = validatePreferences(req.body);
  const data = await userPreferencesService.updatePreferences(req.user.id, validated);
  res.json({ success: true, data });
}
