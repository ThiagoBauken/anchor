#!/bin/bash
# Verificar se as colunas de FOTO existem

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

echo "=== VERIFICANDO COLUNAS DE FOTO ==="

echo "1. ANCHOR_POINTS - deve ter coluna 'foto':"
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'anchor_points' AND column_name LIKE '%foto%';"

echo ""
echo "2. ANCHOR_TESTS - deve ter 'foto_teste' e 'foto_pronto':"  
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'anchor_tests' AND column_name LIKE '%foto%';"

echo ""
echo "3. ANCHOR_TESTS - deve ter 'ponto_id':"
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'anchor_tests' AND column_name = 'ponto_id';"

echo ""
echo "=== ESTRUTURA COMPLETA ANCHOR_POINTS ==="
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'anchor_points' ORDER BY ordinal_position;"

echo ""
echo "=== ESTRUTURA COMPLETA ANCHOR_TESTS ==="
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'anchor_tests' ORDER BY ordinal_position;"