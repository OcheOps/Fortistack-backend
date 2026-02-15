import { ApiEnvelope } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
        const url = `${BASE_URL}${endpoint}`;
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

            // Handle 401 Unauthorized (Attempt Refresh)
            if (response.status === 401 && !url.includes('/auth/refresh')) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry original request with new token
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
                    throw new Error('Session expired');
                }
            }

            let data;
            try {
                data = await response.json();
            } catch (err) {
                if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`);
            }

            // Check for envelope error
            if (data && data.error) {
                // If backend sends enveloped error
                throw new Error(data.error.message || JSON.stringify(data.error));
            }

            // If data is null/undefined but no error field? 
            // Our envelope is { data: ..., error: ... }
            if (data && data.data === undefined && !data.error) {
                // Maybe raw response?
                return { data } as any;
            }

            return data;
        } catch (error: any) {
            console.error(`API Request Failed: ${endpoint}`, error);
            throw error;
        }
    }

    private async refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.access_token) {
                    localStorage.setItem('access_token', data.data.access_token);
                    return true;
                }
            }
        } catch (e) {
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

    // Public methods
    get<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    post<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
