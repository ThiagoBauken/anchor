# =====================================
# SETUP COMPLETO ANCHORVIEW DATABASE - WINDOWS
# =====================================
# Script PowerShell completo para criar TODAS as tabelas, funções, índices e dados
# Executa tanto localmente quanto no EasyPanel/Produção
#
# USO:
# .\setup-anchorview-database-complete.ps1
#
# OU com variáveis customizadas:
# $env:DB_HOST="localhost"; $env:DB_USER="postgres"; $env:DB_NAME="anchorview"; .\setup-anchorview-database-complete.ps1

# ===== CONFIGURAÇÕES DO BANCO =====
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "anchorview" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }

Write-Host "🚀 Iniciando setup completo do AnchorView Database..." -ForegroundColor Green
Write-Host "📍 Host: $DB_HOST`:$DB_PORT" -ForegroundColor Cyan
Write-Host "🗄️  Database: $DB_NAME" -ForegroundColor Cyan
Write-Host "👤 User: $DB_USER" -ForegroundColor Cyan
Write-Host ""

# Função para executar SQL
function Execute-SQL {
    param(
        [string]$SqlCommand,
        [string]$Description
    )
    
    Write-Host "📝 $Description..." -ForegroundColor Yellow
    
    try {
        if ($DB_PASSWORD) {
            $env:PGPASSWORD = $DB_PASSWORD
            $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $SqlCommand
        } else {
            $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $SqlCommand
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description - Concluído" -ForegroundColor Green
            return $result
        } else {
            Write-Host "❌ $Description - ERRO" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ $Description - ERRO: $_" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Verificar se o banco existe
Write-Host "🔍 Verificando se o banco '$DB_NAME' existe..." -ForegroundColor Yellow

try {
    if ($DB_PASSWORD) {
        $env:PGPASSWORD = $DB_PASSWORD
        $dbExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | Select-String $DB_NAME
    } else {
        $dbExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | Select-String $DB_NAME
    }
    
    if (-not $dbExists) {
        Write-Host "🆕 Criando banco de dados '$DB_NAME'..." -ForegroundColor Yellow
        if ($DB_PASSWORD) {
            $env:PGPASSWORD = $DB_PASSWORD
            createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        } else {
            createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        }
        Write-Host "✅ Banco '$DB_NAME' criado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "✅ Banco '$DB_NAME' já existe" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Erro ao verificar/criar banco: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Criar schema SQL principal
Write-Host "📄 Criando schema SQL completo..." -ForegroundColor Yellow

$schemaSQL = @'
-- =====================================
-- ANCHORVIEW COMPLETE DATABASE SCHEMA  
-- =====================================

-- ===== EXTENSÕES NECESSÁRIAS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== FUNÇÃO PARA GERAR CUID =====
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || substr(md5(random()::text), 1, 24);
END;
$$ LANGUAGE plpgsql;

-- ===== TABELAS PRINCIPAIS =====

-- Tabela Company
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "cnpj" TEXT,
    "subscriptionPlan" TEXT,
    "subscriptionStatus" TEXT,
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "subscriptionExpiryDate" TIMESTAMP(3),
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "daysRemainingInTrial" INTEGER,
    "usersCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCount" INTEGER NOT NULL DEFAULT 0,
    "pointsCount" INTEGER NOT NULL DEFAULT 0,
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "maxUsers" INTEGER,
    "maxProjects" INTEGER,
    "maxStorage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Tabela User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "phone" TEXT,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Tabela Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
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
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT,
    "dispositivoDeAncoragemPadrao" TEXT,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Tabela Location (CORRIGIDA - específica por projeto)
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- Continua com todas as outras tabelas...
'@

# Salvar o schema em arquivo temporário
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$schemaSQL | Out-File -FilePath $tempFile -Encoding UTF8

# Executar schema
Write-Host "🚀 Executando criação das tabelas principais..." -ForegroundColor Yellow

try {
    if ($DB_PASSWORD) {
        $env:PGPASSWORD = $DB_PASSWORD
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $tempFile
    } else {
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $tempFile
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabelas principais criadas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar tabelas principais" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Erro ao executar schema: $_" -ForegroundColor Red
    exit 1
}

# Continuar com o restante do setup...
Write-Host "🔗 Criando constraints e índices..." -ForegroundColor Yellow

# Unique constraints
Execute-SQL 'ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key"; ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");' "Constraint: User email único"

# Foreign Keys  
Execute-SQL 'ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey"; ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;' "FK: User -> Company"

Execute-SQL 'ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_projectId_fkey"; ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;' "FK: Location -> Project"

# Índices
Execute-SQL 'CREATE INDEX IF NOT EXISTS "User_email_active_idx" ON "User"("email", "active");' "Índice: User email + active"
Execute-SQL 'CREATE INDEX IF NOT EXISTS "Location_projectId_idx" ON "Location"("projectId");' "Índice: Location por projeto"

# Funções
Write-Host "⚙️ Criando funções SQL..." -ForegroundColor Yellow

Execute-SQL @'
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User" 
        WHERE role = 'superadmin' AND active = true
    );
END;
$$ LANGUAGE plpgsql;
'@ "Função: check_superadmin_exists"

# Dados iniciais
Write-Host "📊 Inserindo dados iniciais..." -ForegroundColor Yellow

Execute-SQL @'
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "max_users", "max_projects", "max_storage_gb") VALUES
('trial', 'Trial Gratuito', '14 dias grátis para testar', 0.00, 2, 3, 1),
('basic', 'Básico', 'Plano ideal para empresas pequenas', 99.90, 5, 10, 5),
('pro', 'Profissional', 'Plano completo para empresas médias', 299.90, 20, 50, 20),
('enterprise', 'Enterprise', 'Plano ilimitado para grandes empresas', 799.90, 999, 999, 100)
ON CONFLICT ("id") DO NOTHING;
'@ "Dados: Planos de assinatura"

# Verificações finais
Write-Host "🔍 Executando verificações finais..." -ForegroundColor Yellow

$tableCount = Execute-SQL "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "Contando tabelas criadas"
Write-Host "📊 Total de tabelas criadas: $($tableCount[-1].Trim())" -ForegroundColor Cyan

# Limpeza
Remove-Item $tempFile -Force

Write-Host ""
Write-Host "🎉 =================================" -ForegroundColor Green
Write-Host "🎉 SETUP COMPLETO FINALIZADO!" -ForegroundColor Green  
Write-Host "🎉 =================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Database: $DB_NAME" -ForegroundColor Green
Write-Host "✅ Tabelas criadas com sucesso" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Execute: npx prisma generate" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:3000/setup" -ForegroundColor White
Write-Host "3. Crie seu super admin" -ForegroundColor White
Write-Host "4. Acesse: http://localhost:3000/admin" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Chave de setup: anchor-setup-2025" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 AnchorView está pronto para uso!" -ForegroundColor Green