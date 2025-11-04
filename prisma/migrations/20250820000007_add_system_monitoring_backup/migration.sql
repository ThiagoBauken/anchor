-- AddSystemMonitoringBackup
-- Adiciona sistema de backup, analytics e monitoramento

-- Adiciona expiração para permissões de usuário
ALTER TABLE "user_permissions" ADD COLUMN "expires_at" TIMESTAMP(3);

-- Comentários para documentação
COMMENT ON COLUMN "user_permissions"."expires_at" IS 'Data de expiração da permissão';

-- ===== CONFIGURAÇÃO DE BACKUP =====

-- Tabela de configuração de backup
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_config_pkey" PRIMARY KEY ("id")
);

-- Tabela de histórico de backups
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

-- ===== ANALYTICS E MÉTRICAS =====

-- Tabela de analytics de uso por empresa
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

-- ===== MONITORAMENTO DO SISTEMA =====

-- Tabela de saúde do sistema
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

-- ===== HISTÓRICO DE ASSINATURAS =====

-- Tabela de histórico de mudanças de assinatura
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

-- ===== SISTEMA DE PERMISSÕES =====

-- Tabela de permissões do sistema
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

-- ===== CHAVES ESTRANGEIRAS =====

-- Backup records -> Company
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_company_id_fkey" 
FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Usage analytics -> Company
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_fkey" 
FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription history -> Company
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_company_id_fkey" 
FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription history -> Admin User
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_admin_id_fkey" 
FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== CONSTRAINTS E ÍNDICES =====

-- Unique constraint para analytics por empresa/data
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_company_id_date_key" 
UNIQUE ("company_id", "date");

-- Unique constraint para nome de permissão
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");

-- Índices para performance
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

-- Backup config
COMMENT ON TABLE "backup_config" IS 'Configuração do sistema de backup automático';
COMMENT ON COLUMN "backup_config"."frequency" IS 'Frequência: daily, weekly, monthly';
COMMENT ON COLUMN "backup_config"."backup_path" IS 'Caminho onde os backups são armazenados';

-- Backup records
COMMENT ON TABLE "backup_records" IS 'Histórico de execução de backups';
COMMENT ON COLUMN "backup_records"."type" IS 'Tipo: automatic, manual';
COMMENT ON COLUMN "backup_records"."status" IS 'Status: completed, failed, in_progress';

-- Usage analytics
COMMENT ON TABLE "usage_analytics" IS 'Analytics de uso por empresa por dia';
COMMENT ON COLUMN "usage_analytics"."date" IS 'Data no formato YYYY-MM-DD';

-- System health
COMMENT ON TABLE "system_health" IS 'Monitoramento de saúde do sistema';
COMMENT ON COLUMN "system_health"."status" IS 'Status geral: healthy, warning, critical';

-- Subscription history
COMMENT ON TABLE "subscription_history" IS 'Histórico de mudanças de assinatura';
COMMENT ON COLUMN "subscription_history"."action" IS 'Ação: subscribe, upgrade, downgrade, cancel, renew, suspend';

-- Permissions
COMMENT ON TABLE "permissions" IS 'Definições de permissões do sistema';
COMMENT ON COLUMN "permissions"."category" IS 'Categoria: system, company, project, point, test';

-- ===== FUNÇÕES DE BACKUP =====

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

-- ===== FUNÇÕES DE ANALYTICS =====

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
        'systemUptime', EXTRACT(EPOCH FROM (NOW() - (SELECT MIN("created_at") FROM "Company")))/86400
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

-- ===== CONFIGURAÇÃO INICIAL =====

-- Inserir configuração padrão de backup
INSERT INTO "backup_config" ("id", "frequency", "backup_path", "next_backup") 
VALUES (
    'default-backup-config',
    'daily',
    '/backups/anchorview',
    NOW() + INTERVAL '1 day'
);

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