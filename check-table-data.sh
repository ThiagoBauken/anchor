#!/bin/bash
# Verificar se as tabelas têm dados (rows)

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "=== CONTANDO REGISTROS EM TODAS AS TABELAS ==="

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

SELECT 'Company' as tabela, COUNT(*) as registros FROM "Company"
UNION ALL
SELECT 'User', COUNT(*) FROM "User"  
UNION ALL
SELECT 'Location', COUNT(*) FROM "Location"
UNION ALL  
SELECT 'Project', COUNT(*) FROM "Project"
UNION ALL
SELECT 'anchor_points', COUNT(*) FROM anchor_points
UNION ALL
SELECT 'anchor_tests', COUNT(*) FROM anchor_tests
UNION ALL
SELECT 'user_invitations', COUNT(*) FROM user_invitations
UNION ALL
SELECT 'files', COUNT(*) FROM files
UNION ALL
SELECT 'sync_queue', COUNT(*) FROM sync_queue
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'company_settings', COUNT(*) FROM company_settings
ORDER BY registros DESC;

EOF

echo ""
echo "=== VERIFICANDO DADOS DEMO ESPECÍFICOS ==="

psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT 'COMPANIES:' as info; SELECT id, name FROM \"Company\" LIMIT 5;"

psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT 'USERS:' as info; SELECT id, name, role FROM \"User\" LIMIT 5;"

psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT 'PROJECTS:' as info; SELECT id, name FROM \"Project\" LIMIT 5;"