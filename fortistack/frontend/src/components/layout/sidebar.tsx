'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, Settings, Shield, ShieldAlert } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Users, adminOnly: true },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Security Scans', href: '/scans', icon: ShieldAlert },
    { name: 'Integrations', href: '/integrations', icon: Settings },
];

interface SidebarProps {
    isAdmin: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-[#111A2E] border-r border-[#1D2A44]">
            <div className="flex h-16 items-center px-6 border-b border-[#1D2A44]">
                <Shield className="h-6 w-6 text-[#2F7DFF] mr-2" />
                <span className="text-xl font-bold text-white tracking-tight">FortiStack</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                                isActive
                                    ? 'bg-[#2F7DFF]/10 text-[#2F7DFF]'
                                    : 'text-[#A9B5C7] hover:bg-[#1D2A44] hover:text-white'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                                    isActive ? 'text-[#2F7DFF]' : 'text-[#A9B5C7] group-hover:text-white'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-[#1D2A44] p-4">
                <div className="bg-[#0B1220] rounded-lg p-3 border border-[#1D2A44]">
                    <p className="text-xs text-[#A9B5C7]">Running in</p>
                    <p className="text-sm font-semibold text-white">Production Mode</p>
                </div>
            </div>
        </div>
    );
}
