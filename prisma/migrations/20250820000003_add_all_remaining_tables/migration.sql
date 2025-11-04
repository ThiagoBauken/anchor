-- Migration: Add all remaining tables for complete AnchorView database
-- This migration adds the remaining 13 tables to complete the 23-table system

-- 1. User Invitations Table
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

-- 2. Usage Limits Table
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

-- 3. Password Resets Table
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- 4. Audit Log Table
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

-- 5. Sync Status Table
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

-- 6. Notifications Table
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

-- 7. User Preferences Table
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- 8. Company Settings Table
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- 9. System Logs Table
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

-- 10. SaaS Activity Log Table
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

-- 11. User Permissions Table
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

-- Add Unique Constraints
CREATE UNIQUE INDEX "user_invitations_token_key" ON "user_invitations"("token");
CREATE UNIQUE INDEX "usage_limits_company_id_key" ON "usage_limits"("company_id");
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- Add Foreign Key Constraints
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

-- Add Performance Indexes for new tables
CREATE INDEX "user_invitations_company_id_idx" ON "user_invitations"("company_id");
CREATE INDEX "user_invitations_email_idx" ON "user_invitations"("email");
CREATE INDEX "user_invitations_expires_at_idx" ON "user_invitations"("expires_at");

CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

CREATE INDEX "audit_log_table_name_idx" ON "audit_log"("table_name");
CREATE INDEX "audit_log_record_id_idx" ON "audit_log"("record_id");
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");
CREATE INDEX "audit_log_operation_idx" ON "audit_log"("operation");

CREATE INDEX "sync_status_entity_type_idx" ON "sync_status"("entity_type");
CREATE INDEX "sync_status_user_id_idx" ON "sync_status"("user_id");
CREATE INDEX "sync_status_sync_status_idx" ON "sync_status"("sync_status");
CREATE INDEX "sync_status_device_id_idx" ON "sync_status"("device_id");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");
CREATE INDEX "system_logs_category_idx" ON "system_logs"("category");
CREATE INDEX "system_logs_timestamp_idx" ON "system_logs"("timestamp");
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

CREATE INDEX "saas_activity_log_company_id_idx" ON "saas_activity_log"("company_id");
CREATE INDEX "saas_activity_log_user_id_idx" ON "saas_activity_log"("user_id");
CREATE INDEX "saas_activity_log_activity_type_idx" ON "saas_activity_log"("activity_type");
CREATE INDEX "saas_activity_log_timestamp_idx" ON "saas_activity_log"("timestamp");

CREATE INDEX "user_permissions_user_id_idx" ON "user_permissions"("user_id");
CREATE INDEX "user_permissions_permission_idx" ON "user_permissions"("permission");
CREATE INDEX "user_permissions_resource_type_idx" ON "user_permissions"("resource_type");

-- Composite indexes for common queries
CREATE INDEX "audit_log_table_record_idx" ON "audit_log"("table_name", "record_id");
CREATE INDEX "sync_status_entity_user_idx" ON "sync_status"("entity_type", "user_id");
CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "user_permissions_user_resource_idx" ON "user_permissions"("user_id", "resource_type", "resource_id");