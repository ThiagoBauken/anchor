#!/bin/bash

# =====================================
# SETUP COMPLETO ANCHORVIEW DATABASE
# =====================================
# Script bash completo para criar TODAS as tabelas, funções, índices e dados
# Executa tanto localmente quanto no EasyPanel/Produção
#
# USO:
# chmod +x setup-anchorview-database-complete.sh
# ./setup-anchorview-database-complete.sh
#
# OU com variáveis customizadas:
# DB_HOST=localhost DB_USER=postgres DB_NAME=anchorview ./setup-anchorview-database-complete.sh

set -e  # Parar em caso de erro

# ===== CONFIGURAÇÕES DO BANCO =====
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"anchorview"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-""}

echo "🚀 Iniciando setup completo do AnchorView Database..."
echo "📍 Host: $DB_HOST:$DB_PORT"
echo "🗄️  Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo ""

# Função para executar SQL
execute_sql() {
    local sql_command="$1"
    local description="$2"
    
    echo "📝 $description..."
    
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql_command"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql_command"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ $description - Concluído"
    else
        echo "❌ $description - ERRO"
        exit 1
    fi
    echo ""
}

# Função para executar arquivo SQL
execute_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    echo "📝 $description..."
    
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ $description - Concluído"
    else
        echo "❌ $description - ERRO"
        exit 1
    fi
    echo ""
}

# Verificar se o banco existe, se não, criar
echo "🔍 Verificando se o banco '$DB_NAME' existe..."
if [ -n "$DB_PASSWORD" ]; then
    DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "true" || echo "false")
else
    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "true" || echo "false")
fi

if [ "$DB_EXISTS" = "false" ]; then
    echo "🆕 Criando banco de dados '$DB_NAME'..."
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    else
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    fi
    echo "✅ Banco '$DB_NAME' criado com sucesso!"
else
    echo "✅ Banco '$DB_NAME' já existe"
fi
echo ""

# Criar arquivo SQL temporário com todo o schema
echo "📄 Criando schema SQL completo..."
cat > /tmp/anchorview_complete_schema.sql << 'EOF'
-- =====================================
-- ANCHORVIEW COMPLETE DATABASE SCHEMA
-- =====================================
-- Todas as tabelas, funções e dados para o sistema AnchorView
-- Versão: 2.0 - Agosto 2025

-- ===== EXTENSÕES NECESSÁRIAS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== FUNÇÃO PARA GERAR CUID =====
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || substr(md5(random()::text), 1, 24);
END;
$$ LANGUAGE plpgsql;

-- ===== TABELAS PRINCIPAIS =====

-- Tabela Company (multi-tenant base)
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "cnpj" TEXT,
    
    -- Subscription fields
    "subscriptionPlan" TEXT,
    "subscriptionStatus" TEXT,
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "subscriptionExpiryDate" TIMESTAMP(3),
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "daysRemainingInTrial" INTEGER,
    
    -- Usage and limits
    "usersCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCount" INTEGER NOT NULL DEFAULT 0,
    "pointsCount" INTEGER NOT NULL DEFAULT 0,
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "maxUsers" INTEGER,
    "maxProjects" INTEGER,
    "maxStorage" INTEGER,
    
    -- Admin fields
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Tabela User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "phone" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Tabela Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "obraAddress" TEXT,
    "obraCEP" TEXT,
    "obraCNPJ" TEXT,
    "contratanteName" TEXT,
    "contratanteAddress" TEXT,
    "contratanteCEP" TEXT,
    "cnpjContratado" TEXT,
    "contato" TEXT,
    "valorContrato" TEXT,
    "dataInicio" TEXT,
    "dataTermino" TEXT,
    "responsavelTecnico" TEXT,
    "registroCREA" TEXT,
    "tituloProfissional" TEXT,
    "numeroART" TEXT,
    "rnp" TEXT,
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT,
    "dispositivoDeAncoragemPadrao" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Tabela Location (CORRIGIDA - específica por projeto)
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- Tabela AnchorPoint
CREATE TABLE IF NOT EXISTS "anchor_points" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "project_id" TEXT NOT NULL,
    "numero_ponto" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "foto" TEXT,
    "numeroLacre" TEXT,
    "tipo_equipamento" TEXT,
    "data_instalacao" TEXT,
    "frequencia_inspecao_meses" INTEGER,
    "observacoes" TEXT,
    "posicao_x" DOUBLE PRECISION NOT NULL,
    "posicao_y" DOUBLE PRECISION NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Não Testado',
    "created_by_user_id" TEXT,
    "last_modified_by_user_id" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "anchor_points_pkey" PRIMARY KEY ("id")
);

-- Tabela AnchorTest
CREATE TABLE IF NOT EXISTS "anchor_tests" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "ponto_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" TEXT NOT NULL,
    "carga" TEXT NOT NULL,
    "tempo" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "foto_teste" TEXT,
    "foto_pronto" TEXT,
    "data_foto_pronto" TEXT,

    CONSTRAINT "anchor_tests_pkey" PRIMARY KEY ("id")
);

-- ===== TABELAS DE SISTEMA AVANÇADO =====

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2),
    "max_users" INTEGER,
    "max_projects" INTEGER,
    "max_points" INTEGER,
    "max_storage_gb" INTEGER DEFAULT 10,
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "cancel_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "subscription_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT NOT NULL,
    "external_id" TEXT,
    "external_data" JSONB,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Arquivos
CREATE TABLE IF NOT EXISTS "files" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- Fila de sincronização
CREATE TABLE IF NOT EXISTS "sync_queue" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "operation" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- Sessões de usuário
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- Convites de usuário
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

-- Limites de uso
CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "users_count" INTEGER NOT NULL DEFAULT 0,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "points_count" INTEGER NOT NULL DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- Reset de senhas
CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- Log de auditoria
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[],
    "user_id" TEXT,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Status de sincronização
CREATE TABLE IF NOT EXISTS "sync_status" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "sync_status" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- Notificações
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Preferências de usuário
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- Configurações da empresa
CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- Logs do sistema
CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "user_id" TEXT,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- Log de atividades SaaS
CREATE TABLE IF NOT EXISTS "saas_activity_log" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_activity_log_pkey" PRIMARY KEY ("id")
);

-- Permissões de usuário
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- ===== TABELAS DE BACKUP E MONITORAMENTO =====

-- Configuração de backup
CREATE TABLE IF NOT EXISTS "backup_config" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "include_files" BOOLEAN NOT NULL DEFAULT true,
    "compress_backups" BOOLEAN NOT NULL DEFAULT true,
    "encrypt_backups" BOOLEAN NOT NULL DEFAULT false,
    "backup_path" TEXT NOT NULL,
    "last_backup" TIMESTAMP(3),
    "next_backup" TIMESTAMP(3),
    "backup_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_config_pkey" PRIMARY KEY ("id")
);

-- Registros de backup
CREATE TABLE IF NOT EXISTS "backup_records" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "tables_backed_up" TEXT[],
    "files_count" INTEGER NOT NULL DEFAULT 0,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- Analytics de uso
CREATE TABLE IF NOT EXISTS "usage_analytics" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "projects_created" INTEGER NOT NULL DEFAULT 0,
    "points_created" INTEGER NOT NULL DEFAULT 0,
    "tests_performed" INTEGER NOT NULL DEFAULT 0,
    "photos_uploaded" INTEGER NOT NULL DEFAULT 0,
    "storage_used" INTEGER NOT NULL DEFAULT 0,
    "sync_operations" INTEGER NOT NULL DEFAULT 0,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "session_duration" INTEGER NOT NULL DEFAULT 0,
    "top_features" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_analytics_pkey" PRIMARY KEY ("id")
);

-- Saúde do sistema
CREATE TABLE IF NOT EXISTS "system_health" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "database_status" TEXT NOT NULL,
    "storage_status" TEXT NOT NULL,
    "sync_status" TEXT NOT NULL,
    "backup_status" TEXT NOT NULL,
    "response_time" INTEGER NOT NULL,
    "cpu_usage" INTEGER NOT NULL,
    "memory_usage" INTEGER NOT NULL,
    "disk_usage" INTEGER NOT NULL,
    "active_connections" INTEGER NOT NULL,
    "queue_length" INTEGER NOT NULL,
    "alerts" TEXT[],

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- Histórico de assinaturas
CREATE TABLE IF NOT EXISTS "subscription_history" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_plan" TEXT,
    "new_plan" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2),
    "payment_method" TEXT,
    "admin_id" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- Permissões do sistema
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actions" TEXT[],
    "own_data_only" BOOLEAN NOT NULL DEFAULT false,
    "company_data_only" BOOLEAN NOT NULL DEFAULT true,
    "time_restricted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
EOF

echo "✅ Schema SQL criado"
echo ""

# Executar o schema principal
execute_sql_file "/tmp/anchorview_complete_schema.sql" "Criando tabelas principais"

# ===== CRIAR CONSTRAINTS E ÍNDICES =====
echo "🔗 Criando constraints e índices..."

# Unique constraints
execute_sql 'ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key"; ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");' "Constraint: User email único"

execute_sql 'ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_session_token_key"; ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");' "Constraint: Session token único"

execute_sql 'ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_refresh_token_key"; ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_refresh_token_key" UNIQUE ("refresh_token");' "Constraint: Refresh token único"

execute_sql 'ALTER TABLE "user_invitations" DROP CONSTRAINT IF EXISTS "user_invitations_token_key"; ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_token_key" UNIQUE ("token");' "Constraint: Invitation token único"

execute_sql 'ALTER TABLE "usage_limits" DROP CONSTRAINT IF EXISTS "usage_limits_company_id_key"; ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_company_id_key" UNIQUE ("company_id");' "Constraint: Usage limits por empresa"

execute_sql 'ALTER TABLE "password_resets" DROP CONSTRAINT IF EXISTS "password_resets_token_key"; ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_token_key" UNIQUE ("token");' "Constraint: Password reset token único"

execute_sql 'ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_key"; ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");' "Constraint: User preferences por usuário"

execute_sql 'ALTER TABLE "company_settings" DROP CONSTRAINT IF EXISTS "company_settings_company_id_key"; ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_key" UNIQUE ("company_id");' "Constraint: Company settings por empresa"

execute_sql 'ALTER TABLE "usage_analytics" DROP CONSTRAINT IF EXISTS "usage_analytics_company_id_date_key"; ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_date_key" UNIQUE ("company_id", "date");' "Constraint: Analytics únicos por empresa/data"

execute_sql 'ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "permissions_name_key"; ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");' "Constraint: Permission name único"

# Foreign Keys
echo "🔗 Criando foreign keys..."

execute_sql 'ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey"; ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: User -> Company"

execute_sql 'ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_companyId_fkey"; ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Location -> Company"

execute_sql 'ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_projectId_fkey"; ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;' "FK: Location -> Project"

execute_sql 'ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_companyId_fkey"; ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Project -> Company"

execute_sql 'ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_createdByUserId_fkey"; ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Project -> User (creator)"

execute_sql 'ALTER TABLE "anchor_points" DROP CONSTRAINT IF EXISTS "anchor_points_project_id_fkey"; ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: AnchorPoint -> Project"

execute_sql 'ALTER TABLE "anchor_points" DROP CONSTRAINT IF EXISTS "anchor_points_created_by_user_id_fkey"; ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: AnchorPoint -> User (creator)"

execute_sql 'ALTER TABLE "anchor_points" DROP CONSTRAINT IF EXISTS "anchor_points_last_modified_by_user_id_fkey"; ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: AnchorPoint -> User (modifier)"

execute_sql 'ALTER TABLE "anchor_tests" DROP CONSTRAINT IF EXISTS "anchor_tests_ponto_id_fkey"; ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: AnchorTest -> AnchorPoint"

# Todas as outras FKs do sistema avançado
execute_sql 'ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_company_id_fkey"; ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Subscription -> Company"

execute_sql 'ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_plan_id_fkey"; ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Subscription -> Plan"

execute_sql 'ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_subscription_id_fkey"; ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Payment -> Subscription"

execute_sql 'ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_company_id_fkey"; ALTER TABLE "files" ADD CONSTRAINT "files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: File -> Company"

execute_sql 'ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_user_id_fkey"; ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: File -> User"

execute_sql 'ALTER TABLE "sync_queue" DROP CONSTRAINT IF EXISTS "sync_queue_company_id_fkey"; ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: SyncQueue -> Company"

execute_sql 'ALTER TABLE "sync_queue" DROP CONSTRAINT IF EXISTS "sync_queue_user_id_fkey"; ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: SyncQueue -> User"

execute_sql 'ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_user_id_fkey"; ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;' "FK: UserSession -> User"

execute_sql 'ALTER TABLE "user_invitations" DROP CONSTRAINT IF EXISTS "user_invitations_company_id_fkey"; ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: UserInvitation -> Company"

execute_sql 'ALTER TABLE "usage_limits" DROP CONSTRAINT IF EXISTS "usage_limits_company_id_fkey"; ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: UsageLimits -> Company"

execute_sql 'ALTER TABLE "password_resets" DROP CONSTRAINT IF EXISTS "password_resets_user_id_fkey"; ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: PasswordReset -> User"

execute_sql 'ALTER TABLE "audit_log" DROP CONSTRAINT IF EXISTS "audit_log_user_id_fkey"; ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: AuditLog -> User"

execute_sql 'ALTER TABLE "sync_status" DROP CONSTRAINT IF EXISTS "sync_status_user_id_fkey"; ALTER TABLE "sync_status" ADD CONSTRAINT "sync_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: SyncStatus -> User"

execute_sql 'ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey"; ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: Notification -> User"

execute_sql 'ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_fkey"; ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: UserPreferences -> User"

execute_sql 'ALTER TABLE "company_settings" DROP CONSTRAINT IF EXISTS "company_settings_company_id_fkey"; ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: CompanySettings -> Company"

execute_sql 'ALTER TABLE "system_logs" DROP CONSTRAINT IF EXISTS "system_logs_user_id_fkey"; ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: SystemLog -> User"

execute_sql 'ALTER TABLE "saas_activity_log" DROP CONSTRAINT IF EXISTS "saas_activity_log_company_id_fkey"; ALTER TABLE "saas_activity_log" ADD CONSTRAINT "saas_activity_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: SaasActivityLog -> Company"

execute_sql 'ALTER TABLE "saas_activity_log" DROP CONSTRAINT IF EXISTS "saas_activity_log_user_id_fkey"; ALTER TABLE "saas_activity_log" ADD CONSTRAINT "saas_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: SaasActivityLog -> User"

execute_sql 'ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "user_permissions_user_id_fkey"; ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: UserPermission -> User"

execute_sql 'ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "user_permissions_granted_by_fkey"; ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: UserPermission -> User (granter)"

execute_sql 'ALTER TABLE "backup_records" DROP CONSTRAINT IF EXISTS "backup_records_company_id_fkey"; ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;' "FK: BackupRecord -> Company"

execute_sql 'ALTER TABLE "usage_analytics" DROP CONSTRAINT IF EXISTS "usage_analytics_company_id_fkey"; ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;' "FK: UsageAnalytics -> Company"

execute_sql 'ALTER TABLE "subscription_history" DROP CONSTRAINT IF EXISTS "subscription_history_company_id_fkey"; ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;' "FK: SubscriptionHistory -> Company"

execute_sql 'ALTER TABLE "subscription_history" DROP CONSTRAINT IF EXISTS "subscription_history_admin_id_fkey"; ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: SubscriptionHistory -> User (admin)"

# Índices para performance
echo "⚡ Criando índices para performance..."

execute_sql 'CREATE INDEX IF NOT EXISTS "User_email_active_idx" ON "User"("email", "active");' "Índice: User email + active"
execute_sql 'CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");' "Índice: User role"
execute_sql 'CREATE INDEX IF NOT EXISTS "Location_projectId_idx" ON "Location"("projectId");' "Índice: Location por projeto"
execute_sql 'CREATE INDEX IF NOT EXISTS "backup_records_timestamp_idx" ON "backup_records"("timestamp");' "Índice: Backup records timestamp"
execute_sql 'CREATE INDEX IF NOT EXISTS "backup_records_status_idx" ON "backup_records"("status");' "Índice: Backup records status"
execute_sql 'CREATE INDEX IF NOT EXISTS "usage_analytics_date_idx" ON "usage_analytics"("date");' "Índice: Usage analytics date"
execute_sql 'CREATE INDEX IF NOT EXISTS "usage_analytics_company_date_idx" ON "usage_analytics"("company_id", "date");' "Índice: Usage analytics company + date"
execute_sql 'CREATE INDEX IF NOT EXISTS "system_health_timestamp_idx" ON "system_health"("timestamp");' "Índice: System health timestamp"
execute_sql 'CREATE INDEX IF NOT EXISTS "system_health_status_idx" ON "system_health"("status");' "Índice: System health status"
execute_sql 'CREATE INDEX IF NOT EXISTS "subscription_history_company_idx" ON "subscription_history"("company_id");' "Índice: Subscription history company"
execute_sql 'CREATE INDEX IF NOT EXISTS "subscription_history_date_idx" ON "subscription_history"("effective_date");' "Índice: Subscription history date"
execute_sql 'CREATE INDEX IF NOT EXISTS "permissions_category_idx" ON "permissions"("category");' "Índice: Permissions category"
execute_sql 'CREATE INDEX IF NOT EXISTS "permissions_active_idx" ON "permissions"("active");' "Índice: Permissions active"

# ===== CRIAR FUNÇÕES SQL =====
echo "⚙️ Criando funções SQL..."

# Função para verificar super admin
execute_sql "
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN AS \$\$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM \"User\" 
        WHERE role = 'superadmin' AND active = true
    );
END;
\$\$ LANGUAGE plpgsql;
" "Função: check_superadmin_exists"

# Função para calcular próximo backup
execute_sql "
CREATE OR REPLACE FUNCTION calculate_next_backup(frequency TEXT, last_backup TIMESTAMP)
RETURNS TIMESTAMP AS \$\$
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            RETURN last_backup + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN last_backup + INTERVAL '7 days';
        WHEN 'monthly' THEN
            RETURN last_backup + INTERVAL '1 month';
        ELSE
            RETURN last_backup + INTERVAL '1 day';
    END CASE;
END;
\$\$ LANGUAGE plpgsql;
" "Função: calculate_next_backup"

# Função para limpeza de backups
execute_sql "
CREATE OR REPLACE FUNCTION cleanup_old_backups(retention_days INTEGER)
RETURNS INTEGER AS \$\$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM \"backup_records\" 
    WHERE \"timestamp\" < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
\$\$ LANGUAGE plpgsql;
" "Função: cleanup_old_backups"

# Função para estatísticas do sistema
execute_sql "
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS \$\$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCompanies', (SELECT COUNT(*) FROM \"Company\"),
        'activeCompanies', (SELECT COUNT(*) FROM \"Company\" WHERE \"isActive\" = true),
        'trialCompanies', (SELECT COUNT(*) FROM \"Company\" WHERE \"isTrialActive\" = true),
        'suspendedCompanies', (SELECT COUNT(*) FROM \"Company\" WHERE \"isActive\" = false),
        'totalUsers', (SELECT COUNT(*) FROM \"User\"),
        'activeUsers', (SELECT COUNT(*) FROM \"User\" WHERE \"active\" = true),
        'totalProjects', (SELECT COUNT(*) FROM \"Project\" WHERE \"deleted\" = false),
        'totalPoints', (SELECT COUNT(*) FROM \"anchor_points\" WHERE \"archived\" = false),
        'totalTests', (SELECT COUNT(*) FROM \"anchor_tests\"),
        'activeSubscriptions', (SELECT COUNT(*) FROM \"subscriptions\" WHERE \"status\" = 'active'),
        'trialSubscriptions', (SELECT COUNT(*) FROM \"subscriptions\" WHERE \"status\" = 'trialing'),
        'systemUptime', EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(\"createdAt\") FROM \"Company\")))/86400
    ) INTO result;
    
    RETURN result;
END;
\$\$ LANGUAGE plpgsql;
" "Função: get_system_stats"

# Função para analytics diárias
execute_sql "
CREATE OR REPLACE FUNCTION record_daily_analytics(company_id TEXT, analytics_date DATE)
RETURNS VOID AS \$\$
BEGIN
    INSERT INTO \"usage_analytics\" (
        \"id\", \"company_id\", \"date\", 
        \"active_users\", \"projects_created\", \"points_created\", \"tests_performed\"
    ) 
    VALUES (
        generate_cuid(),
        company_id,
        analytics_date::TEXT,
        (SELECT COUNT(DISTINCT \"user_id\") FROM \"user_sessions\" 
         WHERE \"user_id\" IN (SELECT \"id\" FROM \"User\" WHERE \"companyId\" = company_id)
         AND DATE(\"created_at\") = analytics_date),
        (SELECT COUNT(*) FROM \"Project\" 
         WHERE \"companyId\" = company_id AND DATE(\"createdAt\") = analytics_date),
        (SELECT COUNT(*) FROM \"anchor_points\" 
         WHERE \"project_id\" IN (SELECT \"id\" FROM \"Project\" WHERE \"companyId\" = company_id)
         AND DATE(\"data_hora\") = analytics_date),
        (SELECT COUNT(*) FROM \"anchor_tests\" 
         WHERE \"ponto_id\" IN (
            SELECT \"id\" FROM \"anchor_points\" 
            WHERE \"project_id\" IN (SELECT \"id\" FROM \"Project\" WHERE \"companyId\" = company_id)
         )
         AND DATE(\"data_hora\") = analytics_date)
    )
    ON CONFLICT (\"company_id\", \"date\") DO UPDATE SET
        \"active_users\" = EXCLUDED.\"active_users\",
        \"projects_created\" = EXCLUDED.\"projects_created\",
        \"points_created\" = EXCLUDED.\"points_created\",
        \"tests_performed\" = EXCLUDED.\"tests_performed\";
END;
\$\$ LANGUAGE plpgsql;
" "Função: record_daily_analytics"

# ===== INSERIR DADOS INICIAIS =====
echo "📊 Inserindo dados iniciais..."

# Configuração de backup
execute_sql "
INSERT INTO \"backup_config\" (\"id\", \"frequency\", \"backup_path\", \"next_backup\") 
VALUES (
    'default-backup-config',
    'daily',
    '/backups/anchorview',
    NOW() + INTERVAL '1 day'
) ON CONFLICT (\"id\") DO NOTHING;
" "Dados: Configuração de backup padrão"

# Planos de assinatura
execute_sql "
INSERT INTO \"subscription_plans\" (\"id\", \"name\", \"description\", \"price_monthly\", \"max_users\", \"max_projects\", \"max_storage_gb\") VALUES
('trial', 'Trial Gratuito', '14 dias grátis para testar', 0.00, 2, 3, 1),
('basic', 'Básico', 'Plano ideal para empresas pequenas', 99.90, 5, 10, 5),
('pro', 'Profissional', 'Plano completo para empresas médias', 299.90, 20, 50, 20),
('enterprise', 'Enterprise', 'Plano ilimitado para grandes empresas', 799.90, 999, 999, 100)
ON CONFLICT (\"id\") DO NOTHING;
" "Dados: Planos de assinatura"

# Permissões básicas
execute_sql "
INSERT INTO \"permissions\" (\"id\", \"name\", \"description\", \"category\", \"actions\") VALUES
('perm-001', 'system.admin', 'Administração total do sistema', 'system', ARRAY['read', 'write', 'delete', 'admin']),
('perm-002', 'company.admin', 'Administração da empresa', 'company', ARRAY['read', 'write', 'delete']),
('perm-003', 'project.manage', 'Gerenciar projetos', 'project', ARRAY['read', 'write', 'delete']),
('perm-004', 'point.manage', 'Gerenciar pontos de ancoragem', 'point', ARRAY['read', 'write', 'delete']),
('perm-005', 'test.manage', 'Gerenciar testes', 'test', ARRAY['read', 'write', 'delete']),
('perm-006', 'company.view', 'Visualizar dados da empresa', 'company', ARRAY['read']),
('perm-007', 'project.view', 'Visualizar projetos', 'project', ARRAY['read']),
('perm-008', 'point.view', 'Visualizar pontos', 'point', ARRAY['read']),
('perm-009', 'test.view', 'Visualizar testes', 'test', ARRAY['read'])
ON CONFLICT (\"id\") DO NOTHING;
" "Dados: Permissões básicas do sistema"

# ===== ADICIONAR COMENTÁRIOS =====
echo "📝 Adicionando comentários para documentação..."

execute_sql "COMMENT ON COLUMN \"User\".\"role\" IS 'Roles: user, admin, superadmin';" "Comentário: User role"
execute_sql "COMMENT ON COLUMN \"User\".\"password_hash\" IS 'Hash bcrypt da senha para autenticação';" "Comentário: User password_hash"
execute_sql "COMMENT ON COLUMN \"User\".\"email\" IS 'Email único para login';" "Comentário: User email"
execute_sql "COMMENT ON COLUMN \"user_permissions\".\"expires_at\" IS 'Data de expiração da permissão';" "Comentário: UserPermission expires_at"
execute_sql "COMMENT ON COLUMN \"Location\".\"projectId\" IS 'Cada projeto tem suas próprias localizações específicas';" "Comentário: Location projectId"

# ===== VERIFICAÇÕES FINAIS =====
echo "🔍 Executando verificações finais..."

# Contar tabelas criadas
TABLE_COUNT=$(execute_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "Contando tabelas criadas" | tail -n 1 | tr -d ' ')
echo "📊 Total de tabelas criadas: $TABLE_COUNT"

# Verificar se funções foram criadas
FUNCTION_COUNT=$(execute_sql "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';" "Contando funções criadas" | tail -n 1 | tr -d ' ')
echo "⚙️ Total de funções criadas: $FUNCTION_COUNT"

# Verificar dados iniciais
PLANS_COUNT=$(execute_sql "SELECT COUNT(*) FROM subscription_plans;" "Contando planos de assinatura" | tail -n 1 | tr -d ' ')
echo "💳 Total de planos inseridos: $PLANS_COUNT"

PERMISSIONS_COUNT=$(execute_sql "SELECT COUNT(*) FROM permissions;" "Contando permissões" | tail -n 1 | tr -d ' ')
echo "🔐 Total de permissões inseridas: $PERMISSIONS_COUNT"

# Limpeza
rm -f /tmp/anchorview_complete_schema.sql

echo ""
echo "🎉 ================================="
echo "🎉 SETUP COMPLETO FINALIZADO!"
echo "🎉 ================================="
echo ""
echo "✅ Database: $DB_NAME"
echo "✅ Tabelas: $TABLE_COUNT"
echo "✅ Funções: $FUNCTION_COUNT"  
echo "✅ Planos: $PLANS_COUNT"
echo "✅ Permissões: $PERMISSIONS_COUNT"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Execute: npx prisma generate"
echo "2. Acesse: http://localhost:3000/setup"
echo "3. Crie seu super admin"
echo "4. Acesse: http://localhost:3000/admin"
echo ""
echo "🔗 Chave de setup: anchor-setup-2025"
echo ""
echo "🚀 AnchorView está pronto para uso!"