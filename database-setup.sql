-- =============================================
-- AnchorView Database Setup Script
-- Complete PostgreSQL schema creation and seed data
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION table_exists(table_name_param TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param 
          AND table_schema = 'public'
    );
END;
$$ LANGUAGE plpgsql;

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

-- =============================================
-- CORE TABLES CREATION
-- =============================================

-- 1. Company Table
DO $$
BEGIN
    IF NOT table_exists('Company') THEN
        CREATE TABLE "Company" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );
        RAISE NOTICE '✅ Created Company table';
    ELSE
        RAISE NOTICE '⚠️ Company table already exists';
    END IF;
END $$;

-- 2. User Table
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
        RAISE NOTICE '✅ Created User table';
    ELSE
        -- Add missing columns if they don't exist
        IF NOT column_exists('User', 'password_hash') THEN
            ALTER TABLE "User" ADD COLUMN password_hash TEXT;
            RAISE NOTICE '✅ Added password_hash column to User table';
        END IF;
        RAISE NOTICE '⚠️ User table already exists';
    END IF;
END $$;

-- 3. Location Table
DO $$
BEGIN
    IF NOT table_exists('Location') THEN
        CREATE TABLE "Location" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            "markerShape" TEXT DEFAULT 'circle',
            "companyId" TEXT NOT NULL REFERENCES "Company"(id)
        );
        RAISE NOTICE '✅ Created Location table';
    ELSE
        RAISE NOTICE '⚠️ Location table already exists';
    END IF;
END $$;

-- 4. Project Table
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
            "engenheiroResponsavelPadrao" TEXT,
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
            "dispositivoDeAncoragemPadrao" TEXT
        );
        RAISE NOTICE '✅ Created Project table';
    ELSE
        RAISE NOTICE '⚠️ Project table already exists';
    END IF;
END $$;

-- 5. AnchorPoint Table (anchor_points)
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
        RAISE NOTICE '✅ Created anchor_points table';
    ELSE
        -- Add missing columns
        IF NOT column_exists('anchor_points', 'foto') THEN
            ALTER TABLE anchor_points ADD COLUMN foto TEXT;
            RAISE NOTICE '✅ Added foto column to anchor_points table';
        END IF;
        RAISE NOTICE '⚠️ anchor_points table already exists';
    END IF;
END $$;

-- 6. AnchorTest Table (anchor_tests)
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
        RAISE NOTICE '✅ Created anchor_tests table';
    ELSE
        -- Add missing columns
        IF NOT column_exists('anchor_tests', 'ponto_id') THEN
            ALTER TABLE anchor_tests ADD COLUMN ponto_id TEXT REFERENCES anchor_points(id);
            RAISE NOTICE '✅ Added ponto_id column to anchor_tests table';
        END IF;
        IF NOT column_exists('anchor_tests', 'foto_teste') THEN
            ALTER TABLE anchor_tests ADD COLUMN foto_teste TEXT;
            RAISE NOTICE '✅ Added foto_teste column to anchor_tests table';
        END IF;
        IF NOT column_exists('anchor_tests', 'foto_pronto') THEN
            ALTER TABLE anchor_tests ADD COLUMN foto_pronto TEXT;
            RAISE NOTICE '✅ Added foto_pronto column to anchor_tests table';
        END IF;
        RAISE NOTICE '⚠️ anchor_tests table already exists';
    END IF;
END $$;

-- =============================================
-- ADDITIONAL TABLES FOR SYSTEM FEATURES
-- =============================================

-- 7. Files Table
DO $$
BEGIN
    IF NOT table_exists('files') THEN
        CREATE TABLE files (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            url TEXT,
            uploaded BOOLEAN DEFAULT false,
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ Created files table';
    ELSE
        RAISE NOTICE '⚠️ files table already exists';
    END IF;
END $$;

-- 8. Sync Queue Table
DO $$
BEGIN
    IF NOT table_exists('sync_queue') THEN
        CREATE TABLE sync_queue (
            id TEXT PRIMARY KEY,
            operation TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            data JSONB NOT NULL,
            status TEXT DEFAULT 'pending',
            retries INTEGER DEFAULT 0,
            error TEXT,
            company_id TEXT NOT NULL REFERENCES "Company"(id),
            user_id TEXT REFERENCES "User"(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            synced_at TIMESTAMP
        );
        RAISE NOTICE '✅ Created sync_queue table';
    ELSE
        RAISE NOTICE '⚠️ sync_queue table already exists';
    END IF;
END $$;

-- 9. User Sessions Table
DO $$
BEGIN
    IF NOT table_exists('user_sessions') THEN
        CREATE TABLE user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
            session_token TEXT UNIQUE NOT NULL,
            refresh_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            ip_address TEXT NOT NULL,
            user_agent TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ Created user_sessions table';
    ELSE
        RAISE NOTICE '⚠️ user_sessions table already exists';
    END IF;
END $$;

-- =============================================
-- SAAS FEATURES TABLES
-- =============================================

-- 10. Subscription Plans
DO $$
BEGIN
    IF NOT table_exists('subscription_plans') THEN
        CREATE TABLE subscription_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price_monthly DECIMAL(10,2) NOT NULL,
            price_yearly DECIMAL(10,2),
            max_users INTEGER,
            max_projects INTEGER,
            max_points INTEGER,
            max_storage_gb INTEGER DEFAULT 10,
            features JSONB DEFAULT '{}',
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ Created subscription_plans table';
    ELSE
        RAISE NOTICE '⚠️ subscription_plans table already exists';
    END IF;
END $$;

-- 11. Subscriptions
DO $$
BEGIN
    IF NOT table_exists('subscriptions') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
        
        CREATE TABLE subscriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
            plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
            status subscription_status DEFAULT 'active',
            stripe_customer_id TEXT UNIQUE,
            stripe_subscription_id TEXT UNIQUE,
            current_period_start TIMESTAMP,
            current_period_end TIMESTAMP,
            trial_end TIMESTAMP,
            cancel_at_period_end BOOLEAN DEFAULT false,
            canceled_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ Created subscriptions table';
    ELSE
        RAISE NOTICE '⚠️ subscriptions table already exists';
    END IF;
END $$;

-- 12. Payments
DO $$
BEGIN
    IF NOT table_exists('payments') THEN
        CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');
        
        CREATE TABLE payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            subscription_id UUID NOT NULL REFERENCES subscriptions(id),
            stripe_invoice_id TEXT UNIQUE,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'BRL',
            status payment_status NOT NULL,
            description TEXT,
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ Created payments table';
    ELSE
        RAISE NOTICE '⚠️ payments table already exists';
    END IF;
END $$;

-- 13. User Invitations
DO $$
BEGIN
    IF NOT table_exists('user_invitations') THEN
        CREATE TABLE user_invitations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id TEXT NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
            email TEXT,
            role TEXT NOT NULL,
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
        RAISE NOTICE '✅ Created user_invitations table';
    ELSE
        RAISE NOTICE '⚠️ user_invitations table already exists';
    END IF;
END $$;

-- =============================================
-- SEED DATA
-- =============================================

-- Insert demo companies
INSERT INTO "Company" (id, name) VALUES 
    ('demo-company', 'Empresa Demo AnchorView'),
    ('company-2', 'Segunda Empresa Teste')
ON CONFLICT (id) DO NOTHING;

-- Insert demo users
INSERT INTO "User" (id, name, email, password_hash, role, "companyId") VALUES 
    ('demo-admin', 'Admin Demo', 'admin@demo.com', '$2b$10$hashed_password_123', 'admin', 'demo-company'),
    ('demo-user', 'User Demo', 'user@demo.com', '$2b$10$hashed_password_456', 'user', 'demo-company'),
    ('user-2', 'Outro Usuário', 'outro@demo.com', '$2b$10$hashed_password_789', 'user', 'company-2')
ON CONFLICT (id) DO NOTHING;

-- Insert demo locations
INSERT INTO "Location" (id, name, "markerShape", "companyId") VALUES 
    ('loc-1', 'Sede Principal', 'circle', 'demo-company'),
    ('loc-2', 'Filial Norte', 'square', 'demo-company'),
    ('loc-3', 'Obra Site A', 'x', 'demo-company'),
    ('loc-4', 'Escritório', 'circle', 'company-2')
ON CONFLICT (id) DO NOTHING;

-- Insert demo projects
INSERT INTO "Project" (id, name, "companyId", "createdByUserId", "cargaDeTestePadrao", "tempoDeTestePadrao", "engenheiroResponsavelPadrao") VALUES 
    ('proj-1', 'Projeto Demo Ancoragem', 'demo-company', 'demo-admin', '2000 kg', '5 min', 'Eng. João Silva'),
    ('proj-2', 'Torre de Telecomunicações', 'demo-company', 'demo-admin', '1500 kg', '3 min', 'Eng. Maria Santos'),
    ('proj-3', 'Edifício Comercial', 'company-2', 'user-2', '2500 kg', '7 min', 'Eng. Pedro Costa')
ON CONFLICT (id) DO NOTHING;

-- Insert demo anchor points
INSERT INTO anchor_points (id, project_id, numero_ponto, localizacao, foto, posicao_x, posicao_y, status, created_by_user_id) VALUES 
    ('point-1', 'proj-1', 'AP-001', 'Parede Norte - Andar 1', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', 100.5, 200.3, 'Não Testado', 'demo-admin'),
    ('point-2', 'proj-1', 'AP-002', 'Parede Sul - Andar 1', NULL, 150.2, 180.7, 'Aprovado', 'demo-admin'),
    ('point-3', 'proj-1', 'AP-003', 'Parede Leste - Andar 2', NULL, 120.8, 220.1, 'Reprovado', 'demo-user'),
    ('point-4', 'proj-2', 'AP-004', 'Base da Torre', NULL, 200.0, 300.0, 'Não Testado', 'demo-admin')
ON CONFLICT (id) DO NOTHING;

-- Insert demo anchor tests
INSERT INTO anchor_tests (id, ponto_id, resultado, carga, tempo, tecnico, observacoes, foto_teste, foto_pronto) VALUES 
    ('test-1', 'point-2', 'Aprovado', '2000 kg', '5 min', 'Técnico José', 'Teste realizado conforme norma', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg=='),
    ('test-2', 'point-3', 'Reprovado', '1800 kg', '4 min', 'Técnico Maria', 'Falha na ancoragem - refazer', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/w8AAAABAP8A8AM1DQAAAABJRU5ErkJggg==', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert demo subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, max_users, max_projects, max_points) VALUES 
    ('basic', 'Plano Básico', 'Plano básico para pequenas empresas', 99.90, 999.00, 5, 10, 100),
    ('premium', 'Plano Premium', 'Plano premium com recursos avançados', 199.90, 1999.00, 20, 50, 500),
    ('enterprise', 'Plano Enterprise', 'Plano enterprise sem limitações', 499.90, 4999.00, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FINAL STATUS REPORT
-- =============================================

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
    UNION ALL SELECT 'files', COUNT(*) FROM files
    UNION ALL SELECT 'sync_queue', COUNT(*) FROM sync_queue
    UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
    UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
    UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
    UNION ALL SELECT 'payments', COUNT(*) FROM payments
    UNION ALL SELECT 'user_invitations', COUNT(*) FROM user_invitations
) r ON t.table_name = r.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Clean up helper functions
DROP FUNCTION IF EXISTS table_exists(TEXT);
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- Success message
SELECT '🎉 Database setup completed successfully!' as result;