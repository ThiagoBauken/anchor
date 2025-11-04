#!/bin/bash

# Script completo para criar TODAS as tabelas do banco de dados AnchorView
# Execute este script para configurar completamente o banco de dados PostgreSQL

echo "🚀 Iniciando criação de todas as tabelas do banco de dados AnchorView..."

# Configuração da conexão
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL não configurada. Usando padrão local..."
    DATABASE_URL="postgresql://postgres:password@localhost:5432/anchorview"
fi

echo "📦 Conectando ao banco: $DATABASE_URL"

# Criar SQL temporário com todas as tabelas
cat > /tmp/create-all-tables.sql << 'EOF'
-- =============================================
-- Habilitar extensão UUID se não existir
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS PRINCIPAIS DA APLICAÇÃO
-- =============================================

-- Tabela Company (Empresa/Tenant)
CREATE TABLE IF NOT EXISTS "Company" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL
);

-- Tabela User (Usuários)
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

-- Tabela Location (Localizações)
CREATE TABLE IF NOT EXISTS "Location" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- Tabela Project (Projetos)
CREATE TABLE IF NOT EXISTS "Project" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    deleted BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id),
    "createdByUserId" TEXT NOT NULL REFERENCES "User"(id),
    
    -- Campos do relatório
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

-- =============================================
-- TABELAS SAAS MULTI-TENANT
-- =============================================

-- Tabela subscription_plans (Planos de Assinatura)
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

-- Enum para status de assinatura
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- Tabela subscriptions (Assinaturas)
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

-- Tabela payments (Pagamentos)
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

-- Tabela user_invitations (Convites de Usuário)
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

-- Tabela usage_limits (Limites de Uso)
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL REFERENCES "Company"(id),
    users_count INT DEFAULT 0,
    projects_count INT DEFAULT 0,
    points_count INT DEFAULT 0,
    storage_used_gb DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela user_permissions (Permissões de Usuário)
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

-- Tabela saas_activity_log (Log de Atividades)
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

-- =============================================
-- TABELAS DE PONTOS E TESTES
-- =============================================

-- Tabela anchor_points (Pontos de Ancoragem)
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

-- Tabela anchor_tests (Testes de Ancoragem)
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

-- =============================================
-- TABELAS DE ARQUIVOS E SINCRONIZAÇÃO
-- =============================================

-- Tabela files (Arquivos)
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

-- Tabela sync_queue (Fila de Sincronização)
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

-- Tabela user_sessions (Sessões de Usuário)
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

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_company ON "User"("companyId");
CREATE INDEX IF NOT EXISTS idx_project_company ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS idx_anchor_point_project ON anchor_points(project_id);
CREATE INDEX IF NOT EXISTS idx_anchor_test_point ON anchor_tests(ponto_id);
CREATE INDEX IF NOT EXISTS idx_subscription_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_invitation_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON saas_activity_log(company_id);

-- =============================================
-- DADOS INICIAIS DE EXEMPLO
-- =============================================

-- Inserir planos de assinatura padrão (se não existirem)
INSERT INTO subscription_plans (id, name, description, price_monthly, max_users, max_projects, max_points, features)
VALUES 
    ('free', 'Gratuito', 'Perfeito para começar', 0, 2, 1, 50, '{"offline": true, "basic_export": true}'),
    ('pro', 'Profissional', 'Para equipes pequenas', 49.90, 10, 5, 500, '{"offline": true, "advanced_export": true, "api_access": true}'),
    ('enterprise', 'Empresarial', 'Para grandes empresas', 199.90, NULL, NULL, NULL, '{"offline": true, "advanced_export": true, "api_access": true, "custom_branding": true, "priority_support": true}')
ON CONFLICT (id) DO NOTHING;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Todas as tabelas foram criadas com sucesso!';
END $$;
EOF

# Executar o script SQL
echo "📝 Criando tabelas no banco de dados..."
psql "$DATABASE_URL" -f /tmp/create-all-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Todas as tabelas foram criadas com sucesso!"
    echo ""
    echo "📋 Tabelas criadas:"
    echo "  - Company (Empresas)"
    echo "  - User (Usuários)"
    echo "  - Location (Localizações)"
    echo "  - Project (Projetos)"
    echo "  - subscription_plans (Planos de Assinatura)"
    echo "  - subscriptions (Assinaturas)"
    echo "  - payments (Pagamentos)"
    echo "  - user_invitations (Convites)"
    echo "  - usage_limits (Limites de Uso)"
    echo "  - user_permissions (Permissões)"
    echo "  - saas_activity_log (Log de Atividades)"
    echo "  - anchor_points (Pontos de Ancoragem)"
    echo "  - anchor_tests (Testes)"
    echo "  - files (Arquivos)"
    echo "  - sync_queue (Fila de Sincronização)"
    echo "  - user_sessions (Sessões)"
    echo ""
    echo "🚀 Próximos passos:"
    echo "  1. Execute: npx prisma generate"
    echo "  2. Execute: npm run dev"
    echo ""
    
    # Limpar arquivo temporário
    rm /tmp/create-all-tables.sql
else
    echo "❌ Erro ao criar tabelas. Verifique a conexão com o PostgreSQL."
    echo ""
    echo "Dicas de troubleshooting:"
    echo "  1. Verifique se o PostgreSQL está rodando"
    echo "  2. Confirme que DATABASE_URL está correto"
    echo "  3. Certifique-se de que o banco 'anchorview' existe"
    echo ""
    echo "Para criar o banco, execute:"
    echo "  createdb anchorview"
    
    # Manter arquivo temporário para debug
    echo ""
    echo "O arquivo SQL foi salvo em: /tmp/create-all-tables.sql"
    exit 1
fi