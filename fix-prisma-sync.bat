@echo off
echo ========================================
echo   CORRIGINDO SINCRONIZACAO PRISMA
echo ========================================
echo.

echo [1/5] Parando desenvolvimento...
taskkill /F /IM node.exe 2>nul

echo [2/5] Limpando cache do Next.js...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo [3/5] Regenerando Prisma Client...
call npx prisma generate

echo [4/5] Verificando schema com banco...
call npx prisma db pull

echo [5/5] Aplicando migrations...
call npx prisma migrate deploy

echo.
echo ========================================
echo   CONCLUIDO! Reinicie com: npm run dev
echo ========================================
pause