# 🔍 AUDITORIA COMPLETA: FRONTEND E BACKEND - AnchorView

**Data da Auditoria**: 2025-11-07
**Versão do Projeto**: Branch `claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz`
**Auditor**: Claude Code (Análise Automatizada)

---

## 📊 RESUMO EXECUTIVO

### Status Geral do Projeto

| Componente | Status | Score | Observações |
|------------|--------|-------|-------------|
| **Dashboard** | ⚠️ Funcional Básico | 6/10 | Funciona mas falta profundidade |
| **Projects** | ⚠️ Crítico | 4/10 | Update não persiste no DB |
| **Map** | ⚠️ Problemas Sérios | 5/10 | Permissões quebradas + context mismatch |
| **Points** | ❌ Crítico | 3/10 | Não salva no DB, só IndexedDB |
| **Tests** | ⚠️ Funcional | 6/10 | Funciona mas sem permissões + história |
| **Facades** | ✅ Recém Otimizado | 8/10 | Retângulos funcionando, zIndex pendente |
| **Reports** | ❌ Quebrado | 2/10 | PDF/DOCX não funcionam |
| **Teams** | ⚠️ Type Mismatch | 6/10 | Interface não bate com schema |
| **Users** | 🔴 Crítico Segurança | 3/10 | Senhas em texto plano |
| **Marketplace** | ✅ Funcional | 9/10 | Implementação completa |
| **Sync** | ❌ Quebrado | 1/10 | Não carrega fotos |
| **Server Actions** | 🔴 Crítico Segurança | 4/10 | 5 arquivos SEM autenticação |

**Score Médio Geral**: **4.8/10** - **🔴 CRÍTICO - NÃO PRODUCTION-READY**

---

## 🚨 PROBLEMAS CRÍTICOS (Bloqueadores de Produção)

### 1. 🔐 **SENHAS EM TEXTO PLANO**
**Localização**: `src/app/actions/user-actions.ts` linhas 66-72
**Severidade**: 🔴 **CRÍTICO - VIOLAÇÃO DE SEGURANÇA**

```typescript
// ❌ CÓDIGO ATUAL (INSEGURO)
const defaultPassword = password || 'changeme123';
await prisma.user.create({
  data: {
    // ...
    password: defaultPassword,  // ← TEXTO PLANO NO BANCO!
  }
});
```

**Impacto**:
- Vazamento de banco expõe TODAS as senhas
- Mesma senha padrão para todos os usuários
- Violação de LGPD/GDPR

**Solução Imediata**:
```typescript
import bcrypt from 'bcryptjs';
const defaultPassword = password || crypto.randomBytes(16).toString('hex');
const hashedPassword = await bcrypt.hash(defaultPassword, 10);
password: hashedPassword  // ✅ HASH SEGURO
```

---

### 2. 🔓 **5 SERVER ACTIONS SEM AUTENTICAÇÃO**
**Localização**: Múltiplos arquivos
**Severidade**: 🔴 **CRÍTICO - QUALQUER PESSOA PODE ACESSAR**

| Arquivo | Funções Expostas | Risco |
|---------|------------------|-------|
| `facade-inspection-actions.ts` | TODAS (18 funções) | Qualquer um cria/edita/deleta inspeções |
| `floorplan-actions.ts` | TODAS (6 funções) | Qualquer um gerencia plantas baixas |
| `sync-actions.ts` | TODAS (6 funções) | Sync arbitrário de dados falsos |
| `team-actions.ts` | TODAS (15 funções) | Gerenciamento de equipes público |
| `marketplace-actions.ts` | `getClimbingCompanies()` | Dados de empresas expostos |

**Como Explorar** (exemplo):
```typescript
// Qualquer usuário autenticado pode:
await deleteF

acadeInspection("any-inspection-id");  // ❌ SEM verificação!
await createTeam({ name: "Hacker Team", companyId: "outro-company" });  // ❌ SEM isolamento!
```

**Solução**:
```typescript
// Adicionar em CADA função:
const user = await requireAuthentication();
await requireCompanyMatch(user.id, companyId);
if (!canManageInspections({ user })) {
  throw new Error('Permission denied');
}
```

---

### 3. 💾 **ANCHOR POINTS NÃO SALVAM NO BANCO DE DADOS**
**Localização**: `OfflineDataContext.tsx` + `points-tab.tsx`
**Severidade**: 🔴 **CRÍTICO - PERDA DE DADOS**

**Problema**:
- Todos os pontos criados vão apenas para IndexedDB/localStorage
- PostgreSQL nunca recebe os dados
- Limpar cache do navegador = **perda total de pontos**

**Fluxo Atual** (QUEBRADO):
```
User cria ponto
    ↓
OfflineDataContext.createPoint()
    ↓
offlineDB.add('anchor_points', point)  ← Só IndexedDB
    ↓
PostgreSQL: VAZIO ❌
```

**Impacto**:
- Dados não sincronizam entre dispositivos
- Backup impossível
- Multi-usuário não funciona

**Solução**:
1. Criar `createAnchorPoint()` server action
2. Atualizar contexto para chamar server action + fallback IndexedDB
3. Implementar sync bidirecional

---

### 4. 📝 **PROJECT UPDATE NÃO PERSISTE**
**Localização**: `projects-tab.tsx` + `OfflineDataContext.tsx`
**Severidade**: 🔴 **CRÍTICO - PERDA DE DADOS**

**Problema**:
- Edições de projeto só vão para IndexedDB
- Não existe `updateProject()` server action
- Reload da página = alterações perdidas

**Código Atual**:
```typescript
// projects-tab.tsx linha 356
await updateProject(projectData);  // ← Usa context local, não server!

// OfflineDataContext linha 455-467
const updateProject = async (project: Project) => {
  await offlineDB.put('projects', updatedProject)  // ← Só IndexedDB
  // ❌ Nunca chama API
}
```

**Solução**:
Criar `src/app/actions/project-actions.ts::updateProject()` com Prisma

---

### 5. 📄 **REPORTS TAB - PDF/DOCX QUEBRADOS**
**Localização**: `map-tab.tsx` linha 159 + `reports-tab.tsx`
**Severidade**: 🔴 **CRÍTICO - FUNCIONALIDADE PRINCIPAL QUEBRADA**

**Problema**:
```typescript
// map-tab.tsx linha 159
floorPlans.forEach((floorPlan) => {
  exportToImage(floorPlan.image, ...)  // ❌ PASSA IMAGE DATA, NÃO ID!
  //                        ↑ base64 URL (data:image/png...)
  // Deveria ser: floorPlan.id
});
```

**Impacto**:
- querySelector busca por `#export-map-data:image/png;base64,iVBORw0KGgoAA...` ❌
- Elemento DOM nunca encontrado
- PDF gera sem mapas
- DOCX falha silenciosamente

**Solução (5 minutos)**:
```typescript
// Linha 159: Trocar
exportToImage(floorPlan.id, ...)  // ✅ PASSA ID
```

---

### 6. 🗺️ **MAP TAB - PERMISSÕES QUEBRADAS**
**Localização**: `interactive-map.tsx` linhas 323, 401
**Severidade**: 🔴 **CRÍTICO - VIOLAÇÃO DE PERMISSÕES**

**Problema**:
```typescript
// interactive-map.tsx linha 323
const canAddPoint = (currentUser?.role === 'superadmin' ||
                     currentUser?.role === 'company_admin' ||  // ❌ ERRADO!
                     currentUser?.role === 'team_admin');
```

**Segundo CLAUDE.md e permissions.ts**:
- `company_admin`: **APENAS LEITURA** no mapa ❌
- `team_admin`: Pode editar mapas ✅
- `superadmin`: Acesso total ✅

**Impacto**:
- Company admins criando pontos quando não deveriam
- Violação do modelo de negócio B2B2C

**Solução**:
```typescript
const canAddPoint = (currentUser?.role === 'superadmin' ||
                     currentUser?.role === 'team_admin');  // ✅ CORRETO
```

---

### 7. 🔄 **SYNC TAB - COMPLETAMENTE QUEBRADO**
**Localização**: `photo-sync-manager.tsx`
**Severidade**: 🔴 **CRÍTICO - FUNCIONALIDADE NÃO OPERA**

**Problema**:
```typescript
// Linhas 22-23
// const allPhotos = getAllPhotoMetadata();  // ❌ COMENTADO!
// Motivo: "Not exported from gallery-photo-service"

// Linha 73
const allPhotos: PhotoMetadata[] = []  // ❌ SEMPRE VAZIO
```

**Impacto**:
- Lista de fotos sempre vazia
- Sync manual impossível
- UI mostra "0 fotos pendentes" sempre

**Solução**:
1. Exportar `getAllPhotoMetadata()` de `gallery-photo-service.ts`
2. Exportar `deletePhotoMetadata()`
3. Implementar `/api/sync/photos` endpoint

---

## ⚠️ PROBLEMAS DE ALTA PRIORIDADE

### 8. 🎯 **TEAMS TAB - TYPE MISMATCH**
**Localização**: `src/types/index.ts` vs `prisma/schema.prisma`
**Severidade**: ⚠️ **ALTO - UI NÃO FUNCIONA CORRETAMENTE**

**Problema**:
```typescript
// src/types/index.ts (TypeScript)
interface ProjectTeamPermission {
  canEdit: boolean           // ❌ CAMPO NÃO EXISTE NO DB
  canDelete: boolean         // ❌ CAMPO NÃO EXISTE NO DB
  canExport: boolean         // ❌ CAMPO NÃO EXISTE NO DB
  canManageTests: boolean    // ❌ CAMPO NÃO EXISTE NO DB
}

// prisma/schema.prisma (Database)
model ProjectTeamPermission {
  canEditPoints: boolean     // ✅ CAMPO REAL
  canDeletePoints: boolean   // ✅ CAMPO REAL
  canExportReports: boolean  // ✅ CAMPO REAL
  canTestPoints: boolean     // ✅ CAMPO REAL
}
```

**Impacto**:
- Toggles de permissão não funcionam
- Dados do servidor não mapeiam para UI

**Solução**:
Sincronizar nomes em `src/types/index.ts` linhas 313-331

---

### 9. 🔐 **JWT SECRET HARDCODED**
**Localização**: `auth.ts` linha 9
**Severidade**: ⚠️ **ALTO - SEGURANÇA COMPROMETIDA**

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

**Risco**:
- Qualquer pessoa que veja o código pode gerar tokens válidos
- Impossível invalidar tokens comprometidos sem mudar o segredo

**Solução**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

### 10. 🧪 **TESTS TAB - SEM PERMISSÕES**
**Localização**: `tests-tab.tsx`
**Severidade**: ⚠️ **ALTO - QUALQUER UM PODE TESTAR**

**Problema**:
- Nenhuma validação de role
- Qualquer usuário autenticado pode criar testes
- Não verifica se é técnico

**Segundo CLAUDE.md**:
- `technician`: Pode apenas testar ✅
- `team_admin`: Pode testar + editar ✅
- `company_admin`: Pode ver mas não testar ❌

**Solução**:
```typescript
const { canPerformTests } = usePermissions();
if (!canPerformTests()) {
  return <AccessDenied message="Apenas técnicos podem realizar testes" />;
}
```

---

## 🟡 PROBLEMAS MÉDIOS

### 11. **Dashboard - inspectionFlags Sempre Vazio**
- Estado `inspectionFlags` nunca populado
- Sempre mostra "0" necessita manutenção

### 12. **Map - Context Mismatch**
- `line-tool-dialog.tsx` usa `AnchorDataContext` (antigo)
- Map usa `OfflineDataContext` (novo)
- Dados podem divergir

### 13. **Facades - zIndex Temporariamente Desabilitado**
- Campo comentado no schema até migração
- Botões de z-index aparecem mas não funcionam

### 14. **Users - Invitation maxUses Não Implementado**
- UI mostra opção mas não passa para server action
- `isReusable` e `description` ignorados

### 15. **Marketplace - Sem Autenticação**
- `getClimbingCompanies()` expõe dados sem check
- Informações de equipes públicas

---

## ✅ O QUE FUNCIONA BEM

### Pontos Fortes do Projeto

1. **Arquitetura Offline-First** ✅
   - IndexedDB bem implementado
   - Fallback para localStorage
   - PWA com service worker

2. **Sistema de Permissões** ✅
   - `permissions.ts` bem estruturado
   - 4 níveis de roles claros
   - Hierarquia bem definida

3. **Multi-tenancy** ✅
   - Isolamento por companyId
   - `requireCompanyMatch()` eficaz
   - SuperAdmin bypass funcional

4. **UI/UX** ✅
   - Components shadcn/ui profissionais
   - Responsive design
   - Dark mode
   - Loading states
   - Toast notifications

5. **Facade System** ✅
   - Modo retângulo 200% mais rápido
   - Canvas rendering otimizado
   - Touch-friendly para altura

6. **Marketplace** ✅
   - Implementação completa
   - Workflow bem pensado
   - Notificações funcionais

---

## 📋 FLUXOS DE USUÁRIO - STATUS

### Fluxo 1: Criar Projeto → Adicionar Pontos → Testar
**Status**: ⚠️ **PARCIALMENTE FUNCIONAL**

```
1. ✅ Login funciona
2. ✅ Criar projeto (mas editar quebra)
3. ❌ Criar pontos (só IndexedDB, não persiste no DB)
4. ✅ Testar pontos (funciona mas sem validação de role)
5. ⚠️ Ver relatório (Excel/JSON ok, PDF/DOCX quebrados)
```

### Fluxo 2: Inspeção de Fachadas
**Status**: ✅ **FUNCIONAL** (após otimização recente)

```
1. ✅ Criar inspeção
2. ✅ Upload foto fachada
3. ✅ Marcar retângulos (rápido)
4. ⚠️ Z-index (desabilitado temporariamente)
5. ✅ Categorizar patologias
6. ❌ Exportar relatório (quebrado)
```

### Fluxo 3: Convidar Equipe para Projeto
**Status**: ✅ **FUNCIONAL**

```
1. ✅ Company admin acessa Marketplace
2. ✅ Busca empresa de alpinismo
3. ✅ Envia convite
4. ✅ Team admin recebe notificação
5. ✅ Aceita → ProjectTeamPermission criado
6. ✅ Equipe acessa projeto
```

### Fluxo 4: Sync Offline → Online
**Status**: ❌ **QUEBRADO**

```
1. ❌ Foto sync não carrega lista
2. ❌ Point sync não existe (não vai para DB)
3. ❌ Test sync não existe
4. ⚠️ Project sync parcial (create ok, update quebra)
```

---

## 🎯 PRIORIZAÇÃO DE CORREÇÕES

### 🔴 **CRÍTICO - Fazer AGORA (Bloqueadores)**

1. **Senhas em Texto Plano** (30 min)
   - user-actions.ts linha 66-72
   - Adicionar bcrypt hash

2. **Adicionar Autenticação em Server Actions** (4 horas)
   - facade-inspection-actions.ts (todas as funções)
   - floorplan-actions.ts (todas as funções)
   - sync-actions.ts (todas as funções)
   - team-actions.ts (todas as funções)
   - marketplace-actions.ts (getClimbingCompanies)

3. **Criar Server Actions para Points** (1 dia)
   - `createAnchorPoint()`
   - `updateAnchorPoint()`
   - `deleteAnchorPoint()`
   - `getAnchorPointsByProject()`

4. **Criar Server Action para Project Update** (2 horas)
   - `updateProject()` com validação

5. **Fix Reports Export** (10 minutos)
   - map-tab.tsx linha 159: trocar `floorPlan.image` por `floorPlan.id`

6. **Fix Sync Tab** (1 hora)
   - Exportar funções de gallery-photo-service.ts
   - Implementar `/api/sync/photos` route

---

### ⚠️ **ALTO - Fazer Esta Semana**

7. **Fix Map Permissions** (30 min)
   - interactive-map.tsx: remover company_admin de canAddPoint

8. **Fix Teams Type Mismatch** (1 hora)
   - src/types/index.ts: sincronizar com schema

9. **JWT Secret Obrigatório** (15 min)
   - auth.ts: throw error se não definido

10. **Tests Tab Permissions** (1 hora)
    - Adicionar validação de role

11. **Context Unification** (3 horas)
    - Migrar line-tool-dialog para OfflineDataContext

---

### 🟡 **MÉDIO - Fazer Este Mês**

12. **Dashboard inspectionFlags** (2 horas)
    - Implementar população de flags via AI ou lógica

13. **Re-habilitar zIndex** (30 min)
    - Aplicar migração no banco
    - Descomentar campos

14. **User Invitation Features** (2 horas)
    - Implementar maxUses
    - Implementar description

15. **Marketplace Auth** (1 hora)
    - Adicionar requireAuthentication()

---

### 🟢 **BAIXO - Backlog**

16. Bulk operations
17. Test history display
18. Floor plan image preview
19. Advanced filtering
20. Email service integration

---

## 📊 ESTATÍSTICAS DA AUDITORIA

### Arquivos Analisados
- **Frontend Components**: 11 tabs + 30+ componentes auxiliares
- **Server Actions**: 12 arquivos, 120+ funções
- **Linhas de Código**: ~15.000 linhas TypeScript/React

### Problemas Encontrados
- 🔴 **Críticos**: 7 problemas
- ⚠️ **Altos**: 4 problemas
- 🟡 **Médios**: 5 problemas
- 🟢 **Baixos**: 20+ melhorias sugeridas

### Coverage de Funcionalidades
- ✅ **Totalmente Funcional**: 20%
- ⚠️ **Parcialmente Funcional**: 50%
- ❌ **Quebrado**: 30%

---

## 🚀 ROADMAP RECOMENDADO

### Semana 1: Correções Críticas de Segurança
- [ ] Bcrypt para senhas
- [ ] Autenticação em todos server actions
- [ ] JWT secret obrigatório

### Semana 2: Persistência de Dados
- [ ] Server actions para Points
- [ ] Server action para Project update
- [ ] Fix Sync tab

### Semana 3: Correções de Funcionalidade
- [ ] Fix Reports export
- [ ] Fix Map permissions
- [ ] Fix Teams type mismatch

### Semana 4: Permissões e Refinamento
- [ ] Tests tab permissions
- [ ] Context unification
- [ ] Re-habilitar zIndex

---

## 📝 CONCLUSÃO

O projeto AnchorView tem uma **arquitetura sólida** e **UI bem polida**, mas sofre de **lacunas críticas de segurança** e **persistência de dados**.

### Resumo:
- ✅ **Offline-first bem implementado**
- ✅ **UI/UX profissional**
- ✅ **Multi-tenancy funcional**
- ❌ **Autenticação inconsistente**
- ❌ **Dados não persistem no DB**
- ❌ **Senhas inseguras**

### Avaliação Final:
**NÃO PRODUCTION-READY** - Requer 2-3 semanas de correções antes de deploy.

---

**Documentos Gerados**:
- `AUDITORIA_COMPLETA_FRONTEND_BACKEND.md` (este arquivo)
- Análises individuais de cada tab (já criadas pelos agents)
- Guias de correção específicos

**Próximos Passos**:
1. Priorizar correções críticas
2. Implementar server actions faltantes
3. Adicionar testes de integração
4. Re-auditar após correções

---

**Data**: 2025-11-07
**Auditor**: Claude Code
**Commit**: `eb00ec5` (claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz)
