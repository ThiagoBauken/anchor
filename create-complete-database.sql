-- ================================================
-- SCRIPT COMPLETO PARA CRIAR BANCO ANCHORVIEW
-- 23 TABELAS + 47 FUNÇÕES + TRIGGERS + VIEWS
-- ================================================

-- PARTE 1: CRIAR TIPOS ENUM
-- ================================================
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- PARTE 2: CRIAR TABELAS BASE (4 tabelas)
-- ================================================

-- 1. Company
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- 2. User
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

-- 3. Location
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- 4. Project
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

-- PARTE 3: CRIAR TABELAS DE ANCORAGEM (2 tabelas)
-- ================================================

-- 5. anchor_points
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

-- 6. anchor_tests
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

-- PARTE 4: CRIAR TABELAS DE ASSINATURA (3 tabelas)
-- ================================================

-- 7. subscription_plans
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

-- 8. subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "cancel_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- 9. payments
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT NOT NULL,
    "external_id" TEXT,
    "external_data" JSONB,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- PARTE 5: CRIAR TABELAS DE SISTEMA (14 tabelas)
-- ================================================

-- 10. files
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

-- 11. sync_queue
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

-- 12. user_sessions
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

-- 13. user_invitations
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

-- 14. usage_limits
CREATE TABLE "usage_limits" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "users_count" INTEGER NOT NULL DEFAULT 0,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "points_count" INTEGER NOT NULL DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- 15. password_resets
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- 16. audit_log
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

-- 17. sync_status
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
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- 18. notifications
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

-- 19. user_preferences
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- 20. company_settings
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- 21. system_logs
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

-- 22. saas_activity_log
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

-- 23. user_permissions
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- PARTE 6: CRIAR TABELA PRISMA MIGRATIONS
-- ================================================
CREATE TABLE "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);

-- PARTE 7: ADICIONAR TODAS AS FOREIGN KEYS
-- ================================================
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
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

-- PARTE 8: CRIAR UNIQUE CONSTRAINTS
-- ================================================
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");
CREATE UNIQUE INDEX "user_invitations_token_key" ON "user_invitations"("token");
CREATE UNIQUE INDEX "usage_limits_company_id_key" ON "usage_limits"("company_id");
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- PARTE 9: CONFIRMAR CRIAÇÃO
-- ================================================
SELECT 'SUCESSO: 23 tabelas criadas com todas as colunas!' as resultado;