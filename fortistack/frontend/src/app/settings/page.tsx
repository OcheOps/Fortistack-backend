'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/context/auth-context';
import { useAlertConfig, useUpdateAlertConfig } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

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

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold">Integrations</h2>
                <p className="text-muted-foreground">Configure where alerts should be sent.</p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Alert Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Slack Webhook URL</label>
                            <Input placeholder="https://hooks.slack.com/..." {...register('slack_webhook_url')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Teams Webhook URL</label>
                            <Input placeholder="https://outlook.office.com/webhook/..." {...register('teams_webhook_url')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Recipients (comma separated)</label>
                            <Input placeholder="ops@example.com, cto@example.com" {...register('email_recipients')} />
                        </div>
                        <div className="pt-4">
                            <Button type="submit" disabled={updateMutation.status === 'pending'}>
                                {updateMutation.status === 'pending' ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
