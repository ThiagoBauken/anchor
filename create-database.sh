#!/bin/bash

# =============================================
# ANCHORVIEW - SCRIPT BASH PARA CRIAÇÃO DO BANCO
# Database: privado
# Host: 185.215.165.19:8002
# User: privado
# =============================================

echo "🚀 Iniciando criação do banco AnchorView..."

# Configurações de conexão
# External Connection (Para acesso remoto)
export PGHOST="185.215.165.19"
export PGPORT="8002"
export PGUSER="privado"
export PGPASSWORD="privado12!"
export PGDATABASE="privado"
export PGSSLMODE="disable"

# Função para executar SQL
execute_sql() {
    echo "Executando: $1"
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE --set=sslmode=$PGSSLMODE -c "$1"
    if [ $? -eq 0 ]; then
        echo "✅ Sucesso"
    else
        echo "❌ Erro ao executar: $1"
        exit 1
    fi
}

echo "📦 Criando extensões..."
execute_sql 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
execute_sql 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'

echo "🏢 Criando tabela Company..."
execute_sql 'CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

echo "👥 Criando tabela User..."
execute_sql 'CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "password_hash" TEXT,
    "role" TEXT NOT NULL CHECK ("role" IN ('"'"'admin'"'"', '"'"'user'"'"')),
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_login_at" TIMESTAMP WITH TIME ZONE
);'

echo "📍 Criando tabela Location..."
execute_sql 'CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "markerShape" TEXT NOT NULL CHECK ("markerShape" IN ('"'"'circle'"'"', '"'"'square'"'"', '"'"'x'"'"', '"'"'+'"'"')),
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

echo "🏗️ Criando tabela Project..."
execute_sql 'CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorPlanImages" TEXT[],
    "deleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
    "createdByUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
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
);'

echo "📁 Criando tabela files..."
execute_sql 'CREATE TABLE IF NOT EXISTS "files" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "original_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "uploaded_by" TEXT NOT NULL REFERENCES "User"("id"),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);'

echo "⚓ Criando tabela anchor_points..."
execute_sql 'CREATE TABLE IF NOT EXISTS "anchor_points" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "legacy_id" TEXT,
    "project_id" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "numero_ponto" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "numero_lacre" TEXT,
    "tipo_equipamento" TEXT,
    "data_instalacao" DATE,
    "frequencia_inspecao_meses" INTEGER DEFAULT 12,
    "observacoes" TEXT,
    "posicao_x" DECIMAL(10,2) NOT NULL,
    "posicao_y" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT '"'"'Não Testado'"'"' CHECK ("status" IN ('"'"'Aprovado'"'"', '"'"'Reprovado'"'"', '"'"'Não Testado'"'"')),
    "foto_id" UUID REFERENCES "files"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" TEXT NOT NULL REFERENCES "User"("id"),
    "updated_by" TEXT NOT NULL REFERENCES "User"("id"),
    "archived" BOOLEAN DEFAULT FALSE,
    "archived_at" TIMESTAMP WITH TIME ZONE,
    "archived_by" TEXT REFERENCES "User"("id"),
    CONSTRAINT "unique_point_per_project" UNIQUE("project_id", "numero_ponto")
);'

echo "🧪 Criando tabela anchor_tests..."
execute_sql 'CREATE TABLE IF NOT EXISTS "anchor_tests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "legacy_id" TEXT,
    "anchor_point_id" UUID NOT NULL REFERENCES "anchor_points"("id") ON DELETE CASCADE,
    "resultado" TEXT NOT NULL CHECK ("resultado" IN ('"'"'Aprovado'"'"', '"'"'Reprovado'"'"')),
    "carga" TEXT NOT NULL,
    "tempo" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "foto_teste_id" UUID REFERENCES "files"("id"),
    "foto_pronto_id" UUID REFERENCES "files"("id"),
    "data_foto_pronto" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" TEXT NOT NULL REFERENCES "User"("id")
);'

echo "🔐 Criando tabelas de autenticação..."
execute_sql 'CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "session_token" TEXT NOT NULL UNIQUE,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_accessed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ip_address" INET,
    "user_agent" TEXT,
    "is_active" BOOLEAN DEFAULT TRUE
);'

execute_sql 'CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "used_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

echo "📋 Criando tabela de auditoria..."
execute_sql 'CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL CHECK ("operation" IN ('"'"'INSERT'"'"', '"'"'UPDATE'"'"', '"'"'DELETE'"'"', '"'"'ARCHIVE'"'"')),
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[],
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id"),
    "session_id" UUID REFERENCES "user_sessions"("id"),
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

echo "🔄 Criando tabelas de sincronização..."
execute_sql 'CREATE TABLE IF NOT EXISTS "sync_status" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "device_id" TEXT,
    "sync_status" TEXT NOT NULL DEFAULT '"'"'pending'"'"' CHECK ("sync_status" IN ('"'"'pending'"'"', '"'"'syncing'"'"', '"'"'synced'"'"', '"'"'error'"'"')),
    "last_sync_at" TIMESTAMP WITH TIME ZONE,
    "retry_count" INTEGER DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

execute_sql 'CREATE TABLE IF NOT EXISTS "sync_queue" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "device_id" TEXT,
    "operation_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_data" JSONB NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "retry_count" INTEGER DEFAULT 0,
    "max_retries" INTEGER DEFAULT 3,
    "status" TEXT DEFAULT '"'"'pending'"'"' CHECK ("status" IN ('"'"'pending'"'"', '"'"'processing'"'"', '"'"'completed'"'"', '"'"'failed'"'"')),
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "processed_at" TIMESTAMP WITH TIME ZONE
);'

echo "🔔 Criando tabelas restantes..."
execute_sql 'CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id"),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('"'"'info'"'"', '"'"'success'"'"', '"'"'warning'"'"', '"'"'error'"'"', '"'"'sync'"'"', '"'"'inspection'"'"')),
    "data" JSONB,
    "read_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "expires_at" TIMESTAMP WITH TIME ZONE
);'

execute_sql 'CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") UNIQUE,
    "preferences" JSONB DEFAULT '"'"'{}'"'"',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

execute_sql 'CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_id" TEXT NOT NULL REFERENCES "Company"("id") UNIQUE,
    "settings" JSONB DEFAULT '"'"'{}'"'"',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

execute_sql 'CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "level" TEXT NOT NULL CHECK ("level" IN ('"'"'DEBUG'"'"', '"'"'INFO'"'"', '"'"'WARN'"'"', '"'"'ERROR'"'"', '"'"'CRITICAL'"'"')),
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "user_id" TEXT REFERENCES "User"("id"),
    "session_id" UUID REFERENCES "user_sessions"("id"),
    "ip_address" INET,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);'

echo "📊 Criando índices..."
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "User"("companyId");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_users_email" ON "User"("email");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_users_active" ON "User"("active");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_locations_company_id" ON "Location"("companyId");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_projects_company_id" ON "Project"("companyId");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_projects_created_by" ON "Project"("createdByUserId");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_projects_deleted" ON "Project"("deleted");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_files_company_id" ON "files"("company_id");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_files_hash" ON "files"("file_hash");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_anchor_points_project_id" ON "anchor_points"("project_id");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_anchor_points_status" ON "anchor_points"("status");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_anchor_tests_point_id" ON "anchor_tests"("anchor_point_id");'
execute_sql 'CREATE INDEX IF NOT EXISTS "idx_sync_status_entity" ON "sync_status"("entity_type", "entity_id");'

echo "⚙️ Criando funções..."
execute_sql 'CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;'

echo "🔧 Criando triggers..."
execute_sql 'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at();'
execute_sql 'CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "Project" FOR EACH ROW EXECUTE FUNCTION update_updated_at();'

echo "📊 Inserindo dados iniciais..."
execute_sql "INSERT INTO \"Company\" (\"id\", \"name\") VALUES ('clx3i4a7x000008l4hy822g62', 'AnchorView Demo') ON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\";"

execute_sql "INSERT INTO \"User\" (\"id\", \"name\", \"email\", \"role\", \"companyId\") VALUES ('default-admin', 'Administrador', 'admin@anchorview.com', 'admin', 'clx3i4a7x000008l4hy822g62') ON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\";"

execute_sql "INSERT INTO \"Location\" (\"id\", \"name\", \"markerShape\", \"companyId\") VALUES ('loc-1', 'Área Externa', 'circle', 'clx3i4a7x000008l4hy822g62'), ('loc-2', 'Cobertura', 'square', 'clx3i4a7x000008l4hy822g62'), ('loc-3', 'Fachada', 'x', 'clx3i4a7x000008l4hy822g62'), ('loc-4', 'Área Interna', '+', 'clx3i4a7x000008l4hy822g62') ON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\";"

echo ""
echo "🎉 SUCESSO! Banco AnchorView criado com sucesso!"
echo "📋 Verificando tabelas criadas..."

execute_sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo ""
echo "🔢 Contando registros..."
execute_sql "SELECT 
    (SELECT COUNT(*) FROM \"Company\") as companies,
    (SELECT COUNT(*) FROM \"User\") as users,
    (SELECT COUNT(*) FROM \"Location\") as locations,
    (SELECT COUNT(*) FROM \"Project\") as projects;"

echo ""
echo "✅ Instalação completa! Banco pronto para uso."