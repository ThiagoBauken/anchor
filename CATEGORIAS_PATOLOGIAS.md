# 🎨 Categorias de Patologias - Inspeção de Fachadas

## 📋 Lista Completa de Categorias (21 categorias)

As categorias estão organizadas por **severidade** com cores específicas para cada tipo de problema.

---

## 🔴 CRÍTICOS (Prioridade Máxima)

Problemas que apresentam risco estrutural ou iminente.

| # | Nome | Cor | Hex Code | Descrição |
|---|------|-----|----------|-----------|
| 1 | **Desplacamento Crítico** | 🟥 Vermelho Escuro | `#C0392B` | Desplacamento em estado crítico com risco iminente |
| 2 | **Desplacamento Total** | 🔴 Vermelho | `#E74C3C` | Destacamento completo de revestimento |
| 3 | **Falta de Ancoragem** | 🔴 Vermelho Vivo | `#D63031` | Ausência ou falha de ancoragem estrutural |
| 4 | **Falta de Para-raios** | 🟠 Laranja Escuro | `#E17055` | Para-raios ausente ou caindo |

---

## 🟠 ALTOS (Prioridade Alta)

Problemas que requerem atenção urgente.

| # | Nome | Cor | Hex Code | Descrição |
|---|------|-----|----------|-----------|
| 5 | **Trinca** | 🔴 Vermelho Claro | `#FF7675` | Trincas na estrutura ou revestimento |
| 6 | **Infiltração** | 🌸 Rosa | `#FD79A8` | Sinais de infiltração de água |
| 7 | **Falta de Pingadeira** | 🟡 Amarelo | `#FDCB6E` | Ausência de pingadeira ou rufos |
| 8 | **Vidros Quebrados/Trincados** | 🟠 Laranja | `#F39C12` | Vidros danificados ou trincados |

---

## 🔵 MÉDIOS (Prioridade Média)

Problemas que devem ser monitorados e corrigidos.

| # | Nome | Cor | Hex Code | Descrição |
|---|------|-----|----------|-----------|
| 9 | **Reboco Solto** | 🔵 Azul Claro | `#74B9FF` | Reboco em processo de desplacamento |
| 10 | **Pastilha Solta** | 🟣 Lilás | `#A29BFE` | Pastilhas soltas ou em deslocamento |
| 11 | **Falta de Rejunte** | 🟣 Roxo | `#6C5CE7` | Ausência ou deterioração de rejunte |
| 12 | **Junta de Dilatação** | 🟢 Verde Escuro | `#00B894` | Problemas em juntas de dilatação |
| 13 | **Umidade** | 🔵 Ciano | `#00CEC9` | Manchas de umidade |
| 14 | **Falta de Silicone** | 🔵 Azul Claro | `#81ECEC` | Ausência ou deterioração de silicone |
| 15 | **Falta de Desvios** | 🟢 Verde Claro | `#55EFC4` | Ausência de desvios ou calhas |

---

## ⚪ BAIXOS (Prioridade Baixa)

Problemas estéticos ou de manutenção preventiva.

| # | Nome | Cor | Hex Code | Descrição |
|---|------|-----|----------|-----------|
| 16 | **Tinta Solta** | ⚪ Cinza Claro | `#DFE6E9` | Pintura descascando ou solta |
| 17 | **Textura Solta** | ⚪ Cinza | `#B2BEC3` | Textura em desplacamento |
| 18 | **Moldura** | ⚫ Cinza Escuro | `#636E72` | Problemas em molduras decorativas |
| 19 | **Molduras em Isopor** | 🟣 Lilás Claro | `#A29BFE` | Molduras de isopor danificadas |
| 20 | **Molduras em Gesso** | 🌸 Rosa Claro | `#F8A5C2` | Molduras de gesso com problemas |
| 21 | **Silicone** | 🟡 Amarelo Claro | `#FFEAA7` | Silicone envelhecido ou manchado |

---

## 🎨 Como Editar Cores das Categorias

### Método 1: Pela Interface (Recomendado)

1. Acesse a aba **"Inspeção de Fachada"**
2. Clique em **"Nova Categoria"**
3. Preencha:
   - **Nome**: Ex: "Minha Categoria"
   - **Cor**: Use o seletor de cores (color picker)
   - **Severidade**: Baixa / Média / Alta / Crítica
4. Clique em **"Criar Categoria"**

### Método 2: Editar Categoria Existente

**Importante**: A UI atual não tem botão de edição. Para editar, você precisa adicionar um botão de edição no componente `facade-inspection-manager.tsx`.

**Código para adicionar:**

```typescript
// No FacadeInspectionManager, adicione:
<button
  onClick={() => handleEditCategory(category.id)}
  className="text-blue-600 hover:text-blue-800"
>
  <Edit2 className="w-4 h-4" />
</button>

// Função:
const handleEditCategory = async (categoryId: string) => {
  // Abrir modal com color picker
  // Chamar updatePathologyCategory(categoryId, { color: newColor })
};
```

### Método 3: Via Banco de Dados (Avançado)

```sql
-- Alterar cor de uma categoria específica
UPDATE pathology_categories
SET color = '#FF0000'  -- Nova cor em hexadecimal
WHERE name = 'Desplacamento Crítico'
AND company_id = 'seu_company_id';
```

---

## 🌈 Paleta de Cores Sugeridas

### Cores para Críticos:
- `#C0392B` - Vermelho Escuro
- `#E74C3C` - Vermelho
- `#D63031` - Vermelho Vivo
- `#E17055` - Laranja Avermelhado

### Cores para Altos:
- `#FF7675` - Vermelho Claro
- `#FD79A8` - Rosa
- `#FDCB6E` - Amarelo
- `#F39C12` - Laranja

### Cores para Médios:
- `#74B9FF` - Azul Claro
- `#A29BFE` - Lilás
- `#6C5CE7` - Roxo
- `#00B894` - Verde Mar
- `#00CEC9` - Ciano
- `#81ECEC` - Azul Água
- `#55EFC4` - Verde Menta

### Cores para Baixos:
- `#DFE6E9` - Cinza Claro
- `#B2BEC3` - Cinza
- `#636E72` - Cinza Escuro
- `#FFEAA7` - Amarelo Pastel
- `#F8A5C2` - Rosa Pastel

---

## 📊 Resumo por Severidade

| Severidade | Quantidade | Cores Típicas |
|------------|------------|---------------|
| **CRÍTICO** | 4 categorias | Vermelhos e Laranjas Escuros |
| **ALTO** | 4 categorias | Laranjas, Amarelos e Rosas |
| **MÉDIO** | 7 categorias | Azuis, Verdes e Roxos |
| **BAIXO** | 6 categorias | Cinzas e Pastéis |

---

## 🔧 Customização por Empresa

Cada empresa pode:

✅ **Criar categorias próprias** com nomes específicos
✅ **Escolher cores personalizadas** para cada categoria
✅ **Definir severidade** (Baixa, Média, Alta, Crítica)
✅ **Desativar categorias** não utilizadas
✅ **Reordenar categorias** por prioridade

### Exemplo de Categorias Customizadas:

```typescript
// Empresa pode criar categorias específicas:
- "Pastilha Azul Solta" - #3498DB - Média
- "Granito Rachado" - #C0392B - Crítica
- "Mármore Manchado" - #95A5A6 - Baixa
- "Esquadria Oxidada" - #E67E22 - Alta
```

---

## 🎯 Como Usar no Campo

### Para Alpinistas/Inspetores:

1. **Acesse a inspeção** do projeto
2. **Selecione a fachada** (Norte, Sul, Leste, Oeste)
3. **Escolha a categoria** clicando na cor correspondente
4. **Desenhe o polígono** sobre a área afetada na foto
5. **Finalize** com duplo-clique
6. **Repita** para cada patologia encontrada

### Dicas de Uso:

- 🟥 **Vermelho** = Urgente (Desplacamentos, Falta de ancoragem)
- 🟠 **Laranja/Amarelo** = Atenção (Trincas, Infiltração)
- 🔵 **Azul/Verde** = Manutenção (Reboco, Rejunte, Umidade)
- ⚪ **Cinza/Pastel** = Estético (Tintas, Molduras)

---

## 📱 Interface Visual

As categorias aparecem como **botões coloridos** na interface:

```
┌─────────────────────────────────────────────────┐
│ Selecione a Categoria de Patologia:            │
├─────────────────────────────────────────────────┤
│  [Desplacamento Crítico]  [Desplacamento Total] │
│       🟥 Vermelho              🔴 Vermelho       │
│                                                  │
│  [Falta de Ancoragem]    [Falta de Para-raios]  │
│       🔴 Vermelho              🟠 Laranja        │
│                                                  │
│  [Trinca]               [Infiltração]           │
│   🔴 Vermelho Claro        🌸 Rosa              │
│                                                  │
│  ... (mais categorias)                          │
└─────────────────────────────────────────────────┘
```

**Quando selecionada**, a categoria fica com borda preta e fundo colorido transparente.

---

## 🚀 Próximas Melhorias

### Interface de Edição de Categorias:

- [ ] Botão "Editar" em cada categoria
- [ ] Modal de edição com color picker
- [ ] Arrastar para reordenar
- [ ] Duplicar categoria
- [ ] Exportar/Importar paleta de cores

### Recursos Avançados:

- [ ] Templates de categorias por tipo de edifício
- [ ] Sugestão automática de cor por nome
- [ ] Paleta de cores pré-definidas
- [ ] Preview da categoria antes de salvar
- [ ] Histórico de cores utilizadas

---

## 📚 Referências

- **Color Picker Online**: https://htmlcolorcodes.com/
- **Paletas de Cores**: https://flatuicolors.com/
- **Teoria das Cores**: Severidade Crítica = Vermelho, Alta = Laranja/Amarelo, Média = Azul/Verde, Baixa = Cinza

---

**Criado**: Janeiro 2025
**Versão**: 1.0
**Total de Categorias**: 21
