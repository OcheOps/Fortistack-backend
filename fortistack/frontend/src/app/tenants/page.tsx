'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useTenants, useCreateTenant } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

export default function TenantsPage() {
    const { user } = useAuth();
    const { data: tenants, isLoading } = useTenants();
    const createMutation = useCreateTenant();
    const { register, handleSubmit, reset } = useForm();
    const [showCreate, setShowCreate] = useState(false);

    if (user?.role !== 'admin') {
        return <DashboardLayout><p className="text-red-500">Access Denied</p></DashboardLayout>;
    }

    const onCreate = (data: any) => {
        createMutation.mutate(data);
        reset();
        setShowCreate(false);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Tenants</h2>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? 'Cancel' : 'Create Tenant'}
                </Button>
            </div>

            {showCreate && (
                <Card className="mb-6 p-4">
                    <CardHeader><CardTitle>New Tenant</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onCreate)} className="flex gap-4 items-end">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input placeholder="Acme Corp" {...register('name', { required: true })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Region</label>
                                <Input placeholder="us-east-1" {...register('region', { required: true })} />
                            </div>
                            <Button type="submit">Create</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-medium text-gray-500">Name</th>
                                <th className="p-4 font-medium text-gray-500">Region</th>
                                <th className="p-4 font-medium text-gray-500">Status</th>
                                <th className="p-4 font-medium text-gray-500">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>}
                            {tenants?.map((t) => (
                                <tr key={t.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{t.name}</td>
                                    <td className="p-4">{t.region}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
