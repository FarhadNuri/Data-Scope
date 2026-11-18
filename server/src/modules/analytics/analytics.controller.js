import * as analyticsService from './analytics.service.js';

// GET /api/v1/analytics/overview
export async function getOverview(req, res) {
  const data = await analyticsService.getCountsOverview();
  res.json({ success: true, data });
}

// GET /api/v1/analytics/datasets/:datasetId/summary
export async function getDatasetSummary(req, res) {
  const data = await analyticsService.getDatasetSummary(req.params.datasetId);
  res.json({ success: true, data });
}

// GET /api/v1/analytics/datasets/:datasetId/growth
export async function getDatasetGrowth(req, res) {
  const data = await analyticsService.getDatasetGrowth(req.params.datasetId, req.query);
  res.json({ success: true, data });
}

// GET /api/v1/analytics/search-activity
export async function getSearchActivity(req, res) {
  const data = await analyticsService.getSearchActivity(req.user, req.query);
  res.json({ success: true, data });
}

// GET /api/v1/analytics/top-filters
export async function getTopFilters(req, res) {
  const data = await analyticsService.getTopFilters(req.user, req.query);
  res.json({ success: true, data });
}
