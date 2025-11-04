#!/bin/bash
# Criar estrutura completa das 7 tabelas extras

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- 1. AUDIT_LOG
DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMPANY_SETTINGS
DROP TABLE IF EXISTS company_settings CASCADE;
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6941DE',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    language TEXT DEFAULT 'pt-BR',
    auto_backup BOOLEAN DEFAULT true,
    notification_email TEXT,
    report_template JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. NOTIFICATIONS
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 4. PASSWORD_RESETS
DROP TABLE IF EXISTS password_resets CASCADE;
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES "User"(id),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SYNC_STATUS
DROP TABLE IF EXISTS sync_status CASCADE;
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    operation_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 6. SYSTEM_LOGS
DROP TABLE IF EXISTS system_logs CASCADE;
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id TEXT REFERENCES "User"(id),
    ip_address INET,
    user_agent TEXT,
    stack_trace TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. USER_PREFERENCES
DROP TABLE IF EXISTS user_preferences CASCADE;
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    default_project_id TEXT REFERENCES "Project"(id),
    dashboard_layout JSONB DEFAULT '{}',
    map_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_audit_log_company_id ON audit_log(company_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_sync_status_company_id ON sync_status(company_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

\echo '✅ TODAS AS 7 TABELAS EXTRAS ESTRUTURADAS!'

EOF