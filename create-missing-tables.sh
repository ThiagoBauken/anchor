#!/bin/bash

# =============================================
# CRIAR TABELAS FALTANTES - ANCHORVIEW SAAS
# =============================================

echo "🔧 Criando tabelas SaaS faltantes no PostgreSQL..."
echo "Host: 185.215.165.19:8002"
echo "Database: privado"
echo ""

# Definir credenciais
export PGPASSWORD="privado12!"

# Executar SQL para criar todas as tabelas SaaS
psql -U privado -h 185.215.165.19 -p 8002 -d privado << 'EOF'

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to User table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') THEN
        ALTER TABLE "User" ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN
        ALTER TABLE "User" ADD COLUMN password VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'active') THEN
        ALTER TABLE "User" ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 1. SUBSCRIPTION PLANS
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

-- 2. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "plan_id" TEXT NOT NULL REFERENCES "subscription_plans"("id"),
    "status" TEXT NOT NULL DEFAULT 'trialing' CHECK ("status" IN ('active', 'past_due', 'canceled', 'trialing')),
    "stripe_customer_id" TEXT UNIQUE,
    "stripe_subscription_id" TEXT UNIQUE,
    "current_period_start" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "current_period_end" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    "trial_end" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
    "canceled_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PAYMENTS
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

-- 4. USER INVITATIONS
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

-- 5. USAGE LIMITS
CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") UNIQUE,
    "users_count" INTEGER DEFAULT 0,
    "projects_count" INTEGER DEFAULT 0,
    "points_count" INTEGER DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) DEFAULT 0,
    "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SAAS ACTIVITY LOG
CREATE TABLE IF NOT EXISTS "saas_activity_log" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "user_id" TEXT REFERENCES "User"("id"),
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USER PERMISSIONS
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

-- INSERT INITIAL DATA
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_yearly", "max_users", "max_projects", "max_points") VALUES
('plan_starter', 'Starter', 'Ideal para pequenas empresas', 15.00, 150.00, 3, 5, 100),
('plan_professional', 'Professional', 'Para empresas em crescimento', 45.00, 450.00, 10, 20, 500),
('plan_enterprise', 'Enterprise', 'Para grandes empresas', 100.00, 1000.00, -1, -1, -1)
ON CONFLICT ("id") DO UPDATE SET 
    "name" = EXCLUDED."name",
    "price_monthly" = EXCLUDED."price_monthly",
    "price_yearly" = EXCLUDED."price_yearly";

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS "idx_subscriptions_company" ON "subscriptions"("company_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_payments_subscription" ON "payments"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_token" ON "user_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_usage_limits_company" ON "usage_limits"("company_id");
CREATE INDEX IF NOT EXISTS "idx_user_permissions_user" ON "user_permissions"("user_id");

-- Create subscription and usage limit for existing companies
INSERT INTO "subscriptions" ("company_id", "plan_id", "status", "trial_end")
SELECT id, 'plan_professional', 'trialing', (NOW() + INTERVAL '14 days')
FROM "Company"
ON CONFLICT DO NOTHING;

INSERT INTO "usage_limits" ("company_id", "users_count", "projects_count")
SELECT 
    c.id,
    (SELECT COUNT(*) FROM "User" WHERE "companyId" = c.id),
    (SELECT COUNT(*) FROM "Project" WHERE "companyId" = c.id)
FROM "Company" c
ON CONFLICT ("company_id") DO NOTHING;

-- Success message
SELECT '✅ Todas as tabelas SaaS foram criadas com sucesso!' AS result;
SELECT '📊 Planos disponíveis:' AS info;
SELECT "id", "name", "price_monthly" FROM "subscription_plans";

EOF

echo ""
echo "✅ Tabelas criadas com sucesso!"
echo "🔄 Execute agora: npx prisma generate && npx prisma db pull"