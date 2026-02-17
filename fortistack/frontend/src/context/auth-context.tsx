'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LoginResponse, User, JWTClaims } from '@/lib/types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    activeTenant: string | null;
    setActiveTenant: (tenantId: string) => void;
    login: (email: string, pass: string) => Promise<void>;
    signup: (tenantName: string, region: string, email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/** Decode JWT claims into a User object safely */
const decodeUser = (token: string): User | null => {
    try {
        const claims = jwtDecode<JWTClaims>(token);
        const userId = claims.sub || claims.user_id;
        if (!userId) return null;

        return {
            user_id: userId,
            tenant_id: claims.tenant_id || '',
            role: (claims.role as User['role']) || 'viewer',
            exp: claims.exp,
        };
    } catch (e: unknown) {
        console.error('Failed to decode token', e);
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTenant, setActiveTenantState] = useState<string | null>(null);
    const router = useRouter();

    // Helper to sync active tenant
    const setActiveTenant = (tenantId: string) => {
        setActiveTenantState(tenantId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('active_tenant_id', tenantId);
        }
    };

    useEffect(() => {
        const initAuth = () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                const decoded = decodeUser(token);
                if (decoded) {
                    // Check expiration
                    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('active_tenant_id');
                        setUser(null);
                    } else {
                        setUser(decoded);
                        // Restore active tenant or default to user's tenant
                        const storedTenant = localStorage.getItem('active_tenant_id');
                        if (decoded.role === 'admin' && storedTenant) {
                            setActiveTenantState(storedTenant);
                        } else {
                            setActiveTenantState(decoded.tenant_id);
                        }
                    }
                } else {
                    localStorage.removeItem('access_token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        // api.post unwraps the envelope: { data: { access_token, refresh_token } } -> { access_token, refresh_token }
        const data = await api.post<LoginResponse>('/auth/login', { email, password: pass });

        const { access_token, refresh_token } = data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        const decodedUser = decodeUser(access_token);
        setUser(decodedUser);

        if (decodedUser) {
            // Default active tenant
            const defaultTenant = decodedUser.tenant_id;
            setActiveTenantState(defaultTenant);
            localStorage.setItem('active_tenant_id', defaultTenant);
        }

        router.push('/dashboard');
    };

    const signup = async (tenantName: string, region: string, email: string, pass: string) => {
        const data = await api.post<LoginResponse & { user: User }>('/auth/signup', {
            tenant_name: tenantName,
            region,
            email,
            password: pass
        });

        const { access_token, refresh_token } = data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        const decodedUser = decodeUser(access_token);
        setUser(decodedUser);

        if (decodedUser) {
            setActiveTenantState(decodedUser.tenant_id);
            localStorage.setItem('active_tenant_id', decodedUser.tenant_id);
        }

        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('active_tenant_id');
        setUser(null);
        setActiveTenantState(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, activeTenant, setActiveTenant, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
