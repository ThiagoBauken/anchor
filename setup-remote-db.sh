#!/bin/bash

# Script para configurar banco PostgreSQL remoto
# Credenciais do banco
DB_USER="arena"
DB_PASS="d55bd2a81e4cf223a037"
DB_NAME="mago"
DB_HOST="185.215.165.19"
DB_PORT="8000"

echo "🔧 Configurando banco PostgreSQL remoto..."
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo ""

# Opção 1: Usando PSQL direto
echo "=== Opção 1: Comando PSQL direto ==="
echo "Execute este comando:"
echo ""
cat << 'EOF'
PGPASSWORD=d55bd2a81e4cf223a037 psql -h 185.215.165.19 -p 8000 -U arena -d mago << SQL
-- Criar tabelas
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    "dwgRealHeight" DOUBLE PRECISION
);

-- Adicionar foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" 
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inserir dados iniciais
INSERT INTO "Company" VALUES ('clx3i4a7x000008l4hy822g62', 'Empresa Padrão') 
ON CONFLICT DO NOTHING;

INSERT INTO "User" VALUES ('admin-default-user', 'Administrador', 'admin', 'clx3i4a7x000008l4hy822g62') 
ON CONFLICT DO NOTHING;

INSERT INTO "Location" VALUES 
    ('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'),
    ('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'),
    ('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT DO NOTHING;

SELECT 'Tabelas criadas com sucesso!' AS status;
SQL
EOF

echo ""
echo "=== Opção 2: Usando Prisma (RECOMENDADO) ==="
echo "Execute os comandos:"
echo ""
echo "# 1. Instalar dependências"
echo "npm install"
echo ""
echo "# 2. Gerar Prisma Client"
echo "npx prisma generate"
echo ""
echo "# 3. Criar tabelas no banco remoto"
echo "npx prisma db push"
echo ""
echo "# 4. Verificar tabelas criadas"
echo "npx prisma studio"
echo ""
echo "✅ Configuração pronta!"