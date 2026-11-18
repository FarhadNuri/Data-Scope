import * as searchService from './search.service.js';

// Executes search request on dataset records with caching and pagination
export async function searchRecords(req, res) {
  const result = await searchService.search(req.params.datasetId, req.body, req.user);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// Validates search configuration against dataset fields without executing queries
export async function validateSearch(req, res) {
  const result = await searchService.validateSearch(req.params.datasetId, req.body, req.user);
  res.json({
    success: true,
    data: result,
  });
}
