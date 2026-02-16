'use client';

import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useReports } from '@/hooks/use-queries';
import { ShieldCheck, FileText, Activity, AlertTriangle, CheckCircle, TrendingUp, Download, ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: reports, isLoading } = useReports(user?.tenant_id || '');

    const sorted = [...(reports || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];

    const scoreColor = (s: number) => s >= 90 ? 'text-emerald-400' : s >= 70 ? 'text-amber-400' : 'text-rose-400';
    const scoreBg = (s: number) => s >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : s >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    const scoreLabel = (s: number) => s >= 90 ? 'Excellent' : s >= 70 ? 'Good' : 'Critical';

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-8">
                    <div>
                        <Skeleton className="h-8 w-40 bg-[#1D2A44]" />
                        <Skeleton className="h-4 w-72 mt-2 bg-[#1D2A44]" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl bg-[#111A2E] border border-[#1D2A44]" />)}
                    </div>
                    <Skeleton className="h-80 rounded-xl bg-[#111A2E] border border-[#1D2A44]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Overview</h2>
                    <p className="text-[#A9B5C7] text-sm mt-1">
                        Infrastructure health at a glance.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent border-[#1D2A44] text-[#A9B5C7] hover:bg-[#1D2A44] hover:text-white h-9 text-xs" asChild>
                        <Link href="/reports"><FileText className="mr-1.5 h-3.5 w-3.5" /> All Reports</Link>
                    </Button>
                    <Button size="sm" className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white shadow-[0_0_15px_rgba(47,125,255,0.2)] h-9 text-xs" asChild>
                        <Link href="/reports"><Zap className="mr-1.5 h-3.5 w-3.5" /> Run Assessment</Link>
                    </Button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-5 md:grid-cols-3">
                {/* Infrastructure Score */}
                <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <Shield className="w-32 h-32 text-[#2F7DFF]" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[11px] font-medium text-[#A9B5C7] uppercase tracking-[0.12em]">Infrastructure Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-5xl font-bold tracking-tighter tabular-nums ${latest ? scoreColor(latest.global_score) : 'text-[#A9B5C7]/30'}`}>
                                {latest ? latest.global_score : '—'}
                            </span>
                            {latest && (
                                <Badge variant="outline" className={`text-[10px] ${scoreBg(latest.global_score)}`}>
                                    {scoreLabel(latest.global_score)}
                                </Badge>
                            )}
                        </div>
                        <p className="text-[11px] text-[#A9B5C7]/60 mt-4 flex items-center gap-1.5">
                            {latest ? (
                                <>
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                    Assessed {format(new Date(latest.created_at), 'MMM d, h:mm a')}
                                </>
                            ) : 'No assessments run yet'}
                        </p>
                    </CardContent>
                </Card>

                {/* Top Findings */}
                <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[11px] font-medium text-[#A9B5C7] uppercase tracking-[0.12em]">Top Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {latest?.details?.findings && latest.details.findings.length > 0 ? (
                            <div className="space-y-3">
                                {latest.details.findings.slice(0, 3).map((f, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${f.severity === 'critical' || f.severity === 'high' ? 'text-rose-400' : f.severity === 'medium' ? 'text-amber-400' : 'text-[#A9B5C7]/40'}`} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{f.title}</p>
                                            <p className="text-[10px] text-[#A9B5C7]/60 truncate">{f.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <ShieldCheck className="h-8 w-8 text-emerald-500/20 mb-2" />
                                <p className="text-xs text-[#A9B5C7]/50">{latest ? 'No findings detected' : 'Run an assessment first'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[11px] font-medium text-[#A9B5C7] uppercase tracking-[0.12em]">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start h-10 text-xs bg-transparent border-[#1D2A44] text-[#A9B5C7] hover:bg-[#1D2A44] hover:text-white" asChild>
                            <Link href="/reports"><TrendingUp className="mr-2 h-3.5 w-3.5 text-[#2F7DFF]" /> Generate Snapshot</Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-10 text-xs bg-transparent border-[#1D2A44] text-[#A9B5C7] hover:bg-[#1D2A44] hover:text-white" asChild>
                            <Link href="/settings"><Activity className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Configure Integrations</Link>
                        </Button>
                        {user?.role === 'admin' && (
                            <Button variant="outline" className="w-full justify-start h-10 text-xs bg-transparent border-[#1D2A44] text-[#A9B5C7] hover:bg-[#1D2A44] hover:text-white" asChild>
                                <Link href="/tenants"><Shield className="mr-2 h-3.5 w-3.5 text-amber-400" /> Manage Tenants</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Reports Table */}
            <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-white">Recent Assessments</CardTitle>
                            <CardDescription className="text-xs text-[#A9B5C7]/60">Snapshot and compliance history</CardDescription>
                        </div>
                        {sorted.length > 0 && (
                            <Button variant="ghost" size="sm" className="text-[#2F7DFF] hover:text-[#2F7DFF] hover:bg-[#2F7DFF]/10 text-xs" asChild>
                                <Link href="/reports">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {sorted.length > 0 ? (
                        <div className="rounded-lg border border-[#1D2A44] overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#0A0F1C]/50">
                                        <th className="h-9 px-4 text-left font-medium text-[#A9B5C7]/60 uppercase tracking-wider text-[10px]">Type</th>
                                        <th className="h-9 px-4 text-left font-medium text-[#A9B5C7]/60 uppercase tracking-wider text-[10px]">Date</th>
                                        <th className="h-9 px-4 text-left font-medium text-[#A9B5C7]/60 uppercase tracking-wider text-[10px]">Score</th>
                                        <th className="h-9 px-4 text-right font-medium text-[#A9B5C7]/60 uppercase tracking-wider text-[10px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.slice(0, 5).map((r) => (
                                        <tr key={r.id} className="border-t border-[#1D2A44]/50 hover:bg-[#1D2A44]/20 transition-colors">
                                            <td className="p-4 text-white font-medium capitalize flex items-center gap-2">
                                                <div className="p-1 rounded bg-[#2F7DFF]/10">
                                                    <Activity className="h-3 w-3 text-[#2F7DFF]" />
                                                </div>
                                                {r.report_type}
                                            </td>
                                            <td className="p-4 text-[#A9B5C7]">{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                                            <td className="p-4"><span className={`font-bold tabular-nums ${scoreColor(r.global_score)}`}>{r.global_score}</span></td>
                                            <td className="p-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44] h-7 text-[11px] px-2">
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#1D2A44] flex items-center justify-center mb-4">
                                <TrendingUp className="h-5 w-5 text-[#A9B5C7]/30" />
                            </div>
                            <p className="text-sm text-[#A9B5C7]/60 mb-4">No reports yet. Run your first assessment.</p>
                            <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs shadow-[0_0_15px_rgba(47,125,255,0.2)]" asChild>
                                <Link href="/reports">Generate First Report</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
