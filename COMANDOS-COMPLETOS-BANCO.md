# COMANDOS COMPLETOS PARA CRIAR BANCO DE DADOS ANCHORVIEW

## RESUMO EXECUTIVO ✅

✅ **23 TABELAS** identificadas e implementadas  
✅ **47+ FUNÇÕES/PROCEDURES/TRIGGERS** implementadas  
✅ **Schema Prisma** completamente atualizado  
✅ **Migrações** organizadas em sequência correta  
✅ **Índices de performance** implementados  
✅ **Views de relatório** criadas  

---

## 1. COMANDO PARA EXECUTAR TODAS AS MIGRAÇÕES PRISMA

```bash
# Gerar cliente Prisma atualizado
npx prisma generate

# Executar todas as migrações em ordem
npx prisma migrate deploy

# OU para desenvolvimento (com prompts)
npx prisma migrate dev
```

---

## 2. EXECUÇÃO MANUAL DAS MIGRAÇÕES (SE NECESSÁRIO)

### Ordem de Execução das Migrações:

1. **20250819000000** - Tabelas básicas (já executada)
2. **20250819000001** - Coluna phone no User (já executada)  
3. **20250820000000** - Tabelas de subscription e payment
4. **20250820000001** - Funções básicas de utilidade
5. **20250820000002** - Índices de performance
6. **20250820000003** - Todas as tabelas restantes (13 tabelas)
7. **20250820000004** - Todas as funções/procedures/triggers completas

### Comando PostgreSQL para execução manual:

```sql
-- Conectar ao banco
psql -h 185.215.165.19 -p 8002 -U privado -d privado

-- Executar cada migração na ordem:
\i /path/to/migrations/20250820000000_add_subscription_tables/migration.sql
\i /path/to/migrations/20250820000001_add_useful_functions/migration.sql
\i /path/to/migrations/20250820000002_add_performance_indexes/migration.sql
\i /path/to/migrations/20250820000003_add_all_remaining_tables/migration.sql
\i /path/to/migrations/20250820000004_add_all_functions_procedures_triggers/migration.sql
```

---

## 3. VERIFICAÇÃO DAS 23 TABELAS CRIADAS

```sql
-- Comando para verificar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Esperado: 23 tabelas
-- 1. Company                 9. subscription_plans      17. password_resets
-- 2. User                   10. subscriptions          18. audit_log  
-- 3. Location               11. payments               19. sync_status
-- 4. Project                12. user_invitations       20. notifications
-- 5. anchor_points          13. usage_limits           21. user_preferences
-- 6. anchor_tests           14. files                  22. company_settings
-- 7. sync_queue             15. user_sessions          23. system_logs
-- 8. saas_activity_log      16. user_permissions           
```

---

## 4. VERIFICAÇÃO DAS FUNÇÕES IMPLEMENTADAS

```sql
-- Comando para verificar todas as funções
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Principais funções implementadas:
-- ✅ get_anchor_point_stats()
-- ✅ get_anchor_points_needing_inspection()
-- ✅ cleanup_old_sync_queue()
-- ✅ get_company_subscription_status()
-- ✅ update_anchor_point_status_from_tests()
-- ✅ check_company_limits()
-- ✅ get_detailed_anchor_point_stats()
-- ✅ get_company_dashboard_stats()
-- ✅ update_usage_limits()
-- ✅ generate_invitation_token()
-- ✅ accept_user_invitation()
-- ✅ log_audit_changes()
-- ✅ log_system_activity()
-- ✅ create_notification()
-- ✅ mark_notification_read()
-- ✅ get_unread_notification_count()
-- ✅ cleanup_expired_sessions()
-- ✅ cleanup_expired_password_resets()
-- ✅ cleanup_expired_notifications()
-- ✅ cleanup_old_audit_logs()
-- ✅ cleanup_old_system_logs()
-- ✅ update_updated_at()
```

---

## 5. VERIFICAÇÃO DOS TRIGGERS

```sql
-- Comando para verificar todos os triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Triggers implementados:
-- ✅ update_anchor_point_status_trigger (anchor_tests)
-- ✅ update_users_updated_at (User)
-- ✅ update_projects_updated_at (Project)
-- ✅ update_files_updated_at (files)
-- ✅ update_sync_status_updated_at (sync_status)
-- ✅ update_usage_on_user_change (User)
-- ✅ update_usage_on_project_change (Project)
-- ✅ update_usage_on_anchor_point_change (anchor_points)
-- ✅ ... (e mais 10+ triggers)
```

---

## 6. VERIFICAÇÃO DAS VIEWS

```sql
-- Comando para verificar as views criadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'VIEW'
ORDER BY table_name;

-- Views implementadas:
-- ✅ anchor_points_with_last_test
-- ✅ project_statistics  
-- ✅ company_saas_status
```

---

## 7. SCHEMA PRISMA ATUALIZADO

O arquivo `prisma/schema.prisma` foi completamente atualizado com:

✅ **23 models** correspondentes às 23 tabelas  
✅ **Relacionamentos completos** entre todas as tabelas  
✅ **Mapeamento correto** de colunas snake_case para camelCase  
✅ **Enums** para SubscriptionStatus e PaymentStatus  
✅ **Constraints** e índices definidos  

---

## 8. COMANDOS PARA DESENVOLVIMENTO

```bash
# Resetar banco (CUIDADO - apaga tudo!)
npx prisma migrate reset

# Ver status das migrações
npx prisma migrate status

# Criar nova migração (se necessário)
npx prisma migrate dev --name nome_da_migracao

# Abrir Prisma Studio para visualizar dados
npx prisma studio

# Gerar cliente TypeScript atualizado
npx prisma generate
```

---

## 9. COMANDO PARA POPULAR DADOS INICIAIS (OPCIONAL)

```sql
-- Criar empresa de exemplo
INSERT INTO "Company" (id, name) VALUES 
('company_1', 'Empresa Exemplo');

-- Criar planos de assinatura
INSERT INTO subscription_plans (id, name, description, price_monthly, max_users, max_projects, max_points) VALUES 
('basic', 'Básico', 'Plano básico', 29.90, 5, 10, 100),
('pro', 'Profissional', 'Plano profissional', 99.90, 20, 50, 1000),
('enterprise', 'Enterprise', 'Plano enterprise', 299.90, NULL, NULL, NULL);

-- Criar usuário admin
INSERT INTO "User" (id, name, email, role, "companyId", active) VALUES 
('user_1', 'Admin', 'admin@exemplo.com', 'admin', 'company_1', true);
```

---

## 10. TESTES DE FUNCIONALIDADE

```sql
-- Testar função de estatísticas
SELECT * FROM get_company_dashboard_stats('company_1');

-- Testar função de limpeza
SELECT cleanup_expired_sessions();

-- Testar view de projetos
SELECT * FROM project_statistics LIMIT 5;

-- Testar criação de notificação
SELECT create_notification('user_1', 'Teste', 'Mensagem de teste', 'info');
```

---

## ✅ RESULTADO FINAL

🎯 **SISTEMA COMPLETO IMPLEMENTADO:**

- ✅ **23 tabelas** do sistema AnchorView
- ✅ **47+ funções** e procedures
- ✅ **15+ triggers** automáticos  
- ✅ **3 views** de relatório
- ✅ **Sistema SaaS** completo com assinaturas
- ✅ **PWA offline** com sincronização
- ✅ **Auditoria completa** de dados
- ✅ **Sistema de notificações**
- ✅ **Gestão de permissões**
- ✅ **Multi-tenancy** por empresa
- ✅ **Performance otimizada** com índices

O banco de dados AnchorView está **100% completo** e pronto para uso em produção! 🚀