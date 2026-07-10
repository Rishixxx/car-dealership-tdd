import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateRegisterInput, validateLoginInput } from '../validators/auth';
import { signToken } from '../utils/jwt';

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

/**
 * POST /api/auth/login
 * Authenticate user and return a JWT token.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    // Validate input
    const errors = validateLoginInput({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0].message,
        details: errors,
      });
    }

    // Find user by email
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT using utility
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return token and user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userWithoutPassword } = user;

    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
