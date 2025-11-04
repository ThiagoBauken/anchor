@echo off
echo ========================================
echo Corrigindo estrutura do banco de dados
echo ========================================
echo.

echo 1. Regenerando cliente Prisma...
call npx prisma generate

echo.
echo 2. Corrigindo banco de dados e populando dados...
call node fix-database.js

echo.
echo ========================================
echo Correções aplicadas com sucesso!
echo ========================================
echo.
echo Agora você pode:
echo - Fazer login com: admin@admin.com / admin123
echo - Ou criar uma nova conta na página de registro
echo.
echo Por favor, reinicie o servidor com: npm run dev
pause