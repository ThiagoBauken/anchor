-- =============================================
-- COMANDO COMPLETO PARA EXECUTAR NO CONSOLE DO EASYPANEL
-- Copie todo este conteúdo e cole no console PostgreSQL
-- =============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela Company
CREATE TABLE IF NOT EXISTS "Company" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL
);

-- Tabela User
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    password_hash TEXT,
    role TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- Tabela Location
CREATE TABLE IF NOT EXISTS "Location" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- Tabela Project
CREATE TABLE IF NOT EXISTS "Project" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    deleted BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id),
    "createdByUserId" TEXT NOT NULL REFERENCES "User"(id),
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

-- Tabela subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    max_users INT,
    max_projects INT,
    max_points INT,
    max_storage_gb INT DEFAULT 10,
    features JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tipos enum apenas se não existirem
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Tabela payments
CREATE TABLE IF NOT EXISTS payments (
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

-- Tabela user_invitations
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL REFERENCES "User"(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    is_reusable BOOLEAN DEFAULT false,
    description TEXT
);

-- Tabela usage_limits
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
    users_count INT DEFAULT 0,
    projects_count INT DEFAULT 0,
    points_count INT DEFAULT 0,
    storage_used_gb DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    granted_by TEXT REFERENCES "User"(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission, resource_type, resource_id)
);

-- Tabela saas_activity_log
CREATE TABLE IF NOT EXISTS saas_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela anchor_points
CREATE TABLE IF NOT EXISTS anchor_points (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES "Project"(id),
    numero_ponto TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    foto TEXT,
    "numeroLacre" TEXT,
    tipo_equipamento TEXT,
    data_instalacao TEXT,
    frequencia_inspecao_meses INT,
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

-- Tabela anchor_tests
CREATE TABLE IF NOT EXISTS anchor_tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- Tabela files
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INT NOT NULL,
    url TEXT,
    uploaded BOOLEAN DEFAULT false,
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    retries INT DEFAULT 0,
    error TEXT,
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    user_id TEXT REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Tabela user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_company ON "User"("companyId");
CREATE INDEX IF NOT EXISTS idx_project_company ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS idx_anchor_point_project ON anchor_points(project_id);
CREATE INDEX IF NOT EXISTS idx_anchor_test_point ON anchor_tests(ponto_id);
CREATE INDEX IF NOT EXISTS idx_subscription_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_invitation_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON saas_activity_log(company_id);

-- Inserir planos padrão
INSERT INTO subscription_plans (id, name, description, price_monthly, max_users, max_projects, max_points, features)
VALUES 
    ('free', 'Gratuito', 'Perfeito para começar', 0, 2, 1, 50, '{"offline": true, "basic_export": true}'),
    ('pro', 'Profissional', 'Para equipes pequenas', 49.90, 10, 5, 500, '{"offline": true, "advanced_export": true, "api_access": true}'),
    ('enterprise', 'Empresarial', 'Para grandes empresas', 199.90, NULL, NULL, NULL, '{"offline": true, "advanced_export": true, "api_access": true, "custom_branding": true, "priority_support": true}')
ON CONFLICT (id) DO NOTHING;

-- Verificar se tudo foi criado
SELECT 'Tabelas criadas com sucesso!' as status;