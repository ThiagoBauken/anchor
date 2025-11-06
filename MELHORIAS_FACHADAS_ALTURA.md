# 🎯 Melhorias para Inspeção de Fachadas em Altura

**Contexto**: Trabalho de rapel/corda, em altura, usando celular
**Problema**: Implementação atual usa polígonos (múltiplos cliques) - DIFÍCIL em altura!
**Solução**: Retângulos simples + UI otimizada para celular + Camadas

---

## 📋 Estado Atual vs. Estado Ideal

### ❌ Implementação Atual (Polígonos)

**Como funciona:**
```
1. Click ponto 1
2. Click ponto 2
3. Click ponto 3
4. Click ponto 4... N
5. Double-click ou click no primeiro ponto para fechar
```

**Problemas para trabalho em altura:**
- 🚫 Muitos cliques (perigoso pendurado)
- 🚫 Preciso (difícil em celular pequeno)
- 🚫 Lento (tempo é crítico em altura)
- 🚫 Sem z-index/camadas (não controla sobreposição)

---

### ✅ Implementação Ideal (Retângulos com Camadas)

**Como deveria funcionar:**
```
1. Seleciona categoria 🔴 Fissura
2. ARRASTA dedo/mouse na foto (diagonal)
3. Retângulo aparece instantaneamente
4. Pronto! 1 gesto apenas
```

**Vantagens:**
- ✅ 1 gesto apenas (arrastar)
- ✅ Rápido (segundos)
- ✅ Seguro (menos tempo exposto)
- ✅ Fácil com touch (celular)
- ✅ Controle de camadas (z-index)

---

## 🎨 Categorias de Patologias (Padrão)

Estas categorias devem estar **SEMPRE visíveis** e **GRANDES** (touch-friendly):

### Categorias Obrigatórias

```
┌─────────────────────────────────────────────┐
│ SELECIONE A PATOLOGIA (toque para marcar): │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │   🔴   │  │   🟡   │  │   🟠   │       │
│  │FISSURA │  │INFILTR.│  │DESCOL. │       │
│  │  ALTA  │  │ MÉDIA  │  │ MÉDIA  │       │
│  └────────┘  └────────┘  └────────┘       │
│                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │   🔵   │  │   🟣   │  │   🟢   │       │
│  │ MANCHA │  │CORROSÃO│  │DESGASTE│       │
│  │  BAIXA │  │  ALTA  │  │  BAIXA │       │
│  └────────┘  └────────┘  └────────┘       │
│                                             │
│  [+ OUTRA PATOLOGIA...]                    │
└─────────────────────────────────────────────┘
```

**Tamanho dos botões:**
- Desktop: 120x100px (clicável)
- Mobile: 150x120px (touch-friendly)
- Fonte: 16px (legível)
- Ícones: 32px (visível)

---

## 📊 Comparação: Retângulo vs. Polígono

| Aspecto | Retângulo ✅ | Polígono Atual ❌ |
|---------|-------------|-------------------|
| **Gestos** | 1 (arrastar) | 4-8 (múltiplos clicks) |
| **Tempo** | 3 segundos | 20-30 segundos |
| **Precisão** | Fácil (área) | Difícil (pontos exatos) |
| **Mobile** | Perfeito (arraste) | Ruim (clicks precisos) |
| **Em altura** | Seguro (rápido) | Perigoso (demora) |

---

**Posso começar a implementação agora?** 🚀