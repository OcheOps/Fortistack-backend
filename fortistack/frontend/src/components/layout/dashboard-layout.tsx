'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <aside className="w-64 bg-white border-r">
                <div className="p-4 text-xl font-bold bg-gray-50">FortiStack</div>
                <nav className="mt-4">
                    <ul className="space-y-1 p-2">
                        <li>
                            <a href="/dashboard" className="block px-4 py-2 hover:bg-gray-100 rounded">
                                Dashboard
                            </a>
                        </li>
                        {user?.role === 'admin' && (
                            <li>
                                <a href="/tenants" className="block px-4 py-2 hover:bg-gray-100 rounded">
                                    Tenants
                                </a>
                            </li>
                        )}
                        <li>
                            <a href="/reports" className="block px-4 py-2 hover:bg-gray-100 rounded">
                                Reports
                            </a>
                        </li>
                        <li>
                            <a href="/settings" className="block px-4 py-2 hover:bg-gray-100 rounded">
                                Settings
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <div className="mb-6 flex justify-between items-center bg-white p-4 rounded shadow-sm">
                    <h1 className="text-xl font-semibold">FortiStack Infrastructure Assurance</h1>
                    <div className="flex items-center space-x-4">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {user?.role}
                        </span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('access_token');
                                window.location.href = '/login';
                            }}
                            className="text-red-500 hover:underline text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
