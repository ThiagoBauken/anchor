# Alterações necessárias no schema.prisma

## 1. Adicionar modelo FloorPlan (depois do AnchorTest, antes do Photo):

```prisma
// ===== PLANTAS BAIXAS (FLOOR PLANS) =====

model FloorPlan {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String   // "Térreo", "1º Andar", "Fachada Norte", etc
  image       String   @db.Text // base64 data URL
  order       Int      @default(0) // Ordem de exibição
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  project      Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  anchorPoints AnchorPoint[]

  @@map("floor_plans")
  @@index([projectId])
}
```

## 2. Adicionar floorPlanId no modelo AnchorPoint:

Adicione após a linha `projectId`:
```prisma
  floorPlanId               String?   @map("floor_plan_id") // ✅ PLANTA BAIXA DO PONTO
```

E nas relations, adicione:
```prisma
  floorPlan          FloorPlan?   @relation(fields: [floorPlanId], references: [id])
```

## 3. Adicionar floorPlans no modelo Project:

Nas relations do Project, adicione:
```prisma
  floorPlans   FloorPlan[]   // ✅ MÚLTIPLAS PLANTAS BAIXAS
```

## Depois de fazer essas alterações, rode:
```bash
npx prisma migrate dev --name add_floor_plans
npx prisma generate
```
