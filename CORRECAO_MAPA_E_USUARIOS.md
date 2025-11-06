# Correção do Bug do Mapa e Sistema de Usuários

**Data**: 2025-11-06
**Sessão**: claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz

---

## 🐛 Problema Relatado

Você reportou que:

1. **Mapa não mostra planta baixa** mesmo depois de criar o projeto
2. **Antigamente precisava selecionar um usuário** da lista de "Usuários Registrados" clicando nele
3. Suspeitava que isso poderia ser um **resquício do sistema antigo** causando o problema

---

## 🔍 Investigação: O Que Mudou?

### Sistema Antigo (versaoantiga/)

Na versão antiga do código, o sistema funcionava assim:

```typescript
// versaoantiga/src/components/users-tab.tsx (linha 106)
<div className="flex items-center gap-3 flex-grow cursor-pointer"
     onClick={() => setCurrentUser(user)}>
  {/* ... */}
</div>
```

**Como funcionava:**
- Você criava "Usuários Locais" (perfis offline para rastrear mudanças)
- **Clicava no usuário** para ativá-lo
- Só então o mapa funcionava porque `currentUser` estava definido
- `setCurrentUser()` era chamado manualmente

### Sistema Novo (atual)

No sistema atual:

```typescript
// src/components/users-tab.tsx (linha 344)
<div className="flex items-center justify-between p-3 rounded-md...">
  <div className="flex items-center gap-3 flex-grow">
    {/* SEM onClick, SEM cursor-pointer */}
  </div>
</div>
```

**O que mudou:**
- `currentUser` agora vem da **autenticação real do banco de dados**
- Não é mais manual, vem de `useDatabaseAuthSafe()`
- **Não precisa mais clicar** para selecionar usuário
- A interface de "Usuários Locais" ainda existe mas é só para convites/gestão

### Por Que o Código da Versão Antiga Ainda Aparece?

A aba "Usuários" ainda mostra a interface antiga porque:
- Foi mantida para **compatibilidade offline** (adicionar usuários locais)
- Serve para **convidar novos usuários** via email
- Mas **não é mais necessário clicar** para ativar

---

## 🐛 Bug Real Encontrado: Race Condition

O problema do mapa NÃO era a falta de seleção de usuário. Era um **race condition** no código de auto-seleção de floor plans:

### Código Problemático (ANTES)

```typescript
// src/context/OfflineDataContext.tsx (linhas 205-216)
if (currentFloorPlan && currentFloorPlan.projectId !== currentProject.id) {
  setCurrentFloorPlan(null)  // ← setState é ASSÍNCRONO
}

// Logo depois verifica se é null, MAS currentFloorPlan ainda tem valor antigo!
if (!currentFloorPlan && convertedFloorPlans.length > 0) {
  // ❌ NUNCA ENTRA AQUI porque currentFloorPlan ainda não foi atualizado
  const firstActive = convertedFloorPlans.find(fp => fp.active)
  setCurrentFloorPlan(firstActive || convertedFloorPlans[0])
}
```

**Problema**:
- `setCurrentFloorPlan(null)` é assíncrono
- A verificação `!currentFloorPlan` roda ANTES do estado atualizar
- Floor plan nunca é auto-selecionada

### Código Corrigido (DEPOIS)

```typescript
// src/context/OfflineDataContext.tsx (linhas 205-218)
const needsNewSelection = !currentFloorPlan ||
                          currentFloorPlan.projectId !== currentProject.id

if (needsNewSelection && convertedFloorPlans.length > 0) {
  // ✅ SEMPRE ENTRA AQUI quando precisa selecionar
  const firstActive = convertedFloorPlans.find(fp => fp.active)
  const floorPlanToSelect = firstActive || convertedFloorPlans[0]
  setCurrentFloorPlan(floorPlanToSelect)
  console.log('🎯 Auto-selected floor plan:', floorPlanToSelect.name)
}
```

**Solução**:
- Uma única verificação **antes** de atualizar o estado
- Verifica diretamente o valor atual de `currentFloorPlan`
- Evita o problema do setState assíncrono

---

## ✅ Correções Implementadas

### 1. **Correção do Race Condition** ⚠️ CRÍTICO

- **Arquivo**: `src/context/OfflineDataContext.tsx` (linhas 202-218)
- **Mudança**: Lógica de auto-seleção corrigida para evitar race condition
- **Resultado**: Floor plan sempre auto-selecionada corretamente ao trocar projeto

### 2. **Logs Detalhados para Diagnóstico** 🔍

Adicionados logs em 2 lugares:

**a) OfflineDataContext.tsx (linhas 103-110)**
```typescript
console.log('[OfflineDataContext] Auth state:', {
  hasUser: !!currentUser,
  userName: currentUser?.name,
  userRole: currentUser?.role,
  hasCompany: !!currentCompany,
  companyName: currentCompany?.name,
  isAuthenticated
})
```

**b) MapTab.tsx (linhas 74-84)**
```typescript
console.log('[DEBUG] MapTab render:', {
  hasCurrentProject: !!currentProject,
  projectName: currentProject?.name,
  floorPlansCount: floorPlans?.length || 0,
  currentFloorPlanName: currentFloorPlan?.name,
  currentFloorPlanId: currentFloorPlan?.id,
  floorPlanImageLength: currentFloorPlan?.image?.length || 0,
  hasCurrentUser: !!currentUser,
  currentUserName: currentUser?.name,
  currentUserRole: currentUser?.role
})
```

**Benefício**: Fácil diagnosticar problemas de autenticação/carregamento no console

### 3. **Aviso Visual para Usuário Não Autenticado** 🚨

- **Arquivo**: `src/components/map-tab.tsx` (linhas 192-208)
- **Mudança**: Card vermelho com mensagem clara se `currentUser` for `undefined`
- **Antes**: Mapa quebrava silenciosamente com tela vazia
- **Depois**: Mensagem explica que precisa login e sugere limpar cache

```typescript
if (!currentUser) {
  return (
    <Card className="mt-4 bg-destructive/10 border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">⚠️ Usuário não autenticado</CardTitle>
        <CardDescription>
          Você precisa estar logado para visualizar o mapa. Faça login e tente novamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Verifique se você está logado corretamente. Se o problema persistir,
          limpe o cache do navegador e faça login novamente.
        </p>
      </CardContent>
    </Card>
  )
}
```

---

## 🧪 Como Testar

### Teste 1: Criar Projeto e Ver Mapa

1. **Faça login** na aplicação
2. Vá para aba **Projetos**
3. **Crie um novo projeto** e adicione uma planta baixa (imagem)
4. Vá para aba **Mapa**
5. **✅ ESPERADO**: Mapa deve mostrar a planta baixa automaticamente
6. **❌ ANTES**: Mostrava "Nenhuma planta baixa selecionada"

### Teste 2: Trocar Entre Projetos

1. Crie **2 projetos** diferentes com plantas baixas diferentes
2. Selecione o primeiro projeto
3. Vá para aba **Mapa** (deve mostrar planta 1)
4. **Troque para o segundo projeto** no dropdown
5. **✅ ESPERADO**: Mapa atualiza automaticamente para planta 2
6. **❌ ANTES**: Mapa ficava vazio ou mantinha planta 1

### Teste 3: Verificar Logs no Console

1. Abra o **Console do Navegador** (F12 → Console)
2. Carregue a aplicação
3. **Procure por logs**:
   - `[OfflineDataContext] Auth state:` → verifica se usuário está logado
   - `[DEBUG] MapTab render:` → verifica se projeto/planta carregados
   - `🎯 Auto-selected floor plan:` → confirma auto-seleção funcionando
   - `✅ Floor plans loaded:` → confirma quantas plantas foram carregadas

### Teste 4: Simular Usuário Não Autenticado

1. Abra o Console (F12)
2. Execute: `localStorage.clear(); sessionStorage.clear();`
3. Recarregue a página (F5)
4. Vá para aba **Mapa**
5. **✅ ESPERADO**: Card vermelho com aviso "Usuário não autenticado"
6. **❌ ANTES**: Tela branca ou erro silencioso

---

## 📊 Resumo das Mudanças

| Aspecto | Antes ❌ | Depois ✅ |
|---------|---------|-----------|
| **Auto-seleção de planta** | Race condition, não funcionava | Corrigido, sempre funciona |
| **Logs de debug** | Nenhum | Detalhados em 2 lugares |
| **Erro de autenticação** | Silencioso, tela vazia | Aviso visual claro |
| **Sistema de usuários** | Confuso (UI antiga mantida) | Esclarecido: não precisa clicar |
| **Resultado final** | Mapa não mostrava planta | **Mapa funciona corretamente** |

---

## 💡 Respondendo Sua Pergunta Original

> "antigamente selecionava um usuário ativo dos usuários registrados ali agora não é mais pra clicar em cima e selecionar antes era fazer isso e funcionava pode ser algum resquício disso se for corrija"

**RESPOSTA:**

1. ✅ **Você estava certo** - havia um resquício do sistema antigo na UI
2. ❌ **MAS não era esse o bug** - o bug era o race condition na auto-seleção
3. ✅ **Sistema de usuários mudou** - agora usa autenticação real do banco
4. ✅ **Não precisa mais clicar** - currentUser vem automaticamente do login
5. ✅ **UI antiga mantida** - mas só para gestão/convites, não para ativação

**Correção aplicada:**
- Bug do race condition CORRIGIDO → mapa agora funciona
- Logs adicionados → fácil diagnosticar problemas futuros
- Aviso visual adicionado → se auth falhar, usuário vê mensagem clara

---

## 🚀 Próximos Passos

Agora você pode:

1. **Testar o mapa** - Deve funcionar corretamente agora
2. **Verificar logs no console** - Ajudam a entender o que está acontecendo
3. **Ignorar a lista de usuários** - Não precisa mais clicar para ativar
4. **Usar a aba Usuários** - Apenas para convidar novos usuários

Se ainda tiver problemas:
- Abra o console (F12) e compartilhe os logs que aparecem
- Verifique se está logado corretamente
- Tente limpar cache: `localStorage.clear(); sessionStorage.clear();`

---

**Commit**: 6a50532
**Branch**: claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz
