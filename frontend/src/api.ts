import type { AuthUser, Vehicle } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type JsonObject = Record<string, unknown>;

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || 'Request failed');
  }

  return payload as T;
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const payload = await request<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return payload.user;
}

export async function loginUser(input: { email: string; password: string }) {
  return request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchVehicles(token?: string, query?: JsonObject) {
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<{ vehicles: Vehicle[] }>(`/api/vehicles${suffix}`, {}, token);
}

export async function createVehicle(token: string, input: Partial<Vehicle> & { year: number; category: string; price: number; make: string; model: string; quantity?: number }) {
  return request<{ vehicle: Vehicle }>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
}

export async function updateVehicle(token: string, id: number, input: Partial<Vehicle>) {
  return request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }, token);
}

export async function deleteVehicle(token: string, id: number) {
  return request<{ message: string }>(`/api/vehicles/${id}`, {
    method: 'DELETE',
  }, token);
}

export async function purchaseVehicle(token: string, id: number) {
  return request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/purchase`, {
    method: 'POST',
  }, token);
}

export async function restockVehicle(token: string, id: number, quantity: number) {
  return request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/restock`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  }, token);
}