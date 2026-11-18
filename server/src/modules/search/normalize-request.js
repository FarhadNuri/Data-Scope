// Normalizes search requests by applying canonical defaults, cleaning text, and stably sorting conditions.
// WHY: In both AND and OR boolean logic, the order of conditions is commutative (A AND B === B AND A).
// By sorting conditions deterministically and canonicalizing text, we ensure that functionally identical
// searches produce identical SHA-256 hashes and Redis cache keys, maximizing cache hit rates
// and avoiding duplicate search history rows.
export function normalizeRequest(request = {}) {
  // 1. Clean search text: remove control characters, trim whitespace, and convert to lowercase
  let search = '';
  if (typeof request.search === 'string') {
    search = request.search.replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  }

  const searchMode = request.searchMode === 'partial' ? 'partial' : 'fulltext';
  const logic = request.logic === 'OR' ? 'OR' : 'AND';

  // 2. Normalize and stably sort conditions
  const conditions = Array.isArray(request.conditions)
    ? request.conditions
        .filter((c) => c && typeof c === 'object')
        .map((c) => ({
          field: String(c.field).trim(),
          operator: String(c.operator).trim(),
          value: c.value,
        }))
        .sort((a, b) => {
          const keyA = `${a.field}:${a.operator}:${JSON.stringify(a.value)}`;
          const keyB = `${b.field}:${b.operator}:${JSON.stringify(b.value)}`;
          return keyA.localeCompare(keyB);
        })
    : [];

  // 3. Normalize sort entries
  const sort = Array.isArray(request.sort)
    ? request.sort
        .filter((s) => s && typeof s === 'object')
        .map((s) => ({
          field: String(s.field).trim(),
          direction: String(s.direction).toLowerCase() === 'desc' ? 'desc' : 'asc',
        }))
    : [];

  // 4. Normalize columns selection
  const columns = Array.isArray(request.columns)
    ? request.columns.map((col) => String(col).trim())
    : undefined;

  // 5. Normalize pagination
  const page = Number.isInteger(request.page) && request.page >= 1 ? request.page : 1;
  const pageSize =
    Number.isInteger(request.pageSize) && request.pageSize >= 1 && request.pageSize <= 100
      ? request.pageSize
      : 25;

  return {
    search,
    searchMode,
    logic,
    conditions,
    sort,
    columns,
    page,
    pageSize,
  };
}
