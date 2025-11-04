# 🏗️ Sistema de Inspeção de Fachadas - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Sistema](#estrutura-do-sistema)
3. [Banco de Dados](#banco-de-dados)
4. [Integração](#integração)
5. [Uso da Interface](#uso-da-interface)
6. [API Reference](#api-reference)
7. [Componentes](#componentes)
8. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

O **Sistema de Inspeção de Fachadas** é um módulo completo para mapeamento visual de patologias em edifícios usando fotos de drone. O sistema permite:

### Funcionalidades Principais:

✅ **Gestão de Inspeções**
- Criar inspeções por projeto
- Acompanhar status (Agendada, Em Progresso, Concluída, Aprovada, Rejeitada)
- Vincular engenheiro responsável
- Histórico completo de inspeções

✅ **Upload de Fotos de Drone**
- 4 lados do prédio (Norte, Sul, Leste, Oeste)
- Fotos adicionais (Telhado, Outros)
- Metadados automáticos (dimensões, data, clima)

✅ **Mapeamento Visual de Patologias**
- Desenhar polígonos coloridos sobre as fotos
- 8 categorias padrão de patologias com cores personalizadas:
  - Fissura (#FF5733 - Laranja)
  - Infiltração (#3498DB - Azul)
  - Desplacamento (#E74C3C - Vermelho)
  - Corrosão (#F39C12 - Amarelo)
  - Eflorescência (#9B59B6 - Roxo)
  - Trinca Estrutural (#C0392B - Vermelho Escuro)
  - Bolor/Mofo (#27AE60 - Verde)
  - Desgaste (#95A5A6 - Cinza)
- Categorias customizáveis por empresa
- Cálculo automático de área afetada
- Severidade (Baixa, Média, Alta, Crítica)

✅ **Geração de Laudos Técnicos**
- Criação de relatórios técnicos pelo engenheiro
- Sistema de aprovação/rejeição
- Versionamento de laudos
- Exportação para PDF (futuro)

---

## 🗂️ Estrutura do Sistema

### Arquivos Criados:

#### 1. **Database Schema**
- [`prisma/schema.prisma`](prisma/schema.prisma)
  - 5 novos modelos
  - 3 novos enums
  - Relações com Project, User, Company

#### 2. **TypeScript Types**
- [`src/types/index.ts`](src/types/index.ts)
  - Interfaces TypeScript para todos os modelos
  - Enums exportados

#### 3. **Server Actions**
- [`src/app/actions/facade-inspection-actions.ts`](src/app/actions/facade-inspection-actions.ts)
  - CRUD completo para todos os modelos
  - Função de seed para categorias padrão
  - ~700 linhas de código

#### 4. **Componentes React**
- [`src/components/facade-marker-canvas.tsx`](src/components/facade-marker-canvas.tsx)
  - Canvas interativo para desenhar polígonos
  - Detecção de hover/click
  - Cálculo de área

- [`src/components/facade-inspection-manager.tsx`](src/components/facade-inspection-manager.tsx)
  - UI completa de gerenciamento
  - Modais para criar inspeções/fotos/categorias
  - Integração com canvas

---

## 🗄️ Banco de Dados

### Modelos Criados:

#### 1. `FacadeInspection`
Registro principal da inspeção.

```prisma
model FacadeInspection {
  id              String            @id @default(cuid())
  projectId       String
  name            String
  description     String?           @db.Text
  status          InspectionStatus  @default(SCHEDULED)
  scheduledDate   DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  inspectorId     String?
  inspectorName   String?
  engineerId      String?
  createdByUserId String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  project         Project
  createdBy       User
  engineer        User?
  facadeSides     FacadeSide[]
  reports         InspectionReport[]
}
```

**Campos importantes:**
- `status`: Rastreia progresso (SCHEDULED → IN_PROGRESS → COMPLETED → APPROVED)
- `engineerId`: Engenheiro responsável pelo laudo
- `inspectorName`: Nome do inspetor de campo

---

#### 2. `FacadeSide`
Fotos individuais dos lados do prédio.

```prisma
model FacadeSide {
  id             String         @id @default(cuid())
  inspectionId   String
  name           String
  sideType       FacadeSideType
  image          String         @db.Text  // base64
  dronePhotoDate DateTime?
  weather        String?
  photographer   String?
  notes          String?        @db.Text
  imageWidth     Int?
  imageHeight    Int?
  order          Int            @default(0)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  inspection         FacadeInspection
  pathologyMarkers   PathologyMarker[]
}
```

**Campos importantes:**
- `sideType`: NORTH | SOUTH | EAST | WEST | ROOF | OTHER
- `image`: Foto em base64
- `imageWidth/Height`: Dimensões originais (para escala)

---

#### 3. `PathologyCategory`
Tipos de patologias customizáveis por empresa.

```prisma
model PathologyCategory {
  id          String            @id @default(cuid())
  companyId   String
  name        String
  color       String            // Hex color
  description String?           @db.Text
  severity    PathologySeverity @default(MEDIUM)
  active      Boolean           @default(true)
  order       Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  company     Company
  markers     PathologyMarker[]
}
```

**Categorias Padrão:**
1. Fissura - Laranja (#FF5733) - Média
2. Infiltração - Azul (#3498DB) - Alta
3. Desplacamento - Vermelho (#E74C3C) - Alta
4. Corrosão - Amarelo (#F39C12) - Crítica
5. Eflorescência - Roxo (#9B59B6) - Baixa
6. Trinca Estrutural - Vermelho Escuro (#C0392B) - Crítica
7. Bolor/Mofo - Verde (#27AE60) - Média
8. Desgaste - Cinza (#95A5A6) - Baixa

---

#### 4. `PathologyMarker`
Polígonos desenhados sobre as fotos.

```prisma
model PathologyMarker {
  id              String             @id @default(cuid())
  facadeSideId    String
  categoryId      String
  geometry        Json               // {points: [{x, y}, ...]}
  area            Float?
  floor           String?
  severity        PathologySeverity  @default(MEDIUM)
  description     String?            @db.Text
  observations    String?            @db.Text
  status          String             @default("PENDING")
  priority        Int                @default(0)
  photos          String[]           // Array de fotos close-up
  createdByUserId String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  facadeSide      FacadeSide
  category        PathologyCategory
  createdBy       User?
}
```

**Campos importantes:**
- `geometry`: JSON com array de pontos `{points: [{x: 100, y: 200}, ...]}`
- `area`: Área em pixels² (pode converter para m² com escala)
- `floor`: Identificação do andar (ex: "1º Andar", "Térreo")
- `photos`: Array de fotos close-up da patologia

---

#### 5. `InspectionReport`
Laudos técnicos gerados pelo engenheiro.

```prisma
model InspectionReport {
  id               String    @id @default(cuid())
  inspectionId     String
  reportNumber     String
  title            String
  content          String    @db.Text
  engineerId       String
  status           String    @default("DRAFT")
  version          Int       @default(1)
  generatedAt      DateTime  @default(now())
  approvedAt       DateTime?
  approvedBy       String?
  rejectedAt       DateTime?
  rejectionReason  String?   @db.Text
  pdfUrl           String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  inspection       FacadeInspection
  engineer         User
  approver         User?
}
```

**Status do Laudo:**
- `DRAFT`: Rascunho
- `PENDING_REVIEW`: Aguardando revisão
- `APPROVED`: Aprovado
- `REJECTED`: Rejeitado (com razão)

**Versionamento:**
- Cada revisão incrementa `version`
- Histórico completo mantido

---

## 🔌 Integração

### PASSO 1: Executar Migration no Banco de Dados

**Importante**: A migration já foi criada anteriormente para Floor Plans. Agora você precisa criar uma nova migration para Facade Inspections.

#### Opção A: Prisma Migrate (Recomendado)

```bash
cd c:\Users\Thiago\Desktop\anchor
npx prisma migrate dev --name add_facade_inspections
```

#### Opção B: SQL Manual

Se a migrate falhar, execute o SQL manualmente no PostgreSQL:

```sql
-- Ver arquivo: migration_facade_inspections.sql (criar se necessário)
```

#### Verificação:

```bash
npx prisma studio
```

Verifique se as tabelas foram criadas:
- `facade_inspections`
- `facade_sides`
- `pathology_categories`
- `pathology_markers`
- `inspection_reports`

---

### PASSO 2: Adicionar o Componente na Interface Principal

Você pode adicionar o `FacadeInspectionManager` de duas formas:

#### Opção A: Como uma nova aba no AnchorView

Adicione no arquivo onde você gerencia as abas (provavelmente `src/components/anchor-view.tsx` ou similar):

```typescript
import { FacadeInspectionManager } from '@/components/facade-inspection-manager';

// Adicione uma nova aba
const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'points', label: 'Pontos' },
  { id: 'tests', label: 'Testes' },
  { id: 'map', label: 'Mapa' },
  { id: 'facade', label: 'Inspeção de Fachada' }, // ✅ NOVO
  { id: 'reports', label: 'Relatórios' }
];

// No conteúdo da aba:
{activeTab === 'facade' && (
  <FacadeInspectionManager
    projectId={currentProject.id}
    companyId={user.companyId}
    currentUserId={user.id}
    canEdit={canEditMap} // Use a lógica de permissões existente
  />
)}
```

#### Opção B: Como uma página separada

Crie `src/app/app/facade-inspection/page.tsx`:

```typescript
'use client';

import { FacadeInspectionManager } from '@/components/facade-inspection-manager';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { AnchorDataContext } from '@/context/AnchorDataContext';

export default function FacadeInspectionPage() {
  const { user } = useContext(AuthContext);
  const { currentProject } = useContext(AnchorDataContext);

  if (!user || !currentProject) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <FacadeInspectionManager
        projectId={currentProject.id}
        companyId={user.companyId}
        currentUserId={user.id}
        canEdit={true}
      />
    </div>
  );
}
```

Adicione link na navegação:
```typescript
<Link href="/app/facade-inspection">Inspeção de Fachada</Link>
```

---

### PASSO 3: Seed das Categorias Padrão

Quando uma empresa acessa pela primeira vez, as categorias padrão são criadas automaticamente. Mas você também pode rodar manualmente:

```typescript
import { seedDefaultPathologyCategories } from '@/app/actions/facade-inspection-actions';

// No primeiro acesso da empresa:
await seedDefaultPathologyCategories(companyId);
```

---

## 📱 Uso da Interface

### Fluxo Completo de Uso:

#### 1. Criar Inspeção
1. Clique em "Nova Inspeção"
2. Preencha nome (ex: "Inspeção Q1 2025")
3. Adicione descrição opcional
4. Clique em "Criar Inspeção"

#### 2. Adicionar Fotos de Drone
1. Clique em "Ver Detalhes" na inspeção
2. Clique em "Adicionar Foto de Fachada"
3. Preencha:
   - Nome (ex: "Fachada Norte")
   - Lado (Norte/Sul/Leste/Oeste/Telhado/Outro)
   - Upload da foto de drone
4. Clique em "Adicionar Fachada"

#### 3. Marcar Patologias
1. Clique em "Marcar Patologias" na fachada
2. Selecione uma categoria (ex: "Fissura")
3. Clique na imagem para adicionar pontos do polígono
4. Feche o polígono:
   - Duplo clique OU
   - Clique no primeiro ponto novamente
5. O marcador é salvo automaticamente

#### 4. Gerenciar Marcadores
- **Hover**: Mostra nome da categoria
- **Click**: Seleciona e mostra detalhes
- **Botão Deletar**: Remove o marcador

#### 5. Criar Categorias Customizadas
1. Clique em "Nova Categoria"
2. Preencha:
   - Nome (ex: "Infiltração Severa")
   - Cor (picker de cor)
   - Severidade (Baixa/Média/Alta/Crítica)
3. Clique em "Criar Categoria"

---

## 🔧 API Reference

### Facade Inspection Actions

#### `getInspectionsForProject(projectId: string)`
Retorna todas as inspeções de um projeto com relações completas.

```typescript
const inspections = await getInspectionsForProject(projectId);
```

#### `createFacadeInspection(...)`
Cria uma nova inspeção.

```typescript
const inspection = await createFacadeInspection(
  projectId,
  'Inspeção Q1 2025',
  currentUserId,
  'Descrição opcional'
);
```

#### `updateFacadeInspection(inspectionId, data)`
Atualiza uma inspeção.

```typescript
await updateFacadeInspection(inspectionId, {
  status: 'IN_PROGRESS',
  startedAt: new Date().toISOString()
});
```

### Facade Side Actions

#### `createFacadeSide(...)`
Adiciona uma foto de fachada.

```typescript
const side = await createFacadeSide(
  inspectionId,
  'Fachada Norte',
  'NORTH',
  base64Image,
  1, // order
  {
    imageWidth: 4000,
    imageHeight: 3000,
    dronePhotoDate: new Date().toISOString(),
    weather: 'Ensolarado',
    photographer: 'João Silva'
  }
);
```

### Pathology Category Actions

#### `getPathologyCategoriesForCompany(companyId)`
Retorna todas as categorias de uma empresa.

```typescript
const categories = await getPathologyCategoriesForCompany(companyId);
```

#### `seedDefaultPathologyCategories(companyId)`
Cria as 8 categorias padrão.

```typescript
const seededCategories = await seedDefaultPathologyCategories(companyId);
```

### Pathology Marker Actions

#### `createPathologyMarker(...)`
Cria um marcador de patologia.

```typescript
const marker = await createPathologyMarker(
  facadeSideId,
  categoryId,
  { points: [{x: 100, y: 200}, {x: 150, y: 200}, {x: 150, y: 250}, {x: 100, y: 250}] },
  currentUserId,
  {
    area: 2500,
    floor: '1º Andar',
    severity: 'HIGH',
    description: 'Fissura de grande extensão',
    status: 'PENDING'
  }
);
```

#### `updatePathologyMarker(markerId, data)`
Atualiza um marcador.

```typescript
await updatePathologyMarker(markerId, {
  status: 'RESOLVED',
  observations: 'Reparo concluído em 20/01/2025'
});
```

### Inspection Report Actions

#### `createInspectionReport(...)`
Cria um laudo técnico.

```typescript
const report = await createInspectionReport(
  inspectionId,
  engineerId,
  'LAUDO-2025-001',
  'Laudo Técnico de Inspeção de Fachada',
  'Conteúdo do laudo em rich text ou markdown...'
);
```

#### `approveInspectionReport(reportId, approvedBy)`
Aprova um laudo.

```typescript
await approveInspectionReport(reportId, userId);
```

#### `rejectInspectionReport(reportId, rejectionReason)`
Rejeita um laudo.

```typescript
await rejectInspectionReport(reportId, 'Necessário adicionar análise estrutural detalhada');
```

---

## 🎨 Componentes

### FacadeMarkerCanvas

Canvas interativo para desenhar polígonos sobre fotos de fachada.

**Props:**

```typescript
interface FacadeMarkerCanvasProps {
  facadeSide: FacadeSide;              // Lado da fachada com imagem
  categories: PathologyCategory[];      // Categorias disponíveis
  markers: PathologyMarker[];           // Marcadores existentes
  onCreateMarker: (marker) => Promise<void>;
  onUpdateMarker: (id, data) => Promise<void>;
  onDeleteMarker: (id) => Promise<void>;
  selectedCategoryId: string | null;    // Categoria selecionada para desenhar
  editable?: boolean;                   // Permite edição (default: true)
}
```

**Funcionalidades:**
- Desenho de polígonos por clique
- Detecção de hover (point-in-polygon)
- Escala automática para caber no container
- Cálculo de área
- Visualização de categoria e detalhes

**Uso:**

```typescript
<FacadeMarkerCanvas
  facadeSide={selectedFacadeSide}
  categories={categories}
  markers={markers}
  onCreateMarker={handleCreateMarker}
  onUpdateMarker={handleUpdateMarker}
  onDeleteMarker={handleDeleteMarker}
  selectedCategoryId={selectedCategoryId}
  editable={true}
/>
```

---

### FacadeInspectionManager

Componente completo de gerenciamento de inspeções.

**Props:**

```typescript
interface FacadeInspectionManagerProps {
  projectId: string;       // ID do projeto atual
  companyId: string;       // ID da empresa
  currentUserId: string;   // ID do usuário logado
  canEdit?: boolean;       // Permissão de edição (default: true)
}
```

**Funcionalidades:**
- Lista de inspeções
- Criar/editar/deletar inspeções
- Upload de fotos de fachada
- Gerenciamento de categorias
- Integração com canvas
- Seed automático de categorias

**Uso:**

```typescript
<FacadeInspectionManager
  projectId={currentProject.id}
  companyId={user.companyId}
  currentUserId={user.id}
  canEdit={canEditMap}
/>
```

---

## 🚀 Próximos Passos

### Funcionalidades Pendentes:

1. **Sistema de Laudos Completo**
   - [ ] Editor de texto rico (Quill/TipTap)
   - [ ] Template de laudo personalizável
   - [ ] Exportação para PDF com logotipo da empresa
   - [ ] Assinatura digital do engenheiro

2. **Melhorias no Canvas**
   - [ ] Editar polígonos existentes (mover pontos)
   - [ ] Undo/Redo
   - [ ] Zoom e pan na imagem
   - [ ] Medida de distância (régua)
   - [ ] Converter área pixel para m² usando escala

3. **Análise Avançada**
   - [ ] Dashboard de estatísticas por inspeção
   - [ ] Gráficos de distribuição de patologias
   - [ ] Comparação entre inspeções (evolução)
   - [ ] Priorização automática por severidade

4. **Fotos Close-up**
   - [ ] Upload de fotos detalhadas de cada marcador
   - [ ] Galeria de fotos por patologia
   - [ ] Anotações em fotos close-up

5. **Notificações**
   - [ ] Notificar engenheiro quando inspeção completa
   - [ ] Alertas para patologias críticas
   - [ ] Lembrete de aprovação de laudos pendentes

6. **Export & Reports**
   - [ ] Exportar dados para Excel
   - [ ] Relatório consolidado com todas as patologias
   - [ ] Cronograma de reparos recomendados

---

## 📄 Estrutura de Arquivos Criados

```
anchor/
├── prisma/
│   └── schema.prisma                 (✅ Atualizado com 5 novos modelos)
├── src/
│   ├── types/
│   │   └── index.ts                  (✅ Atualizado com tipos de inspeção)
│   ├── app/
│   │   └── actions/
│   │       └── facade-inspection-actions.ts  (✅ Novo - ~700 linhas)
│   └── components/
│       ├── facade-marker-canvas.tsx          (✅ Novo - Canvas interativo)
│       └── facade-inspection-manager.tsx     (✅ Novo - UI principal)
└── FACADE_INSPECTION_README.md       (✅ Este arquivo)
```

---

## 🐛 Troubleshooting

### Problema: Migration falha com erro de índice duplicado
**Solução**: Execute SQL manualmente ou delete migrations antigas:
```bash
rm -rf prisma/migrations/*
npx prisma migrate dev --name initial_facade_inspections
```

### Problema: TypeScript reclama de tipos
**Solução**:
```bash
npx prisma generate
# Reinicie TypeScript server no VSCode
# Ctrl+Shift+P → "Restart TS Server"
```

### Problema: Categorias não aparecem
**Solução**: Rode o seed manualmente:
```typescript
import { seedDefaultPathologyCategories } from '@/app/actions/facade-inspection-actions';
await seedDefaultPathologyCategories(companyId);
```

### Problema: Canvas não renderiza
**Solução**:
- Verifique se a imagem está em base64 válido
- Confirme que `imageWidth` e `imageHeight` foram salvos
- Veja console do navegador para erros

---

## 📚 Referências

- **Prisma Docs**: https://www.prisma.io/docs/
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Polygon Area Calculation**: https://en.wikipedia.org/wiki/Shoelace_formula
- **Point-in-Polygon Algorithm**: https://en.wikipedia.org/wiki/Point_in_polygon

---

## ✅ Checklist de Implementação

- [x] Schema Prisma criado
- [x] Types TypeScript criados
- [x] Server Actions criados
- [x] Categorias padrão definidas
- [x] Componente Canvas criado
- [x] Componente Manager criado
- [x] Documentação criada
- [ ] Migration executada no banco
- [ ] Componente integrado na UI principal
- [ ] Testado criar inspeção
- [ ] Testado adicionar fotos
- [ ] Testado desenhar marcadores
- [ ] Testado categorias customizadas

---

**Desenvolvido para AnchorView**
**Data**: Janeiro 2025
**Versão**: 1.0

Para dúvidas ou suporte, revise esta documentação ou os arquivos de código fonte.
