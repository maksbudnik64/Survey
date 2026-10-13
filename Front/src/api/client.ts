import { getToken, logout } from '../utils/auth';
import { navigateTo } from '../utils/router';
import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const SESSION_EXPIRED_CODES = ['TOKEN_EXPIRED', 'UNAUTHORIZED', 'INVALID_TOKEN'] as const;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: message, code: 'INTERNAL_ERROR' };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      success: false,
      error: `Invalid server response (HTTP ${response.status})`,
      code: 'INTERNAL_ERROR',
    };
  }

  if (!response.ok) {
    const body = data as { error?: string; code?: string };

    if (body.code && (SESSION_EXPIRED_CODES as readonly string[]).includes(body.code)) {
      logout();
      navigateTo('/login');
      return {
        success: false,
        error: 'Session expired. Please log in again.',
        code: 'UNAUTHORIZED',
      };
    }

    return {
      success: false,
      error: body.error ?? 'Request failed',
      code: 'INTERNAL_ERROR',
    };
  }

  return data as ApiResponse<T>;
}

export function get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, options);
}

export function post<T>(
  endpoint: string,
  body: object,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export function put<T>(
  endpoint: string,
  body: object,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  });
}

export function del<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: 'DELETE', ...options });
}