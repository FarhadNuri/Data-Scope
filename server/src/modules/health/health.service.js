import { query } from '../../db/pool.js';
import { redis } from '../../cache/redis.js';

// Checks connectivity for both PostgreSQL and Redis
export async function checkHealth() {
  let database = 'up';
  let redisStatus = 'up';

  // 1. Verify PostgreSQL connection
  try {
    await query('SELECT 1');
  } catch (err) {
    database = 'down';
  }

  // 2. Verify Redis connection
  try {
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      redisStatus = 'down';
    }
  } catch (err) {
    redisStatus = 'down';
  }

  // Database is critical to application functionality:
  // If database is down, return HTTP 503 (Service Unavailable).
  // Redis is a cache: if only Redis is down, return HTTP 200 with status 'degraded'.
  const isHealthy = database === 'up' && redisStatus === 'up';
  const statusCode = database === 'up' ? 200 : 503;

  return {
    statusCode,
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      database,
      redis: redisStatus,
    },
  };
}
