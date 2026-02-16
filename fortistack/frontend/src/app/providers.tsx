'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from 'sonner';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
                <Toaster
                    theme="dark"
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#111A2E',
                            border: '1px solid #1D2A44',
                            color: '#E6EEF8',
                        },
                    }}
                />
            </AuthProvider>
        </QueryClientProvider>
    );
}
