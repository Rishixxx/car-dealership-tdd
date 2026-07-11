export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  category: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export type CreateVehicleInput = Pick<Vehicle, 'make' | 'model' | 'year' | 'category' | 'price'> & {
  quantity?: number;
};

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export const VALID_CATEGORIES = [
  'sedan',
  'suv',
  'truck',
  'coupe',
  'hatchback',
  'convertible',
  'van',
  'wagon',
] as const;
