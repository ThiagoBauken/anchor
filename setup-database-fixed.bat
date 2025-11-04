@echo off
echo 🚀 Iniciando setup AnchorView Database...

set PGPASSWORD=privado12!
set DB_HOST=private_alpdb
set DB_PORT=5432
set DB_USER=privado
set DB_NAME=privado

echo ✅ Testando conexão com o banco...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro: Não foi possível conectar ao banco de dados
    echo Verifique se o PostgreSQL está rodando e as credenciais estão corretas
    pause
    exit /b 1
)

echo ✅ Conexão estabelecida com sucesso!

echo 🔧 Criando extensões necessárias...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

echo 🔧 Criando função para gerar CUID...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$ BEGIN RETURN 'c' || substr(md5(random()::text), 1, 24); END; $$ LANGUAGE plpgsql;"

echo 📋 Verificando tabelas existentes...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\dt"

echo 🗃️ Criando tabela Company...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE TABLE IF NOT EXISTS \"Company\" (\"id\" TEXT NOT NULL DEFAULT generate_cuid(), \"name\" TEXT NOT NULL, \"email\" TEXT, \"phone\" TEXT, \"address\" TEXT, \"cnpj\" TEXT, \"subscriptionPlan\" TEXT, \"subscriptionStatus\" TEXT, \"trialStartDate\" TIMESTAMP(3), \"trialEndDate\" TIMESTAMP(3), \"subscriptionExpiryDate\" TIMESTAMP(3), \"isTrialActive\" BOOLEAN NOT NULL DEFAULT false, \"daysRemainingInTrial\" INTEGER, \"usersCount\" INTEGER NOT NULL DEFAULT 0, \"projectsCount\" INTEGER NOT NULL DEFAULT 0, \"pointsCount\" INTEGER NOT NULL DEFAULT 0, \"storageUsed\" INTEGER NOT NULL DEFAULT 0, \"maxUsers\" INTEGER, \"maxProjects\" INTEGER, \"maxStorage\" INTEGER, \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"lastActivity\" TIMESTAMP(3), \"isActive\" BOOLEAN NOT NULL DEFAULT true, \"notes\" TEXT, CONSTRAINT \"Company_pkey\" PRIMARY KEY (\"id\"));"

if %errorlevel% neq 0 (
    echo ❌ Erro ao criar tabela Company
    pause
    exit /b 1
)

echo ✅ Tabela Company criada com sucesso!

echo 🗃️ Criando tabela User...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE TABLE IF NOT EXISTS \"User\" (\"id\" TEXT NOT NULL DEFAULT generate_cuid(), \"name\" TEXT NOT NULL, \"email\" TEXT, \"password\" TEXT, \"password_hash\" TEXT, \"role\" TEXT NOT NULL, \"active\" BOOLEAN NOT NULL DEFAULT true, \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"last_login_at\" TIMESTAMP(3), \"phone\" TEXT, \"companyId\" TEXT NOT NULL, CONSTRAINT \"User_pkey\" PRIMARY KEY (\"id\"));"

if %errorlevel% neq 0 (
    echo ❌ Erro ao criar tabela User
    pause
    exit /b 1
)

echo ✅ Tabela User criada com sucesso!

echo 🔍 Verificando se as tabelas foram criadas...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\dt"

echo 🔍 Verificando colunas da tabela Company...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d \"Company\""

echo 🔍 Verificando colunas da tabela User...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d \"User\""

echo ✅ Setup básico concluído!
echo Para continuar com todas as tabelas, execute o script completo.

pause