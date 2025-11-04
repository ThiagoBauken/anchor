-- CreateTable
CREATE TABLE "anchor_points" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "numero_ponto" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "foto" TEXT,
    "numeroLacre" TEXT,
    "tipo_equipamento" TEXT,
    "data_instalacao" TEXT,
    "frequencia_inspecao_meses" INTEGER,
    "observacoes" TEXT,
    "posicao_x" DOUBLE PRECISION NOT NULL,
    "posicao_y" DOUBLE PRECISION NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Não Testado',
    "created_by_user_id" TEXT,
    "last_modified_by_user_id" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "anchor_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchor_tests" (
    "id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" TEXT NOT NULL,
    "carga" TEXT NOT NULL,
    "tempo" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "foto_teste" TEXT,
    "foto_pronto" TEXT,
    "data_foto_pronto" TEXT,

    CONSTRAINT "anchor_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_points" ADD CONSTRAINT "anchor_points_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex (removed duplicate table creation)
CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");

-- AddForeignKey (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_sessions_user_id_fkey') THEN
        ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;