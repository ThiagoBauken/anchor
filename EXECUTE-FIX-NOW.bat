@echo off
echo ========================================
echo  CORRECAO COMPLETA PRISMA + BANCO
echo ========================================
echo.

echo [PASSO 1] Parando servicos...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [PASSO 2] Limpando caches antigos...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q node_modules\.prisma 2>nul
rmdir /s /q node_modules\@prisma\client 2>nul
timeout /t 2 /nobreak >nul

echo [PASSO 3] Reinstalando Prisma...
call npm install @prisma/client prisma --save-exact

echo [PASSO 4] Gerando Prisma Client novo...
call npx prisma generate

echo [PASSO 5] Sincronizando schema com banco...
call npx prisma db push --accept-data-loss

echo [PASSO 6] Validando...
call npx prisma validate

echo.
echo ========================================
echo  PRONTO! Execute: npm run dev
echo ========================================
pause