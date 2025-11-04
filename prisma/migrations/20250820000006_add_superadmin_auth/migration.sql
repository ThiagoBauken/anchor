-- AddSuperAdminAuth
-- Adiciona autenticação real e role de super admin

-- Torna email único (necessário para login)
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");

-- Adiciona comentários para documentação
COMMENT ON COLUMN "User"."role" IS 'Roles: user, admin, superadmin';
COMMENT ON COLUMN "User"."password_hash" IS 'Hash bcrypt da senha para autenticação';
COMMENT ON COLUMN "User"."email" IS 'Email único para login';

-- Índices para performance de autenticação
CREATE INDEX IF NOT EXISTS "User_email_active_idx" ON "User"("email", "active");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Função para verificar se existe super admin
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User" 
        WHERE role = 'superadmin' AND active = true
    );
END;
$$ LANGUAGE plpgsql;