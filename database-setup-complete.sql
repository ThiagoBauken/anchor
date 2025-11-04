-- ===================================================================
-- ANCHORVIEW - SETUP COMPLETO DO BANCO DE DADOS POSTGRESQL
-- ===================================================================
-- Este arquivo cria TUDO que é necessário para o AnchorView funcionar
-- Inclui: tabelas, colunas, constraints, índices, funções e dados iniciais
-- ===================================================================

-- ===== EXTENSÕES NECESSÁRIAS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== FUNÇÃO PARA GERAR CUID =====
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    counter_part TEXT;
    random_part TEXT;
    machine_part TEXT;
BEGIN
    -- Timestamp base36 (8 chars)
    timestamp_part := LPAD(UPPER(ENCODE(('\x' || TO_HEX((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT))::BYTEA, 'hex')), 8, '0');

    -- Counter simples (4 chars)
    counter_part := LPAD(UPPER(TO_HEX((RANDOM() * 65535)::INT)), 4, '0');

    -- Random part (16 chars)
    random_part := UPPER(ENCODE(gen_random_bytes(8), 'hex'));

    -- Machine part (8 chars)
    machine_part := UPPER(ENCODE(gen_random_bytes(4), 'hex'));

    RETURN 'c' || LOWER(timestamp_part || counter_part || random_part || machine_part);
END;
$$ LANGUAGE plpgsql;

-- ===== TABELA COMPANY (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'Brasil',
    "zipCode" TEXT,
    "cnpj" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "industry" TEXT,
    "size" TEXT DEFAULT 'small',
    "timezone" TEXT DEFAULT 'America/Sao_Paulo',
    "language" TEXT DEFAULT 'pt-BR',
    "currency" TEXT DEFAULT 'BRL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "settings" JSONB DEFAULT '{}',

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA USER (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "companyId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,
    "settings" JSONB DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA PROJECT (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT DEFAULT 'medium',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(15,2),
    "currency" TEXT DEFAULT 'BRL',
    "client" TEXT,
    "location" TEXT,
    "coordinates" JSONB,
    "tags" TEXT[],
    "customFields" JSONB DEFAULT '{}',
    "progress" INTEGER DEFAULT 0,
    "riskLevel" TEXT DEFAULT 'medium',
    "compliance" JSONB DEFAULT '{}',
    "team" TEXT[],
    "documents" JSONB DEFAULT '[]',
    "images" JSONB DEFAULT '[]',
    "notes" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA LOCATION (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "coordinates" JSONB DEFAULT '{}',

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA ANCHOR_POINTS (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "anchor_points" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "project_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
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

-- ===== TABELA ANCHOR_TESTS (COMPLETA) =====
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

-- ===== TABELA SUBSCRIPTION_PLANS (COMPLETA) =====
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

-- ===== TABELA SUBSCRIPTIONS (COMPLETA) =====
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

-- ===== TABELA PAYMENTS (COMPLETA) =====
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

-- ===== TABELA FILES (COMPLETA) =====
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

-- ===== TABELA SYNC_QUEUE (COMPLETA) =====
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

-- ===== TABELA USER_SESSIONS (COMPLETA) =====
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

-- ===== TABELA USER_INVITATIONS (COMPLETA) =====
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

-- ===== TABELA USAGE_LIMITS (COMPLETA) =====
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

-- ===== TABELA PASSWORD_RESETS (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA AUDIT_LOG (COMPLETA) =====
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

-- ===== TABELA SYNC_STATUS (COMPLETA) =====
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

-- ===== TABELA NOTIFICATIONS (COMPLETA) =====
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

-- ===== TABELA USER_PREFERENCES (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA COMPANY_SETTINGS (COMPLETA) =====
CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "company_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- ===== TABELA SYSTEM_LOGS (COMPLETA) =====
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

-- ===== TABELA SAAS_ACTIVITY_LOG (COMPLETA) =====
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

-- ===== TABELA USER_PERMISSIONS (COMPLETA) =====
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

-- ===== TABELA BACKUP_CONFIG (COMPLETA) =====
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

-- ===== TABELA BACKUP_RECORDS (COMPLETA) =====
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

-- ===== TABELA USAGE_ANALYTICS (COMPLETA) =====
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

-- ===== TABELA SYSTEM_HEALTH (COMPLETA) =====
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

-- ===== TABELA SUBSCRIPTION_HISTORY (COMPLETA) =====
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

-- ===== TABELA PERMISSIONS (COMPLETA) =====
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

-- ===================================================================
-- CONSTRAINTS ÚNICOS
-- ===================================================================

ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_refresh_token_key" UNIQUE ("refresh_token");
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_token_key" UNIQUE ("token");
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_company_id_key" UNIQUE ("company_id");
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_token_key" UNIQUE ("token");
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_key" UNIQUE ("company_id");
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_date_key" UNIQUE ("company_id", "date");
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");

-- ===================================================================
-- FOREIGN KEYS (RELAÇÕES ENTRE TABELAS)
-- ===================================================================

-- Relações principais
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relações SaaS
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Outras relações
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sync_status" ADD CONSTRAINT "sync_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "saas_activity_log" ADD CONSTRAINT "saas_activity_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saas_activity_log" ADD CONSTRAINT "saas_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===================================================================
-- ÍNDICES PARA PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS "User_email_active_idx" ON "User"("email", "active");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "Location_projectId_idx" ON "Location"("projectId");
CREATE INDEX IF NOT EXISTS "Location_companyId_idx" ON "Location"("companyId");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_deleted_idx" ON "Project"("deleted");
CREATE INDEX IF NOT EXISTS "anchor_points_project_id_idx" ON "anchor_points"("project_id");
CREATE INDEX IF NOT EXISTS "anchor_points_status_idx" ON "anchor_points"("status");
CREATE INDEX IF NOT EXISTS "anchor_points_archived_idx" ON "anchor_points"("archived");
CREATE INDEX IF NOT EXISTS "anchor_tests_ponto_id_idx" ON "anchor_tests"("ponto_id");
CREATE INDEX IF NOT EXISTS "anchor_tests_data_hora_idx" ON "anchor_tests"("data_hora");
CREATE INDEX IF NOT EXISTS "subscriptions_company_id_idx" ON "subscriptions"("company_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "payments_subscription_id_idx" ON "payments"("subscription_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "sync_queue_company_id_idx" ON "sync_queue"("company_id");
CREATE INDEX IF NOT EXISTS "sync_queue_status_idx" ON "sync_queue"("status");
CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "audit_log_table_record_idx" ON "audit_log"("table_name", "record_id");
CREATE INDEX IF NOT EXISTS "audit_log_timestamp_idx" ON "audit_log"("timestamp");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_read_at_idx" ON "notifications"("read_at");
CREATE INDEX IF NOT EXISTS "system_logs_level_idx" ON "system_logs"("level");
CREATE INDEX IF NOT EXISTS "system_logs_timestamp_idx" ON "system_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "usage_analytics_company_date_idx" ON "usage_analytics"("company_id", "date");
CREATE INDEX IF NOT EXISTS "system_health_timestamp_idx" ON "system_health"("timestamp");

-- ===================================================================
-- FUNÇÕES SQL ESSENCIAIS
-- ===================================================================

-- Função para verificar se existe super admin
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User"
        WHERE role = 'superadmin' AND active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCompanies', (SELECT COUNT(*) FROM "Company"),
        'activeCompanies', (SELECT COUNT(*) FROM "Company" WHERE "isActive" = true),
        'totalUsers', (SELECT COUNT(*) FROM "User"),
        'activeUsers', (SELECT COUNT(*) FROM "User" WHERE "active" = true),
        'totalProjects', (SELECT COUNT(*) FROM "Project" WHERE "deleted" = false),
        'totalPoints', (SELECT COUNT(*) FROM "anchor_points" WHERE "archived" = false),
        'totalTests', (SELECT COUNT(*) FROM "anchor_tests")
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "user_sessions"
    WHERE "expires_at" < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar limites de uso
CREATE OR REPLACE FUNCTION update_usage_limits(company_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO "usage_limits" ("company_id", "users_count", "projects_count", "points_count", "updated_at")
    VALUES (
        company_id_param,
        (SELECT COUNT(*) FROM "User" WHERE "companyId" = company_id_param AND "active" = true),
        (SELECT COUNT(*) FROM "Project" WHERE "companyId" = company_id_param AND "deleted" = false),
        (SELECT COUNT(*) FROM "anchor_points" ap
         JOIN "Project" p ON ap."project_id" = p."id"
         WHERE p."companyId" = company_id_param AND ap."archived" = false),
        NOW()
    )
    ON CONFLICT ("company_id")
    DO UPDATE SET
        "users_count" = EXCLUDED."users_count",
        "projects_count" = EXCLUDED."projects_count",
        "points_count" = EXCLUDED."points_count",
        "updated_at" = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para arquivar projetos antigos
CREATE OR REPLACE FUNCTION archive_old_projects(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE "Project"
    SET "archivedAt" = NOW()
    WHERE "archivedAt" IS NULL
      AND "updatedAt" < (NOW() - INTERVAL '1 day' * days_old)
      AND "status" != 'active';

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- DADOS INICIAIS
-- ===================================================================

-- Planos de assinatura
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_yearly", "max_users", "max_projects", "max_points", "max_storage_gb", "features") VALUES
('trial', 'Trial Gratuito', '14 dias grátis para testar todas as funcionalidades', 0.00, NULL, 2, 3, 50, 1, '{"support": "community", "backup": false, "api": false, "reports": "basic"}'),
('basic', 'Básico', 'Plano ideal para empresas pequenas', 99.90, 1079.90, 5, 10, 200, 5, '{"support": "email", "backup": true, "api": false, "reports": "standard"}'),
('pro', 'Profissional', 'Plano completo para empresas médias', 299.90, 3239.90, 20, 50, 1000, 20, '{"support": "priority", "backup": true, "api": true, "reports": "advanced"}'),
('enterprise', 'Enterprise', 'Plano ilimitado para grandes empresas', 799.90, 8639.90, 999, 999, 99999, 100, '{"support": "dedicated", "backup": true, "api": true, "reports": "custom", "sla": "99.9%"}')
ON CONFLICT ("id") DO NOTHING;

-- Permissões do sistema
INSERT INTO "permissions" ("id", "name", "description", "category", "actions") VALUES
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
ON CONFLICT ("id") DO NOTHING;

-- Configuração de backup padrão
INSERT INTO "backup_config" ("id", "frequency", "backup_path", "next_backup", "retention_days", "include_files", "compress_backups", "encrypt_backups")
VALUES (
    'default-backup-config',
    'daily',
    '/backups/anchorview',
    NOW() + INTERVAL '1 day',
    30,
    true,
    true,
    false
) ON CONFLICT ("id") DO NOTHING;

-- ===================================================================
-- TRIGGERS PARA AUDITORIA E ATUALIZAÇÕES AUTOMÁTICAS
-- ===================================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON "Company" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para log de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "audit_log" ("table_name", "record_id", "operation", "new_values", "timestamp")
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "audit_log" ("table_name", "record_id", "operation", "old_values", "new_values", "timestamp")
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO "audit_log" ("table_name", "record_id", "operation", "old_values", "timestamp")
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoria nas tabelas importantes
CREATE TRIGGER audit_company_changes AFTER INSERT OR UPDATE OR DELETE ON "Company" FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_user_changes AFTER INSERT OR UPDATE OR DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_project_changes AFTER INSERT OR UPDATE OR DELETE ON "Project" FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_anchor_points_changes AFTER INSERT OR UPDATE OR DELETE ON "anchor_points" FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ===================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ===================================================================

COMMENT ON DATABASE current_database() IS 'AnchorView - Sistema de gerenciamento de pontos de ancoragem para escalada industrial';

COMMENT ON TABLE "Company" IS 'Empresas que utilizam o sistema (multi-tenant)';
COMMENT ON TABLE "User" IS 'Usuários do sistema associados a empresas';
COMMENT ON TABLE "Project" IS 'Projetos de escalada/inspeção dentro de empresas';
COMMENT ON TABLE "Location" IS 'Localizações específicas dentro de projetos';
COMMENT ON TABLE "anchor_points" IS 'Pontos de ancoragem em projetos';
COMMENT ON TABLE "anchor_tests" IS 'Testes realizados em pontos de ancoragem';
COMMENT ON TABLE "subscription_plans" IS 'Planos de assinatura SaaS disponíveis';
COMMENT ON TABLE "subscriptions" IS 'Assinaturas ativas das empresas';
COMMENT ON TABLE "payments" IS 'Histórico de pagamentos das assinaturas';

-- ===================================================================
-- VERIFICAÇÕES DE INTEGRIDADE
-- ===================================================================

-- Verificar se todas as tabelas foram criadas
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ===================================================================
-- FIM DO SCRIPT
-- ===================================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '🎉 AnchorView Database Setup Completo!';
    RAISE NOTICE '✅ % tabelas criadas', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE '✅ % planos de assinatura inseridos', (SELECT COUNT(*) FROM subscription_plans);
    RAISE NOTICE '✅ % permissões inseridas', (SELECT COUNT(*) FROM permissions);
    RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;
