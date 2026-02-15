import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type Tenant, type AlertConfig, type Report, type RiskInput } from '@/lib/types';

/* --- TENANTS --- */

export function useTenants() {
    return useQuery<Tenant[]>({
        queryKey: ['tenants'],
        queryFn: async () => {
            const { data } = await api.get('/tenants');
            if (data.error) throw data.error;
            return (data.data as Tenant[]) || [];
        }
    });
}

export function useTenant(id: string) {
    return useQuery<Tenant>({
        queryKey: ['tenants', id],
        queryFn: async () => {
            const { data } = await api.get(`/tenants/${id}`);
            if (data.error) throw data.error;
            return data.data as Tenant;
        },
        enabled: !!id
    });
}

export function useCreateTenant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: Partial<Tenant>) => {
            const { data } = await api.post('/tenants', input);
            if (data.error) throw data.error;
            return data.data as Tenant;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] })
    });
}

/* --- REPORTS --- */

export function useReports(tenantId: string) {
    return useQuery<Report[]>({
        queryKey: ['reports', tenantId],
        queryFn: async () => {
            const { data } = await api.get(`/tenants/${tenantId}/reports`);
            if (data.error) throw data.error;
            return (data.data as Report[]) || [];
        },
        enabled: !!tenantId
    });
}

export function useGenerateSnapshot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, input }: { tenantId: string; input: RiskInput }) => {
            const { data } = await api.post(`/tenants/${tenantId}/reports/snapshot`, input);
            if (data.error) throw data.error;
            return data.data as Report;
        },
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['reports', vars.tenantId] })
    });
}

export function useDownloadReport() {
    return useMutation({
        mutationFn: async (reportId: string) => {
            const res = await api.get(`/reports/${reportId}/download`, {
                responseType: 'blob'
            });
            // Force download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    });
}

/* --- ALERTS --- */

export function useAlertConfig(tenantId: string) {
    return useQuery<AlertConfig | null>({
        queryKey: ['alert-config', tenantId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/tenants/${tenantId}/alert-config`);
                // Backend might return null data if no config exists, or 404
                if (data.error) throw data.error;
                return data.data as AlertConfig;
            } catch (error: any) {
                // Determine if 404 or empty
                if (error.response?.status === 404) return null;
                throw error;
            }
        },
        enabled: !!tenantId,
        retry: false
    });
}

export function useUpdateAlertConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, config }: { tenantId: string; config: Partial<AlertConfig> }) => {
            const { data } = await api.put(`/tenants/${tenantId}/alert-config`, config);
            if (data.error) throw data.error;
            return data.data as AlertConfig;
        },
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['alert-config', vars.tenantId] })
    });
}
