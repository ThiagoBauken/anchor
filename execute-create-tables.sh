#!/bin/bash
# Script para criar TODAS as 47 tabelas no PostgreSQL
# Database: teste11
# User: testador
# Host: private_banco

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo "🚀 Criando Schema Completo do AnchorView"
echo "==================================================${NC}"
echo ""

# Configurações do banco
export PGHOST="private_banco"
export PGDATABASE="teste11"
export PGUSER="testador"
export PGPASSWORD="testando"

echo -e "${YELLOW}📊 Banco de Dados:${NC}"
echo "   Host: $PGHOST"
echo "   Database: $PGDATABASE"
echo "   User: $PGUSER"
echo ""

# Contar tabelas antes
echo -e "${YELLOW}🔍 Verificando estado atual...${NC}"
TABELAS_ANTES=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | xargs)
echo "   Tabelas existentes: $TABELAS_ANTES"
echo ""

# Executar SQL
echo -e "${YELLOW}🔨 Executando SQL (1167 linhas, 47 tabelas)...${NC}"
if psql -f /home/user/anchor/create-all-tables.sql > /tmp/create-tables-output.log 2>&1; then
    echo -e "${GREEN}✅ SQL executado com sucesso!${NC}"
else
    echo -e "${RED}❌ ERRO ao executar SQL!${NC}"
    echo ""
    echo "Log de erro:"
    cat /tmp/create-tables-output.log
    exit 1
fi

echo ""

# Contar tabelas depois
echo -e "${YELLOW}📊 Verificando resultado...${NC}"
TABELAS_DEPOIS=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | xargs)
TABELAS_CRIADAS=$((TABELAS_DEPOIS - TABELAS_ANTES))

echo "   Tabelas antes: $TABELAS_ANTES"
echo "   Tabelas depois: $TABELAS_DEPOIS"
echo "   Tabelas criadas: $TABELAS_CRIADAS"
echo ""

if [ "$TABELAS_DEPOIS" -ge 47 ]; then
    echo -e "${GREEN}✅ SUCESSO! Schema completo criado!${NC}"
else
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esperado 47+ tabelas, encontrado $TABELAS_DEPOIS${NC}"
fi

echo ""
echo -e "${YELLOW}🎯 Verificando tabelas críticas...${NC}"
psql -c "
SELECT
    CASE
        WHEN tablename IN ('anchor_points', 'anchor_tests', 'photos', 'teams') THEN '✅'
        ELSE '  '
    END as status,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'Company', 'User', 'Project', 'Location',
    'anchor_points', 'anchor_tests', 'photos',
    'teams', 'team_members', 'project_team_permissions',
    'subscription_plans', 'subscriptions', 'payments'
  )
ORDER BY tablename;
" | head -20

echo ""
echo -e "${YELLOW}📋 Todas as tabelas criadas (primeiras 30):${NC}"
psql -t -c "SELECT '  ' || tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | head -30

echo ""
echo -e "${BLUE}=================================================="
echo "✅ Setup do banco de dados concluído!"
echo "==================================================${NC}"
echo ""
echo -e "${GREEN}🎉 Próximos passos:${NC}"
echo "   1. npx prisma generate"
echo "   2. npm run dev"
echo "   3. Acesse http://localhost:9002"
echo ""
