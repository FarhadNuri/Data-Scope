import * as analyticsModel from './analytics.model.js';
import * as datasetFieldsService from '../dataset-fields/dataset-fields.service.js';
import * as permissionsService from '../permissions/permissions.service.js';
import * as cacheService from '../../cache/cache.service.js';
import { analyticsKey } from '../../cache/cache-keys.js';
import { hashObject } from '../../utils/hash-object.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

const INTERVAL_WHITELIST = { day: 'day', week: 'week', month: 'month' };

// Retrieves platform-wide high level statistics (Admin only)
export async function getCountsOverview() {
  return analyticsModel.countsOverview();
}

// Retrieves dataset summary with category and status distributions (cached 5 min)
export async function getDatasetSummary(datasetId) {
  const version = await cacheService.getDatasetVersion(datasetId);
  const cacheKey = analyticsKey(datasetId, version, 'summary');
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  const categoryKey = fields.some((f) => f.key === 'category') ? 'category' : null;
  const statusKey = fields.some((f) => f.key === 'status') ? 'status' : null;

  const result = await analyticsModel.datasetSummary(datasetId, categoryKey, statusKey);
  cacheService.set(cacheKey, result, 300).catch(() => {});
  return result;
}

// Retrieves time-series record creation growth metrics (cached 5 min)
export async function getDatasetGrowth(datasetId, { interval = 'month', from, to } = {}) {
  const intervalSql = INTERVAL_WHITELIST[interval];
  if (!intervalSql) {
    throw new HttpError(400, 'Invalid interval. Allowed intervals are: day, week, month');
  }

  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(toDate.getTime()) || Number.isNaN(fromDate.getTime())) {
    throw new HttpError(400, 'Invalid date format. Expected ISO-8601 strings');
  }

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    throw new HttpError(400, 'from date must be before or equal to to date');
  }
  if (intervalSql === 'day' && diffDays > 366) {
    throw new HttpError(400, 'Day interval range cannot exceed 366 days');
  }
  if ((intervalSql === 'week' || intervalSql === 'month') && diffDays > 365 * 5 + 2) {
    throw new HttpError(400, 'Range cannot exceed 5 years');
  }

  const version = await cacheService.getDatasetVersion(datasetId);
  const paramHash = hashObject({ interval: intervalSql, from: fromDate.toISOString(), to: toDate.toISOString() });
  const cacheKey = analyticsKey(datasetId, version, `growth:${paramHash}`);

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await analyticsModel.growth(datasetId, intervalSql, fromDate.toISOString(), toDate.toISOString());
  cacheService.set(cacheKey, result, 300).catch(() => {});
  return result;
}

// Retrieves search history volume and execution performance over the requested days
export async function getSearchActivity(user, { days = 30, scope = 'me' } = {}) {
  const parsedDays = parseInt(days, 10) || 30;
  if (parsedDays < 1 || parsedDays > 90) {
    throw new HttpError(400, 'days parameter must be between 1 and 90');
  }

  if (scope === 'all' && user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only admins can view global search activity');
  }

  const targetUserId = scope === 'all' ? null : user.id;
  return analyticsModel.searchActivity(targetUserId, parsedDays);
}

// Retrieves the most frequently utilized filter combinations
export async function getTopFilters(user, { datasetId, limit = 10, scope = 'me' } = {}) {
  const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));

  if (scope === 'all' && user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only admins can view global top filters');
  }

  if (datasetId) {
    if (!isUuid(datasetId)) {
      throw new HttpError(400, 'Invalid dataset ID format');
    }
    const canView = await permissionsService.canUserViewDataset(user, datasetId);
    if (!canView) {
      throw new HttpError(403, 'You do not have access to this dataset');
    }
  }

  const targetUserId = scope === 'all' ? null : user.id;
  return analyticsModel.topFilters(targetUserId, datasetId || null, parsedLimit);
}
