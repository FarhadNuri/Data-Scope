import { HttpError } from '../../utils/http-error.js';
import {
  MAX_CONDITIONS,
  MAX_SORT_COLUMNS,
  MAX_SEARCH_LENGTH,
  MAX_PAGE_SIZE,
  MAX_OFFSET,
  MAX_IN_VALUES,
  MIN_PARTIAL_SEARCH_LENGTH,
  VIEWER_ALLOWED_OPERATORS,
  VIEWER_MAX_CONDITIONS,
  OPERATORS_BY_TYPE,
  SYSTEM_FIELDS,
} from './search.constants.js';

// Validates a search request against dataset schema and user role constraints.
// Pure function: NEVER throws, always returns an array of { path, message, isViewerLimit? } objects.
export function validateSearchRequest(request, fields = [], role = 'VIEWER') {
  const errors = [];

  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return [{ path: 'body', message: 'Request body must be a JSON object' }];
  }

  // 1. Logic validation
  if (request.logic !== undefined) {
    if (request.logic !== 'AND' && request.logic !== 'OR') {
      errors.push({ path: 'logic', message: 'logic must be either "AND" or "OR"' });
    } else if (role === 'VIEWER' && request.logic === 'OR') {
      errors.push({
        path: 'logic',
        message: 'Viewer accounts can only use "AND" logic',
        isViewerLimit: true,
      });
    }
  }

  // 2. Search text and search mode validation
  if (request.search !== undefined && request.search !== null) {
    if (typeof request.search !== 'string') {
      errors.push({ path: 'search', message: 'search must be a string' });
    } else if (request.search.length > MAX_SEARCH_LENGTH) {
      errors.push({
        path: 'search',
        message: `search text cannot exceed ${MAX_SEARCH_LENGTH} characters`,
      });
    } else {
      const trimmed = request.search.trim();
      const mode = request.searchMode || 'fulltext';
      if (mode === 'partial' && trimmed.length > 0 && trimmed.length < MIN_PARTIAL_SEARCH_LENGTH) {
        errors.push({
          path: 'search',
          message: `Partial search requires at least ${MIN_PARTIAL_SEARCH_LENGTH} characters`,
        });
      }
    }
  }

  if (request.searchMode !== undefined) {
    if (request.searchMode !== 'fulltext' && request.searchMode !== 'partial') {
      errors.push({
        path: 'searchMode',
        message: 'searchMode must be either "fulltext" or "partial"',
      });
    }
  }

  // Build field lookup dictionary: system fields + dataset schema fields
  const fieldMap = new Map();
  Object.values(SYSTEM_FIELDS).forEach((f) => fieldMap.set(f.key, f));
  fields.forEach((f) => fieldMap.set(f.key, f));

  // 3. Conditions validation
  if (request.conditions !== undefined) {
    if (!Array.isArray(request.conditions)) {
      errors.push({ path: 'conditions', message: 'conditions must be an array' });
    } else {
      if (request.conditions.length > MAX_CONDITIONS) {
        errors.push({
          path: 'conditions',
          message: `Maximum ${MAX_CONDITIONS} conditions allowed`,
        });
      }

      if (role === 'VIEWER' && request.conditions.length > VIEWER_MAX_CONDITIONS) {
        errors.push({
          path: 'conditions',
          message: `Viewer accounts can use at most ${VIEWER_MAX_CONDITIONS} conditions`,
          isViewerLimit: true,
        });
      }

      request.conditions.forEach((c, index) => {
        const pathPrefix = `conditions[${index}]`;

        if (!c || typeof c !== 'object') {
          errors.push({ path: pathPrefix, message: 'Condition must be an object' });
          return;
        }

        const fieldDef = fieldMap.get(c.field);
        if (!fieldDef) {
          errors.push({
            path: `${pathPrefix}.field`,
            message: `Unknown field "${c.field}"`,
          });
          return;
        }

        if (!fieldDef.isFilterable) {
          errors.push({
            path: `${pathPrefix}.field`,
            message: `Field "${c.field}" is not filterable`,
          });
        }

        const allowedOps = OPERATORS_BY_TYPE[fieldDef.type] || [];
        if (!c.operator || !allowedOps.includes(c.operator)) {
          errors.push({
            path: `${pathPrefix}.operator`,
            message: `'${c.operator}' is not valid for a ${fieldDef.type} field`,
          });
          return;
        }

        if (role === 'VIEWER' && !VIEWER_ALLOWED_OPERATORS.includes(c.operator)) {
          errors.push({
            path: `${pathPrefix}.operator`,
            message: `Viewer accounts cannot use the '${c.operator}' operator`,
            isViewerLimit: true,
          });
        }

        // Validate value against operator and field type
        validateConditionValue(c, fieldDef, pathPrefix, errors);
      });
    }
  }

  // 4. Sort validation
  if (request.sort !== undefined) {
    if (!Array.isArray(request.sort)) {
      errors.push({ path: 'sort', message: 'sort must be an array' });
    } else {
      if (request.sort.length > MAX_SORT_COLUMNS) {
        errors.push({
          path: 'sort',
          message: `Maximum ${MAX_SORT_COLUMNS} sort columns allowed`,
        });
      }

      const seenSortFields = new Set();

      request.sort.forEach((s, index) => {
        const pathPrefix = `sort[${index}]`;
        if (!s || typeof s !== 'object') {
          errors.push({ path: pathPrefix, message: 'Sort entry must be an object' });
          return;
        }

        const fieldDef = fieldMap.get(s.field);
        if (!fieldDef) {
          errors.push({ path: `${pathPrefix}.field`, message: `Unknown field "${s.field}"` });
          return;
        }

        if (!fieldDef.isSortable) {
          errors.push({
            path: `${pathPrefix}.field`,
            message: `Field "${s.field}" is not sortable`,
          });
        }

        if (seenSortFields.has(s.field)) {
          errors.push({
            path: `${pathPrefix}.field`,
            message: `Duplicate sort field "${s.field}"`,
          });
        } else {
          seenSortFields.add(s.field);
        }

        const dir = typeof s.direction === 'string' ? s.direction.toLowerCase() : '';
        if (dir !== 'asc' && dir !== 'desc') {
          errors.push({
            path: `${pathPrefix}.direction`,
            message: 'direction must be "asc" or "desc"',
          });
        }
      });
    }
  }

  // 5. Columns validation
  if (request.columns !== undefined && request.columns !== null) {
    if (!Array.isArray(request.columns)) {
      errors.push({ path: 'columns', message: 'columns must be an array' });
    } else {
      if (request.columns.length > 50) {
        errors.push({ path: 'columns', message: 'Cannot select more than 50 columns' });
      }
      request.columns.forEach((col, index) => {
        if (typeof col !== 'string' || !fieldMap.has(col)) {
          errors.push({
            path: `columns[${index}]`,
            message: `Unknown column "${col}"`,
          });
        }
      });
    }
  }

  // 6. Pagination limits & depth cap
  let page = 1;
  let pageSize = 25;

  if (request.page !== undefined) {
    if (!Number.isInteger(request.page) || request.page < 1) {
      errors.push({ path: 'page', message: 'page must be a positive integer' });
    } else {
      page = request.page;
    }
  }

  if (request.pageSize !== undefined) {
    if (
      !Number.isInteger(request.pageSize) ||
      request.pageSize < 1 ||
      request.pageSize > MAX_PAGE_SIZE
    ) {
      errors.push({
        path: 'pageSize',
        message: `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}`,
      });
    } else {
      pageSize = request.pageSize;
    }
  }

  if (page * pageSize > MAX_OFFSET) {
    errors.push({
      path: 'page',
      message: 'Too many pages. Narrow your filters instead of paging this deep.',
    });
  }

  return errors;
}

// Helper validating condition value per operator and field type
function validateConditionValue(condition, fieldDef, pathPrefix, errors) {
  const { operator, value } = condition;

  // isEmpty and isNotEmpty require no value
  if (operator === 'isEmpty' || operator === 'isNotEmpty') {
    return;
  }

  if (value === undefined || value === null) {
    errors.push({ path: `${pathPrefix}.value`, message: `value is required for '${operator}'` });
    return;
  }

  if (operator === 'between') {
    if (!Array.isArray(value) || value.length !== 2) {
      errors.push({
        path: `${pathPrefix}.value`,
        message: 'between operator requires an array of exactly 2 items [min, max]',
      });
      return;
    }

    if (fieldDef.type === 'number') {
      if (typeof value[0] !== 'number' || !Number.isFinite(value[0])) {
        errors.push({ path: `${pathPrefix}.value[0]`, message: 'min must be a finite number' });
      }
      if (typeof value[1] !== 'number' || !Number.isFinite(value[1])) {
        errors.push({ path: `${pathPrefix}.value[1]`, message: 'max must be a finite number' });
      }
      if (typeof value[0] === 'number' && typeof value[1] === 'number' && value[0] > value[1]) {
        errors.push({
          path: `${pathPrefix}.value`,
          message: 'min value cannot be greater than max value',
        });
      }
    } else if (fieldDef.type === 'date') {
      const d1 = Date.parse(value[0]);
      const d2 = Date.parse(value[1]);
      if (typeof value[0] !== 'string' || isNaN(d1)) {
        errors.push({ path: `${pathPrefix}.value[0]`, message: 'from must be a valid ISO date' });
      }
      if (typeof value[1] !== 'string' || isNaN(d2)) {
        errors.push({ path: `${pathPrefix}.value[1]`, message: 'to must be a valid ISO date' });
      }
      if (!isNaN(d1) && !isNaN(d2) && d1 > d2) {
        errors.push({
          path: `${pathPrefix}.value`,
          message: 'from date cannot be after to date',
        });
      }
    }
    return;
  }

  if (operator === 'lastDays') {
    if (!Number.isInteger(value) || value < 1 || value > 3650) {
      errors.push({
        path: `${pathPrefix}.value`,
        message: 'lastDays must be an integer between 1 and 3650',
      });
    }
    return;
  }

  if (operator === 'in') {
    if (!Array.isArray(value) || value.length < 1 || value.length > MAX_IN_VALUES) {
      errors.push({
        path: `${pathPrefix}.value`,
        message: `in operator requires an array of 1 to ${MAX_IN_VALUES} items`,
      });
      return;
    }
    value.forEach((item, itemIdx) => {
      if (typeof item !== 'string' || item.length > 200) {
        errors.push({
          path: `${pathPrefix}.value[${itemIdx}]`,
          message: 'each item must be a string up to 200 characters',
        });
      }
    });
    return;
  }

  // Scalar operators
  switch (fieldDef.type) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push({ path: `${pathPrefix}.value`, message: 'value must be a finite number' });
      }
      break;

    case 'date':
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        errors.push({ path: `${pathPrefix}.value`, message: 'value must be a valid ISO date string' });
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({ path: `${pathPrefix}.value`, message: 'value must be a boolean (true or false)' });
      }
      break;

    case 'text':
    case 'select':
    default:
      if (typeof value !== 'string' || value.length > 200) {
        errors.push({ path: `${pathPrefix}.value`, message: 'value must be a string up to 200 characters' });
      }
      break;
  }
}

// Throws HttpError(403) for Viewer restriction violations, or HttpError(400) for regular validation failures
export function validateOrThrow(request, fields = [], role = 'VIEWER') {
  const errors = validateSearchRequest(request, fields, role);
  if (errors.length === 0) return;

  // Check if any error is due to Viewer account limitations
  const viewerLimitError = errors.find((e) => e.isViewerLimit);
  if (viewerLimitError) {
    throw new HttpError(403, viewerLimitError.message, errors);
  }

  throw new HttpError(400, 'Validation failed', errors);
}
