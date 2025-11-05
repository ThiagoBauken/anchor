# PLANO DE CORREÇÃO E IMPLEMENTAÇÃO COMPLETO - AnchorView

**Data de Criação:** 2025-11-05
**Versão:** 1.0
**Tempo Estimado Total:** 4-5 semanas

---

## 📋 ÍNDICE

1. [Fase 1: Correções Críticas de Segurança (Semana 1)](#fase-1)
2. [Fase 2: Correções de Dados e Arquitetura (Semana 2)](#fase-2)
3. [Fase 3: Correções das Abas Específicas (Semana 3)](#fase-3)
4. [Fase 4: Melhorias e Otimizações (Semana 4)](#fase-4)
5. [Fase 5: Testes e Validação (Semana 5)](#fase-5)

---

## <a name="fase-1"></a>🔴 FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Semana 1)

**Prioridade:** CRÍTICA
**Tempo Estimado:** 5-7 dias
**Impacto:** ALTO - Sistema não pode ir para produção sem estas correções

### 1.1 Adicionar Autenticação aos Endpoints de Sync

**Arquivos Afetados:**
- `/src/app/api/sync/photos/route.ts`
- `/src/app/api/sync/anchor-data/route.ts`
- `/src/middleware/auth-middleware.ts` (criar)

**Implementação:**

```typescript
// src/middleware/auth-middleware.ts (CRIAR NOVO ARQUIVO)
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: 'Unauthorized',
      status: 401
    };
  }

  return {
    user: session.user,
    session
  };
}

export async function requireCompanyAccess(userId: string, companyId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user || user.companyId !== companyId) {
    return {
      error: 'Forbidden: Access to this company denied',
      status: 403
    };
  }

  return { allowed: true };
}
```

**Atualizar `/src/app/api/sync/photos/route.ts`:**

```typescript
import { requireAuth, requireCompanyAccess } from '@/middleware/auth-middleware';

export async function POST(request: NextRequest) {
  // 1. VERIFICAR AUTENTICAÇÃO
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { projectId, pontoId, photoData, type } = body;

    // 2. VERIFICAR PROPRIEDADE DO PROJETO
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 3. VERIFICAR ACESSO À EMPRESA
    const accessCheck = await requireCompanyAccess(user.id, project.companyId);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // 4. PROCESSAR FOTO (código existente...)
    // ... resto da implementação

  } catch (error) {
    console.error('[Sync Photos] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Atualizar `/src/app/api/sync/anchor-data/route.ts`:** (mesmo padrão)

---

### 1.2 Adicionar Validação de Permissões em Server Actions

**Arquivos Afetados:**
- `/src/app/actions/anchor-actions.ts`
- `/src/app/actions/project-actions.ts`
- `/src/app/actions/user-actions.ts`
- `/src/lib/auth-helpers.ts` (criar)

**Criar `/src/lib/auth-helpers.ts`:**

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { User } from '@/types';

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: true }
  });

  return user;
}

export async function requireAuthentication(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export async function requireCompanyMatch(userId: string, resourceCompanyId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user || user.companyId !== resourceCompanyId) {
    throw new Error('Access denied: Company mismatch');
  }
}
```

**Atualizar `/src/app/actions/anchor-actions.ts`:**

```typescript
'use server';

import { requireAuthentication, requireCompanyMatch } from '@/lib/auth-helpers';
import { canCreatePoints, canDeletePoints } from '@/lib/permissions';

export async function addAnchorPoint(data: AnchorPointData) {
  // 1. AUTENTICAR USUÁRIO
  const user = await requireAuthentication();

  // 2. VERIFICAR PERMISSÃO
  if (!canCreatePoints({ user, projectId: data.projectId })) {
    throw new Error('Permission denied: Cannot create anchor points');
  }

  // 3. VERIFICAR PROPRIEDADE DO PROJETO
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { companyId: true }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await requireCompanyMatch(user.id, project.companyId);

  // 4. CRIAR PONTO
  const anchorPoint = await prisma.anchorPoint.create({
    data: {
      ...data,
      createdById: user.id
    }
  });

  return anchorPoint;
}

export async function deleteAnchorPoint(pointId: string) {
  // 1. AUTENTICAR
  const user = await requireAuthentication();

  // 2. BUSCAR PONTO
  const point = await prisma.anchorPoint.findUnique({
    where: { id: pointId },
    include: { project: true }
  });

  if (!point) {
    throw new Error('Anchor point not found');
  }

  // 3. VERIFICAR PROPRIEDADE
  await requireCompanyMatch(user.id, point.project.companyId);

  // 4. VERIFICAR PERMISSÃO
  if (!canDeletePoints({ user })) {
    throw new Error('Permission denied: Cannot delete anchor points');
  }

  // 5. DELETAR
  await prisma.anchorPoint.delete({
    where: { id: pointId }
  });

  return { success: true };
}

// Aplicar o mesmo padrão para:
// - updateAnchorPoint
// - getAnchorPointsForProject
// - archiveAnchorPoint
```

**Atualizar `/src/app/actions/project-actions.ts`:**

```typescript
'use server';

import { requireAuthentication, requireCompanyMatch } from '@/lib/auth-helpers';
import { canCreateProjects } from '@/lib/permissions';

export async function addProject(data: ProjectData) {
  const user = await requireAuthentication();

  // Verificar permissão
  if (!canCreateProjects({ user })) {
    throw new Error('Permission denied: Cannot create projects');
  }

  // Verificar que o projeto está sendo criado na empresa do usuário
  if (data.companyId !== user.companyId) {
    throw new Error('Permission denied: Cannot create projects for other companies');
  }

  const project = await prisma.project.create({
    data: {
      ...data,
      createdById: user.id
    }
  });

  return project;
}

export async function deleteProject(projectId: string) {
  const user = await requireAuthentication();

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await requireCompanyMatch(user.id, project.companyId);

  // Apenas superadmin e company_admin podem deletar projetos
  if (user.role !== 'superadmin' && user.role !== 'company_admin') {
    throw new Error('Permission denied: Cannot delete projects');
  }

  await prisma.project.delete({
    where: { id: projectId }
  });

  return { success: true };
}

// Aplicar o mesmo padrão para todas as outras funções
```

**Atualizar `/src/app/actions/user-actions.ts`:**

```typescript
'use server';

import { requireAuthentication, requireCompanyMatch } from '@/lib/auth-helpers';
import { canInviteUsers } from '@/lib/permissions';

export async function addUser(data: UserData) {
  const currentUser = await requireAuthentication();

  // Verificar permissão para convidar usuários
  if (!canInviteUsers({ user: currentUser, roleToInvite: data.role })) {
    throw new Error('Permission denied: Cannot invite users with this role');
  }

  // Usuários só podem criar usuários na própria empresa
  if (data.companyId !== currentUser.companyId && currentUser.role !== 'superadmin') {
    throw new Error('Permission denied: Cannot create users for other companies');
  }

  const user = await prisma.user.create({
    data: {
      ...data,
      createdById: currentUser.id
    }
  });

  return user;
}

// Aplicar o mesmo padrão para deleteUser, updateUser, etc.
```

---

### 1.3 Adicionar Rate Limiting aos Endpoints de Sync

**Arquivo:** `/src/app/api/sync/photos/route.ts` e `/src/app/api/sync/anchor-data/route.ts`

```typescript
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/middleware/rate-limit';

export const POST = withRateLimit(
  async function handler(request: NextRequest) {
    // ... código existente com autenticação
  },
  RATE_LIMIT_PRESETS.MODERATE // 30 req/min
);
```

---

### 1.4 Checklist Fase 1

```
[ ] 1.1.1 Criar auth-middleware.ts com requireAuth e requireCompanyAccess
[ ] 1.1.2 Atualizar /api/sync/photos com autenticação
[ ] 1.1.3 Atualizar /api/sync/anchor-data com autenticação
[ ] 1.1.4 Testar sync com usuário autenticado
[ ] 1.1.5 Testar sync sem autenticação (deve falhar)

[ ] 1.2.1 Criar auth-helpers.ts com funções auxiliares
[ ] 1.2.2 Atualizar anchor-actions.ts (5 funções)
[ ] 1.2.3 Atualizar project-actions.ts (6 funções)
[ ] 1.2.4 Atualizar user-actions.ts (5 funções)
[ ] 1.2.5 Testar criação/edição/deleção com diferentes roles
[ ] 1.2.6 Verificar error handling e mensagens

[ ] 1.3.1 Adicionar rate limiting em /api/sync/photos
[ ] 1.3.2 Adicionar rate limiting em /api/sync/anchor-data
[ ] 1.3.3 Testar limites de requisições

[ ] 1.4.1 Code review completo de segurança
[ ] 1.4.2 Teste de penetração básico
[ ] 1.4.3 Documentar mudanças de segurança
```

---

## <a name="fase-2"></a>🟠 FASE 2: CORREÇÕES DE DADOS E ARQUITETURA (Semana 2)

**Prioridade:** ALTA
**Tempo Estimado:** 5-7 dias

### 2.1 Corrigir Inconsistências Prisma/TypeScript

**Arquivo:** `/prisma/schema.prisma` e `/src/types/index.ts`

#### 2.1.1 Corrigir TeamMember Role

**Problema:** Role incompatível entre Prisma e TypeScript

**Prisma (ANTES):**
```prisma
model TeamMember {
  role    String  @default("technician")
}
```

**TypeScript (ANTES):**
```typescript
interface TeamMember {
  role: 'leader' | 'member' | 'observer';
}
```

**SOLUÇÃO - Atualizar Prisma:**
```prisma
enum TeamMemberRole {
  leader
  member
  observer
}

model TeamMember {
  id        String         @id @default(cuid())
  teamId    String         @map("team_id")
  userId    String         @map("user_id")
  role      TeamMemberRole @default(member)
  joinedAt  DateTime       @default(now()) @map("joined_at")

  team      Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}
```

**Atualizar TypeScript:**
```typescript
// src/types/index.ts
export type TeamMemberRole = 'leader' | 'member' | 'observer';

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  joinedAt: string;
  team?: Team;
  user?: User;
}
```

**Migração:**
```bash
npx prisma migrate dev --name fix_team_member_role
```

#### 2.1.2 Corrigir Nomes de Campos

**FacadeInspection:**
```prisma
model FacadeInspection {
  // ANTES: createdById
  // DEPOIS:
  createdByUserId String   @map("created_by_user_id")
  createdBy       User     @relation(fields: [createdByUserId], references: [id])
}

model FacadeSide {
  // ANTES: facadeInspectionId
  // DEPOIS:
  inspectionId    String          @map("inspection_id")
  inspection      FacadeInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
}
```

**Atualizar TypeScript correspondente:**
```typescript
export interface FacadeInspection {
  id: string;
  projectId: string;
  name: string;
  buildingName: string;
  address: string;
  inspectionDate: string;
  status: InspectionStatus;
  createdByUserId: string;  // ← Corrigido
  createdAt: string;
  updatedAt: string;
  // ... resto dos campos
}

export interface FacadeSide {
  id: string;
  inspectionId: string;  // ← Corrigido
  sideType: FacadeSideType;
  // ... resto dos campos
}
```

#### 2.1.3 Corrigir SubscriptionStatus Enum

**Problema:** Enums completamente diferentes

**SOLUÇÃO - Padronizar no Prisma:**
```prisma
enum SubscriptionStatus {
  active
  past_due
  canceled
  trialing
  paused
}
```

**Atualizar TypeScript:**
```typescript
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
```

**Migração:**
```bash
npx prisma migrate dev --name fix_subscription_status_enum
```

#### 2.1.4 Adicionar Campos Faltantes em AnchorPoint

**Atualizar schema.prisma:**
```prisma
model AnchorPoint {
  // Campos existentes...

  // NOVOS CAMPOS - PWA Sync
  photoUploadPending Boolean  @default(false) @map("photo_upload_pending")
  lastSyncedAt       DateTime? @map("last_synced_at")
  syncStatus         String?   @default("synced") @map("sync_status")

  // NOVOS CAMPOS - GPS
  gpsLatitude        Float?    @map("gps_latitude")
  gpsLongitude       Float?    @map("gps_longitude")
  gpsAccuracy        Float?    @map("gps_accuracy")
  gpsTimestamp       DateTime? @map("gps_timestamp")

  // NOVOS CAMPOS - Auditoria
  lastModifiedById   String?   @map("last_modified_by_id")
  lastModifiedAt     DateTime? @map("last_modified_at")
  archivedById       String?   @map("archived_by_id")
  archivedAt         DateTime? @map("archived_at")

  // NOVOS CAMPOS - Inspection Tracking
  nextInspectionDate DateTime? @map("next_inspection_date")
  inspectionInterval Int?      @default(180) @map("inspection_interval") // dias
  lastInspectionDate DateTime? @map("last_inspection_date")

  // Relações
  lastModifiedBy     User?     @relation("ModifiedAnchorPoints", fields: [lastModifiedById], references: [id])
  archivedBy         User?     @relation("ArchivedAnchorPoints", fields: [archivedById], references: [id])

  @@map("anchor_points")
}

// Atualizar User model para suportar novas relações
model User {
  // ... campos existentes

  modifiedAnchorPoints AnchorPoint[] @relation("ModifiedAnchorPoints")
  archivedAnchorPoints AnchorPoint[] @relation("ArchivedAnchorPoints")
}
```

**Atualizar TypeScript:**
```typescript
export interface AnchorPoint {
  // Campos existentes...

  // PWA Sync
  photoUploadPending?: boolean;
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'error';

  // GPS
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsTimestamp?: string;

  // Auditoria
  lastModifiedById?: string;
  lastModifiedAt?: string;
  archivedById?: string;
  archivedAt?: string;

  // Inspection Tracking
  nextInspectionDate?: string;
  inspectionInterval?: number;
  lastInspectionDate?: string;
}
```

**Migração:**
```bash
npx prisma migrate dev --name add_anchor_point_fields
```

#### 2.1.5 Adicionar Campos Faltantes em AnchorTest

```prisma
model AnchorTest {
  // Campos existentes...

  // NOVOS CAMPOS - Compliance
  regulatoryStandard    String?   @map("regulatory_standard") // ex: "ABNT NBR 15475"
  complianceStatus      String?   @default("compliant") @map("compliance_status")
  certificationNumber   String?   @map("certification_number")

  // NOVOS CAMPOS - Equipamento
  equipmentUsed         String?   @map("equipment_used")
  equipmentSerialNumber String?   @map("equipment_serial_number")
  equipmentCalibration  DateTime? @map("equipment_calibration")

  // NOVOS CAMPOS - Environmental
  weatherConditions     String?   @map("weather_conditions")
  temperature           Float?    @map("temperature")
  humidity              Float?    @map("humidity")

  // NOVOS CAMPOS - Technician Credentials
  technicianLicense     String?   @map("technician_license")
  technicianCertification String? @map("technician_certification")
  supervisorId          String?   @map("supervisor_id")

  // Relação
  supervisor            User?     @relation("SupervisedTests", fields: [supervisorId], references: [id])

  @@map("anchor_tests")
}

model User {
  // ... campos existentes
  supervisedTests AnchorTest[] @relation("SupervisedTests")
}
```

**TypeScript:**
```typescript
export interface AnchorTest {
  // Campos existentes...

  // Compliance
  regulatoryStandard?: string;
  complianceStatus?: 'compliant' | 'non_compliant' | 'pending_review';
  certificationNumber?: string;

  // Equipamento
  equipmentUsed?: string;
  equipmentSerialNumber?: string;
  equipmentCalibration?: string;

  // Environmental
  weatherConditions?: string;
  temperature?: number;
  humidity?: number;

  // Technician
  technicianLicense?: string;
  technicianCertification?: string;
  supervisorId?: string;
}
```

**Migração:**
```bash
npx prisma migrate dev --name add_anchor_test_fields
```

---

### 2.2 Consolidar Contextos de Autenticação

**Decisão:** Manter apenas `DatabaseAuthContext` e remover os outros.

#### 2.2.1 Deletar AuthContext (Código Morto)

```bash
rm /home/user/anchor/src/context/AuthContext.tsx
```

#### 2.2.2 Decidir sobre OfflineAuthContext

**Opção A:** Integrar funcionalidades offline no DatabaseAuthContext
**Opção B:** Deletar completamente e usar apenas DatabaseAuthContext

**RECOMENDAÇÃO: Opção A** - Mesclar funcionalidades

**Atualizar `/src/context/DatabaseAuthContext.tsx`:**

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface DatabaseAuthContextType {
  user: User | null;
  currentUser: User | null; // Alias para compatibilidade
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;

  // NOVOS: Funcionalidades offline
  isOnline: boolean;
  hasOfflineData: boolean;
  syncPending: boolean;
  triggerSync: () => Promise<void>;
}

export function DatabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncPending, setSyncPending] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check sync status
  useEffect(() => {
    const checkSyncStatus = async () => {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const { indexedDBStorage } = await import('@/lib/indexeddb-storage');
        const queue = await indexedDBStorage.getSyncQueue();
        setSyncPending(queue.length > 0);
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    if (!isOnline) return;

    // Trigger sync logic
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync-data');
    }
  };

  const value = {
    user,
    currentUser: user, // Alias
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    isOnline,
    hasOfflineData: syncPending,
    syncPending,
    triggerSync
  };

  return (
    <DatabaseAuthContext.Provider value={value}>
      {children}
    </DatabaseAuthContext.Provider>
  );
}

// Hook seguro que funciona mesmo sem provider
export function useDatabaseAuthSafe() {
  try {
    return useDatabaseAuth();
  } catch {
    return {
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      isOnline: true,
      hasOfflineData: false,
      syncPending: false,
      login: async () => {},
      logout: async () => {},
      updateUser: async () => {},
      triggerSync: async () => {}
    };
  }
}
```

#### 2.2.3 Substituir useOfflineAuthSafe por useDatabaseAuthSafe

**Arquivos a atualizar:**
- `/src/components/trial-banner.tsx`
- `/src/components/offline-status.tsx`
- `/src/components/locations-tab.tsx`
- `/src/components/facades-tab.tsx`
- `/src/components/map-tab.tsx`
- `/src/components/marketplace-tab.tsx`
- `/src/app/admin/page.tsx`
- E outros 10+ arquivos

**Exemplo de substituição:**

```typescript
// ANTES
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext';
const { currentUser } = useOfflineAuthSafe();

// DEPOIS
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext';
const { currentUser } = useDatabaseAuthSafe();
```

**Script de substituição em massa:**
```bash
# Buscar todos os arquivos que usam useOfflineAuthSafe
grep -r "useOfflineAuthSafe" src/ --files-with-matches

# Para cada arquivo, substituir a importação e uso
find src/ -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  's/useOfflineAuthSafe/useDatabaseAuthSafe/g'

find src/ -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  's/@\/context\/OfflineAuthContext/@\/context\/DatabaseAuthContext/g'
```

#### 2.2.4 Deletar OfflineAuthContext

```bash
rm /home/user/anchor/src/context/OfflineAuthContext.tsx
```

---

### 2.3 Consolidar IndexedDB

**Decisão:** Manter `/src/lib/indexeddb-storage.ts` e deletar `/src/lib/indexeddb.ts`

#### 2.3.1 Melhorar indexeddb-storage.ts

**Adicionar funcionalidades faltantes:**

```typescript
// /src/lib/indexeddb-storage.ts

// ... código existente ...

// ADICIONAR: Funções para metadata de fotos
export async function getAllPhotoMetadata(): Promise<PhotoMetadata[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhotoMetadata(photoId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.delete(photoId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ADICIONAR: Funções para entidades completas (companies, users, etc.)
export async function saveCompany(company: Company): Promise<void> {
  const db = await openDB();
  // ... implementação
}

export async function getCompanies(): Promise<Company[]> {
  const db = await openDB();
  // ... implementação
}

// ... adicionar outras entidades conforme necessário
```

#### 2.3.2 Atualizar Componentes que Usam indexeddb.ts

**Arquivos a atualizar:**
- `/src/components/offline-camera-capture.tsx`
- Outros componentes que importam de `/src/lib/indexeddb.ts`

```typescript
// ANTES
import { offlineDB } from '@/lib/indexeddb';

// DEPOIS
import { indexedDBStorage } from '@/lib/indexeddb-storage';
```

#### 2.3.3 Deletar indexeddb.ts

```bash
rm /home/user/anchor/src/lib/indexeddb.ts
```

---

### 2.4 Checklist Fase 2

```
[ ] 2.1.1 Criar enum TeamMemberRole no Prisma
[ ] 2.1.2 Corrigir FacadeInspection field names
[ ] 2.1.3 Padronizar SubscriptionStatus enum
[ ] 2.1.4 Adicionar campos PWA/GPS/Audit em AnchorPoint
[ ] 2.1.5 Adicionar campos compliance/equipment em AnchorTest
[ ] 2.1.6 Rodar todas as migrações
[ ] 2.1.7 Atualizar tipos TypeScript correspondentes
[ ] 2.1.8 Testar Prisma generate

[ ] 2.2.1 Deletar AuthContext.tsx
[ ] 2.2.2 Mesclar funcionalidades offline no DatabaseAuthContext
[ ] 2.2.3 Substituir useOfflineAuthSafe em todos os arquivos
[ ] 2.2.4 Deletar OfflineAuthContext.tsx
[ ] 2.2.5 Testar autenticação e funcionalidades offline

[ ] 2.3.1 Melhorar indexeddb-storage.ts com funções faltantes
[ ] 2.3.2 Atualizar componentes que usam indexeddb.ts
[ ] 2.3.3 Deletar indexeddb.ts
[ ] 2.3.4 Testar storage offline

[ ] 2.4.1 Code review de tipos e contextos
[ ] 2.4.2 Testes de integração
```

---

## <a name="fase-3"></a>🟡 FASE 3: CORREÇÕES DAS ABAS ESPECÍFICAS (Semana 3)

**Prioridade:** ALTA
**Tempo Estimado:** 5-7 dias

### 3.1 Corrigir MapTab (Planta Baixa)

#### 3.1.1 Adicionar Validação de Imagem

**Arquivo:** `/src/components/interactive-map.tsx`

```typescript
// Adicionar no início do componente
const [imageError, setImageError] = useState(false);
const [imageLoading, setImageLoading] = useState(false);

// Atualizar validação de floorPlanImage (linha ~136)
if (!floorPlanImage ||
    floorPlanImage.trim() === '' ||
    !floorPlanImage.startsWith('data:image')) {
  return (
    <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
      <div className="text-center">
        <p className="text-muted-foreground">Nenhuma planta baixa selecionada</p>
        {imageError && (
          <p className="text-destructive text-sm mt-2">
            Erro ao carregar imagem. Verifique se a planta baixa está corrompida.
          </p>
        )}
      </div>
    </div>
  );
}

// Atualizar handler de erro da imagem (linha ~115)
img.onerror = () => {
  console.error(`[InteractiveMap] Failed to load floor plan image`, {
    floorPlanName: currentFloorPlan?.name,
    imageLength: floorPlanImage?.length,
    imagePrefix: floorPlanImage?.substring(0, 50)
  });

  setImageError(true);
  setImageLoading(false);

  // Fallback dimensions
  const dims = { width: 1200, height: 900 };
  setMapDimensions(dims);
  setViewBox({ x: 0, y: 0, width: dims.width, height: dims.height });
};

img.onload = () => {
  console.log(`[InteractiveMap] Floor plan image loaded successfully`, {
    width: img.width,
    height: img.height
  });

  setImageLoading(false);
  setImageError(false);

  // ... resto do código existente
};
```

#### 3.1.2 Popuar anchorPoints Count Corretamente

**Arquivo:** `/src/context/OfflineDataContext.tsx` (linha 193)

```typescript
// ANTES
const convertedFloorPlans: FloorPlan[] = loadedFloorPlans.map(fp => ({
  id: fp.id,
  projectId: fp.projectId,
  name: fp.name,
  image: fp.image,
  order: fp.order,
  active: fp.active,
  createdAt: new Date(fp.createdAt).toISOString(),
  updatedAt: new Date(fp.updatedAt).toISOString(),
  anchorPoints: []  // ← ERRADO
}))

// DEPOIS
const convertedFloorPlans: FloorPlan[] = loadedFloorPlans.map(fp => ({
  id: fp.id,
  projectId: fp.projectId,
  name: fp.name,
  image: fp.image,
  order: fp.order,
  active: fp.active,
  createdAt: new Date(fp.createdAt).toISOString(),
  updatedAt: new Date(fp.updatedAt).toISOString(),
  anchorPoints: new Array((fp as any)._count?.anchorPoints || 0)
    .fill(null)
    .map((_, idx) => ({ id: `placeholder-${idx}` })) // Criar array com tamanho correto
}))
```

#### 3.1.3 Validar Base64 na Criação de Floor Plan

**Arquivo:** `/src/app/actions/floorplan-actions.ts`

```typescript
export async function createFloorPlan(
  projectId: string,
  name: string,
  image: string,
  order: number
) {
  // ADICIONAR VALIDAÇÃO
  if (!image || typeof image !== 'string') {
    throw new Error('Image data is required');
  }

  if (!image.startsWith('data:image/')) {
    throw new Error('Invalid image format. Must be a data URL');
  }

  // Verificar tamanho mínimo (100 bytes é muito pequeno para uma imagem real)
  if (image.length < 100) {
    throw new Error('Image data is too small. May be corrupted');
  }

  // Limite de 10MB para base64
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (image.length > maxSize) {
    throw new Error(`Image is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  try {
    const floorPlan = await prisma.floorPlan.create({
      data: {
        projectId,
        name,
        image,
        order,
        active: true
      }
    });

    return floorPlan;
  } catch (error) {
    console.error('[FloorPlan] Error creating floor plan:', error);
    throw new Error('Failed to create floor plan');
  }
}
```

#### 3.1.4 Adicionar Loading State para Floor Plans

**Arquivo:** `/src/context/OfflineDataContext.tsx`

```typescript
const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
const [floorPlansLoading, setFloorPlansLoading] = useState(false); // NOVO

useEffect(() => {
  const loadFloorPlans = async () => {
    if (!currentProject?.id) {
      setFloorPlans([]);
      return;
    }

    setFloorPlansLoading(true); // NOVO

    try {
      const { getFloorPlansForProject } = await import('@/app/actions/floorplan-actions');
      const loadedFloorPlans = await getFloorPlansForProject(currentProject.id);

      // ... conversão

      setFloorPlans(convertedFloorPlans);
    } catch (error) {
      console.error('[OfflineData] Error loading floor plans:', error);
      setFloorPlans([]);
    } finally {
      setFloorPlansLoading(false); // NOVO
    }
  };

  loadFloorPlans();
}, [currentProject?.id]);

// Adicionar ao value do context
const value = {
  // ... outros valores
  floorPlansLoading, // NOVO
};
```

**Atualizar MapTab para mostrar loading:**

```typescript
// /src/components/map-tab.tsx
const { floorPlans, floorPlansLoading } = useOfflineData();

// Na renderização
{floorPlansLoading ? (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2">Carregando plantas baixas...</span>
  </div>
) : (
  <FloorPlanSelector ... />
)}
```

#### 3.1.5 Mostrar Todas as Floor Plans no Selector

**Arquivo:** `/src/components/floor-plan-selector.tsx` (linha 43, 101)

```typescript
// ANTES
const activeFloorPlans = sortedFloorPlans.filter(fp => fp.active);

// ... depois
{activeFloorPlans.map((floorPlan) => (

// DEPOIS - Mostrar todas, indicar se inactive
const sortedFloorPlans = [...floorPlans].sort((a, b) => a.order - b.order);

// ... depois
{sortedFloorPlans.map((floorPlan) => (
  <SelectItem
    key={floorPlan.id}
    value={floorPlan.id}
    disabled={!floorPlan.active}
  >
    {floorPlan.name}
    {!floorPlan.active && ' (Inativa)'}
  </SelectItem>
))}
```

---

### 3.2 Corrigir FacadesTab

#### 3.2.1 Rodar Migração do Banco

```bash
npx prisma migrate dev --name add_facade_inspections
npx prisma generate
```

#### 3.2.2 Corrigir Parâmetro em createPathologyCategory

**Arquivo:** `/src/components/facade-inspection-manager.tsx` (linha 192)

```typescript
// ANTES
const category = await createPathologyCategory(
  companyId,  // ← ERRADO
  newCategoryName,
  newCategoryColor,
  newCategorySeverity,
  categories.length + 1
);

// DEPOIS
const category = await createPathologyCategory(
  projectId,  // ← CORRETO
  newCategoryName,
  newCategoryColor,
  newCategorySeverity,
  categories.length + 1
);
```

#### 3.2.3 Integrar FacadesTab na Aplicação

**Arquivo:** `/src/components/anchor-view.tsx` (ou onde as tabs são definidas)

```typescript
import { FacadesTab } from './facades-tab';

// Adicionar na lista de tabs (procurar por TabsContent)
<TabsContent value="facades" className="flex-1 overflow-hidden">
  <FacadesTab />
</TabsContent>

// Adicionar trigger na TabsList
<TabsList>
  {/* ... outros triggers ... */}
  <TabsTrigger value="facades">
    <Building className="h-4 w-4 mr-2" />
    Fachadas
  </TabsTrigger>
</TabsList>
```

#### 3.2.4 Adicionar Permissões para Facades

**Arquivo:** `/src/lib/permissions.ts`

```typescript
export function canManageFacadeInspections(params: { user: User | null }): boolean {
  const { user } = params;
  if (!user) return false;

  // Apenas superadmin, company_admin e team_admin podem gerenciar inspeções
  return ['superadmin', 'company_admin', 'team_admin'].includes(user.role);
}

export function canViewFacadeInspections(params: { user: User | null }): boolean {
  const { user } = params;
  if (!user) return false;

  // Todos os usuários autenticados podem visualizar
  return true;
}
```

**Usar em FacadesTab:**

```typescript
// /src/components/facades-tab.tsx
import { canManageFacadeInspections } from '@/lib/permissions';

const { currentUser } = useDatabaseAuthSafe();
const canEdit = canManageFacadeInspections({ user: currentUser });

return (
  <FacadeInspectionManager
    projectId={currentProject.id}
    companyId={currentUser.companyId || ''}
    currentUserId={currentUser.id}
    canEdit={canEdit}
  />
);
```

---

### 3.3 Corrigir MarketplaceTab

#### 3.3.1 Corrigir usersCount

**Arquivo:** `/src/app/actions/marketplace-actions.ts` (linha 118)

```typescript
// ANTES
return companies.map(company => ({
  id: company.id,
  name: company.name,
  cnpj: company.cnpj,
  projectsCount: company.projects.length,
  usersCount: company.usersCount,  // ← SEMPRE 0
  teams: company.teams.map(team => ({
    // ...
  }))
}))

// DEPOIS
return companies.map(company => ({
  id: company.id,
  name: company.name,
  cnpj: company.cnpj,
  projectsCount: company.projects.length,
  usersCount: company.users.length,  // ← CONTAR USUÁRIOS REAIS
  teams: company.teams.map(team => ({
    id: team.id,
    name: team.name,
    cnpj: team.cnpj,
    certifications: team.certifications,
    insurance: team.insurance,
    membersCount: team.members?.length || 0,  // ← TAMBÉM CORRIGIR
    manager: team.members?.find(m => m.role === 'leader')?.user
  }))
}))
```

#### 3.3.2 Adicionar Estado de Erro no UI

**Arquivo:** `/src/components/marketplace-tab.tsx`

```typescript
const [companies, setCompanies] = useState<ClimbingCompany[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null) // NOVO

async function loadCompanies() {
  setIsLoading(true)
  setError(null) // NOVO

  try {
    const data = await getClimbingCompanies()
    setCompanies(data)
  } catch (error) {
    console.error('Error loading climbing companies:', error)
    setError('Erro ao carregar empresas. Tente novamente.') // NOVO
  } finally {
    setIsLoading(false)
  }
}

// Na renderização
{error && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Erro</AlertTitle>
    <AlertDescription>
      {error}
      <Button
        variant="outline"
        size="sm"
        className="ml-2"
        onClick={loadCompanies}
      >
        Tentar novamente
      </Button>
    </AlertDescription>
  </Alert>
)}
```

#### 3.3.3 Adicionar Verificação de Permissão no Server Action

**Arquivo:** `/src/app/actions/marketplace-actions.ts`

```typescript
import { requireAuthentication } from '@/lib/auth-helpers';
import { canManageTeams } from '@/lib/permissions';

export async function getClimbingCompanies() {
  // ADICIONAR AUTENTICAÇÃO
  const currentUser = await requireAuthentication();

  // ADICIONAR VERIFICAÇÃO DE PERMISSÃO
  if (!canManageTeams({ user: currentUser })) {
    throw new Error('Permission denied: Cannot access marketplace');
  }

  try {
    if (!prisma) {
      console.warn('Database not available')
      throw new Error('Database connection failed'); // ← Lançar erro ao invés de retornar []
    }

    const companies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            role: 'team_admin'
          }
        }
      },
      include: {
        projects: true,
        users: true, // INCLUIR users para contar
        teams: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      projectsCount: company.projects.length,
      usersCount: company.users.length, // ← CORRETO
      teams: company.teams.map(team => ({
        id: team.id,
        name: team.name,
        cnpj: team.cnpj,
        certifications: team.certifications,
        insurance: team.insurance,
        membersCount: team.members?.length || 0,
        manager: team.members?.find(m => m.role === 'leader')?.user
      }))
    }));
  } catch (error) {
    console.error('[Marketplace] Error fetching climbing companies:', error);
    throw error; // ← Propagar erro ao invés de retornar []
  }
}
```

#### 3.3.4 (Opcional) Remover Campo usersCount do Schema

**Se optar por sempre calcular dinamicamente:**

```prisma
model Company {
  id          String   @id @default(cuid())
  name        String
  // ... outros campos
  // usersCount  Int      @default(0)  ← DELETAR esta linha
}
```

**Migração:**
```bash
npx prisma migrate dev --name remove_users_count_field
```

---

### 3.4 Checklist Fase 3

```
[ ] 3.1.1 Adicionar validação de imagem no InteractiveMap
[ ] 3.1.2 Corrigir anchorPoints count no OfflineDataContext
[ ] 3.1.3 Adicionar validação de base64 em createFloorPlan
[ ] 3.1.4 Adicionar loading state para floor plans
[ ] 3.1.5 Mostrar todas as floor plans no selector
[ ] 3.1.6 Testar upload e visualização de plantas baixas

[ ] 3.2.1 Rodar migração de facade inspections
[ ] 3.2.2 Corrigir parâmetro em createPathologyCategory
[ ] 3.2.3 Integrar FacadesTab na aplicação
[ ] 3.2.4 Adicionar funções de permissão para facades
[ ] 3.2.5 Testar criação de inspeções de fachada

[ ] 3.3.1 Corrigir usersCount usando company.users.length
[ ] 3.3.2 Adicionar estado de erro no MarketplaceTab UI
[ ] 3.3.3 Adicionar autenticação e permissão no server action
[ ] 3.3.4 (Opcional) Remover usersCount do schema
[ ] 3.3.5 Testar marketplace e listagem de empresas

[ ] 3.4.1 Teste integrado das três abas
[ ] 3.4.2 Verificar error handling
[ ] 3.4.3 Verificar performance
```

---

## <a name="fase-4"></a>🟡 FASE 4: MELHORIAS E OTIMIZAÇÕES (Semana 4)

**Prioridade:** MÉDIA
**Tempo Estimado:** 5-7 dias

### 4.1 Corrigir Background Sync Tags

**Arquivo:** `/src/lib/pwa-integration.ts`

```typescript
// ANTES
await registration.sync.register('background-sync-anchor-data')
await registration.sync.register('background-sync-photos')
await registration.sync.register('background-sync-inspection-data')

// DEPOIS
await registration.sync.register('background-sync-data')  // ← Matches SW
await registration.sync.register('background-sync-files') // ← Matches SW
```

**Arquivo:** `/public/sw.js` (linha 290-296)

```javascript
// Manter como está (já está correto)
if (event.tag === 'background-sync-data') {
  event.waitUntil(syncOfflineData())
}
if (event.tag === 'background-sync-files') {
  event.waitUntil(syncOfflineFiles())
}
```

---

### 4.2 Unificar Estratégia de Armazenamento de Fotos

**Decisão:**
- **Apps Nativos (Capacitor):** Continuar usando metadata + file path
- **Web/PWA:** Continuar usando base64 comprimido
- **Adicionar:** Sincronização bidirecional entre as duas estratégias

**Criar:** `/src/lib/photo-storage-adapter.ts`

```typescript
/**
 * Adaptador universal para armazenamento de fotos
 * Detecta automaticamente se está em ambiente Capacitor ou Web
 * e usa a estratégia apropriada
 */

import { Capacitor } from '@capacitor/core';

export interface PhotoStorageStrategy {
  savePhoto(data: PhotoData): Promise<PhotoMetadata>;
  loadPhoto(photoId: string): Promise<string>; // Returns base64 or file path
  deletePhoto(photoId: string): Promise<void>;
  getAllPhotos(): Promise<PhotoMetadata[]>;
}

class CapacitorPhotoStorage implements PhotoStorageStrategy {
  async savePhoto(data: PhotoData): Promise<PhotoMetadata> {
    const { savePhotoToGallery } = await import('@/lib/gallery-photo-service');
    return await savePhotoToGallery(data);
  }

  async loadPhoto(photoId: string): Promise<string> {
    // Carregar do filesystem e converter para base64 se necessário
    const { Filesystem } = await import('@capacitor/filesystem');
    const { Directory } = await import('@capacitor/filesystem');

    const result = await Filesystem.readFile({
      path: photoId,
      directory: Directory.Documents
    });

    return `data:image/jpeg;base64,${result.data}`;
  }

  async deletePhoto(photoId: string): Promise<void> {
    // Implementar deleção do filesystem
  }

  async getAllPhotos(): Promise<PhotoMetadata[]> {
    // Implementar listagem
    return [];
  }
}

class WebPhotoStorage implements PhotoStorageStrategy {
  async savePhoto(data: PhotoData): Promise<PhotoMetadata> {
    const { indexedDBStorage } = await import('@/lib/indexeddb-storage');

    // Comprimir imagem antes de salvar
    const compressed = await this.compressImage(data.base64, 1200, 0.8);

    const metadata: PhotoMetadata = {
      id: generateId(),
      projectId: data.projectId,
      pontoId: data.pontoId,
      type: data.type,
      base64: compressed,
      timestamp: new Date().toISOString(),
      size: compressed.length
    };

    await indexedDBStorage.savePhoto(metadata);
    return metadata;
  }

  async loadPhoto(photoId: string): Promise<string> {
    const { indexedDBStorage } = await import('@/lib/indexeddb-storage');
    const photo = await indexedDBStorage.getPhoto(photoId);
    return photo?.base64 || '';
  }

  async deletePhoto(photoId: string): Promise<void> {
    const { indexedDBStorage } = await import('@/lib/indexeddb-storage');
    await indexedDBStorage.deletePhoto(photoId);
  }

  async getAllPhotos(): Promise<PhotoMetadata[]> {
    const { indexedDBStorage } = await import('@/lib/indexeddb-storage');
    return await indexedDBStorage.getAllPhotos();
  }

  private async compressImage(base64: string, maxWidth: number, quality: number): Promise<string> {
    // Implementar compressão
    return base64; // placeholder
  }
}

// Factory para criar a estratégia correta
export function createPhotoStorage(): PhotoStorageStrategy {
  if (Capacitor.isNativePlatform()) {
    return new CapacitorPhotoStorage();
  } else {
    return new WebPhotoStorage();
  }
}

// Hook React para usar em componentes
export function usePhotoStorage() {
  const [storage] = useState(() => createPhotoStorage());
  return storage;
}
```

**Usar em componentes:**

```typescript
// Qualquer componente de captura de foto
import { usePhotoStorage } from '@/lib/photo-storage-adapter';

function MyCameraComponent() {
  const photoStorage = usePhotoStorage();

  const handleCapture = async (photoData: PhotoData) => {
    const metadata = await photoStorage.savePhoto(photoData);
    // Funciona tanto em web quanto em app nativo!
  };
}
```

---

### 4.3 Substituir Verificações Hardcoded por Funções de Permissão

**Script automatizado:**

```typescript
// scripts/replace-hardcoded-permissions.ts

/**
 * Script para substituir verificações de role hardcoded por funções de permissão
 *
 * Uso: ts-node scripts/replace-hardcoded-permissions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Replacement {
  pattern: RegExp;
  replacement: string;
  importNeeded: string;
}

const replacements: Replacement[] = [
  // canCreatePoints
  {
    pattern: /\(currentUser\?\.role === ['"]superadmin['"] \|\| currentUser\?\.role === ['"]company_admin['"] \|\| currentUser\?\.role === ['"]team_admin['"]\)/g,
    replacement: 'canCreatePoints({ user: currentUser, projectId })',
    importNeeded: 'canCreatePoints'
  },

  // canDeletePoints
  {
    pattern: /\(currentUser\?\.role === ['"]superadmin['"] \|\| currentUser\?\.role === ['"]company_admin['"]\)/g,
    replacement: 'canDeletePoints({ user: currentUser })',
    importNeeded: 'canDeletePoints'
  },

  // canManageTeams
  {
    pattern: /currentUser\?\.role === ['"]company_admin['"] \|\| currentUser\?\.role === ['"]superadmin['"]/g,
    replacement: 'canManageTeams({ user: currentUser })',
    importNeeded: 'canManageTeams'
  }
];

async function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  const importsToAdd = new Set<string>();

  for (const { pattern, replacement, importNeeded } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      importsToAdd.add(importNeeded);
      modified = true;
    }
  }

  if (modified) {
    // Adicionar imports se necessário
    if (!content.includes('@/lib/permissions')) {
      const importStatement = `import { ${Array.from(importsToAdd).join(', ')} } from '@/lib/permissions';\n`;
      content = importStatement + content;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated: ${filePath}`);
  }
}

async function main() {
  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });

  for (const file of files) {
    await processFile(file);
  }

  console.log('Done!');
}

main();
```

**Executar:**
```bash
npm install --save-dev glob @types/glob
npx ts-node scripts/replace-hardcoded-permissions.ts
```

---

### 4.4 Completar TODOs em permissions.ts

**Arquivo:** `/src/lib/permissions.ts` (linha 34, 61)

```typescript
// ANTES
if (user.role === 'team_admin') {
  // TODO: Verificar se o team_admin tem permissão no projeto específico
  // Por enquanto, retorna true se projectId for fornecido
  return projectId !== undefined;
}

// DEPOIS
if (user.role === 'team_admin') {
  if (!projectId) {
    // Se nenhum projeto específico, negar acesso
    return false;
  }

  // Verificar se o team_admin tem permissão no projeto via ProjectTeamPermission
  return await hasTeamPermissionForProject(user.id, projectId, 'canEditPoints');
}

// ADICIONAR nova função helper
export async function hasTeamPermissionForProject(
  userId: string,
  projectId: string,
  permission: 'canView' | 'canCreatePoints' | 'canEditPoints' | 'canDeletePoints' | 'canTestPoints'
): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');

  // Buscar o team do usuário
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId },
    include: {
      team: {
        include: {
          projectPermissions: {
            where: { projectId }
          }
        }
      }
    }
  });

  if (!teamMember || !teamMember.team.projectPermissions.length) {
    return false;
  }

  const projectPermission = teamMember.team.projectPermissions[0];

  // Verificar se a permissão específica está habilitada
  return projectPermission[permission] === true;
}
```

**Atualizar canCreatePoints também:**

```typescript
export function canCreatePoints(params: { user: User | null; projectId?: string }): boolean {
  const { user, projectId } = params;
  if (!user) return false;

  if (user.role === 'superadmin') return true;
  if (user.role === 'company_admin') return true;

  if (user.role === 'team_admin') {
    if (!projectId) return false;

    // Verificar permissão específica do projeto
    return await hasTeamPermissionForProject(user.id, projectId, 'canCreatePoints');
  }

  return false;
}
```

**Nota:** Como `permissions.ts` contém funções síncronas, pode ser necessário criar versões assíncronas:

```typescript
// Versões síncronas (para UI - verificação superficial)
export function canCreatePoints(params: { user: User | null; projectId?: string }): boolean {
  // Verificação básica baseada em role
}

// Versões assíncronas (para server actions - verificação completa)
export async function canCreatePointsAsync(params: { user: User | null; projectId?: string }): Promise<boolean> {
  // Verificação completa com database query
}
```

---

### 4.5 Checklist Fase 4

```
[ ] 4.1.1 Corrigir tags de background sync em pwa-integration.ts
[ ] 4.1.2 Testar background sync

[ ] 4.2.1 Criar photo-storage-adapter.ts
[ ] 4.2.2 Implementar CapacitorPhotoStorage
[ ] 4.2.3 Implementar WebPhotoStorage
[ ] 4.2.4 Atualizar componentes para usar o adapter
[ ] 4.2.5 Testar em web e app nativo

[ ] 4.3.1 Criar script de substituição automática
[ ] 4.3.2 Executar script em toda a codebase
[ ] 4.3.3 Revisar mudanças geradas
[ ] 4.3.4 Testar permissões em componentes atualizados

[ ] 4.4.1 Criar funções async de permissões
[ ] 4.4.2 Implementar hasTeamPermissionForProject
[ ] 4.4.3 Atualizar canEditMap e canCreatePoints
[ ] 4.4.4 Testar permissões de team_admin

[ ] 4.5.1 Code review geral da fase 4
[ ] 4.5.2 Testes de integração
```

---

## <a name="fase-5"></a>✅ FASE 5: TESTES E VALIDAÇÃO (Semana 5)

**Prioridade:** ALTA
**Tempo Estimado:** 3-5 dias

### 5.1 Testes de Segurança

```
[ ] Testar autenticação nos endpoints de sync
[ ] Testar acesso negado sem token
[ ] Testar acesso negado com token de outra empresa
[ ] Testar rate limiting
[ ] Testar permissões em server actions
[ ] Testar escalação de privilégios (técnico tentando criar projeto)
[ ] Testar isolamento de empresas
```

### 5.2 Testes de Funcionalidade

```
[ ] Testar upload e visualização de plantas baixas
[ ] Testar criação de pontos de ancoragem
[ ] Testar realização de testes
[ ] Testar inspeção de fachadas
[ ] Testar marketplace
[ ] Testar sincronização offline
[ ] Testar captura de fotos (web e nativo)
```

### 5.3 Testes de Dados

```
[ ] Verificar integridade dos tipos TypeScript
[ ] Verificar migrações do Prisma
[ ] Testar queries com novos campos
[ ] Verificar índices de performance
```

### 5.4 Testes de Contextos

```
[ ] Verificar que OfflineAuthContext foi removido
[ ] Verificar que DatabaseAuthContext funciona
[ ] Verificar funcionalidades offline
[ ] Verificar sincronização de dados
```

### 5.5 Testes de Performance

```
[ ] Testar carregamento de 100+ pontos no mapa
[ ] Testar upload de múltiplas fotos
[ ] Testar sincronização em massa
[ ] Verificar bundle size
```

### 5.6 Documentação Final

```
[ ] Atualizar CLAUDE.md com mudanças
[ ] Documentar novas APIs e funções
[ ] Criar guia de permissões
[ ] Criar guia de migrações
[ ] Atualizar README se necessário
```

---

## 📊 RESUMO EXECUTIVO

### Tempo Total Estimado
**4-5 semanas** de desenvolvimento focado

### Recursos Necessários
- 1 desenvolvedor full-stack sênior
- Acesso a ambiente de staging
- Database de testes
- Dispositivos móveis para teste (iOS/Android)

### Priorização

**🔴 CRÍTICO - Não pode ir para produção sem:**
- Fase 1: Segurança (Semana 1)
- Parte da Fase 2: Correções de dados críticas

**🟠 ALTA - Deve ser feito antes do lançamento:**
- Restante da Fase 2: Arquitetura
- Fase 3: Abas específicas

**🟡 MÉDIA - Pode ser feito após lançamento inicial:**
- Fase 4: Melhorias e otimizações

**✅ SEMPRE - Fundamental:**
- Fase 5: Testes e validação

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Migrações quebram dados existentes | Média | Alto | Backup antes de cada migração |
| Mudança de contextos quebra componentes | Alta | Médio | Teste incremental |
| Permissões muito restritivas | Média | Médio | Teste com todos os roles |
| Performance degradada | Baixa | Médio | Monitoramento contínuo |
| Sync offline falha | Média | Alto | Logs detalhados + fallback |

### Métricas de Sucesso

- ✅ 100% dos endpoints com autenticação
- ✅ 100% dos server actions com validação de permissões
- ✅ 0 inconsistências entre Prisma e TypeScript
- ✅ 1 único contexto de autenticação
- ✅ 1 única implementação de IndexedDB
- ✅ 3 abas funcionando corretamente (Mapa, Fachadas, Marketplace)
- ✅ Testes passando em todos os roles
- ✅ Score de segurança: 9/10 ou superior

---

## 🚀 COMEÇAR IMPLEMENTAÇÃO

Para iniciar, execute os comandos na seguinte ordem:

```bash
# 1. Criar branch para correções
git checkout -b fix/complete-corrections

# 2. Criar diretórios para novos arquivos
mkdir -p src/middleware
mkdir -p src/lib
mkdir -p scripts

# 3. Instalar dependências necessárias
npm install --save-dev glob @types/glob

# 4. Fazer backup do banco de dados
pg_dump $DATABASE_URL > backup_pre_corrections.sql

# 5. Começar pela Fase 1 - Criar auth-middleware.ts
# (seguir implementações detalhadas acima)
```

---

**Documento criado em:** 2025-11-05
**Autor:** Análise automatizada + Claude Code
**Versão:** 1.0
