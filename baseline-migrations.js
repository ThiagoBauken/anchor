const { execSync } = require('child_process');

const migrations = [
  '20250818000000_create_base_tables',
  '20250819000000_add_core_tables',
  '20250819000001_add_user_phone',
  '20250820000000_add_subscription_tables',
  '20250820000001_add_useful_functions',
  '20250820000002_add_performance_indexes',
  '20250820000003_add_all_remaining_tables',
  '20250820000004_add_all_functions_procedures_triggers',
  '20250820000005_add_compatibility_fields',
  '20250820000006_add_superadmin_auth',
  '20250820000007_add_system_monitoring_backup',
  '20250820000008_fix_locations_per_project'
];

console.log('Baselining existing database migrations...\n');

for (const migration of migrations) {
  try {
    console.log(`Marking ${migration} as applied...`);
    execSync(`npx prisma migrate resolve --applied "${migration}"`, { stdio: 'inherit' });
    console.log(`✓ ${migration} marked as applied\n`);
  } catch (error) {
    console.error(`✗ Failed to mark ${migration} as applied:`, error.message);
    process.exit(1);
  }
}

console.log('All migrations have been baselined successfully!');
