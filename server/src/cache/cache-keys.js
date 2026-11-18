// Centralized cache key generation to avoid key string duplication and mismatches

// Generates cache key for paginated search results: search:{datasetId}:v{version}:{queryHash}
export function searchResultKey(datasetId, version, queryHash) {
  return `search:${datasetId}:v${version}:${queryHash}`;
}

// Generates cache key for filtered record counts: count:{datasetId}:v{version}:{filterHash}
export function filterCountKey(datasetId, version, filterHash) {
  return `count:${datasetId}:v${version}:${filterHash}`;
}

// Generates cache key for aggregated dataset analytics: analytics:{datasetId}:v{version}:{type}
export function analyticsKey(datasetId, version, type) {
  return `analytics:${datasetId}:v${version}:${type}`;
}
