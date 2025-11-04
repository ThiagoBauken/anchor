#!/bin/bash
# Comandos para criar/corrigir tabelas PostgreSQL

# Configurar credenciais
printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

# Executar correções SQL
psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- =============================================
-- CRIAR/CORRIGIR TABELAS POSTGRESQL
-- =============================================

-- 1. Adicionar colunas faltantes
ALTER TABLE anchor_points ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_teste TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_pronto TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS ponto_id TEXT;

-- 2. Verificar/Adicionar foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'anchor_tests_ponto_id_fkey'
    ) THEN
        ALTER TABLE anchor_tests 
        ADD CONSTRAINT anchor_tests_ponto_id_fkey 
        FOREIGN KEY (ponto_id) REFERENCES anchor_points(id);
    END IF;
END $$;

-- 3. Verificar estrutura das tabelas
\echo '=== ANCHOR POINTS COLUMNS ==='
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_points' 
ORDER BY ordinal_position;

\echo '=== ANCHOR TESTS COLUMNS ==='
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_tests' 
ORDER BY ordinal_position;

\echo '=== USER ROLE CONSTRAINTS ==='
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';

\echo '=== TABLES CREATED/UPDATED SUCCESSFULLY ==='

EOF

echo "✅ Correções aplicadas com sucesso!"