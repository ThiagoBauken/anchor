-- AlterTable
-- Add zIndex field to pathology_markers for layer control
ALTER TABLE "pathology_markers" ADD COLUMN IF NOT EXISTS "z_index" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
-- Index for efficient sorting by z-index
CREATE INDEX IF NOT EXISTS "pathology_markers_z_index_idx" ON "pathology_markers"("z_index");

-- Update existing records to have default zIndex based on creation order
UPDATE "pathology_markers"
SET "z_index" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY facade_side_id ORDER BY created_at) - 1 AS row_num
  FROM "pathology_markers"
) AS subquery
WHERE "pathology_markers".id = subquery.id
AND "pathology_markers"."z_index" = 0;
