import * as recordsService from './records.service.js';

// GET /api/v1/datasets/:datasetId/records/:recordId
export async function getRecord(req, res) {
  const record = await recordsService.getRecord(req.params.datasetId, req.params.recordId);
  res.json({ success: true, data: record });
}

// GET /api/v1/datasets/:datasetId/records/:recordId/related
export async function getRelated(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

  const result = await recordsService.getRelated(req.params.datasetId, req.params.recordId, req.user, {
    page,
    pageSize,
  });
  res.json({ success: true, data: result.data, meta: result.meta });
}

// GET /api/v1/datasets/:datasetId/records/:recordId/history
export async function getHistory(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

  const result = await recordsService.getHistory(req.params.datasetId, req.params.recordId, {
    page,
    pageSize,
  });
  res.json({ success: true, data: result.data, meta: result.meta });
}

// POST /api/v1/datasets/:datasetId/records
export async function createRecord(req, res) {
  const record = await recordsService.createRecord(req.params.datasetId, req.body, req.user);
  res.status(201).json({ success: true, data: record });
}

// PATCH /api/v1/datasets/:datasetId/records/:recordId
export async function updateRecord(req, res) {
  const record = await recordsService.updateRecord(req.params.datasetId, req.params.recordId, req.body, req.user);
  res.json({ success: true, data: record });
}

// DELETE /api/v1/datasets/:datasetId/records/:recordId
export async function deleteRecord(req, res) {
  await recordsService.deleteRecord(req.params.datasetId, req.params.recordId, req.user);
  res.status(204).end();
}
