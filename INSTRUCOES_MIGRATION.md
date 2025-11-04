# ⚠️ Instruções para Rodar Migration

## 📋 Antes de Rodar

O schema Prisma foi atualizado com:
- ✅ Sistema de Equipes (Teams)
- ✅ Visualização Pública (ProjectPublicSettings)
- ✅ Notificações (NotificationSettings)

## 🚀 Comandos para Executar

### 1. Gerar Migration (Development)

```bash
npx prisma migrate dev --name add_teams_public_notifications
```

Isso vai:
- Criar os arquivos de migration
- Aplicar no database local
- Gerar Prisma Client atualizado

### 2. Ou Deploy Migration (Production)

```bash
npx prisma migrate deploy
```

### 3. Verificar Schema

```bash
npx prisma format
npx prisma validate
```

### 4. Abrir Prisma Studio (Opcional)

```bash
npx prisma studio
```

Isso abre uma UI para visualizar as novas tabelas.

## 📊 Tabelas Criadas

### Teams
- `teams` - Equipes de alpinismo
- `team_members` - Membros das equipes
- `project_team_permissions` - Permissões por projeto

### Visualização Pública
- `project_public_settings` - Configurações de visibilidade
- `public_view_logs` - Log de acessos públicos
- `public_problem_reports` - Reportes de problemas

### Notificações
- `notification_settings` - Configurações por company
- `notification_logs` - Log de emails enviados

## ⚠️ Atenção

- Faça backup do banco antes de rodar em produção
- Teste em ambiente de desenvolvimento primeiro
- As migrações são irreversíveis (não tem rollback automático)

## 🔧 Se der erro

Se houver conflito, pode ser necessário:

```bash
# Resetar banco (⚠️ APAGA TUDO!)
npx prisma migrate reset

# Ou criar migration vazia e resolver manual
npx prisma migrate dev --create-only
```

---

**Data**: 2025-10-20
**Status**: Pronto para rodar
