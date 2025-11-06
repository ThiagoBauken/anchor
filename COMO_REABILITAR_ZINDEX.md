# 🔧 Como Re-habilitar o Z-Index (Controle de Camadas)

**Status Atual:** ⚠️ Z-Index **DESABILITADO** temporariamente

**Motivo:** Banco de dados não tem a coluna `z_index` ainda. Precisa aplicar migração primeiro.

---

## ⚡ Passos para Re-habilitar

### 1️⃣ Aplicar Migração no Banco de Dados

**Opção A: Via Prisma (Recomendado)**
```bash
cd /home/user/anchor
npx prisma migrate deploy
```

**Opção B: Manualmente no PostgreSQL**
```sql
-- Conecte ao banco:
psql "postgres://privado:privado12!@private_alpdb:5432/privado"

-- Execute a migração:
\i prisma/migrations/20251106000001_add_zindex_to_pathology_markers/migration.sql

-- OU copie e cole:
ALTER TABLE "pathology_markers" ADD COLUMN IF NOT EXISTS "z_index" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "pathology_markers_z_index_idx" ON "pathology_markers"("z_index");

-- Verifique:
\d pathology_markers
-- Deve mostrar coluna z_index
```

---

### 2️⃣ Descomentar Campo no Schema Prisma

**Arquivo:** `prisma/schema.prisma` (linha ~915)

```prisma
model PathologyMarker {
  // ... outros campos

  // ANTES (comentado):
  // zIndex        Int?               @default(0) @map("z_index") // Layer control (higher = on top) - TEMPORARIAMENTE COMENTADO ATÉ MIGRAÇÃO

  // DEPOIS (descomentado):
  zIndex        Int                @default(0) @map("z_index") // Layer control (higher = on top)

  // ... outros campos

  @@index([facadeSideId])
  @@index([categoryId])
  @@index([zIndex])  // ← Descomentar também
  @@map("pathology_markers")
}
```

---

### 3️⃣ Descomentar Campo no Types

**Arquivo:** `src/types/index.ts` (linha ~313)

```typescript
export interface PathologyMarker {
  // ... outros campos

  // ANTES (opcional):
  zIndex?: number;  // ← OPCIONAL até migração aplicada

  // DEPOIS (obrigatório):
  zIndex: number;   // ← Controle de camadas (qual fica na frente)

  // ... outros campos
}
```

---

### 4️⃣ Regenerar Prisma Client

```bash
npx prisma generate
```

---

### 5️⃣ Rebuild e Restart

**Se em desenvolvimento:**
```bash
npm run dev
```

**Se em produção (Docker):**
```bash
npm run build
docker-compose up --build
```

---

## ✅ Verificar se Funcionou

### Teste 1: Criar Marcador
1. Abra a aba Fachadas
2. Crie um retângulo na foto
3. **Não deve dar erro 500** ✅

### Teste 2: Z-Index Funciona
1. Crie 3 retângulos sobrepostos
2. Clique em um marcador
3. Clique "⬆️ Trazer p/ Frente"
4. **Marcador deve subir na pilha** ✅

### Teste 3: Banco de Dados
```sql
SELECT id, "z_index" FROM pathology_markers LIMIT 5;
```
**Deve retornar valores** (0, 1, 2, etc.) ✅

---

## 🚨 Se Der Erro

### Erro: "Column z_index doesn't exist"
**Solução:** Volte ao Passo 1, migração não foi aplicada

### Erro: "Prisma Client out of sync"
**Solução:** Execute `npx prisma generate` novamente

### Erro: Build falha com tipo undefined
**Solução:** Certifique que descomentou AMBOS:
- prisma/schema.prisma
- src/types/index.ts

---

## 📊 Status Atual (Temporário)

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| Modo Retângulo | ✅ Funciona | 200% mais rápido |
| Modo Polígono | ✅ Funciona | Retrocompatível |
| Z-Index (Camadas) | ⚠️ Desabilitado | Renderiza por ordem de criação |
| Botões Z-Index | ⚠️ Aparecem mas não funcionam | Aguardando migração |
| Quick Mode | ✅ Funciona | Marcar agora, detalhar depois |
| Categorias | ✅ Funciona | 21 padrão disponíveis |

---

## 📝 Notas

- **Marcadores existentes:** Funcionam normalmente, apenas não têm z-index
- **Após migração:** Marcadores antigos receberão z-index baseado em ordem de criação
- **Sem perda de dados:** Geometrias (retângulos/polígonos) preservadas
- **Reversível:** Pode comentar novamente se necessário

---

## 🔗 Referências

- Migração SQL: `prisma/migrations/20251106000001_add_zindex_to_pathology_markers/migration.sql`
- Documentação completa: `OTIMIZACAO_FACHADAS_PARA_ALTURA.md`
- Melhorias futuras: `MELHORIAS_FACHADAS_DISPONIVEIS.md`

---

**Última atualização:** 2025-11-06
**Commit relacionado:** `78a28a4` - fix: Desabilita temporariamente zIndex até migração ser aplicada
