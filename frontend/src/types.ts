export type Role = 'user' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  category: string;
  price: number;
  quantity: number;
}