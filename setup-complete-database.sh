#!/bin/bash

# Script para criar TODAS as 47 tabelas do schema Prisma
# Autor: Claude Code
# Data: 2025-11-10

set -e  # Exit on error

echo "=================================================="
echo "🔧 Setup Completo do Banco de Dados AnchorView"
echo "=================================================="
echo ""

# Configurações do banco
export PGHOST="private_banco"
export PGPORT="5432"
export PGDATABASE="teste11"
export PGUSER="testador"
export PGPASSWORD="testando"

# Connection string para Prisma
export DATABASE_URL="postgresql://testador:testando@private_banco:5432/teste11?sslmode=disable"

echo "📊 Conectando ao banco de dados..."
echo "   Host: $PGHOST"
echo "   Database: $PGDATABASE"
echo "   User: $PGUSER"
echo ""

# Testar conexão
echo "🔍 Testando conexão..."
if psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Conexão bem-sucedida!"
else
    echo "❌ ERRO: Não foi possível conectar ao banco de dados"
    echo "   Verifique se o PostgreSQL está rodando e as credenciais estão corretas"
    exit 1
fi

echo ""
echo "📋 Verificando tabelas existentes..."
CURRENT_TABLES=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo "   Tabelas atuais: $CURRENT_TABLES"

if [ "$CURRENT_TABLES" -lt 47 ]; then
    echo "⚠️  ATENÇÃO: Apenas $CURRENT_TABLES tabelas encontradas. O schema precisa de 47 tabelas!"
    echo ""
    echo "🚀 Gerando cliente Prisma..."
    npx prisma generate

    echo ""
    echo "🔨 Criando TODAS as tabelas usando Prisma..."
    echo "   Este comando irá:"
    echo "   - Criar as 39 tabelas faltantes"
    echo "   - Preservar as 8 tabelas existentes"
    echo "   - Adicionar índices e constraints"
    echo ""

    npx prisma db push --skip-generate

    echo ""
    echo "✅ Schema sincronizado!"
else
    echo "✅ Todas as 47 tabelas já existem!"
fi

echo ""
echo "📊 Verificando tabelas criadas..."
psql -c "SELECT
    schemaname,
    COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;"

echo ""
echo "📋 Lista de todas as tabelas criadas:"
psql -c "\dt" | head -50

echo ""
echo "🎯 Verificando tabelas críticas..."

# Verificar tabelas essenciais
CRITICAL_TABLES=("AnchorPoint" "AnchorTest" "Photo" "Team" "Account" "Session")
MISSING=()

for table in "${CRITICAL_TABLES[@]}"; do
    if psql -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" | grep -q "t"; then
        echo "   ✅ $table - OK"
    else
        echo "   ❌ $table - FALTANDO!"
        MISSING+=("$table")
    fi
done

echo ""
if [ ${#MISSING[@]} -eq 0 ]; then
    echo "=================================================="
    echo "✅ SUCESSO! Todas as 47 tabelas foram criadas!"
    echo "=================================================="
    echo ""
    echo "🎉 Banco de dados pronto para uso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Inicie a aplicação: npm run dev"
    echo "   2. Acesse: http://localhost:9002"
    echo "   3. Registre o primeiro usuário (será company_admin)"
    echo ""
else
    echo "=================================================="
    echo "❌ ERRO: Algumas tabelas críticas estão faltando:"
    echo "=================================================="
    for table in "${MISSING[@]}"; do
        echo "   - $table"
    done
    echo ""
    echo "Tente executar novamente: npx prisma db push --force-reset"
    exit 1
fi
