# 📊 ESTRUTURA COMPLETA DO ANCHORVIEW

## 🎯 **Visão Geral do Sistema**

AnchorView é uma plataforma B2B2C para gestão de pontos de ancoragem e inspeção de fachadas em edifícios.

### 💼 **MODELO DE NEGÓCIO B2B DUPLO**

O AnchorView pode ser vendido para **DOIS** públicos distintos:

**1️⃣ ADMINISTRADORAS/SÍNDICOS** (company_admin)
- Gerenciam prédios/condomínios
- Criam projetos para seus edifícios
- Contratam empresas de alpinismo
- Visualizam mapas (read-only)
- Acompanham trabalho das equipes

**2️⃣ EMPRESAS DE ALPINISMO** (team_admin)
- Podem SER CLIENTES comprando a plataforma
- Criam seus próprios projetos
- Gerenciam sua equipe de técnicos
- Editam mapas e marcam patologias
- TAMBÉM podem trabalhar para administradoras (quando convidados)

**🔄 VANTAGEM COMPETITIVA:**
- Administradora cria projeto → Convida alpinista
- Alpinista edita mapa → Realiza trabalho
- **OU** Alpinista cria próprio projeto → Trabalha independente
- **Ambos podem ser clientes pagantes!**

---

## 👥 **SISTEMA DE 4 NÍVEIS DE PERMISSÃO**

### **1. SUPERADMIN** (Proprietário do Sistema)
- **Quem é:** Dono da plataforma AnchorView
- **Acesso:** TOTAL a todas empresas e funcionalidades
- **Pode:**
  - ✅ Gerenciar TODAS as empresas
  - ✅ Acessar dados de qualquer empresa
  - ✅ Criar/editar/excluir qualquer projeto
  - ✅ Gerenciar todos os usuários
  - ✅ Acessar admin dashboard (`/admin`)
  - ✅ Ver analytics e uso da plataforma

### **2. COMPANY_ADMIN** (Administrador da Empresa/Condomínio)
- **Quem é:** Gestor do prédio/condomínio (cliente pagante)
- **Acesso:** Total na SUA empresa
- **Pode:**
  - ✅ Criar e gerenciar projetos
  - ✅ Contratar e gerenciar equipes de alpinismo
  - ✅ Visualizar mapas (READ-ONLY - não pode editar pontos)
  - ✅ Ver todos os relatórios
  - ✅ Convidar usuários (company_admin, team_admin, technician)
  - ✅ Gerenciar equipes
  - ✅ Configurar visualização pública de projetos
  - ✅ Ver histórico de testes
- **NÃO pode:**
  - ❌ Criar/editar/excluir pontos de ancoragem no mapa
  - ❌ Marcar patologias em fachadas

### **3. TEAM_ADMIN** (Líder da Equipe de Alpinismo)
- **Quem é:** Responsável técnico da empresa de alpinismo
- **Acesso:** Projetos que criou OU projetos atribuídos à sua equipe
- **MODELO B2B DUPLO** - Pode ser cliente pagante OU prestador de serviço:
  - 🏢 **Como CLIENTE** (compra a plataforma):
    - Cria seus próprios projetos/prédios
    - Gerencia sua empresa de alpinismo
    - Convida técnicos para sua equipe
  - 🤝 **Como PRESTADOR** (trabalha para administradoras):
    - Recebe convite de administradoras
    - Edita projetos das administradoras
    - Realiza trabalho técnico
- **Pode:**
  - ✅ **CRIAR** projetos na sua própria empresa **[NOVO!]**
  - ✅ Editar mapas dos projetos que criou OU projetos atribuídos
  - ✅ Criar/editar/excluir pontos de ancoragem
  - ✅ Marcar patologias em fachadas
  - ✅ Configurar plantas baixas
  - ✅ Realizar testes
  - ✅ Convidar técnicos para sua equipe
  - ✅ Ver relatórios de seus projetos
- **NÃO pode:**
  - ❌ Acessar projetos de outras equipes (exceto se convidado)
  - ❌ Gerenciar equipes de outras empresas

### **4. TECHNICIAN** (Técnico de Alpinismo)
- **Quem é:** Alpinista de campo
- **Acesso:** Apenas realizar testes
- **Pode:**
  - ✅ Ver pontos de ancoragem
  - ✅ Realizar testes em pontos existentes
  - ✅ Tirar fotos
  - ✅ Adicionar observações
  - ✅ Atualizar número de lacre
- **NÃO pode:**
  - ❌ Criar/editar/excluir pontos
  - ❌ Editar mapas
  - ❌ Gerenciar usuários
  - ❌ Criar projetos
  - ❌ Marcar patologias

---

## 📋 **ESTRUTURA DE MENUS (10 ABAS)**

### **1. DASHBOARD** 🏠
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - Visão geral do projeto
  - Estatísticas de pontos
  - Alertas de inspeção
  - Gráficos de status

### **2. PROJETOS** 📁
- **Acesso:** Todos os níveis
- **Requer:** -
- **Funcionalidade:**
  - **CRIAR:** superadmin, company_admin
  - **EDITAR:** superadmin, company_admin
  - **EXCLUIR:** superadmin, company_admin
  - **VISUALIZAR:** Todos
  - Configurar plantas baixas (opcional)
  - Gerenciar localizações
  - Configurações públicas

### **3. MAPA** 🗺️
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - **VISUALIZAR:** Todos
  - **EDITAR PONTOS:** team_admin, superadmin
  - **SOMENTE VER:** company_admin, technician
  - Gerenciar múltiplas plantas baixas
  - Ferramenta de linha (criar pontos em sequência)
  - Exportar mapa como imagem

### **4. FACHADAS** 🏢 **[NOVO!]**
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - **CRIAR INSPEÇÃO:** company_admin, superadmin
  - **MARCAR PATOLOGIAS:** team_admin, superadmin
  - **VISUALIZAR:** Todos
  - Upload de fotos de drone
  - Desenhar polígonos sobre fissuras/infiltrações
  - Configurar andares e divisões (A1-A10, D1-D7)
  - Categorizar patologias (gravidade, tipo)
  - Gerar laudos técnicos

### **5. PONTOS** 📍
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - **CRIAR:** team_admin, superadmin
  - **EDITAR:** team_admin, superadmin
  - **EXCLUIR/ARQUIVAR:** team_admin, superadmin
  - **VISUALIZAR:** Todos
  - Lista completa de pontos
  - Filtros avançados
  - Ver histórico de testes

### **6. TESTES** 🧪
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - **REALIZAR TESTE:** Todos (menos visualizadores externos)
  - **VER HISTÓRICO:** Todos
  - Captura de fotos
  - Registro de carga/tempo
  - Atualização de lacre
  - Status (Aprovado/Reprovado)

### **7. RELATÓRIOS** 📊
- **Acesso:** Todos os níveis
- **Requer:** Projeto selecionado
- **Funcionalidade:**
  - Exportar Excel
  - Exportar PDF
  - Exportar Word
  - Relatórios personalizados
  - Histórico completo

### **8. EQUIPES** 👥
- **Acesso:** company_admin, superadmin
- **Requer:** -
- **Funcionalidade:**
  - Criar equipes de alpinismo
  - Atribuir equipes a projetos
  - Gerenciar membros
  - Definir permissões por projeto
  - CNPJ, certidões, seguros

### **9. SYNC** ☁️
- **Acesso:** Todos os níveis
- **Requer:** -
- **Funcionalidade:**
  - Sincronização offline
  - Upload de fotos pendentes
  - Status de sincronização
  - Gerenciar cache

### **10. USUÁRIOS** 👤
- **Acesso:** company_admin, superadmin
- **Requer:** -
- **Funcionalidade:**
  - **CRIAR:** company_admin (apenas da sua empresa), superadmin (qualquer empresa)
  - **EDITAR:** company_admin, superadmin
  - **EXCLUIR:** company_admin, superadmin
  - Gerenciar convites
  - Definir roles
  - Ativar/desativar usuários

---

## 👤 **JORNADAS DE USUÁRIO DETALHADAS**

### **1️⃣ SUPERADMIN - Dono da Plataforma**

```
📍 ACESSO INICIAL
├─> Login em /auth/login
├─> Identificado automaticamente como superadmin
└─> Redirecionado para /app

🏠 DASHBOARD (/app)
├─> Vê visão geral de TODAS as empresas
├─> Analytics globais de uso da plataforma
├─> Botão "Admin Dashboard" (ícone de escudo) visível
└─> Pode selecionar qualquer projeto de qualquer empresa

⚙️ AÇÕES PRINCIPAIS
├─> [Aba Admin] (/admin)
│   ├─> Gerenciar todas as empresas
│   ├─> Ver estatísticas de uso
│   ├─> Configurar planos e limites
│   └─> Acessar logs de auditoria
│
├─> [Aba Projetos]
│   ├─> Ver projetos de TODAS as empresas
│   ├─> Criar/editar/excluir qualquer projeto
│   └─> Gerenciar qualquer configuração
│
├─> [Aba Mapa]
│   ├─> Editar mapas de qualquer projeto
│   ├─> Criar/editar/excluir pontos
│   ├─> Adicionar plantas baixas
│   └─> Ferramenta de linha
│
├─> [Aba Fachadas]
│   ├─> Criar inspeções
│   ├─> Marcar patologias
│   ├─> Configurar andares/divisões
│   └─> Gerar laudos
│
├─> [Aba Equipes]
│   ├─> Gerenciar todas as equipes
│   └─> Atribuir equipes a projetos
│
└─> [Aba Usuários]
    ├─> Criar usuários em qualquer empresa
    ├─> Definir qualquer role
    └─> Ativar/desativar usuários
```

---

### **2️⃣ COMPANY_ADMIN - Gestor do Prédio/Condomínio**

```
📍 PRIMEIRO ACESSO
├─> Registra conta em /auth/register
├─> Automaticamente vira COMPANY_ADMIN (primeiro usuário)
├─> Cria sua empresa (Company)
└─> Redirecionado para /app

🏗️ CONFIGURAÇÃO INICIAL
├─> [Aba Projetos] - Criar Primeiro Projeto
│   ├─> Clica em "Novo Projeto"
│   ├─> Preenche: Nome, Endereço
│   ├─> (Opcional) Upload plantas baixas
│   ├─> Define padrões (carga teste, dispositivo)
│   └─> Salva projeto
│
├─> [Aba Equipes] - Contratar Empresa de Alpinismo
│   ├─> Clica em "Nova Equipe"
│   ├─> Preenche: Nome, CNPJ, Certidões
│   ├─> Atribui equipe ao projeto
│   └─> Convida TEAM_ADMIN da empresa
│
└─> [Aba Usuários] - Convidar Colaboradores
    ├─> Pode convidar: company_admin, team_admin, technician
    └─> Define permissões por projeto

📊 USO DIÁRIO
├─> [Dashboard]
│   ├─> Seleciona projeto no dropdown
│   ├─> Vê estatísticas de pontos ativos
│   ├─> Alertas de inspeções vencidas
│   └─> Gráficos de status
│
├─> [Aba Mapa] - SOMENTE VISUALIZAÇÃO ⚠️
│   ├─> ✅ Pode: Ver pontos, plantas, localizações
│   └─> ❌ NÃO pode: Criar/editar/excluir pontos
│
├─> [Aba Fachadas]
│   ├─> ✅ Criar nova inspeção
│   ├─> ✅ Ver patologias marcadas
│   ├─> ✅ Configurar andares/divisões
│   └─> ❌ NÃO pode: Marcar patologias (role do team_admin)
│
├─> [Aba Testes]
│   ├─> Ver todos os testes realizados
│   ├─> Filtrar por status, localização, data
│   └─> Ver fotos e observações
│
├─> [Aba Relatórios]
│   ├─> Exportar Excel com todos os pontos
│   ├─> Gerar PDF profissional
│   ├─> Exportar Word para edição
│   └─> Configurar visualização pública (QR Code)
│
└─> [Aba Equipes]
    ├─> Gerenciar equipes contratadas
    ├─> Atribuir/desatribuir de projetos
    └─> Ver histórico de trabalhos

🔄 FLUXO TÍPICO MENSAL
1. Acessa Dashboard → Vê alerta "15 pontos vencem em 7 dias"
2. Vai em Equipes → Atribui equipe ao projeto
3. Team_admin recebe notificação
4. Acompanha progresso em Testes
5. Gera relatório em Relatórios
6. Compartilha PDF com moradores
```

---

### **3️⃣ TEAM_ADMIN - Líder da Equipe de Alpinismo**

**IMPORTANTE:** Team_admin pode ser CLIENTE (comprando o sistema) OU PRESTADOR (trabalhando para administradoras)

```
📍 ACESSO INICIAL

CENÁRIO A - COMO CLIENTE (Empresa de Alpinismo compra o sistema):
├─> Registra conta em /auth/register
├─> Automaticamente vira TEAM_ADMIN (pode criar projetos)
├─> Cria sua empresa de alpinismo
└─> Redirecionado para /app

CENÁRIO B - COMO PRESTADOR (Convidado por administradora):
├─> Recebe convite por email do company_admin
├─> Clica no link → Cria senha
├─> Login em /auth/login
└─> Vê projetos atribuídos à sua equipe

🛠️ TRABALHO TÉCNICO PRINCIPAL
├─> [Dashboard]
│   ├─> Seleciona projeto atribuído
│   ├─> Vê estatísticas dos seus projetos
│   └─> Alertas de testes pendentes
│
├─> [Aba Mapa] - MODO EDIÇÃO COMPLETO ✅
│   ├─> Seleciona/adiciona plantas baixas
│   ├─> Cria localizações (Fachada Norte, Sul, etc.)
│   ├─> Clica no mapa → Cria pontos de ancoragem
│   ├─> Usa ferramenta de linha (criar sequência)
│   ├─> Preenche dados de cada ponto:
│   │   ├─> Progressão (Horizontal, Vertical)
│   │   ├─> Número do ponto
│   │   ├─> Localização (dropdown)
│   │   ├─> Dispositivo de ancoragem
│   │   ├─> Carga de teste
│   │   └─> Observações
│   └─> Salva pontos (sincroniza automaticamente)
│
├─> [Aba Fachadas] - MARCAR PATOLOGIAS ✅
│   ├─> Seleciona inspeção criada pelo company_admin
│   ├─> Upload foto de drone (Fachada Norte)
│   ├─> Clica em "Configurar Andares/Divisões"
│   │   ├─> Escolhe padrão: 1-10, D1-D7
│   │   └─> Ou adiciona customizado
│   ├─> Seleciona ferramenta de polígono
│   ├─> Desenha sobre fissura/infiltração
│   ├─> Preenche formulário:
│   │   ├─> Andar: "7" (dropdown)
│   │   ├─> Divisão: "D6" (dropdown)
│   │   ├─> Categoria: "Fissura" (dropdown)
│   │   ├─> Gravidade: "Alta"
│   │   ├─> Descrição: "Fissura horizontal 2m"
│   │   ├─> Upload fotos close-up (opcional)
│   │   └─> Observações
│   └─> Salva patologia
│
├─> [Aba Pontos]
│   ├─> Vê lista de todos os pontos criados
│   ├─> Edita informações de pontos
│   ├─> Arquiva pontos inutilizados
│   └─> Filtra por status, localização
│
├─> [Aba Testes]
│   ├─> Pode realizar testes (se necessário)
│   └─> Ver histórico completo
│
├─> [Aba Usuários]
│   ├─> Convidar apenas TECHNICIANs
│   └─> Atribuir técnicos aos projetos da equipe
│
└─> [Aba Relatórios]
    ├─> Gerar relatórios dos seus projetos
    └─> Exportar para entregar ao cliente

🔄 FLUXO TÍPICO DE TRABALHO
DIA 1:
1. Recebe atribuição de projeto "Edifício Solar"
2. Vai em Mapa → Upload planta baixa do térreo
3. Cria localizações: "Fachada Norte", "Fachada Sul", "Cobertura"
4. Marca 50 pontos de ancoragem usando ferramenta de linha
5. Convida 3 técnicos da equipe

DIA 2-5:
1. Técnicos realizam testes em campo
2. Acompanha progresso em Testes
3. Corrige pontos se necessário

DIA 6:
1. Vai em Fachadas → Upload fotos de drone
2. Marca 12 patologias encontradas
3. Gera relatório técnico
4. Envia para company_admin
```

---

### **4️⃣ TECHNICIAN - Alpinista de Campo**

```
📍 ACESSO INICIAL
├─> Recebe convite do team_admin
├─> Login em /app (mobile PWA)
└─> Vê apenas projetos da sua equipe

📱 TRABALHO EM CAMPO (Mobile)
├─> [Dashboard]
│   ├─> Seleciona projeto do dia
│   └─> Vê quantos pontos faltam testar
│
├─> [Aba Mapa] - SOMENTE VISUALIZAÇÃO
│   ├─> ✅ Pode: Ver onde estão os pontos
│   ├─> ✅ Pode: Clicar e ver detalhes
│   └─> ❌ NÃO pode: Criar/editar pontos
│
├─> [Aba Pontos] - SOMENTE VISUALIZAÇÃO
│   ├─> Ver lista de pontos
│   ├─> Filtrar por localização
│   └─> Ver quais já foram testados
│
└─> [Aba Testes] - TRABALHO PRINCIPAL ✅
    ├─> Vê lista de pontos para testar
    ├─> Clica em "Realizar Teste"
    ├─> Preenche formulário:
    │   ├─> Carga aplicada (kgf)
    │   ├─> Tempo de carga (segundos)
    │   ├─> Status: Aprovado/Reprovado
    │   ├─> Número do lacre (obrigatório)
    │   ├─> Observações (opcional)
    │   └─> Fotos (captura nativa 100% qualidade)
    ├─> Salva teste (armazena offline se sem internet)
    └─> Sincroniza automático quando volta conexão

🔄 FLUXO TÍPICO DO DIA
MANHÃ (8h-12h):
1. Chega no prédio → Abre app
2. Seleciona "Edifício Solar"
3. Vai em Testes → Vê 25 pontos pendentes
4. Filtra por "Fachada Norte"
5. Realiza 10 testes:
   - Tira foto do ponto
   - Aplica carga: 1500 kgf
   - Tempo: 300 segundos
   - Status: Aprovado ✅
   - Lacre: LAC-2025-001
   - Salva (modo offline)

TARDE (13h-17h):
1. Continua testes (15 pontos restantes)
2. Encontra 1 ponto reprovado:
   - Status: Reprovado ❌
   - Observação: "Ancoragem solta, necessária troca"
   - Foto mostrando problema
3. Finaliza trabalho
4. Volta para escritório → Conecta WiFi
5. App sincroniza 25 testes automaticamente
6. Team_admin recebe notificação

🚫 LIMITAÇÕES
- ❌ NÃO pode criar/editar/excluir pontos
- ❌ NÃO pode marcar patologias em fachadas
- ❌ NÃO pode convidar usuários
- ❌ NÃO pode editar projetos
- ✅ PODE apenas: Ver pontos e realizar testes
```

---

## 🔄 **CENÁRIOS COMPLETOS DE USO**

### **Cenário 1: Novo Edifício - Do Zero ao Relatório**

```
SEMANA 1 - CONTRATAÇÃO
├─> COMPANY_ADMIN (Síndico)
│   ├─> Dia 1: Registra conta → Cria projeto "Edifício Solar"
│   ├─> Dia 2: Cria equipe "Alpinismo Vertical LTDA"
│   └─> Dia 3: Convida João (team_admin da empresa)
│
└─> TEAM_ADMIN (João)
    └─> Dia 3: Aceita convite → Acessa projeto

SEMANA 2 - MAPEAMENTO
├─> TEAM_ADMIN (João)
│   ├─> Dia 1: Upload 3 plantas (Térreo, 1º, 2º Andar)
│   ├─> Dia 2: Cria localizações (4 fachadas + cobertura)
│   ├─> Dia 3: Marca 80 pontos de ancoragem no mapa
│   └─> Dia 4: Convida 2 técnicos (Pedro e Maria)
│
└─> TECHNICIANS
    └─> Dia 4: Recebem acesso → Instalam app mobile

SEMANA 3 - INSPEÇÃO
├─> TECHNICIAN (Pedro)
│   ├─> Segunda: Testa 20 pontos (Fachada Norte)
│   ├─> Terça: Testa 20 pontos (Fachada Sul)
│   └─> Quarta: Testa 15 pontos (offline - sem sinal)
│
├─> TECHNICIAN (Maria)
│   ├─> Segunda: Testa 15 pontos (Fachada Leste)
│   └─> Terça: Testa 10 pontos (Cobertura)
│
└─> TEAM_ADMIN (João)
    └─> Acompanha progresso: 80/80 pontos testados ✅

SEMANA 4 - ENTREGA
├─> TEAM_ADMIN (João)
│   ├─> Revisa todos os testes
│   ├─> Encontra 3 pontos reprovados
│   └─> Gera relatório preliminar
│
└─> COMPANY_ADMIN (Síndico)
    ├─> Recebe notificação "Inspeção concluída"
    ├─> Revisa relatório
    ├─> Exporta PDF profissional
    ├─> Configura visualização pública
    ├─> Gera QR Code
    └─> Compartilha com moradores
```

### **Cenário 2: Alpinista como Cliente (Modelo B2B Duplo)**

```
SEMANA 1 - REGISTRO COMO CLIENTE
├─> TEAM_ADMIN (João - Empresa "Alpinismo Vertical")
│   ├─> Dia 1: Registra conta no AnchorView
│   ├─> Sistema cria empresa "Alpinismo Vertical LTDA"
│   ├─> João vira team_admin (primeiro usuário)
│   └─> Cria primeiro projeto "Edifício Luna"

SEMANA 2 - CONFIGURAÇÃO PRÓPRIA
├─> TEAM_ADMIN (João)
│   ├─> Vai em Projetos → Cria "Edifício Luna"
│   ├─> Upload plantas baixas
│   ├─> Cria localizações
│   ├─> Marca 60 pontos de ancoragem
│   └─> Convida 2 técnicos (Pedro e Maria)

SEMANA 3 - TRABALHO DE CAMPO
├─> TECHNICIANS (Pedro e Maria)
│   └─> Realizam 60 testes no projeto do próprio João

SEMANA 4 - ENTREGA PARA CLIENTE FINAL
└─> TEAM_ADMIN (João)
    ├─> Gera relatório completo
    ├─> Entrega para síndico do Edifício Luna
    └─> João usou o sistema como CLIENTE PAGANTE

💡 RESULTADO: Empresa de alpinismo pode usar o sistema independentemente!
```

### **Cenário 3: Alpinista trabalha para Administradora (Modelo B2B Duplo)**

```
DIA 1 - CONVITE DA ADMINISTRADORA
├─> COMPANY_ADMIN (Maria - Administradora de Condomínios)
│   ├─> Cria projeto "Edifício Solar"
│   ├─> Cria equipe "Alpinismo Vertical LTDA"
│   └─> Convida João (team_admin da empresa de alpinismo)

DIA 2-5 - TRABALHO TÉCNICO
├─> TEAM_ADMIN (João)
│   ├─> Aceita convite
│   ├─> Vê 2 tipos de projetos no sistema:
│   │   ├─> "Edifício Luna" (criado por ele - é dono)
│   │   └─> "Edifício Solar" (convidado - trabalha para Maria)
│   ├─> Seleciona "Edifício Solar"
│   ├─> Edita mapa (permissão concedida)
│   └─> Marca pontos de ancoragem

DIA 6 - ENTREGA
└─> COMPANY_ADMIN (Maria)
    ├─> Vê mapa editado por João
    ├─> Acompanha testes realizados
    └─> Gera relatório para moradores

💡 RESULTADO: João usa o mesmo sistema para:
   - Seus próprios projetos (como cliente)
   - Projetos das administradoras (como prestador)
```

### **Cenário 4: Inspeção de Fachada Semestral**

```
MÊS 1 - PREPARAÇÃO
├─> COMPANY_ADMIN
│   ├─> Semana 1: Cria inspeção "Q1-2025"
│   ├─> Semana 2: Contrata equipe especializada
│   └─> Semana 3: Agenda voo de drone
│
└─> TEAM_ADMIN
    └─> Semana 3: Recebe atribuição → Planeja trabalho

MÊS 2 - COLETA DE DADOS
├─> TEAM_ADMIN
│   ├─> Dia 1: Voo de drone → 12 fotos das 4 fachadas
│   ├─> Dia 2: Upload fotos no sistema
│   ├─> Dia 3: Configura andares (1-15) e divisões (D1-D8)
│   │
│   ├─> Dia 4-10: Análise e marcação
│   │   ├─> Fachada Norte: 8 patologias
│   │   │   ├─> 3 fissuras (andar 7, 9, 12)
│   │   │   ├─> 2 infiltrações (andar 5, 8)
│   │   │   └─> 3 desplacamentos (andar 3, 6, 10)
│   │   │
│   │   ├─> Fachada Sul: 5 patologias
│   │   ├─> Fachada Leste: 12 patologias (mais exposta)
│   │   └─> Fachada Oeste: 4 patologias
│   │
│   └─> Para cada patologia:
│       ├─> Desenha polígono
│       ├─> Seleciona andar e divisão
│       ├─> Categoriza (Fissura/Infiltração/etc)
│       ├─> Define gravidade (Baixa/Média/Alta/Crítica)
│       ├─> Adiciona fotos close-up
│       └─> Preenche observações técnicas
│
└─> COMPANY_ADMIN
    └─> Acompanha progresso em tempo real

MÊS 3 - RELATÓRIO E AÇÃO
├─> TEAM_ADMIN
│   ├─> Gera laudo técnico completo
│   ├─> Prioriza patologias críticas (3 casos)
│   └─> Envia para company_admin
│
└─> COMPANY_ADMIN
    ├─> Revisa laudo
    ├─> Convoca assembleia
    ├─> Apresenta relatório (com fotos e mapa)
    ├─> Aprova orçamento para reparos
    └─> Compartilha via QR Code público
```

---

---

## 🗂️ **HIERARQUIA DE DADOS**

```
COMPANY (Empresa/Condomínio)
│
├─> USERS (Usuários)
│   ├─> superadmin (dono da plataforma)
│   ├─> company_admin (gestor do prédio)
│   ├─> team_admin (líder da equipe)
│   └─> technician (alpinista)
│
├─> TEAMS (Equipes de Alpinismo)
│   ├─> Nome, CNPJ, Certidões
│   └─> ProjectTeamPermission (acesso a projetos específicos)
│
├─> PROJECTS (Projetos/Edifícios)
│   ├─> FloorPlans (Plantas Baixas) [NOVO!]
│   │   └─> Múltiplas plantas por projeto
│   │
│   ├─> Locations (Localizações)
│   │   └─> Fachada Norte, Cobertura, etc.
│   │
│   ├─> AnchorPoints (Pontos de Ancoragem)
│   │   ├─> floorPlanId (qual planta) [NOVO!]
│   │   └─> AnchorTests (Testes realizados)
│   │
│   └─> FacadeInspections (Inspeções de Fachada) [NOVO!]
│       └─> FacadeSides (Lados da fachada)
│           ├─> availableFloors ["1","2"..."10"] [NOVO!]
│           ├─> availableDivisions ["D1","D2"..."D7"] [NOVO!]
│           └─> PathologyMarkers (Patologias marcadas)
│               ├─> floor: "7" [NOVO!]
│               ├─> division: "D6" [NOVO!]
│               ├─> categoria, gravidade, fotos
│               └─> polígono desenhado
│
└─> PATHOLOGY_CATEGORIES (Categorias de Patologias)
    └─> Fissuras, Infiltração, Desplacamento, etc.
```

---

## 📱 **SUPORTE MOBILE (PWA + Capacitor)**

### **PWA (Progressive Web App)**
- ✅ Funciona offline
- ✅ Instala como app nativo
- ✅ Sincronização automática em background
- ✅ Notificações push

### **Capacitor (iOS/Android)**
- ✅ Camera nativa (qualidade 100%)
- ✅ Salva fotos na galeria
- ✅ Acesso ao filesystem
- ✅ Funciona 100% offline
- ✅ Sincroniza quando volta conexão

---

## 🔐 **MATRIZ DE PERMISSÕES DETALHADA**

| Funcionalidade | superadmin | company_admin | team_admin | technician |
|---|---|---|---|---|
| **PROJETOS** |
| Criar projeto | ✅ | ✅ | ✅ (próprios) | ❌ |
| Editar projeto | ✅ | ✅ | ✅ (próprios) | ❌ |
| Excluir projeto | ✅ | ✅ | ✅ (próprios) | ❌ |
| Ver projeto | ✅ | ✅ | ✅ (próprios + atribuídos) | ✅ (atribuído) |
| **MAPA** |
| Ver mapa | ✅ | ✅ | ✅ | ✅ |
| Criar pontos | ✅ | ❌ | ✅ | ❌ |
| Editar pontos | ✅ | ❌ | ✅ | ❌ |
| Excluir pontos | ✅ | ❌ | ✅ | ❌ |
| Adicionar plantas | ✅ | ✅ | ✅ | ❌ |
| **FACHADAS** |
| Criar inspeção | ✅ | ✅ | ❌ | ❌ |
| Marcar patologias | ✅ | ❌ | ✅ | ❌ |
| Ver inspeções | ✅ | ✅ | ✅ | ✅ |
| Configurar andares/divisões | ✅ | ✅ | ✅ | ❌ |
| **TESTES** |
| Realizar teste | ✅ | ✅ | ✅ | ✅ |
| Ver histórico | ✅ | ✅ | ✅ | ✅ |
| **EQUIPES** |
| Criar equipe | ✅ | ✅ | ❌ | ❌ |
| Gerenciar equipe | ✅ | ✅ | ❌ | ❌ |
| Atribuir a projetos | ✅ | ✅ | ❌ | ❌ |
| **USUÁRIOS** |
| Convidar usuários | ✅ | ✅ (sua empresa) | ✅ (technician) | ❌ |
| Editar usuários | ✅ | ✅ (sua empresa) | ❌ | ❌ |
| Excluir usuários | ✅ | ✅ (sua empresa) | ❌ | ❌ |
| **RELATÓRIOS** |
| Gerar Excel/PDF | ✅ | ✅ | ✅ | ✅ |
| **ADMIN** |
| Admin dashboard | ✅ | ❌ | ❌ | ❌ |

---

## 🎨 **NOVIDADES IMPLEMENTADAS**

### **Sistema de Múltiplas Plantas Baixas**
- ✅ Múltiplas plantas por projeto (Térreo, 1º Andar, etc.)
- ✅ Cada planta tem seus próprios pontos
- ✅ Gerenciamento completo (criar/editar/excluir)
- ✅ Seletor visual de plantas

### **Sistema de Inspeção de Fachadas**
- ✅ Upload de fotos de drone
- ✅ Configuração de andares e divisões
- ✅ Desenho de polígonos sobre patologias
- ✅ Categorização (Fissuras, Infiltração, etc.)
- ✅ Níveis de gravidade (Baixa/Média/Alta/Crítica)
- ✅ Múltiplas fotos por patologia
- ✅ Geração de laudos técnicos

---

## 📞 **SUPORTE E DOCUMENTAÇÃO**

- **Documentação técnica:** `/CLAUDE.md`
- **Permissões:** `/src/lib/permissions.ts`
- **Tipos:** `/src/types/index.ts`
- **Schema:** `/prisma/schema.prisma`

---

**Versão:** 2.0
**Última atualização:** 2025-01-21
**Status:** ✅ Totalmente operacional com modelo B2B duplo

## 🆕 **NOVIDADES VERSÃO 2.0**

### **Modelo B2B Duplo Implementado**
- ✅ Team_admin pode criar projetos próprios (antes só podia editar projetos atribuídos)
- ✅ Sistema vendável para DOIS públicos: Administradoras E Empresas de Alpinismo
- ✅ Alpinistas podem ser clientes pagantes independentes
- ✅ Alpinistas podem trabalhar para administradoras (quando convidados)
- ✅ Permissões flexíveis: projetos próprios vs projetos atribuídos
- ✅ Verificação de permissões centralizada em `/src/lib/permissions.ts`
