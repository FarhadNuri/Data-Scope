import * as savedViewsService from './saved-views.service.js';
import {
  validateCreateView,
  validateUpdateView,
  validateShareView,
} from './saved-views.validation.js';

// GET /api/v1/saved-views
export async function listViews(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const scope = ['mine', 'shared', 'all'].includes(req.query.scope) ? req.query.scope : 'all';

  const result = await savedViewsService.listViews(req.user, {
    datasetId: req.query.datasetId,
    scope,
    page,
    pageSize,
  });

  res.json({ success: true, data: result.data, meta: result.meta });
}

// POST /api/v1/saved-views
export async function createView(req, res) {
  const validated = validateCreateView(req.body);
  const view = await savedViewsService.createView(req.user, validated);
  res.status(201).json({ success: true, data: view });
}

// GET /api/v1/saved-views/:id
export async function getViewById(req, res) {
  const view = await savedViewsService.getViewById(req.params.id, req.user);
  res.json({ success: true, data: view });
}

// PATCH /api/v1/saved-views/:id
export async function updateView(req, res) {
  const validated = validateUpdateView(req.body);
  const view = await savedViewsService.updateView(req.params.id, req.user, validated);
  res.json({ success: true, data: view });
}

// DELETE /api/v1/saved-views/:id
export async function deleteView(req, res) {
  await savedViewsService.deleteView(req.params.id, req.user);
  res.status(204).end();
}

// POST /api/v1/saved-views/:id/share
export async function shareView(req, res) {
  const validated = validateShareView(req.body);
  const result = await savedViewsService.shareView(req.params.id, req.user, validated.userIds);
  res.json({ success: true, data: result });
}

// DELETE /api/v1/saved-views/:id/share/:userId
export async function removeShare(req, res) {
  await savedViewsService.removeShare(req.params.id, req.user, req.params.userId);
  res.status(204).end();
}
