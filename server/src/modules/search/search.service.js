import * as datasetFieldsService from '../dataset-fields/dataset-fields.service.js';
import * as searchHistoryService from '../search-history/search-history.service.js';
import * as searchModel from './search.model.js';
import * as cacheService from '../../cache/cache.service.js';
import { searchResultKey, filterCountKey } from '../../cache/cache-keys.js';
import { hashObject } from '../../utils/hash-object.js';
import { normalizeRequest } from './normalize-request.js';
import { validateOrThrow, validateSearchRequest } from './search-validator.js';

// AUTHORIZATION & CACHING NOTE (docs/03 TDR-7):
// Authorization is NOT cached here because datasetAccess middleware already ran.
// If a future feature adds per-user/role row filtering, userId or role MUST be in the cache key.

// Step 1: Loads dataset fields
async function loadFields(datasetId) {
  return datasetFieldsService.getFieldsByDatasetId(datasetId);
}

// Step 2: Normalizes search parameters and performs strict validation
function normalizeAndValidate(request, fields, role) {
  const normalized = normalizeRequest(request);
  validateOrThrow(normalized, fields, role);
  return normalized;
}

// Step 3 & 4: Generates search result cache key and checks Redis for cached results
function buildResultCacheKey(datasetId, version, normalized) {
  return searchResultKey(datasetId, version, hashObject(normalized));
}

// Step 5: Generates filter count cache key for reusing total count across pages
function buildCountCacheKey(datasetId, version, normalized) {
  const filterParams = {
    search: normalized.search,
    searchMode: normalized.searchMode,
    logic: normalized.logic,
    conditions: normalized.conditions,
  };
  return filterCountKey(datasetId, version, hashObject(filterParams));
}

// Coordinates execution of search query against model and manages result shaping
async function executeAndFormat(datasetId, normalized, fields, knownTotal, startTime) {
  const { rows, totalItems } = await searchModel.findRecords(
    datasetId,
    normalized,
    fields,
    knownTotal
  );

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / normalized.pageSize) : 0;
  const tookMs = Date.now() - startTime;

  // Step 8: If page requested is beyond totalPages (and totalItems > 0), return empty data array
  const data = normalized.page > totalPages && totalItems > 0 ? [] : rows;

  return {
    result: {
      data,
      meta: {
        page: normalized.page,
        pageSize: normalized.pageSize,
        totalItems,
        totalPages,
        tookMs,
        cached: false,
      },
    },
    totalItems,
  };
}

// Main search service orchestrator
export async function search(datasetId, request, user) {
  const startTime = Date.now();

  // 1. Load dataset fields
  const fields = await loadFields(datasetId);

  // 2. Normalize and validate with user's role
  const normalized = normalizeAndValidate(request, fields, user.role);

  // 3. Read dataset version from Redis for cache isolation
  const version = await cacheService.getDatasetVersion(datasetId);

  // 4. Check result cache
  const resultKey = buildResultCacheKey(datasetId, version, normalized);
  const cachedResult = await cacheService.get(resultKey);

  if (cachedResult) {
    const tookMs = Date.now() - startTime;
    // Step 7: Record search history on cache hits too (still a user search) without awaiting
    searchHistoryService.record(
      user.id,
      datasetId,
      normalized,
      cachedResult.meta.totalItems,
      tookMs
    );

    return {
      ...cachedResult,
      meta: {
        ...cachedResult.meta,
        tookMs,
        cached: true,
      },
    };
  }

  // 5. Count cache: moving to next page reuses the count, the most expensive part of pagination (TDR-4)
  const countKey = buildCountCacheKey(datasetId, version, normalized);
  const cachedCount = await cacheService.get(countKey);
  const knownTotal = cachedCount !== null ? cachedCount : undefined;

  // 6. Miss: call model, compute pagination metadata, and store to Redis
  const { result, totalItems } = await executeAndFormat(
    datasetId,
    normalized,
    fields,
    knownTotal,
    startTime
  );

  // Cache full page result (TTL 60s)
  cacheService.set(resultKey, result, 60).catch(() => {});

  // Cache count result (TTL 5 minutes = 300s) if not already cached
  if (cachedCount === null) {
    cacheService.set(countKey, totalItems, 300).catch(() => {});
  }

  // 7. Record search history in background (without await)
  searchHistoryService.record(user.id, datasetId, normalized, totalItems, result.meta.tookMs);

  return result;
}

// Validates search config without executing queries or recording history
export async function validateSearch(datasetId, request, user) {
  const fields = await loadFields(datasetId);
  const errors = validateSearchRequest(request, fields, user.role);
  return {
    valid: errors.length === 0,
    errors,
  };
}
