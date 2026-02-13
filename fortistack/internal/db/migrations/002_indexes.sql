CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_alert_configs_tenant_id ON alert_configs(tenant_id);
CREATE INDEX idx_risk_scores_tenant_id ON risk_scores(tenant_id);
CREATE INDEX idx_findings_tenant_id ON findings(tenant_id);
CREATE INDEX idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);
