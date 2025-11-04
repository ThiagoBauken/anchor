#!/bin/bash
# Execute este script se tiver acesso direto ao PostgreSQL via terminal

# Substitua com suas credenciais do EasyPanel
DB_HOST="your-easypanel-host"
DB_PORT="5432"
DB_NAME="your-database-name"  
DB_USER="your-username"
DB_PASSWORD="your-password"

# Executar o SQL
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "EXECUTE-NOW.sql"

echo "✅ SQL executado com sucesso!"