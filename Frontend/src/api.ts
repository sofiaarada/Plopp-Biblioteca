export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

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

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const base = API_URL.replace('/api', '');
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/uploads/${trimmed}`;
}