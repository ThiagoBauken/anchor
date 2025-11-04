@echo off
echo ============================================
echo   CORRIGINDO ERRO MOBILE - MODULE DATA
echo ============================================
echo.

echo 1. Parando processos Node.js...
taskkill /f /im node.exe >nul 2>&1

echo 2. Removendo caches Next.js...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 3. Removendo arquivos data problematicos...
if exist src\app\data.ts del /f /q src\app\data.ts
if exist src\app\data rmdir /s /q src\app\data

echo 4. Regenerando Prisma client...
call npx prisma generate

echo 5. Limpando cache do navegador automaticamente...
echo    - Limpe o cache do navegador mobile manualmente
echo    - Ou use aba anonima/privada

echo.
echo ============================================
echo   AGORA EXECUTE: npm run dev
echo ============================================
echo   E acesse em aba anonima/privada
echo ============================================
pause