'use client';

import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useReports } from '@/hooks/use-queries';
import { ShieldAlert, ShieldCheck, FileText, Activity, AlertTriangle, CheckCircle, TrendingUp, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: reports, isLoading } = useReports(user?.tenant_id || '');

    const sortedReports = reports?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
    const latestReport = sortedReports[0];

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 90) return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Excellent</Badge>;
        if (score >= 70) return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Good</Badge>;
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">Critical</Badge>;
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl bg-card border border-border" />
                    ))}
                </div>
                <div className="mt-8">
                    <Skeleton className="h-96 w-full rounded-xl bg-card border border-border" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Infrastructure health at a glance.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="bg-card hover:bg-zinc-800 text-muted-foreground border-border hover:text-white" asChild>
                        <Link href="/reports">
                            <FileText className="mr-2 h-4 w-4" /> Reports
                        </Link>
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 backdrop-blur-md" asChild>
                        <Link href="/reports/new">
                            <Activity className="mr-2 h-4 w-4" /> Run Assessment
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Score Card */}
                <Card className="bg-card border-border shadow-lg shadow-black/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Infrastructure Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-bold tracking-tight ${latestReport ? getScoreColor(latestReport.global_score) : 'text-muted-foreground'}`}>
                                {latestReport ? latestReport.global_score : '--'}
                            </span>
                            {latestReport && getScoreBadge(latestReport.global_score)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                            {latestReport ? (
                                <>
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Verified {format(new Date(latestReport.created_at), 'MMM d, h:mm a')}</span>
                                </>
                            ) : (
                                <span>No assessments run yet</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Latest Report Card */}
                <Card className="bg-card border-border shadow-lg shadow-black/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {latestReport ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                                        <span className="text-sm font-medium text-foreground">Security Baseline</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">Passed</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-emerald-500" />
                                        <span className="text-sm font-medium text-foreground">Backup Systems</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">Optimal</span>
                                </div>
                                <div className="pt-2">
                                    <Button variant="ghost" size="sm" className="w-full justify-between text-primary hover:text-primary/80 hover:bg-primary/10 group-hover:translate-x-1 transition-all p-0 h-auto" asChild>
                                        <Link href={`/reports/${latestReport.id}`}>
                                            View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No reports available</p>
                                <Button variant="link" className="text-primary" asChild>
                                    <Link href="/reports/new">Generate one now</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions / Integration Status */}
                <Card className="bg-card border-border shadow-lg shadow-black/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">API Connection</p>
                                        <p className="text-xs text-emerald-500">Operational</p>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="border-dashed border-border bg-transparent hover:bg-secondary/50 hover:text-white h-auto py-3 flex flex-col gap-1 items-center justify-center" asChild>
                                    <Link href="/settings">
                                        <span className="text-xs text-muted-foreground">Integrations</span>
                                        <span className="text-sm font-medium">Configure</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="border-dashed border-border bg-transparent hover:bg-secondary/50 hover:text-white h-auto py-3 flex flex-col gap-1 items-center justify-center" asChild>
                                    <Link href="/reports">
                                        <span className="text-xs text-muted-foreground">History</span>
                                        <span className="text-sm font-medium">View All</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Reports Table */}
            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium text-white">Recent Assessments</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            History of infrastructure snapshots and compliance checks.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {sortedReports.length > 0 ? (
                        <div className="rounded-md border border-border overflow-hidden">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="bg-[#111A2E] [&_tr]:border-b [&_tr]:border-[#1D2A44]">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Report Type</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Score</th>
                                        <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {sortedReports.slice(0, 5).map((report) => (
                                        <tr key={report.id} className="border-b border-[#1D2A44] transition-colors hover:bg-[#1D2A44]/30">
                                            <td className="p-4 align-middle font-medium text-white capitalize flex items-center gap-2">
                                                <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                                                    {report.report_type === 'snapshot' ? <Activity className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                                </div>
                                                {report.report_type}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {format(new Date(report.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`font-bold ${getScoreColor(report.global_score)}`}>{report.global_score}</span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-secondary" asChild>
                                                    <Link href={`/reports/${report.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                            <p>No reports generated yet.</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href="/reports/new">Run first assessment</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
