import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type Tenant, type AlertConfig, type Report, type RiskInput } from '@/lib/types';

/* --- TENANTS --- */

export function useTenants() {
    return useQuery<Tenant[]>({
        queryKey: ['tenants'],
        queryFn: async () => {
            return await api.get<Tenant[]>('/tenants');
        }
    });
}

export function useTenant(id: string) {
    return useQuery<Tenant>({
        queryKey: ['tenants', id],
        queryFn: async () => {
            return await api.get<Tenant>(`/tenants/${id}`);
        },
        enabled: !!id
    });
}

export function useCreateTenant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: Partial<Tenant>) => {
            return await api.post<Tenant>('/tenants', input);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] })
    });
}

/* --- REPORTS --- */

export function useReports(tenantId: string) {
    return useQuery<Report[]>({
        queryKey: ['reports', tenantId],
        queryFn: async () => {
            // The API likely returns a list of reports. 
            // If the backend returns { data: [...] }, api.get unwraps it to [...]
            return await api.get<Report[]>(`/tenants/${tenantId}/reports`);
        },
        enabled: !!tenantId
    });
}

export function useGenerateSnapshot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, input }: { tenantId: string; input: RiskInput }) => {
            return await api.post<Report>(`/tenants/${tenantId}/reports/snapshot`, input);
        },
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['reports', vars.tenantId] })
    });
}

export function useDownloadReport() {
    return useMutation({
        mutationFn: async (reportId: string) => {
            const token = localStorage.getItem('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
            const url = `${baseUrl.replace(/\/$/, '')}/reports/${reportId}/download`;

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
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
        }
    });
}

/* --- ALERTS --- */

export function useAlertConfig(tenantId: string) {
    return useQuery<AlertConfig | null>({
        queryKey: ['alert-config', tenantId],
        queryFn: async () => {
            try {
                return await api.get<AlertConfig>(`/tenants/${tenantId}/alert-config`);
            } catch (error: any) {
                // Return null if not found or error, let UI handle empty state
                console.warn('Failed to fetch alert config', error);
                return null;
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
            return await api.put<AlertConfig>(`/tenants/${tenantId}/alert-config`, config);
        },
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['alert-config', vars.tenantId] })
    });
}
