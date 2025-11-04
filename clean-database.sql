-- Script para limpar completamente o banco de dados

-- Desabilita verificação de foreign keys temporariamente
SET session_replication_role = 'replica';

-- Remove todas as tabelas existentes
DROP TABLE IF EXISTS "anchor_tests" CASCADE;
DROP TABLE IF EXISTS "anchor_points" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
DROP TABLE IF EXISTS "sync_queue" CASCADE;
DROP TABLE IF EXISTS "user_sessions" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "subscription_plans" CASCADE;
DROP TABLE IF EXISTS "user_invitations" CASCADE;
DROP TABLE IF EXISTS "usage_limits" CASCADE;
DROP TABLE IF EXISTS "password_resets" CASCADE;
DROP TABLE IF EXISTS "audit_log" CASCADE;
DROP TABLE IF EXISTS "sync_status" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "user_preferences" CASCADE;
DROP TABLE IF EXISTS "company_settings" CASCADE;
DROP TABLE IF EXISTS "system_logs" CASCADE;
DROP TABLE IF EXISTS "saas_activity_log" CASCADE;
DROP TABLE IF EXISTS "user_permissions" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "Location" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Remove tipos ENUM se existirem
DROP TYPE IF EXISTS "SubscriptionStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;

-- Remove todas as funções
DROP FUNCTION IF EXISTS get_anchor_point_stats CASCADE;
DROP FUNCTION IF EXISTS get_anchor_points_needing_inspection CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_sync_queue CASCADE;
DROP FUNCTION IF EXISTS get_company_subscription_status CASCADE;
DROP FUNCTION IF EXISTS update_anchor_point_status_from_tests CASCADE;
DROP FUNCTION IF EXISTS check_company_limits CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions CASCADE;
DROP FUNCTION IF EXISTS trigger_update_anchor_point_status CASCADE;
DROP FUNCTION IF EXISTS update_usage_limits CASCADE;
DROP FUNCTION IF EXISTS get_detailed_anchor_point_stats CASCADE;
DROP FUNCTION IF EXISTS get_company_dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS generate_invitation_token CASCADE;
DROP FUNCTION IF EXISTS accept_user_invitation CASCADE;
DROP FUNCTION IF EXISTS log_audit_changes CASCADE;
DROP FUNCTION IF EXISTS log_system_activity CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_password_resets CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_notifications CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_audit_logs CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_system_logs CASCADE;

-- Remove views se existirem
DROP VIEW IF EXISTS anchor_points_with_last_test CASCADE;
DROP VIEW IF EXISTS project_statistics CASCADE;
DROP VIEW IF EXISTS company_saas_status CASCADE;

-- Reabilita verificação de foreign keys
SET session_replication_role = 'origin';

-- Confirma limpeza
SELECT 'Banco de dados limpo com sucesso!' as status;