# Context Unification Recommendations

**Created**: 2025-11-07
**Status**: Recommendation Document
**Priority**: Semana 4 (Refinement)

---

## 🎯 Objetivo

Unificar os múltiplos contextos de gerenciamento de estado para simplificar a arquitetura e reduzir duplicação de código.

---

## 📊 Contextos Atuais

O projeto atualmente possui **múltiplos contextos** que gerenciam dados semelhantes:

### 1. **OfflineDataContext** (`src/context/OfflineDataContext.tsx`)
- **Propósito**: Gerenciamento offline-first com IndexedDB
- **Gerencia**: Projects, Points, Tests, Users, Company
- **Storage**: IndexedDB + localStorage fallback
- **Features**:
  - Offline/Online detection
  - Sync status tracking
  - CRUD operations
  - Line tool mode (pontos em linha)

### 2. **AnchorDataContext** (`src/context/AnchorDataContext.tsx`)
- **Propósito**: Gerenciamento de dados de ancoragem
- **Gerencia**: Projects, Points, Tests, FloorPlans
- **Storage**: localStorage primarily
- **Features**:
  - CRUD operations
  - Sync status (idle/saving/saved/error)
  - Line tool mode (duplicado!)

### 3. **DatabaseAuthContext** (`src/context/DatabaseAuthContext.tsx`)
- **Propósito**: Autenticação com PostgreSQL
- **Gerencia**: User session, Company data
- **Features**:
  - Login/Logout
  - Session persistence
  - Company loading

### 4. **OfflineAuthContext** (`src/context/OfflineAuthContext.tsx`)
- **Propósito**: Autenticação offline-capable
- **Gerencia**: User session offline
- **Features**:
  - Online/Offline detection
  - Cached authentication

---

## 🔴 Problemas Identificados

### 1. **Duplicação de Line Tool Mode**
```typescript
// OfflineDataContext.tsx (linhas 150-160)
lineToolMode: boolean
setLineToolMode: (mode: boolean) => void
lineToolStartPointId: string | null
lineToolEndPointId: string | null
// ... logic here

// AnchorDataContext.tsx (linhas 180-190)
lineToolMode: boolean
setLineToolMode: (mode: boolean) => void
lineToolStartPointId: string | null
lineToolEndPointId: string | null
// ... SAME logic duplicated!
```

**Problema**: Mesma lógica implementada em 2 lugares diferentes.

### 2. **Inconsistência de Estado**
- Componentes usam contextos diferentes para mesma funcionalidade
- `line-tool-dialog.tsx` usa `AnchorDataContext`
- `map-tab.tsx` usa `OfflineDataContext`
- Estado pode ficar dessincronizado

### 3. **Complexidade Desnecessária**
- Desenvolvedores precisam decidir qual contexto usar
- Lógica de sync duplicada em múltiplos lugares
- Testes precisam mockar múltiplos contextos

---

## ✅ Recomendações de Unificação

### Fase 1: Unificar Line Tool Mode

**Arquivos a modificar**:
1. `src/context/OfflineDataContext.tsx` - **Manter** (contexto principal)
2. `src/context/AnchorDataContext.tsx` - **Remover** line tool logic
3. `src/components/line-tool-dialog.tsx` - Migrar para OfflineDataContext

**Passos**:
```typescript
// 1. Em line-tool-dialog.tsx, TROCAR:
const { lineToolMode, ... } = useAnchorData();

// PARA:
const { lineToolMode, ... } = useOfflineData();

// 2. Remover line tool logic de AnchorDataContext
// 3. Verificar todos os componentes que usam line tool
// 4. Atualizar imports
```

**Tempo estimado**: 2-3 horas
**Risco**: Baixo (lógica isolada)

---

### Fase 2: Migração Gradual para OfflineDataContext

**Estratégia**: Migrar gradualmente componentes de `AnchorDataContext` → `OfflineDataContext`

**Prioridade de Migração**:
1. ✅ `line-tool-dialog.tsx` (Fase 1)
2. `points-tab.tsx`
3. `dashboard-tab.tsx`
4. `map-tab.tsx` (já usa OfflineDataContext parcialmente)

**Por que OfflineDataContext é melhor**:
- ✅ Offline-first architecture
- ✅ IndexedDB integration
- ✅ Sync status tracking
- ✅ Online/Offline detection
- ✅ Mais moderno e completo

---

### Fase 3: Unificar Auth Contexts (Opcional)

**Arquivos**:
- `DatabaseAuthContext` - Online authentication
- `OfflineAuthContext` - Offline-capable auth

**Recomendação**: Manter separados por enquanto
- **Motivo**: Cenários de uso diferentes (online vs offline)
- **Alternativa**: Criar `UnifiedAuthContext` que usa um ou outro baseado em connectivity
- **Prioridade**: Baixa (não é crítico)

---

## 📋 Checklist de Implementação

### Fase 1: Line Tool Unification
- [ ] Audit all files using `lineToolMode` from AnchorDataContext
- [ ] Update `line-tool-dialog.tsx` to use OfflineDataContext
- [ ] Update `map-tab.tsx` line tool refs (if any)
- [ ] Remove line tool logic from AnchorDataContext
- [ ] Test line tool functionality end-to-end
- [ ] Update TypeScript types if needed

### Fase 2: Context Migration
- [ ] Identify all components using AnchorDataContext
- [ ] Create migration plan (component by component)
- [ ] Migrate `points-tab.tsx` first (simpler)
- [ ] Migrate `dashboard-tab.tsx`
- [ ] Test each component after migration
- [ ] Remove AnchorDataContext when all migrated

### Fase 3: Documentation
- [ ] Update CLAUDE.md with new context architecture
- [ ] Document which context to use for what
- [ ] Add migration guide for future developers
- [ ] Update component examples

---

## 🚨 Riscos e Mitigações

### Risco 1: Breaking Changes
**Mitigação**:
- Fazer uma migration branch separada
- Testar cada componente após migração
- Manter rollback plan

### Risco 2: Perda de Funcionalidade
**Mitigação**:
- Audit completo antes de remover código
- Verificar se todas as features existem em OfflineDataContext
- Adicionar features faltantes antes de migrar

### Risco 3: Performance Issues
**Mitigação**:
- Monitor bundle size após mudanças
- Verificar re-renders excessivos
- Usar React DevTools para profile

---

## 📈 Benefícios Esperados

1. **Menos Complexidade**
   - De 4 contextos → 2 contextos (50% redução)
   - Código mais fácil de entender

2. **Menos Bugs**
   - Estado unificado = menos inconsistências
   - Menos duplicação = menos bugs

3. **Melhor Manutenibilidade**
   - Um lugar para fazer mudanças
   - Menos arquivos para atualizar

4. **Melhor Developer Experience**
   - Desenvolvedor sabe qual contexto usar
   - Menos decisões para tomar

---

## 📚 Referências

- **Código Atual**: `src/context/`
- **Auditoria**: `AUDITORIA_COMPLETA_FRONTEND_BACKEND.md` (Semana 4)
- **Architecture Docs**: `CLAUDE.md` (Context Providers section)

---

**Conclusão**: Context unification é uma **refatoração importante mas não urgente**. Recomenda-se fazer na **Semana 4** após todas as correções críticas estarem implementadas e estáveis.
