import express from 'express';
import cors from 'cors';
import { Knex } from 'knex';
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import { authenticate, authorize } from './middleware/auth';

/**
 * Create and configure the Express application.
 * Accepts an optional Knex instance for dependency injection (used in tests).
 */
export function createApp(db?: Knex) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Make db available to route handlers via app.locals
  if (db) {
    app.locals.db = db;
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);

  // Protected routes (require valid JWT)
  app.get('/api/protected/profile', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  // Admin-only route (require valid JWT + admin role)
  app.get('/api/protected/admin-only', authenticate, authorize('admin'), (req, res) => {
    res.json({ message: 'Admin access granted', user: req.user });
  });

  return app;
}

export default createApp;
