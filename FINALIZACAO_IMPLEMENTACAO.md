# Finalização da Implementação - Múltiplas Plantas + Snap Lines

## ✅ O que já foi feito automaticamente:

1. **Schema Prisma atualizado** - Modelo FloorPlan adicionado
2. **Types TypeScript atualizados** - Interface FloorPlan criada
3. **Actions criadas** - `floorplan-actions.ts` com todas operações CRUD
4. **Componente FloorPlanSelector criado** - UI completa para gerenciar plantas
5. **Sistema de Snap Lines criado** - Hook + componente overlay
6. **Guias de integração criados** - Instruções detalhadas

---

## 🚀 PASSOS FINAIS (você precisa fazer):

### PASSO 1: Rodar Migration do Prisma

```bash
cd c:\Users\Thiago\Desktop\anchor
npx prisma migrate dev --name add_floor_plans
npx prisma generate
```

**Importante**: Isso vai criar a tabela `floor_plans` no banco e atualizar o Prisma Client.

---

### PASSO 2: Integrar Snap Lines no Interactive Map

Siga as instruções no arquivo [`INTEGRACAO_SNAP_LINES.md`](INTEGRACAO_SNAP_LINES.md).

Resumo:
1. Importar `useSnapLines` e `SnapLinesOverlay`
2. Adicionar o hook
3. Usar `getSnappedPosition` ao criar pontos
4. Adicionar `<SnapLinesOverlay>` no SVG
5. Adicionar `calculateSnapLines` no `handleMouseMove`
6. Adicionar `clearSnapLines` no `handleMouseLeave`

---

### PASSO 3: Integrar FloorPlanSelector na UI

Você precisa adicionar o `FloorPlanSelector` na interface principal. Sugestões de onde colocar:

#### Opção A: Na aba "Mapa" (MapTab)

Adicione no topo do componente que renderiza o mapa:

```typescript
import { FloorPlanSelector } from '@/components/floor-plan-selector';
import { getFloorPlansForProject, createFloorPlan, updateFloorPlan, deleteFloorPlan, toggleFloorPlanActive } from '@/app/actions/floorplan-actions';

// Adicione states:
const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
const [activeFloorPlanId, setActiveFloorPlanId] = useState<string | null>(null);

// Carregue floor plans quando projeto mudar:
useEffect(() => {
  if (currentProject) {
    getFloorPlansForProject(currentProject.id).then(setFloorPlans);
  }
}, [currentProject]);

// Handlers:
const handleAddFloorPlan = async (name: string, image: string, order: number) => {
  if (!currentProject) return;
  const newFloorPlan = await createFloorPlan(currentProject.id, name, image, order);
  if (newFloorPlan) {
    setFloorPlans(prev => [...prev, newFloorPlan as any]);
  }
};

const handleEditFloorPlan = async (id: string, name: string, order: number) => {
  const updated = await updateFloorPlan(id, name, order);
  if (updated) {
    setFloorPlans(prev => prev.map(fp => fp.id === id ? updated as any : fp));
  }
};

const handleDeleteFloorPlan = async (id: string) => {
  const success = await deleteFloorPlan(id);
  if (success) {
    setFloorPlans(prev => prev.filter(fp => fp.id !== id));
    if (activeFloorPlanId === id) setActiveFloorPlanId(null);
  }
};

const handleToggleActive = async (id: string, active: boolean) => {
  const updated = await toggleFloorPlanActive(id, active);
  if (updated) {
    setFloorPlans(prev => prev.map(fp => fp.id === id ? updated as any : fp));
  }
};

// No JSX, adicione ANTES do InteractiveMap:
<div className="mb-4">
  <FloorPlanSelector
    floorPlans={floorPlans}
    activeFloorPlanId={activeFloorPlanId}
    onSelectFloorPlan={setActiveFloorPlanId}
    onAddFloorPlan={handleAddFloorPlan}
    onEditFloorPlan={handleEditFloorPlan}
    onDeleteFloorPlan={handleDeleteFloorPlan}
    onToggleFloorPlanActive={handleToggleActive}
    canEdit={canEditMap} // Use a lógica de permissões existente
  />
</div>
```

#### Opção B: Criar contexto global para Floor Plans

Se quiser que multiple componentes acessem as floor plans, adicione ao `AnchorDataContext`.

---

### PASSO 4: Filtrar pontos por planta ativa no InteractiveMap

No componente que renderiza o `InteractiveMap`, filtre os pontos:

```typescript
const filteredPointsByFloor = activeFloorPlanId
  ? allPointsForProject.filter(p => p.floorPlanId === activeFloorPlanId)
  : allPointsForProject;

<InteractiveMap
  points={filteredPointsByFloor}
  // ... outras props
/>
```

---

### PASSO 5: Ajustar numeração de pontos por planta

Quando criar um novo ponto, determine o número baseado na planta:

```typescript
const getNextPointNumber = (floorPlanId: string | null) => {
  const pointsInFloor = allPointsForProject.filter(p => p.floorPlanId === floorPlanId);
  const numbers = pointsInFloor
    .map(p => parseInt(p.numeroPonto.replace(/\D/g, '')))
    .filter(n => !isNaN(n));
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `P${maxNumber + 1}`;
};

// Ao criar ponto:
const newPoint = {
  ...pointData,
  floorPlanId: activeFloorPlanId,
  numeroPonto: getNextPointNumber(activeFloorPlanId),
  // ... outros campos
};
```

---

## 📊 Resultado Final

Quando tudo estiver integrado, você terá:

### Múltiplas Plantas:
- ✅ Dropdown para selecionar planta
- ✅ Botão "Nova Planta" para adicionar
- ✅ Cada planta com numeração independente (Térreo P1-P10, 1º Andar P1-P8, etc.)
- ✅ Filtro "Todas as plantas" para visão geral
- ✅ Gerenciamento completo (editar, deletar, ocultar)

### Snap Lines:
- ✅ Linhas guia aparecem ao mover o mouse
- ✅ Snap vertical e horizontal
- ✅ Visual: linhas azuis tracejadas
- ✅ Threshold: 10 pixels
- ✅ Funciona ao criar e mover pontos

---

## 🐛 Troubleshooting

### Erro ao rodar migration:
```bash
# Se der erro, tente resetar:
npx prisma migrate reset
npx prisma migrate dev --name add_floor_plans
```

### Prisma Client não atualizado:
```bash
npx prisma generate
```

### TypeScript reclamando de tipos:
```bash
npm run typecheck
# Verifique se importou FloorPlan de @/types
```

---

## 📝 Checklist Final

- [ ] Migration rodada (`npx prisma migrate dev`)
- [ ] Prisma client gerado (`npx prisma generate`)
- [ ] Snap lines integradas no interactive-map
- [ ] FloorPlanSelector adicionado na UI
- [ ] Filtro de pontos por planta implementado
- [ ] Numeração automática por planta funcionando
- [ ] Testado criar planta
- [ ] Testado adicionar pontos em diferentes plantas
- [ ] Testado snap lines ao criar pontos
- [ ] Testado trocar entre plantas

---

## 🎉 Pronto!

Após completar todos os passos, você terá um sistema completo de:
- **Múltiplas plantas baixas por projeto**
- **Sistema de snap lines tipo Canva/Figma**
- **Numeração independente por planta**
- **Gestão completa via UI**

Se tiver dúvidas ou problemas, revise os arquivos criados:
- `GUIA_RAPIDO.md` - Visão geral
- `INTEGRACAO_SNAP_LINES.md` - Detalhes do snap
- Este arquivo - Integração final
