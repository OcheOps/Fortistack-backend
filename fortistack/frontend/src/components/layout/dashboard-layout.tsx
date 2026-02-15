'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Assuming you have Sheet
import { Menu, LayoutDashboard, FileText, Settings, Users, LogOut, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ...(user?.role === 'admin' ? [{ label: 'Tenants', href: '/tenants', icon: Users }] : []),
        { label: 'Reports', href: '/reports', icon: FileText },
        { label: 'Integrations', href: '/settings', icon: Settings },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0B1F3B] text-white">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">FortiStack</h1>
                <p className="text-xs text-gray-400 mt-1">Infrastructure Assurance</p>
            </div>

            <nav className="flex-1 px-4 mt-6 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </nav>

            <div className="p-4 bg-[#08162b]">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        {user?.role?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{user?.role}</p>
                        <p className="text-xs text-gray-500 truncate w-32">{user?.user_id}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-[#0B1F3B] text-white z-50 flex items-center justify-between p-4">
                <span className="font-bold">FortiStack</span>
                {/* Mobile Menu Trigger would go here using Sheet */}
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Mobile Sidebar (Simplified for now, assumes Sheet or conditional render) */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileOpen(false)}>
                    <div className="w-64 h-full" onClick={e => e.stopPropagation()}>
                        <SidebarContent />
                    </div>
                </div>
            )}

            <main className="flex-1 md:ml-64 min-h-screen">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm justify-between">
                    <div className="flex items-center gap-2">
                        {/* Tenant Switcher Placeholder */}
                        <div className="text-sm text-muted-foreground">
                            Tenant: <span className="font-medium text-foreground">{user?.tenant_id || 'Global'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                        <span className="text-xs font-medium text-slate-600">
                                            {user?.role?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">Account</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
