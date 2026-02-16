'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useReports, useDownloadReport, useGenerateSnapshot } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileText, Download, Play, CheckCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ReportsPage() {
    const { user } = useAuth();
    const { data: reports, isLoading, error } = useReports(user?.tenant_id || '');
    const downloadMutation = useDownloadReport();
    const snapshotMutation = useGenerateSnapshot();
    const [snapshotOpen, setSnapshotOpen] = useState(false);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            uptime_metric: 99.9,
            last_backup_age_days: 0,
            open_ports_count: 0,
            public_exposure_found: false,
            logging_enabled: true,
            access_review_recent: true,
            monthly_spend_spike_percent: 0,
        }
    });

    const handleDownload = (id: string) => {
        downloadMutation.mutate(id, {
            onSuccess: () => toast.success('Report downloaded'),
            onError: () => toast.error('Download failed'),
        });
    };

    const handleSnapshot = (data: Record<string, unknown>) => {
        if (!user?.tenant_id) return;

        const input = {
            uptime_metric: Number(data.uptime_metric),
            last_backup_age_days: Number(data.last_backup_age_days),
            open_ports_count: Number(data.open_ports_count),
            public_exposure_found: Boolean(data.public_exposure_found),
            logging_enabled: true,
            access_review_recent: true,
            monthly_spend_spike_percent: Number(data.monthly_spend_spike_percent),
        };

        snapshotMutation.mutate({ tenantId: user.tenant_id, input }, {
            onSuccess: () => {
                setSnapshotOpen(false);
                toast.success('Assessment complete', { description: 'Your infrastructure snapshot has been generated.' });
            },
            onError: (err) => toast.error('Assessment failed', { description: err.message }),
        });
    };

    const scoreBadge = (score: number) => {
        if (score >= 90) return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{score} Excellent</Badge>;
        if (score >= 70) return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{score} Good</Badge>;
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">{score} Critical</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Reports</h2>
                    <p className="text-[#A9B5C7] text-sm mt-1">
                        View and generate infrastructure assessment reports.
                    </p>
                </div>

                <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white shadow-[0_0_15px_rgba(47,125,255,0.2)] h-9 text-xs">
                            <Zap className="mr-1.5 h-3.5 w-3.5" /> Run New Assessment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] bg-[#0B1220] border-[#1D2A44] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg text-white">Run Infrastructure Snapshot</DialogTitle>
                            <DialogDescription className="text-[#A9B5C7] text-xs">
                                Provide current metrics to generate an infrastructure risk assessment.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleSnapshot)} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="uptime" className="text-right text-xs text-[#A9B5C7]">Uptime %</Label>
                                <Input id="uptime" type="number" step="0.01" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white h-9 text-xs" {...register('uptime_metric', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ports" className="text-right text-xs text-[#A9B5C7]">Open Ports</Label>
                                <Input id="ports" type="number" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white h-9 text-xs" {...register('open_ports_count', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="backup" className="text-right text-xs text-[#A9B5C7]">Backup Age</Label>
                                <Input id="backup" type="number" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white h-9 text-xs" {...register('last_backup_age_days', { valueAsNumber: true })} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs h-9" disabled={snapshotMutation.isPending}>
                                    {snapshotMutation.isPending ? 'Running…' : 'Start Assessment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white">Assessment History</CardTitle>
                    <CardDescription className="text-xs text-[#A9B5C7]/60">All generated reports for this tenant.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-[#1D2A44]" />)}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-rose-400 text-sm">Failed to load reports.</div>
                    ) : !reports || reports.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#1D2A44] flex items-center justify-center mb-4">
                                <FileText className="h-5 w-5 text-[#A9B5C7]/30" />
                            </div>
                            <p className="text-sm text-[#A9B5C7]/60 mb-1">Generate your first report</p>
                            <p className="text-xs text-[#A9B5C7]/40 mb-4">Run an assessment to see your infrastructure health.</p>
                            <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs" onClick={() => setSnapshotOpen(true)}>
                                <Play className="mr-1.5 h-3.5 w-3.5" /> Run Assessment
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-[#1D2A44] overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-[#1D2A44] hover:bg-transparent bg-[#0A0F1C]/50">
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Status</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Type</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Date</TableHead>
                                        <TableHead className="text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Score</TableHead>
                                        <TableHead className="text-right text-[#A9B5C7]/60 text-[10px] uppercase tracking-wider font-medium">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report.id} className="border-b border-[#1D2A44]/50 hover:bg-[#1D2A44]/20">
                                            <TableCell>
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                            </TableCell>
                                            <TableCell className="font-medium capitalize text-white text-xs">
                                                {report.report_type}
                                            </TableCell>
                                            <TableCell className="text-xs text-[#A9B5C7]">
                                                {format(new Date(report.created_at), 'MMM d, yyyy · h:mm a')}
                                            </TableCell>
                                            <TableCell>{scoreBadge(report.global_score)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44] h-7 text-[11px] px-2" onClick={() => handleDownload(report.id)} disabled={downloadMutation.isPending}>
                                                    <Download className="mr-1 h-3 w-3" /> PDF
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
