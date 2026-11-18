import * as searchHistoryService from './search-history.service.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

// GET /api/v1/search-history
export async function getHistory(req, res) {
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) pageSize = 20;

  let datasetId = null;
  if (req.query.datasetId) {
    if (!isUuid(req.query.datasetId)) {
      throw new HttpError(400, 'Invalid dataset ID format');
    }
    datasetId = req.query.datasetId;
  }

  const { items, meta } = await searchHistoryService.list(req.user.id, {
    datasetId,
    page,
    pageSize,
  });

  res.status(200).json({
    success: true,
    data: items,
    meta,
  });
}

// DELETE /api/v1/search-history/:id
export async function deleteHistoryItem(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid history entry ID format');
  }

  await searchHistoryService.hideOne(req.user.id, req.params.id);
  res.status(204).end();
}

// DELETE /api/v1/search-history
export async function clearHistory(req, res) {
  await searchHistoryService.hideAll(req.user.id);
  res.status(204).end();
}
