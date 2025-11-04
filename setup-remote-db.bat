@echo off
REM Script para configurar banco PostgreSQL remoto no Windows

echo 🔧 Configurando banco PostgreSQL remoto...
echo Host: 185.215.165.19:8000
echo Database: mago
echo User: arena
echo.

echo === Usando Prisma (RECOMENDADO) ===
echo.

echo 1. Instalando dependências...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo.
echo 2. Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)

echo.
echo 3. Criando tabelas no banco remoto...
call npx prisma db push
if errorlevel 1 (
    echo ❌ Erro ao criar tabelas
    echo Verifique a conexão com o banco de dados
    pause
    exit /b 1
)

echo.
echo ✅ Configuração concluída com sucesso!
echo.
echo Para verificar as tabelas criadas, execute:
echo npx prisma studio
echo.
echo Para iniciar o servidor de desenvolvimento:
echo npm run dev
echo.
pause