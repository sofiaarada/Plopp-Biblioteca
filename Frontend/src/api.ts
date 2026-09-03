export const API_URL = 'http://localhost:3000/api';

const TOKEN_KEY = 'bf_token';

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  try {
    const storedUser = JSON.parse(localStorage.getItem('bf_user') || 'null') as { token?: string } | null;
    return storedUser?.token ?? null;
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem('bf_user');
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (user) {
    localStorage.setItem('bf_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bf_user');
  }
}

export async function api(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if ((options.body || options.method) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${API_URL}${path}`, { ...options, headers });
}