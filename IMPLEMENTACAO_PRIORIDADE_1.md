# Implementação Prioritária: Equipes + Visualização Pública

## 🎯 Objetivo
Implementar o sistema de equipes (teams) com permissões granulares por projeto + visualização pública do histórico de pontos.

---

## 📦 Fase 1: Mudanças no Schema (Prisma)

### Arquivo: `prisma/schema.prisma`

```prisma
// ===== ADICIONAR AO FINAL DO ARQUIVO =====

// Sistema de Equipes
model Team {
  id          String   @id @default(cuid())
  name        String   // "Alpha Climbing LTDA"
  companyId   String   @map("company_id")

  // Informações da equipe
  cnpj        String?
  email       String?
  phone       String?
  address     String?
  logo        String?  // base64 logo
  website     String?

  // Certificações e seguros
  certifications     String[]      // ["NR-35", "NR-33", "ISO 9001"]
  insurancePolicy    String?       @map("insurance_policy")
  insuranceExpiry    DateTime?     @map("insurance_expiry")
  insuranceValue     Decimal?      @map("insurance_value") @db.Decimal(12, 2)

  // Contato do responsável
  managerName        String?       @map("manager_name")
  managerPhone       String?       @map("manager_phone")
  managerEmail       String?       @map("manager_email")

  // Status
  active      Boolean  @default(true)
  notes       String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relações
  company             Company                 @relation(fields: [companyId], references: [id], onDelete: Cascade)
  members             TeamMember[]
  projectPermissions  ProjectTeamPermission[]

  @@map("teams")
}

// Membros das equipes
model TeamMember {
  id        String   @id @default(cuid())
  teamId    String   @map("team_id")
  userId    String   @map("user_id")
  role      String   @default("technician") // "owner", "manager", "technician", "viewer"

  // Status
  active    Boolean  @default(true)
  joinedAt  DateTime @default(now()) @map("joined_at")

  // Relações
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

// Permissões de equipes em projetos
model ProjectTeamPermission {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  teamId      String   @map("team_id")

  // Permissões granulares
  canView          Boolean @default(true)  @map("can_view")
  canCreatePoints  Boolean @default(true)  @map("can_create_points")
  canEditPoints    Boolean @default(true)  @map("can_edit_points")
  canDeletePoints  Boolean @default(false) @map("can_delete_points")
  canTestPoints    Boolean @default(true)  @map("can_test_points")
  canExportReports Boolean @default(true)  @map("can_export_reports")
  canViewMap       Boolean @default(true)  @map("can_view_map")

  // Metadata
  grantedBy   String   @map("granted_by") // userId do admin
  grantedAt   DateTime @default(now()) @map("granted_at")
  expiresAt   DateTime? @map("expires_at") // Para permissões temporárias
  notes       String?   @db.Text

  // Relações
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([projectId, teamId])
  @@index([teamId])
  @@index([projectId])
  @@map("project_team_permissions")
}

// Configurações de visualização pública de projetos
model ProjectPublicSettings {
  id              String   @id @default(cuid())
  projectId       String   @unique @map("project_id")
  isPublic        Boolean  @default(false) @map("is_public")
  publicToken     String   @unique @default(cuid()) @map("public_token")

  // Configurações de visibilidade
  showTestHistory      Boolean @default(true) @map("show_test_history")
  showPhotos           Boolean @default(true) @map("show_photos")
  showTechnicalData    Boolean @default(true) @map("show_technical_data")
  showCompanyInfo      Boolean @default(true) @map("show_company_info")
  showTeamInfo         Boolean @default(true) @map("show_team_info")
  showLocation         Boolean @default(false) @map("show_location") // GPS coords
  showContactInfo      Boolean @default(true) @map("show_contact_info")

  // Mensagem customizada
  welcomeMessage       String? @db.Text @map("welcome_message")
  footerMessage        String? @db.Text @map("footer_message")

  // Opções de interação
  allowReportProblem   Boolean @default(true) @map("allow_report_problem")
  reportEmail          String? @map("report_email") // Para onde vai o report

  // Analytics
  totalViews           Int     @default(0) @map("total_views")
  lastViewedAt         DateTime? @map("last_viewed_at")

  // Metadata
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  createdBy            String?  @map("created_by") // userId

  // Relações
  project              Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([publicToken])
  @@map("project_public_settings")
}

// Log de visualizações públicas
model PublicViewLog {
  id          String   @id @default(cuid())
  token       String   // publicToken do projeto
  viewedAt    DateTime @default(now()) @map("viewed_at")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @db.Text @map("user_agent")
  referer     String?  @map("referer")

  @@index([token])
  @@index([viewedAt])
  @@map("public_view_logs")
}

// Reportes de problemas públicos
model PublicProblemReport {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  pointId     String?  @map("point_id") // Opcional, pode ser sobre o prédio em geral

  // Dados do report
  description String   @db.Text
  reporterName String? @map("reporter_name")
  reporterEmail String? @map("reporter_email")
  reporterPhone String? @map("reporter_phone")

  // Metadata
  status      String   @default("pending") // pending, reviewing, resolved, dismissed
  ipAddress   String?  @map("ip_address")
  createdAt   DateTime @default(now()) @map("created_at")
  resolvedAt  DateTime? @map("resolved_at")
  resolvedBy  String?  @map("resolved_by") // userId
  resolution  String?  @db.Text

  @@index([projectId])
  @@index([status])
  @@map("public_problem_reports")
}
```

### Adicionar relações aos modelos existentes:

```prisma
// Em Company, adicionar:
model Company {
  // ... campos existentes ...
  teams       Team[]
}

// Em User, adicionar:
model User {
  // ... campos existentes ...
  teamMemberships  TeamMember[]
}

// Em Project, adicionar:
model Project {
  // ... campos existentes ...
  teamPermissions  ProjectTeamPermission[]
  publicSettings   ProjectPublicSettings?
}
```

---

## 🔧 Fase 2: Tipos TypeScript

### Arquivo: `src/types/index.ts`

```typescript
// ADICIONAR ao final do arquivo

// ===== SISTEMA DE EQUIPES =====

export interface Team {
  id: string;
  name: string;
  companyId: string;

  // Informações da equipe
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  website?: string;

  // Certificações
  certifications?: string[];
  insurancePolicy?: string;
  insuranceExpiry?: string;
  insuranceValue?: number;

  // Contato responsável
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;

  // Status
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relações (quando populadas)
  company?: Company;
  members?: TeamMember[];
  projectPermissions?: ProjectTeamPermission[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'manager' | 'technician' | 'viewer';
  active: boolean;
  joinedAt: string;

  team?: Team;
  user?: User;
}

export interface ProjectTeamPermission {
  id: string;
  projectId: string;
  teamId: string;

  // Permissões
  canView: boolean;
  canCreatePoints: boolean;
  canEditPoints: boolean;
  canDeletePoints: boolean;
  canTestPoints: boolean;
  canExportReports: boolean;
  canViewMap: boolean;

  // Metadata
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  notes?: string;

  project?: Project;
  team?: Team;
}

export interface ProjectPublicSettings {
  id: string;
  projectId: string;
  isPublic: boolean;
  publicToken: string;

  // Visibilidade
  showTestHistory: boolean;
  showPhotos: boolean;
  showTechnicalData: boolean;
  showCompanyInfo: boolean;
  showTeamInfo: boolean;
  showLocation: boolean;
  showContactInfo: boolean;

  // Mensagens
  welcomeMessage?: string;
  footerMessage?: string;

  // Interação
  allowReportProblem: boolean;
  reportEmail?: string;

  // Analytics
  totalViews: number;
  lastViewedAt?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  project?: Project;
}

export interface PublicProblemReport {
  id: string;
  projectId: string;
  pointId?: string;

  description: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;

  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  ipAddress?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

// Helper type para dados públicos (sem info sensível)
export interface PublicProjectView {
  projectName: string;
  address?: string;
  companyName?: string;
  companyLogo?: string;
  welcomeMessage?: string;
  points: PublicAnchorPoint[];
  settings: {
    showPhotos: boolean;
    showTechnicalData: boolean;
    allowReportProblem: boolean;
  };
}

export interface PublicAnchorPoint {
  id: string;
  numeroPonto: string;
  localizacao: string;
  status: 'Aprovado' | 'Reprovado' | 'Não Testado';
  dataInstalacao?: string;
  ultimaInspecao?: string;
  proximaInspecao?: string;
  foto?: string; // Se settings.showPhotos = true
  tests?: PublicAnchorTest[];
}

export interface PublicAnchorTest {
  id: string;
  dataHora: string;
  resultado: 'Aprovado' | 'Reprovado';
  carga?: string; // Se settings.showTechnicalData = true
  tempo?: string;
  tecnico?: string;
  fotoTeste?: string;
  observacoes?: string;
}
```

---

## 🚀 Fase 3: Rotas e Pages

### 3.1 - Server Actions para Teams

**Arquivo**: `src/app/actions/team-actions.ts`

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { Team, TeamMember, ProjectTeamPermission } from '@/types'

// ===== TEAM CRUD =====

export async function getTeamsForCompany(companyId: string) {
  try {
    const teams = await prisma.team.findMany({
      where: { companyId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        projectPermissions: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return teams
  } catch (error) {
    console.error('Error fetching teams:', error)
    throw new Error('Failed to fetch teams')
  }
}

export async function getTeamById(teamId: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        company: true,
        members: {
          include: {
            user: true
          }
        },
        projectPermissions: {
          include: {
            project: true
          }
        }
      }
    })
    return team
  } catch (error) {
    console.error('Error fetching team:', error)
    throw new Error('Failed to fetch team')
  }
}

export async function createTeam(data: Omit<Team, 'id' | 'active' | 'createdAt' | 'updatedAt'>) {
  try {
    const team = await prisma.team.create({
      data: {
        name: data.name,
        companyId: data.companyId,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo: data.logo,
        website: data.website,
        certifications: data.certifications || [],
        insurancePolicy: data.insurancePolicy,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        notes: data.notes,
      }
    })
    revalidatePath('/app/teams')
    return team
  } catch (error) {
    console.error('Error creating team:', error)
    throw new Error('Failed to create team')
  }
}

export async function updateTeam(teamId: string, data: Partial<Team>) {
  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: data.name,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo: data.logo,
        website: data.website,
        certifications: data.certifications,
        insurancePolicy: data.insurancePolicy,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        notes: data.notes,
        active: data.active,
      }
    })
    revalidatePath('/app/teams')
    return team
  } catch (error) {
    console.error('Error updating team:', error)
    throw new Error('Failed to update team')
  }
}

export async function deleteTeam(teamId: string) {
  try {
    await prisma.team.delete({
      where: { id: teamId }
    })
    revalidatePath('/app/teams')
    return { success: true }
  } catch (error) {
    console.error('Error deleting team:', error)
    throw new Error('Failed to delete team')
  }
}

// ===== TEAM MEMBERS =====

export async function addTeamMember(teamId: string, userId: string, role: string) {
  try {
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
      include: {
        user: true
      }
    })
    revalidatePath(`/app/teams/${teamId}`)
    return member
  } catch (error) {
    console.error('Error adding team member:', error)
    throw new Error('Failed to add team member')
  }
}

export async function removeTeamMember(memberId: string) {
  try {
    await prisma.teamMember.delete({
      where: { id: memberId }
    })
    revalidatePath('/app/teams')
    return { success: true }
  } catch (error) {
    console.error('Error removing team member:', error)
    throw new Error('Failed to remove team member')
  }
}

export async function updateTeamMemberRole(memberId: string, role: string) {
  try {
    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role }
    })
    revalidatePath('/app/teams')
    return member
  } catch (error) {
    console.error('Error updating team member role:', error)
    throw new Error('Failed to update team member role')
  }
}

// ===== PROJECT PERMISSIONS =====

export async function grantTeamProjectPermission(
  projectId: string,
  teamId: string,
  permissions: Omit<ProjectTeamPermission, 'id' | 'projectId' | 'teamId' | 'grantedAt'>,
  grantedBy: string
) {
  try {
    const permission = await prisma.projectTeamPermission.create({
      data: {
        projectId,
        teamId,
        ...permissions,
        grantedBy,
      }
    })
    revalidatePath('/app/teams')
    revalidatePath(`/app/projects/${projectId}`)
    return permission
  } catch (error) {
    console.error('Error granting permission:', error)
    throw new Error('Failed to grant permission')
  }
}

export async function updateTeamProjectPermission(
  permissionId: string,
  updates: Partial<ProjectTeamPermission>
) {
  try {
    const permission = await prisma.projectTeamPermission.update({
      where: { id: permissionId },
      data: updates
    })
    revalidatePath('/app/teams')
    return permission
  } catch (error) {
    console.error('Error updating permission:', error)
    throw new Error('Failed to update permission')
  }
}

export async function revokeTeamProjectPermission(permissionId: string) {
  try {
    await prisma.projectTeamPermission.delete({
      where: { id: permissionId }
    })
    revalidatePath('/app/teams')
    return { success: true }
  } catch (error) {
    console.error('Error revoking permission:', error)
    throw new Error('Failed to revoke permission')
  }
}

export async function getTeamProjectPermissions(teamId: string) {
  try {
    const permissions = await prisma.projectTeamPermission.findMany({
      where: { teamId },
      include: {
        project: true,
      },
      orderBy: { grantedAt: 'desc' }
    })
    return permissions
  } catch (error) {
    console.error('Error fetching permissions:', error)
    throw new Error('Failed to fetch permissions')
  }
}

// ===== UTILITY =====

export async function getUserTeams(userId: string) {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: {
        userId,
        active: true,
      },
      include: {
        team: {
          include: {
            projectPermissions: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })
    return memberships.map(m => m.team)
  } catch (error) {
    console.error('Error fetching user teams:', error)
    throw new Error('Failed to fetch user teams')
  }
}

export async function getProjectTeams(projectId: string) {
  try {
    const permissions = await prisma.projectTeamPermission.findMany({
      where: { projectId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })
    return permissions
  } catch (error) {
    console.error('Error fetching project teams:', error)
    throw new Error('Failed to fetch project teams')
  }
}
```

---

### 3.2 - Server Actions para Visualização Pública

**Arquivo**: `src/app/actions/public-actions.ts`

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import type { PublicProjectView } from '@/types'

export async function getPublicProjectData(token: string): Promise<PublicProjectView | null> {
  try {
    // Buscar configurações públicas
    const publicSettings = await prisma.projectPublicSettings.findUnique({
      where: { publicToken: token },
      include: {
        project: {
          include: {
            company: {
              select: {
                name: true,
                companyFullName: true,
                reportLogo: true,
              }
            }
          }
        }
      }
    })

    if (!publicSettings || !publicSettings.isPublic) {
      return null
    }

    // Buscar pontos do projeto (do localStorage - via API ou diretamente)
    // Nota: Como pontos estão no localStorage, precisamos de uma estratégia
    // Opção 1: Migrar pontos para DB
    // Opção 2: Criar endpoint que retorna pontos do localStorage
    // Opção 3: Sincronizar pontos importantes para DB

    // Por enquanto, retornar estrutura básica
    const project = publicSettings.project

    return {
      projectName: project.name,
      address: project.obraAddress || undefined,
      companyName: project.company?.companyFullName || project.company?.name,
      companyLogo: project.company?.reportLogo || undefined,
      welcomeMessage: publicSettings.welcomeMessage || undefined,
      points: [], // TODO: Implementar busca de pontos
      settings: {
        showPhotos: publicSettings.showPhotos,
        showTechnicalData: publicSettings.showTechnicalData,
        allowReportProblem: publicSettings.allowReportProblem,
      }
    }
  } catch (error) {
    console.error('Error fetching public project data:', error)
    return null
  }
}

export async function incrementPublicViewCount(token: string) {
  try {
    await prisma.projectPublicSettings.update({
      where: { publicToken: token },
      data: {
        totalViews: { increment: 1 },
        lastViewedAt: new Date(),
      }
    })
  } catch (error) {
    console.error('Error incrementing view count:', error)
  }
}

export async function logPublicView(token: string, ipAddress?: string, userAgent?: string) {
  try {
    await prisma.publicViewLog.create({
      data: {
        token,
        ipAddress,
        userAgent,
      }
    })
  } catch (error) {
    console.error('Error logging public view:', error)
  }
}

export async function submitPublicProblemReport(data: {
  projectToken: string
  pointId?: string
  description: string
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  ipAddress?: string
}) {
  try {
    // Buscar projectId pelo token
    const settings = await prisma.projectPublicSettings.findUnique({
      where: { publicToken: data.projectToken },
      select: { projectId: true, allowReportProblem: true }
    })

    if (!settings || !settings.allowReportProblem) {
      throw new Error('Problem reports are not allowed for this project')
    }

    const report = await prisma.publicProblemReport.create({
      data: {
        projectId: settings.projectId,
        pointId: data.pointId,
        description: data.description,
        reporterName: data.reporterName,
        reporterEmail: data.reporterEmail,
        reporterPhone: data.reporterPhone,
        ipAddress: data.ipAddress,
      }
    })

    // TODO: Enviar email de notificação para admin
    // sendProblemReportEmail(report)

    return { success: true, reportId: report.id }
  } catch (error) {
    console.error('Error submitting problem report:', error)
    throw new Error('Failed to submit problem report')
  }
}

export async function getProjectPublicSettings(projectId: string) {
  try {
    let settings = await prisma.projectPublicSettings.findUnique({
      where: { projectId }
    })

    // Se não existir, criar com defaults
    if (!settings) {
      settings = await prisma.projectPublicSettings.create({
        data: { projectId }
      })
    }

    return settings
  } catch (error) {
    console.error('Error fetching public settings:', error)
    throw new Error('Failed to fetch public settings')
  }
}

export async function updateProjectPublicSettings(
  projectId: string,
  updates: Partial<Omit<ProjectPublicSettings, 'id' | 'projectId' | 'publicToken' | 'createdAt' | 'updatedAt'>>
) {
  try {
    const settings = await prisma.projectPublicSettings.upsert({
      where: { projectId },
      update: updates,
      create: {
        projectId,
        ...updates,
      }
    })
    return settings
  } catch (error) {
    console.error('Error updating public settings:', error)
    throw new Error('Failed to update public settings')
  }
}
```

---

### 3.3 - Página Pública

**Arquivo**: `src/app/public/project/[token]/page.tsx`

```tsx
import { getPublicProjectData, incrementPublicViewCount, logPublicView } from '@/app/actions/public-actions'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import PublicProjectView from '@/components/public-project-view'

export default async function PublicProjectPage({
  params,
}: {
  params: { token: string }
}) {
  const { token } = params

  // Buscar dados públicos
  const projectData = await getPublicProjectData(token)

  if (!projectData) {
    notFound()
  }

  // Log analytics
  const headersList = headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
  const userAgent = headersList.get('user-agent')

  // Fire and forget (não bloquear renderização)
  incrementPublicViewCount(token).catch(console.error)
  logPublicView(token, ipAddress || undefined, userAgent || undefined).catch(console.error)

  return <PublicProjectView data={projectData} token={token} />
}
```

---

## 📝 Próximos Passos

1. **Rodar migrations**:
```bash
npx prisma migrate dev --name add_teams_and_public_view
```

2. **Criar componentes React**:
   - `src/components/teams-tab.tsx` - Gestão de equipes
   - `src/components/team-permissions-manager.tsx` - UI de permissões
   - `src/components/public-project-view.tsx` - Visualização pública
   - `src/components/project-public-settings.tsx` - Configurar visibilidade

3. **Adicionar rotas**:
   - `/app/teams` - Lista de equipes
   - `/app/teams/[id]` - Detalhes da equipe
   - `/app/projects/[id]/public-settings` - Configurações públicas

4. **Implementar controle de permissões**:
   - Middleware para verificar se usuário tem permissão no projeto
   - Hook `useTeamPermissions(projectId)`

5. **Testar fluxo completo**:
   - Criar equipe
   - Adicionar membros
   - Atribuir projeto
   - Gerar URL pública
   - Acessar sem autenticação

---

**Estimativa de tempo**: 3-5 dias de desenvolvimento
**Prioridade**: 🔥 ALTA
