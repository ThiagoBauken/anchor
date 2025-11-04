-- =============================================
-- EXTENSÃO SAAS MULTI-TENANT PARA ANCHORVIEW
-- =============================================

-- 1. PLANOS DE ASSINATURA
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

-- 2. ASSINATURAS DAS EMPRESAS
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

-- 3. HISTÓRICO DE PAGAMENTOS
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

-- 4. CONVITES DE USUÁRIOS
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'user')),
    "invited_by" TEXT NOT NULL REFERENCES "User"("id"),
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "accepted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LIMITES DE USO POR EMPRESA
CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") UNIQUE,
    "users_count" INTEGER DEFAULT 0,
    "projects_count" INTEGER DEFAULT 0,
    "points_count" INTEGER DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) DEFAULT 0,
    "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LOGS DE ATIVIDADE SAAS
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

-- =============================================
-- DADOS INICIAIS DOS PLANOS
-- =============================================

INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_yearly", "max_users", "max_projects", "max_points") VALUES
('plan_starter', 'Starter', 'Ideal para pequenas empresas', 15.00, 150.00, 3, 5, 100),
('plan_professional', 'Professional', 'Para empresas em crescimento', 45.00, 450.00, 10, 20, 500),
('plan_enterprise', 'Enterprise', 'Para grandes empresas', 100.00, 1000.00, -1, -1, -1) -- -1 = ilimitado
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "price_monthly" = EXCLUDED."price_monthly";

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS "idx_subscriptions_company" ON "subscriptions"("company_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_payments_subscription" ON "payments"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_token" ON "user_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_email" ON "user_invitations"("email");
CREATE INDEX IF NOT EXISTS "idx_usage_limits_company" ON "usage_limits"("company_id");
CREATE INDEX IF NOT EXISTS "idx_saas_activity_company" ON "saas_activity_log"("company_id");

-- =============================================
-- TRIGGERS PARA ATUALIZAR LIMITES DE USO
-- =============================================

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

-- Aplicar triggers
CREATE TRIGGER update_usage_on_user_change 
    AFTER INSERT OR UPDATE OR DELETE ON "User" 
    FOR EACH ROW EXECUTE FUNCTION update_usage_limits();

CREATE TRIGGER update_usage_on_project_change 
    AFTER INSERT OR UPDATE OR DELETE ON "Project" 
    FOR EACH ROW EXECUTE FUNCTION update_usage_limits();