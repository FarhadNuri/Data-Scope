import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import permissionsRoutes from './modules/permissions/permissions.routes.js';
import datasetFieldsRoutes from './modules/dataset-fields/dataset-fields.routes.js';
import datasetsRoutes from './modules/datasets/datasets.routes.js';
import recordsRoutes from './modules/records/records.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import searchHistoryRoutes from './modules/search-history/search-history.routes.js';
import savedViewsRoutes from './modules/saved-views/saved-views.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import userPreferencesRoutes from './modules/user-preferences/user-preferences.routes.js';
import { authenticate } from './middleware/auth.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing: allow configured FRONTEND_URL or allow all origins if not strictly matched
const allowedOrigin = env.FRONTEND_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (!allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for production deployment cross-origin
    },
    credentials: true,
  })
);

// Parse JSON request bodies up to 1MB
app.use(express.json({ limit: '1mb' }));

// Simple request logger middleware: logs "METHOD url statusCode Xms"
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Root ping endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'DataScope API server running', apiVersion: 'v1' });
});

// 1. Public routes (accessible without an authentication token)
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback if client requests without /api/v1 prefix
app.use('/health', healthRoutes);

// 2. Global authentication barrier: all routes defined below this line require a valid token
app.use('/api/v1', authenticate);

// 3. Protected feature routes
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/datasets', permissionsRoutes);
app.use('/api/v1/datasets', datasetFieldsRoutes);
app.use('/api/v1/datasets', recordsRoutes);
app.use('/api/v1/datasets', searchRoutes);
app.use('/api/v1/datasets', datasetsRoutes);
app.use('/api/v1/saved-views', savedViewsRoutes);
app.use('/api/v1/search-history', searchHistoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/preferences', userPreferencesRoutes);

// 404 handler for unmatched routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
