'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useTenants, useCreateTenant } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Plus, Building2, MapPin, Calendar, Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';

export default function TenantsPage() {
    const { user } = useAuth();
    const { data: tenants, isLoading } = useTenants();
    const createMutation = useCreateTenant();
    const { register, handleSubmit, reset } = useForm();
    const [open, setOpen] = useState(false);

    if (user?.role !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex h-64 flex-col items-center justify-center text-rose-500">
                    <p className="text-lg font-semibold">Access Denied</p>
                    <p className="text-sm">You do not have permission to view this page.</p>
                </div>
            </DashboardLayout>
        );
    }

    const onCreate = async (data: any) => {
        try {
            await createMutation.mutateAsync(data);
            reset();
            setOpen(false);
        } catch (e) {
            console.error(e);
            alert("Failed to create tenant");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Tenants</h2>
                    <p className="text-[#A9B5C7]">Manage authorized organizations and their subscriptions.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white shadow-md shadow-[#2F7DFF]/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0B1220] border-[#1D2A44] text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create New Tenant</DialogTitle>
                            <DialogDescription className="text-[#A9B5C7]">
                                Add a new organization to the platform.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onCreate)} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-[#E6EEF8]">Name</Label>
                                <Input
                                    placeholder="Acme Corp"
                                    {...register('name', { required: true })}
                                    className="bg-[#111A2E] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-[#E6EEF8]">Region</Label>
                                <Input
                                    placeholder="us-east-1"
                                    {...register('region', { required: true })}
                                    className="bg-[#111A2E] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/50"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white">All Tenants</CardTitle>
                            <CardDescription className="text-[#A9B5C7]">
                                A list of all registered tenants and their status.
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#A9B5C7]" />
                            <Input placeholder="Search tenants..." className="pl-8 bg-[#0B1220] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/50" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-[#1D2A44] hover:bg-transparent">
                                <TableHead className="text-[#A9B5C7]">Name</TableHead>
                                <TableHead className="text-[#A9B5C7]">Region</TableHead>
                                <TableHead className="text-[#A9B5C7]">Status</TableHead>
                                <TableHead className="text-[#A9B5C7]">Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-[#A9B5C7]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2F7DFF] border-t-transparent"></div>
                                            Loading tenants...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && tenants?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-[#A9B5C7]">No tenants found.</TableCell>
                                </TableRow>
                            )}
                            {tenants?.map((t) => (
                                <TableRow key={t.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/30">
                                    <TableCell className="font-medium text-white flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#2F7DFF]" />
                                        {t.name}
                                    </TableCell>
                                    <TableCell className="text-[#A9B5C7] flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {t.region}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={t.is_active ? 'default' : 'secondary'} className={t.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500"}>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[#A9B5C7]">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
