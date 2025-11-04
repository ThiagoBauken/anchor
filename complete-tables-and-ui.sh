#!/bin/bash
# COMANDO COMPLETO - Estruturar tabelas e preparar UI

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "🚀 CRIANDO ESTRUTURAS DAS TABELAS..."

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- ===== ESTRUTURAR TABELAS VAZIAS =====

-- 1. AUDIT_LOG - Auditoria completa
DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export'
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMPANY_SETTINGS - Configurações da empresa
DROP TABLE IF EXISTS company_settings CASCADE;  
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6941DE',
    secondary_color TEXT DEFAULT '#4F46E5',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    language TEXT DEFAULT 'pt-BR',
    currency TEXT DEFAULT 'BRL',
    auto_backup BOOLEAN DEFAULT true,
    notification_email TEXT,
    report_header TEXT,
    report_footer TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. NOTIFICATIONS - Sistema de notificações
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'maintenance')),
    category TEXT DEFAULT 'general', -- 'sync', 'test', 'user', 'system', 'general'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- 4. PASSWORD_RESETS - Reset de senhas
DROP TABLE IF EXISTS password_resets CASCADE;
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES "User"(id),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    used_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SYNC_STATUS - Status detalhado de sincronização  
DROP TABLE IF EXISTS sync_status CASCADE;
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    operation_type TEXT NOT NULL, -- 'full_sync', 'incremental', 'photos', 'projects', 'points', 'tests'
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '{}',
    sync_data JSONB DEFAULT '{}', -- dados específicos do sync
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_completion TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SYSTEM_LOGS - Logs detalhados do sistema
DROP TABLE IF EXISTS system_logs CASCADE;
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    category TEXT DEFAULT 'general', -- 'auth', 'sync', 'api', 'db', 'ui', 'pwa'
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id TEXT REFERENCES "User"(id),
    company_id TEXT REFERENCES "Company"(id),
    session_id TEXT,
    request_id TEXT,
    ip_address INET,
    user_agent TEXT,
    url TEXT,
    method TEXT,
    status_code INTEGER,
    response_time INTEGER, -- em ms
    stack_trace TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. USER_PREFERENCES - Preferências detalhadas dos usuários
DROP TABLE IF EXISTS user_preferences CASCADE;
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id),
    
    -- Aparência
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    primary_color TEXT DEFAULT '#6941DE',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    compact_mode BOOLEAN DEFAULT false,
    
    -- Localização
    language TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    number_format TEXT DEFAULT 'pt-BR', -- locale para números
    
    -- Notificações
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'hourly', 'daily')),
    
    -- Dashboard e Layout
    default_project_id TEXT REFERENCES "Project"(id),
    dashboard_widgets JSONB DEFAULT '["recent_points", "sync_status", "notifications", "quick_stats"]',
    sidebar_collapsed BOOLEAN DEFAULT false,
    table_page_size INTEGER DEFAULT 25 CHECK (table_page_size IN (10, 25, 50, 100)),
    
    -- Mapa e Visualização
    map_default_zoom DECIMAL(4,2) DEFAULT 1.0,
    map_default_center JSONB DEFAULT '{"x": 0, "y": 0}',
    show_archived_points BOOLEAN DEFAULT false,
    point_marker_size TEXT DEFAULT 'medium' CHECK (point_marker_size IN ('small', 'medium', 'large')),
    
    -- Workflow
    auto_save_interval INTEGER DEFAULT 30, -- segundos
    confirm_deletions BOOLEAN DEFAULT true,
    quick_actions_enabled BOOLEAN DEFAULT true,
    keyboard_shortcuts_enabled BOOLEAN DEFAULT true,
    
    -- Relatórios
    default_report_format TEXT DEFAULT 'pdf' CHECK (default_report_format IN ('pdf', 'excel', 'csv')),
    include_photos_in_reports BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Audit Log
CREATE INDEX idx_audit_log_company_id ON audit_log(company_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);

-- Notifications  
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Sync Status
CREATE INDEX idx_sync_status_company_id ON sync_status(company_id);
CREATE INDEX idx_sync_status_status ON sync_status(status);
CREATE INDEX idx_sync_status_operation_type ON sync_status(operation_type);
CREATE INDEX idx_sync_status_started_at ON sync_status(started_at DESC);

-- System Logs
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_company_id ON system_logs(company_id);

-- ===== TRIGGERS PARA AUTO UPDATE =====

-- Company Settings trigger
CREATE OR REPLACE FUNCTION update_company_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_company_settings_timestamp();

-- User Preferences trigger  
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_user_preferences_timestamp();

-- ===== DADOS INICIAIS =====

-- Configuração padrão para demo company
INSERT INTO company_settings (company_id, notification_email, company_address) 
VALUES ('demo-company', 'admin@demo.com', 'Rua Demo, 123 - São Paulo, SP')
ON CONFLICT (company_id) DO NOTHING;

-- Preferências padrão para demo admin
INSERT INTO user_preferences (user_id)
SELECT id FROM "User" WHERE id = 'demo-admin'
ON CONFLICT (user_id) DO NOTHING;

-- Notificação de boas vindas
INSERT INTO notifications (company_id, type, category, title, message, priority)
VALUES (
    'demo-company', 
    'info', 
    'system',
    'Bem-vindo ao AnchorView!',
    'Sistema configurado e pronto para uso. Explore as funcionalidades e configure suas preferências.',
    2
) ON CONFLICT DO NOTHING;

\echo '✅ TODAS AS TABELAS ESTRUTURADAS COM SUCESSO!'
\echo '📊 Verificando estruturas criadas...'

-- Verificar tabelas criadas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('audit_log', 'company_settings', 'notifications', 'password_resets', 'sync_status', 'system_logs', 'user_preferences')
ORDER BY table_name;

EOF

echo "✅ ESTRUTURAS CRIADAS! Agora vou implementar as UIs..."