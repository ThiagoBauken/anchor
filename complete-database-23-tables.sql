-- =============================================
-- ANCHORVIEW - SCRIPT COMPLETO COM 23 TABELAS
-- Database: privado
-- Host: 185.215.165.19:8002
-- User: privado
-- =============================================

-- Conectar ao banco: psql "postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"

-- =============================================
-- EXTENSÕES NECESSÁRIAS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABELAS PRINCIPAIS DO SISTEMA
-- =============================================

-- Empresas/Organizações
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subscriptionPlan" TEXT DEFAULT 'trial' CHECK ("subscriptionPlan" IN ('trial', 'basic', 'pro', 'enterprise')),
    "subscriptionStatus" TEXT DEFAULT 'active' CHECK ("subscriptionStatus" IN ('active', 'expired', 'cancelled')),
    "trialStartDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "trialEndDate" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    "subscriptionExpiryDate" TIMESTAMP WITH TIME ZONE,
    "isTrialActive" BOOLEAN DEFAULT TRUE,
    "daysRemainingInTrial" INTEGER DEFAULT 14,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários do sistema
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "password_hash" TEXT, -- Para autenticação futura
    "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'user')),
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_login_at" TIMESTAMP WITH TIME ZONE
);

-- Localizações/Tipos de pontos
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL CHECK ("markerShape" IN ('circle', 'square', 'x', '+')),
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projetos
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[], -- Array de URLs/paths das imagens
    "deleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamentos
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "createdByUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    
    -- Campos do relatório
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
    
    -- Configurações padrão para testes
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT,
    "dispositivoDeAncoragemPadrao" TEXT,
    
    -- Configurações de escala para DWG
    "scalePixelsPerMeter" DOUBLE PRECISION,
    "dwgRealWidth" DOUBLE PRECISION,
    "dwgRealHeight" DOUBLE PRECISION
);

-- =============================================
-- 2. SISTEMA DE GESTÃO DE ARQUIVOS
-- =============================================
CREATE TABLE IF NOT EXISTS "files" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "original_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL, -- SHA256 para deduplicação
    "thumbnail_path" TEXT, -- Para imagens
    "uploaded_by" TEXT NOT NULL REFERENCES "User"("id"),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- =============================================
-- 3. PONTOS DE ANCORAGEM (MIGRADOS DO LOCALSTORAGE)
-- =============================================
CREATE TABLE IF NOT EXISTS "anchor_points" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "legacy_id" TEXT, -- Para migração do localStorage
    "project_id" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    
    -- Dados principais
    "numero_ponto" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "numero_lacre" TEXT,
    "tipo_equipamento" TEXT,
    "data_instalacao" DATE,
    "frequencia_inspecao_meses" INTEGER DEFAULT 12,
    "observacoes" TEXT,
    
    -- Posicionamento no mapa
    "posicao_x" DECIMAL(10,2) NOT NULL,
    "posicao_y" DECIMAL(10,2) NOT NULL,
    
    -- Status atual
    "status" TEXT NOT NULL DEFAULT 'Não Testado' 
        CHECK ("status" IN ('Aprovado', 'Reprovado', 'Não Testado')),
    
    -- Foto principal do ponto
    "foto_id" UUID REFERENCES "files"("id"),
    
    -- Controle de auditoria
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" TEXT NOT NULL REFERENCES "User"("id"),
    "updated_by" TEXT NOT NULL REFERENCES "User"("id"),
    
    -- Soft delete (arquivamento)
    "archived" BOOLEAN DEFAULT FALSE,
    "archived_at" TIMESTAMP WITH TIME ZONE,
    "archived_by" TEXT REFERENCES "User"("id"),
    
    -- Constraints
    CONSTRAINT "unique_point_per_project" UNIQUE("project_id", "numero_ponto")
);

-- =============================================
-- 4. TESTES DE ANCORAGEM (MIGRADOS DO LOCALSTORAGE)
-- =============================================
CREATE TABLE IF NOT EXISTS "anchor_tests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "legacy_id" TEXT, -- Para migração do localStorage
    "anchor_point_id" UUID NOT NULL REFERENCES "anchor_points"("id") ON DELETE CASCADE,
    
    -- Dados do teste
    "resultado" TEXT NOT NULL CHECK ("resultado" IN ('Aprovado', 'Reprovado')),
    "carga" TEXT NOT NULL,
    "tempo" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    
    -- Fotos do teste
    "foto_teste_id" UUID REFERENCES "files"("id"),
    "foto_pronto_id" UUID REFERENCES "files"("id"),
    "data_foto_pronto" TIMESTAMP WITH TIME ZONE,
    
    -- Controle de auditoria
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" TEXT NOT NULL REFERENCES "User"("id")
);

-- =============================================
-- 5. SISTEMA DE AUTENTICAÇÃO AVANÇADO
-- =============================================
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "session_token" TEXT NOT NULL UNIQUE,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_accessed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ip_address" INET,
    "user_agent" TEXT,
    "is_active" BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "used_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. SISTEMA DE AUDITORIA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL CHECK ("operation" IN ('INSERT', 'UPDATE', 'DELETE', 'ARCHIVE')),
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[], -- Array dos campos alterados
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "session_id" UUID REFERENCES "user_sessions"("id"),
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. SISTEMA PWA DE SINCRONIZAÇÃO
-- =============================================
CREATE TABLE IF NOT EXISTS "sync_status" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entity_type" TEXT NOT NULL, -- 'anchor_point', 'anchor_test', 'file'
    "entity_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "device_id" TEXT,
    "sync_status" TEXT NOT NULL DEFAULT 'pending' 
        CHECK ("sync_status" IN ('pending', 'syncing', 'synced', 'error')),
    "last_sync_at" TIMESTAMP WITH TIME ZONE,
    "retry_count" INTEGER DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "sync_queue" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "device_id" TEXT,
    "operation_type" TEXT NOT NULL, -- 'create', 'update', 'delete'
    "entity_type" TEXT NOT NULL,
    "entity_data" JSONB NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "retry_count" INTEGER DEFAULT 0,
    "max_retries" INTEGER DEFAULT 3,
    "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "processed_at" TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 8. SISTEMA DE NOTIFICAÇÕES
-- =============================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('info', 'success', 'warning', 'error', 'sync', 'inspection')),
    "data" JSONB, -- Dados adicionais da notificação
    "read_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "expires_at" TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 9. CONFIGURAÇÕES DE USUÁRIO E EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") UNIQUE,
    "preferences" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") UNIQUE,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 10. LOGS DO SISTEMA
-- =============================================
CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "level" TEXT NOT NULL CHECK ("level" IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    "category" TEXT NOT NULL, -- 'auth', 'sync', 'export', 'ai', etc.
    "message" TEXT NOT NULL,
    "context" JSONB, -- Dados adicionais
    "user_id" TEXT REFERENCES "User"("id"),
    "session_id" UUID REFERENCES "user_sessions"("id"),
    "ip_address" INET,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 11. SISTEMA SAAS - PLANOS E ASSINATURAS
-- =============================================

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2),
    "max_users" INTEGER,
    "max_projects" INTEGER,
    "max_points" INTEGER,
    "max_storage_gb" INTEGER DEFAULT 10,
    "features" JSONB DEFAULT '{}',
    "active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assinaturas das empresas
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "plan_id" TEXT NOT NULL REFERENCES "subscription_plans"("id"),
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'past_due', 'canceled', 'trialing')),
    "stripe_customer_id" TEXT UNIQUE,
    "stripe_subscription_id" TEXT UNIQUE,
    "current_period_start" TIMESTAMP WITH TIME ZONE,
    "current_period_end" TIMESTAMP WITH TIME ZONE,
    "trial_end" TIMESTAMP WITH TIME ZONE,
    "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
    "canceled_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de pagamentos
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subscription_id" UUID NOT NULL REFERENCES "subscriptions"("id"),
    "stripe_invoice_id" TEXT UNIQUE,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'BRL',
    "status" TEXT NOT NULL CHECK ("status" IN ('paid', 'pending', 'failed', 'refunded')),
    "description" TEXT,
    "paid_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convites de usuários
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "email" TEXT,
    "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'user')),
    "invited_by" TEXT NOT NULL REFERENCES "User"("id"),
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "accepted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "max_uses" INTEGER DEFAULT 1,
    "current_uses" INTEGER DEFAULT 0,
    "is_reusable" BOOLEAN DEFAULT FALSE,
    "description" TEXT
);

-- Limites de uso por empresa
CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") UNIQUE,
    "users_count" INTEGER DEFAULT 0,
    "projects_count" INTEGER DEFAULT 0,
    "points_count" INTEGER DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) DEFAULT 0,
    "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de atividade SaaS
CREATE TABLE IF NOT EXISTS "saas_activity_log" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "user_id" TEXT REFERENCES "User"("id"),
    "activity_type" TEXT NOT NULL, -- 'signup', 'login', 'payment', 'upgrade', etc.
    "description" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões de usuários
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "permission" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "granted_by" TEXT REFERENCES "User"("id"),
    "granted_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "permission", "resource_type", "resource_id")
);

-- =============================================
-- 12. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices básicos
CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_users_active" ON "User"("active");

CREATE INDEX IF NOT EXISTS "idx_locations_company_id" ON "Location"("companyId");

CREATE INDEX IF NOT EXISTS "idx_projects_company_id" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "idx_projects_created_by" ON "Project"("createdByUserId");
CREATE INDEX IF NOT EXISTS "idx_projects_deleted" ON "Project"("deleted");

-- Índices para arquivos
CREATE INDEX IF NOT EXISTS "idx_files_company_id" ON "files"("company_id");
CREATE INDEX IF NOT EXISTS "idx_files_hash" ON "files"("file_hash");
CREATE INDEX IF NOT EXISTS "idx_files_created_at" ON "files"("created_at");
CREATE INDEX IF NOT EXISTS "idx_files_uploaded_by" ON "files"("uploaded_by");

-- Índices para pontos de ancoragem
CREATE INDEX IF NOT EXISTS "idx_anchor_points_project_id" ON "anchor_points"("project_id");
CREATE INDEX IF NOT EXISTS "idx_anchor_points_status" ON "anchor_points"("status");
CREATE INDEX IF NOT EXISTS "idx_anchor_points_archived" ON "anchor_points"("archived");
CREATE INDEX IF NOT EXISTS "idx_anchor_points_location" ON "anchor_points"("localizacao");
CREATE INDEX IF NOT EXISTS "idx_anchor_points_created_at" ON "anchor_points"("created_at");
CREATE INDEX IF NOT EXISTS "idx_anchor_points_legacy_id" ON "anchor_points"("legacy_id");

-- Índices para testes
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_point_id" ON "anchor_tests"("anchor_point_id");
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_resultado" ON "anchor_tests"("resultado");
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_created_at" ON "anchor_tests"("created_at");
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_tecnico" ON "anchor_tests"("tecnico");
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_legacy_id" ON "anchor_tests"("legacy_id");

-- Índices para sessões
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_token" ON "user_sessions"("session_token");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS "idx_audit_table_record" ON "audit_log"("table_name", "record_id");
CREATE INDEX IF NOT EXISTS "idx_audit_user_id" ON "audit_log"("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "audit_log"("created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_company_id" ON "audit_log"("company_id");

-- Índices para sincronização
CREATE INDEX IF NOT EXISTS "idx_sync_status_entity" ON "sync_status"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_sync_status_user" ON "sync_status"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sync_status_status" ON "sync_status"("sync_status");

CREATE INDEX IF NOT EXISTS "idx_sync_queue_user" ON "sync_queue"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sync_queue_status" ON "sync_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_sync_queue_priority" ON "sync_queue"("priority" DESC, "created_at");

-- Índices para notificações
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications"("created_at");
CREATE INDEX IF NOT EXISTS "idx_notifications_read_at" ON "notifications"("read_at");

-- Índices para logs
CREATE INDEX IF NOT EXISTS "idx_system_logs_level" ON "system_logs"("level");
CREATE INDEX IF NOT EXISTS "idx_system_logs_category" ON "system_logs"("category");
CREATE INDEX IF NOT EXISTS "idx_system_logs_created_at" ON "system_logs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_system_logs_user_id" ON "system_logs"("user_id");

-- Índices para SaaS
CREATE INDEX IF NOT EXISTS "idx_subscriptions_company" ON "subscriptions"("company_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_payments_subscription" ON "payments"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_token" ON "user_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_email" ON "user_invitations"("email");
CREATE INDEX IF NOT EXISTS "idx_usage_limits_company" ON "usage_limits"("company_id");
CREATE INDEX IF NOT EXISTS "idx_saas_activity_company" ON "saas_activity_log"("company_id");
CREATE INDEX IF NOT EXISTS "idx_user_permissions_user" ON "user_permissions"("user_id");

-- Índices compostos para relatórios
CREATE INDEX IF NOT EXISTS "idx_anchor_points_project_status" ON "anchor_points"("project_id", "status") WHERE NOT "archived";
CREATE INDEX IF NOT EXISTS "idx_anchor_tests_point_result" ON "anchor_tests"("anchor_point_id", "resultado");

-- =============================================
-- 13. FUNÇÕES AUXILIARES
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "user_sessions" 
    WHERE "expires_at" < NOW() OR NOT "is_active";
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar limites de uso
CREATE OR REPLACE FUNCTION update_usage_limits() RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores quando dados mudam
    INSERT INTO "usage_limits" ("company_id", "users_count", "projects_count", "points_count")
    SELECT 
        c.id,
        (SELECT COUNT(*) FROM "User" WHERE "companyId" = c.id AND "active" = true),
        (SELECT COUNT(*) FROM "Project" WHERE "companyId" = c.id AND "deleted" = false),
        (SELECT COUNT(*) FROM "anchor_points" ap 
         JOIN "Project" p ON ap.project_id = p.id 
         WHERE p."companyId" = c.id AND ap.archived = false)
    FROM "Company" c WHERE c.id = COALESCE(NEW."companyId", OLD."companyId")
    ON CONFLICT ("company_id") DO UPDATE SET
        "users_count" = EXCLUDED."users_count",
        "projects_count" = EXCLUDED."projects_count", 
        "points_count" = EXCLUDED."points_count",
        "last_updated" = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 14. TRIGGERS
-- =============================================

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON "Location"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON "Project"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON "files"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_anchor_points_updated_at
    BEFORE UPDATE ON "anchor_points"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_anchor_tests_updated_at
    BEFORE UPDATE ON "anchor_tests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sync_status_updated_at
    BEFORE UPDATE ON "sync_status"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON "user_preferences"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON "company_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON "subscription_plans"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON "subscriptions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Triggers para contadores de uso
CREATE TRIGGER update_usage_on_user_change 
    AFTER INSERT OR UPDATE OR DELETE ON "User" 
    FOR EACH ROW EXECUTE FUNCTION update_usage_limits();

CREATE TRIGGER update_usage_on_project_change 
    AFTER INSERT OR UPDATE OR DELETE ON "Project" 
    FOR EACH ROW EXECUTE FUNCTION update_usage_limits();

-- =============================================
-- 15. VIEWS ÚTEIS
-- =============================================

-- View de pontos com último teste
CREATE OR REPLACE VIEW anchor_points_with_last_test AS
SELECT 
    ap.id,
    ap.project_id,
    ap.numero_ponto,
    ap.localizacao,
    ap.tipo_equipamento,
    ap.numero_lacre,
    ap.status,
    ap.posicao_x,
    ap.posicao_y,
    ap.created_at,
    ap.updated_at,
    ap.created_by,
    ap.updated_by,
    ap.archived,
    
    -- Dados do último teste
    lt.id as last_test_id,
    lt.resultado as last_test_result,
    lt.carga as last_test_carga,
    lt.tempo as last_test_tempo,
    lt.tecnico as last_test_tecnico,
    lt.created_at as last_test_date,
    
    -- Arquivos relacionados
    pf.file_path as foto_ponto_path,
    ttf.file_path as foto_teste_path,
    tpf.file_path as foto_pronto_path

FROM anchor_points ap
LEFT JOIN LATERAL (
    SELECT * FROM anchor_tests at 
    WHERE at.anchor_point_id = ap.id 
    ORDER BY at.created_at DESC 
    LIMIT 1
) lt ON true
LEFT JOIN files pf ON ap.foto_id = pf.id
LEFT JOIN files ttf ON lt.foto_teste_id = ttf.id
LEFT JOIN files tpf ON lt.foto_pronto_id = tpf.id;

-- View de estatísticas por projeto
CREATE OR REPLACE VIEW project_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p."companyId" as company_id,
    
    COUNT(ap.id) as total_points,
    COUNT(ap.id) FILTER (WHERE ap.status = 'Aprovado') as approved_points,
    COUNT(ap.id) FILTER (WHERE ap.status = 'Reprovado') as rejected_points,
    COUNT(ap.id) FILTER (WHERE ap.status = 'Não Testado') as untested_points,
    COUNT(ap.id) FILTER (WHERE ap.archived = true) as archived_points,
    
    COUNT(DISTINCT at.id) as total_tests,
    MAX(at.created_at) as last_test_date,
    
    ROUND(
        COUNT(ap.id) FILTER (WHERE ap.status = 'Aprovado') * 100.0 / 
        NULLIF(COUNT(ap.id) FILTER (WHERE NOT ap.archived), 0), 
        2
    ) as approval_percentage

FROM "Project" p
LEFT JOIN anchor_points ap ON p.id = ap.project_id
LEFT JOIN anchor_tests at ON ap.id = at.anchor_point_id
GROUP BY p.id, p.name, p."companyId";

-- View de status SaaS por empresa
CREATE OR REPLACE VIEW company_saas_status AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c."subscriptionPlan",
    c."subscriptionStatus",
    c."isTrialActive",
    c."daysRemainingInTrial",
    
    sp.name as plan_name,
    sp.price_monthly,
    sp.max_users,
    sp.max_projects,
    sp.max_points,
    
    ul.users_count,
    ul.projects_count,
    ul.points_count,
    ul.storage_used_gb,
    
    s.status as subscription_status,
    s.current_period_end,
    s.stripe_customer_id

FROM "Company" c
LEFT JOIN "subscriptions" s ON c.id = s.company_id
LEFT JOIN "subscription_plans" sp ON s.plan_id = sp.id
LEFT JOIN "usage_limits" ul ON c.id = ul.company_id;

-- =============================================
-- 16. DADOS DE SEED INICIAIS
-- =============================================

-- Planos de assinatura padrão
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_yearly", "max_users", "max_projects", "max_points") VALUES
('plan_starter', 'Starter', 'Ideal para pequenas empresas', 15.00, 150.00, 3, 5, 100),
('plan_professional', 'Professional', 'Para empresas em crescimento', 45.00, 450.00, 10, 20, 500),
('plan_enterprise', 'Enterprise', 'Para grandes empresas', 100.00, 1000.00, -1, -1, -1) -- -1 = ilimitado
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "price_monthly" = EXCLUDED."price_monthly",
    "price_yearly" = EXCLUDED."price_yearly";

-- Empresa padrão
INSERT INTO "Company" (
    "id", 
    "name", 
    "subscriptionPlan", 
    "subscriptionStatus", 
    "trialStartDate", 
    "trialEndDate", 
    "isTrialActive", 
    "daysRemainingInTrial"
) VALUES 
('clx3i4a7x000008l4hy822g62', 'AnchorView Demo', 'trial', 'active', NOW() - INTERVAL '13 days', NOW() + INTERVAL '1 day', true, 1)
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "subscriptionPlan" = EXCLUDED."subscriptionPlan",
    "subscriptionStatus" = EXCLUDED."subscriptionStatus",
    "trialStartDate" = EXCLUDED."trialStartDate",
    "trialEndDate" = EXCLUDED."trialEndDate",
    "isTrialActive" = EXCLUDED."isTrialActive",
    "daysRemainingInTrial" = EXCLUDED."daysRemainingInTrial";

-- Usuário administrador padrão
INSERT INTO "User" ("id", "name", "email", "role", "companyId") VALUES 
('default-admin', 'Administrador', 'admin@anchorview.com', 'admin', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "email" = EXCLUDED."email",
    "role" = EXCLUDED."role";

-- Usuário normal para testes
INSERT INTO "User" ("id", "name", "email", "role", "companyId") VALUES 
('default-user', 'Usuário Teste', 'user@anchorview.com', 'user', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "email" = EXCLUDED."email",
    "role" = EXCLUDED."role";

-- Localizações padrão
INSERT INTO "Location" ("id", "name", "markerShape", "companyId") VALUES 
('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'),
('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'),
('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62'),
('loc-4', 'Área Interna', '+', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "markerShape" = EXCLUDED."markerShape";

-- Configurações padrão da empresa
INSERT INTO "company_settings" ("company_id", "settings") VALUES 
('clx3i4a7x000008l4hy822g62', '{
    "default_test_load": "1500 kg",
    "default_test_time": "5 minutos", 
    "default_responsible_engineer": "Engenheiro Responsável",
    "default_anchoring_device": "Olhal de Ancoragem",
    "inspection_frequency_months": 12,
    "notifications_enabled": true,
    "auto_backup_enabled": true,
    "export_formats": ["pdf", "excel", "word"],
    "max_file_size_mb": 10,
    "allowed_image_types": ["jpg", "jpeg", "png", "webp"]
}')
ON CONFLICT ("company_id") DO UPDATE SET 
    "settings" = EXCLUDED."settings";

-- Preferências padrão do administrador
INSERT INTO "user_preferences" ("user_id", "preferences") VALUES 
('default-admin', '{
    "theme": "light",
    "language": "pt-BR",
    "notifications": {
        "email": true,
        "push": true,
        "inspection_reminders": true,
        "sync_status": true
    },
    "default_map_zoom": 1.0,
    "auto_save": true,
    "photo_quality": "high"
}')
ON CONFLICT ("user_id") DO UPDATE SET 
    "preferences" = EXCLUDED."preferences";

-- Inicializar contadores de uso
INSERT INTO "usage_limits" ("company_id", "users_count", "projects_count", "points_count", "storage_used_gb")
SELECT 
    c.id,
    (SELECT COUNT(*) FROM "User" WHERE "companyId" = c.id AND "active" = true),
    0, -- projetos serão criados depois
    0, -- pontos serão criados depois
    0.0
FROM "Company" c
ON CONFLICT ("company_id") DO UPDATE SET
    "users_count" = EXCLUDED."users_count",
    "last_updated" = NOW();

-- =============================================
-- 17. VERIFICAÇÃO FINAL
-- =============================================

-- Listar todas as tabelas criadas
SELECT 'SUCESSO: Banco AnchorView com 23 tabelas criado!' AS status;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Contar tabelas
SELECT COUNT(*) as total_tables FROM pg_tables WHERE schemaname = 'public';

-- Contar registros das tabelas principais
SELECT 
    (SELECT COUNT(*) FROM "Company") as companies,
    (SELECT COUNT(*) FROM "User") as users,
    (SELECT COUNT(*) FROM "Location") as locations,
    (SELECT COUNT(*) FROM "Project") as projects,
    (SELECT COUNT(*) FROM "anchor_points") as anchor_points,
    (SELECT COUNT(*) FROM "anchor_tests") as anchor_tests,
    (SELECT COUNT(*) FROM "subscription_plans") as subscription_plans,
    (SELECT COUNT(*) FROM "subscriptions") as subscriptions,
    (SELECT COUNT(*) FROM "usage_limits") as usage_limits;

-- =============================================
-- SCRIPT COMPLETO COM 23 TABELAS - FIM
-- =============================================