# Fluxo de Cadastro e Uso do Sistema de Fachadas

**Data**: 2025-11-06
**Branch**: claude/analyze-frontend-backend-011CUpFimxN14EpSf2gJd3cz

---

## 🏢 O Que É o Sistema de Fachadas?

O sistema de inspeção de fachadas permite que você:
- Fotografe fachadas de prédios
- Marque patologias diretamente nas fotos (fissuras, infiltrações, etc.)
- Categorize problemas por tipo e gravidade
- Gere laudos técnicos profissionais

---

## 🎯 Fluxo Completo de Uso

### Passo 1: Acessar a Aba Fachadas

1. Faça login no sistema
2. Selecione um **Projeto** no dropdown superior
3. Clique na aba **Fachadas** 🏢

**O que você verá:**
```
┌─────────────────────────────────────────┐
│ 🏢 Inspeção de Fachadas                │
│ Gerencie inspeções de fachadas, marque │
│ patologias (fissuras, infiltrações...)  │
├─────────────────────────────────────────┤
│ [+ Nova Inspeção]                       │
│                                         │
│ Lista de inspeções criadas              │
└─────────────────────────────────────────┘
```

---

### Passo 2: Criar Uma Nova Inspeção

Uma **Inspeção** é um conjunto de fachadas de um edifício. Por exemplo:
- "Inspeção Edifício Solar - Jan/2025"
- "Vistoria Prédio A - Lote 3"

**Como criar:**

1. Clique em **[+ Nova Inspeção]**
2. Preencha o modal:
   - **Nome**: Ex: "Inspeção Edifício Solar"
   - **Descrição** (opcional): Ex: "Vistoria semestral - Janeiro 2025"
3. Clique em **Criar Inspeção**

**O que acontece:**
- Sistema cria a inspeção no banco de dados
- Inspeção aparece na lista
- Status inicial: `draft` (rascunho)

---

### Passo 3: Adicionar Fachadas (Lados)

Cada prédio tem múltiplas fachadas. Por exemplo:
- **Frente** (voltada para rua)
- **Fundos**
- **Lateral Esquerda**
- **Lateral Direita**
- **Topo** (cobertura)

**Como adicionar uma fachada:**

1. Clique na inspeção criada para expandir
2. Clique em **[+ Adicionar Fachada]**
3. Preencha o modal:
   - **Nome**: Ex: "Fachada Frontal"
   - **Tipo**: Selecione (Frente, Fundos, Lateral, Topo, Outra)
   - **Foto da Fachada**: Clique para fazer upload ou tirar foto
4. Clique em **Criar Fachada**

**Upload de Imagem:**
- Aceita: JPG, PNG, JPEG
- A imagem é convertida para base64 e salva no banco
- Tamanho natural da imagem é detectado (largura x altura)

---

### Passo 4: Marcar Patologias na Fachada

Agora você pode clicar **diretamente na foto** para marcar problemas.

**Como marcar:**

1. Clique na fachada na lista para abrir o canvas
2. Selecione uma **Categoria de Patologia** no dropdown:
   - 🔴 Fissuras e Trincas (alta gravidade)
   - 🟡 Infiltração e Umidade (média)
   - 🟠 Descolamento de Revestimento (média)
   - 🔵 Manchas e Sujidades (baixa)
   - 🟣 Corrosão de Armadura (alta)
   - 🟢 Desgaste Natural (baixa)
3. **Clique na foto** onde está o problema
4. Um círculo colorido aparece no ponto clicado
5. Preencha o formulário que abre:
   - **Descrição**: Ex: "Fissura vertical de 2mm"
   - **Observações** (opcional): Ex: "Próximo à janela do 3º andar"
   - **Andar** (opcional): Ex: "3"
   - **Elemento** (opcional): Ex: "Parede externa"
6. Clique em **Salvar Marcador**

**O que acontece:**
- Sistema salva as coordenadas X, Y do clique
- Marcador fica visível na foto com cor da categoria
- Ao passar o mouse, mostra resumo da patologia

---

### Passo 5: Configurar Divisão de Andares (Opcional)

Para prédios altos, você pode dividir a fachada em andares.

**Como configurar:**

1. Abra a fachada
2. Clique em **[⚙️ Configurar Andares]**
3. Defina:
   - **Número de andares**: Ex: 10
   - **Altura de cada andar** (em pixels): Ex: 80
   - **Offset inicial** (margem do topo): Ex: 50
4. Clique em **Salvar Configuração**

**Resultado:**
- Linhas horizontais aparecem na foto separando andares
- Ao marcar patologia, sistema calcula automaticamente em qual andar está

---

### Passo 6: Gerenciar Categorias de Patologias

Você pode criar categorias personalizadas.

**Categorias Padrão (criadas automaticamente):**

| Categoria | Cor | Gravidade |
|-----------|-----|-----------|
| Fissuras e Trincas | 🔴 Vermelho | Alta |
| Infiltração e Umidade | 🟡 Amarelo | Média |
| Descolamento de Revestimento | 🟠 Laranja | Média |
| Manchas e Sujidades | 🔵 Azul | Baixa |
| Corrosão de Armadura | 🟣 Roxo | Alta |
| Desgaste Natural | 🟢 Verde | Baixa |

**Como criar categoria personalizada:**

1. Clique em **[+ Nova Categoria]**
2. Preencha:
   - **Nome**: Ex: "Eflorescência"
   - **Cor**: Escolha no color picker
   - **Gravidade**: Baixa, Média ou Alta
3. Clique em **Criar**

---

### Passo 7: Editar/Deletar Marcadores

**Editar um marcador:**
1. Clique no círculo colorido na foto
2. Modal abre com dados atuais
3. Altere o que precisar
4. Clique em **Atualizar**

**Deletar um marcador:**
1. Clique no marcador
2. Clique em **[🗑️ Deletar]** no modal
3. Confirme a exclusão

---

### Passo 8: Alterar Status da Inspeção

Conforme avança no trabalho, atualize o status:

**Status disponíveis:**
- 📝 **Draft** (Rascunho): Ainda criando e marcando
- 🔄 **In Progress** (Em Progresso): Inspeção em campo
- ✅ **Completed** (Concluída): Todas as fachadas inspecionadas
- 📋 **Under Review** (Em Revisão): Aguardando aprovação
- ✅ **Approved** (Aprovada): Laudo aprovado
- ❌ **Rejected** (Rejeitada): Precisa refazer

**Como alterar:**
1. Clique no dropdown de status da inspeção
2. Selecione o novo status
3. Sistema atualiza automaticamente

---

## 🗂️ Estrutura de Dados

### Hierarquia

```
Projeto
  └── Inspeção (ex: "Vistoria Jan/2025")
        ├── Fachada 1 (ex: "Fachada Frontal")
        │     ├── Configuração de Andares (opcional)
        │     └── Marcadores de Patologia
        │           ├── Marcador 1 (ex: Fissura no 3º andar)
        │           ├── Marcador 2 (ex: Infiltração no 5º andar)
        │           └── ...
        ├── Fachada 2 (ex: "Lateral Direita")
        │     └── Marcadores...
        └── ...
```

### Dados de Cada Marcador

```json
{
  "id": "marker_abc123",
  "facadeSideId": "side_def456",
  "categoryId": "cat_fissuras",
  "x": 234,
  "y": 567,
  "description": "Fissura vertical de 2mm",
  "observations": "Próximo à janela do 3º andar",
  "floor": 3,
  "element": "Parede externa",
  "createdAt": "2025-01-20T10:30:00Z",
  "createdByUserId": "user_xyz789"
}
```

---

## 🎨 Interface Visual

### Canvas Interativo

O componente principal é o **FacadeMarkerCanvas**:

```
┌─────────────────────────────────────────────┐
│ Categoria: [🔴 Fissuras e Trincas ▼]       │
├─────────────────────────────────────────────┤
│                                             │
│     [FOTO DA FACHADA]                       │
│                                             │
│       ● ← Marcador vermelho (fissura)      │
│                                             │
│                 ● ← Marcador azul (mancha) │
│                                             │
│   ─────────────── ← Linha de andar          │
│                                             │
└─────────────────────────────────────────────┘
```

**Interações:**
- **Click**: Adiciona novo marcador
- **Hover sobre marcador**: Mostra tooltip com descrição
- **Click em marcador**: Abre modal para editar

---

## 🔐 Permissões

### Quem Pode Fazer O Quê?

| Ação | Superadmin | Company Admin | Team Admin | Technician |
|------|-----------|---------------|-----------|-----------|
| Visualizar fachadas | ✅ | ✅ | ✅ | ✅ |
| Criar inspeção | ✅ | ✅ | ✅ | ❌ |
| Adicionar fachadas | ✅ | ✅ | ✅ | ❌ |
| Marcar patologias | ✅ | ✅ | ✅ | ❌ |
| Editar marcadores | ✅ | ✅ | ✅ | ❌ |
| Deletar inspeção | ✅ | ✅ | ❌ | ❌ |
| Criar categorias | ✅ | ✅ | ✅ | ❌ |

**Lógica de permissão:**
```typescript
const canEdit = currentUser.role === 'superadmin' ||
                currentUser.role === 'company_admin' ||
                currentUser.role === 'team_admin';
```

---

## 📦 Componentes Envolvidos

### 1. FacadesTab (src/components/facades-tab.tsx)
- **Função**: Ponto de entrada da aba
- **Responsabilidade**: Verificar projeto selecionado e usuário logado

### 2. FacadeInspectionManager (src/components/facade-inspection-manager.tsx)
- **Função**: Gerenciador principal
- **Responsabilidade**:
  - Listar inspeções
  - CRUD de inspeções, fachadas e categorias
  - Coordenar sub-componentes

### 3. FacadeMarkerCanvas (src/components/facade-marker-canvas.tsx)
- **Função**: Canvas interativo para marcar patologias
- **Responsabilidade**:
  - Renderizar imagem da fachada
  - Desenhar marcadores nas coordenadas
  - Capturar cliques e adicionar novos marcadores
  - Mostrar linhas de divisão de andares

### 4. PathologyCategoryEditor (src/components/pathology-category-editor.tsx)
- **Função**: Editor de categorias de patologias
- **Responsabilidade**: Criar/editar/deletar categorias

### 5. FloorDivisionConfig (src/components/floor-division-config.tsx)
- **Função**: Configuração de divisão de andares
- **Responsabilidade**: Definir número de andares e espaçamento

### 6. PathologyMarkerForm (src/components/pathology-marker-form.tsx)
- **Função**: Formulário para adicionar/editar marcador
- **Responsabilidade**: Coletar dados da patologia (descrição, andar, elemento)

---

## 🔄 Server Actions

Todas as operações de banco de dados usam Server Actions:

```typescript
// src/app/actions/facade-inspection-actions.ts

// Inspeções
getInspectionsForProject(projectId)
createFacadeInspection(projectId, name, userId, description?)
updateFacadeInspection(inspectionId, data)
deleteFacadeInspection(inspectionId)

// Fachadas (Lados)
createFacadeSide(inspectionId, data)
updateFacadeSide(sideId, data)
deleteFacadeSide(sideId)

// Categorias
getPathologyCategoriesForProject(projectId)
createPathologyCategory(projectId, data)
seedDefaultPathologyCategories(projectId)

// Marcadores
getPathologyMarkersForFacadeSide(facadeSideId)
createPathologyMarker(facadeSideId, data)
updatePathologyMarker(markerId, data)
deletePathologyMarker(markerId)
```

---

## 🐛 Problemas Comuns e Soluções

### Problema: Tela Preta ao Abrir Fachadas

**Causa**: `currentUser` estava undefined (hook errado)

**Solução**: ✅ CORRIGIDO no commit fb9b961
- FacadesTab agora usa `useOfflineData()` em vez de `useOfflineAuthSafe()`

---

### Problema: Não Consigo Marcar Patologias

**Possíveis causas:**

1. **Sem permissão**: Técnicos não podem marcar
   - Solução: Login com role company_admin ou team_admin

2. **Categoria não selecionada**: Precisa selecionar categoria antes
   - Solução: Dropdown "Categoria" no topo do canvas

3. **Imagem não carregou**: Canvas em branco
   - Solução: Re-upload da imagem da fachada

---

### Problema: Categorias Não Aparecem

**Causa**: Projeto novo sem categorias seed

**Solução**: Sistema cria automaticamente ao carregar pela primeira vez

Se não criou, execute manualmente:
```typescript
await seedDefaultPathologyCategories(projectId)
```

---

## 📝 Exemplo de Uso Completo

### Cenário: Inspeção do Edifício Solar

1. **Login**: João (company_admin)
2. **Selecionar**: Projeto "Edifício Solar - Bloco A"
3. **Ir para**: Aba Fachadas
4. **Criar inspeção**: "Vistoria Semestral - Jan/2025"
5. **Adicionar fachadas**:
   - Fachada Frontal (foto tirada com celular)
   - Fachada Lateral Direita
   - Fachada Fundos
6. **Configurar andares**: Fachada Frontal = 10 andares
7. **Marcar patologias na Frontal**:
   - Click no 3º andar → Categoria: Fissuras → "Fissura vertical 2mm"
   - Click no 5º andar → Categoria: Infiltração → "Mancha de umidade"
   - Click no 8º andar → Categoria: Descolamento → "Reboco solto"
8. **Marcar patologias na Lateral**:
   - Click → Categoria: Corrosão → "Armadura exposta"
9. **Alterar status**: Draft → Completed
10. **Resultado**: Inspeção completa, pronta para laudo

---

## 🚀 Próximas Funcionalidades (Futuro)

- 📄 **Geração de Laudo PDF**: Exportar inspeção completa com fotos e marcadores
- 📊 **Dashboard de Patologias**: Gráficos de tipos e gravidades
- 🔔 **Notificações**: Alertas para patologias de alta gravidade
- 📸 **Comparação Temporal**: Ver evolução de patologias entre inspeções
- 🤖 **Detecção Automática**: IA para identificar fissuras automaticamente

---

**Documento criado**: 2025-11-06
**Status**: ✅ Sistema funcionando após correção dos hooks
**Testado**: Sim
