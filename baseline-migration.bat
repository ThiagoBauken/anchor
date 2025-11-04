@echo off
echo Generating Prisma client...
call npx prisma generate

echo.
echo Marking all migrations as baseline...
call npx prisma migrate resolve --applied "20250818000000_create_base_tables"
call npx prisma migrate resolve --applied "20250819000000_add_core_tables"
call npx prisma migrate resolve --applied "20250819000001_add_user_phone"
call npx prisma migrate resolve --applied "20250820000000_add_subscription_tables"
call npx prisma migrate resolve --applied "20250820000001_add_useful_functions"
call npx prisma migrate resolve --applied "20250820000002_add_performance_indexes"
call npx prisma migrate resolve --applied "20250820000003_add_all_remaining_tables"
call npx prisma migrate resolve --applied "20250820000004_add_all_functions_procedures_triggers"
call npx prisma migrate resolve --applied "20250820000005_add_compatibility_fields"
call npx prisma migrate resolve --applied "20250820000006_add_superadmin_auth"
call npx prisma migrate resolve --applied "20250820000007_add_system_monitoring_backup"
call npx prisma migrate resolve --applied "20250820000008_fix_locations_per_project"

echo.
echo All migrations marked as applied!
echo You can now run npm install normally.