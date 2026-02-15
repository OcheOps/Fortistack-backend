'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useReports, useDownloadReport, useGenerateSnapshot } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

export default function ReportsPage() {
    const { user } = useAuth();
    const { data: reports, isLoading, error } = useReports(user?.tenant_id || '');
    const downloadMutation = useDownloadReport();
    const snapshotMutation = useGenerateSnapshot();

    const handleDownload = (id: string) => {
        downloadMutation.mutate(id);
    };

    const handleSnapshot = () => {
        if (!user?.tenant_id) return;
        // Mock input for demo purposes
        const input = {
            uptime_metric: 99.9,
            last_backup_age_days: 0,
            open_ports_count: 0,
            public_exposure_found: false,
            logging_enabled: true,
            access_review_recent: true,
            monthly_spend_spike_percent: 0,
        };
        snapshotMutation.mutate({ tenantId: user.tenant_id, input });
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Reports</h2>
                <div className="space-x-2">
                    <Button onClick={handleSnapshot} disabled={snapshotMutation.status === 'pending'}>
                        {snapshotMutation.status === 'pending' ? 'Generating...' : 'New Snapshot'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-medium text-gray-500">Type</th>
                                <th className="p-4 font-medium text-gray-500">Date</th>
                                <th className="p-4 font-medium text-gray-500">Global Score</th>
                                <th className="p-4 font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">Loading reports...</td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-red-500">Failed to load reports</td>
                                </tr>
                            )}
                            {reports?.map((report) => (
                                <tr key={report.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 capitalize">{report.report_type}</td>
                                    <td className="p-4">{format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-sm ${report.global_score >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {report.global_score}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(report.id)}>
                                            Download PDF
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && reports?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">No reports found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
