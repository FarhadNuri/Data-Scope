// Builds the composite search_text for a dataset record from its JSONB data.
// WHY: We concatenate all field values where isSearchable is true into a single lowercase
// string separated by spaces. PostgreSQL's generated column `search_vector` automatically
// indexes this text for full-text search, and the trigram index uses it for partial matches.
export function buildSearchText(data, fields) {
  if (!data || typeof data !== 'object' || !fields || !Array.isArray(fields)) {
    return '';
  }

  const parts = [];

  for (const field of fields) {
    if (field.isSearchable && data[field.key] !== undefined && data[field.key] !== null) {
      const stringValue = String(data[field.key]).trim();
      if (stringValue.length > 0) {
        parts.push(stringValue);
      }
    }
  }

  return parts.join(' ').toLowerCase();
}
