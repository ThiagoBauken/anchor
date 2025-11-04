@echo off
echo =========================================
echo   CORRIGINDO TODOS OS ERROS DE PRODUCAO
echo =========================================

echo.
echo 1. Parando servidor de desenvolvimento...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Limpando cache do Next.js...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo.
echo 3. Gerando cliente Prisma...
call npx prisma generate

echo.
echo 4. Aplicando migracoes pendentes...
call npx prisma migrate deploy

echo.
echo 5. Resetando cache do npm...
npm cache clean --force

echo.
echo 6. Reinstalando dependencias...
npm install

echo.
echo 7. Compilando para producao...
npm run build

echo.
echo =========================================
echo   CORRECAO COMPLETA!
echo =========================================
echo.
echo Para iniciar em modo de desenvolvimento:
echo   npm run dev
echo.
echo Para iniciar em modo de producao:
echo   npm start
echo.
pause