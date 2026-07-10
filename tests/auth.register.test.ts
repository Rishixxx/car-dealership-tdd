import request from 'supertest';
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

describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
  };

  describe('successful registration', () => {
    it('should return 201 with user data (without password)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.name).toBe(validUser.name);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should hash the password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      // Directly query the database to verify password is hashed
      const user = await db('users').where({ email: validUser.email }).first();
      expect(user).toBeDefined();
      expect(user.password).not.toBe(validUser.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
    });

    it('should assign "user" role by default', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.body.user.role).toBe('user');
    });
  });

  describe('input validation', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when email is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@example.com', password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('duplicate email handling', () => {
    it('should return 409 when email is already registered', async () => {
      // Register the user first
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      // Try to register again with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already');
    });
  });
});
