-- Migration: Add Floor Plans Support
-- Execute este SQL diretamente no PostgreSQL

-- 1. Criar tabela floor_plans
CREATE TABLE IF NOT EXISTS "floor_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "floor_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Criar índice para project_id
CREATE INDEX IF NOT EXISTS "floor_plans_project_id_idx" ON "floor_plans"("project_id");

-- 3. Adicionar campo floor_plan_id na tabela anchor_points
ALTER TABLE "anchor_points" ADD COLUMN IF NOT EXISTS "floor_plan_id" TEXT;

-- 4. Adicionar foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'anchor_points_floor_plan_id_fkey'
    ) THEN
        ALTER TABLE "anchor_points"
        ADD CONSTRAINT "anchor_points_floor_plan_id_fkey"
        FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Verificação (opcional - para conferir se funcionou)
SELECT
    'floor_plans table' as item,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'floor_plans'
UNION ALL
SELECT
    'floor_plan_id column' as item,
    COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'anchor_points' AND column_name = 'floor_plan_id';

-- Pronto! Agora você pode usar múltiplas plantas baixas.
