import * as searchHistoryModel from './search-history.model.js';
import { hashObject } from '../../utils/hash-object.js';
import { HttpError } from '../../utils/http-error.js';
import { calculateOffset, buildPaginationMeta } from '../../utils/pagination.js';

// Records an executed search query in the background.
// WHY: This function must NEVER throw an error. Search logging is fire-and-forget;
// any database failure here must not interrupt or fail the user's search response.
export async function record(userId, datasetId, config, resultCount, tookMs) {
  try {
    // Compute config hash excluding page and pageSize so repeated searches with different
    // page numbers share the exact same hash for deduplication and analytics
    const { page, pageSize, ...configWithoutPagination } = config || {};
    const configHash = hashObject(configWithoutPagination);

    await searchHistoryModel.insert({
      userId,
      datasetId,
      config,
      configHash,
      resultCount: resultCount || 0,
      tookMs: tookMs || 0,
    });
  } catch (error) {
    const errorDetails = error.message || error.errors?.map((e) => e.message).join(', ') || error.code || error;
    console.warn('[SEARCH HISTORY WARNING] Failed to record search history:', errorDetails);
  }
}

// Lists the authenticated user's distinct search history, newest execution first
export async function list(userId, { datasetId, page = 1, pageSize = 20 }) {
  const offset = calculateOffset(page, pageSize);

  const [items, totalItems] = await Promise.all([
    searchHistoryModel.findDistinctByUser(userId, { datasetId, limit: pageSize, offset }),
    searchHistoryModel.countDistinctByUser(userId, { datasetId }),
  ]);

  const meta = buildPaginationMeta(page, pageSize, totalItems);
  return { items, meta };
}

// Hides all instances of a query configuration from the user's history list
export async function hideOne(userId, id) {
  const targetRow = await searchHistoryModel.findUserRowById(id, userId);
  if (!targetRow) {
    throw new HttpError(404, 'Search history entry not found');
  }

  // NO CLEANUP JOB: Hides all rows matching (userId, datasetId, configHash) so the query
  // disappears from the UI while keeping historical rows preserved for platform analytics.
  await searchHistoryModel.hideByConfigHash(
    userId,
    targetRow.dataset_id,
    targetRow.config_hash
  );
}

// Hides all search history entries for the user
export async function hideAll(userId) {
  await searchHistoryModel.hideAllByUser(userId);
}
