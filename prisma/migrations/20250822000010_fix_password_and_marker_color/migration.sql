-- Remove password_hash column if it exists
ALTER TABLE "User" DROP COLUMN IF EXISTS "password_hash";

-- Make password field required
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- Add markerColor to Location if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Location' AND column_name='markerColor'
  ) THEN
    ALTER TABLE "Location" ADD COLUMN "markerColor" VARCHAR(50) DEFAULT '#6941DE';
  END IF;
END $$;