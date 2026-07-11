import request from 'supertest';
import { setupTestDb, teardownTestDb, cleanTables } from './setup';
import { createApp } from '../src/app';
import { Knex } from 'knex';
import { Express } from 'express';
import { signToken } from '../src/utils/jwt';

let db: Knex;
let app: Express;

const userToken = signToken({ userId: 1, email: 'user@test.com', role: 'user' });
const adminToken = signToken({ userId: 2, email: 'admin@test.com', role: 'admin' });

const validVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  category: 'sedan',
  price: 25000,
  quantity: 5,
};

async function seedVehicle(overrides: Partial<typeof validVehicle> = {}) {
  const [id] = await db('vehicles').insert({
    make: overrides.make || validVehicle.make,
    model: overrides.model || validVehicle.model,
    year: overrides.year || validVehicle.year,
    category: overrides.category || validVehicle.category,
    price: overrides.price || validVehicle.price,
    quantity: overrides.quantity ?? validVehicle.quantity,
  });

  return id;
}

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

describe('POST /api/vehicles', () => {
  describe('successful creation', () => {
    it('should return 201 with the created vehicle', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validVehicle);

      expect(response.status).toBe(201);
      expect(response.body.vehicle).toBeDefined();
      expect(response.body.vehicle.make).toBe('Toyota');
      expect(response.body.vehicle.model).toBe('Camry');
      expect(response.body.vehicle.year).toBe(2024);
      expect(response.body.vehicle.category).toBe('sedan');
      expect(response.body.vehicle.price).toBe(25000);
      expect(response.body.vehicle.quantity).toBe(5);
      expect(response.body.vehicle.id).toBeDefined();
    });

    it('should default quantity to 0 when not provided', async () => {
      const { quantity, ...vehicleWithoutQuantity } = validVehicle;
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(vehicleWithoutQuantity);

      expect(response.status).toBe(201);
      expect(response.body.vehicle.quantity).toBe(0);
    });

    it('should allow admin users to create vehicles', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVehicle);

      expect(response.status).toBe(201);
    });
  });

  describe('authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(validVehicle);

      expect(response.status).toBe(401);
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer invalidtoken')
        .send(validVehicle);

      expect(response.status).toBe(401);
    });
  });

  describe('input validation', () => {
    it('should return 400 when make is missing', async () => {
      const { make, ...rest } = validVehicle;
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(rest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when model is missing', async () => {
      const { model, ...rest } = validVehicle;
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(rest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when year is missing', async () => {
      const { year, ...rest } = validVehicle;
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(rest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when category is invalid', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validVehicle, category: 'spaceship' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when price is zero or negative', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validVehicle, price: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when quantity is negative', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validVehicle, quantity: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});

describe('GET /api/vehicles', () => {
  it('should return all vehicles', async () => {
    await seedVehicle({ make: 'Honda', model: 'Civic', category: 'sedan', price: 22000, quantity: 3 });
    await seedVehicle({ make: 'Ford', model: 'F-150', category: 'truck', price: 45000, quantity: 2 });

    const response = await request(app).get('/api/vehicles');

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(2);
    expect(response.body.vehicles[0].id).toBeDefined();
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('should update a vehicle when authenticated', async () => {
    const vehicleId = await seedVehicle();

    const response = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 26000, quantity: 7 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.price).toBe(26000);
    expect(response.body.vehicle.quantity).toBe(7);
  });

  it('should return 401 without a token', async () => {
    const vehicleId = await seedVehicle();

    const response = await request(app).put(`/api/vehicles/${vehicleId}`).send({ price: 26000 });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('should allow admins to delete a vehicle', async () => {
    const vehicleId = await seedVehicle();

    const response = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const deletedVehicle = await db('vehicles').where({ id: vehicleId }).first();
    expect(deletedVehicle).toBeUndefined();
  });

  it('should return 403 for non-admin users', async () => {
    const vehicleId = await seedVehicle();

    const response = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/vehicles/search', () => {
  beforeEach(async () => {
    await seedVehicle({ make: 'Toyota', model: 'RAV4', category: 'suv', price: 32000 });
    await seedVehicle({ make: 'Honda', model: 'Accord', category: 'sedan', price: 28000 });
    await seedVehicle({ make: 'Ford', model: 'Explorer', category: 'suv', price: 42000 });
  });

  it('should filter by make and category', async () => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'Toyota', category: 'suv' });

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
    expect(response.body.vehicles[0].model).toBe('RAV4');
  });

  it('should filter by price range', async () => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 30000, maxPrice: 35000 });

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
    expect(response.body.vehicles[0].make).toBe('Toyota');
  });
});

describe('POST /api/vehicles/:id/purchase', () => {
  it('should decrement quantity for authenticated users', async () => {
    const vehicleId = await seedVehicle({ quantity: 2 });

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(1);
  });

  it('should block purchases when quantity is zero', async () => {
    const vehicleId = await seedVehicle({ quantity: 0 });

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(response.status).toBe(409);
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  it('should allow admins to restock vehicles', async () => {
    const vehicleId = await seedVehicle({ quantity: 1 });

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(5);
  });

  it('should return 403 for non-admin users', async () => {
    const vehicleId = await seedVehicle({ quantity: 1 });

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 4 });

    expect(response.status).toBe(403);
  });
});
