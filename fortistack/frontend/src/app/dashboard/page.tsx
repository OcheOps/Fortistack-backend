'use client';

import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useReports } from '@/hooks/use-queries';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: reports } = useReports(user?.tenant_id || '');

    const latestReport = reports && reports.length > 0 ? reports[0] : null;
    // API returns list. If sorted by backend, usually latest first? 
    // Or we sort here:
    const sortedReports = reports?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sortedReports?.[0];

    return (
        <DashboardLayout>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Security Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{latest ? latest.global_score : '--'}</div>
                        <p className="text-xs text-muted-foreground">{latest ? `Latest snapshot: ${new Date(latest.created_at).toLocaleDateString()}` : 'No reports found'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Compliance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Backend doesn't split score by category in ListReports response, only in details. */}
                        <div className="text-4xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Detail available in full report</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Reports Generated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{reports?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Total reports</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex space-x-4">
                    <a href="/reports" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">Go to Reports</a>
                    <a href="/settings" className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80">Configure Alerts</a>
                </div>
            </div>
        </DashboardLayout>
    );
}
