'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Report } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Activity, ShieldCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DashboardPage() {
    const { user, activeTenant } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTenant) {
            fetchReports();
        }
    }, [activeTenant]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await api.get<Report[]>(`/tenants/${activeTenant}/reports`);
            if (data) setReports(data);
        } catch (error) {
            console.error('Failed to load reports', error);
        } finally {
            setLoading(false);
        }
    };

    if (!activeTenant) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center">
                <ShieldCheck className="h-16 w-16 text-[#2F7DFF] mb-4" />
                <h2 className="text-xl font-semibold text-white">Select a Tenant</h2>
                <p className="text-[#A9B5C7] mt-2">Please select an organization from the top bar to view their dashboard.</p>
            </div>
        );
    }

    const latestReport = reports.length > 0 ? reports[0] : null;
    const score = latestReport?.global_score || 0;

    // Color code score
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-400';
        if (s >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
                    <p className="text-[#A9B5C7]">Infrastructure health overview.</p>
                </div>
                <Button asChild className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                    <Link href="/reports">
                        View All Reports <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A9B5C7]">Global Risk Score</CardTitle>
                        <Activity className="h-4 w-4 text-[#2F7DFF]" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                            {latestReport ? `${score}/100` : 'No Data'}
                        </div>
                        <p className="text-xs text-[#A9B5C7] mt-1">
                            {latestReport ? `Last assessment: ${new Date(latestReport.created_at).toLocaleDateString()}` : 'Run a snapshot to generate score'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A9B5C7]">Reports Generated</CardTitle>
                        <FileText className="h-4 w-4 text-[#2F7DFF]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{reports.length}</div>
                        <p className="text-xs text-[#A9B5C7] mt-1">Total reports on file</p>
                    </CardContent>
                </Card>
                <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A9B5C7]">Critical Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {latestReport?.details?.findings?.filter(f => f.severity === 'critical').length || 0}
                        </div>
                        <p className="text-xs text-[#A9B5C7] mt-1">From latest snapshot</p>
                    </CardContent>
                </Card>
                <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A9B5C7]">Infrastructure Status</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">Stable</div>
                        <p className="text-xs text-[#A9B5C7] mt-1">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Activity</CardTitle>
                        <CardDescription className="text-[#A9B5C7]">
                            Latest reports and assessments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reports.slice(0, 5).map(report => (
                                <div key={report.id} className="flex items-center justify-between border-b border-[#1D2A44] pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border border-[#1D2A44] bg-[#0B1220]`}>
                                            <FileText className="h-4 w-4 text-[#2F7DFF]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-white leading-none">
                                                {report.report_type === 'snapshot' ? 'Snapshot Assessment' : 'Monthly Report'}
                                            </p>
                                            <p className="text-sm text-[#A9B5C7]">
                                                Score: {report.global_score}/100
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-[#A9B5C7]">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {reports.length === 0 && (
                                <p className="text-sm text-[#A9B5C7]">No reports generated yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-[#1D2A44] bg-[#111A2E]/50">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                        <CardDescription className="text-[#A9B5C7]">
                            Manage your infrastructure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start border-[#1D2A44] bg-[#0B1220] hover:bg-[#1D2A44] text-[#E6EEF8]" asChild>
                            <Link href="/reports">
                                <Activity className="mr-2 h-4 w-4" /> Run New Snapshot
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-[#1D2A44] bg-[#0B1220] hover:bg-[#1D2A44] text-[#E6EEF8]" asChild>
                            <Link href="/integrations">
                                <AlertTriangle className="mr-2 h-4 w-4" /> Configure Alerts
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
