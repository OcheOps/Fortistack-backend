import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type Tenant, type AlertConfig, type Report, type RiskInput } from '@/lib/types';

/* --- TENANTS --- */

export function useTenants() {
    return useQuery<Tenant[]>({
        queryKey: ['tenants'],
        queryFn: () => api.get<Tenant[]>('/tenants'),
    });
}

export function useTenant(id: string) {
    return useQuery<Tenant>({
        queryKey: ['tenants', id],
        queryFn: () => api.get<Tenant>(`/tenants/${id}`),
        enabled: !!id,
    });
}

export function useCreateTenant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: Partial<Tenant>) =>
            api.post<Tenant>('/tenants', input as Record<string, unknown>),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
    });
}

/* --- REPORTS --- */

export function useReports(tenantId: string) {
    return useQuery<Report[]>({
        queryKey: ['reports', tenantId],
        queryFn: () => api.get<Report[]>(`/tenants/${tenantId}/reports`),
        enabled: !!tenantId,
    });
}

export function useGenerateSnapshot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantId, input }: { tenantId: string; input: RiskInput }) =>
            api.post<Report>(`/tenants/${tenantId}/reports/snapshot`, input as unknown as Record<string, unknown>),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['reports', vars.tenantId] }),
    });
}

export function useDownloadReport() {
    return useMutation({
        mutationFn: async (reportId: string) => {
            const token = localStorage.getItem('access_token');
            const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

            const res = await fetch(`${baseUrl}/reports/${reportId}/download`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `report-${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        },
    });
}

/* --- ALERTS --- */

export function useAlertConfig(tenantId: string) {
    return useQuery<AlertConfig | null>({
        queryKey: ['alert-config', tenantId],
        queryFn: async () => {
            try {
                return await api.get<AlertConfig>(`/tenants/${tenantId}/alert-config`);
            } catch (error: unknown) {
                // Return null on 404 or error — let UI handle empty state
                console.warn('Failed to fetch alert config', error);
                return null;
            }
        },
        enabled: !!tenantId,
        retry: false,
    });
}

export function useUpdateAlertConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantId, config }: { tenantId: string; config: Partial<AlertConfig> }) =>
            api.put<AlertConfig>(`/tenants/${tenantId}/alert-config`, config as Record<string, unknown>),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['alert-config', vars.tenantId] }),
    });
}
