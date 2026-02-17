'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { ScanTarget, ScanRun } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Play, RefreshCcw, Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

export default function ScansPage() {
    const { activeTenant } = useAuth();
    const [targets, setTargets] = useState<ScanTarget[]>([]);
    const [runs, setRuns] = useState<ScanRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [image, setImage] = useState('');
    const [label, setLabel] = useState('');
    const [scanning, setScanning] = useState<string | null>(null);

    useEffect(() => {
        if (activeTenant) {
            fetchTargets();
            fetchRuns();
        }
    }, [activeTenant]);

    const fetchTargets = async () => {
        try {
            const data = await api.get<ScanTarget[]>(`/tenants/${activeTenant}/scan-targets`);
            if (data) setTargets(data);
        } catch (e) {
            toast.error('Failed to fetch scan targets');
        }
    };

    const fetchRuns = async () => {
        setLoading(true);
        try {
            const data = await api.get<ScanRun[]>(`/tenants/${activeTenant}/scans`);
            if (data) setRuns(data);
        } catch (e) {
            toast.error('Failed to fetch scan runs');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTarget = async () => {
        if (!image.trim()) {
            toast.error('Image is required');
            return;
        }
        try {
            await api.post(`/tenants/${activeTenant}/scan-targets`, { image: image.trim(), label: label.trim() });
            toast.success('Scan target created');
            setOpen(false);
            setImage('');
            setLabel('');
            fetchTargets();
        } catch (e) {
            toast.error('Failed to create scan target');
        }
    };

    const handleDeleteTarget = async (id: string) => {
        try {
            await api.delete(`/tenants/${activeTenant}/scan-targets/${id}`);
            toast.success('Target removed');
            fetchTargets();
        } catch (e) {
            toast.error('Failed to delete target');
        }
    };

    const handleTriggerScan = async (targetId: string) => {
        setScanning(targetId);
        try {
            await api.post(`/tenants/${activeTenant}/scan-targets/${targetId}/scan`, {});
            toast.success('Scan triggered — results will appear shortly');
            // Poll for results after a brief delay
            setTimeout(() => fetchRuns(), 3000);
        } catch (e) {
            toast.error('Failed to trigger scan');
        } finally {
            setScanning(null);
        }
    };

    const riskIcon = (level?: string) => {
        switch (level) {
            case 'low': return <ShieldCheck className="h-4 w-4 text-green-400" />;
            case 'medium': return <Shield className="h-4 w-4 text-yellow-400" />;
            case 'high': return <ShieldAlert className="h-4 w-4 text-orange-400" />;
            case 'critical': return <ShieldX className="h-4 w-4 text-red-400" />;
            default: return <Shield className="h-4 w-4 text-[#A9B5C7]" />;
        }
    };

    const scoreColor = (score?: number) => {
        if (score === undefined || score === null) return 'text-[#A9B5C7]';
        if (score >= 90) return 'text-green-400';
        if (score >= 70) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    if (!activeTenant) return <div className="text-center p-10 text-[#A9B5C7]">Select a tenant first.</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Security Scans</h1>
                    <p className="text-[#A9B5C7]">Manage scan targets and run Trivy vulnerability scans.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { fetchTargets(); fetchRuns(); }} disabled={loading} className="border-[#1D2A44] bg-[#0B1220] hover:bg-[#1D2A44]">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                <Plus className="mr-2 h-4 w-4" /> Add Target
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-[#1D2A44] bg-[#111A2E] text-[#E6EEF8] sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Scan Target</DialogTitle>
                                <DialogDescription className="text-[#A9B5C7]">
                                    Add a container image to scan for vulnerabilities.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Image</Label>
                                    <Input
                                        placeholder="e.g. nginx:1.25-alpine"
                                        value={image}
                                        onChange={e => setImage(e.target.value)}
                                        className="bg-[#0B1220] border-[#1D2A44]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label (optional)</Label>
                                    <Input
                                        placeholder="e.g. Web Server"
                                        value={label}
                                        onChange={e => setLabel(e.target.value)}
                                        className="bg-[#0B1220] border-[#1D2A44]"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTarget} className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                    Add Target
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Scan Targets */}
            <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                <div className="p-4 border-b border-[#1D2A44]">
                    <h2 className="text-lg font-semibold text-white">Scan Targets</h2>
                </div>
                <Table>
                    <TableHeader className="border-b border-[#1D2A44] hover:bg-transparent">
                        <TableRow className="border-b border-[#1D2A44] hover:bg-transparent text-[#A9B5C7]">
                            <TableHead>Image</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {targets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-20 text-center text-[#A9B5C7]">
                                    No scan targets. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            targets.map(t => (
                                <TableRow key={t.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/50">
                                    <TableCell className="font-mono text-sm text-white">{t.image}</TableCell>
                                    <TableCell className="text-[#A9B5C7]">{t.label || '—'}</TableCell>
                                    <TableCell className="text-[#A9B5C7]">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleTriggerScan(t.id)}
                                            disabled={scanning === t.id}
                                            className="text-[#2F7DFF] hover:text-white hover:bg-[#2F7DFF]/20"
                                        >
                                            {scanning === t.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
                                            Scan
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteTarget(t.id)}
                                            className="text-red-400 hover:text-white hover:bg-red-500/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Scan Runs */}
            <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                <div className="p-4 border-b border-[#1D2A44]">
                    <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
                </div>
                <Table>
                    <TableHeader className="border-b border-[#1D2A44] hover:bg-transparent">
                        <TableRow className="border-b border-[#1D2A44] hover:bg-transparent text-[#A9B5C7]">
                            <TableHead>Image</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>Crit</TableHead>
                            <TableHead>High</TableHead>
                            <TableHead>Med</TableHead>
                            <TableHead>Low</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {runs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-20 text-center text-[#A9B5C7]">
                                    No scans yet. Trigger a scan from the targets above.
                                </TableCell>
                            </TableRow>
                        ) : (
                            runs.map(run => (
                                <TableRow key={run.id} className="border-b border-[#1D2A44] hover:bg-[#1D2A44]/50">
                                    <TableCell className="font-mono text-sm text-white">{run.image}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${run.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                                                run.status === 'running' ? 'bg-blue-400/10 text-blue-400' :
                                                    run.status === 'failed' ? 'bg-red-400/10 text-red-400' :
                                                        'bg-gray-400/10 text-gray-400'
                                            }`}>
                                            {run.status === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                            {run.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`font-bold ${scoreColor(run.score)}`}>
                                        {run.score !== undefined && run.score !== null ? run.score : '—'}
                                    </TableCell>
                                    <TableCell className="flex items-center gap-1">
                                        {riskIcon(run.risk_level)}
                                        <span className="text-sm capitalize">{run.risk_level || '—'}</span>
                                    </TableCell>
                                    <TableCell className="text-red-400 font-mono">{run.critical_count}</TableCell>
                                    <TableCell className="text-orange-400 font-mono">{run.high_count}</TableCell>
                                    <TableCell className="text-yellow-400 font-mono">{run.medium_count}</TableCell>
                                    <TableCell className="text-[#A9B5C7] font-mono">{run.low_count}</TableCell>
                                    <TableCell className="text-[#A9B5C7]">
                                        {new Date(run.created_at).toLocaleString()}
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
