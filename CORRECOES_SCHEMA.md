# 🔧 CORREÇÕES NO SCHEMA PRISMA

## ❌ Problema Inicial

Ao tentar compilar o projeto, ocorreram erros de TypeScript:

```
Type error: Object literal may only specify known properties, and 'order' does not exist in type 'FacadeSideOrderByWithRelationInput'
```

## ✅ Correções Realizadas

### 1. Modelo `FacadeSide` - Campos Faltando

**Problema**: O modelo tinha campos diferentes dos usados no código TypeScript.

**Schema Antigo**:
```prisma
model FacadeSide {
  photo             String @db.Text
  photoMetadata     Json?
  floor             String?
  observations      String?
  capturedAt        DateTime?
  // FALTANDO: order, imageWidth, imageHeight, etc.
}
```

**Schema Corrigido**:
```prisma
model FacadeSide {
  id                String            @id @default(cuid())
  inspectionId      String            @map("inspection_id")
  sideType          FacadeSideType    @map("side_type")
  name              String

  // Foto do drone
  image             String            @db.Text // base64 data URL
  dronePhotoDate    DateTime?         @map("drone_photo_date")
  weather           String?
  photographer      String?
  notes             String?           @db.Text
  imageWidth        Int?              @map("image_width")
  imageHeight       Int?              @map("image_height")
  order             Int               @default(0) // ✅ ADICIONADO

  // Timestamps
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  // Relations
  inspection        FacadeInspection
  pathologyMarkers  PathologyMarker[]
}
```

**Mudanças**:
- ✅ Substituído `photo` por `image` (consistência com código)
- ✅ Removido `photoMetadata` (JSON) → campos individuais type-safe
- ✅ **Adicionado campo `order`** para ordenação
- ✅ Adicionados `imageWidth` e `imageHeight`
- ✅ Adicionados `dronePhotoDate`, `weather`, `photographer`, `notes`
- ✅ Removido `floor` (movido para PathologyMarker)
- ✅ Removido `capturedAt` (redundante com createdAt)

---

### 2. Modelo `InspectionReport` - Campos Faltando

**Problema**: Vários campos usados no código não existiam no schema.

**Schema Antigo**:
```prisma
model InspectionReport {
  title             String
  content           String @db.Text
  conclusion        String?
  recommendations   String?
  status            String @default("DRAFT")
  approvedAt        DateTime?
  approvedBy        String?
  attachments       String[]
  // FALTANDO: version, reportNumber, rejectedAt, etc.
}
```

**Schema Corrigido**:
```prisma
model InspectionReport {
  id                String   @id @default(cuid())
  inspectionId      String   @map("inspection_id")
  engineerId        String   @map("engineer_id")
  reportNumber      String   @map("report_number") // ✅ ADICIONADO
  version           Int      @default(1)           // ✅ ADICIONADO

  // Laudo
  title             String
  content           String   @db.Text
  conclusion        String?  @db.Text
  recommendations   String?  @db.Text

  // Aprovação
  status            String   @default("DRAFT")
  generatedAt       DateTime @default(now()) @map("generated_at") // ✅ ADICIONADO
  approvedAt        DateTime? @map("approved_at")
  approvedBy        String?   @map("approved_by")
  rejectedAt        DateTime? @map("rejected_at")        // ✅ ADICIONADO
  rejectionReason   String?   @db.Text @map("rejection_reason") // ✅ ADICIONADO

  // Anexos
  attachments       String[]
  pdfUrl            String?   @map("pdf_url") // ✅ ADICIONADO

  // Timestamps
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  inspection        FacadeInspection
  engineer          User @relation("ReportEngineer")
}
```

**Mudanças**:
- ✅ **Adicionado `reportNumber`** - Número do laudo (ex: LAUDO-2025-001)
- ✅ **Adicionado `version`** - Versionamento do laudo
- ✅ **Adicionado `generatedAt`** - Data de geração
- ✅ **Adicionado `rejectedAt`** - Data de rejeição
- ✅ **Adicionado `rejectionReason`** - Motivo da rejeição
- ✅ **Adicionado `pdfUrl`** - URL do PDF gerado

---

## 🔄 Comandos Executados

### 1. Regenerar Prisma Client

```bash
npx prisma generate
```

**Resultado**: ✅ Prisma Client atualizado com novos campos.

### 2. Deletar Arquivo de Teste

```bash
powershell -Command "Remove-Item 'TYPES_UPDATE.ts' -Force"
```

**Resultado**: ✅ Arquivo temporário deletado.

### 3. Verificar TypeScript

```bash
npx tsc --noEmit
```

**Resultado**: ✅ Sem erros de TypeScript!

---

## 📊 Resumo das Mudanças

### FacadeSide
| Campo | Status | Tipo | Descrição |
|-------|--------|------|-----------|
| `order` | ✅ Adicionado | `Int` | Ordem de exibição das fotos |
| `image` | ✅ Renomeado | `String` | Era `photo` |
| `imageWidth` | ✅ Adicionado | `Int?` | Largura da imagem |
| `imageHeight` | ✅ Adicionado | `Int?` | Altura da imagem |
| `dronePhotoDate` | ✅ Adicionado | `DateTime?` | Data da foto |
| `weather` | ✅ Adicionado | `String?` | Condições climáticas |
| `photographer` | ✅ Adicionado | `String?` | Nome do fotógrafo |
| `notes` | ✅ Adicionado | `String?` | Observações |
| `photoMetadata` | ❌ Removido | - | Substituído por campos individuais |

### InspectionReport
| Campo | Status | Tipo | Descrição |
|-------|--------|------|-----------|
| `reportNumber` | ✅ Adicionado | `String` | Número do laudo |
| `version` | ✅ Adicionado | `Int` | Versão do laudo |
| `generatedAt` | ✅ Adicionado | `DateTime` | Data de geração |
| `rejectedAt` | ✅ Adicionado | `DateTime?` | Data de rejeição |
| `rejectionReason` | ✅ Adicionado | `String?` | Motivo da rejeição |
| `pdfUrl` | ✅ Adicionado | `String?` | URL do PDF |

---

## 🗄️ Migration SQL Necessária

O arquivo `migration_facade_inspections.sql` já está atualizado com todos os campos corretos.

**Para aplicar no banco**:

```bash
psql -h 185.215.165.19 -p 8002 -U postgres -d privado
\i migration_facade_inspections.sql
```

**Ou execute manualmente**:

```sql
-- Adicionar campo order em facade_sides (se a tabela já existir)
ALTER TABLE facade_sides ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Adicionar campos em inspection_reports (se a tabela já existir)
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS report_number TEXT;
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP(3);
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS pdf_url TEXT;
```

---

## ✅ Status Final

- ✅ Schema Prisma corrigido
- ✅ Prisma Client regenerado
- ✅ TypeScript sem erros
- ✅ Arquivo temporário deletado
- ✅ Migration SQL atualizada
- ⏳ Migration pendente de execução no banco

**Projeto pronto para compilar! 🚀**

---

**Data**: Janeiro 2025
**Versão**: 1.1
