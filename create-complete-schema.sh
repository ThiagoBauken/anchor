#!/bin/bash
# CRIAR SCHEMA COMPLETO DO ANCHORVIEW

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANY
CREATE TABLE IF NOT EXISTS "Company" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. USER  
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- 3. LOCATION
CREATE TABLE IF NOT EXISTS "Location" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "markerShape" TEXT DEFAULT 'circle',
    "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- 4. PROJECT
CREATE TABLE IF NOT EXISTS "Project" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "floorPlanImages" TEXT[] DEFAULT '{}',
    deleted BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL REFERENCES "Company"(id),
    "createdByUserId" TEXT NOT NULL REFERENCES "User"(id),
    "cargaDeTestePadrao" TEXT,
    "tempoDeTestePadrao" TEXT,
    "engenheiroResponsavelPadrao" TEXT
);

-- 5. ANCHOR_POINTS
CREATE TABLE IF NOT EXISTS anchor_points (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES "Project"(id),
    numero_ponto TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    foto TEXT,
    "numeroLacre" TEXT,
    tipo_equipamento TEXT,
    data_instalacao TEXT,
    frequencia_inspecao_meses INTEGER,
    observacoes TEXT,
    posicao_x FLOAT NOT NULL,
    posicao_y FLOAT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Não Testado',
    created_by_user_id TEXT REFERENCES "User"(id),
    last_modified_by_user_id TEXT REFERENCES "User"(id),
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP
);

-- 6. ANCHOR_TESTS
CREATE TABLE IF NOT EXISTS anchor_tests (
    id TEXT PRIMARY KEY,
    ponto_id TEXT NOT NULL REFERENCES anchor_points(id),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado TEXT NOT NULL,
    carga TEXT NOT NULL,
    tempo TEXT NOT NULL,
    tecnico TEXT NOT NULL,
    observacoes TEXT,
    foto_teste TEXT,
    foto_pronto TEXT,
    data_foto_pronto TEXT
);

-- 7. USER_INVITATIONS
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES "Company"(id),
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    invited_by TEXT NOT NULL REFERENCES "User"(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    is_reusable BOOLEAN DEFAULT false,
    description TEXT
);

-- DADOS DEMO
INSERT INTO "Company" (id, name) VALUES ('demo-company', 'Empresa Demo') ON CONFLICT DO NOTHING;
INSERT INTO "User" (id, name, email, password_hash, role, "companyId") VALUES 
    ('demo-admin', 'Admin Demo', 'admin@demo.com', 'hash123', 'admin', 'demo-company') ON CONFLICT DO NOTHING;

\echo 'SCHEMA CRIADO!'

EOF