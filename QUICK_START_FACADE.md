# 🚀 Quick Start - Sistema de Inspeção de Fachadas

## ⚡ Início Rápido (5 minutos)

### PASSO 1: Executar Migration (OBRIGATÓRIO)

Execute o SQL no PostgreSQL:

```bash
psql -h 185.215.165.19 -p 8002 -U postgres -d privado
```

Depois, no prompt do psql:

```sql
\i migration_facade_inspections.sql
```

Ou copie e cole o conteúdo de [`migration_facade_inspections.sql`](migration_facade_inspections.sql) no pgAdmin/DBeaver.

---

### PASSO 2: Adicionar o Componente na UI

**Opção Simples: Nova Aba**

Abra o arquivo onde você gerencia as abas (ex: `src/components/anchor-view.tsx`):

```typescript
import { FacadeInspectionManager } from '@/components/facade-inspection-manager';

// Adicione a aba
const tabs = [
  // ... abas existentes
  { id: 'facade', label: 'Inspeção de Fachada' }
];

// No switch/if das abas:
{activeTab === 'facade' && (
  <FacadeInspectionManager
    projectId={currentProject.id}
    companyId={user.companyId}
    currentUserId={user.id}
    canEdit={true}
  />
)}
```

**Pronto!** ✅

---

## 📸 Como Usar

### 1. Criar Inspeção
Clique em **"Nova Inspeção"** → Preencha nome → **"Criar Inspeção"**

### 2. Adicionar Fotos
Clique em **"Ver Detalhes"** → **"Adicionar Foto de Fachada"** → Selecione lado (Norte/Sul/Leste/Oeste) → Upload da foto

### 3. Marcar Patologias
Clique em **"Marcar Patologias"** → Selecione categoria (ex: Fissura) → Clique na imagem para desenhar polígono → **Duplo-clique** para finalizar

---

## 🎨 Categorias Padrão (24 categorias - Criadas Automaticamente)

### 🔴 CRÍTICAS (5)
1. **Desplacamento Crítico** - Vermelho Escuro
2. **Desplacamento Total** - Vermelho
3. **Falta de Ancoragem** - Vermelho Vivo
4. **Falta de Para-raios** - Laranja Escuro
5. **Corrosão** - Laranja ⭐

### 🟠 ALTAS (4)
6. **Trinca** - Vermelho Claro (inclui fissuras)
7. **Infiltração** - Rosa
8. **Falta de Pingadeira** - Amarelo
9. **Vidros Quebrados/Trincados** - Laranja

### 🔵 MÉDIAS (7)
10. **Reboco Solto** - Azul Claro
11. **Pastilha Solta** - Lilás
12. **Falta de Rejunte** - Roxo
13. **Junta de Dilatação** - Verde Escuro
14. **Umidade** - Ciano (inclui bolor/mofo)
15. **Falta de Silicone** - Azul Água
16. **Falta de Desvios** - Verde Claro

### ⚪ BAIXAS (8)
17. **Eflorescência** - Lilás Claro ⭐
18. **Desgaste** - Cinza ⭐
19. **Tinta Solta** - Cinza Claro
20. **Textura Solta** - Cinza
21. **Moldura** - Cinza Escuro
22. **Molduras em Isopor** - Lilás
23. **Molduras em Gesso** - Rosa Claro
24. **Silicone** - Amarelo Claro

**Todas as cores são editáveis!** Clique em **"Gerenciar Categorias"** para editar.

---

## 📋 Checklist Mínimo

- [ ] Migration executada no banco
- [ ] Componente adicionado na UI
- [ ] Testado criar inspeção
- [ ] Testado adicionar foto
- [ ] Testado desenhar marcador

**Tempo estimado**: 5-10 minutos

---

## 📚 Documentação Completa

- **Guia Completo**: [`FACADE_INSPECTION_README.md`](FACADE_INSPECTION_README.md)
- **Resumo Geral**: [`IMPLEMENTACAO_COMPLETA_FINAL.md`](IMPLEMENTACAO_COMPLETA_FINAL.md)

---

**Versão**: 1.0 - Janeiro 2025
