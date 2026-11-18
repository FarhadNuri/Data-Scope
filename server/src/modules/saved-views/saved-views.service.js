import * as savedViewsModel from './saved-views.model.js';
import * as permissionsService from '../permissions/permissions.service.js';
import * as datasetFieldsService from '../dataset-fields/dataset-fields.service.js';
import * as usersModel from '../users/users.model.js';
import { validateOrThrow } from '../search/search-validator.js';
import { normalizeRequest } from '../search/normalize-request.js';
import { calculateOffset, buildPaginationMeta } from '../../utils/pagination.js';
import { HttpError } from '../../utils/http-error.js';

// Validates a view's search configuration against dataset fields and saving user role.
// Supplies default page: 1, pageSize: 25 for validateOrThrow, then strips them.
async function validateConfig(datasetId, config, role) {
  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  const normalized = normalizeRequest({ ...config, page: 1, pageSize: 25 });
  validateOrThrow(normalized, fields, role);
  const { page, pageSize, ...cleanConfig } = normalized;
  return cleanConfig;
}

// Lists accessible saved views for the current user
export async function listViews(user, { datasetId, scope = 'all', page = 1, pageSize = 20 } = {}) {
  const accessibleDatasetIds = await permissionsService.listAccessibleDatasetIds(user);
  if (accessibleDatasetIds.length === 0) return { data: [], meta: buildPaginationMeta(page, pageSize, 0) };
  if (datasetId && !accessibleDatasetIds.includes(datasetId)) return { data: [], meta: buildPaginationMeta(page, pageSize, 0) };

  const offset = calculateOffset(page, pageSize);
  const { rows, totalItems } = await savedViewsModel.findAccessibleViews(
    user.id, accessibleDatasetIds, { datasetId, scope, limit: pageSize, offset }
  );
  return { data: rows, meta: buildPaginationMeta(page, pageSize, totalItems) };
}

// Creates a new saved view
export async function createView(user, { name, datasetId, config }) {
  const canView = await permissionsService.canUserViewDataset(user, datasetId);
  if (!canView) throw new HttpError(403, 'You do not have access to this dataset');

  const duplicate = await savedViewsModel.findByNameAndDataset(user.id, datasetId, name);
  if (duplicate) throw new HttpError(409, 'A saved view with this name already exists on this dataset');

  const cleanConfig = await validateConfig(datasetId, config, user.role);
  return savedViewsModel.create({ ownerId: user.id, datasetId, name, config: cleanConfig });
}

// Retrieves a single saved view by ID
export async function getViewById(id, user) {
  const view = await savedViewsModel.findById(id);
  if (!view) throw new HttpError(404, 'Saved view not found');

  const canViewDataset = await permissionsService.canUserViewDataset(user, view.datasetId);
  if (!canViewDataset) throw new HttpError(404, 'Saved view not found');

  const isOwner = view.owner.id === user.id;
  const isShared = !isOwner && (await savedViewsModel.isSharedWith(id, user.id));
  if (!isOwner && !isShared) throw new HttpError(404, 'Saved view not found');

  // NOTE: Viewers can open views shared with them, even with advanced operators. Search endpoint guards execution.
  return { ...view, isShared: !isOwner };
}

// Updates an existing saved view (owner only)
export async function updateView(id, user, { name, config }) {
  const view = await savedViewsModel.findById(id);
  // Non-owners receive 404 to avoid revealing view existence
  if (!view || view.owner.id !== user.id) throw new HttpError(404, 'Saved view not found');

  if (name) {
    const duplicate = await savedViewsModel.findByNameAndDataset(user.id, view.datasetId, name, id);
    if (duplicate) throw new HttpError(409, 'A saved view with this name already exists on this dataset');
  }

  let cleanConfig;
  if (config) cleanConfig = await validateConfig(view.datasetId, config, user.role);
  return savedViewsModel.update(id, { name, config: cleanConfig }, user.id);
}

// Deletes a saved view (owner only)
export async function deleteView(id, user) {
  const view = await savedViewsModel.findById(id);
  if (!view || view.owner.id !== user.id) throw new HttpError(404, 'Saved view not found');
  await savedViewsModel.deleteById(id);
}

// Shares a saved view with other users (owner only)
export async function shareView(id, user, userIds) {
  const view = await savedViewsModel.findById(id);
  if (!view || view.owner.id !== user.id) throw new HttpError(404, 'Saved view not found');

  const targetUserIds = userIds.filter((uid) => uid !== user.id);
  const ineligibleUsers = [];

  for (const uid of targetUserIds) {
    const targetUser = await usersModel.findById(uid);
    if (!targetUser) {
      ineligibleUsers.push(uid);
      continue;
    }
    const canView = await permissionsService.canUserViewDataset(targetUser, view.datasetId);
    if (!canView) ineligibleUsers.push(uid);
  }

  if (ineligibleUsers.length > 0) {
    throw new HttpError(400, 'Cannot share view: the following users do not have access to this dataset', ineligibleUsers);
  }

  await savedViewsModel.addShares(id, targetUserIds);
  const sharedWith = await savedViewsModel.getShares(id);
  return { sharedWith };
}

// Removes a share mapping for a user (owner only)
export async function removeShare(id, user, targetUserId) {
  const view = await savedViewsModel.findById(id);
  if (!view || view.owner.id !== user.id) throw new HttpError(404, 'Saved view not found');
  await savedViewsModel.removeShare(id, targetUserId);
}
