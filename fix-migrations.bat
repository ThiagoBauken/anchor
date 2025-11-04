@echo off
echo ====================================
echo CORRIGINDO E RESETANDO BANCO DE DADOS
echo ====================================
echo.

echo Passo 1: Removendo banco existente...
echo DROP SCHEMA public CASCADE; CREATE SCHEMA public; | psql -h 185.215.165.19 -p 8002 -U privado -d privado

echo.
echo Passo 2: Executando migrações Prisma...
npx prisma migrate deploy

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO! Banco criado com:
    echo - 23 tabelas completas
    echo - Todas as colunas
    echo - 47+ funções
    echo - Todos os triggers e views
) else (
    echo.
    echo ❌ ERRO! Verifique as mensagens acima.
)

pause