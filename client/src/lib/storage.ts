// Storage key used for the JWT token
const TOKEN_KEY = 'datascope_token';

// Retrieves the token from localStorage; returns null if running on the server
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

// Stores the token in localStorage; does nothing if running on the server
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

// Clears the token from localStorage; does nothing if running on the server
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

// Storage key used for caching the active theme to avoid white flash before first paint
const THEME_KEY = 'datascope_theme';

export function getThemeCache(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(THEME_KEY);
}

export function setThemeCache(theme: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(THEME_KEY, theme);
}

export function removeThemeCache(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(THEME_KEY);
}
