#!/bin/bash
# VERIFICAÇÃO, CORREÇÃO E POPULAÇÃO DE TODAS AS TABELAS COM DADOS DEMO

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "🔍 VERIFICANDO, CORRIGINDO E POPULANDO TODAS AS TABELAS..."

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FUNÇÃO PARA VERIFICAR SE TABELA EXISTE
-- =============================================
CREATE OR REPLACE FUNCTION table_exists(table_name_param TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param AND table_schema = 'public'
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNÇÃO PARA VERIFICAR SE COLUNA EXISTE
-- =============================================
CREATE OR REPLACE FUNCTION column_exists(table_name_param TEXT, column_name_param TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = table_name_param 
          AND column_name = column_name_param 
          AND table_schema = 'public'
    );
END;
$$ LANGUAGE plpgsql;

\echo '=== VERIFICAÇÃO E CORREÇÃO DE TODAS AS TABELAS ==='

-- =============================================
-- 1. COMPANY
-- =============================================
\echo '1. COMPANY...'
DO $$ 
BEGIN
    IF NOT table_exists('Company') THEN
        CREATE TABLE "Company" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );
    END IF;
END $$;

-- =============================================
-- 2. USER  
-- =============================================
\echo '2. USER...'
DO $$ 
BEGIN
    IF NOT table_exists('User') THEN
        CREATE TABLE "User" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            password TEXT,
            password_hash TEXT,
            role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP,
            "companyId" TEXT NOT NULL REFERENCES "Company"(id)
        );
    END IF;
    
    IF NOT column_exists('User', 'password_hash') THEN
        ALTER TABLE "User" ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- =============================================
-- 3. LOCATION
-- =============================================
\echo '3. LOCATION...'
DO $$ 
BEGIN
    IF NOT table_exists('Location') THEN
        CREATE TABLE "Location" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            "markerShape" TEXT DEFAULT 'circle',
            "companyId" TEXT NOT NULL REFERENCES "Company"(id)
        );
    END IF;
END $$;

-- =============================================
-- 4. PROJECT
-- =============================================
\echo '4. PROJECT...'
DO $$ 
BEGIN
    IF NOT table_exists('Project') THEN
        CREATE TABLE "Project" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            "floorPlanImages" TEXT[] DEFAULT '{}',
            deleted BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "companyId" TEXT NOT NULL REFERENCES "Company"(id),
            "createdByUserId" TEXT NOT NULL REFERENCES "User"(id),
            "cargaDeTestePadrao" TEXT,
            "tempoDeTestePadrao" TEXT,
            "engenheiroResponsavelPadrao" TEXT
        );
    END IF;
END $$;

-- =============================================
-- 5. ANCHOR_POINTS
-- =============================================
\echo '5. ANCHOR_POINTS...'
DO $$ 
BEGIN
    IF NOT table_exists('anchor_points') THEN
        CREATE TABLE anchor_points (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES "Project"(id),
            numero_ponto TEXT NOT NULL,
            localizacao TEXT NOT NULL,
            foto TEXT,
            "numeroLacre" TEXT,
            tipo_equipamento TEXT,
            data_instalacao TEXT,
            frequencia_inspecao_meses INTEGER,
            observacoes TEXT,
            posicao_x FLOAT NOT NULL,
            posicao_y FLOAT NOT NULL,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Não Testado',
            created_by_user_id TEXT REFERENCES "User"(id),
            last_modified_by_user_id TEXT REFERENCES "User"(id),
            archived BOOLEAN DEFAULT false,
            archived_at TIMESTAMP
        );
    END IF;
    
    IF NOT column_exists('anchor_points', 'foto') THEN
        ALTER TABLE anchor_points ADD COLUMN foto TEXT;
    END IF;
END $$;

-- =============================================
-- 6. ANCHOR_TESTS
-- =============================================
\echo '6. ANCHOR_TESTS...'
DO $$ 
BEGIN
    IF NOT table_exists('anchor_tests') THEN
        CREATE TABLE anchor_tests (
            id TEXT PRIMARY KEY,
            ponto_id TEXT NOT NULL REFERENCES anchor_points(id),
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resultado TEXT NOT NULL,
            carga TEXT NOT NULL,
            tempo TEXT NOT NULL,
            tecnico TEXT NOT NULL,
            observacoes TEXT,
            foto_teste TEXT,
            foto_pronto TEXT,
            data_foto_pronto TEXT
        );
    END IF;
    
    IF NOT column_exists('anchor_tests', 'ponto_id') THEN
        ALTER TABLE anchor_tests ADD COLUMN ponto_id TEXT REFERENCES anchor_points(id);
    END IF;
    IF NOT column_exists('anchor_tests', 'foto_teste') THEN
        ALTER TABLE anchor_tests ADD COLUMN foto_teste TEXT;
    END IF;
    IF NOT column_exists('anchor_tests', 'foto_pronto') THEN
        ALTER TABLE anchor_tests ADD COLUMN foto_pronto TEXT;
    END IF;
END $$;

-- =============================================
-- CRIAR/CORRIGIR TABELAS EXTRAS (se vazias, recriar)
-- =============================================

-- AUDIT_LOG
\echo '7. AUDIT_LOG...'
DO $$ 
BEGIN
    IF table_exists('audit_log') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_log') = 0 THEN
        DROP TABLE audit_log CASCADE;
    END IF;
    
    IF NOT table_exists('audit_log') THEN
        CREATE TABLE audit_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            action TEXT NOT NULL,
            table_name TEXT,
            record_id TEXT,
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- COMPANY_SETTINGS
\echo '8. COMPANY_SETTINGS...'
DO $$ 
BEGIN
    IF table_exists('company_settings') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'company_settings') = 0 THEN
        DROP TABLE company_settings CASCADE;
    END IF;
    
    IF NOT table_exists('company_settings') THEN
        CREATE TABLE company_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
            logo_url TEXT,
            primary_color TEXT DEFAULT '#6941DE',
            secondary_color TEXT DEFAULT '#4F46E5',
            timezone TEXT DEFAULT 'America/Sao_Paulo',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            language TEXT DEFAULT 'pt-BR',
            currency TEXT DEFAULT 'BRL',
            auto_backup BOOLEAN DEFAULT true,
            notification_email TEXT,
            company_address TEXT,
            company_phone TEXT,
            company_website TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- NOTIFICATIONS
\echo '9. NOTIFICATIONS...'
DO $$ 
BEGIN
    IF table_exists('notifications') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications') = 0 THEN
        DROP TABLE notifications CASCADE;
    END IF;
    
    IF NOT table_exists('notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'maintenance')),
            category TEXT DEFAULT 'general',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            action_url TEXT,
            action_label TEXT,
            priority INTEGER DEFAULT 1,
            read_at TIMESTAMP,
            dismissed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
        );
    END IF;
END $$;

-- PASSWORD_RESETS
\echo '10. PASSWORD_RESETS...'
DO $$ 
BEGIN
    IF table_exists('password_resets') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'password_resets') = 0 THEN
        DROP TABLE password_resets CASCADE;
    END IF;
    
    IF NOT table_exists('password_resets') THEN
        CREATE TABLE password_resets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES "User"(id),
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
            used_at TIMESTAMP,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- SYNC_STATUS
\echo '11. SYNC_STATUS...'
DO $$ 
BEGIN
    IF table_exists('sync_status') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'sync_status') = 0 THEN
        DROP TABLE sync_status CASCADE;
    END IF;
    
    IF NOT table_exists('sync_status') THEN
        CREATE TABLE sync_status (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            operation_type TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
            total_records INTEGER DEFAULT 0,
            processed_records INTEGER DEFAULT 0,
            failed_records INTEGER DEFAULT 0,
            success_records INTEGER DEFAULT 0,
            error_details JSONB DEFAULT '{}',
            progress_percentage DECIMAL(5,2) DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            last_update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- SYSTEM_LOGS
\echo '12. SYSTEM_LOGS...'
DO $$ 
BEGIN
    IF table_exists('system_logs') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'system_logs') = 0 THEN
        DROP TABLE system_logs CASCADE;
    END IF;
    
    IF NOT table_exists('system_logs') THEN
        CREATE TABLE system_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
            category TEXT DEFAULT 'general',
            message TEXT NOT NULL,
            context JSONB DEFAULT '{}',
            user_id TEXT REFERENCES "User"(id),
            company_id TEXT REFERENCES "Company"(id),
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- USER_PREFERENCES
\echo '13. USER_PREFERENCES...'
DO $$ 
BEGIN
    IF table_exists('user_preferences') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_preferences') = 0 THEN
        DROP TABLE user_preferences CASCADE;
    END IF;
    
    IF NOT table_exists('user_preferences') THEN
        CREATE TABLE user_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id),
            theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
            language TEXT DEFAULT 'pt-BR',
            timezone TEXT DEFAULT 'America/Sao_Paulo',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            notifications_enabled BOOLEAN DEFAULT true,
            email_notifications BOOLEAN DEFAULT true,
            push_notifications BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- =============================================
-- INSERIR DADOS DEMO EM TODAS AS TABELAS
-- =============================================
\echo '=== INSERINDO DADOS DEMO EM TODAS AS TABELAS ==='

-- 1. COMPANY
INSERT INTO "Company" (id, name) 
VALUES 
    ('demo-company', 'Empresa Demo AnchorView'),
    ('company-2', 'Segunda Empresa')
ON CONFLICT (id) DO NOTHING;

-- 2. USER
INSERT INTO "User" (id, name, email, password_hash, role, "companyId") 
VALUES 
    ('demo-admin', 'Admin Demo', 'admin@demo.com', 'hashed_password_123', 'admin', 'demo-company'),
    ('demo-user', 'User Demo', 'user@demo.com', 'hashed_password_456', 'user', 'demo-company'),
    ('user-2', 'Outro Usuário', 'outro@demo.com', 'hashed_password_789', 'user', 'company-2')
ON CONFLICT (id) DO NOTHING;

-- 3. LOCATION
INSERT INTO "Location" (id, name, "markerShape", "companyId")
VALUES 
    ('loc-1', 'Sede Principal', 'circle', 'demo-company'),
    ('loc-2', 'Filial Norte', 'square', 'demo-company'),
    ('loc-3', 'Obra Site A', 'x', 'demo-company'),
    ('loc-4', 'Escritório', 'circle', 'company-2')
ON CONFLICT (id) DO NOTHING;

-- 4. PROJECT
INSERT INTO "Project" (id, name, "companyId", "createdByUserId", "cargaDeTestePadrao", "tempoDeTestePadrao", "engenheiroResponsavelPadrao")
VALUES 
    ('proj-1', 'Projeto Demo Ancoragem', 'demo-company', 'demo-admin', '2000 kg', '5 min', 'Eng. João Silva'),
    ('proj-2', 'Torre de Telecomunicações', 'demo-company', 'demo-admin', '1500 kg', '3 min', 'Eng. Maria Santos'),
    ('proj-3', 'Edifício Comercial', 'company-2', 'user-2', '2500 kg', '7 min', 'Eng. Pedro Costa')
ON CONFLICT (id) DO NOTHING;

-- 5. ANCHOR_POINTS
INSERT INTO anchor_points (id, project_id, numero_ponto, localizacao, foto, posicao_x, posicao_y, status, created_by_user_id)
VALUES 
    ('point-1', 'proj-1', 'AP-001', 'Parede Norte - Andar 1', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', 100.5, 200.3, 'Não Testado', 'demo-admin'),
    ('point-2', 'proj-1', 'AP-002', 'Parede Sul - Andar 1', NULL, 150.2, 180.7, 'Aprovado', 'demo-admin'),
    ('point-3', 'proj-1', 'AP-003', 'Parede Leste - Andar 2', NULL, 120.8, 220.1, 'Reprovado', 'demo-user'),
    ('point-4', 'proj-2', 'AP-004', 'Base da Torre', NULL, 200.0, 300.0, 'Não Testado', 'demo-admin')
ON CONFLICT (id) DO NOTHING;

-- 6. ANCHOR_TESTS
INSERT INTO anchor_tests (id, ponto_id, resultado, carga, tempo, tecnico, observacoes, foto_teste, foto_pronto)
VALUES 
    ('test-1', 'point-2', 'Aprovado', '2000 kg', '5 min', 'Técnico José', 'Teste realizado conforme norma', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg=='),
    ('test-2', 'point-3', 'Reprovado', '1800 kg', '4 min', 'Técnico Maria', 'Falha na ancoragem - refazer', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. AUDIT_LOG
INSERT INTO audit_log (company_id, user_id, action, table_name, record_id, new_values)
VALUES 
    ('demo-company', 'demo-admin', 'create', 'anchor_points', 'point-1', '{"numero_ponto": "AP-001", "localizacao": "Parede Norte"}'),
    ('demo-company', 'demo-user', 'update', 'anchor_points', 'point-3', '{"status": "Reprovado"}'),
    ('demo-company', 'demo-admin', 'login', NULL, NULL, '{"ip": "192.168.1.100"}')
ON CONFLICT DO NOTHING;

-- 8. COMPANY_SETTINGS
INSERT INTO company_settings (company_id, notification_email, company_address, company_phone)
VALUES 
    ('demo-company', 'admin@demo.com', 'Rua das Flores, 123 - São Paulo, SP', '(11) 99999-9999'),
    ('company-2', 'contato@empresa2.com', 'Av. Paulista, 456 - São Paulo, SP', '(11) 88888-8888')
ON CONFLICT (company_id) DO NOTHING;

-- 9. NOTIFICATIONS
INSERT INTO notifications (company_id, user_id, type, category, title, message, priority)
VALUES 
    ('demo-company', NULL, 'info', 'system', 'Bem-vindo ao AnchorView!', 'Sistema configurado e pronto para uso.', 2),
    ('demo-company', 'demo-admin', 'warning', 'sync', 'Sincronização Pendente', 'Existem 3 pontos não sincronizados.', 3),
    ('demo-company', 'demo-user', 'success', 'test', 'Teste Aprovado', 'Ponto AP-002 passou no teste de carga.', 1),
    ('demo-company', NULL, 'error', 'system', 'Falha na Conexão', 'Erro temporário de conexão com o servidor.', 4)
ON CONFLICT DO NOTHING;

-- 10. PASSWORD_RESETS (expired examples)
INSERT INTO password_resets (user_id, email, token, expires_at, used_at)
VALUES 
    ('demo-admin', 'admin@demo.com', 'reset_token_123_expired', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL),
    ('demo-user', 'user@demo.com', 'reset_token_456_used', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- 11. SYNC_STATUS
INSERT INTO sync_status (company_id, user_id, operation_type, status, total_records, processed_records, success_records, progress_percentage)
VALUES 
    ('demo-company', 'demo-admin', 'full_sync', 'completed', 10, 10, 8, 100.00),
    ('demo-company', 'demo-user', 'incremental', 'running', 5, 3, 3, 60.00),
    ('demo-company', 'demo-admin', 'photos', 'failed', 12, 5, 2, 41.67)
ON CONFLICT DO NOTHING;

-- 12. SYSTEM_LOGS
INSERT INTO system_logs (level, category, message, context, user_id, company_id)
VALUES 
    ('info', 'auth', 'User logged in successfully', '{"ip": "192.168.1.100", "browser": "Chrome"}', 'demo-admin', 'demo-company'),
    ('error', 'sync', 'Sync operation failed', '{"operation": "photos", "error": "network timeout"}', 'demo-user', 'demo-company'),
    ('warn', 'api', 'Rate limit exceeded', '{"endpoint": "/api/sync", "limit": 100}', NULL, 'demo-company'),
    ('debug', 'ui', 'Component rendered', '{"component": "AnchorPoint", "props": {"id": "point-1"}}', 'demo-admin', 'demo-company')
ON CONFLICT DO NOTHING;

-- 13. USER_PREFERENCES
INSERT INTO user_preferences (user_id, theme, language, notifications_enabled)
VALUES 
    ('demo-admin', 'dark', 'pt-BR', true),
    ('demo-user', 'light', 'pt-BR', true),
    ('user-2', 'auto', 'en-US', false)
ON CONFLICT (user_id) DO NOTHING;

-- 14. USER_INVITATIONS (se existir)
DO $$
BEGIN
    IF table_exists('user_invitations') THEN
        INSERT INTO user_invitations (company_id, email, role, invited_by, token, expires_at, description)
        VALUES 
            ('demo-company', 'novotecnico@demo.com', 'user', 'demo-admin', 'invite_token_123', CURRENT_TIMESTAMP + INTERVAL '7 days', 'Convite para novo técnico'),
            ('demo-company', NULL, 'user', 'demo-admin', 'invite_token_456', CURRENT_TIMESTAMP + INTERVAL '30 days', 'Link reutilizável para funcionários')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================
-- VERIFICAÇÃO FINAL COM CONTAGEM DE REGISTROS
-- =============================================
\echo '=== VERIFICAÇÃO FINAL - TABELAS E DADOS ==='

SELECT 
    t.table_name,
    COALESCE(c.colunas, 0) as colunas,
    COALESCE(r.registros, 0) as registros,
    CASE 
        WHEN COALESCE(c.colunas, 0) = 0 THEN '❌ SEM COLUNAS'
        WHEN COALESCE(r.registros, 0) = 0 THEN '⚠️ SEM DADOS'
        ELSE '✅ OK'
    END as status
FROM information_schema.tables t
LEFT JOIN (
    SELECT table_name, COUNT(*) as colunas
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
) c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT 'Company' as table_name, COUNT(*) as registros FROM "Company"
    UNION ALL SELECT 'User', COUNT(*) FROM "User"
    UNION ALL SELECT 'Location', COUNT(*) FROM "Location"
    UNION ALL SELECT 'Project', COUNT(*) FROM "Project"
    UNION ALL SELECT 'anchor_points', COUNT(*) FROM anchor_points
    UNION ALL SELECT 'anchor_tests', COUNT(*) FROM anchor_tests
    UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log
    UNION ALL SELECT 'company_settings', COUNT(*) FROM company_settings
    UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
    UNION ALL SELECT 'password_resets', COUNT(*) FROM password_resets
    UNION ALL SELECT 'sync_status', COUNT(*) FROM sync_status
    UNION ALL SELECT 'system_logs', COUNT(*) FROM system_logs
    UNION ALL SELECT 'user_preferences', COUNT(*) FROM user_preferences
) r ON t.table_name = r.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

\echo ''
\echo '🎉 TODAS AS TABELAS ESTRUTURADAS E POPULADAS COM DADOS DEMO!'
\echo '✅ Agora todas as tabelas têm registros ao invés de "no records found"'

EOF