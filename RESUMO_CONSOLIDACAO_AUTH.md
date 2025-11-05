# Resumo: Consolidação dos Auth Contexts

## 📋 Resumo Executivo

O sistema AnchorView possuía **3 Auth Contexts diferentes** que foram analisados e consolidados em um único **UnifiedAuthContext**.

---

## 🔍 Análise dos Contexts Existentes

### 1. AuthContext.tsx (OBSOLETO)
**Localização**: `/src/context/AuthContext.tsx`

**O que fazia**:
- Login mock com credenciais hardcoded (`admin@admin.com` / `admin123`)
- Storage em `sessionStorage`
- **Status**: Praticamente não usado, pode ser removido

**Limitações**:
- ❌ Sem integração com banco de dados
- ❌ Credenciais hardcoded
- ❌ Sem suporte offline

---

### 2. DatabaseAuthContext.tsx (PRINCIPAL)
**Localização**: `/src/context/DatabaseAuthContext.tsx`

**O que fazia**:
- ✅ Autenticação real via server actions (Prisma + JWT)
- ✅ JWT com cookies httpOnly
- ✅ Roles e permissões (4 níveis)
- ✅ Company e subscription management
- ✅ Integration com `loginUser()`, `registerUser()`, `getCurrentUser()`, `logoutUser()`

**Onde era usado** (10 arquivos):
- `anchor-view.tsx`
- `teams-tab.tsx`
- `team-members-manager.tsx`
- `team-permissions-manager.tsx`
- `auth/login/page.tsx`
- `app/page.tsx`
- E outros...

**Limitações**:
- ❌ Sem detecção online/offline
- ❌ Sem JWT para PWA (apenas httpOnly)
- ❌ Sem sync status

---

### 3. OfflineAuthContext.tsx (FEATURE-RICH)
**Localização**: `/src/context/OfflineAuthContext.tsx`

**O que fazia**:
- ✅ Sistema completo offline-first com IndexedDB
- ✅ Detecção de online/offline
- ✅ Auto-sync a cada 5 minutos
- ✅ Network event listeners
- ✅ Demo data automática
- ✅ Sync status tracking

**Onde era usado** (13 arquivos):
- `marketplace-tab.tsx`
- `trial-banner.tsx`
- `offline-status.tsx`
- `map-tab.tsx`
- `admin/page.tsx`
- E outros...

**Problema**:
- ⚠️ **NÃO estava sendo providenciado no layout**
- ⚠️ Componentes usavam `useOfflineAuth()` mas o Provider não estava configurado

---

## ✨ UnifiedAuthContext - Solução Consolidada

### Features Implementadas

#### 🔐 Autenticação Completa
```typescript
// User state
user: User | null                    // Usuário autenticado
company: Company | null              // Empresa com subscription
loading: boolean                     // Estado de carregamento
isAuthenticated: boolean             // Está autenticado?

// Métodos de autenticação
login(email, password)               // Login (servidor → offline fallback)
register(data)                       // Registro (com trial de 14 dias)
logout()                             // Logout (limpa servidor + local)
refreshUser()                        // Recarregar usuário do servidor
```

#### 🌐 Online/Offline
```typescript
isOnline: boolean                    // Status da rede (navigator.onLine)

// Network event listeners automáticos
// Detecta quando fica offline/online
// Auto-sync quando volta online
```

#### 💾 PWA Support
```typescript
jwtToken: string | null              // JWT não-httpOnly para PWA
refreshToken()                       // Renovar token do endpoint
```

#### 🔄 Sync Management
```typescript
syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
lastSyncAt: string | null            // Timestamp do último sync
syncNow()                            // Sync manual

// Auto-sync automático a cada 5 minutos quando online + autenticado
```

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   UnifiedAuthContext                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Server-side Auth (DatabaseAuthContext)                 │
│     • JWT httpOnly cookies                                  │
│     • Server actions (Prisma)                               │
│     • Roles & permissions                                   │
│                                                             │
│  ✅ Offline-first (OfflineAuthContext)                     │
│     • Online/offline detection                              │
│     • IndexedDB fallback                                    │
│     • Auto-sync mechanism                                   │
│                                                             │
│  ✅ PWA Support (NOVO)                                     │
│     • Non-httpOnly JWT                                      │
│     • /api/auth/sync-token                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Criados/Modificados

### ✅ Criados

#### 1. `/src/context/UnifiedAuthContext.tsx`
**Tamanho**: ~600 linhas
**Exports**:
```typescript
export function UnifiedAuthProvider({ children })
export function useUnifiedAuth()          // Throws se não estiver no provider
export function useUnifiedAuthSafe()      // Safe para hydration
```

**Features**:
- Combina DatabaseAuth + OfflineAuth
- Adiciona PWA JWT token support
- Network event listeners
- Auto-sync inteligente
- Error handling robusto

### ✅ Modificados

#### 2. `/src/app/api/auth/sync-token/route.ts`
**Mudanças**:
- Suporta NextAuth **E** JWT manual com cookies
- Tenta NextAuth primeiro, fallback para JWT cookie
- Retorna token com todos os campos (id, email, role, companyId)
- Body request é opcional

**Antes**:
```typescript
// Apenas NextAuth
const session = await getServerSession(authOptions)
if (!session) return 401
```

**Depois**:
```typescript
// NextAuth OU JWT cookie
const session = await getServerSession(authOptions)
if (!session) {
  // Try JWT cookie
  const token = cookies.get('auth-token')
  const decoded = jwt.verify(token)
  // ...
}
```

---

## 🔄 Estratégia de Migração

### Fase 1: Testar (1-2 dias)

1. Adicionar `UnifiedAuthProvider` ao layout principal
2. Criar página de teste `/app/test-auth`
3. Validar login/logout/register
4. Testar online/offline
5. Verificar sync

### Fase 2: Migrar Componentes (3-5 dias)

#### Componentes com DatabaseAuth (10 arquivos)
```typescript
// ANTES
import { useDatabaseAuth } from '@/context/DatabaseAuthContext'
const { user, company, login, logout } = useDatabaseAuth()

// DEPOIS
import { useUnifiedAuth } from '@/context/UnifiedAuthContext'
const { user, company, login, logout } = useUnifiedAuth()
```

**Compatibilidade**: 100% - mesma API

#### Componentes com OfflineAuth (13 arquivos)
```typescript
// ANTES
import { useOfflineAuth } from '@/context/OfflineAuthContext'
const { currentUser, currentCompany, isOnline, syncStatus } = useOfflineAuth()

// DEPOIS
import { useUnifiedAuth } from '@/context/UnifiedAuthContext'
const { user, company, isOnline, syncStatus } = useUnifiedAuth()
```

**Mudanças**:
- `currentUser` → `user`
- `currentCompany` → `company`
- `isLoading` → `loading`

### Fase 3: Remover Contexts Antigos (1 dia)

Após migração completa:
```bash
rm /src/context/AuthContext.tsx
rm /src/context/DatabaseAuthContext.tsx
rm /src/context/OfflineAuthContext.tsx
```

---

## 📊 Comparação de Features

| Feature | AuthContext | DatabaseAuth | OfflineAuth | **UnifiedAuth** |
|---------|-------------|--------------|-------------|-----------------|
| Database | ❌ | ✅ | ⚠️ | ✅ |
| JWT httpOnly | ❌ | ✅ | ❌ | ✅ |
| JWT for PWA | ❌ | ❌ | ❌ | ✅ |
| Online/Offline | ❌ | ❌ | ✅ | ✅ |
| IndexedDB | ❌ | ❌ | ✅ | ✅ |
| Auto Sync | ❌ | ❌ | ✅ | ✅ |
| Roles | ❌ | ✅ | ⚠️ | ✅ |
| Subscriptions | ❌ | ✅ | ✅ | ✅ |
| Network Listeners | ❌ | ❌ | ✅ | ✅ |
| Sync Status | ❌ | ❌ | ✅ | ✅ |

---

## ✅ Próximos Passos

### Imediato
1. ✅ **Criar UnifiedAuthContext** (CONCLUÍDO)
2. ✅ **Atualizar /api/auth/sync-token** (CONCLUÍDO)
3. 🔄 **Testar em página isolada**
4. 🔄 **Validar flows completos**

### Próxima Sprint
5. 🔲 **Migrar componentes DatabaseAuth** (10 arquivos)
6. 🔲 **Migrar componentes OfflineAuth** (13 arquivos)
7. 🔲 **Atualizar ClientProviders**
8. 🔲 **Testes E2E**

### Futuro
9. 🔲 **Remover contexts antigos**
10. 🔲 **Documentar no CLAUDE.md**

---

## 💡 Benefícios

### Para Desenvolvedores
✅ **Single source of truth** - apenas 1 context
✅ **Type safety** - TypeScript completo
✅ **Manutenibilidade** - código centralizado
✅ **Testabilidade** - mocking simplificado

### Para Usuários
✅ **Offline-first** - funciona sem internet
✅ **Auto-sync** - sincronização automática
✅ **Confiabilidade** - fallback robusto
✅ **Performance** - cache inteligente

---

## 📚 Documentação Completa

Para análise detalhada, consulte:
- **`UNIFIED_AUTH_ANALYSIS.md`** - Análise completa técnica (em inglês)
- **Código**: `/src/context/UnifiedAuthContext.tsx`
- **Endpoint**: `/src/app/api/auth/sync-token/route.ts`

---

**Criado**: 2025-11-05
**Status**: ✅ Implementação completa - pronto para testes
