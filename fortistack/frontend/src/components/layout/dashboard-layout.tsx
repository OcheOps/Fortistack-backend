'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutDashboard, FileText, Settings, Users, LogOut, Shield, Menu, Bell } from 'lucide-react';
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
        <div className="flex h-screen items-center justify-center bg-background text-muted-foreground animate-pulse">
            <Shield className="h-10 w-10 text-primary opacity-50" />
        </div>
    );

    const navItems = [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        ...(user?.role === 'admin' ? [{ label: 'Tenants', href: '/tenants', icon: Users }] : []),
        { label: 'Reports', href: '/reports', icon: FileText },
        { label: 'Integrations', href: '/settings', icon: Settings },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0B1220] border-r border-[#1D2A44] text-[#E6EEF8]">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-6 w-6 text-[#2F7DFF]" />
                    <h1 className="text-xl font-bold tracking-tight text-white">FortiStack</h1>
                </div>
                <p className="text-xs text-[#A9B5C7] font-medium tracking-wide">Infrastructure Assurance</p>
            </div>

            <nav className="flex-1 px-3 mt-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-[#1D2A44]/50 text-[#2F7DFF]"
                                    : "text-[#A9B5C7] hover:bg-[#1D2A44]/30 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-[#2F7DFF]" : "text-[#A9B5C7] group-hover:text-white")} />
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[#1D2A44]">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-[#2F7DFF] flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#0B1220]">
                        {user?.role?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-white capitalize">{user?.role?.replace('_', ' ')}</p>
                        <p className="text-xs text-[#A9B5C7] truncate w-32" title={user?.user_id}>{user?.user_id}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-[#0B1220] border-b border-[#1D2A44] z-50 flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#2F7DFF]" />
                    <span className="font-bold text-white">FortiStack</span>
                </div>
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44]">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-[#1D2A44] w-64 bg-[#0B1220] text-white">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md px-8 border-b border-border justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal border-border bg-card/50 text-muted-foreground gap-1.5 py-1 px-3">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                            Tenant: <span className="font-semibold text-foreground">{user?.tenant_id || 'Global Context'}</span>
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-2 ring-border hover:ring-primary/50 transition-all p-0 overflow-hidden">
                                    <div className="h-full w-full bg-gradient-to-br from-[#2F7DFF] to-[#1E40AF] flex items-center justify-center text-white font-medium text-xs">
                                        {user?.role?.charAt(0).toUpperCase()}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">Signed in as</p>
                                        <p className="text-xs leading-none text-muted-foreground truncate">{user?.user_id}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
