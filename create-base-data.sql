-- =============================================
-- CRIAR DADOS BASE PARA RESOLVER FOREIGN KEYS
-- Execute este script no PostgreSQL primeiro!
-- =============================================

-- 1. Criar companies primeiro (são a base de tudo)
INSERT INTO companies (id, name, email, is_active, created_at) 
VALUES 
  ('demo-company', 'Demo Company', 'demo@anchorview.com', true, NOW()),
  ('comp_1755741549685_7nnfcmf4w', 'Empresa Principal', 'contato@empresa.com', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Criar users (precisam das companies)
INSERT INTO users (id, name, email, role, "companyId", active, created_at, updated_at)
VALUES 
  ('demo-admin', 'Demo Admin', 'admin@anchorview.com', 'admin', 'demo-company', true, NOW(), NOW()),
  ('demo-super-admin', 'Super Admin', 'superadmin@anchorview.com', 'superadmin', 'demo-company', true, NOW(), NOW()),
  ('google_1755739661283', 'Google User', 'google@example.com', 'user', 'demo-company', true, NOW(), NOW()),
  ('user_1755741549685_wu0mfv1cj', 'Usuário Principal', 'user@empresa.com', 'admin', 'comp_1755741549685_7nnfcmf4w', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Criar projects (precisam das companies)
INSERT INTO projects (id, name, "companyId", created_at, updated_at, deleted)
VALUES 
  ('demo-project-1', 'Edifício Demo - Escritórios', 'demo-company', NOW(), NOW(), false),
  ('proj_1755740908144_kc065tvjn', 'Projeto Principal', 'comp_1755741549685_7nnfcmf4w', NOW(), NOW(), false)
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar se tudo foi criado
SELECT 'Companies criadas:' as info, COUNT(*) as total FROM companies;
SELECT 'Users criados:' as info, COUNT(*) as total FROM users;
SELECT 'Projects criados:' as info, COUNT(*) as total FROM projects;

-- 5. Mostrar relacionamentos
SELECT 
  c.name as company,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT p.id) as projects
FROM companies c
LEFT JOIN users u ON u."companyId" = c.id
LEFT JOIN projects p ON p."companyId" = c.id
GROUP BY c.id, c.name;

COMMIT;