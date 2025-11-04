@echo off
REM Script para configurar banco PostgreSQL para AnchorView (Windows)
REM Execute este script para criar todas as tabelas necessárias

echo 🔧 Configurando banco PostgreSQL para AnchorView...

REM Verificar se DATABASE_URL está definida
if "%DATABASE_URL%"=="" (
    echo ❌ Erro: DATABASE_URL não está definida
    echo Configure a variável DATABASE_URL no arquivo .env
    echo Exemplo: DATABASE_URL="postgresql://usuario:senha@localhost:5432/anchorview"
    pause
    exit /b 1
)

echo 📋 Verificando dependências...

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm não encontrado. Instale npm primeiro.
    pause
    exit /b 1
)

echo ✅ Dependências OK

echo 📦 Instalando dependências do projeto...
npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo 🗄️ Gerando Prisma Client...
npx prisma generate
if errorlevel 1 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)

echo 🔄 Executando migrações do banco...
npx prisma migrate deploy
if errorlevel 1 (
    echo ❌ Erro ao executar migrações
    pause
    exit /b 1
)

echo 🌱 Executando push do schema...
npx prisma db push
if errorlevel 1 (
    echo ❌ Erro ao fazer push do schema
    pause
    exit /b 1
)

echo ✅ Configuração concluída com sucesso!
echo.
echo 🚀 Para iniciar o servidor de desenvolvimento:
echo npm run dev
echo.
echo 🎯 Para abrir o Prisma Studio (visualizar/editar dados):
echo npx prisma studio
echo.
echo 🐳 Para usar com Docker:
echo docker-compose up --build
echo.
pause