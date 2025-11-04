#!/bin/bash

# =================================================================
# COMANDOS BASH PARA CRIAR TABELAS NO POSTGRESQL - ANCHORVIEW
# =================================================================

# Configurações do banco (modifique conforme necessário)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="anchorview"
DB_USER="postgres"
# DB_PASS="sua_senha"  # Descomente e configure se necessário

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}       CONFIGURAÇÃO DO POSTGRESQL PARA ANCHORVIEW                ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# =================================================================
# OPÇÃO 1: USAR COMANDO PSQL DIRETO
# =================================================================
echo -e "${GREEN}▶ Método 1: Usando psql diretamente${NC}"
echo -e "${YELLOW}Execute um dos comandos abaixo:${NC}"
echo ""

# Comando 1: Com arquivo SQL
echo -e "${BLUE}# Se você tem o arquivo create-tables.sql:${NC}"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create-tables.sql"
echo ""

# Comando 2: Comando único inline
echo -e "${BLUE}# Ou execute tudo em um comando só:${NC}"
cat << 'EOF'
psql -h localhost -p 5432 -U postgres -d anchorview << SQL_SCRIPT

-- Criar tabelas
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" TEXT NOT NULL REFERENCES "Company"("id")
);

CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL,
    "companyId" TEXT NOT NULL REFERENCES "Company"("id")
);

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"("id"),
    "createdByUserId" TEXT NOT NULL REFERENCES "User"("id"),
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

-- Inserir dados iniciais
INSERT INTO "Company" VALUES ('clx3i4a7x000008l4hy822g62', 'Empresa Padrão') ON CONFLICT DO NOTHING;
INSERT INTO "User" VALUES ('admin-default-user', 'Administrador', 'admin', 'clx3i4a7x000008l4hy822g62') ON CONFLICT DO NOTHING;
INSERT INTO "Location" VALUES 
    ('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'),
    ('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'),
    ('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT DO NOTHING;

SQL_SCRIPT
EOF

echo ""
echo -e "${BLUE}==================================================================${NC}"

# =================================================================
# OPÇÃO 2: USAR PRISMA
# =================================================================
echo ""
echo -e "${GREEN}▶ Método 2: Usando Prisma (recomendado)${NC}"
echo -e "${YELLOW}Execute os comandos na ordem:${NC}"
echo ""

echo "# 1. Instalar dependências"
echo "npm install"
echo ""

echo "# 2. Gerar Prisma Client"
echo "npx prisma generate"
echo ""

echo "# 3. Criar/atualizar tabelas baseado no schema"
echo "npx prisma db push"
echo ""

echo "# 4. (Opcional) Criar migration"
echo "npx prisma migrate dev --name init"
echo ""

echo -e "${BLUE}==================================================================${NC}"

# =================================================================
# OPÇÃO 3: DOCKER
# =================================================================
echo ""
echo -e "${GREEN}▶ Método 3: Usando Docker${NC}"
echo -e "${YELLOW}Para criar um PostgreSQL com Docker:${NC}"
echo ""

cat << 'EOF'
# Criar container PostgreSQL
docker run --name anchorview-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=anchorview \
  -p 5432:5432 \
  -d postgres:15

# Aguardar banco iniciar
sleep 5

# Executar SQL no container
docker exec -i anchorview-db psql -U postgres -d anchorview < create-tables.sql
EOF

echo ""
echo -e "${BLUE}==================================================================${NC}"

# =================================================================
# VARIÁVEIS DE AMBIENTE
# =================================================================
echo ""
echo -e "${GREEN}▶ Configuração do .env${NC}"
echo -e "${YELLOW}Adicione ao arquivo .env:${NC}"
echo ""
echo "DATABASE_URL=\"postgresql://$DB_USER:SUA_SENHA@$DB_HOST:$DB_PORT/$DB_NAME?schema=public\""
echo ""

echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}✅ Comandos prontos para uso!${NC}"
echo -e "${BLUE}==================================================================${NC}"