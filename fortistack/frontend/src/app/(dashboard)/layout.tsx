'use client';

import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0A0F1C]">
            <Sidebar isAdmin={user.role === 'admin'} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto bg-[#0A0F1C] p-6 text-[#E6EEF8]">
                    {children}
                </main>
            </div>
        </div>
    );
}
