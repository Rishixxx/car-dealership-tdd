import { VALID_CATEGORIES, CreateVehicleInput, UpdateVehicleInput } from '../models/Vehicle';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate vehicle creation input.
 * Returns an array of validation errors (empty if valid).
 */
export function validateCreateVehicle(body: Partial<CreateVehicleInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.make || typeof body.make !== 'string' || body.make.trim().length === 0) {
    errors.push({ field: 'make', message: 'Make is required' });
  }

  if (!body.model || typeof body.model !== 'string' || body.model.trim().length === 0) {
    errors.push({ field: 'model', message: 'Model is required' });
  }

  if (body.year === undefined || body.year === null || typeof body.year !== 'number') {
    errors.push({ field: 'year', message: 'Year is required and must be a number' });
  } else if (!Number.isInteger(body.year) || body.year < 1886 || body.year > new Date().getFullYear() + 2) {
    errors.push({ field: 'year', message: 'Year must be a valid year' });
  }

  if (!body.category || typeof body.category !== 'string') {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (!VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (body.price === undefined || body.price === null || typeof body.price !== 'number') {
    errors.push({ field: 'price', message: 'Price is required and must be a number' });
  } else if (body.price <= 0) {
    errors.push({ field: 'price', message: 'Price must be greater than 0' });
  }

  if (body.quantity !== undefined) {
    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a non-negative number' });
    }
  }

  return errors;
}

/**
 * Validate vehicle update input.
 * Only validates fields that are provided (partial update).
 */
export function validateUpdateVehicle(body: Partial<UpdateVehicleInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (body.make !== undefined) {
    if (typeof body.make !== 'string' || body.make.trim().length === 0) {
      errors.push({ field: 'make', message: 'Make cannot be empty' });
    }
  }

  if (body.model !== undefined) {
    if (typeof body.model !== 'string' || body.model.trim().length === 0) {
      errors.push({ field: 'model', message: 'Model cannot be empty' });
    }
  }

  if (body.year !== undefined) {
    if (typeof body.year !== 'number' || !Number.isInteger(body.year) || body.year < 1886 || body.year > new Date().getFullYear() + 2) {
      errors.push({ field: 'year', message: 'Year must be a valid year' });
    }
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }
  }

  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price <= 0) {
      errors.push({ field: 'price', message: 'Price must be greater than 0' });
    }
  }

  if (body.quantity !== undefined) {
    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a non-negative number' });
    }
  }

  return errors;
}
