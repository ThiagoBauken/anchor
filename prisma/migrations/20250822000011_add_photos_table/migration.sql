-- CreateTable (with IF NOT EXISTS for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photos') THEN
        CREATE TABLE "photos" (
            "id" TEXT NOT NULL,
            "file_name" TEXT NOT NULL,
            "file_path" TEXT,
            "public_url" TEXT,
            "project_id" TEXT NOT NULL,
            "ponto_id" TEXT NOT NULL,
            "ponto_numero" TEXT NOT NULL,
            "ponto_localizacao" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "captured_at" TIMESTAMP(3) NOT NULL,
            "uploaded_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "uploaded" BOOLEAN NOT NULL DEFAULT false,
            "file_size" INTEGER,

            CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'photos_project_id_idx') THEN
        CREATE INDEX "photos_project_id_idx" ON "photos"("project_id");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'photos_ponto_id_idx') THEN
        CREATE INDEX "photos_ponto_id_idx" ON "photos"("ponto_id");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'photos_uploaded_idx') THEN
        CREATE INDEX "photos_uploaded_idx" ON "photos"("uploaded");
    END IF;
END $$;

-- AddForeignKey (only if projects table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'photos_project_id_fkey'
        ) THEN
            ALTER TABLE "photos" ADD CONSTRAINT "photos_project_id_fkey"
            FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anchor_points') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'photos_ponto_id_fkey'
        ) THEN
            ALTER TABLE "photos" ADD CONSTRAINT "photos_ponto_id_fkey"
            FOREIGN KEY ("ponto_id") REFERENCES "anchor_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
