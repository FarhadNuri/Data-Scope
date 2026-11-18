import Redis from 'ioredis';
import { env } from '../config/env.js';

// Create a single Redis client shared across the application.
// maxRetriesPerRequest: 1 ensures operations fail immediately if Redis is unreachable
// so requests do not hang when the cache is offline.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy(times) {
    // Reconnect with a backoff delay capped at 3 seconds
    return Math.min(times * 200, 3000);
  },
});

// Log connection warnings rather than crashing the process
redis.on('error', (err) => {
  const message = err.message || err.errors?.map((e) => e.message).join(', ') || err.code || 'Connection error';
  console.warn(`[REDIS WARNING] ${message}`);
});
