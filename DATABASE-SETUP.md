# 🗄️ AnchorView - Setup do Banco PostgreSQL

Este documento explica como configurar o banco de dados PostgreSQL para o AnchorView.

## 📋 Pré-requisitos

- PostgreSQL 12+ rodando
- Node.js 18+ instalado
- Credenciais de acesso ao banco

---

## 🚀 Método 1: Setup Automático (RECOMENDADO)

Usa o Prisma para aplicar o schema automaticamente.

### Passo 1: Configurar credenciais

Edite o arquivo `.env.local`:

```env
DATABASE_URL="postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"
```

### Passo 2: Executar script

```bash
bash setup-postgres-atualizado.sh
```

### Opções disponíveis:

#### Opção 1: Setup Completo
- ⚠️ **APAGA TODOS OS DADOS**
- Recria todas as tabelas do zero
- Use em desenvolvimento ou primeira instalação

#### Opção 2: Aplicar Migrations
- ✅ **Mantém dados existentes**
- Aplica apenas mudanças no schema
- Use em produção ou quando já tem dados

#### Opção 3: Gerar Prisma Client
- Apenas atualiza o código TypeScript
- Não toca no banco de dados

#### Opção 4: Reset + Seed
- ⚠️ **APAGA TODOS OS DADOS**
- Recria tudo + adiciona dados de exemplo
- Útil para testes

---

## 🛠️ Método 2: Setup Manual (SQL Puro)

Use este método se preferir aplicar o SQL diretamente.

### Passo 1: Aplicar schema completo

```bash
# Linux/Mac
psql -h 185.215.165.19 -p 8002 -U privado -d privado < schema-sql-completo.sql

# Windows (Git Bash)
cat schema-sql-completo.sql | psql -h 185.215.165.19 -p 8002 -U privado -d privado

# Windows (PowerShell)
Get-Content schema-sql-completo.sql | psql -h 185.215.165.19 -p 8002 -U privado -d privado
```

### Passo 2: Gerar Prisma Client

```bash
npx prisma generate
```

---

## 📊 Schema do Banco

O banco inclui as seguintes tabelas principais:

### Core
- `Company` - Empresas/Clientes
- `User` - Usuários (com 4 roles: superadmin, company_admin, team_admin, technician)
- `Project` - Projetos de ancoragem
- `Location` - Localizações/Progressões
- `AnchorPoint` - Pontos de ancoragem
- `AnchorTest` - Testes realizados

### Teams (Sistema de Equipes)
- `Team` - Equipes de alpinismo
- `TeamMember` - Membros das equipes
- `ProjectTeamPermission` - Permissões por projeto

### Public Viewing (Visualização Pública)
- `ProjectPublicSettings` - Configurações de QR Code
- `PublicViewLog` - Analytics de visualizações
- `PublicProblemReport` - Reportes de problemas

### SaaS Features
- `Subscription` - Assinaturas
- `SubscriptionPlan` - Planos disponíveis
- `Payment` - Pagamentos
- `UserInvitation` - Convites de usuários
- `PasswordReset` - Recuperação de senha

### System
- `AuditLog` - Log de auditoria
- `SyncQueue` - Fila de sincronização offline
- `Notification` - Notificações
- `UsageAnalytics` - Analytics de uso

---

## 🔐 Roles de Usuário

O sistema possui 4 níveis de acesso:

| Role | Descrição | Permissões |
|------|-----------|------------|
| `superadmin` | Dono do sistema | Acesso total, gerencia todas empresas |
| `company_admin` | Admin da empresa | Gerencia projetos e equipes, apenas visualiza mapas |
| `team_admin` | Líder de equipe | Edita mapas dos projetos atribuídos, convida técnicos |
| `technician` | Técnico de campo | Apenas realiza testes em pontos existentes |

---

## 🔄 Migrando Dados Antigos

Se você já tem dados no banco com roles antigos (`admin`, `user`), execute:

```sql
-- Converter roles antigos para novos
UPDATE "User"
SET role = CASE
    WHEN role = 'admin' THEN 'company_admin'::UserRole
    WHEN role = 'superadmin' THEN 'superadmin'::UserRole
    ELSE 'technician'::UserRole
END;

UPDATE "user_invitations"
SET role = CASE
    WHEN role = 'admin' THEN 'company_admin'::UserRole
    WHEN role = 'superadmin' THEN 'superadmin'::UserRole
    ELSE 'technician'::UserRole
END;
```

---

## 🧪 Verificar Instalação

Após o setup, teste a conexão:

```bash
npx prisma studio
```

Isso abre uma interface web para visualizar e editar dados do banco.

---

## ❓ Troubleshooting

### Erro: "relation already exists"
- Já existe uma tabela com mesmo nome
- **Solução**: Use Opção 1 (reset completo) ou remova a tabela manualmente

### Erro: "Argument company is missing"
- Schema desatualizado no código
- **Solução**: Execute `npx prisma generate` novamente

### Erro: "Cannot cast type"
- Tentando mudar tipo de coluna com dados
- **Solução**: Migre os dados primeiro ou use reset

### Erro: "Connection timeout"
- Banco não acessível
- **Solução**: Verifique firewall, IP, porta e credenciais

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `tail -f logs/database.log`
2. Teste conexão: `psql -h HOST -p PORT -U USER -d DATABASE`
3. Valide schema: `npx prisma validate`

---

**Última atualização**: 21/10/2025
**Versão do Prisma**: 5.22.0
**Versão do PostgreSQL**: 12+
