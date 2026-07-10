import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup';
import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';
import { Knex } from 'knex';
import { Express } from 'express';
import jwt from 'jsonwebtoken';

let db: Knex;
let app: Express;

beforeAll(async () => {
  db = await setupTestDb();
  app = createApp(db);
});

afterAll(async () => {
  await teardownTestDb();
});

describe('JWT Auth Middleware', () => {
  // We'll test the middleware by hitting a protected test route
  // The middleware should be applied to routes that need authentication

  describe('missing token', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const response = await request(app)
        .get('/api/protected/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should return 401 when Authorization header has no Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'some-random-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });
  });

  describe('invalid token', () => {
    it('should return 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is signed with wrong secret', async () => {
      const fakeToken = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'user' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'user' },
        process.env.JWT_SECRET || 'dev-secret-change-in-production',
        { expiresIn: '0s' } // expires immediately
      );

      // Small delay to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('valid token', () => {
    it('should allow access with a valid token', async () => {
      const token = signToken({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should attach user data to the request', async () => {
      const token = signToken({
        userId: 42,
        email: 'admin@example.com',
        role: 'admin',
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.userId).toBe(42);
      expect(response.body.user.email).toBe('admin@example.com');
      expect(response.body.user.role).toBe('admin');
    });
  });

  describe('role-based access', () => {
    it('should allow admin access to admin-only routes', async () => {
      const token = signToken({
        userId: 1,
        email: 'admin@example.com',
        role: 'admin',
      });

      const response = await request(app)
        .get('/api/protected/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-admin access to admin-only routes', async () => {
      const token = signToken({
        userId: 2,
        email: 'user@example.com',
        role: 'user',
      });

      const response = await request(app)
        .get('/api/protected/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('admin');
    });
  });
});
