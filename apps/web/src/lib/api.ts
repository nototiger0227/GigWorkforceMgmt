const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getToken(): string | null {
  return localStorage.getItem('gig_token');
}

export function setToken(token: string): void {
  localStorage.setItem('gig_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('gig_token');
}

export class ApiError extends Error {
  details?: Record<string, string[]>;
  constructor(message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? 'Request failed', body.details?.fieldErrors);
  }

  return res.json() as Promise<T>;
}

export const API_WS = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';
