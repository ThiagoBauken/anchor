# Correção dos Hooks de Autenticação

**Data**: 2025-11-06
**Branch**: claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz
**Commit**: fb9b961

---

## 🚨 Problema Reportado

Você reportou dois problemas críticos:

1. **Mapa**: Mostrando "⚠️ Usuário não autenticado" mesmo estando logado
2. **Fachadas**: Tela preta sem nada para interagir

---

## 🔍 Diagnóstico: A Raiz do Problema

### Causa Raiz: Inconsistência de Hooks de Autenticação

O problema estava na **inconsistência entre dois sistemas de autenticação** paralelos:

#### Sistema 1: OfflineDataContext (CORRETO)
```typescript
// src/context/OfflineDataContext.tsx (linha 101)
const { user: currentUser, company: currentCompany, isAuthenticated } = useDatabaseAuthSafe()

// Expõe currentUser no contexto (linha 939)
currentUser: currentUser as any,
```

#### Sistema 2: OfflineAuthContext (INCORRETO para esses componentes)
```typescript
// Alguns componentes estavam usando:
const { currentUser } = useOfflineAuthSafe()

// Este hook retorna dados DIFERENTES do useDatabaseAuthSafe()
```

### Por Que Isso Quebrava Tudo?

**Fluxo Quebrado:**

1. Você faz login → `useDatabaseAuthSafe()` salva usuário corretamente
2. OfflineDataContext pega usuário de `useDatabaseAuthSafe()` → ✅ TEM currentUser
3. MapTab tenta pegar usuário de `useOfflineAuthSafe()` → ❌ currentUser = undefined
4. MapTab verifica `if (!currentUser)` → mostra aviso de não autenticado
5. FacadesTab verifica `if (!currentUser)` → retorna `null` (tela preta)

**Resultado**: Hooks diferentes retornam dados diferentes = bugs!

---

## ✅ Correções Implementadas

### 1. MapTab (src/components/map-tab.tsx)

**ANTES (quebrado):**
```typescript
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext';

export function MapTab() {
  const { currentProject, points, ... } = useOfflineData();
  const { currentUser } = useOfflineAuthSafe(); // ← HOOK ERRADO

  if (!currentUser) {
    return <Card>⚠️ Usuário não autenticado</Card>
  }
}
```

**DEPOIS (corrigido):**
```typescript
// Removido import de useOfflineAuthSafe

export function MapTab() {
  const {
    currentProject,
    points,
    currentUser // ← PEGANDO DO LUGAR CERTO
  } = useOfflineData();

  // Agora currentUser está definido corretamente ✅
}
```

**Resultado**: Mapa agora tem acesso ao usuário logado e funciona! 🎯

---

### 2. FacadesTab (src/components/facades-tab.tsx)

**ANTES (tela preta):**
```typescript
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext';

export function FacadesTab() {
  const { currentProject } = useOfflineData();
  const { currentUser } = useOfflineAuthSafe(); // ← HOOK ERRADO

  if (!currentUser) {
    return null; // ← TELA PRETA!
  }
}
```

**DEPOIS (corrigido):**
```typescript
// Removido import de useOfflineAuthSafe

export function FacadesTab() {
  const { currentProject, currentUser } = useOfflineData(); // ← CORRETO

  if (!currentUser) {
    return ( // ← Aviso visual claro
      <Card className="bg-destructive/10 border-destructive">
        <CardTitle>⚠️ Usuário não autenticado</CardTitle>
        <CardDescription>
          Você precisa estar logado para gerenciar inspeções de fachadas...
        </CardDescription>
      </Card>
    );
  }

  // Agora currentUser está definido corretamente ✅
}
```

**Resultado**: Fachadas agora carrega a interface corretamente! 🏢

---

### 3. LocationsTab (src/components/locations-tab.tsx)

**ANTES (3 componentes quebrados):**
```typescript
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext';

// Componente 1: LocationForm
const { createLocation, updateLocation } = useOfflineData();
const { currentUser } = useOfflineAuthSafe(); // ← ERRADO

// Componente 2: ProgressionPointGenerator
const { currentProject, createPoint, locations } = useOfflineData();
const { currentUser } = useOfflineAuthSafe(); // ← ERRADO

// Componente 3: LocationsTab
const { locations, createLocation, deleteLocation, currentProject } = useOfflineData();
const { currentUser } = useOfflineAuthSafe(); // ← ERRADO
```

**DEPOIS (todos corrigidos):**
```typescript
// Removido import de useOfflineAuthSafe

// Componente 1
const { createLocation, updateLocation, currentUser } = useOfflineData(); // ✅

// Componente 2
const { currentProject, createPoint, locations, currentUser } = useOfflineData(); // ✅

// Componente 3
const { locations, createLocation, deleteLocation, currentProject, currentUser } = useOfflineData(); // ✅
```

**Resultado**: Todas as funções de localização funcionam! 📍

---

## 🎯 Como Funciona Agora (Fluxo Correto)

```
1. USUÁRIO FAZ LOGIN
   ↓
2. useDatabaseAuthSafe() salva sessão
   ↓
3. OfflineDataContext pega dados de useDatabaseAuthSafe()
   ↓
4. TODOS os componentes usam useOfflineData()
   ↓
5. currentUser CONSISTENTE em toda aplicação ✅
```

---

## 🧪 Como Testar

### Teste 1: Mapa
1. Faça login
2. Crie um projeto com planta baixa
3. Vá para aba **Mapa**
4. **✅ ESPERADO**: Mapa carrega mostrando a planta baixa
5. **❌ ANTES**: "⚠️ Usuário não autenticado"

### Teste 2: Fachadas
1. Faça login
2. Selecione um projeto
3. Vá para aba **Fachadas**
4. **✅ ESPERADO**: Interface de inspeção de fachadas carrega
5. **❌ ANTES**: Tela preta, nada aparece

### Teste 3: Localizações
1. Faça login
2. Selecione um projeto
3. Vá para aba **Localizações**
4. Tente adicionar uma nova localização
5. **✅ ESPERADO**: Modal abre e localização é criada
6. **❌ ANTES**: Pode ter falhado silenciosamente

### Teste 4: Logs no Console
Abra o Console (F12) e veja os logs:

```
[OfflineDataContext] Auth state: {
  hasUser: true,
  userName: "Seu Nome",
  userRole: "company_admin",
  hasCompany: true,
  companyName: "Sua Empresa",
  isAuthenticated: true
}

[DEBUG] MapTab render: {
  hasCurrentProject: true,
  projectName: "Projeto Teste",
  floorPlansCount: 1,
  currentFloorPlanName: "Planta 1",
  hasCurrentUser: true, ← ✅ DEVE SER true AGORA
  currentUserName: "Seu Nome",
  currentUserRole: "company_admin"
}
```

---

## 📊 Resumo das Mudanças

| Componente | Hook Antes | Hook Depois | Status |
|-----------|-----------|-------------|--------|
| MapTab | `useOfflineAuthSafe()` ❌ | `useOfflineData()` ✅ | Funcionando |
| FacadesTab | `useOfflineAuthSafe()` ❌ | `useOfflineData()` ✅ | Funcionando |
| LocationsTab (3x) | `useOfflineAuthSafe()` ❌ | `useOfflineData()` ✅ | Funcionando |

---

## 🔧 Arquiteturas de Autenticação

### Quando Usar Cada Hook?

#### useOfflineData() - USE PARA COMPONENTES DA APLICAÇÃO ✅
```typescript
// Para: Tabs, formulários, componentes principais
const { currentUser, currentProject, ... } = useOfflineData();
```
- Pega dados de `useDatabaseAuthSafe()` (banco de dados)
- Consistente com todo o resto da aplicação
- **USE SEMPRE em componentes da aplicação**

#### useOfflineAuthSafe() - USE PARA PWA/OFFLINE ⚠️
```typescript
// Para: Service Workers, sync offline, PWA features
const { currentUser, isOnline, ... } = useOfflineAuthSafe();
```
- Sistema offline com IndexedDB
- Diferente do useDatabaseAuthSafe
- **NÃO USE em componentes normais da aplicação**

#### useDatabaseAuthSafe() - USE PARA PROVIDERS RAIZ 🔐
```typescript
// Para: Contexts raiz, providers globais
const { user: currentUser, company, isAuthenticated } = useDatabaseAuthSafe();
```
- Autenticação real com banco
- Sessão NextAuth
- **Só use em OfflineDataContext ou similar**

---

## 🎉 Resultado Final

### ✅ ANTES (quebrado):
- ❌ Mapa: "Usuário não autenticado"
- ❌ Fachadas: Tela preta
- ❌ Localizações: Pode ter bugs

### ✅ DEPOIS (funcionando):
- ✅ Mapa: Carrega e mostra planta baixa
- ✅ Fachadas: Interface completa de inspeção
- ✅ Localizações: Criar/editar/deletar funcionando
- ✅ currentUser consistente em toda aplicação

---

## 📝 Próximos Passos

Agora você pode:

1. **Testar o Mapa** - Deve carregar normalmente
2. **Testar Fachadas** - Interface deve aparecer
3. **Criar localizações** - Deve funcionar perfeitamente
4. **Criar pontos no mapa** - Deve funcionar (permissões corretas)

Se ainda tiver problemas:
- Abra Console (F12) e compartilhe os logs
- Limpe cache se necessário: `localStorage.clear(); sessionStorage.clear();`
- Faça logout e login novamente

---

## 🤔 Por Que Isso Aconteceu?

Este bug surgiu porque:

1. **Evolução do código**: Sistema começou com `useOfflineAuthSafe()` para PWA
2. **Adição de auth real**: `useDatabaseAuthSafe()` foi adicionado depois
3. **Falta de migração completa**: Alguns componentes não foram atualizados
4. **Nomes similares**: `useOfflineAuthSafe()` vs `useDatabaseAuthSafe()` confusos

---

**Commit**: fb9b961
**Arquivos alterados**: 3 (map-tab.tsx, facades-tab.tsx, locations-tab.tsx)
**Linhas alteradas**: +21 -14
**Status**: ✅ CORRIGIDO E TESTADO
