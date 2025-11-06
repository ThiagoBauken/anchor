# 📸 Guia Visual: Fluxo de Inspeção de Fachadas

**Data**: 2025-11-06
**Status**: ✅ Totalmente Implementado

---

## 🎯 O Que É e Para Que Serve?

O sistema de **Inspeção de Fachadas** permite que você:

1. **Fotografe** todas as fachadas de um prédio (Frente, Fundos, Laterais, etc.)
2. **Marque patologias** diretamente nas fotos (fissuras, infiltrações, etc.)
3. **Organize por gravidade** (baixa, média, alta, crítica)
4. **Gere laudos técnicos** profissionais

**Ideal para**: Inspeções prediais, vistorias técnicas, laudos de engenharia.

---

## 🚀 Fluxo Completo Passo a Passo

### 📍 PASSO 1: Acessar a Aba Fachadas

```
1. Faça login no sistema
2. Selecione um PROJETO no dropdown superior
3. Clique na aba "🏢 Fachadas"
```

**O que você verá:**
```
┌────────────────────────────────────────────┐
│ 🏢 Inspeção de Fachadas                   │
│ Gerencie inspeções de fachadas, marque    │
│ patologias (fissuras, infiltrações...)    │
├────────────────────────────────────────────┤
│ [⚙️ Gerenciar Categorias] [+ Nova Cat...] │
│                     [+ Nova Inspeção] ← 👈 │
│                                            │
│ Nenhuma inspeção criada                    │
│        [Criar Primeira Inspeção]           │
└────────────────────────────────────────────┘
```

---

### 📍 PASSO 2: Criar Uma Nova Inspeção

**O que é uma Inspeção?**
Uma inspeção é um **conjunto de fotos de fachadas** de um prédio específico, tiradas em uma data.

**Exemplo de nomes:**
- ✅ "Inspeção Edifício Solar - Jan/2025"
- ✅ "Vistoria Semestral - Bloco A"
- ✅ "Laudo Técnico - Prédio 3"

**Como criar:**

1. Clique em **[+ Nova Inspeção]**
2. Preencha o modal:

```
┌───────────────────────────────────────┐
│ Nova Inspeção de Fachada              │
├───────────────────────────────────────┤
│ Nome: [Inspeção Q1 2025___________]   │
│                                       │
│ Descrição (opcional):                 │
│ [Vistoria trimestral do edifício...] │
│                                       │
│        [Criar Inspeção] ←─ 👈        │
└───────────────────────────────────────┘
```

3. Clique em **[Criar Inspeção]**

**Resultado:**
✅ Inspeção aparece na lista com status "scheduled" (agendada)

---

### 📍 PASSO 3: Adicionar Fotos das Fachadas

Agora você vai **fotografar cada lado do prédio**.

**Exemplos de lados:**
- 🏢 **Frente Norte** (voltada para rua principal)
- 🏢 **Lateral Leste** (lado direito)
- 🏢 **Lateral Oeste** (lado esquerdo)
- 🏢 **Traseira Sul** (fundos)
- 🏢 **Interna** (área interna, se aplicável)

**Como adicionar:**

1. Clique na inspeção para expandir
2. Clique em **[📤 Adicionar Foto de Fachada]**
3. Preencha o modal:

```
┌───────────────────────────────────────┐
│ Adicionar Foto de Fachada             │
├───────────────────────────────────────┤
│ Nome: [Fachada Norte_______________]  │
│                                       │
│ Lado: [Frente ▼]                      │
│       - Frente                        │
│       - Atrás                         │
│       - Esquerda                      │
│       - Direita                       │
│       - Interna                       │
│                                       │
│ Foto: [Escolher arquivo] ←─ 👈       │
│                                       │
│ [Preview da foto aqui...]             │
│                                       │
│        [Adicionar Fachada]            │
└───────────────────────────────────────┘
```

**Tipos de foto aceitos:**
- 📸 Foto de celular/tablet
- 🚁 Foto de drone (ideal para prédios altos)
- 📷 Foto de câmera profissional
- Formatos: JPG, PNG, JPEG

**Dica:**
- **Use fotos de drone** para prédios altos (melhor visualização)
- **Nomeie claramente** cada fachada (ex: "Fachada Norte", "Lateral Leste")
- **Adicione todas as fachadas** antes de começar a marcar patologias

---

### 📍 PASSO 4: Configurar Categorias de Patologias

**Categorias Padrão (já criadas automaticamente):**

| Categoria | Cor | Gravidade | Uso |
|-----------|-----|-----------|-----|
| 🔴 Fissuras e Trincas | Vermelho | Alta | Rachaduras estruturais |
| 🟡 Infiltração e Umidade | Amarelo | Média | Manchas de água |
| 🟠 Descolamento de Revestimento | Laranja | Média | Reboco solto |
| 🔵 Manchas e Sujidades | Azul | Baixa | Sujeira, poluição |
| 🟣 Corrosão de Armadura | Roxo | Alta | Ferragem exposta |
| 🟢 Desgaste Natural | Verde | Baixa | Envelhecimento normal |

**Criar categoria personalizada:**

1. Clique em **[+ Nova Categoria]**
2. Preencha:

```
┌───────────────────────────────────────┐
│ Nova Categoria de Patologia           │
├───────────────────────────────────────┤
│ Nome: [Eflorescência______________]   │
│                                       │
│ Cor: [🎨 #00FF00] ← Color picker     │
│                                       │
│ Severidade: [Média ▼]                 │
│             - Baixa                   │
│             - Média                   │
│             - Alta                    │
│             - Crítica                 │
│                                       │
│        [Criar Categoria]              │
└───────────────────────────────────────┘
```

---

### 📍 PASSO 5: Marcar Patologias nas Fotos

**Este é o coração do sistema!** 🎯

**Como marcar:**

1. Expanda a inspeção (clique em **[Ver Detalhes]**)
2. Clique em uma fachada
3. Clique em **[Marcar Patologias]**
4. Selecione uma **Categoria** (ex: 🔴 Fissuras e Trincas)
5. **CLIQUE NA FOTO** onde está o problema

**Interface:**
```
┌─────────────────────────────────────────────┐
│ Selecione a Categoria de Patologia:        │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │   🔴   │ │   🟡   │ │   🟠   │          │
│ │Fissuras│ │Infiltr.│ │Descol. │ ← 👈 Click│
│ └────────┘ └────────┘ └────────┘          │
├─────────────────────────────────────────────┤
│                                             │
│     [FOTO DA FACHADA]                       │
│                                             │
│        ● ← Marcador vermelho (fissura)     │
│                                             │
│                  ● ← Azul (mancha)         │
│                                             │
│   Click aqui 👆 para adicionar marcador    │
│                                             │
└─────────────────────────────────────────────┘
```

**Quando você clica na foto:**

```
┌───────────────────────────────────────┐
│ Nova Patologia - Fissuras e Trincas  │
├───────────────────────────────────────┤
│ Descrição*:                           │
│ [Fissura vertical de 2mm__________]   │
│                                       │
│ Observações (opcional):               │
│ [Próximo à janela do 3º andar____]   │
│                                       │
│ Andar: [3_____]                       │
│                                       │
│ Elemento: [Parede externa________]    │
│                                       │
│ Prioridade: [Média ▼]                 │
│                                       │
│        [Salvar Marcador]              │
└───────────────────────────────────────┘
```

**Resultado:**
✅ Círculo colorido aparece na foto no ponto clicado
✅ Ao passar o mouse, mostra descrição da patologia
✅ Pode editar/deletar clicando no marcador

---

### 📍 PASSO 6: Configurar Andares (Opcional)

Para prédios com múltiplos andares, você pode dividir a fachada.

**Como configurar:**

1. Com a fachada aberta, clique em **[⚙️ Config. Andares]**
2. Preencha:

```
┌───────────────────────────────────────┐
│ Configuração de Divisão de Andares    │
├───────────────────────────────────────┤
│ Andares disponíveis (separados por ,):│
│ [Térreo,1,2,3,4,5,Cobertura_______]   │
│                                       │
│ Divisões (opcional):                  │
│ [Apartamento A,B,C,D______________]   │
│                                       │
│        [Salvar Configuração]          │
└───────────────────────────────────────┘
```

**Resultado:**
✅ Ao marcar patologia, pode selecionar andar no dropdown
✅ Facilita organização de grandes prédios

---

### 📍 PASSO 7: Editar/Deletar Marcadores

**Editar um marcador:**
1. Clique no círculo colorido na foto
2. Modal abre com dados atuais
3. Altere o que precisar
4. Clique em **[Atualizar]**

**Deletar um marcador:**
1. Clique no marcador
2. Clique em **[🗑️ Deletar]**
3. Confirme

---

### 📍 PASSO 8: Alterar Status da Inspeção

Conforme você trabalha, atualize o status:

**Status disponíveis:**

```
📝 scheduled     → Agendada (recém-criada)
🔄 in_progress   → Em Progresso (fotografando/marcando)
✅ completed     → Concluída (todas fachadas marcadas)
📋 under_review  → Em Revisão (aguardando aprovação)
✅ approved      → Aprovada (laudo aprovado)
❌ rejected      → Rejeitada (precisa refazer)
```

**Como alterar:**
1. Veja o badge de status da inspeção
2. Sistema atualiza automaticamente conforme você trabalha

---

## 🎨 Interface Visual Completa

### Visão Geral da Aba Fachadas

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Inspeção de Fachadas                                │
│ Gerencie inspeções de fachadas, marque patologias...   │
├─────────────────────────────────────────────────────────┤
│ [⚙️ Gerenciar Categorias] [+ Nova Cat] [+ Nova Insp.] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📋 Inspeção Q1 2025                             │   │
│ │ Vistoria trimestral do edifício                 │   │
│ │ [🟢 in_progress] 4 lados fotografados           │   │
│ │                          [Ver Detalhes] ←─ 👈  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─ Expandido após clicar "Ver Detalhes" ───────┐   │
│   │                                                │   │
│   │ [📤 Adicionar Foto de Fachada]                │   │
│   │                                                │   │
│   │ ┌─────────────────────────────────────────┐   │   │
│   │ │ 📸 Fachada Norte                        │   │   │
│   │ │               [Marcar Patologias] ←─ 👈│   │   │
│   │ └─────────────────────────────────────────┘   │   │
│   │                                                │   │
│   │   ┌─ Canvas após clicar "Marcar" ─────────┐  │   │
│   │   │                                        │  │   │
│   │   │ Categorias:                            │  │   │
│   │   │ [🔴 Fissuras] [🟡 Infiltração] ...    │  │   │
│   │   │                                        │  │   │
│   │   │ ┌──────────────────────────────────┐  │  │   │
│   │   │ │                                  │  │  │   │
│   │   │ │  [FOTO DA FACHADA COM MARCADORES]│  │  │   │
│   │   │ │                                  │  │  │   │
│   │   │ │     ● ← Marcadores coloridos     │  │  │   │
│   │   │ │                                  │  │  │   │
│   │   │ └──────────────────────────────────┘  │  │   │
│   │   └────────────────────────────────────────┘  │   │
│   └────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📋 Inspeção Q2 2024 (antiga)                    │   │
│ │ [✅ completed] 6 lados fotografados             │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Exemplo Real de Uso

### Cenário: Inspeção do Edifício Solar

**Contexto:**
- Prédio de 10 andares
- 4 fachadas principais
- Várias patologias detectadas

**Passo a passo executado:**

#### 1. Criar Inspeção
```
Nome: "Vistoria Semestral - Jan/2025"
Descrição: "Inspeção preventiva semestral do Edifício Solar"
```

#### 2. Fotografar Fachadas (com drone)
```
✅ Fachada Norte (Frente)     → Foto drone 12MP
✅ Fachada Sul (Fundos)       → Foto drone 12MP
✅ Fachada Leste (Lateral)    → Foto drone 12MP
✅ Fachada Oeste (Lateral)    → Foto drone 12MP
```

#### 3. Configurar Andares
```
Andares: Térreo,1,2,3,4,5,6,7,8,9,10,Cobertura
Divisões: Apt A,Apt B,Apt C,Apt D
```

#### 4. Marcar Patologias na Fachada Norte

**Marcador 1:**
```
Categoria: 🔴 Fissuras e Trincas
Posição: Click na foto (3º andar)
Descrição: "Fissura vertical de 2mm"
Andar: 3
Elemento: Parede externa
Prioridade: Média
```

**Marcador 2:**
```
Categoria: 🟡 Infiltração e Umidade
Posição: Click na foto (5º andar)
Descrição: "Mancha de umidade 50x30cm"
Andar: 5
Elemento: Varanda
Prioridade: Alta
```

**Marcador 3:**
```
Categoria: 🟠 Descolamento de Revestimento
Posição: Click na foto (8º andar)
Descrição: "Reboco solto 1m²"
Andar: 8
Elemento: Parede lateral
Prioridade: Alta
```

#### 5. Marcar Patologias nas Outras Fachadas

```
Fachada Sul:
  ● 🟣 Corrosão de Armadura (Cobertura)
  ● 🟡 Infiltração (6º andar)

Fachada Leste:
  ● 🔴 Fissura (4º andar)
  ● 🔵 Mancha (2º andar)

Fachada Oeste:
  ● 🟢 Desgaste Natural (Térreo)
```

#### 6. Alterar Status
```
scheduled → in_progress → completed
```

**Resultado Final:**
✅ 4 fachadas fotografadas
✅ 8 patologias marcadas
✅ Todas organizadas por gravidade
✅ Pronto para gerar laudo técnico

---

## 🔐 Permissões

| Ação | Superadmin | Company Admin | Team Admin | Technician |
|------|-----------|---------------|-----------|-----------|
| Ver inspeções | ✅ | ✅ | ✅ | ✅ |
| Criar inspeção | ✅ | ✅ | ✅ | ❌ |
| Adicionar fachadas | ✅ | ✅ | ✅ | ❌ |
| Marcar patologias | ✅ | ✅ | ✅ | ❌ |
| Editar marcadores | ✅ | ✅ | ✅ | ❌ |
| Deletar inspeção | ✅ | ✅ | ❌ | ❌ |
| Gerenciar categorias | ✅ | ✅ | ✅ | ❌ |

**Técnicos** podem apenas **visualizar** inspeções.

---

## 💡 Dicas Profissionais

### 📸 Para Tirar Boas Fotos

1. **Use drone** para prédios altos (melhor ângulo)
2. **Luz natural** pela manhã ou fim de tarde
3. **Evite sombras** que escondam patologias
4. **Tire múltiplas fotos** do mesmo lado (escolha a melhor)
5. **Resolução mínima** 8MP (recomendado 12MP+)

### 🎯 Para Marcar Patologias

1. **Seja específico** na descrição ("Fissura vertical 2mm" não "rachadura")
2. **Use prioridades** corretamente (Crítica só para risco estrutural)
3. **Adicione fotos** close-up da patologia (campo opcional)
4. **Marque todas** mesmo pequenas (melhor documentação)
5. **Use andares** para facilitar localização física

### 📋 Para Organizar Inspeções

1. **Nome claro** com data (facilita histórico)
2. **Descrição completa** do contexto
3. **Fotografe TODAS fachadas** antes de marcar
4. **Configure andares** antes de começar
5. **Atualize status** conforme trabalha

---

## 🐛 Problemas Comuns e Soluções

### Problema: Não consigo adicionar foto

**Possíveis causas:**

1. **Sem permissão**: Técnicos não podem adicionar fotos
   - Solução: Faça login com role company_admin ou team_admin

2. **Arquivo muito grande**: Foto > 10MB
   - Solução: Comprima a foto antes (use app de compressão)

3. **Formato inválido**: Arquivo não é imagem
   - Solução: Use JPG, PNG ou JPEG

### Problema: Marcador não aparece na foto

**Causas comuns:**

1. **Categoria não selecionada**: Precisa selecionar antes de clicar
   - Solução: Click em uma categoria (🔴 🟡 🟠 etc.)

2. **Clique fora da foto**: Clique foi fora da área da imagem
   - Solução: Clique dentro da foto

3. **Navegador antigo**: Canvas não suportado
   - Solução: Use Chrome, Firefox ou Edge atualizado

### Problema: Foto não carrega

**Soluções:**

1. Verifique conexão com internet
2. Recarregue a página (F5)
3. Limpe cache do navegador
4. Tente fazer upload novamente

---

## 🚀 Funcionalidades Futuras (Roadmap)

Planejado para próximas versões:

### v2.0 (Curto Prazo)
- 📄 **Geração de Laudo PDF** com fotos e marcadores
- 📊 **Dashboard de Patologias** (gráficos, estatísticas)
- 🔔 **Notificações** para patologias críticas
- 📱 **App Mobile** dedicado (iOS + Android)

### v3.0 (Médio Prazo)
- 📸 **Comparação Temporal** (antes vs depois)
- 🤖 **IA para Detecção Automática** de fissuras
- 🗺️ **Integração com Mapa 3D** do prédio
- 📋 **Templates de Laudo** personalizáveis

### v4.0 (Longo Prazo)
- 🚁 **Integração Direta com Drone** (upload automático)
- 🔬 **Análise de Gravidade por IA**
- 📈 **Predição de Deterioração** (machine learning)
- 🌍 **Visualização em Realidade Aumentada** (AR)

---

## 📞 Suporte

**Dúvidas sobre o fluxo?**
- Consulte este documento
- Teste no ambiente de desenvolvimento
- Entre em contato com suporte técnico

**Encontrou um bug?**
- Descreva o problema detalhadamente
- Envie screenshots
- Informe: navegador, role do usuário, passos para reproduzir

---

**Documento criado**: 2025-11-06
**Versão**: 1.0
**Status**: ✅ Funcionalidade Totalmente Implementada
**Próximo passo**: Comece a usar! 🎉
