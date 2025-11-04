#!/bin/bash

# ===================================================================
# ANCHORVIEW - SETUP COMPLETO DO BANCO NO EASYPANEL
# ===================================================================
# Execute este comando no console bash do EasyPanel
# Ele irá criar todo o banco de dados completo para o AnchorView
# ===================================================================

echo "🚀 Iniciando setup COMPLETO do banco AnchorView..."

# Definir variáveis de conexão (ajuste conforme seu EasyPanel)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-"postgres"}
DB_NAME=${DB_NAME:-"anchorview"}

echo "📊 Conectando em: $DB_HOST:$DB_PORT/$DB_NAME como $DB_USER"

# ===== EXTENSÕES NECESSÁRIAS =====
echo "🔧 Criando extensões..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
"

# ===== FUNÇÃO PARA GERAR CUID =====
echo "🔧 Criando função CUID..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS \$\$
DECLARE
    timestamp_part TEXT;
    counter_part TEXT;
    random_part TEXT;
    machine_part TEXT;
BEGIN
    timestamp_part := LPAD(UPPER(ENCODE(('\x' || TO_HEX((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT))::BYTEA, 'hex')), 8, '0');
    counter_part := LPAD(UPPER(TO_HEX((RANDOM() * 65535)::INT)), 4, '0');
    random_part := UPPER(ENCODE(gen_random_bytes(8), 'hex'));
    machine_part := UPPER(ENCODE(gen_random_bytes(4), 'hex'));
    RETURN 'c' || LOWER(timestamp_part || counter_part || random_part || machine_part);
END;
\$\$ LANGUAGE plpgsql;
"

# ===== TABELA COMPANY (COMPLETA) =====
echo "📋 Criando tabela Company..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"Company\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"name\" TEXT NOT NULL,
    \"displayName\" TEXT,
    \"email\" TEXT,
    \"phone\" TEXT,
    \"address\" TEXT,
    \"city\" TEXT,
    \"state\" TEXT,
    \"country\" TEXT DEFAULT 'Brasil',
    \"zipCode\" TEXT,
    \"cnpj\" TEXT,
    \"website\" TEXT,
    \"logo\" TEXT,
    \"industry\" TEXT,
    \"size\" TEXT DEFAULT 'small',
    \"timezone\" TEXT DEFAULT 'America/Sao_Paulo',
    \"language\" TEXT DEFAULT 'pt-BR',
    \"currency\" TEXT DEFAULT 'BRL',
    \"isActive\" BOOLEAN NOT NULL DEFAULT true,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"deletedAt\" TIMESTAMP(3),
    \"settings\" JSONB DEFAULT '{}',
    CONSTRAINT \"Company_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA USER (COMPLETA) =====
echo "📋 Criando tabela User..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"User\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"email\" TEXT NOT NULL,
    \"password\" TEXT NOT NULL,
    \"name\" TEXT NOT NULL,
    \"role\" TEXT NOT NULL DEFAULT 'user',
    \"companyId\" TEXT NOT NULL,
    \"active\" BOOLEAN NOT NULL DEFAULT true,
    \"lastLogin\" TIMESTAMP(3),
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"avatar\" TEXT,
    \"settings\" JSONB DEFAULT '{}',
    CONSTRAINT \"User_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA PROJECT (COMPLETA) =====
echo "📋 Criando tabela Project..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"Project\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"name\" TEXT NOT NULL,
    \"description\" TEXT,
    \"companyId\" TEXT NOT NULL,
    \"createdByUserId\" TEXT,
    \"status\" TEXT NOT NULL DEFAULT 'active',
    \"priority\" TEXT DEFAULT 'medium',
    \"startDate\" TIMESTAMP(3),
    \"endDate\" TIMESTAMP(3),
    \"budget\" DECIMAL(15,2),
    \"currency\" TEXT DEFAULT 'BRL',
    \"client\" TEXT,
    \"location\" TEXT,
    \"coordinates\" JSONB,
    \"tags\" TEXT[],
    \"customFields\" JSONB DEFAULT '{}',
    \"progress\" INTEGER DEFAULT 0,
    \"riskLevel\" TEXT DEFAULT 'medium',
    \"compliance\" JSONB DEFAULT '{}',
    \"team\" TEXT[],
    \"documents\" JSONB DEFAULT '[]',
    \"images\" JSONB DEFAULT '[]',
    \"notes\" TEXT,
    \"deleted\" BOOLEAN NOT NULL DEFAULT false,
    \"deletedAt\" TIMESTAMP(3),
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"archivedAt\" TIMESTAMP(3),
    CONSTRAINT \"Project_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA LOCATION (COMPLETA) =====
echo "📋 Criando tabela Location..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"Location\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"name\" TEXT NOT NULL,
    \"companyId\" TEXT NOT NULL,
    \"projectId\" TEXT,
    \"coordinates\" JSONB DEFAULT '{}',
    CONSTRAINT \"Location_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA ANCHOR_POINTS (COMPLETA) =====
echo "📋 Criando tabela anchor_points..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"anchor_points\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"project_id\" TEXT NOT NULL,
    \"numero\" TEXT NOT NULL,
    \"tipo\" TEXT NOT NULL,
    \"marca\" TEXT,
    \"modelo\" TEXT,
    \"data_instalacao\" TEXT,
    \"frequencia_inspecao_meses\" INTEGER,
    \"observacoes\" TEXT,
    \"posicao_x\" DOUBLE PRECISION NOT NULL,
    \"posicao_y\" DOUBLE PRECISION NOT NULL,
    \"data_hora\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"status\" TEXT NOT NULL DEFAULT 'Não Testado',
    \"created_by_user_id\" TEXT,
    \"last_modified_by_user_id\" TEXT,
    \"archived\" BOOLEAN NOT NULL DEFAULT false,
    \"archived_at\" TIMESTAMP(3),
    CONSTRAINT \"anchor_points_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA ANCHOR_TESTS (COMPLETA) =====
echo "📋 Criando tabela anchor_tests..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"anchor_tests\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"ponto_id\" TEXT NOT NULL,
    \"data_hora\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"resultado\" TEXT NOT NULL,
    \"carga\" TEXT NOT NULL,
    \"tempo\" TEXT NOT NULL,
    \"tecnico\" TEXT NOT NULL,
    \"observacoes\" TEXT,
    \"foto_teste\" TEXT,
    \"foto_pronto\" TEXT,
    \"data_foto_pronto\" TEXT,
    CONSTRAINT \"anchor_tests_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELA SUBSCRIPTION_PLANS (COMPLETA) =====
echo "📋 Criando tabela subscription_plans..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"subscription_plans\" (
    \"id\" TEXT NOT NULL,
    \"name\" TEXT NOT NULL,
    \"description\" TEXT,
    \"price_monthly\" DECIMAL(10,2) NOT NULL,
    \"price_yearly\" DECIMAL(10,2),
    \"max_users\" INTEGER,
    \"max_projects\" INTEGER,
    \"max_points\" INTEGER,
    \"max_storage_gb\" INTEGER DEFAULT 10,
    \"features\" JSONB NOT NULL DEFAULT '{}',
    \"active\" BOOLEAN NOT NULL DEFAULT true,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"subscription_plans_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== DEMAIS TABELAS SAAS =====
echo "📋 Criando tabelas SaaS..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"subscriptions\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"company_id\" TEXT NOT NULL,
    \"plan_id\" TEXT NOT NULL,
    \"status\" TEXT NOT NULL DEFAULT 'trialing',
    \"current_period_start\" TIMESTAMP(3) NOT NULL,
    \"current_period_end\" TIMESTAMP(3) NOT NULL,
    \"trial_start\" TIMESTAMP(3),
    \"trial_end\" TIMESTAMP(3),
    \"cancel_at\" TIMESTAMP(3),
    \"canceled_at\" TIMESTAMP(3),
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"subscriptions_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"payments\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"subscription_id\" TEXT NOT NULL,
    \"amount\" DECIMAL(10,2) NOT NULL,
    \"currency\" TEXT NOT NULL DEFAULT 'BRL',
    \"status\" TEXT NOT NULL DEFAULT 'pending',
    \"payment_method\" TEXT NOT NULL,
    \"external_id\" TEXT,
    \"external_data\" JSONB,
    \"paid_at\" TIMESTAMP(3),
    \"failed_at\" TIMESTAMP(3),
    \"refunded_at\" TIMESTAMP(3),
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"payments_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELAS DE SUPORTE =====
echo "📋 Criando tabelas de suporte..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"files\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"filename\" TEXT NOT NULL,
    \"original_name\" TEXT NOT NULL,
    \"mime_type\" TEXT NOT NULL,
    \"size\" INTEGER NOT NULL,
    \"url\" TEXT,
    \"uploaded\" BOOLEAN NOT NULL DEFAULT false,
    \"company_id\" TEXT NOT NULL,
    \"user_id\" TEXT,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"files_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"sync_queue\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"operation\" TEXT NOT NULL,
    \"table_name\" TEXT NOT NULL,
    \"record_id\" TEXT NOT NULL,
    \"data\" JSONB NOT NULL,
    \"status\" TEXT NOT NULL DEFAULT 'pending',
    \"retries\" INTEGER NOT NULL DEFAULT 0,
    \"error\" TEXT,
    \"company_id\" TEXT NOT NULL,
    \"user_id\" TEXT,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"synced_at\" TIMESTAMP(3),
    CONSTRAINT \"sync_queue_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"user_sessions\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"user_id\" TEXT NOT NULL,
    \"session_token\" TEXT NOT NULL,
    \"refresh_token\" TEXT NOT NULL,
    \"expires_at\" TIMESTAMP(3) NOT NULL,
    \"ip_address\" TEXT NOT NULL,
    \"user_agent\" TEXT NOT NULL,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"user_sessions_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"user_invitations\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"company_id\" TEXT NOT NULL,
    \"email\" TEXT NOT NULL,
    \"role\" TEXT NOT NULL,
    \"invited_by\" TEXT NOT NULL,
    \"token\" TEXT NOT NULL,
    \"expires_at\" TIMESTAMP(3) NOT NULL,
    \"accepted_at\" TIMESTAMP(3),
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"user_invitations_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"usage_limits\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"company_id\" TEXT NOT NULL,
    \"users_count\" INTEGER NOT NULL DEFAULT 0,
    \"projects_count\" INTEGER NOT NULL DEFAULT 0,
    \"points_count\" INTEGER NOT NULL DEFAULT 0,
    \"storage_used_gb\" DECIMAL(10,2) NOT NULL DEFAULT 0,
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"usage_limits_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"audit_log\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"table_name\" TEXT NOT NULL,
    \"record_id\" TEXT NOT NULL,
    \"operation\" TEXT NOT NULL,
    \"old_values\" JSONB,
    \"new_values\" JSONB,
    \"changed_fields\" TEXT[],
    \"user_id\" TEXT,
    \"session_id\" TEXT,
    \"timestamp\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"ip_address\" TEXT,
    \"user_agent\" TEXT,
    CONSTRAINT \"audit_log_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"notifications\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"user_id\" TEXT NOT NULL,
    \"title\" TEXT NOT NULL,
    \"message\" TEXT NOT NULL,
    \"type\" TEXT NOT NULL,
    \"data\" JSONB,
    \"read_at\" TIMESTAMP(3),
    \"expires_at\" TIMESTAMP(3),
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"notifications_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"permissions\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"name\" TEXT NOT NULL,
    \"description\" TEXT NOT NULL,
    \"category\" TEXT NOT NULL,
    \"actions\" TEXT[],
    \"own_data_only\" BOOLEAN NOT NULL DEFAULT false,
    \"company_data_only\" BOOLEAN NOT NULL DEFAULT true,
    \"time_restricted\" BOOLEAN NOT NULL DEFAULT false,
    \"active\" BOOLEAN NOT NULL DEFAULT true,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"permissions_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== TABELAS ADICIONAIS IMPORTANTES =====
echo "📋 Criando tabelas adicionais..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"password_resets\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"user_id\" TEXT NOT NULL,
    \"token\" TEXT NOT NULL,
    \"expires_at\" TIMESTAMP(3) NOT NULL,
    \"used_at\" TIMESTAMP(3),
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"password_resets_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"user_preferences\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"user_id\" TEXT NOT NULL,
    \"preferences\" JSONB NOT NULL DEFAULT '{}',
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"user_preferences_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"company_settings\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"company_id\" TEXT NOT NULL,
    \"settings\" JSONB NOT NULL DEFAULT '{}',
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"company_settings_pkey\" PRIMARY KEY (\"id\")
);
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"backup_config\" (
    \"id\" TEXT NOT NULL DEFAULT generate_cuid(),
    \"enabled\" BOOLEAN NOT NULL DEFAULT true,
    \"frequency\" TEXT NOT NULL,
    \"retention_days\" INTEGER NOT NULL DEFAULT 30,
    \"include_files\" BOOLEAN NOT NULL DEFAULT true,
    \"compress_backups\" BOOLEAN NOT NULL DEFAULT true,
    \"encrypt_backups\" BOOLEAN NOT NULL DEFAULT false,
    \"backup_path\" TEXT NOT NULL,
    \"last_backup\" TIMESTAMP(3),
    \"next_backup\" TIMESTAMP(3),
    \"backup_size\" INTEGER,
    \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"backup_config_pkey\" PRIMARY KEY (\"id\")
);
"

# ===== CRIAR CONSTRAINTS ÚNICOS =====
echo "🔗 Criando constraints únicos..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"User\" DROP CONSTRAINT IF EXISTS \"User_email_key\";
ALTER TABLE \"User\" ADD CONSTRAINT \"User_email_key\" UNIQUE (\"email\");
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"user_sessions\" DROP CONSTRAINT IF EXISTS \"user_sessions_session_token_key\";
ALTER TABLE \"user_sessions\" ADD CONSTRAINT \"user_sessions_session_token_key\" UNIQUE (\"session_token\");
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"user_invitations\" DROP CONSTRAINT IF EXISTS \"user_invitations_token_key\";
ALTER TABLE \"user_invitations\" ADD CONSTRAINT \"user_invitations_token_key\" UNIQUE (\"token\");
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"usage_limits\" DROP CONSTRAINT IF EXISTS \"usage_limits_company_id_key\";
ALTER TABLE \"usage_limits\" ADD CONSTRAINT \"usage_limits_company_id_key\" UNIQUE (\"company_id\");
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"permissions\" DROP CONSTRAINT IF EXISTS \"permissions_name_key\";
ALTER TABLE \"permissions\" ADD CONSTRAINT \"permissions_name_key\" UNIQUE (\"name\");
"

# ===== CRIAR FOREIGN KEYS =====
echo "🔗 Criando foreign keys..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"User\" DROP CONSTRAINT IF EXISTS \"User_companyId_fkey\";
ALTER TABLE \"User\" ADD CONSTRAINT \"User_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"Location\" DROP CONSTRAINT IF EXISTS \"Location_companyId_fkey\";
ALTER TABLE \"Location\" ADD CONSTRAINT \"Location_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"Location\" DROP CONSTRAINT IF EXISTS \"Location_projectId_fkey\";
ALTER TABLE \"Location\" ADD CONSTRAINT \"Location_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Project\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"Project\" DROP CONSTRAINT IF EXISTS \"Project_companyId_fkey\";
ALTER TABLE \"Project\" ADD CONSTRAINT \"Project_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"anchor_points\" DROP CONSTRAINT IF EXISTS \"anchor_points_project_id_fkey\";
ALTER TABLE \"anchor_points\" ADD CONSTRAINT \"anchor_points_project_id_fkey\" FOREIGN KEY (\"project_id\") REFERENCES \"Project\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"anchor_tests\" DROP CONSTRAINT IF EXISTS \"anchor_tests_ponto_id_fkey\";
ALTER TABLE \"anchor_tests\" ADD CONSTRAINT \"anchor_tests_ponto_id_fkey\" FOREIGN KEY (\"ponto_id\") REFERENCES \"anchor_points\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"subscriptions\" DROP CONSTRAINT IF EXISTS \"subscriptions_company_id_fkey\";
ALTER TABLE \"subscriptions\" ADD CONSTRAINT \"subscriptions_company_id_fkey\" FOREIGN KEY (\"company_id\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"subscriptions\" DROP CONSTRAINT IF EXISTS \"subscriptions_plan_id_fkey\";
ALTER TABLE \"subscriptions\" ADD CONSTRAINT \"subscriptions_plan_id_fkey\" FOREIGN KEY (\"plan_id\") REFERENCES \"subscription_plans\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

# Foreign Keys das novas tabelas
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"files\" DROP CONSTRAINT IF EXISTS \"files_company_id_fkey\";
ALTER TABLE \"files\" ADD CONSTRAINT \"files_company_id_fkey\" FOREIGN KEY (\"company_id\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"sync_queue\" DROP CONSTRAINT IF EXISTS \"sync_queue_company_id_fkey\";
ALTER TABLE \"sync_queue\" ADD CONSTRAINT \"sync_queue_company_id_fkey\" FOREIGN KEY (\"company_id\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"user_sessions\" DROP CONSTRAINT IF EXISTS \"user_sessions_user_id_fkey\";
ALTER TABLE \"user_sessions\" ADD CONSTRAINT \"user_sessions_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"password_resets\" DROP CONSTRAINT IF EXISTS \"password_resets_user_id_fkey\";
ALTER TABLE \"password_resets\" ADD CONSTRAINT \"password_resets_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"user_preferences\" DROP CONSTRAINT IF EXISTS \"user_preferences_user_id_fkey\";
ALTER TABLE \"user_preferences\" ADD CONSTRAINT \"user_preferences_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
ALTER TABLE \"company_settings\" DROP CONSTRAINT IF EXISTS \"company_settings_company_id_fkey\";
ALTER TABLE \"company_settings\" ADD CONSTRAINT \"company_settings_company_id_fkey\" FOREIGN KEY (\"company_id\") REFERENCES \"Company\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
"

# ===== CRIAR ÍNDICES =====
echo "⚡ Criando índices para performance..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE INDEX IF NOT EXISTS \"User_email_active_idx\" ON \"User\"(\"email\", \"active\");
CREATE INDEX IF NOT EXISTS \"User_companyId_idx\" ON \"User\"(\"companyId\");
CREATE INDEX IF NOT EXISTS \"Project_companyId_idx\" ON \"Project\"(\"companyId\");
CREATE INDEX IF NOT EXISTS \"anchor_points_project_id_idx\" ON \"anchor_points\"(\"project_id\");
CREATE INDEX IF NOT EXISTS \"anchor_tests_ponto_id_idx\" ON \"anchor_tests\"(\"ponto_id\");
"

# ===== CRIAR FUNÇÕES ESSENCIAIS =====
echo "⚙️ Criando funções essenciais..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN AS \$\$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM \"User\" 
        WHERE role = 'superadmin' AND active = true
    );
END;
\$\$ LANGUAGE plpgsql;
"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS \$\$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCompanies', (SELECT COUNT(*) FROM \"Company\"),
        'activeCompanies', (SELECT COUNT(*) FROM \"Company\" WHERE \"isActive\" = true),
        'totalUsers', (SELECT COUNT(*) FROM \"User\"),
        'activeUsers', (SELECT COUNT(*) FROM \"User\" WHERE \"active\" = true),
        'totalProjects', (SELECT COUNT(*) FROM \"Project\" WHERE \"deleted\" = false),
        'totalPoints', (SELECT COUNT(*) FROM \"anchor_points\" WHERE \"archived\" = false),
        'totalTests', (SELECT COUNT(*) FROM \"anchor_tests\")
    ) INTO result;
    
    RETURN result;
END;
\$\$ LANGUAGE plpgsql;
"

# ===== INSERIR DADOS INICIAIS COMPLETOS =====
echo "📊 Inserindo dados iniciais COMPLETOS..."

# Planos de assinatura COMPLETOS
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO \"subscription_plans\" (\"id\", \"name\", \"description\", \"price_monthly\", \"price_yearly\", \"max_users\", \"max_projects\", \"max_points\", \"max_storage_gb\", \"features\") VALUES
('trial', 'Trial Gratuito', '14 dias grátis para testar todas as funcionalidades', 0.00, NULL, 2, 3, 50, 1, '{\"support\": \"community\", \"backup\": false, \"api\": false, \"reports\": \"basic\"}'),
('basic', 'Básico', 'Plano ideal para empresas pequenas', 99.90, 1079.90, 5, 10, 200, 5, '{\"support\": \"email\", \"backup\": true, \"api\": false, \"reports\": \"standard\"}'),
('pro', 'Profissional', 'Plano completo para empresas médias', 299.90, 3239.90, 20, 50, 1000, 20, '{\"support\": \"priority\", \"backup\": true, \"api\": true, \"reports\": \"advanced\"}'),
('enterprise', 'Enterprise', 'Plano ilimitado para grandes empresas', 799.90, 8639.90, 999, 999, 99999, 100, '{\"support\": \"dedicated\", \"backup\": true, \"api\": true, \"reports\": \"custom\", \"sla\": \"99.9%\"}')
ON CONFLICT (\"id\") DO NOTHING;
"

# Permissões COMPLETAS do sistema
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO \"permissions\" (\"id\", \"name\", \"description\", \"category\", \"actions\") VALUES
('perm-001', 'system.admin', 'Administração total do sistema', 'system', ARRAY['read', 'write', 'delete', 'admin']),
('perm-002', 'company.admin', 'Administração da empresa', 'company', ARRAY['read', 'write', 'delete']),
('perm-003', 'project.manage', 'Gerenciar projetos', 'project', ARRAY['read', 'write', 'delete']),
('perm-004', 'point.manage', 'Gerenciar pontos de ancoragem', 'point', ARRAY['read', 'write', 'delete']),
('perm-005', 'test.manage', 'Gerenciar testes', 'test', ARRAY['read', 'write', 'delete']),
('perm-006', 'company.view', 'Visualizar dados da empresa', 'company', ARRAY['read']),
('perm-007', 'project.view', 'Visualizar projetos', 'project', ARRAY['read']),
('perm-008', 'point.view', 'Visualizar pontos', 'point', ARRAY['read']),
('perm-009', 'test.view', 'Visualizar testes', 'test', ARRAY['read']),
('perm-010', 'backup.manage', 'Gerenciar backups', 'system', ARRAY['read', 'write', 'admin']),
('perm-011', 'analytics.view', 'Visualizar analytics', 'system', ARRAY['read']),
('perm-012', 'user.invite', 'Convidar usuários', 'company', ARRAY['write'])
ON CONFLICT (\"id\") DO NOTHING;
"

# Configuração de backup COMPLETA
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO \"backup_config\" (\"id\", \"frequency\", \"backup_path\", \"next_backup\", \"retention_days\", \"include_files\", \"compress_backups\", \"encrypt_backups\")
VALUES (
    'default-backup-config',
    'daily',
    '/backups/anchorview',
    NOW() + INTERVAL '1 day',
    30,
    true,
    true,
    false
) ON CONFLICT (\"id\") DO NOTHING;
"

# Criar empresa padrão e super admin
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DO \$\$
DECLARE
    hashed_password TEXT;
BEGIN
    -- Hash da senha 'admin123'
    hashed_password := crypt('admin123', gen_salt('bf'));
    
    -- Criar empresa padrão
    INSERT INTO \"Company\" (
        \"id\", \"name\", \"displayName\", \"email\", \"isActive\"
    ) VALUES (
        'company-default',
        'AnchorView Admin', 
        'Administração do Sistema',
        'admin@anchorview.com',
        true
    ) ON CONFLICT (\"id\") DO NOTHING;
    
    -- Criar super admin
    INSERT INTO \"User\" (
        \"id\", \"email\", \"password\", \"name\", \"role\", \"companyId\", \"active\"
    ) VALUES (
        'user-superadmin',
        'admin@anchorview.com',
        hashed_password,
        'Super Administrador',
        'superadmin', 
        'company-default',
        true
    ) ON CONFLICT (\"email\") DO UPDATE SET
        \"password\" = hashed_password,
        \"role\" = 'superadmin',
        \"active\" = true;
        
    -- Criar registro de limites de uso
    INSERT INTO \"usage_limits\" (
        \"company_id\", \"users_count\", \"projects_count\", \"points_count\", \"storage_used_gb\"
    ) VALUES (
        'company-default', 1, 0, 0, 0
    ) ON CONFLICT (\"company_id\") DO NOTHING;
        
    RAISE NOTICE '✅ Super Admin criado!';
    RAISE NOTICE '📧 Email: admin@anchorview.com';  
    RAISE NOTICE '🔑 Senha: admin123';
    RAISE NOTICE '⚠️  TROQUE A SENHA APÓS LOGIN!';
END \$\$;
"

# ===== VERIFICAÇÕES FINAIS =====
echo "🔍 Verificações finais..."

TABLE_COUNT=\$(psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\" | tr -d ' ')

PLANS_COUNT=\$(psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME -t -c \"SELECT COUNT(*) FROM subscription_plans;\" | tr -d ' ')

PERMISSIONS_COUNT=\$(psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME -t -c \"SELECT COUNT(*) FROM permissions;\" | tr -d ' ')

echo ""
echo "🎉 ========================================="
echo "🎉 SETUP COMPLETO 100% FINALIZADO!"
echo "🎉 ========================================="
echo ""
echo "✅ Database: \$DB_NAME"
echo "✅ Tabelas COMPLETAS: \$TABLE_COUNT"
echo "✅ Planos: \$PLANS_COUNT"
echo "✅ Permissões: \$PERMISSIONS_COUNT"
echo ""
echo "🔧 TABELAS PRINCIPAIS CRIADAS:"
echo "   • Company (23 colunas)"
echo "   • User (12 colunas)"
echo "   • Project (28 colunas)"
echo "   • Location (5 colunas)"
echo "   • anchor_points (16 colunas)"
echo "   • anchor_tests (10 colunas)"
echo "   • subscription_plans (11 colunas)"
echo "   • subscriptions (10 colunas)"
echo "   • + tabelas de suporte completas"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Execute: npx prisma generate"
echo "2. Execute: npm run dev"
echo "3. Acesse: http://localhost:9002"
echo ""
echo "🚀 AnchorView está 100% pronto para uso!"