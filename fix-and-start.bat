@echo off
echo =========================================
echo   CORRIGINDO TODOS OS ERROS DE PRODUCAO  
echo =========================================
echo.

echo 1. Parando servidor de desenvolvimento...
taskkill /f /im node.exe 2>nul
echo.

echo 2. Limpando cache e builds...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo.

echo 3. Corrigindo migracoes do Prisma...
npx prisma migrate resolve --applied "20250818000000_create_base_tables"
npx prisma migrate resolve --applied "20250819000000_add_core_tables" 
npx prisma migrate resolve --applied "20250819000001_add_user_phone"
npx prisma migrate resolve --applied "20250820000000_add_subscription_tables"
npx prisma migrate resolve --applied "20250820000001_add_useful_functions"
npx prisma migrate resolve --applied "20250820000002_add_performance_indexes"
npx prisma migrate resolve --applied "20250820000003_add_all_remaining_tables"
npx prisma migrate resolve --applied "20250820000004_add_all_functions_procedures_triggers"
npx prisma migrate resolve --applied "20250820000005_add_compatibility_fields"
npx prisma migrate resolve --applied "20250820000006_add_superadmin_auth"
npx prisma migrate resolve --applied "20250820000007_add_system_monitoring_backup"
npx prisma migrate resolve --applied "20250820000008_fix_locations_per_project"
echo.

echo 4. Fazendo deploy das migracoes...
npx prisma migrate deploy
echo.

echo 5. Gerando cliente Prisma...
npx prisma generate
echo.

echo 6. Iniciando servidor de desenvolvimento...
npm run dev