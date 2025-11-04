# GUIA RAPIDO - Multiplas Plantas + Snap Lines

## 1. SCHEMA PRISMA (prisma/schema.prisma)

Adicione DEPOIS do model AnchorTest:

```prisma
model FloorPlan {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  image       String   @db.Text
  order       Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  project      Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  anchorPoints AnchorPoint[]
  @@map("floor_plans")
  @@index([projectId])
}
```

No AnchorPoint, adicione apos projectId:
```
  floorPlanId  String?   @map("floor_plan_id")
```

E na secao Relations:
```
  floorPlan    FloorPlan?   @relation(fields: [floorPlanId], references: [id])
```

No Project Relations, adicione:
```
  floorPlans   FloorPlan[]
```

Rode: npx prisma migrate dev --name add_floor_plans

## 2. TYPES (src/types/index.ts)

Adicione ANTES de Project:

```typescript
export interface FloorPlan {
  id: string;
  projectId: string;
  name: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  anchorPoints?: AnchorPoint[];
}
```

Em Project, adicione:
```typescript
  floorPlans?: FloorPlan[];
```

Em AnchorPoint, adicione apos projectId:
```typescript
  floorPlanId?: string;
```

## 3. SNAP LINES - Implementacao

Adicione no interactive-map.tsx, na funcao que renderiza o mapa:

1. State para snap lines:
```typescript
const [snapLines, setSnapLines] = useState<{vertical: number[], horizontal: number[]}>({vertical: [], horizontal: []});
const [isDragging, setIsDragging] = useState(false);
const SNAP_THRESHOLD = 10; // pixels
```

2. Funcao para calcular snap:
```typescript
const calculateSnapLines = (mouseX: number, mouseY: number) => {
  const verticalLines: number[] = [];
  const horizontalLines: number[] = [];
  
  allPointsForProject.forEach(point => {
    if (Math.abs(point.posicaoX - mouseX) < SNAP_THRESHOLD) {
      verticalLines.push(point.posicaoX);
    }
    if (Math.abs(point.posicaoY - mouseY) < SNAP_THRESHOLD) {
      horizontalLines.push(point.posicaoY);
    }
  });
  
  setSnapLines({ vertical: [...new Set(verticalLines)], horizontal: [...new Set(horizontalLines)] });
};
```

3. Aplicar snap ao mover mouse:
```typescript
const handleMouseMoveWithSnap = (e) => {
  const mousePos = getSVGCoordinates(e);
  calculateSnapLines(mousePos.x, mousePos.y);
  
  // Snap to nearest line
  const snappedX = snapLines.vertical[0] || mousePos.x;
  const snappedY = snapLines.horizontal[0] || mousePos.y;
  
  // Use snappedX e snappedY para posicionar
};
```

4. Renderizar linhas guia no SVG:
```tsx
{snapLines.vertical.map((x, i) => (
  <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={localMapDimensions.height} 
    stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
))}
{snapLines.horizontal.map((y, i) => (
  <line key={`h-${i}`} x1={0} y1={y} x2={localMapDimensions.width} y2={y}
    stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
))}
```

## 4. ACTIONS para FloorPlans

Crie src/app/actions/floorplan-actions.ts:

```typescript
'use server';
import { prisma } from '@/lib/prisma';

export async function getFloorPlansForProject(projectId: string) {
  return await prisma.floorPlan.findMany({ 
    where: { projectId },
    orderBy: { order: 'asc' }
  });
}

export async function createFloorPlan(projectId: string, name: string, image: string, order: number) {
  return await prisma.floorPlan.create({
    data: { projectId, name, image, order }
  });
}

export async function updateFloorPlan(id: string, name: string, order: number) {
  return await prisma.floorPlan.update({
    where: { id },
    data: { name, order }
  });
}

export async function deleteFloorPlan(id: string) {
  return await prisma.floorPlan.delete({ where: { id } });
}
```

## Pronto!

Apos fazer essas mudancas:
1. Rode npx prisma migrate dev
2. Reinicie o servidor (npm run dev)
3. As plantas baixas estarao funcionando!

