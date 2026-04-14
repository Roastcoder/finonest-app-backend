-- Add loan_timer_enabled configuration
INSERT INTO system_config (config_key, config_value, config_type, description)
VALUES ('loan_timer_enabled', 'true', 'feature', 'Enable/disable loan timer countdown in dashboard')
ON CONFLICT (config_key) DO NOTHING;
