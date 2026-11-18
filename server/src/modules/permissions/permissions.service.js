import * as permissionsModel from './permissions.model.js';
import * as usersModel from '../users/users.model.js';
import { HttpError } from '../../utils/http-error.js';

// Checks if a dataset exists in the database
export async function datasetExists(datasetId) {
  return permissionsModel.datasetExists(datasetId);
}

// Checks whether a user is authorized to view a dataset
export async function canUserViewDataset(user, datasetId) {
  if (!user) return false;
  // Admins always have access to all datasets
  if (user.role === 'ADMIN') return true;

  const level = await permissionsModel.getUserPermission(datasetId, user.id);
  return Boolean(level);
}

// Checks whether a user is authorized to manage records in a dataset.
// WHY: Admins have full management access across the platform.
// Analysts require an explicit 'manage' permission level for the dataset.
// A user with the 'VIEWER' role can NEVER manage a dataset, even if an access_permissions
// row specifies 'manage'. This enforces the platform rule that Viewer accounts are strictly read-only.
export async function canUserManageDataset(user, datasetId) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'ANALYST') return false; // Viewers are strictly read-only

  const level = await permissionsModel.getUserPermission(datasetId, user.id);
  return level === 'manage';
}

// Lists all dataset IDs accessible to the user
export async function listAccessibleDatasetIds(user) {
  if (!user) return [];
  if (user.role === 'ADMIN') {
    return permissionsModel.listAllDatasetIds();
  }
  return permissionsModel.listUserAccessibleDatasetIds(user.id);
}

// Retrieves the list of users with granted permissions on a dataset
export async function getPermissions(datasetId) {
  const exists = await permissionsModel.datasetExists(datasetId);
  if (!exists) {
    throw new HttpError(404, 'Dataset not found');
  }

  return permissionsModel.findDatasetPermissions(datasetId);
}

// Replaces all granted permissions for a dataset
export async function replacePermissions(datasetId, permissionsList) {
  const exists = await permissionsModel.datasetExists(datasetId);
  if (!exists) {
    throw new HttpError(404, 'Dataset not found');
  }

  const validEntriesToSave = [];

  for (const item of permissionsList) {
    const user = await usersModel.findById(item.userId);
    if (!user) {
      throw new HttpError(400, `User with ID "${item.userId}" does not exist`);
    }

    // Admins automatically possess global access to all datasets.
    // Storing dataset-specific permission rows for an Admin is redundant and therefore ignored.
    if (user.role === 'ADMIN') {
      continue;
    }

    validEntriesToSave.push(item);
  }

  return permissionsModel.replacePermissions(datasetId, validEntriesToSave);
}

// Removes a user's access permission from a dataset
export async function removePermission(datasetId, userId) {
  const exists = await permissionsModel.datasetExists(datasetId);
  if (!exists) {
    throw new HttpError(404, 'Dataset not found');
  }

  await permissionsModel.deletePermission(datasetId, userId);
}
