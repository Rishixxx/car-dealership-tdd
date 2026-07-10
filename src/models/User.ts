import db from '../config/database';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export type CreateUserInput = Pick<User, 'email' | 'password' | 'name'> & {
  role?: 'user' | 'admin';
};

/**
 * Find a user by their email address.
 */
export async function findByEmail(email: string): Promise<User | undefined> {
  return db('users').where({ email }).first();
}

/**
 * Find a user by their ID.
 */
export async function findById(id: number): Promise<User | undefined> {
  return db('users').where({ id }).first();
}

/**
 * Create a new user in the database.
 * Returns the created user (without password).
 */
export async function create(input: CreateUserInput): Promise<Omit<User, 'password'>> {
  const [id] = await db('users').insert({
    email: input.email,
    password: input.password,
    name: input.name,
    role: input.role || 'user',
  });

  const user = await findById(id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
