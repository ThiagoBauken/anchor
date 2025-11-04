@echo off
echo ========================================
echo    TESTANDO PWA ANCHORVIEW
echo ========================================
cd /d D:\anchor
echo.
echo 1. Instalando dependencias...
call npm install
echo.
echo 2. Gerando cliente Prisma...
call npx prisma generate
echo.
echo 3. Verificando types...
call npm run typecheck
echo.
echo 4. Iniciando servidor desenvolvimento...
echo.
echo PWA estara disponivel em: http://localhost:9002
echo.
call npm run dev