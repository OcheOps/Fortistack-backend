export type ApiEnvelope<T> = {
    data: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | null;
};

// Auth
export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    access_token: string;
    refresh_token: string;
};

export type User = {
    user_id: string;
    tenant_id: string;
    role: 'admin' | 'tenant_admin' | 'viewer';
    exp?: number;
};

// Reports
export type Report = {
    id: string;
    tenant_id: string;
    report_type: 'snapshot' | 'monthly';
    report_period_start?: string;
    report_period_end?: string;
    global_score: number;
    storage_path: string;
    created_at: string;
    details?: {
        score: {
            global: number;
            availability: number;
            backup: number;
            security: number;
            compliance: number;
            cost: number;
        };
        findings: Array<{
            severity: 'critical' | 'high' | 'medium' | 'low';
            title: string;
            detail: string;
        }>;
    };
};

export type Tenant = {
    id: string;
    name: string;
    region: string;
    is_active: boolean;
    created_at: string;
};

export type AlertConfig = {
    id: string;
    tenant_id: string;
    slack_webhook_url: string;
    teams_webhook_url: string;
    email_recipients: string[];
};

export type RiskInput = {
    uptime_metric: number;
    last_backup_age_days: number;
    open_ports_count: number;
    public_exposure_found: boolean;
    logging_enabled: boolean;
    access_review_recent: boolean;
    monthly_spend_spike_percent: number;
};
