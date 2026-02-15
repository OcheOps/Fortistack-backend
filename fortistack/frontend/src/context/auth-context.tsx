'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface User {
    user_id: string;
    tenant_id?: string;
    role: 'admin' | 'tenant_admin' | 'viewer';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUser({
                    user_id: decoded.sub || decoded.user_id,
                    tenant_id: decoded.tenant_id,
                    role: decoded.role,
                });
            } catch (e) {
                console.error('Invalid token', e);
                localStorage.removeItem('access_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const res = await api.post('/auth/login', { email, password: pass });
            const { access_token, refresh_token } = res.data.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const decoded: any = jwtDecode(access_token);
            setUser({
                user_id: decoded.sub || decoded.user_id,
                tenant_id: decoded.tenant_id,
                role: decoded.role,
            });

            router.push('/dashboard');
        } catch (err) {
            console.error(err);
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
