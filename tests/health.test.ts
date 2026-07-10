import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup';
import { createApp } from '../src/app';
import { Knex } from 'knex';

let db: Knex;

beforeAll(async () => {
  db = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const app = createApp(db);
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
