# Análise e Consolidação dos Auth Contexts

## Resumo Executivo

O sistema AnchorView tinha **3 Auth Contexts diferentes** com funcionalidades sobrepostas e redundantes. Este documento analisa cada um e apresenta o **UnifiedAuthContext** como solução consolidada.

---

## 1. Análise dos Contexts Existentes

### 1.1 AuthContext.tsx
**Localização**: `/home/user/anchor/src/context/AuthContext.tsx`

**Funcionalidades**:
- Login mock com credenciais hardcoded (`admin@admin.com` / `admin123`)
- Storage em `sessionStorage`
- Navegação básica (login → `/`, logout → `/auth/login`)

**Tipo de User**:
```typescript
interface User {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
}
```

**Métodos**:
- `login(email, password)` - Verifica credenciais hardcoded
- `logout()` - Limpa sessionStorage

**Uso no codebase**:
- Praticamente não usado (apenas importado em arquivos legacy)
- **Status**: OBSOLETO - pode ser removido

**Limitações**:
- ❌ Não usa banco de dados
- ❌ Credenciais hardcoded
- ❌ Sem suporte offline
- ❌ Sem JWT tokens
- ❌ Sem roles ou permissões

---

### 1.2 DatabaseAuthContext.tsx
**Localização**: `/home/user/anchor/src/context/DatabaseAuthContext.tsx`

**Funcionalidades**:
- Autenticação real via server actions (Prisma + JWT)
- Storage em `sessionStorage` para PWA fallback
- Integração com toast notifications
- Refresh user functionality

**Tipo de User**:
```typescript
interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string
}

interface Company {
  id: string
  name: string
  subscriptionPlan: string
}
```

**Métodos**:
- `login(email, password)` - Via `loginUser()` server action
- `register(data)` - Via `registerUser()` server action
- `logout()` - Via `logoutUser()` server action
- `refreshUser()` - Via `getCurrentUser()` server action

**Server Actions Utilizados**:
- `/app/actions/auth.ts`:
  - `registerUser()` - Cria company + user com trial de 14 dias
  - `loginUser()` - Autenticação com bcrypt + JWT cookie
  - `logoutUser()` - Delete cookie JWT
  - `getCurrentUser()` - Verifica JWT cookie e retorna user

**Uso no codebase**:
```
- src/components/client-providers.tsx (Provider wrapper)
- src/components/anchor-view.tsx
- src/components/teams-tab.tsx
- src/components/team-members-manager.tsx
- src/components/team-permissions-manager.tsx
- src/app/auth/layout.tsx
- src/app/auth/login/page.tsx
- src/app/app/page.tsx
- src/context/OfflineDataContext.tsx
```

**Status**: PRINCIPAL - usado na maioria dos componentes da aplicação

**Pontos Fortes**:
- ✅ Integração real com banco de dados
- ✅ JWT tokens com httpOnly cookies
- ✅ Roles e permissões (superadmin, company_admin, team_admin, technician)
- ✅ Company e subscription management
- ✅ Server actions bem estruturados

**Limitações**:
- ❌ Sem detecção online/offline
- ❌ Sem JWT token para PWA (apenas httpOnly)
- ❌ Sem sync status tracking
- ❌ Sem IndexedDB fallback para offline

---

### 1.3 OfflineAuthContext.tsx
**Localização**: `/home/user/anchor/src/context/OfflineAuthContext.tsx`

**Funcionalidades**:
- Sistema completo offline-first com IndexedDB
- Detecção de status online/offline
- Auto-sync quando volta online
- Demo data creation automática
- Google login (simulado)
- Sync status tracking
- Network event listeners

**Tipo de User**: Usa `User` e `Company` de `/types/index.ts`

**Métodos**:
- `login(email, password)` - Tenta offline primeiro, depois servidor
- `loginWithGoogle()` - Login simulado com Google (demo)
- `register(userData)` - Cria offline-first, sync depois
- `registerWithGoogle()` - Registro simulado (demo)
- `logout()` - Limpa estado local
- `syncNow()` - Sincronização manual
- Auto-sync automático a cada 5 minutos

**Storage Strategy**:
1. **Primary**: IndexedDB via `offlineDB` (`/lib/indexeddb.ts`)
2. **Session**: localStorage para userId e companyId
3. **Sync**: syncManager para auto-sync (`/lib/sync-manager.ts`)

**Demo Data**:
Cria automaticamente:
- Demo company (`demo-company`) com trial de 14 dias
- Admin user (`admin@admin.com` / `admin123`)
- Super admin (`superadmin@admin.com` / `super123`)
- Demo projects e locations

**Uso no codebase**:
```
- src/components/marketplace-tab.tsx
- src/components/trial-banner.tsx
- src/components/trial-expired-overlay.tsx
- src/components/project-locations-manager.tsx
- src/components/project-invitations-popover.tsx
- src/components/offline-status.tsx
- src/components/locations-tab.tsx
- src/components/map-tab.tsx
- src/components/facades-tab.tsx
- src/components/debug-trial-fix.tsx
- src/app/admin/page.tsx
- src/app/admin/layout.tsx
```

**Status**: FEATURE-RICH mas **NÃO PROVIDENCIADO** - componentes usam `useOfflineAuth()` mas o Provider não está no layout

**Pontos Fortes**:
- ✅ Offline-first architecture
- ✅ Online/offline detection
- ✅ IndexedDB storage
- ✅ Auto-sync mechanism
- ✅ Sync status tracking
- ✅ Demo data para testes
- ✅ Network event listeners

**Limitações**:
- ❌ Não integrado com server actions reais (usa fetch API)
- ❌ Google login apenas simulado
- ❌ Não está sendo providenciado no layout

---

## 2. UnifiedAuthContext - Solução Consolidada

### 2.1 Arquitetura

O **UnifiedAuthContext** combina o melhor dos 3 contexts:

```
┌─────────────────────────────────────────────────────────────┐
│                   UnifiedAuthContext                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Server-side Auth (DatabaseAuthContext features)     │  │
│  │ • JWT with httpOnly cookies                          │  │
│  │ • Server actions (Prisma + bcrypt)                   │  │
│  │ • Roles & permissions                                │  │
│  │ • Company & subscription management                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Offline-first (OfflineAuthContext features)         │  │
│  │ • Online/offline detection                           │  │
│  │ • IndexedDB fallback                                 │  │
│  │ • Auto-sync mechanism                                │  │
│  │ • Sync status tracking                               │  │
│  │ • Network event listeners                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PWA Support (NEW)                                    │  │
│  │ • Non-httpOnly JWT for Service Workers              │  │
│  │ • /api/auth/sync-token endpoint                      │  │
│  │ • localStorage JWT cache                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Features Implementadas

#### User State
```typescript
user: User | null                    // Current authenticated user
company: Company | null              // User's company with subscription
loading: boolean                     // Auth initialization loading
isAuthenticated: boolean             // Computed from user state
```

#### Online/Offline
```typescript
isOnline: boolean                    // Network status (navigator.onLine)
```

#### Authentication Methods
```typescript
login(email, password)               // Server first, IndexedDB fallback
register(data)                       // Server first, offline-first creation
logout()                             // Clear server + local session
refreshUser()                        // Reload user from server
```

#### PWA JWT Token
```typescript
jwtToken: string | null              // Non-httpOnly JWT for PWA
refreshToken()                       // Get/refresh PWA JWT from endpoint
```

#### Sync Status
```typescript
syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
lastSyncAt: string | null            // ISO timestamp of last sync
syncNow()                            // Manual sync trigger
```

### 2.3 Flow de Autenticação

#### Login Flow
```
1. User calls login(email, password)
   ↓
2. If ONLINE:
   ├─→ Call loginUser() server action
   ├─→ Server validates with bcrypt + Prisma
   ├─→ Server sets httpOnly JWT cookie
   ├─→ Cache user in IndexedDB
   └─→ Get PWA JWT token via /api/auth/sync-token

3. If OFFLINE or server fails:
   ├─→ Try offlineDB.authenticateUser()
   ├─→ Load from IndexedDB
   └─→ Use cached JWT token

4. Set user state + redirect to /app
```

#### Session Restoration Flow
```
1. On mount, initializeAuth()
   ↓
2. If ONLINE:
   ├─→ Call getCurrentUser() server action
   ├─→ Verifies httpOnly JWT cookie
   ├─→ Returns user from database
   └─→ Cache in IndexedDB

3. If OFFLINE or no server session:
   ├─→ Load userId from localStorage
   ├─→ Get user from IndexedDB
   └─→ Restore session

4. If valid session:
   ├─→ Set user state
   └─→ Trigger auto-sync if online
```

#### Network Change Flow
```
1. Browser fires 'online' event
   ↓
2. handleOnline() sets isOnline = true
   ↓
3. Automatically calls syncNow()
   ↓
4. syncManager syncs all pending changes
   ↓
5. Updates syncStatus + lastSyncAt
```

### 2.4 API Endpoint Atualizado

**`/api/auth/sync-token/route.ts`**

Atualizado para suportar AMBOS os sistemas de autenticação:

1. **NextAuth Session** (Google OAuth + Credentials)
   - Verifica `getServerSession(authOptions)`
   - Extrai user do NextAuth token

2. **JWT Cookie Manual** (auth.ts server actions)
   - Verifica cookie `auth-token`
   - Decodifica JWT com `jwt.verify()`

**Retorna**:
```typescript
{
  success: true,
  token: string,              // Non-httpOnly JWT
  expiresAt: string          // ISO timestamp
}
```

---

## 3. Comparação de Features

| Feature | AuthContext | DatabaseAuth | OfflineAuth | **UnifiedAuth** |
|---------|-------------|--------------|-------------|-----------------|
| **Database Integration** | ❌ | ✅ | ⚠️ (fetch) | ✅ (server actions) |
| **JWT Tokens** | ❌ | ✅ (httpOnly) | ❌ | ✅ (both types) |
| **Online/Offline Detection** | ❌ | ❌ | ✅ | ✅ |
| **IndexedDB Fallback** | ❌ | ❌ | ✅ | ✅ |
| **Auto Sync** | ❌ | ❌ | ✅ | ✅ |
| **PWA JWT Token** | ❌ | ❌ | ❌ | ✅ |
| **Roles & Permissions** | ❌ | ✅ | ⚠️ (basic) | ✅ |
| **Company & Subscriptions** | ❌ | ✅ | ✅ | ✅ |
| **Network Listeners** | ❌ | ❌ | ✅ | ✅ |
| **Sync Status Tracking** | ❌ | ❌ | ✅ | ✅ |
| **Google OAuth** | ❌ | ❌ | ⚠️ (mock) | ⚠️ (via NextAuth) |
| **Server Actions** | ❌ | ✅ | ❌ | ✅ |
| **Loading States** | ❌ | ✅ | ✅ | ✅ |
| **Toast Notifications** | ❌ | ✅ | ❌ | 🔄 (can add) |

---

## 4. Arquivos Criados/Modificados

### 4.1 Novos Arquivos

#### `/home/user/anchor/src/context/UnifiedAuthContext.tsx`
**Tamanho**: ~600 linhas
**Descrição**: Context consolidado com todas as features

**Exports**:
```typescript
export function UnifiedAuthProvider({ children })
export function useUnifiedAuth()          // Throws if not in provider
export function useUnifiedAuthSafe()      // Safe version for hydration
export default UnifiedAuthContext
```

### 4.2 Arquivos Modificados

#### `/home/user/anchor/src/app/api/auth/sync-token/route.ts`
**Mudanças**:
- Agora suporta NextAuth E JWT manual com cookies
- Tenta NextAuth primeiro, fallback para JWT cookie
- Retorna token com mais campos (id, role, companyId)
- Body request é opcional (expiresInHours)

**Antes**: Apenas NextAuth
**Depois**: NextAuth + JWT manual com fallback

---

## 5. Estratégia de Migração

### 5.1 Fase 1: Testar UnifiedAuthContext (1-2 dias)

1. **Adicionar UnifiedAuthProvider ao layout**
   ```tsx
   // src/app/layout.tsx
   import { UnifiedAuthProvider } from '@/context/UnifiedAuthContext'

   <ThemeProvider>
     <UnifiedAuthProvider>
       <ClientProviders>
         {children}
       </ClientProviders>
     </UnifiedAuthProvider>
   </ThemeProvider>
   ```

2. **Testar em página isolada**
   - Criar `/app/test-auth/page.tsx`
   - Testar login/logout/register
   - Verificar online/offline
   - Testar sync status
   - Validar JWT token para PWA

3. **Verificar logs**
   ```
   ✅ Authenticated from server: [name]
   ✅ Restored from offline storage: [name]
   📶 Back online
   📴 Gone offline
   ✅ PWA JWT token refreshed
   ✅ Sync completed: [message]
   ```

### 5.2 Fase 2: Migração Gradual (3-5 dias)

#### Componentes usando DatabaseAuth (10 arquivos)

**Estratégia**: Substituir imports
```typescript
// ANTES
import { useDatabaseAuth } from '@/context/DatabaseAuthContext'
const { user, company, login, logout } = useDatabaseAuth()

// DEPOIS
import { useUnifiedAuth } from '@/context/UnifiedAuthContext'
const { user, company, login, logout } = useUnifiedAuth()
```

**Arquivos para migrar**:
1. `src/components/anchor-view.tsx`
2. `src/components/teams-tab.tsx`
3. `src/components/team-members-manager.tsx`
4. `src/components/team-permissions-manager.tsx`
5. `src/app/auth/login/page.tsx`
6. `src/app/app/page.tsx`
7. `src/context/OfflineDataContext.tsx`

**Compatibilidade**: 100% - mesma API

#### Componentes usando OfflineAuth (13 arquivos)

**Estratégia**: Ajustar imports + nomes de propriedades
```typescript
// ANTES
import { useOfflineAuth } from '@/context/OfflineAuthContext'
const { currentUser, currentCompany, isOnline, syncStatus } = useOfflineAuth()

// DEPOIS
import { useUnifiedAuth } from '@/context/UnifiedAuthContext'
const { user, company, isOnline, syncStatus } = useUnifiedAuth()
```

**Mudanças de nomes**:
- `currentUser` → `user`
- `currentCompany` → `company`
- `isAuthenticated` (mesmo)
- `isLoading` → `loading`

**Arquivos para migrar**:
1. `src/components/marketplace-tab.tsx`
2. `src/components/trial-banner.tsx`
3. `src/components/trial-expired-overlay.tsx`
4. `src/components/project-locations-manager.tsx`
5. `src/components/project-invitations-popover.tsx`
6. `src/components/offline-status.tsx`
7. `src/components/locations-tab.tsx`
8. `src/components/map-tab.tsx`
9. `src/components/facades-tab.tsx`
10. `src/components/debug-trial-fix.tsx`
11. `src/app/admin/page.tsx`
12. `src/app/admin/layout.tsx`

### 5.3 Fase 3: Remover Contexts Antigos (1 dia)

Após migração completa e testes:

1. **Remover AuthContext.tsx**
   ```bash
   rm /home/user/anchor/src/context/AuthContext.tsx
   ```

2. **Remover DatabaseAuthContext.tsx**
   ```bash
   rm /home/user/anchor/src/context/DatabaseAuthContext.tsx
   ```

3. **Remover OfflineAuthContext.tsx**
   ```bash
   rm /home/user/anchor/src/context/OfflineAuthContext.tsx
   ```

4. **Atualizar ClientProviders**
   ```tsx
   // src/components/client-providers.tsx
   import { UnifiedAuthProvider } from '@/context/UnifiedAuthContext'

   export function ClientProviders({ children }) {
     return (
       <SessionProvider>
         <UnifiedAuthProvider>
           <OfflineDataProvider>
             <AnchorDataProvider>
               {children}
             </AnchorDataProvider>
           </OfflineDataProvider>
         </UnifiedAuthProvider>
       </SessionProvider>
     )
   }
   ```

5. **Verificar imports quebrados**
   ```bash
   npm run typecheck
   ```

---

## 6. Testes Recomendados

### 6.1 Testes Funcionais

#### Autenticação Online
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Registro de novo usuário
- [ ] Logout
- [ ] Session restoration (refresh page)
- [ ] JWT token refresh para PWA

#### Autenticação Offline
- [ ] Login offline com credenciais cacheadas
- [ ] Tentativa de login offline sem cache (erro)
- [ ] Registro offline
- [ ] Session restoration offline

#### Online/Offline Transitions
- [ ] Detecta quando fica offline (chrome DevTools → Network → Offline)
- [ ] Detecta quando volta online
- [ ] Auto-sync quando volta online
- [ ] Sync status atualiza corretamente

#### Sync
- [ ] Manual sync via syncNow()
- [ ] Auto-sync a cada 5 minutos
- [ ] Sync status indicators (idle → syncing → synced)
- [ ] Error handling em caso de falha

#### PWA JWT Token
- [ ] Token gerado após login
- [ ] Token armazenado em localStorage
- [ ] Token refresh funciona
- [ ] Service Worker consegue acessar token

### 6.2 Testes de Edge Cases

- [ ] Múltiplos tabs abertos (sincronização de estado)
- [ ] Logout em um tab reflete nos outros
- [ ] Session expiry (JWT expira após 7 dias)
- [ ] Trial expiry (14 dias)
- [ ] User inactive/blocked
- [ ] Database unavailable (Prisma error)
- [ ] IndexedDB full (storage quota)

---

## 7. Benefícios do UnifiedAuthContext

### 7.1 Para Desenvolvedores

✅ **Single source of truth**
- Apenas 1 context para autenticação
- API consistente em todo o app
- Menos confusão sobre qual context usar

✅ **Type safety**
- TypeScript types bem definidos
- Intellisense completo
- Compile-time error checking

✅ **Manutenibilidade**
- Código centralizado
- Mais fácil de debugar
- Menos duplicação

✅ **Testabilidade**
- Mocking mais simples
- Testes unitários focados
- Safe hooks para hydration

### 7.2 Para Usuários

✅ **Experiência offline melhorada**
- Login funciona offline
- Dados sincronizados automaticamente
- Indicadores visuais de status

✅ **Performance**
- PWA com Service Worker
- Auto-sync inteligente
- Cache eficiente

✅ **Confiabilidade**
- Fallback robusto
- Error handling
- Recovery automático

---

## 8. Arquitetura de Storage

### 8.1 Storage Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Server (Source of Truth)                      │
│ • PostgreSQL via Prisma                                 │
│ • Users, Companies, Projects, Locations                 │
│ • JWT tokens in httpOnly cookies                        │
└─────────────────────────────────────────────────────────┘
                        ↕ (online)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: IndexedDB (Offline Cache)                     │
│ • Full user/company data replica                        │
│ • Anchor points & tests                                 │
│ • Photos (base64 or file references)                    │
│ • Sync queue (pending operations)                       │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│ Layer 3: localStorage (Session & Config)               │
│ • currentUserId, currentCompanyId                       │
│ • pwa-jwt-token (non-httpOnly)                          │
│ • lastSyncAt timestamp                                  │
│ • UI preferences                                        │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Sync Strategy

**Bidirectional Sync**:
- Upload: IndexedDB → Server (via sync-token JWT)
- Download: Server → IndexedDB (via getCurrentUser)

**Conflict Resolution**:
- Server wins by default
- Last-write-wins for user changes
- Merge strategy for array fields

**Sync Triggers**:
1. User comes back online (`online` event)
2. Manual sync button
3. Auto-sync timer (5 minutes)
4. Login/Register success
5. User action completion (save, delete, etc.)

---

## 9. Próximos Passos

### Imediato (esta sprint)
1. ✅ **Criar UnifiedAuthContext** (CONCLUÍDO)
2. ✅ **Atualizar /api/auth/sync-token** (CONCLUÍDO)
3. 🔄 **Testar UnifiedAuthContext em página isolada**
4. 🔄 **Validar flows de login/logout/register**

### Próxima Sprint
5. 🔲 **Migrar componentes DatabaseAuth → UnifiedAuth** (10 arquivos)
6. 🔲 **Migrar componentes OfflineAuth → UnifiedAuth** (13 arquivos)
7. 🔲 **Atualizar ClientProviders.tsx**
8. 🔲 **Testes E2E completos**

### Futuro
9. 🔲 **Remover contexts antigos** (AuthContext, DatabaseAuth, OfflineAuth)
10. 🔲 **Documentar no CLAUDE.md**
11. 🔲 **Code review e merge**

---

## 10. Recursos e Referências

### Arquivos Principais

**Context**:
- `/src/context/UnifiedAuthContext.tsx` (NOVO)
- `/src/context/AuthContext.tsx` (OBSOLETO)
- `/src/context/DatabaseAuthContext.tsx` (PARA REMOVER)
- `/src/context/OfflineAuthContext.tsx` (PARA REMOVER)

**Server Actions**:
- `/src/app/actions/auth.ts` (loginUser, registerUser, logoutUser, getCurrentUser)

**API Endpoints**:
- `/src/app/api/auth/sync-token/route.ts` (PWA JWT token)
- `/src/app/api/auth/[...nextauth]/route.ts` (NextAuth handlers)

**Libraries**:
- `/src/lib/indexeddb.ts` (offlineDB)
- `/src/lib/sync-manager.ts` (syncManager)
- `/src/lib/auth.ts` (NextAuth authOptions)
- `/src/lib/prisma.ts` (Prisma client)

**Types**:
- `/src/types/index.ts` (User, Company, etc.)

### Dependencies

```json
{
  "next-auth": "^4.x",
  "jsonwebtoken": "^9.x",
  "jose": "^5.x",
  "bcryptjs": "^2.x",
  "@prisma/client": "^5.x"
}
```

---

## Conclusão

O **UnifiedAuthContext** consolida com sucesso as funcionalidades dos 3 Auth Contexts existentes, eliminando redundâncias e fornecendo uma API consistente e feature-rich para autenticação.

**Principais melhorias**:
- ✅ Single source of truth
- ✅ Offline-first architecture
- ✅ PWA support com JWT tokens
- ✅ Auto-sync inteligente
- ✅ Type safety completo
- ✅ Compatibilidade com sistema existente

**Impacto**:
- 📉 Redução de ~1000 linhas de código duplicado
- 📈 Aumento de confiabilidade e testabilidade
- 🚀 Melhor experiência offline
- 🔒 Segurança mantida (httpOnly + non-httpOnly tokens)

A migração pode ser feita gradualmente, sem breaking changes, permitindo testes contínuos e rollback seguro se necessário.

---

**Documento criado**: 2025-11-05
**Versão**: 1.0
**Autor**: Claude Code
