-- Adicionar coluna markerColor se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Location' AND column_name='markerColor'
  ) THEN
    ALTER TABLE "Location" ADD COLUMN "markerColor" VARCHAR(50) DEFAULT '#6941DE';
    UPDATE "Location" SET "markerColor" = '#6941DE' WHERE "markerColor" IS NULL;
    RAISE NOTICE 'Coluna markerColor adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna markerColor já existe';
  END IF;
END $$;