#!/bin/bash
# Verificar se tabelas principais têm todas as colunas necessárias

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "=== VERIFICANDO COLUNAS DAS TABELAS PRINCIPAIS ==="

echo "--- ANCHOR_POINTS ---"
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'anchor_points' ORDER BY ordinal_position;"

echo ""
echo "--- ANCHOR_TESTS ---"  
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'anchor_tests' ORDER BY ordinal_position;"

echo ""
echo "--- USER (verificar constraint de role) ---"
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%role%';"

echo ""
echo "--- PROJECT ---"
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Project' ORDER BY ordinal_position;"