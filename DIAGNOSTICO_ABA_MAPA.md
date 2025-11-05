# 🗺️ DIAGNÓSTICO: Por que a ABA MAPA não funciona

**Status atual**: Mostra "Nenhuma planta baixa selecionada. Adicione uma na aba 'Projetos'."

---

## 📋 COMO DEVERIA FUNCIONAR (Fluxo Normal)

### **Passo 1: Usuário faz login**
```
1. Login com email/senha
2. Backend busca user do banco
3. User tem companyId associado
4. Session armazena user info
```

### **Passo 2: Sistema carrega projeto**
```typescript
// OfflineDataContext.tsx (linha 170-213)

useEffect(() => {
  const loadFloorPlans = async () => {
    if (!currentProject) {
      setFloorPlans([])      // ❌ Sem projeto → sem plantas
      return
    }

    console.log('🔄 Loading floor plans for project:', currentProject.name)

    // Busca floor plans do banco via server action
    const loadedFloorPlans = await getFloorPlansForProject(currentProject.id)

    // Converte para formato correto
    const convertedFloorPlans = loadedFloorPlans.map(fp => ({
      id: fp.id,
      name: fp.name,
      image: fp.image,  // ⬅️ BASE64 da planta baixa!
      ...
    }))

    setFloorPlans(convertedFloorPlans)
    console.log('✅ Floor plans loaded:', convertedFloorPlans.length)
  }

  loadFloorPlans()
}, [currentProject?.id])
```

### **Passo 3: MapTab renderiza**
```typescript
// map-tab.tsx (linha 51-63)

const {
  currentProject,        // ⬅️ Projeto selecionado
  floorPlans,           // ⬅️ Array de plantas baixas do projeto
  currentFloorPlan,     // ⬅️ Planta selecionada
  setCurrentFloorPlan,  // ⬅️ Função para selecionar
} = useOfflineData()

// Linha 91-93: Filtra pontos pela planta selecionada
const filteredPoints = currentFloorPlan
  ? points.filter(p => p.floorPlanId === currentFloorPlan.id)
  : points
```

### **Passo 4: FloorPlanSelector mostra opções**
```typescript
// map-tab.tsx (linha 268-278)

<FloorPlanSelector
  floorPlans={floorPlans || []}           // ⬅️ Lista de plantas
  activeFloorPlanId={currentFloorPlan?.id}  // ⬅️ Qual está ativa
  onSelectFloorPlan={handleSelectFloorPlan} // ⬅️ Callback ao selecionar
/>
```

### **Passo 5: InteractiveMap renderiza imagem**
```typescript
// map-tab.tsx (linha 280-291)

<InteractiveMap
  floorPlanImage={currentFloorPlan?.image || ''}  // ⬅️ BASE64 da imagem!
  points={filteredPoints}
  ...
/>
```

### **Passo 6: InteractiveMap valida e mostra**
```typescript
// interactive-map.tsx (linha 142-153)

// Validação: imagem precisa ser base64 válido
if (!floorPlanImage ||
    floorPlanImage.trim() === '' ||
    !floorPlanImage.startsWith('data:image')) {

  return (
    <div>
      ❌ Nenhuma planta baixa selecionada.
         Adicione uma na aba 'Projetos'.
    </div>
  )
}

// Se passou validação, renderiza:
<svg>
  <image href={floorPlanImage} />  // ⬅️ Mostra a planta!
  {/* Pontos renderizados aqui */}
</svg>
```

---

## 🐛 O QUE ESTÁ ACONTECENDO (Problema Atual)

### **Erro nos Logs (que você me mostrou)**:

```
❌ Error: Access denied: Company mismatch
   at requireCompanyMatch (auth-helpers.ts:90)
```

**Detalhes**:
- Seu User ID: `cmhkwtiuo00041d08q7gv7enl`
- Company do usuário: `cmhkslsov0001oxnzr2rhzgd6`
- Company sendo acessada: `clx3i4a7x000008l4hy822g62`  ⚠️ DIFERENTE!

---

## 🔍 POR QUE NÃO FUNCIONA (Causa Raiz)

### **Cenário Mais Provável**: Company Mismatch

```typescript
// Fluxo atual (QUEBRADO):

1. Você faz login → User carregado com companyId: cmhkslsov0001oxnzr2rhzgd6

2. currentProject é setado → Projeto tem companyId: clx3i4a7x000008l4hy822g62

3. useEffect tenta carregar floor plans:
   getFloorPlansForProject(projectId) é chamado

4. Server Action verifica acesso:
   // anchor-actions.ts ou floorplan-actions.ts
   const user = await requireAuthentication()
   await requireProjectAccess(user.id, projectId)  // ⬅️ FALHA AQUI!

5. requireProjectAccess verifica:
   - Busca projeto no banco
   - projeto.companyId = clx3i4a7x000008l4hy822g62
   - user.companyId = cmhkslsov0001oxnzr2rhzgd6
   - ❌ NÃO BATEM! → Erro 500

6. useEffect pega o erro:
   catch (error) {
     console.error('❌ Error loading floor plans:', error)
     setFloorPlans([])  // ⬅️ Array VAZIO!
   }

7. MapTab renderiza com:
   - floorPlans = []
   - currentFloorPlan = null

8. InteractiveMap recebe:
   - floorPlanImage = '' (string vazia)

9. Validação falha:
   if (!floorPlanImage || floorPlanImage.trim() === '') {
     // ⬅️ MOSTRA MENSAGEM DE ERRO
   }
```

---

## 🎯 4 POSSÍVEIS CAUSAS

### **Causa #1: Company Mismatch** ⭐⭐⭐⭐⭐ **MAIS PROVÁVEL**

**O que aconteceu:**
- Você tem 2 companies no banco
- Seu usuário pertence à Company A (`cmhkslsov0001oxnzr2rhzgd6`)
- Mas o sistema está tentando carregar projeto da Company B (`clx3i4a7x000008l4hy822g62`)

**Por que acontece:**
1. localStorage cache com project ID errado
2. App selecionou projeto errado na inicialização
3. Dados misturados de sessões anteriores

**Como verificar:**
```javascript
// Cole no Console (F12):
console.log('Current Project:', localStorage.getItem('anchorViewCurrentProject'))
```

---

### **Causa #2: Projeto sem Floor Plans no Banco** ⭐⭐⭐

**O que aconteceu:**
- Projeto existe no banco
- Mas não tem nenhum FloorPlan associado
- Query retorna array vazio: `[]`

**Como verificar:**
- Você já criou planta baixa para este projeto?
- Na aba Projetos, aparece alguma planta cadastrada?

---

### **Causa #3: Floor Plan com Image Vazio** ⭐⭐

**O que aconteceu:**
- FloorPlan existe no banco
- Mas campo `image` está NULL ou string vazia
- FloorPlan carrega mas sem imagem

**Como verificar:**
```sql
SELECT id, name, LENGTH(image) as image_size
FROM "FloorPlan"
WHERE "projectId" = 'xxx';
```

---

### **Causa #4: Falha de Autenticação** ⭐

**O que aconteceu:**
- Session expirou
- User não está autenticado
- requireAuthentication() falha

**Menos provável** porque você consegue fazer login.

---

## 🛠️ COMO RESOLVER

### **Solução 1: Limpar Cache e Reiniciar** ⭐⭐⭐⭐⭐ **TENTE PRIMEIRO**

**PASSO 1**: Limpar localStorage
```javascript
// Cole no Console do navegador (F12):
localStorage.clear();
sessionStorage.clear();
window.location.href = '/auth/login';
```

**PASSO 2**: Fazer logout e login novamente

**PASSO 3**: Selecionar projeto correto na aba Projetos

**Por que funciona:**
- Remove cache corrupto com project IDs errados
- Força recarregar tudo do zero
- Sincroniza companyId do user com project correto

---

### **Solução 2: Criar Floor Plan se não Existir** ⭐⭐⭐⭐

**PASSO 1**: Vá na aba "Projetos"

**PASSO 2**: Clique em "Adicionar Planta Baixa"

**PASSO 3**: Faça upload de uma imagem da planta

**PASSO 4**: Volte na aba "Mapa"

**Por que funciona:**
- Cria FloorPlan no banco com image base64
- Sistema detecta e carrega automaticamente

---

### **Solução 3: Trocar para Projeto da Company Certa** ⭐⭐⭐

**PASSO 1**: Na aba Dashboard, veja lista de projetos

**PASSO 2**: Selecione um projeto da SUA company

**PASSO 3**: Vá na aba Mapa

**Por que funciona:**
- Evita company mismatch
- User tem acesso garantido
- Floor plans carregam sem erro

---

### **Solução 4: Adicionar User à Company Correta (Admin)** ⭐⭐

**Se você tem acesso ao banco**:
```sql
-- Verificar companies do user
SELECT u.id, u.email, u."companyId", c.name as company_name
FROM "User" u
JOIN "Company" c ON c.id = u."companyId"
WHERE u.email = 'seu@email.com';

-- Verificar company do projeto problemático
SELECT p.id, p.name, p."companyId", c.name as company_name
FROM "Project" p
JOIN "Company" c ON c.id = p."companyId"
WHERE p.id = 'project-id-aqui';

-- Opção A: Mudar projeto para company do user
UPDATE "Project"
SET "companyId" = 'cmhkslsov0001oxnzr2rhzgd6'  -- company do user
WHERE id = 'project-id-aqui';

-- Opção B: Mudar user para company do projeto
UPDATE "User"
SET "companyId" = 'clx3i4a7x000008l4hy822g62'  -- company do projeto
WHERE id = 'cmhkwtiuo00041d08q7gv7enl';
```

**⚠️ CUIDADO**: Mudar companyId afeta acesso a TODOS os dados!

---

## 🧪 TESTE DE DIAGNÓSTICO

Vou criar um script para você identificar o problema exato:

```javascript
// Cole no Console (F12) enquanto estiver na aba Mapa:

(async () => {
  console.log('🔍 DIAGNÓSTICO DA ABA MAPA\n\n');

  // 1. Verificar localStorage
  const cachedProject = localStorage.getItem('anchorViewCurrentProject');
  console.log('1️⃣ Projeto em cache:', cachedProject);

  // 2. Verificar session storage
  const session = sessionStorage.getItem('session');
  console.log('2️⃣ Session ativa:', !!session);

  // 3. Verificar current project do context
  const projectName = document.querySelector('[class*="CardTitle"]')?.textContent;
  console.log('3️⃣ Projeto na UI:', projectName);

  // 4. Verificar floor plans
  const fpSelector = document.querySelector('[class*="FloorPlanSelector"]');
  console.log('4️⃣ FloorPlanSelector presente:', !!fpSelector);

  // 5. Verificar mensagem de erro
  const errorMsg = document.querySelector('p')?.textContent;
  if (errorMsg?.includes('Nenhuma planta')) {
    console.log('5️⃣ ❌ ERRO: Planta baixa não selecionada');
    console.log('\n🔧 CAUSA PROVÁVEL: Company mismatch ou projeto sem floor plans');
    console.log('\n💡 SOLUÇÃO: Limpe cache e faça login novamente:');
    console.log('   localStorage.clear();');
    console.log('   window.location.href = "/auth/login";');
  }

  // 6. Verificar console logs
  console.log('\n6️⃣ Procure nos logs acima por:');
  console.log('   - "🔄 Loading floor plans" → useEffect foi chamado?');
  console.log('   - "✅ Floor plans loaded: X" → Quantos carregou?');
  console.log('   - "❌ Error loading floor plans" → Teve erro?');
  console.log('   - "Access denied: Company mismatch" → Company errada!');
})();
```

---

## 📊 RESUMO EXECUTIVO

| Sintoma | Causa Provável | Solução |
|---------|---------------|---------|
| "Nenhuma planta baixa selecionada" | Company mismatch | Limpar cache + login |
| Erro 500 nos logs | User acessando projeto de outra company | Trocar projeto ou mudar company |
| FloorPlanSelector vazio | Projeto sem floor plans | Adicionar planta na aba Projetos |
| Imagem não carrega | FloorPlan.image vazio | Re-upload da imagem |

---

## ✅ AÇÃO RECOMENDADA AGORA

**1. Cole este código no Console (F12)**:
```javascript
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cache limpo! Redirecionando...');
window.location.href = '/auth/login';
```

**2. Faça login novamente**

**3. Selecione um projeto**

**4. Vá na aba Mapa**

**5. Se ainda mostrar erro, cole o script de diagnóstico e me mande o resultado**

---

**Se AINDA não funcionar após limpar cache**, o problema está no banco de dados e precisamos:
1. Verificar se projeto tem floor plans
2. Verificar se floor plans têm image válido
3. Possivelmente criar floor plan novo

---

**Relatório gerado**: 2025-11-05
**Severidade**: 🔴 Alta (feature completamente quebrada)
**Tempo estimado de correção**: 5-10 minutos (limpar cache) ou 30 min (problemas no banco)
