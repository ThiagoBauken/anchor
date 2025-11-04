-- =============================================
-- EXECUTE ESTE SQL IMEDIATAMENTE NO EASYPANEL
-- =============================================

-- 1. Adicionar colunas de foto faltantes
ALTER TABLE anchor_points ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_teste TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_pronto TEXT;
ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS ponto_id TEXT;

-- 2. Verificar se constraint de foreign key existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'anchor_tests_ponto_id_fkey'
    ) THEN
        -- Adicionar foreign key se não existir
        ALTER TABLE anchor_tests 
        ADD CONSTRAINT anchor_tests_ponto_id_fkey 
        FOREIGN KEY (ponto_id) REFERENCES anchor_points(id);
    END IF;
END $$;

-- 3. Verificar constraints de role
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';

-- 4. Mostrar estrutura atual
SELECT 'anchor_points columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anchor_points' 
ORDER BY ordinal_position;

SELECT 'anchor_tests columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anchor_tests' 
ORDER BY ordinal_position;