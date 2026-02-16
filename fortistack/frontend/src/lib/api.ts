import { ApiEnvelope } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
    code: string;
    details?: unknown;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

class ApiClient {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${BASE_URL.replace(/\/$/, '')}${endpoint}`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized (Attempt Refresh or Logout)
            if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    const newToken = localStorage.getItem('access_token');
                    return this.request<T>(endpoint, {
                        ...options,
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${newToken}`,
                        },
                    });
                } else {
                    this.logout();
                    throw new ApiError('Session expired', 'UNAUTHORIZED');
                }
            }

            let envelope: ApiEnvelope<T> | null = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                envelope = await response.json();
            }

            if (!response.ok) {
                if (envelope?.error) {
                    throw new ApiError(envelope.error.message, envelope.error.code, envelope.error.details);
                }
                throw new ApiError(`Request failed with status ${response.status}`, 'HTTP_ERROR');
            }

            // Unwrap the envelope's data field
            if (envelope && envelope.data !== undefined) {
                return envelope.data;
            }

            // If no data field but response was OK (e.g. null data), return null cast
            return null as T;

        } catch (error: unknown) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error(`API Request Failed: ${endpoint}`, error);
            throw new ApiError(
                error instanceof Error ? error.message : 'Unknown network error',
                'NETWORK_ERROR'
            );
        }
    }

    private async refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const json: ApiEnvelope<{ access_token: string }> = await response.json();
                if (json.data?.access_token) {
                    localStorage.setItem('access_token', json.data.access_token);
                    return true;
                }
            }
        } catch (e: unknown) {
            console.error('Token refresh failed', e);
        }
        return false;
    }

    private logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
    }

    // Public methods — strongly typed, no `any`
    get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    put<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    patch<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
