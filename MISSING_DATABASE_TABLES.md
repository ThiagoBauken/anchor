# ❌ TABELAS FALTANTES NO BANCO DE DADOS

## 🚨 PROBLEMA IDENTIFICADO

O banco de dados tem apenas as **tabelas básicas** (`Company`, `User`, `Location`, `Project`) mas **NÃO tem as tabelas SaaS** necessárias para:
- Sistema de pagamentos
- Gestão de assinaturas
- Controle de usuários
- Logs de atividade
- Limites de uso

## 📋 TABELAS QUE FALTAM:

### 1. **subscription_plans** 
- Planos de assinatura (Starter R$15, Professional R$45, Enterprise R$100)

### 2. **subscriptions**
- Assinaturas das empresas
- Status (trialing, active, canceled, past_due)
- Períodos de cobrança

### 3. **payments**
- Histórico de pagamentos
- Integração com Mercado Pago
- Status de transações

### 4. **user_invitations**
- Sistema de convites de usuários
- Links de convite com expiração
- Controle de acesso

### 5. **usage_limits**
- Limites de uso por empresa
- Contadores de usuários, projetos, pontos
- Controle de cotas

### 6. **saas_activity_log**
- Log de atividades do sistema
- Auditoria de ações
- Rastreamento de uso

### 7. **user_permissions**
- Permissões granulares por usuário
- Controle de acesso a recursos
- Sistema de roles avançado

### 8. **Colunas faltantes na tabela User:**
- `email` (VARCHAR UNIQUE) - Para login
- `password` (VARCHAR) - Para autenticação  
- `active` (BOOLEAN) - Para desativar usuários

## ⚡ SOLUÇÃO RÁPIDA

Execute este comando para criar todas as tabelas de uma vez:

```sql
-- Copie o conteúdo completo de create-saas-tables.sql e execute no PostgreSQL
```

Ou via linha de comando:
```bash
PGPASSWORD=privado12! psql -U privado -h 185.215.165.19 -p 8002 -d privado -f create-saas-tables.sql
```

## 🎯 DEPOIS DE CRIAR AS TABELAS:

1. **Regenerar Prisma client:**
```bash
npx prisma generate
npx prisma db pull  # Para sincronizar schema
```

2. **Popular dados iniciais:**
- Planos de assinatura serão criados automaticamente
- Empresas existentes receberão trial de 14 dias
- Usuários admin@admin.com será mantido

3. **Testar funcionalidades:**
- Login/logout funcionará
- Dados serão salvos no PostgreSQL ao invés de localStorage
- Sistema de pagamentos ficará ativo
- Controle de usuários funcionará

## 🔍 COMO VERIFICAR SE FOI CRIADO:

Execute o arquivo `check-missing-tables.sql` para verificar:
- Quais tabelas existem
- Quais estão faltando
- Se as colunas foram adicionadas corretamente

**Status atual**: ❌ Banco incompleto (só tabelas básicas)
**Status desejado**: ✅ Banco completo (SaaS funcional)