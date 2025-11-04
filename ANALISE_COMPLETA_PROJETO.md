# Análise Completa do Projeto AnchorView

**Data da Análise:** 2025-01-20
**Versão do Projeto:** 0.1.0
**Status:** Em Desenvolvimento

---

## 📊 Resumo Executivo

### ✅ O Que Está Funcionando:
- **PWA Completo**: Service worker, manifest, offline capabilities
- **Capacitor Integrado**: Camera, filesystem, galeria (código completo)
- **UI Completa**: Todos os componentes principais implementados
- **Database Schema**: Prisma schema robusto com 20+ models
- **Multi-tenancy**: B2B2C com companies, teams, permissions
- **Autenticação**: Sistema completo com sessions, password reset
- **3 Fases Implementadas**: Public view, Teams, Capacitor

### ⚠️ Gaps Críticos Identificados:

1. **❌ FOTOS NÃO ESTÃO NO BANCO DE DADOS**
2. **⚠️ Pontos e Testes ainda em localStorage (não migrados para Prisma)**
3. **⚠️ Endpoints de sync com placeholders (não salvam no banco)**
4. **⚠️ Plataformas mobile não adicionadas (iOS/Android)**
5. **⚠️ Alguns TODOs críticos não resolvidos**

---

## 🔴 PROBLEMA CRÍTICO #1: Photos não existe no Banco

### Situação Atual:
```typescript
// ❌ NO SCHEMA PRISMA: Nenhum model Photo/Image
// ✅ NO CÓDIGO: PhotoMetadata interface existe
// ✅ NO CÓDIGO: gallery-photo-service.ts completo
// ❌ NO BANCO: Nenhuma tabela para armazenar metadados de fotos
```

### Impacto:
- Fotos são salvas na galeria do celular ✅
- Metadados salvos no IndexedDB ✅
- **Mas quando sincronizar, NÃO HÁ TABELA no banco!** ❌

### Solução Necessária:
Adicionar model Photo ao schema.prisma:

```prisma
model Photo {
  id                String    @id @default(cuid())
  fileName          String    @map("file_name")
  filePath          String?   @map("file_path")
  publicUrl         String?   @map("public_url")

  // Relacionamentos
  projectId         String    @map("project_id")
  pontoId           String    @map("ponto_id")

  // Metadados
  pontoNumero       String    @map("ponto_numero")
  pontoLocalizacao  String    @map("ponto_localizacao")
  type              String    // 'ponto', 'teste', 'teste-final'

  // Timestamps
  capturedAt        DateTime  @map("captured_at")
  uploadedAt        DateTime? @map("uploaded_at")
  createdAt         DateTime  @default(now()) @map("created_at")

  // Sync
  uploaded          Boolean   @default(false)
  fileSize          Int?      @map("file_size")

  // Relations
  project           Project   @relation(fields: [projectId], references: [id])
  anchorPoint       AnchorPoint @relation(fields: [pontoId], references: [id])

  @@map("photos")
}
```

### Onde Modificar:
1. `prisma/schema.prisma` - Adicionar model Photo
2. Adicionar relação em `AnchorPoint`: `photos Photo[]`
3. Adicionar relação em `Project`: `photos Photo[]`
4. Rodar: `npx prisma migrate dev --name add_photos_table`
5. Atualizar `/api/sync/photos/route.ts` para salvar no banco

---

## 🟡 PROBLEMA #2: AnchorPoints e AnchorTests Híbridos

### Situação Atual:
```typescript
// ✅ SCHEMA PRISMA: Tem models AnchorPoint e AnchorTest
// ✅ CÓDIGO: Usa localStorage para pontos e testes
// ⚠️ SYNC: Endpoints com placeholders (não salvam no banco)
```

### Onde Está o Código:

**LocalStorage (Uso Atual):**
- `src/context/AnchorDataContext.tsx` - CRUD em localStorage
- `src/components/point-form.tsx` - Cria pontos no localStorage
- `src/components/tests-tab.tsx` - Cria testes no localStorage

**Database (Preparado mas não usado):**
- `prisma/schema.prisma` - Models AnchorPoint e AnchorTest existem
- `src/app/actions/anchor-actions.ts` - Server actions com TODOs

**Sync (Placeholders):**
- `src/app/api/sync/anchor-data/route.ts` - TODOs para Prisma

### Por Que Está Assim:
Decisão arquitetural: localStorage para offline-first, sync para backup.

### O Que Falta:
1. Implementar sync real nos endpoints
2. Conectar server actions ao contexto
3. Decidir: localStorage primeiro + sync OU banco primeiro + cache

---

## 🟡 PROBLEMA #3: Endpoints de Sync com Placeholders

### `/api/sync/photos/route.ts`

**O que faz hoje:**
```typescript
// ✅ Recebe foto em base64
// ✅ Salva em /public/uploads/photos/[projectId]/[pontoId]/[fileName]
// ✅ Retorna URL pública
// ❌ TODO: Salvar referência no banco de dados (linha 76)
```

**O que falta:**
```typescript
// Descomentar e implementar:
await prisma.photo.create({
  data: {
    fileName,
    filePath: publicUrl,
    projectId,
    pontoId,
    pontoNumero,
    pontoLocalizacao,
    type,
    capturedAt: new Date(capturedAt),
    fileSize: buffer.length
  }
});
```

### `/api/sync/anchor-data/route.ts`

**O que faz hoje:**
```typescript
// ✅ Recebe anchorPoints e anchorTests
// ✅ Loop para processar cada um
// ❌ TODOs: Verificar existência, criar ou atualizar (linhas 31-66)
```

**O que falta:**
```typescript
// Implementar para cada ponto:
const existing = await prisma.anchorPoint.findUnique({
  where: { id: point.id }
});

if (!existing) {
  await prisma.anchorPoint.create({ data: point });
}
```

---

## 🟡 PROBLEMA #4: Plataformas Mobile Não Adicionadas

### Situação:
```bash
# ✅ Capacitor configurado (capacitor.config.ts)
# ✅ Plugins instalados (@capacitor/camera, filesystem, etc.)
# ✅ Código completo para usar Capacitor
# ❌ Plataformas iOS/Android NÃO adicionadas

# Falta executar:
npx cap add ios      # ❌ Não executado
npx cap add android  # ❌ Não executado
```

### Por Que Importa:
- Código só funciona em dispositivo real iOS/Android
- Precisa Xcode (iOS) e Android Studio configurados
- Sem as plataformas, Capacitor retorna "not available"

### Fallback Existe:
```typescript
// ✅ Código tem fallback para web
if (isCapacitorAvailable()) {
  // Usa camera nativa
} else {
  // Usa CameraCapture web
}
```

### Como Resolver:
Ver [setup-mobile.md](setup-mobile.md) para instruções completas.

---

## 📋 Lista Completa de TODOs no Código

### Críticos (Impedem funcionalidade):

1. **`src/app/api/sync/photos/route.ts:76`**
   ```typescript
   // TODO: Salvar referência no banco de dados
   ```
   **Impacto:** Fotos sincronizam mas não aparecem em queries do banco.

2. **`src/app/api/sync/anchor-data/route.ts:31-33`**
   ```typescript
   // TODO: Verificar se o ponto já existe no banco
   // TODO: Se não existe, criar
   // TODO: Se existe, atualizar se necessário
   ```
   **Impacto:** Pontos criados offline nunca chegam ao banco.

3. **`src/app/api/sync/anchor-data/route.ts:64-66`**
   ```typescript
   // TODO: Verificar se o teste já existe no banco
   // TODO: Se não existe, criar
   // TODO: Se existe, atualizar se necessário
   ```
   **Impacto:** Testes criados offline nunca chegam ao banco.

4. **`src/app/api/sync/anchor-data/route.ts:129`**
   ```typescript
   // TODO: Buscar pontos e testes atualizados desde lastSync
   ```
   **Impacto:** Pull de dados do servidor não funciona.

5. **`src/app/api/sync/photos/route.ts:125`**
   ```typescript
   // TODO: Buscar fotos do banco de dados
   ```
   **Impacto:** GET /api/sync/photos retorna array vazio.

### Média Prioridade (Features secundárias):

6. **`src/lib/hybrid-storage.ts:278`**
   ```typescript
   // TODO: Implementar sincronização com PostgreSQL
   ```

7. **`src/lib/hybrid-storage.ts:283`**
   ```typescript
   // TODO: Implementar sincronização do PostgreSQL
   ```

8. **`src/lib/hybrid-storage.ts:288`**
   ```typescript
   // TODO: Contar itens com syncStatus = 'pending'
   ```

9. **`src/app/actions/notification-actions.ts:393`**
   ```typescript
   // TODO: Fetch today's activity data from database
   ```

10. **`src/app/actions/notification-actions.ts:438`**
    ```typescript
    // TODO: Fetch week's activity data from database
    ```

---

## 🏗️ Arquitetura Atual vs Ideal

### Storage Atual:

| Dados | Onde Está | Estado |
|-------|-----------|---------|
| Companies | PostgreSQL (Prisma) | ✅ Funcionando |
| Users | PostgreSQL (Prisma) | ✅ Funcionando |
| Projects | PostgreSQL (Prisma) | ✅ Funcionando |
| Locations | PostgreSQL (Prisma) | ✅ Funcionando |
| Teams | PostgreSQL (Prisma) | ✅ Funcionando |
| PublicSettings | PostgreSQL (Prisma) | ✅ Funcionando |
| **AnchorPoints** | **localStorage** | ⚠️ Não sincroniza |
| **AnchorTests** | **localStorage** | ⚠️ Não sincroniza |
| **Photos (metadata)** | **IndexedDB** | ⚠️ Não sincroniza |
| **Photos (files)** | **Device Gallery** | ✅ Funcionando |
| **Photos (servidor)** | **filesystem** | ⚠️ Sem tabela |

### O Que Falta Conectar:

```
localStorage (AnchorPoints) → API Sync → Prisma (anchor_points)
localStorage (AnchorTests) → API Sync → Prisma (anchor_tests)
IndexedDB (PhotoMetadata) → API Sync → Prisma (photos) ❌ Tabela não existe
Filesystem (/public/uploads) → já funciona ✅
```

---

## 🔍 Dependências: Instaladas vs Usadas

### ✅ Capacitor - Instalado e Configurado:
```json
"@capacitor/app": "^7.1.0",       // ✅ Usado
"@capacitor/camera": "^7.0.2",    // ✅ Usado
"@capacitor/cli": "^7.4.3",       // ✅ Usado
"@capacitor/core": "^7.4.3",      // ✅ Usado
"@capacitor/device": "^7.0.2",    // ✅ Usado
"@capacitor/filesystem": "^7.1.4" // ✅ Usado
```

### ✅ Prisma - Instalado e Configurado:
```json
"@prisma/client": "^5.18.0",  // ✅ Usado
"prisma": "^5.18.0"           // ✅ Usado
```

### ✅ Next.js 15 - Funcionando:
```json
"next": "15.3.3",      // ✅ Usado
"react": "^18.3.1",    // ✅ Usado
"react-dom": "^18.3.1" // ✅ Usado
```

### ✅ Outras Dependências Críticas:
```json
"qrcode": "^1.5.4",           // ✅ Usado (QR codes públicos)
"xlsx": "^0.18.5",            // ✅ Usado (export Excel)
"jspdf": "^3.0.1",            // ✅ Usado (export PDF)
"bcryptjs": "^2.4.3",         // ✅ Usado (auth)
"jsonwebtoken": "^9.0.2",     // ✅ Usado (auth)
"zod": "^3.24.2",             // ✅ Usado (validation)
"react-hook-form": "^7.54.2"  // ✅ Usado (forms)
```

### ⚠️ Genkit AI - Instalado mas Pouco Usado:
```json
"@genkit-ai/googleai": "^1.14.1",
"@genkit-ai/next": "^1.14.1",
"genkit": "^1.14.1"
```

**Onde é usado:**
- `src/ai/flows/` - Alguns flows AI implementados
- Não integrado na UI principal ainda

---

## 🐛 Possíveis Bugs/Problemas

### 1. Conflito de Tipos: Photo
```typescript
// gallery-photo-service.ts define:
export interface PhotoMetadata { ... }

// Mas prisma schema NÃO tem model Photo
// Quando sincronizar, vai dar erro!
```

### 2. AnchorPoints em Dois Lugares
```typescript
// localStorage: usado no código
// Prisma: existe mas não é usado
// Risco: duplicação ou inconsistência futura
```

### 3. Filename com Progressão vs Banco
```typescript
// Filename: AnchorView_Projeto_PROGRESSAO_Ponto_ID...
// Mas AnchorPoint.foto no banco é String (caminho)
// Photo.pontoLocalizacao seria string
// Não há validação de consistência
```

### 4. Upload de Fotos Sem Transação
```typescript
// Salva arquivo em filesystem ✅
// Mas se falhar em salvar no banco, fica órfão ❌
// Deveria usar transação ou cleanup em erro
```

### 5. IndexedDB + localStorage + Prisma
```typescript
// 3 fontes de verdade diferentes
// Sem estratégia clara de merge/conflict resolution
// O que acontece se mesmo ponto existir nos 3?
```

---

## ✅ O Que Está Completo e Funcionando

### UI Completa:
- ✅ Dashboard com estatísticas
- ✅ Projects CRUD
- ✅ Points CRUD (localStorage)
- ✅ Tests CRUD (localStorage)
- ✅ Map interativo
- ✅ Reports (Excel, PDF, JSON)
- ✅ Users management
- ✅ Teams management
- ✅ Public visualization
- ✅ QR code generation
- ✅ Photo capture (web + capacitor)
- ✅ Photo sync UI

### Backend Completo:
- ✅ Prisma schema robusto (20+ models)
- ✅ Authentication (JWT + sessions)
- ✅ Multi-tenancy (companies)
- ✅ Server actions (parciais)
- ✅ API endpoints (com TODOs)

### Offline/PWA:
- ✅ Service worker
- ✅ Manifest
- ✅ IndexedDB storage
- ✅ Background sync
- ✅ Push notifications

### Capacitor:
- ✅ Config completo
- ✅ Camera service
- ✅ Gallery integration
- ✅ Metadata storage
- ✅ Sync manager UI
- ⚠️ Plataformas não adicionadas

---

## 🚀 Roadmap Para Completar

### Fase 1: CRÍTICO - Photos no Banco (1-2h)
1. Adicionar model Photo ao schema.prisma
2. Criar migration: `npx prisma migrate dev --name add_photos_table`
3. Atualizar `/api/sync/photos/route.ts` para salvar no banco
4. Atualizar PhotoSyncManager para query do banco
5. Testar upload e query

### Fase 2: CRÍTICO - Sync de Pontos e Testes (2-3h)
1. Implementar TODOs em `/api/sync/anchor-data/route.ts`
2. Adicionar upsert logic (create ou update)
3. Implementar GET para pull de dados
4. Testar sync bidirecional
5. Adicionar conflict resolution

### Fase 3: Mobile Platforms (30min - 1h)
1. Executar: `npm run build`
2. Executar: `npx cap add ios` (macOS apenas)
3. Executar: `npx cap add android`
4. Executar: `npx cap sync`
5. Testar em dispositivo real

### Fase 4: TODOs Secundários (2-3h)
1. Implementar hybrid-storage sync
2. Implementar notification data fetching
3. Limpar TODOs restantes
4. Code cleanup e refactoring

### Fase 5: Testes e QA (variável)
1. Testar fluxo completo offline → online
2. Testar sync com conflitos
3. Testar fotos em dispositivo real
4. Testar multi-usuário
5. Load testing

---

## 📝 Recomendações

### Curto Prazo (Esta Semana):
1. **URGENTE:** Adicionar model Photo ao banco
2. **URGENTE:** Implementar sync de pontos/testes
3. **IMPORTANTE:** Adicionar plataformas mobile
4. **IMPORTANTE:** Testar em dispositivo real

### Médio Prazo (Próximas 2 Semanas):
1. Decidir estratégia definitiva: localStorage vs Prisma
2. Implementar conflict resolution robusto
3. Adicionar retry logic para sync falho
4. Implementar queue de sincronização
5. Adicionar error tracking (Sentry?)

### Longo Prazo (Próximo Mês):
1. Migrar AnchorPoints para Prisma?
2. Migrar AnchorTests para Prisma?
3. Implementar cache strategy clara
4. Adicionar analytics de uso
5. Performance optimization
6. Security audit

---

## 🎯 Estimativa de Esforço

| Tarefa | Tempo | Prioridade | Blocker? |
|--------|-------|------------|----------|
| Adicionar model Photo | 30min | CRÍTICA | ✅ SIM |
| Implementar sync photos | 1h | CRÍTICA | ✅ SIM |
| Implementar sync points/tests | 2h | CRÍTICA | ✅ SIM |
| Adicionar platforms iOS/Android | 30min | ALTA | Não |
| Resolver TODOs secundários | 2h | MÉDIA | Não |
| Testes em dispositivo | 2h | ALTA | Não |
| Refactoring e cleanup | 3h | BAIXA | Não |

**Total Estimado para MVP Completo:** ~11 horas

---

## 🏁 Conclusão

### O Projeto Está:
- ✅ **90% completo** em termos de UI
- ✅ **80% completo** em termos de features
- ⚠️ **60% completo** em termos de integração backend
- ⚠️ **40% completo** em termos de sync funcionando

### Gaps Principais:
1. ❌ **Photos não tem tabela no banco** (BLOCKER)
2. ⚠️ **Sync não salva no banco** (BLOCKER)
3. ⚠️ **Plataformas mobile não adicionadas** (importante)
4. ⚠️ **TODOs críticos não resolvidos** (importante)

### Próximo Passo Recomendado:
**Adicionar model Photo ao schema.prisma e implementar sync.**

Isso desbloquearia o fluxo completo de:
```
Captura (offline) → Sync → Banco → Query → Visualização
```

---

**Data:** 2025-01-20
**Analista:** Claude Code Assistant
**Próxima Revisão:** Após implementar Fase 1 (Photos no banco)
