# Proposta: Sistema de Permissões Multi-nível e Funcionalidades Adicionais

## 📋 Análise do Sistema Atual

### Permissões Existentes
O sistema já possui infraestrutura básica de permissões:
- **Modelo `Permission`**: Define permissões por categoria (system, company, project, point, test)
- **Modelo `UserPermission`**: Associa usuários a permissões específicas
- **Roles básicos**: user, admin, superadmin
- **Isolamento por Company**: Dados já são segregados por empresa

### Limitações Atuais
❌ Não há conceito de "Equipes" (Teams)
❌ Não há permissões granulares por projeto
❌ Não há visualização pública de histórico
❌ Não há sistema de QR Code

---

## 🏗️ Nova Arquitetura Proposta: B2B2C Multi-tenant

### Hierarquia de Entidades
```
SUPERADMIN (Anthropic/Você)
    └── COMPANY (Administradora de Condomínio)
            ├── PROJECTS (Prédios/Obras)
            │     ├── Prédio A
            │     ├── Prédio B
            │     └── Prédio C
            └── TEAMS (Equipes de Alpinismo)
                  ├── Equipe Alpha Climbing
                  │     └── Permissões: [Prédio A, Prédio B]
                  ├── Equipe Beta Rope Access
                  │     └── Permissões: [Prédio C]
                  └── Equipe interna
                        └── Permissões: [Todos os prédios]
```

### Modelo de Dados Proposto

#### 1. Nova Entidade: Team (Equipe)
```typescript
model Team {
  id          String   @id @default(cuid())
  name        String   // "Alpha Climbing LTDA"
  companyId   String   // Pertence à administradora

  // Informações da equipe
  cnpj        String?
  email       String?
  phone       String?
  address     String?
  logo        String?  // base64

  // Certificações
  certifications String[] // ["NR-35", "NR-33", "ISO 9001"]
  insurance      String?  // Apólice de seguro
  insuranceExpiry DateTime?

  // Status
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  // Relações
  company     Company  @relation(fields: [companyId], references: [id])
  members     TeamMember[]
  projectPermissions ProjectTeamPermission[]

  @@map("teams")
}

model TeamMember {
  id       String @id @default(cuid())
  teamId   String
  userId   String
  role     String // "owner", "manager", "technician", "viewer"

  team     Team   @relation(fields: [teamId], references: [id])
  user     User   @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
  @@map("team_members")
}

model ProjectTeamPermission {
  id         String   @id @default(cuid())
  projectId  String
  teamId     String
  permissions String[] // ["view", "create_points", "edit_points", "test_points", "archive_points", "export"]
  grantedBy  String   // userId do admin da company
  grantedAt  DateTime @default(now())
  expiresAt  DateTime? // Permissão temporária para projetos específicos

  project    Project  @relation(fields: [projectId], references: [id])
  team       Team     @relation(fields: [teamId], references: [id])

  @@unique([projectId, teamId])
  @@map("project_team_permissions")
}
```

#### 2. Visualização Pública (URL → QR Code)

**Conceito Simplificado**:
- Cada projeto (prédio) tem uma URL pública única
- A administradora copia essa URL e gera QR Code externamente
- Público acessa histórico completo de TODOS os pontos daquele prédio

```typescript
model ProjectPublicSettings {
  id              String   @id @default(cuid())
  projectId       String   @unique
  isPublic        Boolean  @default(false) // Admin controla se é público
  publicToken     String   @unique // Token único para URL pública

  // Configurações de visibilidade
  showTestHistory      Boolean @default(true)
  showPhotos           Boolean @default(true)
  showTechnicalData    Boolean @default(true)
  showCompanyInfo      Boolean @default(true)
  showTeamInfo         Boolean @default(true)

  // Mensagem customizada
  welcomeMessage       String? // "Bem-vindo ao Condomínio XYZ"

  // Analytics simples
  totalViews           Int     @default(0)
  lastViewedAt         DateTime?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  project              Project @relation(fields: [projectId], references: [id])

  @@map("project_public_settings")
}
```

**URLs Públicas**:
```
https://anchorview.app/public/project/[token]
  → Mostra todos os pontos do prédio
  → Lista com filtros (Aprovado/Reprovado/Vencido)
  → Clique em ponto = histórico completo

Exemplo:
https://anchorview.app/public/project/cm5x8h3k2000109l8a1b2c3d4
```

**Como funciona**:
1. Admin acessa "Configurações do Projeto"
2. Ativa "Visualização Pública"
3. Copia a URL gerada
4. Usa site externo (qrcode-monkey.com) para gerar QR
5. Imprime e cola QR físico no prédio

---

## 🎯 Funcionalidades Propostas

### 1. **Gestão de Equipes** (ALTA PRIORIDADE)

#### Para Administradoras:
- ✅ Criar/Editar/Desativar equipes
- ✅ Convidar membros para equipes via email
- ✅ Atribuir permissões por projeto (obra/prédio)
- ✅ Dashboard com performance de cada equipe
- ✅ Histórico de ações por equipe
- ✅ Relatórios de trabalho por equipe

#### Para Equipes:
- ✅ Ver apenas seus projetos atribuídos
- ✅ Criar/editar pontos apenas em projetos autorizados
- ✅ Realizar testes e inspeções
- ✅ Gerar relatórios com branding da equipe
- ✅ Timeline de atividades da equipe

#### Interface Sugerida:
```
/app/teams              → Lista de equipes (admin)
/app/teams/[id]         → Detalhes da equipe
/app/teams/[id]/members → Membros da equipe
/app/teams/permissions  → Gestão de permissões por projeto
```

---

### 2. **Visualização Pública por Projeto** (ALTA PRIORIDADE)

#### Funcionalidades:
- ✅ URL única por projeto (prédio): `anchorview.app/public/project/[token]`
- ✅ **Sem autenticação** - Acesso público total
- ✅ Página pública mostra:
  - **Lista de TODOS os pontos do prédio**
    - Número do ponto
    - Localização (ex: "Cobertura - Fachada Norte")
    - Status visual (🟢 Aprovado / 🔴 Reprovado / 🟡 Vencido)
    - Data da última inspeção
    - Próxima inspeção obrigatória
  - **Ao clicar em um ponto**:
    - Histórico completo de testes
    - Fotos dos testes (se permitido)
    - Dados técnicos (carga, tempo, normas aplicadas)
    - Informações do técnico responsável
    - Certificações e seguros válidos
  - **Cabeçalho da página**:
    - Nome do prédio/obra
    - Endereço
    - Logo da administradora
    - Mensagem customizada
  - **Filtros**:
    - Ver apenas aprovados/reprovados/vencidos
    - Buscar por número do ponto
    - Ordenar por data de inspeção
- ✅ Botão "Reportar Problema" (anônimo, envia email para admin)
- ✅ Analytics: contagem de visualizações

#### Como o cliente usa:
1. **Admin da administradora**:
   - Vai em "Configurações do Projeto"
   - Ativa "Visualização Pública"
   - Copia a URL gerada
2. **Gera QR Code** (externamente):
   - Acessa site como qrcode-monkey.com ou qr-code-generator.com
   - Cola a URL
   - Personaliza o QR (logo, cores)
   - Baixa em alta resolução
3. **Imprime etiqueta**:
   - QR Code grande
   - Texto: "Escaneie para ver histórico de inspeções"
   - Logo AnchorView + logo da administradora
4. **Cola no prédio** (entrada, hall, quadro de avisos)

#### Interface no sistema:
```
/app/projects/[id]/public-settings  → Configurar visibilidade pública
/public/project/[token]             → Página pública (sem auth)
```

#### Benefícios:
- ✅ **Transparência total** para moradores/inquilinos
- ✅ **Compliance** com normas de segurança
- ✅ **Marketing** para administradora (mostra profissionalismo)
- ✅ **Prova de diligência** em caso de auditoria/fiscalização

---

### 3. **Sistema de Notificações Inteligentes** (MÉDIA PRIORIDADE)

```typescript
// Notificações automáticas
- 📧 Email quando inspeção está vencendo (30, 15, 7 dias)
- 📧 Email quando ponto é reprovado
- 📧 Email semanal com resumo de atividades
- 📱 Push notification para equipes em campo
- 📱 Alerta quando novo projeto é atribuído
- 📱 Notificação de QR code escaneado (opcional)
```

---

### 4. **Dashboard Analítico Avançado** (MÉDIA PRIORIDADE)

#### Para Administradoras:
```
📊 Visão Geral
  - Total de prédios/obras
  - Total de pontos de ancoragem
  - % Pontos aprovados/reprovados/vencidos
  - Equipes ativas
  - Custos por equipe (se integrado)

📈 Performance por Equipe
  - Pontos testados por equipe/mês
  - Taxa de aprovação
  - Tempo médio de resposta
  - Projetos atribuídos vs concluídos

🗓️ Calendário de Manutenção
  - Inspeções agendadas
  - Inspeções vencidas (com alertas)
  - Timeline de próximas ações

💰 Financeiro (futuro)
  - Custo por inspeção
  - Custo por equipe
  - Relatórios de faturamento
```

---

### 5. **Sistema de Assinaturas Digitais** (ALTA PRIORIDADE)

```typescript
model DigitalSignature {
  id            String   @id @default(cuid())
  testId        String   // Referência ao AnchorTest

  // Assinatura do técnico
  technicianSignature  String   // base64 da assinatura
  technicianName       String
  technicianCrea       String
  signedAt             DateTime

  // Assinatura do responsável da obra (opcional)
  supervisorSignature  String?
  supervisorName       String?
  supervisorDocument   String?
  supervisorSignedAt   DateTime?

  // Validação
  ipAddress     String
  deviceId      String
  gpsLocation   Json?    // Lat/Long no momento da assinatura

  // Hash para garantir integridade
  documentHash  String   // SHA-256 do relatório

  @@map("digital_signatures")
}
```

**Uso**: Relatórios PDF incluem assinaturas digitais válidas, aumentando valor legal.

---

### 6. **Marketplace de Templates de Relatórios** (BAIXA PRIORIDADE)

Permitir que administradoras/equipes criem e compartilhem templates customizados:
- Templates por tipo de obra (residencial, comercial, industrial)
- Templates específicos de normas (NR-35, ABNT, etc)
- Branding personalizado por cliente

---

### 7. **Integração com Outros Sistemas** (MÉDIA-BAIXA PRIORIDADE)

#### APIs Externas:
- 🔗 **Google Calendar** - Sync de inspeções agendadas
- 🔗 **WhatsApp Business** - Notificações via WhatsApp
- 🔗 **Zapier** - Automações diversas
- 🔗 **ERP/Financeiro** - Faturamento automático

#### Webhooks:
```typescript
- Webhook quando ponto é reprovado
- Webhook quando inspeção é concluída
- Webhook quando QR code é escaneado X vezes
```

---

### 8. **Gamificação e Rankings** (BAIXA PRIORIDADE)

Para aumentar engajamento das equipes:
- 🏆 Ranking de equipes mais produtivas
- 🏆 Badges por conquistas (100 pontos testados, 0 reprovações, etc)
- 🏆 Certificados de excelência automáticos
- 📊 Comparativo de performance entre equipes

---

### 9. **App Mobile Nativo** (ALTA PRIORIDADE - FUTURO)

Além do PWA, um app nativo ofereceria:
- ✅ Melhor performance de câmera
- ✅ Captura de fotos em alta resolução offline
- ✅ GPS mais preciso
- ✅ Modo offline completo
- ✅ Notificações push nativas
- ✅ Integração com NFC tags (alternativa ao QR)

---

### 10. **Checklist de Segurança Integrado** (MÉDIA PRIORIDADE)

```typescript
model SafetyChecklist {
  id          String   @id @default(cuid())
  projectId   String
  teamId      String
  date        DateTime

  // Checklist NR-35
  items       Json     // Array de itens do checklist
  photos      String[] // Evidências fotográficas

  // Assinatura dos envolvidos
  technicianSignature  String
  supervisorSignature  String?

  // Status
  allItemsOk   Boolean
  observations String?

  @@map("safety_checklists")
}
```

**Uso**: Antes de iniciar trabalho em altura, equipe preenche checklist obrigatório (APR - Análise Preliminar de Risco).

---

### 11. **Rastreabilidade de Equipamentos** (MÉDIA PRIORIDADE)

Cadastrar e rastrear equipamentos usados:
- Cordas (data de fabricação, vida útil)
- Mosquetões
- Dinamômetros (calibração)
- EPIs (validade)

Alertas quando equipamento está próximo do vencimento.

---

### 12. **Exportação para Blockchain** (BAIXA PRIORIDADE - DIFERENCIAL)

Para máxima confiabilidade e imutabilidade:
- Gerar hash de cada relatório
- Registrar hash em blockchain pública (Ethereum, Polygon)
- Permite prova de que relatório não foi adulterado
- Marketing: "Relatórios certificados por blockchain"

---

## 🚀 Roadmap Sugerido

### Fase 1 - MVP Melhorado (2-3 semanas)
1. ✅ Implementar modelo de Teams
2. ✅ Sistema de permissões por projeto
3. ✅ QR Code e visualização pública
4. ✅ Dashboard básico para administradoras

### Fase 2 - Profissionalização (3-4 semanas)
1. ✅ Assinatura digital em relatórios
2. ✅ Notificações por email automáticas
3. ✅ Calendário de manutenção
4. ✅ Analytics de equipes

### Fase 3 - Crescimento (1-2 meses)
1. ✅ App mobile nativo
2. ✅ Checklist de segurança
3. ✅ Rastreabilidade de equipamentos
4. ✅ Integrações (WhatsApp, Calendar)

### Fase 4 - Enterprise (2-3 meses)
1. ✅ Marketplace de templates
2. ✅ Webhooks e API pública
3. ✅ Blockchain (opcional)
4. ✅ White-label para grandes clientes

---

## 💡 Ideias Extras de Monetização

### Planos Sugeridos:

**Básico** - R$ 297/mês
- 1 administradora
- 5 prédios
- 2 equipes
- 200 pontos
- QR Code público

**Profissional** - R$ 597/mês ⭐ **MAIS POPULAR**
- 1 administradora
- 20 prédios
- 5 equipes
- 1000 pontos
- QR Code + Analytics
- Assinaturas digitais
- Notificações automáticas

**Enterprise** - R$ 1.497/mês
- 1 administradora
- Prédios ilimitados
- Equipes ilimitadas
- Pontos ilimitados
- Tudo do Pro +
- White-label
- API dedicada
- Suporte prioritário

**Add-ons**:
- 📱 App Mobile: +R$ 197/mês
- 🔗 Integrações avançadas: +R$ 97/mês
- 📊 Relatórios personalizados: +R$ 147/mês

---

## 🎨 Melhorias de UX/UI

1. **Onboarding interativo** para novos clientes
2. **Tour guiado** para cada perfil (admin, equipe, técnico)
3. **Dark mode** para trabalho noturno
4. **Atalhos de teclado** para power users
5. **Busca global** inteligente (Cmd+K)
6. **Drag & drop** para reorganizar pontos no mapa
7. **Filtros salvos** personalizados
8. **Views customizadas** por usuário

---

## 📊 Métricas de Sucesso

Para validar o produto:
- **Retention**: % clientes ativos após 3/6/12 meses
- **Activation**: Tempo para primeira inspeção completa
- **Engagement**: Inspeções por mês / QR scans por ponto
- **NPS**: Satisfação de administradoras e equipes
- **Churn**: Taxa de cancelamento (meta: <5%)

---

## 🔒 Segurança e Compliance

- ✅ LGPD: Consentimento para dados pessoais
- ✅ Logs de auditoria completos
- ✅ Backup automático diário
- ✅ Criptografia em repouso e trânsito
- ✅ 2FA para admins
- ✅ Sessões com timeout
- ✅ Rate limiting em APIs públicas

---

## 📝 Próximos Passos Imediatos

1. **Validar proposta** com 2-3 administradoras reais
2. **Priorizar features** baseado em feedback
3. **Prototipar** tela de gestão de equipes
4. **Implementar** sistema de QR Code (quick win)
5. **Testar** com uma equipe de alpinismo real

---

**Documento criado em**: 2025-10-20
**Versão**: 1.0
**Autor**: Claude Code (Anthropic)
