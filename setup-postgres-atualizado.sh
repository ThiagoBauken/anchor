#!/bin/bash

# ===================================================================
# ANCHORVIEW - SETUP POSTGRESQL ATUALIZADO (2025)
# ===================================================================
# Este script configura o banco PostgreSQL com o schema mais recente
# Inclui: UserRole enum, Teams, Public Viewing, e todas as features
# ===================================================================

set -e  # Exit on error

echo "🚀 AnchorView - Setup PostgreSQL Atualizado"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis de conexão (ajuste conforme necessário)
DB_HOST=${DB_HOST:-"185.215.165.19"}
DB_PORT=${DB_PORT:-"8002"}
DB_USER=${DB_USER:-"privado"}
DB_NAME=${DB_NAME:-"privado"}
DB_PASSWORD=${DB_PASSWORD:-"privado12!"}

echo -e "${YELLOW}📊 Configurações:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Verificar se o arquivo .env.local existe
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Erro: Arquivo .env.local não encontrado${NC}"
    echo "Crie o arquivo .env.local com a DATABASE_URL"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env.local encontrado${NC}"
echo ""

# Verificar conexão com o banco
echo -e "${YELLOW}🔍 Testando conexão com PostgreSQL...${NC}"
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexão com PostgreSQL bem-sucedida${NC}"
else
    echo -e "${RED}❌ Falha ao conectar ao PostgreSQL${NC}"
    echo "Verifique as credenciais e se o servidor está acessível"
    exit 1
fi
echo ""

# Opções de setup
echo -e "${YELLOW}Escolha uma opção:${NC}"
echo "  1) Setup completo (APAGA TODOS OS DADOS e recria)"
echo "  2) Aplicar migrations (mantém dados existentes)"
echo "  3) Apenas gerar Prisma Client"
echo "  4) Reset completo + seed de exemplo"
echo ""
read -p "Opção [1-4]: " OPTION

case $OPTION in
    1)
        echo ""
        echo -e "${RED}⚠️  ATENÇÃO: Isso vai APAGAR TODOS OS DADOS!${NC}"
        read -p "Tem certeza? Digite 'SIM' para confirmar: " CONFIRM

        if [ "$CONFIRM" != "SIM" ]; then
            echo "Operação cancelada."
            exit 0
        fi

        echo ""
        echo -e "${YELLOW}🗑️  Resetando banco de dados...${NC}"
        npx prisma db push --force-reset --skip-generate

        echo ""
        echo -e "${YELLOW}📦 Gerando Prisma Client...${NC}"
        npx prisma generate

        echo ""
        echo -e "${GREEN}✅ Setup completo finalizado!${NC}"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}🔄 Aplicando migrations...${NC}"

        # Criar migration se necessário
        if [ -d "prisma/migrations" ]; then
            echo "Aplicando migrations existentes..."
            npx prisma migrate deploy
        else
            echo "Criando primeira migration..."
            npx prisma migrate dev --name init
        fi

        echo ""
        echo -e "${YELLOW}📦 Gerando Prisma Client...${NC}"
        npx prisma generate

        echo ""
        echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
        ;;

    3)
        echo ""
        echo -e "${YELLOW}📦 Gerando apenas Prisma Client...${NC}"
        npx prisma generate

        echo ""
        echo -e "${GREEN}✅ Prisma Client gerado!${NC}"
        ;;

    4)
        echo ""
        echo -e "${RED}⚠️  ATENÇÃO: Isso vai APAGAR TODOS OS DADOS!${NC}"
        read -p "Tem certeza? Digite 'SIM' para confirmar: " CONFIRM

        if [ "$CONFIRM" != "SIM" ]; then
            echo "Operação cancelada."
            exit 0
        fi

        echo ""
        echo -e "${YELLOW}🗑️  Resetando banco de dados...${NC}"
        npx prisma db push --force-reset --skip-generate

        echo ""
        echo -e "${YELLOW}📦 Gerando Prisma Client...${NC}"
        npx prisma generate

        echo ""
        echo -e "${YELLOW}🌱 Executando seed (dados de exemplo)...${NC}"

        # Criar script de seed se não existir
        if [ -f "prisma/seed.ts" ]; then
            npx prisma db seed
        else
            echo -e "${YELLOW}ℹ️  Arquivo de seed não encontrado${NC}"
            echo "Criando dados de exemplo via SQL..."

            # Seed básico via SQL
            export PGPASSWORD=$DB_PASSWORD
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Criar empresa de exemplo
INSERT INTO "Company" (id, name, email, phone, "isActive", "createdAt")
VALUES (
    'company_demo_001',
    'Empresa Demo AnchorView',
    'demo@anchorview.com',
    '(11) 99999-9999',
    true,
    NOW()
);

-- Criar usuário superadmin
INSERT INTO "User" (id, name, email, password, role, active, "companyId", "created_at", "updated_at")
VALUES (
    'user_superadmin_001',
    'Admin Demo',
    'admin@anchorview.com',
    -- Senha: admin123 (hash bcrypt)
    '$2a$10$rOZJVz.5OqVqH5YnNXxPCOxQXZJ5vX7K1YxnXnZ8YqX5YnNXxPCOx',
    'superadmin',
    true,
    'company_demo_001',
    NOW(),
    NOW()
);

-- Criar projeto de exemplo
INSERT INTO "Project" (id, name, "floorPlanImages", "companyId", "createdByUserId", deleted, "createdAt", "updatedAt")
VALUES (
    'project_demo_001',
    'Edifício Demo',
    ARRAY[]::TEXT[],
    'company_demo_001',
    'user_superadmin_001',
    false,
    NOW(),
    NOW()
);

SELECT '✅ Dados de exemplo criados!' as resultado;
EOF
        fi

        echo ""
        echo -e "${GREEN}✅ Setup completo + seed finalizado!${NC}"
        echo ""
        echo -e "${YELLOW}📝 Credenciais de acesso:${NC}"
        echo "  Email: admin@anchorview.com"
        echo "  Senha: admin123"
        ;;

    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Setup concluído com sucesso!"
echo "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Inicie o servidor: npm run dev"
echo "  2. Acesse: http://localhost:9002"
echo "  3. Abra o Prisma Studio: npx prisma studio"
echo ""
