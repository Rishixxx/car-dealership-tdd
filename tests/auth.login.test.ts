import request from 'supertest';
import bcrypt from 'bcrypt';
import { setupTestDb, teardownTestDb, cleanTables } from './setup';
import { createApp } from '../src/app';
import { Knex } from 'knex';
import { Express } from 'express';

let db: Knex;
let app: Express;

beforeAll(async () => {
  db = await setupTestDb();
  app = createApp(db);
});

afterEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await teardownTestDb();
});

/**
 * Helper to seed a user directly in the database for login tests.
 */
async function seedUser(overrides: Partial<{ email: string; password: string; name: string; role: string }> = {}) {
  const hashedPassword = await bcrypt.hash(overrides.password || 'SecurePass123!', 10);
  const [id] = await db('users').insert({
    name: overrides.name || 'Test User',
    email: overrides.email || 'test@example.com',
    password: hashedPassword,
    role: overrides.role || 'user',
  });
  return id;
}

describe('POST /api/auth/login', () => {
  describe('successful login', () => {
    it('should return 200 with a JWT token', async () => {
      await seedUser({ email: 'john@example.com', password: 'SecurePass123!' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'SecurePass123!' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should return user data without password', async () => {
      await seedUser({ email: 'john@example.com', password: 'SecurePass123!' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'SecurePass123!' });

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('john@example.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should include user id and role in the JWT payload', async () => {
      await seedUser({ email: 'admin@example.com', password: 'AdminPass123!', role: 'admin' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'AdminPass123!' });

      expect(response.status).toBe(200);

      // Decode the JWT payload (middle part, base64)
      const payload = JSON.parse(
        Buffer.from(response.body.token.split('.')[1], 'base64').toString()
      );
      expect(payload.userId).toBeDefined();
      expect(payload.role).toBe('admin');
    });
  });

  describe('failed login', () => {
    it('should return 401 for wrong password', async () => {
      await seedUser({ email: 'john@example.com', password: 'SecurePass123!' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPassword!' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'SomePass123!' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
