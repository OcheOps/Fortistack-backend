'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { AlertConfig } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

export default function IntegrationsPage() {
    const { activeTenant } = useAuth();
    const [config, setConfig] = useState<AlertConfig>({
        id: '',
        tenant_id: '',
        slack_webhook_url: '',
        teams_webhook_url: '',
        email_recipients: []
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [emailInput, setEmailInput] = useState('');

    useEffect(() => {
        if (activeTenant) {
            fetchConfig();
        }
    }, [activeTenant]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const data = await api.get<AlertConfig>(`/tenants/${activeTenant}/alert-config`);
            if (data) {
                // Ensure array exists
                if (!data.email_recipients) data.email_recipients = [];
                setConfig(data);
            } else {
                // Reset to empty if no config found (shouldn't happen if API returns null, but handled)
                setConfig({
                    id: '',
                    tenant_id: activeTenant!,
                    slack_webhook_url: '',
                    teams_webhook_url: '',
                    email_recipients: []
                });
            }
        } catch (error) {
            console.error(error);
            // safe error, maybe new tenant
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTenant) return;
        setSaving(true);
        try {
            await api.put(`/tenants/${activeTenant}/alert-config`, config);
            toast.success('Configuration saved successfully');
        } catch (error) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const addEmail = () => {
        if (emailInput && !config.email_recipients.includes(emailInput)) {
            setConfig({
                ...config,
                email_recipients: [...config.email_recipients, emailInput]
            });
            setEmailInput('');
        }
    };

    const removeEmail = (email: string) => {
        setConfig({
            ...config,
            email_recipients: config.email_recipients.filter(e => e !== email)
        });
    };

    if (!activeTenant) return <div className="text-center p-10 text-[#A9B5C7]">Select a tenant first.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Integrations</h1>
                <p className="text-[#A9B5C7]">Configure alert destinations and notifications.</p>
            </div>

            <Card className="border-[#1D2A44] bg-[#111A2E]/50">
                <CardHeader>
                    <CardTitle className="text-white">Alert Configuration</CardTitle>
                    <CardDescription className="text-[#A9B5C7]">
                        Where should we send critical alerts?
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[#E6EEF8]">Slack Webhook URL</Label>
                            <Input
                                placeholder="https://hooks.slack.com/services/..."
                                value={config.slack_webhook_url}
                                onChange={e => setConfig({ ...config, slack_webhook_url: e.target.value })}
                                className="bg-[#0B1220] border-[#1D2A44] text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#E6EEF8]">Microsoft Teams Webhook URL</Label>
                            <Input
                                placeholder="https://outlook.office.com/webhook/..."
                                value={config.teams_webhook_url}
                                onChange={e => setConfig({ ...config, teams_webhook_url: e.target.value })}
                                className="bg-[#0B1220] border-[#1D2A44] text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#E6EEF8]">Email Recipients</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="user@example.com"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                    className="bg-[#0B1220] border-[#1D2A44] text-white"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addEmail();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addEmail} variant="outline" className="border-[#1D2A44] bg-[#0B1220] text-[#E6EEF8]">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {config.email_recipients?.map(email => (
                                    <div key={email} className="flex items-center gap-1 rounded-full bg-[#2F7DFF]/10 px-3 py-1 text-xs font-medium text-[#2F7DFF] ring-1 ring-inset ring-[#2F7DFF]/20">
                                        {email}
                                        <button type="button" onClick={() => removeEmail(email)} className="ml-1 hover:text-white">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving || loading} className="bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
