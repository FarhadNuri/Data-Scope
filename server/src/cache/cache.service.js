import { redis } from './redis.js';

// Cache service with graceful fallback.
// WHY: Redis is strictly used to optimize performance (search results, record counts, analytics).
// If Redis becomes unavailable, every function catches the error, logs a warning, and returns
// default values (acting as an empty cache). The entire API remains fully functional by
// falling back directly to PostgreSQL queries.

// Retrieves and parses cached JSON data by key, tracking hit/miss statistics
export async function get(key) {
  try {
    const rawData = await redis.get(key);
    if (rawData !== null) {
      // Record hit counter in Redis asynchronously without blocking response
      redis.incr('cache:stats:hits').catch(() => {});
      return JSON.parse(rawData);
    }

    // Record miss counter
    redis.incr('cache:stats:misses').catch(() => {});
    return null;
  } catch (error) {
    console.warn(`[REDIS WARNING] Failed to read key "${key}":`, error.message);
    return null;
  }
}

// Stores a JSON-serializable value in Redis with a TTL in seconds
export async function set(key, value, ttlSeconds) {
  try {
    const serialized = JSON.stringify(value);
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.warn(`[REDIS WARNING] Failed to set key "${key}":`, error.message);
  }
}

// Retrieves the current version number for a dataset, returning 0 if not set
export async function getDatasetVersion(datasetId) {
  try {
    const version = await redis.get(`dataset:${datasetId}:version`);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    console.warn(`[REDIS WARNING] Failed to get version for dataset "${datasetId}":`, error.message);
    return 0;
  }
}

// Increments the dataset version counter.
// WHY: We use version-based cache invalidation. Rather than scanning and deleting
// hundreds or thousands of matching search keys whenever dataset records change,
// we simply increment "dataset:{id}:version" (e.g. from 1 to 2). All subsequent search
// requests build keys containing ":v2:". The old ":v1:" keys are never accessed again
// and are automatically reclaimed by Redis when their TTL expires.
export async function bumpDatasetVersion(datasetId) {
  try {
    return await redis.incr(`dataset:${datasetId}:version`);
  } catch (error) {
    console.warn(`[REDIS WARNING] Failed to bump version for dataset "${datasetId}":`, error.message);
    return 0;
  }
}

// Retrieves hit/miss statistics and calculates overall hitRate
export async function getStats() {
  try {
    const [hitsStr, missesStr] = await Promise.all([
      redis.get('cache:stats:hits'),
      redis.get('cache:stats:misses'),
    ]);

    const hits = parseInt(hitsStr || '0', 10);
    const misses = parseInt(missesStr || '0', 10);
    const total = hits + misses;
    const hitRate = total > 0 ? Number((hits / total).toFixed(4)) : 0;

    return { hits, misses, hitRate };
  } catch (error) {
    console.warn('[REDIS WARNING] Failed to retrieve cache statistics:', error.message);
    return { hits: 0, misses: 0, hitRate: 0 };
  }
}
