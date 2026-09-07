import { getToken } from "../utils/auth";
import type { ApiResponse } from "../types";

const API_BASE = 'http://localhost:5000'

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>>{
    try{
        const token = getToken();
const headers: HeadersInit = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
};
     const response = await fetch(`${API_BASE}${endpoint}`, {...options, headers});
     const data = await response.json();
     if (!response.ok) {
            return { success: false, error: data.error || 'Request failed' };
        }

        return data;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>>{
    return await apiClient<T>(endpoint, options);
}

export async function post<T>(endpoint: string, body: object, options: RequestInit = {}): Promise<ApiResponse<T>>{
    return await apiClient<T>(endpoint, {method: 'POST', body: JSON.stringify(body), ...options})
}

export async function put<T>(endpoint: string, body: object, options: RequestInit = {}): Promise<ApiResponse<T>>{
    return await apiClient<T>(endpoint, {method: 'PUT', body: JSON.stringify(body), ...options})
}

export async function del<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>>{
    return await apiClient<T>(endpoint, {method: 'DELETE', ...options});
}