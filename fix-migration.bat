@echo off
echo Corrigindo migracoes do Prisma...
echo.

REM Resolver todas as migracoes como ja aplicadas
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
echo Agora fazendo deploy das migracoes...
npx prisma migrate deploy

echo.
echo Migracao concluida!
pause