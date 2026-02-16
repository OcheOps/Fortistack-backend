'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0B1220]">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-[#111A2E] p-4 shadow-lg ring-1 ring-[#1D2A44] animate-pulse">
          <Shield className="h-8 w-8 text-[#2F7DFF]" />
        </div>
        <p className="text-xs text-[#A9B5C7]/40 font-medium tracking-wider uppercase">Loading</p>
      </div>
    </div>
  );
}
