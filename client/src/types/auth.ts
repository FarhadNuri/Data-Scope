// The three platform roles enforced by the backend
export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';

// Basic user information returned by /auth/me and sessions
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Full user record visible to administrators
export type AdminUser = User & {
  isActive: boolean;
  createdAt: string;
};

// Response returned by POST /auth/login and POST /auth/register
export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  user: User;
};
