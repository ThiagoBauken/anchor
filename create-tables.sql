-- Script SQL para criar todas as tabelas do AnchorView
-- Execute com: psql -U seu_usuario -d seu_banco -f create-tables.sql

-- Criar tabela Company
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Criar tabela User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Criar tabela Location
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- Criar tabela Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "obraAddress" TEXT,
    "obraCEP" TEXT,
    "obraCNPJ" TEXT,
    "contratanteName" TEXT,
    "contratanteAddress" TEXT,
    "contratanteCEP" TEXT,
    "cnpjContratado" TEXT,
    "contato" TEXT,
    "valorContrato" TEXT,
    "dataInicio" TEXT,
    "dataTermino" TEXT,
    "responsavelTecnico" TEXT,
    "registroCREA" TEXT,
    "tituloProfissional" TEXT,
    "numeroART" TEXT,
    "rnp" TEXT,
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT,
    "dispositivoDeAncoragemPadrao" TEXT,
    "scalePixelsPerMeter" DOUBLE PRECISION,
    "dwgRealWidth" DOUBLE PRECISION,
    "dwgRealHeight" DOUBLE PRECISION,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "Location_companyId_idx" ON "Location"("companyId");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "Project_createdByUserId_idx" ON "Project"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Project_deleted_idx" ON "Project"("deleted");

-- Adicionar chaves estrangeiras
ALTER TABLE "User" 
    ADD CONSTRAINT "User_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES "Company"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

ALTER TABLE "Location" 
    ADD CONSTRAINT "Location_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES "Company"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

ALTER TABLE "Project" 
    ADD CONSTRAINT "Project_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES "Company"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

ALTER TABLE "Project" 
    ADD CONSTRAINT "Project_createdByUserId_fkey" 
    FOREIGN KEY ("createdByUserId") 
    REFERENCES "User"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

-- Inserir dados iniciais
INSERT INTO "Company" ("id", "name") 
VALUES ('clx3i4a7x000008l4hy822g62', 'Empresa Padrão')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "name", "role", "companyId") 
VALUES ('admin-default-user', 'Administrador', 'admin', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Location" ("id", "name", "markerShape", "companyId") VALUES
('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'),
('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'),
('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT ("id") DO NOTHING;

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas com sucesso!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Company', 'User', 'Location', 'Project');