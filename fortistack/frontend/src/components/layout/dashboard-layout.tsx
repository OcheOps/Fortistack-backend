'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutDashboard, FileText, Settings, Users, LogOut, Shield, Menu, Bell, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#0B1220]">
            <div className="flex flex-col items-center gap-3 animate-pulse">
                <Shield className="h-10 w-10 text-[#2F7DFF]" />
                <p className="text-sm text-[#A9B5C7]">Loading…</p>
            </div>
        </div>
    );

    if (!user) return null;

    const navItems = [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Reports', href: '/reports', icon: FileText },
        { label: 'Integrations', href: '/settings', icon: Settings },
        ...(user.role === 'admin' ? [{ label: 'Tenants', href: '/tenants', icon: Users }] : []),
    ];

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-[#2F7DFF]/10 text-[#2F7DFF] border-[#2F7DFF]/20',
            tenant_admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            viewer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
        return styles[role] || styles.viewer;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0A0F1C] border-r border-[#1D2A44]">
            {/* Logo */}
            <div className="p-6 pb-8">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#2F7DFF] flex items-center justify-center shadow-lg shadow-[#2F7DFF]/20">
                        <Shield className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-white">FortiStack</h1>
                        <p className="text-[10px] text-[#A9B5C7]/60 uppercase tracking-[0.15em] font-medium">Assurance</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] font-medium text-[#A9B5C7]/40">Navigation</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                                isActive
                                    ? "bg-[#2F7DFF]/10 text-[#2F7DFF]"
                                    : "text-[#A9B5C7] hover:bg-[#1D2A44]/40 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2F7DFF] rounded-r-full" />
                            )}
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#2F7DFF]" : "text-[#A9B5C7]/60 group-hover:text-white")} />
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 m-3 rounded-lg bg-[#111A2E]/50 border border-[#1D2A44]/50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2F7DFF] to-[#1E40AF] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.role.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-xs font-medium text-white capitalize truncate">{user.role.replace('_', ' ')}</p>
                        <p className="text-[10px] text-[#A9B5C7]/60 truncate">{user.user_id?.slice(0, 12)}…</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#0B1220] text-[#E6EEF8]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-[240px] fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-[#0A0F1C] border-b border-[#1D2A44] z-50 flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#2F7DFF] flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm text-white">FortiStack</span>
                </div>
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44] h-8 w-8">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-[#1D2A44] w-[240px] bg-[#0A0F1C]">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-[240px] min-h-screen pt-14 md:pt-0">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-[#0B1220]/80 backdrop-blur-xl px-6 md:px-8 border-b border-[#1D2A44]/50 justify-between">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1.5 py-0.5 px-2.5 uppercase tracking-wider", getRoleBadge(user.role))}>
                            {user.role.replace('_', ' ')}
                        </Badge>
                        {user.tenant_id && (
                            <div className="flex items-center gap-1.5 text-xs text-[#A9B5C7]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                                <span className="font-mono text-[11px]">{user.tenant_id.slice(0, 8)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44] h-8 w-8 relative">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 gap-2 px-2 text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44]">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#2F7DFF] to-[#1E40AF] flex items-center justify-center text-white font-medium text-[10px]">
                                        {user.role.charAt(0).toUpperCase()}
                                    </div>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#111A2E] border-[#1D2A44] text-[#E6EEF8]" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs font-medium text-white">Signed in as</p>
                                        <p className="text-[11px] text-[#A9B5C7] font-mono truncate">{user.user_id}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#1D2A44]" />
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer text-xs"
                                >
                                    <LogOut className="mr-2 h-3.5 w-3.5" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
