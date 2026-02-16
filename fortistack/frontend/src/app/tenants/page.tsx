'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useTenants, useCreateTenant } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Plus, Building2, MapPin, Calendar, Search, Shield } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TenantFormValues {
    name: string;
    region: string;
}

export default function TenantsPage() {
    const { user } = useAuth();
    const { data: tenants, isLoading } = useTenants();
    const createMutation = useCreateTenant();
    const { register, handleSubmit, reset } = useForm<TenantFormValues>();
    const [open, setOpen] = useState(false);

    if (user?.role !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex h-64 flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                        <Shield className="h-5 w-5 text-rose-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Access Denied</p>
                    <p className="text-xs text-[#A9B5C7]/60 mt-1">You do not have admin privileges.</p>
                </div>
            </DashboardLayout>
        );
    }

    const onCreate = async (data: TenantFormValues) => {
        try {
            await createMutation.mutateAsync(data);
            reset();
            setOpen(false);
            toast.success('Tenant created', { description: `${data.name} has been added.` });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create tenant';
            toast.error('Creation failed', { description: message });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Tenants</h2>
                    <p className="text-[#A9B5C7] text-sm mt-1">Manage authorized organizations.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white shadow-[0_0_15px_rgba(47,125,255,0.2)] h-9 text-xs">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0B1220] border-[#1D2A44] text-white sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="text-lg text-white">Create New Tenant</DialogTitle>
                            <DialogDescription className="text-[#A9B5C7] text-xs">
                                Add a new organization to the platform.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onCreate)} className="space-y-4 pt-2">
                            <div className="grid gap-2">
                                <Label className="text-xs text-[#A9B5C7]">Organization Name</Label>
                                <Input
                                    placeholder="Acme Corp"
                                    {...register('name', { required: true })}
                                    className="h-9 text-xs bg-[#111A2E] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/30"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs text-[#A9B5C7]">Region</Label>
                                <Input
                                    placeholder="us-east-1"
                                    {...register('region', { required: true })}
                                    className="h-9 text-xs bg-[#111A2E] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/30"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs h-9" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating…' : 'Create Tenant'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-white">All Tenants</CardTitle>
                            <CardDescription className="text-xs text-[#A9B5C7]/60">
                                Registered organizations and their status.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-[#1D2A44]" />)}
                        </div>
                    ) : !tenants || tenants.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#1D2A44] flex items-center justify-center mb-4">
                                <Building2 className="h-5 w-5 text-[#A9B5C7]/30" />
                            </div>
                            <p className="text-sm text-[#A9B5C7]/60 mb-4">No tenants found.</p>
                            <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs" onClick={() => setOpen(true)}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Tenant
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-[#1D2A44] overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-[#1D2A44] hover:bg-transparent bg-[#0A0F1C]/50">
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Name</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Region</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Status</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.map((t) => (
                                        <TableRow key={t.id} className="border-b border-[#1D2A44]/50 hover:bg-[#1D2A44]/20">
                                            <TableCell className="font-medium text-white text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded bg-[#2F7DFF]/10">
                                                        <Building2 className="h-3 w-3 text-[#2F7DFF]" />
                                                    </div>
                                                    {t.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-[#A9B5C7] flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />
                                                {t.region}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={t.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-[10px]"}>
                                                    {t.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-[#A9B5C7]">
                                                {new Date(t.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
