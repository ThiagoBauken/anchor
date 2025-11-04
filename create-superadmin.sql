-- ===================================================================
-- ANCHORVIEW - CRIAR USUÁRIO SUPER ADMIN
-- ===================================================================
-- Execute este comando após criar o banco de dados
-- Ele cria uma empresa padrão e um usuário super admin
-- ===================================================================

-- ===== CRIAR EMPRESA PADRÃO =====
DO $$
DECLARE
    company_id TEXT;
    admin_id TEXT;
    hashed_password TEXT;
BEGIN
    -- Gerar hash da senha 'admin123' (você deve trocar depois)
    hashed_password := crypt('admin123', gen_salt('bf'));
    
    -- Criar empresa padrão
    INSERT INTO "Company" (
        "id", "name", "displayName", "email", "isActive", "createdAt", "updatedAt"
    ) VALUES (
        'company-default',
        'AnchorView Admin',
        'Administração do Sistema',
        'admin@anchorview.com',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT ("id") DO NOTHING;
    
    -- Criar usuário super admin
    INSERT INTO "User" (
        "id", 
        "email", 
        "password", 
        "name", 
        "role", 
        "companyId", 
        "active", 
        "createdAt", 
        "updatedAt"
    ) VALUES (
        'user-superadmin',
        'admin@anchorview.com',
        hashed_password,
        'Super Administrador',
        'superadmin',
        'company-default',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT ("email") DO UPDATE SET
        "password" = hashed_password,
        "role" = 'superadmin',
        "active" = true,
        "updatedAt" = CURRENT_TIMESTAMP;
    
    -- Criar registro de limites de uso para a empresa
    INSERT INTO "usage_limits" (
        "company_id",
        "users_count",
        "projects_count", 
        "points_count",
        "storage_used_gb",
        "updated_at"
    ) VALUES (
        'company-default',
        1,
        0,
        0,
        0,
        CURRENT_TIMESTAMP
    ) ON CONFLICT ("company_id") DO NOTHING;
    
    RAISE NOTICE '✅ Super Admin criado com sucesso!';
    RAISE NOTICE '📧 Email: admin@anchorview.com';
    RAISE NOTICE '🔑 Senha: admin123';
    RAISE NOTICE '⚠️  IMPORTANTE: Troque a senha após o primeiro login!';
    
END $$;