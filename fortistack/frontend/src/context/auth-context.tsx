'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LoginResponse, User } from '@/lib/types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper to decode token safely
const decodeUser = (token: string): User | null => {
    try {
        const decoded: any = jwtDecode(token);
        return {
            user_id: decoded.sub || decoded.user_id,
            tenant_id: decoded.tenant_id,
            role: decoded.role || 'viewer', // default fallback
            exp: decoded.exp
        };
    } catch (e) {
        console.error('Failed to decode token', e);
        return null;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                const user = decodeUser(token);
                if (user) {
                    // Check expiration
                    if (user.exp && user.exp * 1000 < Date.now()) {
                        // Token expired, could try refresh or just logout
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        setUser(null);
                    } else {
                        setUser(user);
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
        try {
            // api.post throws error if failed
            const data = await api.post<LoginResponse>('/auth/login', { email, password: pass });

            const { access_token, refresh_token } = data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const decodedUser = decodeUser(access_token);
            setUser(decodedUser);

            router.push('/dashboard');
        } catch (err) {
            console.error('Login failed', err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
