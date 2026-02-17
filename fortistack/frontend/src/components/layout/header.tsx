'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Tenant } from '@/lib/types';
import { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2, LogOut, User as UserIcon, Building } from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
    const { user, logout, activeTenant, setActiveTenant } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loadingTenants, setLoadingTenants] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchTenants();
        }
    }, [user]);

    const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
            const data = await api.get<Tenant[]>('/tenants');
            if (data) setTenants(data);
        } catch (error) {
            console.error('Failed to fetch tenants', error);
            // safe error
        } finally {
            setLoadingTenants(false);
        }
    };

    const currentTenantName = tenants.find(t => t.id === activeTenant)?.name || 'Select Tenant';

    return (
        <header className="flex h-16 items-center justify-between border-b border-[#1D2A44] bg-[#111A2E]/50 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                {user?.role === 'admin' ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-[240px] justify-between border-[#1D2A44] bg-[#0B1220] text-[#E6EEF8] hover:bg-[#1D2A44] hover:text-white">
                                <span className="flex items-center gap-2 truncate">
                                    <Building className="h-4 w-4 text-[#2F7DFF]" />
                                    {loadingTenants ? 'Loading...' : (activeTenant ? currentTenantName : 'Select Tenant')}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[240px] border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8]">
                            <DropdownMenuLabel className="text-[#A9B5C7] text-xs uppercase tracking-wider">Select Context</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#1D2A44]" />
                            {tenants.map((tenant) => (
                                <DropdownMenuItem
                                    key={tenant.id}
                                    onClick={() => setActiveTenant(tenant.id)}
                                    className="cursor-pointer focus:bg-[#2F7DFF]/20 focus:text-white"
                                >
                                    <span className={activeTenant === tenant.id ? 'font-bold text-[#2F7DFF]' : ''}>
                                        {tenant.name}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#E6EEF8] border border-[#1D2A44] rounded-md bg-[#0B1220]/50">
                        <Building className="h-4 w-4 text-[#2F7DFF]" />
                        <span>{user?.tenant_id ? 'My Tenant' : 'Unknown Tenant'}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-1 ring-[#1D2A44] hover:bg-[#1D2A44]">
                            <div className="flex h-full w-full items-center justify-center bg-[#0B1220] rounded-full text-[#A9B5C7]">
                                <UserIcon className="h-4 w-4" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8]" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-white">User</p>
                                <p className="text-xs leading-none text-[#A9B5C7]">{user?.user_id}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#1D2A44]" />
                        <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
