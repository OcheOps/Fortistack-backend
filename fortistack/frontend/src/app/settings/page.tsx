'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useAlertConfig, useUpdateAlertConfig } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Bell, Mail, Webhook, Save, Info } from 'lucide-react';

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

    const onSubmit = (data: any) => {
        if (!user?.tenant_id) return;
        const recipients = data.email_recipients.split(',').map((s: string) => s.trim()).filter(Boolean);
        updateMutation.mutate({
            tenantId: user.tenant_id,
            config: {
                slack_webhook_url: data.slack_webhook_url,
                teams_webhook_url: data.teams_webhook_url,
                email_recipients: recipients,
            },
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="h-48 bg-[#111A2E] rounded-lg animate-pulse border border-[#1D2A44]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Settings & Integrations</h2>
                    <p className="text-[#A9B5C7]">
                        Configure how FortiStack notifies your team about critical infrastructure risks.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="bg-[#111A2E] border-[#1D2A44] shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <Bell className="h-5 w-5 text-[#2F7DFF]" />
                                <CardTitle className="text-white">Alert Channels</CardTitle>
                            </div>
                            <CardDescription className="text-[#A9B5C7]">
                                Set up real-time notifications for security alerts and compliance violations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-md border border-amber-900/50 bg-amber-900/10 p-3 text-amber-200 text-sm flex gap-2">
                                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>Webhooks contain sensitive secrets. They are encrypted at rest.</p>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="slack" className="flex items-center gap-2 text-[#E6EEF8]">
                                        <Webhook className="h-4 w-4 text-[#A9B5C7]" /> Slack Webhook URL
                                    </Label>
                                    <Input
                                        id="slack"
                                        placeholder="https://hooks.slack.com/services/..."
                                        {...register('slack_webhook_url')}
                                        className="bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF]"
                                    />
                                    <p className="text-xs text-[#A9B5C7]">
                                        Receive alerts directly in your Slack channels.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="teams" className="flex items-center gap-2 text-[#E6EEF8]">
                                        <Webhook className="h-4 w-4 text-purple-400" /> Microsoft Teams Webhook URL
                                    </Label>
                                    <Input
                                        id="teams"
                                        placeholder="https://outlook.office.com/webhook/..."
                                        {...register('teams_webhook_url')}
                                        className="bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF]"
                                    />
                                    <p className="text-xs text-[#A9B5C7]">
                                        Send notifications to your Teams channels.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 text-[#E6EEF8]">
                                        <Mail className="h-4 w-4 text-emerald-400" /> Email Recipients
                                    </Label>
                                    <Input
                                        id="email"
                                        placeholder="ops@example.com, security@example.com"
                                        {...register('email_recipients')}
                                        className="bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF]"
                                    />
                                    <p className="text-xs text-[#A9B5C7]">
                                        Comma-separated list of email addresses for critical reports.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-[#1D2A44] px-6 py-4 bg-[#0B1220]/50">
                            <p className="text-sm text-[#A9B5C7]">
                                Changes are applied immediately.
                            </p>
                            <Button type="submit" className="bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white shadow-md shadow-[#2F7DFF]/20" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Save Configuration
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
}
