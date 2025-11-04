#!/bin/bash

# Script para configurar banco PostgreSQL para AnchorView
# Execute este script para criar todas as tabelas necessárias

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Configurando banco PostgreSQL para AnchorView...${NC}"

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Erro: DATABASE_URL não está definida${NC}"
    echo "Configure a variável DATABASE_URL no arquivo .env"
    echo "Exemplo: DATABASE_URL=\"postgresql://usuario:senha@localhost:5432/anchorview\""
    exit 1
fi

echo -e "${YELLOW}📋 Verificando dependências...${NC}"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js primeiro.${NC}"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado. Instale npm primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências OK${NC}"

echo -e "${YELLOW}📦 Instalando dependências do projeto...${NC}"
npm install

echo -e "${YELLOW}🗄️ Gerando Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}🔄 Executando migrações do banco...${NC}"
npx prisma migrate deploy

echo -e "${YELLOW}🌱 Populando banco com dados iniciais...${NC}"

# Comando SQL para inserir dados iniciais
INIT_SQL="
-- Inserir empresa padrão
INSERT INTO \"Company\" (id, name) 
VALUES ('clx3i4a7x000008l4hy822g62', 'Empresa Padrão')
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário admin padrão
INSERT INTO \"User\" (id, name, role, \"companyId\") 
VALUES ('admin-default-user', 'Administrador', 'admin', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT (id) DO NOTHING;

-- Inserir localizações padrão
INSERT INTO \"Location\" (id, name, \"markerShape\", \"companyId\") VALUES
('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'),
('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'),
('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62')
ON CONFLICT (id) DO NOTHING;
"

# Executar SQL usando psql se disponível, senão usar Prisma
if command -v psql &> /dev/null; then
    echo "$INIT_SQL" | psql "$DATABASE_URL"
else
    echo -e "${YELLOW}📝 psql não disponível, usando Prisma DB push...${NC}"
    npx prisma db push
    echo "Você pode inserir dados iniciais manualmente através do Prisma Studio:"
    echo "npx prisma studio"
fi

echo -e "${GREEN}✅ Configuração concluída com sucesso!${NC}"
echo ""
echo -e "${GREEN}🚀 Para iniciar o servidor de desenvolvimento:${NC}"
echo "npm run dev"
echo ""
echo -e "${GREEN}🎯 Para abrir o Prisma Studio (visualizar/editar dados):${NC}"
echo "npx prisma studio"
echo ""
echo -e "${GREEN}🐳 Para usar com Docker:${NC}"
echo "docker-compose up --build"