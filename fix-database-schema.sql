-- =============================================
-- CORREÇÕES CRÍTICAS DO ESQUEMA POSTGRESQL
-- Execute este SQL no console do EasyPanel
-- =============================================

-- 1. Create essential enums first
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure companies table exists with correct structure
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    cnpj TEXT,
    subscription_plan TEXT,
    subscription_status TEXT,
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    subscription_expiry_date TIMESTAMP WITH TIME ZONE,
    is_trial_active BOOLEAN DEFAULT false,
    days_remaining_in_trial INTEGER,
    users_count INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    points_count INTEGER DEFAULT 0,
    storage_used INTEGER DEFAULT 0,
    max_users INTEGER,
    max_projects INTEGER,
    max_storage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- 3. Ensure users table exists with correct structure  
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    password_hash TEXT,
    role TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    "companyId" TEXT NOT NULL,
    FOREIGN KEY ("companyId") REFERENCES companies(id)
);

-- 4. Ensure projects table exists with correct structure
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    floor_plan_images TEXT[],
    "companyId" TEXT NOT NULL,
    created_by_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    carga_de_teste_padrao TEXT,
    tempo_de_teste_padrao TEXT,
    engenheiro_responsavel_padrao TEXT,
    deleted BOOLEAN DEFAULT false,
    FOREIGN KEY ("companyId") REFERENCES companies(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 5. Fix critical database schema issues and add missing columns
DO $$ 
BEGIN
    -- Add missing numero_ponto column to anchor_points
    BEGIN
        ALTER TABLE anchor_points ADD COLUMN numero_ponto TEXT;
        RAISE NOTICE 'Column numero_ponto added to anchor_points';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column numero_ponto already exists in anchor_points';
    END;
    
    -- Add missing markerShape column to locations
    BEGIN
        ALTER TABLE locations ADD COLUMN "markerShape" TEXT;
        RAISE NOTICE 'Column markerShape added to locations';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column markerShape already exists in locations';
    END;
    
    -- Add missing floorPlanImages column to projects
    BEGIN
        ALTER TABLE projects ADD COLUMN floor_plan_images TEXT[];
        RAISE NOTICE 'Column floor_plan_images added to projects';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column floor_plan_images already exists in projects';
    END;
    
    -- Add missing password_hash column to users
    BEGIN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Column password_hash added to users';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column password_hash already exists in users';
    END;
    
    -- Add missing deleted column to projects
    BEGIN
        ALTER TABLE projects ADD COLUMN deleted BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column deleted added to projects';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column deleted already exists in projects';
    END;
    
    -- Add missing foto columns to anchor_points and anchor_tests
    BEGIN
        ALTER TABLE anchor_points ADD COLUMN foto TEXT;
        RAISE NOTICE 'Column foto added to anchor_points';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column foto already exists in anchor_points';
    END;
    
    BEGIN
        ALTER TABLE anchor_tests ADD COLUMN foto_teste TEXT;
        RAISE NOTICE 'Column foto_teste added to anchor_tests';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column foto_teste already exists in anchor_tests';
    END;
    
    BEGIN
        ALTER TABLE anchor_tests ADD COLUMN foto_pronto TEXT;
        RAISE NOTICE 'Column foto_pronto added to anchor_tests';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column foto_pronto already exists in anchor_tests';
    END;
    
    -- Set default values for existing records
    UPDATE anchor_points SET numero_ponto = COALESCE(numero_ponto, '1') WHERE numero_ponto IS NULL;
    UPDATE locations SET "markerShape" = COALESCE("markerShape", 'circle') WHERE "markerShape" IS NULL;
    UPDATE projects SET deleted = COALESCE(deleted, false) WHERE deleted IS NULL;
    
END $$;

-- 6. Create user_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_invitations (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (invited_by) REFERENCES users(id)
);

-- 7. Create subscriptions table with correct enum
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status "SubscriptionStatus" DEFAULT 'trialing',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 8. Create demo company and users for testing
INSERT INTO companies (id, name, email, is_trial_active, trial_start_date, trial_end_date, is_active)
VALUES ('demo-company', 'Demo Company', 'demo@anchorview.com', true, NOW(), NOW() + INTERVAL '30 days', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role, "companyId", active)
VALUES 
    ('demo-admin', 'Demo Admin', 'admin@anchorview.com', '$2b$10$hash', 'admin', 'demo-company', true),
    ('superadmin', 'Super Admin', 'superadmin@anchorview.com', '$2b$10$hash', 'superadmin', 'demo-company', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Verificar se a coluna ponto_id existe na tabela anchor_tests
-- (Prisma mapeia pontoId -> ponto_id, então deve existir como ponto_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anchor_tests' AND column_name = 'ponto_id'
    ) THEN
        -- Se não existe, criar com referência correta
        ALTER TABLE anchor_tests ADD COLUMN ponto_id TEXT NOT NULL;
        
        -- Adicionar foreign key constraint
        ALTER TABLE anchor_tests 
        ADD CONSTRAINT fk_anchor_tests_ponto_id 
        FOREIGN KEY (ponto_id) REFERENCES anchor_points(id);
        
        RAISE NOTICE 'Coluna ponto_id adicionada à tabela anchor_tests';
    ELSE
        RAISE NOTICE 'Coluna ponto_id já existe na tabela anchor_tests';
    END IF;
END $$;

-- 3. Verificar estrutura atual das tabelas principais
SELECT 'anchor_points columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_points' 
ORDER BY ordinal_position;

SELECT 'anchor_tests columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_tests' 
ORDER BY ordinal_position;

-- 4. Verificar se tabelas User e Location existem com nomes corretos
SELECT 'User table exists?' as check_user;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('User', 'users', 'user');

SELECT 'Location table exists?' as check_location;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('Location', 'locations', 'location');

SELECT '✅ Verificação de esquema concluída!' as status;