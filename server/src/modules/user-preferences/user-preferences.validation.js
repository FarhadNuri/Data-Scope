import { HttpError } from '../../utils/http-error.js';
import { isUuid } from '../../utils/validate.js';

const ALLOWED_THEMES = ['light', 'dark', 'system'];
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const COLUMN_KEY_REGEX = /^[a-z][a-z0-9_]{0,49}$/;

// Validates the PUT /preferences body payload
export function validatePreferences(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'body', message: 'Request body must be a JSON object' },
    ]);
  }

  // 1. Theme validation (optional: 'light' | 'dark' | 'system')
  if (body.theme !== undefined) {
    if (!ALLOWED_THEMES.includes(body.theme)) {
      details.push({
        field: 'theme',
        message: 'theme must be one of: light, dark, system',
      });
    }
  }

  // 2. Default page size validation (optional: 10 | 25 | 50 | 100)
  if (body.defaultPageSize !== undefined) {
    if (!ALLOWED_PAGE_SIZES.includes(body.defaultPageSize)) {
      details.push({
        field: 'defaultPageSize',
        message: 'defaultPageSize must be one of: 10, 25, 50, 100',
      });
    }
  }

  // 3. Visible columns validation (optional: object of datasetId -> string[])
  if (body.visibleColumns !== undefined) {
    if (!body.visibleColumns || typeof body.visibleColumns !== 'object' || Array.isArray(body.visibleColumns)) {
      details.push({
        field: 'visibleColumns',
        message: 'visibleColumns must be an object with dataset UUID keys',
      });
    } else {
      const datasetIds = Object.keys(body.visibleColumns);
      if (datasetIds.length > 50) {
        details.push({
          field: 'visibleColumns',
          message: 'visibleColumns cannot configure more than 50 datasets',
        });
      } else {
        for (const datasetId of datasetIds) {
          if (!isUuid(datasetId)) {
            details.push({
              field: `visibleColumns.${datasetId}`,
              message: 'dataset key must be a valid UUID',
            });
            continue;
          }

          const columns = body.visibleColumns[datasetId];
          if (!Array.isArray(columns)) {
            details.push({
              field: `visibleColumns.${datasetId}`,
              message: 'value must be an array of column keys',
            });
          } else if (columns.length > 50) {
            details.push({
              field: `visibleColumns.${datasetId}`,
              message: 'cannot specify more than 50 columns for a dataset',
            });
          } else {
            for (let i = 0; i < columns.length; i++) {
              const col = columns[i];
              const isValid =
                typeof col === 'string' &&
                (col === 'created_at' || col === 'updated_at' || COLUMN_KEY_REGEX.test(col));

              if (!isValid) {
                details.push({
                  field: `visibleColumns.${datasetId}[${i}]`,
                  message: `Invalid column key "${col}". Must match lowercase identifier regex or be created_at/updated_at`,
                });
              }
            }
          }
        }
      }
    }
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    theme: body.theme,
    defaultPageSize: body.defaultPageSize,
    visibleColumns: body.visibleColumns,
  };
}
