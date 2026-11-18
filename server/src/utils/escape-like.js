// Escapes special wildcard characters (%, _, and backslash) for SQL LIKE and ILIKE clauses.
// WHY: Prevents user input containing '%' or '_' from accidentally acting as pattern wildcards.
export function escapeLike(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[%_\\]/g, '\\$&');
}
