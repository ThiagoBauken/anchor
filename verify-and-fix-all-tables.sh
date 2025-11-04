#!/bin/bash
# VERIFICAÇÃO E CORREÇÃO COMPLETA DE TODAS AS TABELAS

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "🔍 VERIFICANDO TODAS AS TABELAS E COLUNAS..."

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

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

\echo '=== VERIFICAÇÃO DETALHADA DE TODAS AS TABELAS ==='

-- =============================================
-- 1. VERIFICAR E CORRIGIR COMPANY
-- =============================================
\echo '1. VERIFICANDO COMPANY...'

DO $$ 
BEGIN
    IF NOT table_exists('Company') THEN
        \echo '❌ Tabela Company não existe. Criando...'
        CREATE TABLE "Company" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );
        \echo '✅ Company criada!'
    ELSE
        \echo '✅ Company existe'
    END IF;
END $$;

-- =============================================
-- 2. VERIFICAR E CORRIGIR USER
-- =============================================
\echo '2. VERIFICANDO USER...'

DO $$ 
BEGIN
    IF NOT table_exists('User') THEN
        \echo '❌ Tabela User não existe. Criando...'
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
        \echo '✅ User criada!'
    ELSE
        \echo '✅ User existe'
    END IF;
    
    -- Verificar colunas específicas
    IF NOT column_exists('User', 'password_hash') THEN
        ALTER TABLE "User" ADD COLUMN password_hash TEXT;
        \echo '✅ Coluna password_hash adicionada ao User'
    END IF;
END $$;

-- =============================================
-- 3. VERIFICAR E CORRIGIR PROJECT
-- =============================================
\echo '3. VERIFICANDO PROJECT...'

DO $$ 
BEGIN
    IF NOT table_exists('Project') THEN
        \echo '❌ Tabela Project não existe. Criando...'
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
        \echo '✅ Project criada!'
    ELSE
        \echo '✅ Project existe'
    END IF;
END $$;

-- =============================================
-- 4. VERIFICAR E CORRIGIR ANCHOR_POINTS
-- =============================================
\echo '4. VERIFICANDO ANCHOR_POINTS...'

DO $$ 
BEGIN
    IF NOT table_exists('anchor_points') THEN
        \echo '❌ Tabela anchor_points não existe. Criando...'
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
        \echo '✅ anchor_points criada!'
    ELSE
        \echo '✅ anchor_points existe'
    END IF;
    
    -- VERIFICAR COLUNA CRÍTICA: foto
    IF NOT column_exists('anchor_points', 'foto') THEN
        ALTER TABLE anchor_points ADD COLUMN foto TEXT;
        \echo '🔧 Coluna FOTO adicionada ao anchor_points'
    ELSE
        \echo '✅ Coluna foto existe em anchor_points'
    END IF;
END $$;

-- =============================================
-- 5. VERIFICAR E CORRIGIR ANCHOR_TESTS
-- =============================================
\echo '5. VERIFICANDO ANCHOR_TESTS...'

DO $$ 
BEGIN
    IF NOT table_exists('anchor_tests') THEN
        \echo '❌ Tabela anchor_tests não existe. Criando...'
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
        \echo '✅ anchor_tests criada!'
    ELSE
        \echo '✅ anchor_tests existe'
    END IF;
    
    -- VERIFICAR COLUNAS CRÍTICAS
    IF NOT column_exists('anchor_tests', 'ponto_id') THEN
        ALTER TABLE anchor_tests ADD COLUMN ponto_id TEXT NOT NULL REFERENCES anchor_points(id);
        \echo '🔧 Coluna PONTO_ID adicionada ao anchor_tests'
    ELSE
        \echo '✅ Coluna ponto_id existe em anchor_tests'
    END IF;
    
    IF NOT column_exists('anchor_tests', 'foto_teste') THEN
        ALTER TABLE anchor_tests ADD COLUMN foto_teste TEXT;
        \echo '🔧 Coluna FOTO_TESTE adicionada ao anchor_tests'
    ELSE
        \echo '✅ Coluna foto_teste existe em anchor_tests'
    END IF;
    
    IF NOT column_exists('anchor_tests', 'foto_pronto') THEN
        ALTER TABLE anchor_tests ADD COLUMN foto_pronto TEXT;
        \echo '🔧 Coluna FOTO_PRONTO adicionada ao anchor_tests'
    ELSE
        \echo '✅ Coluna foto_pronto existe em anchor_tests'
    END IF;
END $$;

-- =============================================
-- 6. VERIFICAR TABELAS EXTRAS
-- =============================================
\echo '6. VERIFICANDO TABELAS EXTRAS...'

-- AUDIT_LOG
DO $$ 
BEGIN
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
        \echo '✅ audit_log criada!'
    ELSE
        -- Verificar se tem colunas
        IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_log') = 0 THEN
            DROP TABLE audit_log CASCADE;
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
            \echo '🔧 audit_log reestruturada (estava vazia)!'
        ELSE
            \echo '✅ audit_log existe com colunas'
        END IF;
    END IF;
END $$;

-- COMPANY_SETTINGS
DO $$ 
BEGIN
    IF NOT table_exists('company_settings') THEN
        CREATE TABLE company_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
            logo_url TEXT,
            primary_color TEXT DEFAULT '#6941DE',
            timezone TEXT DEFAULT 'America/Sao_Paulo',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            language TEXT DEFAULT 'pt-BR',
            auto_backup BOOLEAN DEFAULT true,
            notification_email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        \echo '✅ company_settings criada!'
    ELSE
        IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'company_settings') = 0 THEN
            DROP TABLE company_settings CASCADE;
            CREATE TABLE company_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
                logo_url TEXT,
                primary_color TEXT DEFAULT '#6941DE',
                timezone TEXT DEFAULT 'America/Sao_Paulo',
                date_format TEXT DEFAULT 'DD/MM/YYYY',
                language TEXT DEFAULT 'pt-BR',
                auto_backup BOOLEAN DEFAULT true,
                notification_email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            \echo '🔧 company_settings reestruturada!'
        ELSE
            \echo '✅ company_settings existe com colunas'
        END IF;
    END IF;
END $$;

-- NOTIFICATIONS
DO $$ 
BEGIN
    IF NOT table_exists('notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            action_url TEXT,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        );
        \echo '✅ notifications criada!'
    ELSE
        IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications') = 0 THEN
            DROP TABLE notifications CASCADE;
            CREATE TABLE notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id TEXT NOT NULL REFERENCES "Company"(id),
                user_id TEXT REFERENCES "User"(id),
                type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                action_url TEXT,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            );
            \echo '🔧 notifications reestruturada!'
        ELSE
            \echo '✅ notifications existe com colunas'
        END IF;
    END IF;
END $$;

-- PASSWORD_RESETS
DO $$ 
BEGIN
    IF NOT table_exists('password_resets') THEN
        CREATE TABLE password_resets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES "User"(id),
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP,
            ip_address INET,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        \echo '✅ password_resets criada!'
    ELSE
        IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'password_resets') = 0 THEN
            DROP TABLE password_resets CASCADE;
            CREATE TABLE password_resets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id TEXT NOT NULL REFERENCES "User"(id),
                email TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                ip_address INET,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            \echo '🔧 password_resets reestruturada!'
        ELSE
            \echo '✅ password_resets existe com colunas'
        END IF;
    END IF;
END $$;

-- USER_INVITATIONS (verificar se tem colunas)
DO $$ 
BEGIN
    IF table_exists('user_invitations') AND 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_invitations') = 0 THEN
        DROP TABLE user_invitations CASCADE;
        CREATE TABLE user_invitations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            email TEXT,
            role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
            invited_by TEXT NOT NULL REFERENCES "User"(id),
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            accepted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            max_uses INTEGER DEFAULT 1,
            current_uses INTEGER DEFAULT 0,
            is_reusable BOOLEAN DEFAULT false,
            description TEXT
        );
        \echo '🔧 user_invitations reestruturada!'
    END IF;
END $$;

-- =============================================
-- 7. INSERIR DADOS DEMO SE NECESSÁRIO
-- =============================================
\echo '7. VERIFICANDO E INSERINDO DADOS DEMO...'

-- Company demo
INSERT INTO "Company" (id, name) 
VALUES ('demo-company', 'Empresa Demo')
ON CONFLICT (id) DO NOTHING;

-- User demo
INSERT INTO "User" (id, name, email, password_hash, role, "companyId") 
VALUES ('demo-admin', 'Admin Demo', 'admin@demo.com', 'hash123', 'admin', 'demo-company')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. VERIFICAÇÃO FINAL
-- =============================================
\echo '=== VERIFICAÇÃO FINAL ==='

SELECT 
    t.table_name,
    COALESCE(c.column_count, 0) as colunas,
    CASE 
        WHEN COALESCE(c.column_count, 0) = 0 THEN '❌ SEM COLUNAS'
        WHEN COALESCE(c.column_count, 0) < 3 THEN '⚠️ POUCAS COLUNAS'
        ELSE '✅ OK'
    END as status
FROM information_schema.tables t
LEFT JOIN (
    SELECT table_name, COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
) c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

\echo ''
\echo '=== COLUNAS CRÍTICAS DE FOTO ==='
SELECT 
    'anchor_points' as tabela,
    CASE WHEN column_exists('anchor_points', 'foto') THEN '✅ foto existe' ELSE '❌ foto faltando' END as status
UNION ALL
SELECT 
    'anchor_tests' as tabela,
    CASE WHEN column_exists('anchor_tests', 'foto_teste') AND column_exists('anchor_tests', 'foto_pronto') 
         THEN '✅ fotos existem' 
         ELSE '❌ fotos faltando' END as status;

\echo ''
\echo '🎉 VERIFICAÇÃO E CORREÇÃO CONCLUÍDA!'

EOF