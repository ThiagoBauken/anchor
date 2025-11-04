#!/bin/bash
# CRIAR TUDO DO ZERO - TABELAS + COLUNAS + DADOS

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "🚀 CRIANDO TUDO DO ZERO - TABELAS, COLUNAS E DADOS..."

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- Extensão necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- LIMPAR TUDO E COMEÇAR DO ZERO (CUIDADO!)
DROP TABLE IF EXISTS anchor_tests CASCADE;
DROP TABLE IF EXISTS anchor_points CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "Location" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE;

-- Limpar tabelas extras vazias
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS sync_status CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

\echo '🧹 TODAS AS TABELAS REMOVIDAS - COMEÇANDO LIMPO'

-- =============================================
-- 1. COMPANY (BASE DO MULTI-TENANT)
-- =============================================
CREATE TABLE "Company" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

\echo '✅ 1. COMPANY criada'

-- =============================================
-- 2. USER (COM TODAS AS COLUNAS)
-- =============================================
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

\echo '✅ 2. USER criada com todas as colunas'

-- =============================================
-- 3. LOCATION
-- =============================================
CREATE TABLE "Location" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "markerShape" TEXT DEFAULT 'circle',
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

\echo '✅ 3. LOCATION criada'

-- =============================================
-- 4. PROJECT (COMPLETO)
-- =============================================
CREATE TABLE "Project" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "floorPlanImages" TEXT[] DEFAULT '{}',
    deleted BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id),
    "createdByUserId" TEXT NOT NULL REFERENCES "User"(id),
    
    -- Campos específicos do projeto
    "obraAddress" TEXT,
    "obraCEP" TEXT,
    "obraCNPJ" TEXT,
    "contratanteName" TEXT,
    "contratanteAddress" TEXT,
    "contratanteCEP" TEXT,
    "cnpjContratado" TEXT,
    contato TEXT,
    "valorContrato" TEXT,
    "dataInicio" TEXT,
    "dataTermino" TEXT,
    "responsavelTecnico" TEXT,
    "registroCREA" TEXT,
    "tituloProfissional" TEXT,
    "numeroART" TEXT,
    rnp TEXT,
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT,
    "dispositivoDeAncoragemPadrao" TEXT
);

\echo '✅ 4. PROJECT criada com todos os campos'

-- =============================================
-- 5. ANCHOR_POINTS (COM FOTO!)
-- =============================================
CREATE TABLE anchor_points (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES "Project"(id),
    numero_ponto TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    foto TEXT, -- COLUNA DE FOTO!
    
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

\echo '✅ 5. ANCHOR_POINTS criada COM COLUNA FOTO'

-- =============================================
-- 6. ANCHOR_TESTS (COM TODAS AS FOTOS!)
-- =============================================
CREATE TABLE anchor_tests (
    id TEXT PRIMARY KEY,
    ponto_id TEXT NOT NULL REFERENCES anchor_points(id), -- COLUNA PONTO_ID!
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    resultado TEXT NOT NULL,
    carga TEXT NOT NULL,
    tempo TEXT NOT NULL,
    tecnico TEXT NOT NULL,
    observacoes TEXT,
    
    foto_teste TEXT,  -- FOTO DO TESTE!
    foto_pronto TEXT, -- FOTO DO PONTO PRONTO!
    data_foto_pronto TEXT
);

\echo '✅ 6. ANCHOR_TESTS criada COM PONTO_ID E FOTOS'

-- =============================================
-- 7. TABELAS EXTRAS COMPLETAS
-- =============================================

-- AUDIT_LOG
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

-- COMPANY_SETTINGS
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

-- NOTIFICATIONS
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

-- PASSWORD_RESETS
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

-- SYNC_STATUS
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

-- SYSTEM_LOGS
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

-- USER_PREFERENCES
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

\echo '✅ 7. TODAS AS TABELAS EXTRAS criadas com colunas completas'

-- =============================================
-- INSERIR DADOS DEMO EM TODAS AS TABELAS
-- =============================================
\echo '📝 INSERINDO DADOS DEMO...'

-- COMPANY
INSERT INTO "Company" (id, name) VALUES 
    ('demo-company', 'Empresa Demo AnchorView'),
    ('company-2', 'Segunda Empresa');

-- USER
INSERT INTO "User" (id, name, email, password_hash, role, "companyId") VALUES 
    ('demo-admin', 'Admin Demo', 'admin@demo.com', 'hashed_password_123', 'admin', 'demo-company'),
    ('demo-user', 'User Demo', 'user@demo.com', 'hashed_password_456', 'user', 'demo-company');

-- LOCATION
INSERT INTO "Location" (id, name, "markerShape", "companyId") VALUES 
    ('loc-1', 'Sede Principal', 'circle', 'demo-company'),
    ('loc-2', 'Filial Norte', 'square', 'demo-company');

-- PROJECT
INSERT INTO "Project" (id, name, "companyId", "createdByUserId", "cargaDeTestePadrao", "tempoDeTestePadrao", "engenheiroResponsavelPadrao") VALUES 
    ('proj-1', 'Projeto Demo Ancoragem', 'demo-company', 'demo-admin', '2000 kg', '5 min', 'Eng. João Silva'),
    ('proj-2', 'Torre de Telecomunicações', 'demo-company', 'demo-admin', '1500 kg', '3 min', 'Eng. Maria Santos');

-- ANCHOR_POINTS (COM FOTO!)
INSERT INTO anchor_points (id, project_id, numero_ponto, localizacao, foto, posicao_x, posicao_y, status, created_by_user_id) VALUES 
    ('point-1', 'proj-1', 'AP-001', 'Parede Norte - Andar 1', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', 100.5, 200.3, 'Não Testado', 'demo-admin'),
    ('point-2', 'proj-1', 'AP-002', 'Parede Sul - Andar 1', NULL, 150.2, 180.7, 'Aprovado', 'demo-admin'),
    ('point-3', 'proj-2', 'AP-003', 'Base da Torre', NULL, 200.0, 300.0, 'Reprovado', 'demo-admin');

-- ANCHOR_TESTS (COM PONTO_ID E FOTOS!)
INSERT INTO anchor_tests (id, ponto_id, resultado, carga, tempo, tecnico, observacoes, foto_teste, foto_pronto) VALUES 
    ('test-1', 'point-2', 'Aprovado', '2000 kg', '5 min', 'Técnico José', 'Teste realizado conforme norma', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg=='),
    ('test-2', 'point-3', 'Reprovado', '1800 kg', '4 min', 'Técnico Maria', 'Falha na ancoragem - refazer', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', NULL);

-- AUDIT_LOG
INSERT INTO audit_log (company_id, user_id, action, table_name, record_id, new_values) VALUES 
    ('demo-company', 'demo-admin', 'create', 'anchor_points', 'point-1', '{"numero_ponto": "AP-001", "localizacao": "Parede Norte"}'),
    ('demo-company', 'demo-admin', 'login', NULL, NULL, '{"ip": "192.168.1.100"}');

-- COMPANY_SETTINGS
INSERT INTO company_settings (company_id, notification_email, company_address, company_phone) VALUES 
    ('demo-company', 'admin@demo.com', 'Rua das Flores, 123 - São Paulo, SP', '(11) 99999-9999');

-- NOTIFICATIONS
INSERT INTO notifications (company_id, user_id, type, category, title, message, priority) VALUES 
    ('demo-company', NULL, 'info', 'system', 'Bem-vindo ao AnchorView!', 'Sistema configurado e pronto para uso.', 2),
    ('demo-company', 'demo-admin', 'warning', 'sync', 'Sincronização Pendente', 'Existem 3 pontos não sincronizados.', 3);

-- PASSWORD_RESETS
INSERT INTO password_resets (user_id, email, token, expires_at, used_at) VALUES 
    ('demo-admin', 'admin@demo.com', 'reset_token_123_expired', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL);

-- SYNC_STATUS
INSERT INTO sync_status (company_id, user_id, operation_type, status, total_records, processed_records, success_records, progress_percentage) VALUES 
    ('demo-company', 'demo-admin', 'full_sync', 'completed', 10, 10, 8, 100.00),
    ('demo-company', 'demo-admin', 'photos', 'running', 12, 5, 3, 41.67);

-- SYSTEM_LOGS
INSERT INTO system_logs (level, category, message, context, user_id, company_id) VALUES 
    ('info', 'auth', 'User logged in successfully', '{"ip": "192.168.1.100"}', 'demo-admin', 'demo-company'),
    ('error', 'sync', 'Sync operation failed', '{"error": "network timeout"}', 'demo-admin', 'demo-company');

-- USER_PREFERENCES
INSERT INTO user_preferences (user_id, theme, language, notifications_enabled) VALUES 
    ('demo-admin', 'dark', 'pt-BR', true),
    ('demo-user', 'light', 'pt-BR', true);

\echo '✅ DADOS DEMO inseridos em todas as tabelas'

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
\echo '=== VERIFICAÇÃO FINAL ==='

-- Contar colunas e registros
SELECT 
    'Company' as tabela, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Company') as colunas,
    (SELECT COUNT(*) FROM "Company") as registros
UNION ALL
SELECT 'User', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'User'),
    (SELECT COUNT(*) FROM "User")
UNION ALL
SELECT 'anchor_points', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'anchor_points'),
    (SELECT COUNT(*) FROM anchor_points)
UNION ALL
SELECT 'anchor_tests', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'anchor_tests'),
    (SELECT COUNT(*) FROM anchor_tests)
UNION ALL
SELECT 'notifications', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications'),
    (SELECT COUNT(*) FROM notifications)
UNION ALL
SELECT 'audit_log', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_log'),
    (SELECT COUNT(*) FROM audit_log);

\echo ''
\echo '🎉 SUCESSO TOTAL!'
\echo '✅ Todas as tabelas criadas com colunas completas'
\echo '✅ Todas as colunas críticas (foto, ponto_id) incluídas'  
\echo '✅ Dados demo inseridos - sem mais "no records found"'
\echo ''
\echo 'TESTE ESPECÍFICO DAS COLUNAS CRÍTICAS:'

-- Verificar se as colunas críticas existem
SELECT 'FOTO na anchor_points:' as teste, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchor_points' AND column_name = 'foto') 
            THEN '✅ EXISTE' ELSE '❌ FALTANDO' END as resultado
UNION ALL
SELECT 'PONTO_ID na anchor_tests:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchor_tests' AND column_name = 'ponto_id') 
            THEN '✅ EXISTE' ELSE '❌ FALTANDO' END
UNION ALL
SELECT 'FOTO_TESTE na anchor_tests:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchor_tests' AND column_name = 'foto_teste') 
            THEN '✅ EXISTE' ELSE '❌ FALTANDO' END
UNION ALL
SELECT 'FOTO_PRONTO na anchor_tests:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchor_tests' AND column_name = 'foto_pronto') 
            THEN '✅ EXISTE' ELSE '❌ FALTANDO' END;

EOF

echo "🚀 SCRIPT CONCLUÍDO - TUDO CRIADO DO ZERO!"