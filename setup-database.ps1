# PowerShell script para setup do banco AnchorView
Write-Host "🚀 Iniciando setup AnchorView Database..." -ForegroundColor Green

$env:PGPASSWORD = "privado12!"
$DB_HOST = "private_alpdb"
$DB_PORT = "5432"
$DB_USER = "privado"
$DB_NAME = "privado"

# Teste de conexão
Write-Host "✅ Testando conexão com o banco..." -ForegroundColor Yellow
try {
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Conexão falhou"
    }
    Write-Host "✅ Conexão estabelecida com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Não foi possível conectar ao banco de dados" -ForegroundColor Red
    Write-Host "Verifique se o PostgreSQL está rodando e as credenciais estão corretas" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar tabelas existentes antes
Write-Host "📋 Verificando tabelas existentes..." -ForegroundColor Yellow
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

# Criar extensões
Write-Host "🔧 Criando extensões necessárias..." -ForegroundColor Yellow
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS `"uuid-ossp`"; CREATE EXTENSION IF NOT EXISTS `"pgcrypto`";"

# Criar função CUID
Write-Host "🔧 Criando função para gerar CUID..." -ForegroundColor Yellow
$cuidFunction = @"
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS `$`$
BEGIN
    RETURN 'c' || substr(md5(random()::text), 1, 24);
END;
`$`$ LANGUAGE plpgsql;
"@
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $cuidFunction

# Criar tabela Company
Write-Host "🗃️ Criando tabela Company..." -ForegroundColor Yellow
$companyTable = @"
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
"@

try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $companyTable
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabela Company criada com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro ao criar tabela Company"
    }
} catch {
    Write-Host "❌ Erro ao criar tabela Company: $_" -ForegroundColor Red
}

# Verificar se a tabela foi criada e suas colunas
Write-Host "🔍 Verificando colunas da tabela Company..." -ForegroundColor Yellow
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d `"Company`""

# Verificar todas as tabelas
Write-Host "📋 Listando todas as tabelas criadas..." -ForegroundColor Yellow
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

Write-Host "🎉 Setup concluído! Verifique os resultados acima." -ForegroundColor Green
Read-Host "Pressione Enter para sair"