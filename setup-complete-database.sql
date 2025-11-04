-- ===================================
-- SETUP COMPLETO DO BANCO ANCHORVIEW
-- ===================================
-- Este arquivo cria TODAS as tabelas, funções e dados iniciais
-- Execute uma única vez em um banco PostgreSQL limpo

-- ===== CRIAÇÃO DAS TABELAS PRINCIPAIS =====

-- Tabela Company (base do sistema multi-tenant)
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
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

-- Tabela Location (POR PROJETO!)
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL, -- ✅ ADICIONADO - Cada projeto tem suas localizações

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- Tabela Project
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
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

-- Tabela AnchorPoint
CREATE TABLE "anchor_points" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "anchor_tests" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "subscription_plans" (
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
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "user_invitations" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "usage_limits" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "users_count" INTEGER NOT NULL DEFAULT 0,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "points_count" INTEGER NOT NULL DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- Reset de senhas
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- Log de auditoria
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "sync_status" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- Configurações da empresa
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- Logs do sistema
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "saas_activity_log" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_activity_log_pkey" PRIMARY KEY ("id")
);

-- Permissões de usuário
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "backup_config" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "backup_records" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "usage_analytics" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
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

-- ===== CHAVES ÚNICAS =====

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

-- ===== CHAVES ESTRANGEIRAS =====

-- User -> Company
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Location -> Company E Project ✅ CORRIGIDO
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Project -> Company e User
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AnchorPoint -> Project e Users
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AnchorTest -> AnchorPoint
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Todas as outras FKs
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
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

-- ===== ÍNDICES PARA PERFORMANCE =====

CREATE INDEX "User_email_active_idx" ON "User"("email", "active");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Location_projectId_idx" ON "Location"("projectId"); -- ✅ ADICIONADO
CREATE INDEX "backup_records_timestamp_idx" ON "backup_records"("timestamp");
CREATE INDEX "backup_records_status_idx" ON "backup_records"("status");
CREATE INDEX "usage_analytics_date_idx" ON "usage_analytics"("date");
CREATE INDEX "usage_analytics_company_date_idx" ON "usage_analytics"("company_id", "date");
CREATE INDEX "system_health_timestamp_idx" ON "system_health"("timestamp");
CREATE INDEX "system_health_status_idx" ON "system_health"("status");
CREATE INDEX "subscription_history_company_idx" ON "subscription_history"("company_id");
CREATE INDEX "subscription_history_date_idx" ON "subscription_history"("effective_date");
CREATE INDEX "permissions_category_idx" ON "permissions"("category");
CREATE INDEX "permissions_active_idx" ON "permissions"("active");

-- ===== COMENTÁRIOS PARA DOCUMENTAÇÃO =====

COMMENT ON COLUMN "User"."role" IS 'Roles: user, admin, superadmin';
COMMENT ON COLUMN "User"."password_hash" IS 'Hash bcrypt da senha para autenticação';
COMMENT ON COLUMN "User"."email" IS 'Email único para login';
COMMENT ON COLUMN "user_permissions"."expires_at" IS 'Data de expiração da permissão';
COMMENT ON COLUMN "Location"."projectId" IS 'Cada projeto tem suas próprias localizações';
COMMENT ON TABLE "backup_config" IS 'Configuração do sistema de backup automático';
COMMENT ON COLUMN "backup_config"."frequency" IS 'Frequência: daily, weekly, monthly';
COMMENT ON COLUMN "backup_config"."backup_path" IS 'Caminho onde os backups são armazenados';
COMMENT ON TABLE "backup_records" IS 'Histórico de execução de backups';
COMMENT ON COLUMN "backup_records"."type" IS 'Tipo: automatic, manual';
COMMENT ON COLUMN "backup_records"."status" IS 'Status: completed, failed, in_progress';
COMMENT ON TABLE "usage_analytics" IS 'Analytics de uso por empresa por dia';
COMMENT ON COLUMN "usage_analytics"."date" IS 'Data no formato YYYY-MM-DD';
COMMENT ON TABLE "system_health" IS 'Monitoramento de saúde do sistema';
COMMENT ON COLUMN "system_health"."status" IS 'Status geral: healthy, warning, critical';
COMMENT ON TABLE "subscription_history" IS 'Histórico de mudanças de assinatura';
COMMENT ON COLUMN "subscription_history"."action" IS 'Ação: subscribe, upgrade, downgrade, cancel, renew, suspend';
COMMENT ON TABLE "permissions" IS 'Definições de permissões do sistema';
COMMENT ON COLUMN "permissions"."category" IS 'Categoria: system, company, project, point, test';

-- ===== FUNÇÕES SQL =====

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

-- Função para calcular próximo backup
CREATE OR REPLACE FUNCTION calculate_next_backup(frequency TEXT, last_backup TIMESTAMP)
RETURNS TIMESTAMP AS $$
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
$$ LANGUAGE plpgsql;

-- Função para limpeza de backups antigos
CREATE OR REPLACE FUNCTION cleanup_old_backups(retention_days INTEGER)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "backup_records" 
    WHERE "timestamp" < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCompanies', (SELECT COUNT(*) FROM "Company"),
        'activeCompanies', (SELECT COUNT(*) FROM "Company" WHERE "isActive" = true),
        'trialCompanies', (SELECT COUNT(*) FROM "Company" WHERE "isTrialActive" = true),
        'suspendedCompanies', (SELECT COUNT(*) FROM "Company" WHERE "isActive" = false),
        'totalUsers', (SELECT COUNT(*) FROM "User"),
        'activeUsers', (SELECT COUNT(*) FROM "User" WHERE "active" = true),
        'totalProjects', (SELECT COUNT(*) FROM "Project" WHERE "deleted" = false),
        'totalPoints', (SELECT COUNT(*) FROM "anchor_points" WHERE "archived" = false),
        'totalTests', (SELECT COUNT(*) FROM "anchor_tests"),
        'activeSubscriptions', (SELECT COUNT(*) FROM "subscriptions" WHERE "status" = 'active'),
        'trialSubscriptions', (SELECT COUNT(*) FROM "subscriptions" WHERE "status" = 'trialing'),
        'systemUptime', EXTRACT(EPOCH FROM (NOW() - (SELECT MIN("createdAt") FROM "Company")))/86400
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar analytics diárias
CREATE OR REPLACE FUNCTION record_daily_analytics(company_id TEXT, analytics_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO "usage_analytics" (
        "id", "company_id", "date", 
        "active_users", "projects_created", "points_created", "tests_performed"
    ) 
    VALUES (
        gen_random_uuid()::TEXT,
        company_id,
        analytics_date::TEXT,
        (SELECT COUNT(DISTINCT "user_id") FROM "user_sessions" 
         WHERE "user_id" IN (SELECT "id" FROM "User" WHERE "companyId" = company_id)
         AND DATE("created_at") = analytics_date),
        (SELECT COUNT(*) FROM "Project" 
         WHERE "companyId" = company_id AND DATE("createdAt") = analytics_date),
        (SELECT COUNT(*) FROM "anchor_points" 
         WHERE "project_id" IN (SELECT "id" FROM "Project" WHERE "companyId" = company_id)
         AND DATE("data_hora") = analytics_date),
        (SELECT COUNT(*) FROM "anchor_tests" 
         WHERE "ponto_id" IN (
            SELECT "id" FROM "anchor_points" 
            WHERE "project_id" IN (SELECT "id" FROM "Project" WHERE "companyId" = company_id)
         )
         AND DATE("data_hora") = analytics_date)
    )
    ON CONFLICT ("company_id", "date") DO UPDATE SET
        "active_users" = EXCLUDED."active_users",
        "projects_created" = EXCLUDED."projects_created",
        "points_created" = EXCLUDED."points_created",
        "tests_performed" = EXCLUDED."tests_performed";
END;
$$ LANGUAGE plpgsql;

-- ===== DADOS INICIAIS =====

-- Inserir configuração padrão de backup
INSERT INTO "backup_config" ("id", "frequency", "backup_path", "next_backup") 
VALUES (
    'default-backup-config',
    'daily',
    '/backups/anchorview',
    NOW() + INTERVAL '1 day'
);

-- Inserir planos de assinatura padrão
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "max_users", "max_projects", "max_storage_gb") VALUES
('trial', 'Trial Gratuito', '14 dias grátis para testar', 0.00, 2, 3, 1),
('basic', 'Básico', 'Plano ideal para empresas pequenas', 99.90, 5, 10, 5),
('pro', 'Profissional', 'Plano completo para empresas médias', 299.90, 20, 50, 20),
('enterprise', 'Enterprise', 'Plano ilimitado para grandes empresas', 799.90, 999, 999, 100);

-- Inserir permissões básicas do sistema
INSERT INTO "permissions" ("id", "name", "description", "category", "actions") VALUES
('perm-001', 'system.admin', 'Administração total do sistema', 'system', ARRAY['read', 'write', 'delete', 'admin']),
('perm-002', 'company.admin', 'Administração da empresa', 'company', ARRAY['read', 'write', 'delete']),
('perm-003', 'project.manage', 'Gerenciar projetos', 'project', ARRAY['read', 'write', 'delete']),
('perm-004', 'point.manage', 'Gerenciar pontos de ancoragem', 'point', ARRAY['read', 'write', 'delete']),
('perm-005', 'test.manage', 'Gerenciar testes', 'test', ARRAY['read', 'write', 'delete']),
('perm-006', 'company.view', 'Visualizar dados da empresa', 'company', ARRAY['read']),
('perm-007', 'project.view', 'Visualizar projetos', 'project', ARRAY['read']),
('perm-008', 'point.view', 'Visualizar pontos', 'point', ARRAY['read']),
('perm-009', 'test.view', 'Visualizar testes', 'test', ARRAY['read']);

-- ===== FIM DO SETUP =====
-- Execute este arquivo APENAS UMA VEZ em um banco PostgreSQL limpo
-- Após executar, use: npx prisma generate && npx prisma db push