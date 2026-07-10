import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateRegisterInput } from '../validators/auth';

const router = Router();

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Create a new user account with hashed password.
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const db = req.app.locals.db;

    // Validate input using dedicated validator
    const errors = validateRegisterInput({ name, email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0].message,
        details: errors,
      });
    }

    // Check for duplicate email
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert the user
    const [id] = await db('users').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
    });

    // Fetch and return the created user (without password)
    const createdUser = await db('users').where({ id }).first();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userWithoutPassword } = createdUser;

    return res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
