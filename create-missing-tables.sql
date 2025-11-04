-- Create SaaS tables that are missing in PostgreSQL

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SubscriptionPlan table
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

-- Subscription table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Payment table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subscription_id" UUID NOT NULL,
    "stripe_invoice_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- UserInvitation table
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "is_reusable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

-- UsageLimit table
CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL,
    "users_count" INTEGER NOT NULL DEFAULT 0,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "points_count" INTEGER NOT NULL DEFAULT 0,
    "storage_used_gb" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- UserPermission table
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- SaasActivityLog table
CREATE TABLE IF NOT EXISTS "saas_activity_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_activity_log_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_invoice_id_key" ON "payments"("stripe_invoice_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_invitations_token_key" ON "user_invitations"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "usage_limits_company_id_key" ON "usage_limits"("company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_user_id_permission_resource_type_resource_id_key" ON "user_permissions"("user_id", "permission", "resource_type", "resource_id");

-- Insert default subscription plans for testing
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "max_users", "max_projects", "max_points")
VALUES ('trial', 'Trial', 'Plano trial gratuito por 14 dias', 0.00, 5, 3, 100)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "max_users", "max_projects", "max_points")
VALUES ('basic', 'Básico', 'Plano básico para pequenas equipes', 29.90, 10, 5, 500)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "max_users", "max_projects", "max_points")
VALUES ('pro', 'Profissional', 'Plano profissional para empresas', 79.90, 50, 20, 2000)
ON CONFLICT ("id") DO NOTHING;