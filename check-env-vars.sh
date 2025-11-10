#!/bin/bash
# Script para verificar variáveis de ambiente necessárias
# Local: /home/user/anchor

set -e

echo "=================================================="
echo "🔍 Verificação de Variáveis de Ambiente"
echo "=================================================="
echo ""

# Função para verificar variável
check_var() {
    local var_name=$1
    local var_value=$2

    if [ -z "$var_value" ]; then
        echo "❌ $var_name - NÃO DEFINIDA"
        return 1
    else
        # Mostrar apenas parte do valor se for senha/secret
        if [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"PASSWORD"* ]]; then
            echo "✅ $var_name - Definida (${#var_value} caracteres)"
        else
            echo "✅ $var_name - $var_value"
        fi
        return 0
    fi
}

# Carregar variáveis do .env
if [ -f "/home/user/anchor/.next/standalone/.env" ]; then
    echo "📁 Carregando de: /home/user/anchor/.next/standalone/.env"
    echo ""
    export $(cat /home/user/anchor/.next/standalone/.env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "❌ Arquivo .env não encontrado em /home/user/anchor/.next/standalone/"
    exit 1
fi

echo "🔑 Variáveis OBRIGATÓRIAS:"
echo "---"

# Variáveis críticas
ERRORS=0

check_var "DATABASE_URL" "$DATABASE_URL" || ((ERRORS++))
check_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" || ((ERRORS++))
check_var "NEXTAUTH_URL" "$NEXTAUTH_URL" || ((ERRORS++))
check_var "JWT_SECRET" "$JWT_SECRET" || ((ERRORS++))
check_var "NODE_ENV" "$NODE_ENV" || ((ERRORS++))

echo ""
echo "📊 Variáveis OPCIONAIS:"
echo "---"

check_var "GEMINI_API_KEY" "$GEMINI_API_KEY" || echo "⚠️  GEMINI_API_KEY vazia (funcionalidades de IA desabilitadas)"
check_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" || echo "⚠️  GOOGLE_CLIENT_ID vazia (OAuth Google desabilitado)"

echo ""
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ SUCESSO! Todas as variáveis obrigatórias estão definidas"
    echo "=================================================="
    echo ""
    echo "🎯 Próximos passos:"
    echo "   1. Rebuild: npm run build"
    echo "   2. Restart: npm run dev (ou pm2 restart se estiver rodando)"
    echo ""
    exit 0
else
    echo "❌ ERRO! $ERRORS variável(is) obrigatória(s) faltando"
    echo "=================================================="
    echo ""
    echo "🔧 Corrija o arquivo .env e tente novamente"
    echo ""
    exit 1
fi
