-- =============================================
-- VERIFICAR TABELAS EXISTENTES E FALTANTES
-- =============================================

-- Listar todas as tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar se tabelas SaaS existem
SELECT 
    'subscription_plans' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscription_plans'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'subscriptions' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'payments' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'user_invitations' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_invitations'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'usage_limits' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usage_limits'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'saas_activity_log' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'saas_activity_log'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
    
UNION ALL SELECT 
    'user_permissions' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_permissions'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Verificar se colunas foram adicionadas na tabela User
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'User'
ORDER BY ordinal_position;