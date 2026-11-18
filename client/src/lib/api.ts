import { getToken, removeToken } from './storage';

// NEXT_PUBLIC_ variables are available in browser code
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Error thrown for every non-2xx response so components can display message and details
export class ApiError extends Error {
  statusCode: number;
  details?: { field?: string; path?: string; message: string }[];

  constructor(statusCode: number, message: string, details?: ApiError['details']) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// The backend wraps all successful responses as { success, data, meta? }
export type ApiResult<T> = { data: T; meta?: unknown };

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // 204 No Content indicates success with an empty body (e.g. DELETE operations)
  if (response.status === 204) {
    return { data: undefined as T };
  }

  const json = await response.json();

  if (!response.ok) {
    // If the token is expired or unauthorized, clear storage and redirect to login
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      removeToken();
      window.location.href = '/login';
    }
    const error = json.error ?? {};
    throw new ApiError(response.status, error.message ?? 'Request failed', error.details);
  }

  return { data: json.data as T, meta: json.meta };
}
