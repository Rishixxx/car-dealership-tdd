/**
 * Validation helpers for authentication endpoints.
 * Extracted from route handlers for reusability and testability.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Validate registration input fields.
 * Returns an array of validation errors (empty if valid).
 */
export function validateRegisterInput(body: Partial<RegisterInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  // Email validation
  if (!body.email || typeof body.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Password validation
  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  return errors;
}

/**
 * Validate login input fields.
 * Returns an array of validation errors (empty if valid).
 */
export function validateLoginInput(body: { email?: string; password?: string }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
}
