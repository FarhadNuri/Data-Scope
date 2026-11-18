import { api } from '../lib/api';
import type { User, LoginResponse } from '../types/auth';

// Authenticates with email and password, returning user data and JWT
export async function login(email: string, password: string) {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// Registers a new user account with default VIEWER role
export async function register(name: string, email: string, password: string) {
  return api<User>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

// Restores session by fetching the current user profile using the stored token
export async function getMe() {
  return api<User>('/auth/me');
}
