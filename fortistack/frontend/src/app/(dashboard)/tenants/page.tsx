'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Tenant } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Plus, Loader2, RefreshCcw, Pencil, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function TenantsPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Form
    const [name, setName] = useState('');
    const [region, setRegion] = useState('us-east-1');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchTenants();
        }
    }, [user]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const data = await api.get<Tenant[]>('/tenants');
            if (data) setTenants(data);
        } catch (error) {
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingTenant(null);
        setName('');
        setRegion('us-east-1');
        setIsActive(true);
        setDialogOpen(true);
    };

    const openEdit = (t: Tenant) => {
        setEditingTenant(t);
        setName(t.name);
        setRegion(t.region);
        setIsActive(t.is_active);
        setDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTenant) {
                // Edit
                await api.patch(`/tenants/${editingTenant.id}`, { name, region, is_active: isActive });
                toast.success('Tenant updated');
            } else {
                // Create
                await api.post('/tenants', { name, region }); // Create endpoint might not take is_active, defaults true
                toast.success('Tenant created');
            }
            setDialogOpen(false);
            fetchTenants();
        } catch (error) {
            toast.error(editingTenant ? 'Failed to update tenant' : 'Failed to create tenant');
        } finally {
            setSaving(false);
        }
    };

    if (user?.role !== 'admin') return <div className="p-10 text-center text-[#A9B5C7]">Access Denied</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Tenants</h1>
                    <p className="text-[#A9B5C7]">Manage your organizations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchTenants} className="border-[#1D2A44] bg-[#0B1220]">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openCreate} className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Tenant
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-[#1D2A44] bg-[#111A2E]/50">
                <Table>
                    <TableHeader className="border-b border-[#1D2A44] hover:bg-transparent">
                        <TableRow className="border-b border-[#1D2A44] hover:bg-transparent text-[#A9B5C7]">
                            <TableHead>Name</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/50">
                                <TableCell className="font-medium text-white">{tenant.name}</TableCell>
                                <TableCell className="text-[#A9B5C7]">{tenant.region}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${tenant.is_active ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-red-400/10 text-red-400 ring-red-400/20'}`}>
                                        {tenant.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-[#A9B5C7] hover:text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8]">
                                            <DropdownMenuItem onClick={() => openEdit(tenant)} className="cursor-pointer focus:bg-[#2F7DFF]/20">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8]">
                    <DialogHeader>
                        <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
                        <DialogDescription className="text-[#A9B5C7]">
                            {editingTenant ? 'Update organization details.' : 'Add a new organization.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} required className="bg-[#0B1220] border-[#1D2A44]" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Region</Label>
                                <Input value={region} onChange={e => setRegion(e.target.value)} required className="bg-[#0B1220] border-[#1D2A44]" />
                            </div>
                            {editingTenant && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={isActive}
                                        onChange={e => setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#2F7DFF] focus:ring-[#2F7DFF]"
                                    />
                                    <Label htmlFor="active">Active</Label>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving} className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
