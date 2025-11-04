@echo off
echo ========================================
echo   APLICANDO MIGRACOES POSTGRESQL
echo ========================================
cd /d D:\anchor

echo 1. Gerando cliente Prisma...
call npx prisma generate

echo.
echo 2. Aplicando migracoes...
call npx prisma db push --accept-data-loss

echo.
echo 3. Verificando estado do banco...
call npx prisma db pull

echo.
echo ✅ Migracoes aplicadas com sucesso!
pause