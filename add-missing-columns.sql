-- =============================================
-- ADICIONAR COLUNAS FALTANTES NO BANCO DE DADOS
-- Execute este SQL no console do EasyPanel
-- =============================================

-- Adicionar coluna foto na tabela anchor_points se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anchor_points' AND column_name = 'foto'
    ) THEN
        ALTER TABLE anchor_points ADD COLUMN foto TEXT;
        RAISE NOTICE 'Coluna foto adicionada à tabela anchor_points';
    ELSE
        RAISE NOTICE 'Coluna foto já existe na tabela anchor_points';
    END IF;
END $$;

-- Verificar e renomear coluna ponto_id para pontoId na tabela anchor_tests
DO $$ 
BEGIN
    -- Verificar se ponto_id existe e pontoId não existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anchor_tests' AND column_name = 'ponto_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anchor_tests' AND column_name = 'pontoId'
    ) THEN
        -- O Prisma mapeia pontoId para ponto_id, então não precisamos renomear
        RAISE NOTICE 'Coluna ponto_id existe e está mapeada corretamente para pontoId no Prisma';
    END IF;
END $$;

-- Adicionar timestamps às tabelas Location e User se não existirem
DO $$ 
BEGIN
    -- Adicionar created_at e updated_at na tabela Location
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Location' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Location" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna createdAt adicionada à tabela Location';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Location' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Location" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna updatedAt adicionada à tabela Location';
    END IF;
END $$;

-- Adicionar trigger para atualizar updatedAt automaticamente na Location
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para Location se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_location_updated_at'
    ) THEN
        CREATE TRIGGER update_location_updated_at 
        BEFORE UPDATE ON "Location" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger para updatedAt criado na tabela Location';
    END IF;
END $$;

-- Verificar estrutura das tabelas principais
SELECT 'anchor_points columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_points' 
ORDER BY ordinal_position;

SELECT 'anchor_tests columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anchor_tests' 
ORDER BY ordinal_position;

SELECT 'Location columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Location' 
ORDER BY ordinal_position;

SELECT 'User columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

SELECT '✅ Verificação de colunas concluída!' as status;