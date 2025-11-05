# CORREÇÕES RÁPIDAS - Abas Mapa, Fachada e Marketplace

**Este documento foca nas correções específicas para fazer as 3 abas funcionarem imediatamente.**

---

## 🗺️ ABA MAPA - Planta Baixa Não Aparece

### Problema Principal
As plantas baixas não são exibidas por 3 motivos:
1. Validação inadequada de string vazia
2. anchorPoints sempre retorna 0
3. Sem tratamento de erro de carregamento

### CORREÇÃO RÁPIDA (10 minutos)

#### Passo 1: Corrigir validação de imagem
**Arquivo:** `src/components/interactive-map.tsx` (linha 136)

```typescript
// SUBSTITUIR ESTA LINHA:
if (!floorPlanImage) {

// POR ESTAS LINHAS:
if (!floorPlanImage || floorPlanImage.trim() === '' || !floorPlanImage.startsWith('data:image')) {
```

#### Passo 2: Adicionar logs de erro
**Arquivo:** `src/components/interactive-map.tsx` (linha 115)

```typescript
// ADICIONAR DENTRO DO img.onerror:
img.onerror = () => {
  console.error('[MAP ERROR] Failed to load floor plan:', {
    floorPlanName: currentFloorPlan?.name,
    hasImage: !!floorPlanImage,
    imageLength: floorPlanImage?.length,
    imageStart: floorPlanImage?.substring(0, 50)
  });

  // ... resto do código existente
};
```

#### Passo 3: Corrigir contagem de pontos
**Arquivo:** `src/context/OfflineDataContext.tsx` (linha 193)

```typescript
// SUBSTITUIR:
anchorPoints: []

// POR:
anchorPoints: new Array((fp as any)._count?.anchorPoints || 0).fill({})
```

#### Passo 4: Mostrar floor plans inativos
**Arquivo:** `src/components/floor-plan-selector.tsx` (linha 101)

```typescript
// SUBSTITUIR:
{activeFloorPlans.map((floorPlan) => (

// POR:
{sortedFloorPlans.map((floorPlan) => (
  <SelectItem
    key={floorPlan.id}
    value={floorPlan.id}
    disabled={!floorPlan.active}
  >
    {floorPlan.name} {!floorPlan.active && '(Inativa)'}
  </SelectItem>
))}
```

### Testar
1. Abrir aba Mapa
2. Selecionar um projeto com planta baixa
3. Verificar se a imagem carrega
4. Abrir console do browser (F12) e verificar logs

---

## 🏢 ABA FACHADA - Não Aparece/Não Funciona

### Problema Principal
1. Tabelas do banco não existem (migração não rodada)
2. Parâmetro errado em createPathologyCategory
3. Aba não está integrada na aplicação

### CORREÇÃO RÁPIDA (15 minutos)

#### Passo 1: Rodar migração do banco
```bash
cd /home/user/anchor
npx prisma migrate dev --name add_facade_inspections
npx prisma generate
```

#### Passo 2: Corrigir parâmetro
**Arquivo:** `src/components/facade-inspection-manager.tsx` (linha 192)

```typescript
// SUBSTITUIR:
const category = await createPathologyCategory(
  companyId,  // ← ERRADO

// POR:
const category = await createPathologyCategory(
  projectId,  // ← CORRETO
```

#### Passo 3: Integrar a aba
**Arquivo:** `src/components/anchor-view.tsx`

```typescript
// 1. ADICIONAR IMPORT no topo:
import { FacadesTab } from './facades-tab';

// 2. PROCURAR POR <TabsList> e ADICIONAR:
<TabsTrigger value="facades">
  <Building className="h-4 w-4 mr-2" />
  Fachadas
</TabsTrigger>

// 3. PROCURAR POR outros <TabsContent> e ADICIONAR:
<TabsContent value="facades" className="flex-1 overflow-hidden">
  <FacadesTab />
</TabsContent>
```

### Testar
1. Reiniciar aplicação: `npm run dev`
2. Fazer login
3. Verificar se aparece aba "Fachadas"
4. Criar uma inspeção de fachada
5. Adicionar marcadores de patologia

---

## 🏪 ABA MARKETPLACE - Mostra 0 Membros

### Problema Principal
1. Campo `usersCount` nunca é atualizado (sempre 0)
2. Sem tratamento de erro no UI
3. Sem validação de permissão no server action

### CORREÇÃO RÁPIDA (5 minutos)

#### Passo 1: Corrigir contagem de usuários
**Arquivo:** `src/app/actions/marketplace-actions.ts` (linha 118)

```typescript
// SUBSTITUIR:
usersCount: company.usersCount,  // ← Sempre 0

// POR:
usersCount: company.users.length,  // ← Conta real
```

#### Passo 2: Também corrigir membersCount
**Mesma arquivo, mesma função** (linha ~125)

```typescript
// SUBSTITUIR:
teams: company.teams.map(team => ({
  id: team.id,
  name: team.name,
  cnpj: team.cnpj,
  certifications: team.certifications,
  insurance: team.insurance,
  membersCount: 0,  // ← ADICIONAR: team.members?.length || 0,
  manager: team.members?.find(m => m.role === 'leader')?.user
}))
```

#### Passo 3: Adicionar tratamento de erro no UI
**Arquivo:** `src/components/marketplace-tab.tsx` (linha 75)

```typescript
// ADICIONAR estado de erro no início do componente:
const [error, setError] = useState<string | null>(null)

// ATUALIZAR função loadCompanies:
async function loadCompanies() {
  setIsLoading(true)
  setError(null)  // ← ADICIONAR

  try {
    const data = await getClimbingCompanies()
    setCompanies(data)
  } catch (error) {
    console.error('Error loading climbing companies:', error)
    setError('Erro ao carregar empresas. Tente novamente.')  // ← ADICIONAR
  } finally {
    setIsLoading(false)
  }
}

// ADICIONAR no JSX, antes do {isLoading ? ... :
{error && (
  <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
    <p className="text-destructive">{error}</p>
    <button
      onClick={loadCompanies}
      className="mt-2 text-sm underline"
    >
      Tentar novamente
    </button>
  </div>
)}
```

### Testar
1. Abrir aba Marketplace
2. Verificar se mostra contagem correta de membros
3. Verificar se empresas sem membros mostram "0 membros"

---

## ✅ CHECKLIST COMPLETA

### Aba Mapa
```
[ ] Corrigir validação de floorPlanImage (interactive-map.tsx:136)
[ ] Adicionar logs de erro (interactive-map.tsx:115)
[ ] Corrigir anchorPoints count (OfflineDataContext.tsx:193)
[ ] Mostrar floor plans inativos (floor-plan-selector.tsx:101)
[ ] Testar upload de planta baixa
[ ] Testar visualização de planta baixa existente
```

### Aba Fachada
```
[ ] Rodar migração: npx prisma migrate dev --name add_facade_inspections
[ ] Rodar: npx prisma generate
[ ] Corrigir parâmetro companyId → projectId (facade-inspection-manager.tsx:192)
[ ] Adicionar import de FacadesTab (anchor-view.tsx)
[ ] Adicionar TabsTrigger (anchor-view.tsx)
[ ] Adicionar TabsContent (anchor-view.tsx)
[ ] Reiniciar app: npm run dev
[ ] Testar criação de inspeção
```

### Aba Marketplace
```
[ ] Corrigir usersCount (marketplace-actions.ts:118)
[ ] Corrigir membersCount (marketplace-actions.ts:125)
[ ] Adicionar estado de erro (marketplace-tab.tsx)
[ ] Adicionar UI de erro (marketplace-tab.tsx)
[ ] Testar listagem de empresas
[ ] Verificar contagens corretas
```

---

## 🚨 ORDEM DE EXECUÇÃO RECOMENDADA

### 1. PRIMEIRO: Marketplace (mais fácil, 5 min)
É a correção mais simples e rápida. Apenas trocar `company.usersCount` por `company.users.length`.

### 2. SEGUNDO: Mapa (médio, 10 min)
Correções de validação e contagem. Não requer migração de banco.

### 3. TERCEIRO: Fachada (mais complexo, 15 min)
Requer migração de banco e integração na aplicação.

---

## 🔧 COMANDOS ÚTEIS

```bash
# Reiniciar servidor de desenvolvimento
npm run dev

# Ver logs do servidor
tail -f .next/trace

# Verificar estado do banco
npx prisma studio

# Ver migrações aplicadas
npx prisma migrate status

# Reverter última migração (se necessário)
npx prisma migrate resolve --rolled-back <migration-name>

# Ver logs do browser
# Abra DevTools (F12) → Console
```

---

## 🐛 DEBUGGING

### Se Mapa ainda não mostra planta baixa:
1. Abrir DevTools (F12) → Console
2. Procurar por `[MAP ERROR]` ou `[InteractiveMap]`
3. Verificar se `floorPlanImage` tem conteúdo:
   ```javascript
   // No console do browser:
   console.log(currentFloorPlan?.image?.substring(0, 100))
   ```
4. Verificar se imagem está no formato correto (deve começar com `data:image/`)

### Se Fachada dá erro ao criar inspeção:
1. Verificar se migração foi aplicada:
   ```bash
   npx prisma migrate status
   ```
2. Verificar se tabelas existem:
   ```bash
   npx prisma studio
   # Procurar por: FacadeInspection, FacadeSide, PathologyCategory
   ```
3. Ver logs do servidor no terminal

### Se Marketplace mostra lista vazia:
1. Verificar se existem empresas com role `team_admin`:
   ```bash
   npx prisma studio
   # Abrir tabela User
   # Filtrar por role = "team_admin"
   ```
2. Ver erro no console do browser (F12)
3. Ver erro no terminal do servidor

---

## 📝 NOTAS IMPORTANTES

- **Sempre fazer backup antes de rodar migrações:**
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- **Testar em ambiente de desenvolvimento primeiro**

- **Se algo quebrar, você pode reverter:**
  ```bash
  git checkout src/components/interactive-map.tsx
  git checkout src/app/actions/marketplace-actions.ts
  # etc...
  ```

- **Estas são correções mínimas.** Veja `PLANO_CORRECAO_COMPLETO.md` para todas as correções de segurança e arquitetura.

---

**Tempo total estimado: 30 minutos**
**Dificuldade: Fácil/Médio**
