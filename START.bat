@echo off
echo ========================================
echo   AnchorView - Desenvolvimento Local
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao instalado!
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando pnpm...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm nao encontrado. Instalando...
    npm install -g pnpm
    echo pnpm instalado com sucesso!
) else (
    pnpm --version
)

echo.
echo [3/4] Instalando dependencias (primeira vez pode demorar 2-5min)...
call pnpm install
if %errorlevel% neq 0 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [4/4] Gerando Prisma Client...
call pnpm prisma generate
if %errorlevel% neq 0 (
    echo AVISO: Erro ao gerar Prisma Client
    echo Continuando mesmo assim...
)

echo.
echo ========================================
echo   Iniciando Servidor de Desenvolvimento
echo ========================================
echo.
echo Acesse: http://localhost:9002
echo.
echo Pressione Ctrl+C para parar
echo ========================================
echo.

call pnpm dev

pause
