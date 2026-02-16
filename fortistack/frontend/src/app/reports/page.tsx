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
import { format } from 'date-fns';
import { FileText, Download, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ReportsPage() {
    const { user } = useAuth();
    const { data: reports, isLoading, error } = useReports(user?.tenant_id || '');
    const downloadMutation = useDownloadReport();
    const snapshotMutation = useGenerateSnapshot();
    const [snapshotOpen, setSnapshotOpen] = useState(false);

    // Form for snapshot inputs
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
        downloadMutation.mutate(id);
    };

    const handleSnapshot = (data: any) => {
        if (!user?.tenant_id) return;

        // Convert string inputs to correct types
        const input = {
            uptime_metric: Number(data.uptime_metric),
            last_backup_age_days: Number(data.last_backup_age_days),
            open_ports_count: Number(data.open_ports_count),
            public_exposure_found: Boolean(data.public_exposure_found), // Checkbox handling needed if UI changes
            logging_enabled: true, // simplified for demo
            access_review_recent: true,
            monthly_spend_spike_percent: Number(data.monthly_spend_spike_percent),
        };

        snapshotMutation.mutate({ tenantId: user.tenant_id, input }, {
            onSuccess: () => setSnapshotOpen(false)
        });
    };

    const getScoreBadge = (score: number) => {
        if (score >= 90) return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Excellent ({score})</Badge>;
        if (score >= 70) return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Good ({score})</Badge>;
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Critical ({score})</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Reports</h2>
                    <p className="text-muted-foreground mt-1">
                        View and generate infrastructure assessment reports.
                    </p>
                </div>

                <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white shadow-lg shadow-[#2F7DFF]/20">
                            <Play className="mr-2 h-4 w-4" /> Run New Assessment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-[#0B1220] border-[#1D2A44] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Run Infrastructure Snapshot</DialogTitle>
                            <DialogDescription className="text-[#A9B5C7]">
                                Trigger a manual assessment of your infrastructure's current state.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleSnapshot)} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="uptime" className="text-right text-[#E6EEF8]">Uptime %</Label>
                                <Input id="uptime" type="number" step="0.01" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white" {...register('uptime_metric', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ports" className="text-right text-[#E6EEF8]">Open Ports</Label>
                                <Input id="ports" type="number" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white" {...register('open_ports_count', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="backup" className="text-right text-[#E6EEF8]">Backup Age (Days)</Label>
                                <Input id="backup" type="number" className="col-span-3 bg-[#111A2E] border-[#1D2A44] text-white" {...register('last_backup_age_days', { valueAsNumber: true })} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white" disabled={snapshotMutation.isPending}>
                                    {snapshotMutation.isPending ? 'Running...' : 'Start Assessment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg">
                <CardHeader>
                    <CardTitle className="text-white">Assessment History</CardTitle>
                    <CardDescription className="text-[#A9B5C7]">All generated reports for this tenant.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-[#1D2A44] hover:bg-transparent">
                                <TableHead className="text-[#A9B5C7]">Status</TableHead>
                                <TableHead className="text-[#A9B5C7]">Report Type</TableHead>
                                <TableHead className="text-[#A9B5C7]">Date Generated</TableHead>
                                <TableHead className="text-[#A9B5C7]">Global Score</TableHead>
                                <TableHead className="text-right text-[#A9B5C7]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-[#A9B5C7]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2F7DFF] border-t-transparent"></div>
                                            Loading reports...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {error && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-rose-500">
                                        Failed to load reports. Please try again.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && reports?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-[#1D2A44]" />
                                            <p className="text-[#A9B5C7]">No reports found. Generate your first snapshot to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {reports?.map((report) => (
                                <TableRow key={report.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/30">
                                    <TableCell>
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    </TableCell>
                                    <TableCell className="font-medium capitalize text-white flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-[#A9B5C7]" />
                                        {report.report_type} Snapshot
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[#E6EEF8]">
                                            <span>{format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                                            <span className="text-xs text-[#A9B5C7]">{format(new Date(report.created_at), 'h:mm a')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getScoreBadge(report.global_score)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" className="bg-[#0B1220] border-[#1D2A44] text-[#A9B5C7] hover:text-white hover:bg-[#1D2A44]" onClick={() => handleDownload(report.id)} disabled={downloadMutation.isPending}>
                                            <Download className="mr-2 h-3.5 w-3.5" /> Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
