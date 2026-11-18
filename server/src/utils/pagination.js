// Calculates SQL OFFSET given page and pageSize
export function calculateOffset(page, pageSize) {
  return (page - 1) * pageSize;
}

// Builds the standard pagination metadata object for list responses
export function buildPaginationMeta(page, pageSize, totalItems) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

// Parses and sanitizes page and pageSize from query parameters.
// Defaults: page = 1 (minimum 1), pageSize = 25 (minimum 1, maximum 100).
export function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let pageSize = parseInt(query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    pageSize = 25;
  }

  return { page, pageSize };
}
