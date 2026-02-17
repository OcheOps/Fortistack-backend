'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Report, RiskInput } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Download, FileText, Plus, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

// Determine base URL for download
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export default function ReportsPage() {
    const { user, activeTenant } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [open, setOpen] = useState(false);

    // Mock inputs for snapshot generator
    const [riskInput, setRiskInput] = useState<RiskInput>({
        uptime_metric: 99.9,
        last_backup_age_days: 0,
        open_ports_count: 0,
        public_exposure_found: false,
        logging_enabled: true,
        access_review_recent: true,
        monthly_spend_spike_percent: 0,
    });

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
            console.error(error);
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Map inputs to what backend expects (Capitalized? JSON tags in backend are usually lowercase or match struct)
            // Backend struct `risk.Input`: UptimeMetric (float64), LastBackupAgeDays, etc.
            // The JSON unmarshal usually is case-insensitive or uses tags.
            // Looking at `API_REFERENCE.md`, payload keys are Capitalized (UptimeMetric, etc.)
            // But let's check `backend/internal/risk/engine.go` input struct tags if possible.
            // Assuming the reference is correct and consistent with JSON tags.

            // Wait, reference said `UptimeMetric`, but frontend `types.ts` says `uptime_metric`.
            // I should send what backend expects.
            // Let's coerce to the Capitalized format shown in API Reference just in case, or use the type if I trust it.
            // Actually API reference payload example:
            /*
            {
                "UptimeMetric": 99.95,
                ...
            }
            */
            // So I need to capitalized keys.

            const payload = {
                UptimeMetric: Number(riskInput.uptime_metric),
                LastBackupAgeDays: Number(riskInput.last_backup_age_days),
                OpenPortsCount: Number(riskInput.open_ports_count),
                PublicExposureFound: Boolean(riskInput.public_exposure_found),
                LoggingEnabled: Boolean(riskInput.logging_enabled),
                AccessReviewRecent: Boolean(riskInput.access_review_recent),
                MonthlySpendSpikePercent: Number(riskInput.monthly_spend_spike_percent),
            };

            await api.post(`/tenants/${activeTenant}/reports/snapshot`, payload);
            toast.success('Report generated successfully');
            setOpen(false);
            fetchReports();
        } catch (error) {
            toast.error('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async (reportId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${BASE_URL}/reports/${reportId}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fortistack-report-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch (e) {
            toast.error('Download failed');
        }
    };

    if (!activeTenant) return <div className="text-center p-10 text-[#A9B5C7]">Select a tenant first.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Reports</h1>
                    <p className="text-[#A9B5C7]">Generate and manage compliance reports.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchReports} disabled={loading} className="border-[#1D2A44] bg-[#0B1220] hover:bg-[#1D2A44]">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                <Plus className="mr-2 h-4 w-4" /> Generate Snapshot
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8] sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>New Snapshot Assessment</DialogTitle>
                                <DialogDescription className="text-[#A9B5C7]">
                                    Provide current infrastructure metrics for risk analysis.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Uptime (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={riskInput.uptime_metric}
                                            onChange={e => setRiskInput({ ...riskInput, uptime_metric: Number(e.target.value) })}
                                            className="bg-[#0B1220] border-[#1D2A44]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Open Ports</Label>
                                        <Input
                                            type="number"
                                            value={riskInput.open_ports_count}
                                            onChange={e => setRiskInput({ ...riskInput, open_ports_count: Number(e.target.value) })}
                                            className="bg-[#0B1220] border-[#1D2A44]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Backup (Days)</Label>
                                        <Input
                                            type="number"
                                            value={riskInput.last_backup_age_days}
                                            onChange={e => setRiskInput({ ...riskInput, last_backup_age_days: Number(e.target.value) })}
                                            className="bg-[#0B1220] border-[#1D2A44]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Spend Spike (%)</Label>
                                        <Input
                                            type="number"
                                            value={riskInput.monthly_spend_spike_percent}
                                            onChange={e => setRiskInput({ ...riskInput, monthly_spend_spike_percent: Number(e.target.value) })}
                                            className="bg-[#0B1220] border-[#1D2A44]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={riskInput.public_exposure_found}
                                            onChange={e => setRiskInput({ ...riskInput, public_exposure_found: e.target.checked })}
                                            className="accent-[#2F7DFF] h-4 w-4"
                                        />
                                        <span className="text-sm">Public Exposure Found?</span>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={riskInput.logging_enabled}
                                            onChange={e => setRiskInput({ ...riskInput, logging_enabled: e.target.checked })}
                                            className="accent-[#2F7DFF] h-4 w-4"
                                        />
                                        <span className="text-sm">Logging Enabled?</span>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={riskInput.access_review_recent}
                                            onChange={e => setRiskInput({ ...riskInput, access_review_recent: e.target.checked })}
                                            className="accent-[#2F7DFF] h-4 w-4"
                                        />
                                        <span className="text-sm">Access Review Recent?</span>
                                    </label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleGenerate} disabled={generating} className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Generate Report
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                <Table>
                    <TableHeader className="border-b border-[#1D2A44] hover:bg-transparent">
                        <TableRow className="border-b border-[#1D2A44] hover:bg-transparent text-[#A9B5C7]">
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Global Score</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-[#A9B5C7]">
                                    No reports found. Generate one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map(report => (
                                <TableRow key={report.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/50">
                                    <TableCell className="font-medium text-white capitalize">
                                        {report.report_type}
                                    </TableCell>
                                    <TableCell className="text-[#A9B5C7]">
                                        {new Date(report.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-bold ${report.global_score >= 80 ? 'text-green-400' : report.global_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {report.global_score}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(report.id)} className="text-[#2F7DFF] hover:text-white hover:bg-[#2F7DFF]/20">
                                            <Download className="mr-2 h-4 w-4" /> PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
