-- Migration: Add Facade Inspection System
-- Execute este SQL diretamente no PostgreSQL
-- Data: Janeiro 2025

-- ===== ENUMS =====

-- Tipo de lado da fachada
CREATE TYPE "FacadeSideType" AS ENUM ('NORTH', 'SOUTH', 'EAST', 'WEST', 'ROOF', 'OTHER');

-- Status da inspeção
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');

-- Severidade da patologia
CREATE TYPE "PathologySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ===== TABLES =====

-- 1. Tabela de inspeções de fachada
CREATE TABLE IF NOT EXISTS "facade_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "inspector_id" TEXT,
    "inspector_name" TEXT,
    "engineer_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facade_inspections_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "Project"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "facade_inspections_created_by_user_id_fkey"
        FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "facade_inspections_engineer_id_fkey"
        FOREIGN KEY ("engineer_id") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Tabela de lados da fachada (fotos de drone)
CREATE TABLE IF NOT EXISTS "facade_sides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspection_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "side_type" "FacadeSideType" NOT NULL,
    "image" TEXT NOT NULL,
    "drone_photo_date" TIMESTAMP(3),
    "weather" TEXT,
    "photographer" TEXT,
    "notes" TEXT,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facade_sides_inspection_id_fkey"
        FOREIGN KEY ("inspection_id") REFERENCES "facade_inspections"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Tabela de categorias de patologia
CREATE TABLE IF NOT EXISTS "pathology_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "severity" "PathologySeverity" NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pathology_categories_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Tabela de marcadores de patologia (polígonos desenhados)
CREATE TABLE IF NOT EXISTS "pathology_markers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facade_side_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "area" DOUBLE PRECISION,
    "floor" TEXT,
    "severity" "PathologySeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT[] NOT NULL DEFAULT '{}',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pathology_markers_facade_side_id_fkey"
        FOREIGN KEY ("facade_side_id") REFERENCES "facade_sides"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "pathology_markers_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "pathology_categories"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "pathology_markers_created_by_user_id_fkey"
        FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Tabela de laudos/relatórios de inspeção
CREATE TABLE IF NOT EXISTS "inspection_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspection_id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "engineer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_reports_inspection_id_fkey"
        FOREIGN KEY ("inspection_id") REFERENCES "facade_inspections"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "inspection_reports_engineer_id_fkey"
        FOREIGN KEY ("engineer_id") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "inspection_reports_approved_by_fkey"
        FOREIGN KEY ("approved_by") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ===== INDEXES =====

-- Facade Inspections
CREATE INDEX IF NOT EXISTS "facade_inspections_project_id_idx"
    ON "facade_inspections"("project_id");

CREATE INDEX IF NOT EXISTS "facade_inspections_status_idx"
    ON "facade_inspections"("status");

CREATE INDEX IF NOT EXISTS "facade_inspections_engineer_id_idx"
    ON "facade_inspections"("engineer_id");

-- Facade Sides
CREATE INDEX IF NOT EXISTS "facade_sides_inspection_id_idx"
    ON "facade_sides"("inspection_id");

CREATE INDEX IF NOT EXISTS "facade_sides_side_type_idx"
    ON "facade_sides"("side_type");

-- Pathology Categories
CREATE INDEX IF NOT EXISTS "pathology_categories_company_id_idx"
    ON "pathology_categories"("company_id");

CREATE INDEX IF NOT EXISTS "pathology_categories_active_idx"
    ON "pathology_categories"("active");

-- Pathology Markers
CREATE INDEX IF NOT EXISTS "pathology_markers_facade_side_id_idx"
    ON "pathology_markers"("facade_side_id");

CREATE INDEX IF NOT EXISTS "pathology_markers_category_id_idx"
    ON "pathology_markers"("category_id");

CREATE INDEX IF NOT EXISTS "pathology_markers_status_idx"
    ON "pathology_markers"("status");

CREATE INDEX IF NOT EXISTS "pathology_markers_severity_idx"
    ON "pathology_markers"("severity");

-- Inspection Reports
CREATE INDEX IF NOT EXISTS "inspection_reports_inspection_id_idx"
    ON "inspection_reports"("inspection_id");

CREATE INDEX IF NOT EXISTS "inspection_reports_engineer_id_idx"
    ON "inspection_reports"("engineer_id");

CREATE INDEX IF NOT EXISTS "inspection_reports_status_idx"
    ON "inspection_reports"("status");

-- ===== SEED DEFAULT PATHOLOGY CATEGORIES =====
-- (Execute manualmente ou use a função seedDefaultPathologyCategories)

-- EXEMPLO (substitua 'YOUR_COMPANY_ID' pelo ID real da empresa):
/*
INSERT INTO "pathology_categories" (
    "id", "company_id", "name", "color", "severity", "order", "description", "active"
) VALUES
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Fissura', '#FF5733', 'MEDIUM', 1, 'Rachaduras e fissuras na estrutura', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Infiltração', '#3498DB', 'HIGH', 2, 'Manchas de umidade e infiltração', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Desplacamento', '#E74C3C', 'HIGH', 3, 'Destacamento de revestimento', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Corrosão', '#F39C12', 'CRITICAL', 4, 'Corrosão de armaduras', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Eflorescência', '#9B59B6', 'LOW', 5, 'Depósitos salinos na superfície', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Trinca Estrutural', '#C0392B', 'CRITICAL', 6, 'Trincas em elementos estruturais', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Bolor/Mofo', '#27AE60', 'MEDIUM', 7, 'Presença de fungos e mofo', true),
    (gen_random_uuid()::text, 'YOUR_COMPANY_ID', 'Desgaste', '#95A5A6', 'LOW', 8, 'Desgaste natural do tempo', true);
*/

-- ===== VERIFICATION =====

-- Verificar se as tabelas foram criadas
SELECT
    'facade_inspections' as table_name,
    COUNT(*) as exists
FROM information_schema.tables
WHERE table_name = 'facade_inspections'
UNION ALL
SELECT 'facade_sides', COUNT(*) FROM information_schema.tables WHERE table_name = 'facade_sides'
UNION ALL
SELECT 'pathology_categories', COUNT(*) FROM information_schema.tables WHERE table_name = 'pathology_categories'
UNION ALL
SELECT 'pathology_markers', COUNT(*) FROM information_schema.tables WHERE table_name = 'pathology_markers'
UNION ALL
SELECT 'inspection_reports', COUNT(*) FROM information_schema.tables WHERE table_name = 'inspection_reports';

-- Verificar enums criados
SELECT
    enumlabel as enum_value,
    enumtypid::regtype as enum_type
FROM pg_enum
WHERE enumtypid IN (
    'FacadeSideType'::regtype,
    'InspectionStatus'::regtype,
    'PathologySeverity'::regtype
)
ORDER BY enumtypid, enumsortorder;

-- Pronto! Sistema de Inspeção de Fachadas instalado com sucesso.
