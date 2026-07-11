import knex, { Knex } from 'knex';
import { configs } from '../src/config/database';

let testDb: Knex;

/**
 * Initialize a fresh in-memory test database.
 * Runs all migrations to set up the schema.
 */
export async function setupTestDb(): Promise<Knex> {
  testDb = knex(configs.test);
  await testDb.migrate.latest();
  return testDb;
}

/**
 * Tear down the test database connection.
 */
export async function teardownTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
  }
}

/**
 * Clear all rows from all tables (preserves schema).
 * Useful for resetting state between tests.
 */
export async function cleanTables(): Promise<void> {
  if (!testDb) return;

  const tables = ['vehicles', 'users'];
  for (const table of tables) {
    await testDb(table).del();
  }
}

export { testDb };
