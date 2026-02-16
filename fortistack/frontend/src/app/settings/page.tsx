'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useAlertConfig, useUpdateAlertConfig } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Bell, Mail, Webhook, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationsPage() {
    const { user } = useAuth();
    const { data: config, isLoading } = useAlertConfig(user?.tenant_id || '');
    const updateMutation = useUpdateAlertConfig();
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (config) {
            reset({
                slack_webhook_url: config.slack_webhook_url || '',
                teams_webhook_url: config.teams_webhook_url || '',
                email_recipients: (config.email_recipients || []).join(', '),
            });
        }
    }, [config, reset]);

    const onSubmit = (data: Record<string, string>) => {
        if (!user?.tenant_id) return;
        const recipients = data.email_recipients.split(',').map((s: string) => s.trim()).filter(Boolean);
        updateMutation.mutate({
            tenantId: user.tenant_id,
            config: {
                slack_webhook_url: data.slack_webhook_url,
                teams_webhook_url: data.teams_webhook_url,
                email_recipients: recipients,
            },
        }, {
            onSuccess: () => toast.success('Configuration saved', { description: 'Alert channels updated successfully.' }),
            onError: (err) => toast.error('Save failed', { description: err.message }),
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-60 bg-[#1D2A44]" />
                    <Skeleton className="h-80 bg-[#111A2E] border border-[#1D2A44] rounded-xl" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Integrations</h2>
                    <p className="text-[#A9B5C7] text-sm mt-1">
                        Configure how FortiStack notifies your team about risks.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg shadow-black/20">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Bell className="h-4 w-4 text-[#2F7DFF]" />
                                <CardTitle className="text-sm font-medium text-white">Alert Channels</CardTitle>
                            </div>
                            <CardDescription className="text-xs text-[#A9B5C7]/60">
                                Real-time notifications for security alerts and compliance violations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Secrets Warning */}
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-amber-400">Webhooks are secrets</p>
                                    <p className="text-[11px] text-amber-400/60 mt-0.5">Treat webhook URLs like passwords. They grant access to post messages in your channels.</p>
                                </div>
                            </div>

                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="slack" className="flex items-center gap-1.5 text-xs text-[#A9B5C7]">
                                        <Webhook className="h-3.5 w-3.5" /> Slack Webhook URL
                                    </Label>
                                    <Input
                                        id="slack"
                                        placeholder="https://hooks.slack.com/services/..."
                                        {...register('slack_webhook_url')}
                                        className="h-9 text-xs bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF] placeholder:text-[#A9B5C7]/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="teams" className="flex items-center gap-1.5 text-xs text-[#A9B5C7]">
                                        <Webhook className="h-3.5 w-3.5 text-purple-400" /> Microsoft Teams Webhook
                                    </Label>
                                    <Input
                                        id="teams"
                                        placeholder="https://outlook.office.com/webhook/..."
                                        {...register('teams_webhook_url')}
                                        className="h-9 text-xs bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF] placeholder:text-[#A9B5C7]/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-1.5 text-xs text-[#A9B5C7]">
                                        <Mail className="h-3.5 w-3.5 text-emerald-400" /> Email Recipients
                                    </Label>
                                    <Input
                                        id="email"
                                        placeholder="ops@example.com, security@example.com"
                                        {...register('email_recipients')}
                                        className="h-9 text-xs bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF] placeholder:text-[#A9B5C7]/30"
                                    />
                                    <p className="text-[10px] text-[#A9B5C7]/40">Comma-separated list of emails for critical alerts.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-[#1D2A44] px-6 py-4">
                            <Button type="submit" className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white text-xs h-9 shadow-[0_0_15px_rgba(47,125,255,0.2)]" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving…' : <><Save className="mr-1.5 h-3.5 w-3.5" /> Save Configuration</>}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
}
