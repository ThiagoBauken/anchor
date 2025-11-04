@echo off
echo =============================================
echo ANCHORVIEW - DATABASE SETUP AUTOMATICO
echo =============================================
echo.

cd /d D:\anchor

echo 1. Verificando tabelas existentes...
set PGPASSWORD=privado12!
psql -U privado -h 185.215.165.19 -p 8002 -d privado -f check-missing-tables.sql

echo.
echo 2. Criando tabelas SaaS faltantes...
psql -U privado -h 185.215.165.19 -p 8002 -d privado -f create-saas-tables.sql

echo.
echo 3. Limpando cache Next.js...
if exist .next rmdir /s /q .next

echo.
echo 4. Limpando cache Prisma...
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma

echo.
echo 5. Regenerando cliente Prisma...
npx prisma generate

echo.
echo 6. Sincronizando schema...
npx prisma db pull

echo.
echo 7. Instalando Mercado Pago...
npm install mercadopago

echo.
echo 8. Testando conexao...
node test-db-connection.js

echo.
echo =============================================
echo SETUP COMPLETO! Execute 'npm run dev' para iniciar
echo =============================================
pause