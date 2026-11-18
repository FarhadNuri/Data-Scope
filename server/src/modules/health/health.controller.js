import * as healthService from './health.service.js';

// Handles health check requests and returns system status
export async function getHealth(req, res) {
  const { statusCode, data } = await healthService.checkHealth();
  res.status(statusCode).json({
    success: true,
    data,
  });
}
