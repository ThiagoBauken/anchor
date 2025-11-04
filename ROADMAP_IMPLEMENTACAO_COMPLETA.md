# 🗺️ Roadmap de Implementação Completa - AnchorView B2B2C

## 📋 Escopo do Projeto

### Features a Implementar:

1. ✅ **Sistema de Equipes (Teams)** - ALTA PRIORIDADE
2. ✅ **Visualização Pública** - ALTA PRIORIDADE
3. ✅ **Storage na Galeria (Capacitor)** - ALTA PRIORIDADE
4. ✅ **Notificações Inteligentes (Email)** - MÉDIA PRIORIDADE

---

## 📅 Timeline Estimado

```
Semana 1-2: Database + Backend (Teams + Público)
Semana 2-3: Capacitor + Galeria + Câmera
Semana 3-4: UI/UX (Teams + Visualização Pública)
Semana 4-5: Notificações + Polish + Testes
```

**Total: 4-5 semanas**

---

## 🎯 Fase 1: Database Schema (Dias 1-3)

### ✅ Tarefas:

#### 1.1 - Schema Prisma para Teams
```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  companyId   String
  cnpj        String?
  email       String?
  phone       String?
  logo        String?
  certifications String[]
  insurancePolicy String?
  insuranceExpiry DateTime?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  company     Company  @relation(fields: [companyId], references: [id])
  members     TeamMember[]
  projectPermissions ProjectTeamPermission[]
}

model TeamMember {
  id        String @id @default(cuid())
  teamId    String
  userId    String
  role      String // "owner", "manager", "technician", "viewer"
  active    Boolean @default(true)

  team      Team   @relation(fields: [teamId], references: [id])
  user      User   @relation(fields: [userId], references: [id])
}

model ProjectTeamPermission {
  id          String   @id @default(cuid())
  projectId   String
  teamId      String
  canView          Boolean @default(true)
  canCreatePoints  Boolean @default(true)
  canEditPoints    Boolean @default(true)
  canDeletePoints  Boolean @default(false)
  canTestPoints    Boolean @default(true)
  canExportReports Boolean @default(true)
  grantedBy   String
  grantedAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id])
  team        Team     @relation(fields: [teamId], references: [id])
}
```

#### 1.2 - Schema Prisma para Visualização Pública
```prisma
model ProjectPublicSettings {
  id              String   @id @default(cuid())
  projectId       String   @unique
  isPublic        Boolean  @default(false)
  publicToken     String   @unique @default(cuid())

  showTestHistory      Boolean @default(true)
  showPhotos           Boolean @default(true)
  showTechnicalData    Boolean @default(true)
  showCompanyInfo      Boolean @default(true)
  welcomeMessage       String?
  allowReportProblem   Boolean @default(true)
  reportEmail          String?

  totalViews           Int     @default(0)
  lastViewedAt         DateTime?
  createdAt            DateTime @default(now())

  project              Project @relation(fields: [projectId], references: [id])
}

model PublicProblemReport {
  id          String   @id @default(cuid())
  projectId   String
  pointId     String?
  description String
  reporterName String?
  reporterEmail String?
  status      String   @default("pending")
  createdAt   DateTime @default(now())
}
```

#### 1.3 - Schema para Notificações
```prisma
model NotificationSettings {
  id                    String  @id @default(cuid())
  companyId             String  @unique

  emailNotifications    Boolean @default(true)
  inspectionReminders   Boolean @default(true)
  reminderDays          Int[]   @default([30, 15, 7])
  failedTestAlerts      Boolean @default(true)
  weeklyDigest          Boolean @default(true)
  digestDay             Int     @default(1) // Monday

  company               Company @relation(fields: [companyId], references: [id])
}

model NotificationLog {
  id          String   @id @default(cuid())
  type        String   // "inspection_reminder", "test_failed", "digest"
  recipient   String   // email
  subject     String
  sentAt      DateTime @default(now())
  status      String   // "sent", "failed"
}
```

#### 1.4 - Rodar Migrations
```bash
npx prisma migrate dev --name add_teams_public_notifications
npx prisma generate
```

**Arquivos a criar**:
- [ ] `prisma/schema.prisma` (atualizar)
- [ ] Rodar migration

**Tempo estimado**: 1 dia

---

## 🎯 Fase 2: Server Actions (Dias 4-6)

### ✅ Tarefas:

#### 2.1 - Team Actions
```typescript
// src/app/actions/team-actions.ts

export async function getTeamsForCompany(companyId: string)
export async function createTeam(data: TeamCreateInput)
export async function updateTeam(teamId: string, data: TeamUpdateInput)
export async function deleteTeam(teamId: string)
export async function addTeamMember(teamId: string, userId: string, role: string)
export async function removeTeamMember(memberId: string)
export async function grantTeamProjectPermission(...)
export async function revokeTeamProjectPermission(permissionId: string)
export async function getUserTeams(userId: string)
```

#### 2.2 - Public Actions
```typescript
// src/app/actions/public-actions.ts

export async function getPublicProjectData(token: string)
export async function incrementPublicViewCount(token: string)
export async function submitPublicProblemReport(data: ProblemReportInput)
export async function getProjectPublicSettings(projectId: string)
export async function updateProjectPublicSettings(projectId: string, updates: any)
```

#### 2.3 - Notification Actions
```typescript
// src/app/actions/notification-actions.ts

export async function sendInspectionReminder(pointId: string)
export async function sendTestFailedAlert(testId: string)
export async function sendWeeklyDigest(companyId: string)
export async function getNotificationSettings(companyId: string)
export async function updateNotificationSettings(companyId: string, settings: any)
```

**Arquivos a criar**:
- [ ] `src/app/actions/team-actions.ts`
- [ ] `src/app/actions/public-actions.ts`
- [ ] `src/app/actions/notification-actions.ts`
- [ ] `src/types/index.ts` (adicionar novos tipos)

**Tempo estimado**: 2 dias

---

## 🎯 Fase 3: Capacitor Setup (Dias 7-9)

### ✅ Tarefas:

#### 3.1 - Instalar Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init AnchorView com.anchorview.app
npm install @capacitor/camera @capacitor/filesystem
npx cap add android
npx cap add ios
```

#### 3.2 - Configurar Capacitor
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anchorview.app',
  appName: 'AnchorView',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      quality: 100,
      allowEditing: false,
      saveToGallery: true
    }
  }
};

export default config;
```

#### 3.3 - Implementar Captura de Fotos
```typescript
// src/lib/capacitor-photo.ts

import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export async function capturePhotoToGallery(metadata: PhotoMetadata) {
  const photo = await Camera.getPhoto({
    quality: 100,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    saveToGallery: true
  });

  const fileName = generateStructuredFileName(metadata);

  // Copiar para diretório AnchorView
  await Filesystem.copy({
    from: photo.path!,
    to: `AnchorView/${fileName}`,
    directory: Directory.Documents
  });

  return { fileName, path: photo.path };
}

export async function readPhotoFromGallery(fileName: string) {
  const result = await Filesystem.readFile({
    path: `AnchorView/${fileName}`,
    directory: Directory.Documents
  });

  return base64ToBlob(result.data);
}

export async function uploadPhotoToServer(fileName: string, metadata: any) {
  const blob = await readPhotoFromGallery(fileName);

  const formData = new FormData();
  formData.append('photo', blob, fileName);
  formData.append('metadata', JSON.stringify(metadata));

  return fetch('/api/photos/upload', {
    method: 'POST',
    body: formData
  });
}
```

#### 3.4 - Build Scripts
```json
// package.json
{
  "scripts": {
    "build:mobile": "next build && npx cap sync",
    "ios": "npx cap open ios",
    "android": "npx cap open android"
  }
}
```

**Arquivos a criar**:
- [ ] `capacitor.config.ts`
- [ ] `src/lib/capacitor-photo.ts`
- [ ] `src/lib/capacitor-utils.ts`
- [ ] Atualizar `package.json`

**Tempo estimado**: 2 dias

---

## 🎯 Fase 4: UI Components - Teams (Dias 10-14)

### ✅ Tarefas:

#### 4.1 - Teams Tab
```typescript
// src/components/teams-tab.tsx
- Lista de equipes
- Botão criar equipe
- Card de cada equipe (nome, membros, projetos)
```

#### 4.2 - Team Details
```typescript
// src/components/team-details-dialog.tsx
- Informações da equipe
- Lista de membros
- Botão adicionar/remover membros
- Certificações e seguros
```

#### 4.3 - Team Permissions Manager
```typescript
// src/components/team-permissions-manager.tsx
- Lista de projetos
- Toggle de permissões por projeto
- Checkboxes: view, create, edit, delete, test, export
- Expiração de permissões (opcional)
```

#### 4.4 - Integrar no App
```typescript
// src/components/anchor-view.tsx
Adicionar tab "Equipes"
```

**Arquivos a criar**:
- [ ] `src/components/teams-tab.tsx`
- [ ] `src/components/team-details-dialog.tsx`
- [ ] `src/components/team-form-dialog.tsx`
- [ ] `src/components/team-permissions-manager.tsx`
- [ ] `src/components/team-member-list.tsx`

**Tempo estimado**: 3 dias

---

## 🎯 Fase 5: UI Components - Visualização Pública (Dias 15-17)

### ✅ Tarefas:

#### 5.1 - Página Pública
```typescript
// src/app/public/project/[token]/page.tsx
- Layout limpo (sem autenticação)
- Cabeçalho com nome do projeto
- Lista de pontos com status
- Filtros (Aprovado/Reprovado/Vencido)
- Click em ponto = modal com histórico
```

#### 5.2 - Configurações Públicas
```typescript
// src/components/project-public-settings.tsx
- Toggle "Ativar visualização pública"
- URL gerada automaticamente
- Botão copiar URL
- Configurações de visibilidade
- Mensagem de boas-vindas customizada
```

#### 5.3 - Problem Report Dialog
```typescript
// src/components/public-problem-report-dialog.tsx
- Formulário anônimo
- Campos: descrição, nome (opcional), email (opcional)
- Envio via action
```

**Arquivos a criar**:
- [ ] `src/app/public/project/[token]/page.tsx`
- [ ] `src/components/public-project-view.tsx`
- [ ] `src/components/public-point-details.tsx`
- [ ] `src/components/project-public-settings.tsx`
- [ ] `src/components/public-problem-report-dialog.tsx`

**Tempo estimado**: 2 dias

---

## 🎯 Fase 6: Sistema de Notificações (Dias 18-20)

### ✅ Tarefas:

#### 6.1 - Email Service
```typescript
// src/lib/email-service.ts

import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html
  });
}
```

#### 6.2 - Email Templates
```typescript
// src/lib/email-templates.ts

export function inspectionReminderTemplate(point: AnchorPoint, daysRemaining: number) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>⚠️ Inspeção Vencendo em ${daysRemaining} dias</h2>
        <p>O ponto <strong>${point.numeroPonto}</strong> precisa de inspeção.</p>
        <p>Localização: ${point.localizacao}</p>
        <p>Próxima inspeção: ${point.nextInspectionDate}</p>
        <a href="${process.env.APP_URL}/app">Acessar AnchorView</a>
      </body>
    </html>
  `;
}

export function testFailedTemplate(test: AnchorTest, point: AnchorPoint) {
  return `...`;
}

export function weeklyDigestTemplate(company: Company, stats: any) {
  return `...`;
}
```

#### 6.3 - Cron Jobs
```typescript
// src/app/api/cron/check-inspections/route.ts

export async function GET(request: Request) {
  // Verificar autenticação (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Buscar pontos com inspeção vencendo
  const points = await getPointsNeedingInspection([30, 15, 7]);

  for (const point of points) {
    await sendInspectionReminder(point.id);
  }

  return Response.json({ processed: points.length });
}
```

#### 6.4 - Configurar Vercel Cron
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/check-inspections",
    "schedule": "0 9 * * *"
  }, {
    "path": "/api/cron/weekly-digest",
    "schedule": "0 9 * * 1"
  }]
}
```

**Arquivos a criar**:
- [ ] `src/lib/email-service.ts`
- [ ] `src/lib/email-templates.ts`
- [ ] `src/app/api/cron/check-inspections/route.ts`
- [ ] `src/app/api/cron/weekly-digest/route.ts`
- [ ] `vercel.json`
- [ ] Adicionar variáveis de ambiente SMTP

**Tempo estimado**: 2 dias

---

## 🎯 Fase 7: Integração Galeria + Captura (Dias 21-23)

### ✅ Tarefas:

#### 7.1 - Atualizar Componente de Captura
```typescript
// src/components/camera-capture-capacitor.tsx

import { capturePhotoToGallery } from '@/lib/capacitor-photo';

export function CameraCaptureCapacitor({ point, project, type }) {
  const handleCapture = async () => {
    // Capturar e salvar na galeria
    const result = await capturePhotoToGallery({
      projectName: project.name,
      pontoNumero: point.numeroPonto,
      type: type,
      timestamp: new Date()
    });

    // Salvar metadados no IndexedDB
    await indexedDB.savePhotoMetadata({
      id: generateId(),
      pontoId: point.id,
      projectId: project.id,
      fileName: result.fileName,
      storedInGallery: true,
      uploaded: false
    });

    toast.success(`Foto salva: ${result.fileName}`);
  };

  return (
    <Button onClick={handleCapture}>
      📷 Tirar Foto
    </Button>
  );
}
```

#### 7.2 - Sincronização
```typescript
// src/components/sync-photos-dialog.tsx

export function SyncPhotosDialog() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    setSyncing(true);

    const pending = await indexedDB.getPhotos({ uploaded: false });

    for (let i = 0; i < pending.length; i++) {
      const photo = pending[i];

      try {
        await uploadPhotoToServer(photo.fileName, {
          pontoId: photo.pontoId,
          projectId: photo.projectId
        });

        await indexedDB.updatePhoto(photo.id, {
          uploaded: true,
          uploadedAt: new Date().toISOString()
        });

        setProgress((i + 1) / pending.length * 100);
      } catch (error) {
        console.error(`Erro ao enviar ${photo.fileName}:`, error);
      }
    }

    setSyncing(false);
    toast.success('Sincronização completa!');
  };

  return (
    <Dialog>
      {/* UI */}
    </Dialog>
  );
}
```

**Arquivos a criar**:
- [ ] `src/components/camera-capture-capacitor.tsx`
- [ ] `src/components/sync-photos-dialog.tsx`
- [ ] `src/components/gallery-settings.tsx`
- [ ] Atualizar `src/components/point-form.tsx`

**Tempo estimado**: 2 dias

---

## 🎯 Fase 8: Polish & Testing (Dias 24-28)

### ✅ Tarefas:

#### 8.1 - UI/UX Polish
- [ ] Revisar todos os componentes
- [ ] Adicionar loading states
- [ ] Adicionar error states
- [ ] Melhorar feedback visual
- [ ] Responsividade mobile

#### 8.2 - Testes
- [ ] Testar fluxo de Teams completo
- [ ] Testar visualização pública
- [ ] Testar captura e sincronização de fotos
- [ ] Testar notificações (mandar teste)
- [ ] Testar em iOS e Android

#### 8.3 - Documentação
- [ ] Atualizar README.md
- [ ] Documentar novas env variables
- [ ] Guia de deploy
- [ ] Changelog

#### 8.4 - Deploy
- [ ] Build e teste local
- [ ] Deploy staging
- [ ] Testes em staging
- [ ] Deploy produção

**Tempo estimado**: 3-4 dias

---

## 📦 Variáveis de Ambiente Necessárias

```env
# Existing
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="..."

# SMTP (Notificações)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
SMTP_FROM="AnchorView <noreply@anchorview.com>"

# Cron
CRON_SECRET="seu-secret-aleatorio"

# App
APP_URL="https://anchorview.com"
```

---

## 📊 Checklist Final

### Backend
- [ ] Schema Prisma atualizado
- [ ] Migrations rodadas
- [ ] Server actions criadas
- [ ] API routes criadas
- [ ] Cron jobs configurados

### Frontend
- [ ] Componentes de Teams
- [ ] Página pública
- [ ] Integração Capacitor
- [ ] Sistema de notificações

### Mobile
- [ ] Capacitor instalado
- [ ] Android configurado
- [ ] iOS configurado
- [ ] Build testado

### Testes
- [ ] Fluxo de Teams testado
- [ ] Visualização pública testada
- [ ] Fotos na galeria testadas
- [ ] Notificações testadas
- [ ] Build mobile testado

### Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy staging
- [ ] Testes em staging
- [ ] Deploy produção

---

## 🚀 Próximos Passos Imediatos

1. ✅ Revisar e aprovar roadmap
2. ✅ Começar Fase 1: Database Schema
3. ✅ Implementar server actions
4. ✅ Adicionar Capacitor
5. ✅ Criar UIs

**Tempo total estimado**: 4-5 semanas
**Custo estimado**: R$ 25.000 - R$ 35.000

---

**Documento criado em**: 2025-10-20
**Versão**: 1.0
**Status**: Pronto para iniciar
