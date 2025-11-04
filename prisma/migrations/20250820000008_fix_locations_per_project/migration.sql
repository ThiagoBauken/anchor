-- FixLocationsPerProject
-- Corrige sistema de localizações para ser específico por projeto

-- Adiciona coluna projectId à tabela Location
ALTER TABLE "Location" ADD COLUMN "project_id" TEXT;

-- Cria índice para performance
CREATE INDEX "Location_project_id_idx" ON "Location"("project_id");

-- Adiciona foreign key para Project
ALTER TABLE "Location" ADD CONSTRAINT "Location_project_id_fkey" 
FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentário explicativo
COMMENT ON COLUMN "Location"."project_id" IS 'Cada projeto tem suas próprias localizações específicas';

-- IMPORTANTE: Após executar esta migration, você precisa:
-- 1. Atualizar dados existentes para associar localizações aos projetos corretos
-- 2. Tornar a coluna project_id NOT NULL depois de popular os dados
-- 3. Atualizar as interfaces de criação/edição de localizações