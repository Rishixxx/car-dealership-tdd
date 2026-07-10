import knex, { Knex } from 'knex';
import path from 'path';

const configs: Record<string, Knex.Config> = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, '../../dev.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../migrations'),
    },
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../migrations'),
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, '../migrations'),
    },
  },
};

const environment = process.env.NODE_ENV || 'development';
const config = configs[environment];

if (!config) {
  throw new Error(`Unknown environment: ${environment}`);
}

const db = knex(config);

export { db, configs };
export default db;
