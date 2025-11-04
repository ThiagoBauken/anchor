'use server';

import { Team, TeamMember, ProjectTeamPermission } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ===== TEAM MANAGEMENT =====

/**
 * Get all teams for a company
 */
export async function getTeamsForCompany(companyId: string): Promise<Team[]> {
  console.log('[DEBUG] getTeamsForCompany called:', { companyId });
  if (!companyId) {
    console.warn('[WARN] getTeamsForCompany: No companyId provided');
    return [];
  }

  try {
    if (!prisma) {
      console.warn('Database not available for teams');
      return [];
    }

    const teams = await prisma.team.findMany({
      where: {
        companyId,
        active: true
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            projectPermissions: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    console.log('[DEBUG] Teams fetched:', teams.length);
    return teams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

/**
 * Get a specific team by ID with all details
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    if (!prisma) return null;

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
    });

    return team;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

/**
 * Create a new team
 */
export async function createTeam(data: {
  name: string;
  companyId: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  logo?: string;
  certifications?: string[];
  insurancePolicy?: string;
  insuranceExpiry?: Date;
}): Promise<Team | null> {
  console.log('[DEBUG] createTeam called:', { name: data.name, companyId: data.companyId });

  try {
    if (!prisma) {
      console.warn('Database not available');
      return null;
    }

    const newTeam = await prisma.team.create({
      data: {
        name: data.name,
        companyId: data.companyId,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        logo: data.logo,
        certifications: data.certifications || [],
        insurancePolicy: data.insurancePolicy,
        insuranceExpiry: data.insuranceExpiry,
        active: true
      },
      include: {
        members: true,
        _count: {
          select: {
            projectPermissions: true
          }
        }
      }
    });

    console.log('[DEBUG] Team created successfully:', newTeam.id);
    return newTeam;
  } catch (error) {
    console.error('Error creating team:', error);
    return null;
  }
}

/**
 * Update an existing team
 */
export async function updateTeam(
  teamId: string,
  data: {
    name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    logo?: string;
    certifications?: string[];
    insurancePolicy?: string;
    insuranceExpiry?: Date;
    active?: boolean;
  }
): Promise<Team | null> {
  console.log('[DEBUG] updateTeam called:', { teamId });

  try {
    if (!prisma) return null;

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.certifications !== undefined && { certifications: data.certifications }),
        ...(data.insurancePolicy !== undefined && { insurancePolicy: data.insurancePolicy }),
        ...(data.insuranceExpiry !== undefined && { insuranceExpiry: data.insuranceExpiry }),
        ...(data.active !== undefined && { active: data.active }),
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            projectPermissions: true
          }
        }
      }
    });

    console.log('[DEBUG] Team updated successfully');
    return updatedTeam;
  } catch (error) {
    console.error('Error updating team:', error);
    return null;
  }
}

/**
 * Soft delete a team (set active to false)
 */
export async function deleteTeam(teamId: string): Promise<boolean> {
  console.log('[DEBUG] deleteTeam called:', { teamId });

  try {
    if (!prisma) return false;

    await prisma.team.update({
      where: { id: teamId },
      data: { active: false }
    });

    console.log('[DEBUG] Team deactivated successfully');
    return true;
  } catch (error) {
    console.error('Error deactivating team:', error);
    return false;
  }
}

// ===== TEAM MEMBERS MANAGEMENT =====

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!prisma) return [];

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: true,
        team: true
      },
      orderBy: { role: 'asc' }
    });

    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

/**
 * Get all teams a user belongs to
 */
export async function getUserTeams(userId: string): Promise<TeamMember[]> {
  try {
    if (!prisma) return [];

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            company: true,
            _count: {
              select: {
                projectPermissions: true
              }
            }
          }
        }
      }
    });

    return memberships;
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: 'leader' | 'member' | 'observer' = 'member'
): Promise<TeamMember | null> {
  console.log('[DEBUG] addTeamMember called:', { teamId, userId, role });

  try {
    if (!prisma) return null;

    // Check if membership already exists
    const existing = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (existing) {
      console.warn('[WARN] User already member of this team');
      return existing;
    }

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role
      },
      include: {
        user: true,
        team: true
      }
    });

    console.log('[DEBUG] Team member added successfully');
    return newMember;
  } catch (error) {
    console.error('Error adding team member:', error);
    return null;
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  memberId: string,
  role: 'leader' | 'member' | 'observer'
): Promise<TeamMember | null> {
  try {
    if (!prisma) return null;

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: true,
        team: true
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating team member role:', error);
    return null;
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(memberId: string): Promise<boolean> {
  console.log('[DEBUG] removeTeamMember called:', { memberId });

  try {
    if (!prisma) return false;

    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    console.log('[DEBUG] Team member removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing team member:', error);
    return false;
  }
}

// ===== PROJECT PERMISSIONS MANAGEMENT =====

/**
 * Get all project permissions for a team
 */
export async function getTeamProjectPermissions(teamId: string): Promise<ProjectTeamPermission[]> {
  try {
    if (!prisma) return [];

    const permissions = await prisma.projectTeamPermission.findMany({
      where: { teamId },
      include: {
        project: true,
        team: true
      },
      orderBy: {
        project: {
          name: 'asc'
        }
      }
    });

    return permissions;
  } catch (error) {
    console.error('Error fetching team project permissions:', error);
    return [];
  }
}

/**
 * Get all teams with permissions for a project
 */
export async function getProjectTeamPermissions(projectId: string): Promise<ProjectTeamPermission[]> {
  try {
    if (!prisma) return [];

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
      },
      orderBy: {
        team: {
          name: 'asc'
        }
      }
    });

    return permissions;
  } catch (error) {
    console.error('Error fetching project team permissions:', error);
    return [];
  }
}

/**
 * Grant permissions to a team for a specific project
 */
export async function grantTeamProjectPermission(data: {
  teamId: string;
  projectId: string;
  grantedBy: string;  // Required: userId of admin granting permission
  canView?: boolean;
  canEditPoints?: boolean;
  canDeletePoints?: boolean;
  canExportReports?: boolean;
  canTestPoints?: boolean;
  canCreatePoints?: boolean;
  canViewMap?: boolean;
  notes?: string;
  expiresAt?: Date;
}): Promise<ProjectTeamPermission | null> {
  console.log('[DEBUG] grantTeamProjectPermission called:', {
    teamId: data.teamId,
    projectId: data.projectId,
    grantedBy: data.grantedBy
  });

  try {
    if (!prisma) return null;

    // Check if permission already exists
    const existing = await prisma.projectTeamPermission.findUnique({
      where: {
        projectId_teamId: {
          projectId: data.projectId,
          teamId: data.teamId
        }
      }
    });

    if (existing) {
      // Update existing permissions
      return await prisma.projectTeamPermission.update({
        where: { id: existing.id },
        data: {
          canView: data.canView ?? true,
          canCreatePoints: data.canCreatePoints ?? true,
          canEditPoints: data.canEditPoints ?? true,
          canDeletePoints: data.canDeletePoints ?? false,
          canExportReports: data.canExportReports ?? true,
          canTestPoints: data.canTestPoints ?? true,
          canViewMap: data.canViewMap ?? true,
          notes: data.notes,
          expiresAt: data.expiresAt,
        },
        include: {
          project: true,
          team: true
        }
      });
    }

    // Create new permission
    const permission = await prisma.projectTeamPermission.create({
      data: {
        teamId: data.teamId,
        projectId: data.projectId,
        grantedBy: data.grantedBy,  // Required field
        canView: data.canView ?? true,
        canCreatePoints: data.canCreatePoints ?? true,
        canEditPoints: data.canEditPoints ?? true,
        canDeletePoints: data.canDeletePoints ?? false,
        canExportReports: data.canExportReports ?? true,
        canTestPoints: data.canTestPoints ?? true,
        canViewMap: data.canViewMap ?? true,
        notes: data.notes,
        expiresAt: data.expiresAt,
      },
      include: {
        project: true,
        team: true
      }
    });

    console.log('[DEBUG] Team project permission granted successfully');
    return permission;
  } catch (error) {
    console.error('Error granting team project permission:', error);
    return null;
  }
}

/**
 * Update permissions for a team on a project
 */
export async function updateTeamProjectPermission(
  permissionId: string,
  data: {
    canView?: boolean;
    canCreatePoints?: boolean;
    canEditPoints?: boolean;
    canDeletePoints?: boolean;
    canExportReports?: boolean;
    canTestPoints?: boolean;
    canViewMap?: boolean;
    notes?: string;
    expiresAt?: Date;
  }
): Promise<ProjectTeamPermission | null> {
  try {
    if (!prisma) return null;

    const updated = await prisma.projectTeamPermission.update({
      where: { id: permissionId },
      data: {
        ...(data.canView !== undefined && { canView: data.canView }),
        ...(data.canCreatePoints !== undefined && { canCreatePoints: data.canCreatePoints }),
        ...(data.canEditPoints !== undefined && { canEditPoints: data.canEditPoints }),
        ...(data.canDeletePoints !== undefined && { canDeletePoints: data.canDeletePoints }),
        ...(data.canExportReports !== undefined && { canExportReports: data.canExportReports }),
        ...(data.canTestPoints !== undefined && { canTestPoints: data.canTestPoints }),
        ...(data.canViewMap !== undefined && { canViewMap: data.canViewMap }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
      include: {
        project: true,
        team: true
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating team project permission:', error);
    return null;
  }
}

/**
 * Revoke all permissions for a team on a project
 */
export async function revokeTeamProjectPermission(permissionId: string): Promise<boolean> {
  console.log('[DEBUG] revokeTeamProjectPermission called:', { permissionId });

  try {
    if (!prisma) return false;

    await prisma.projectTeamPermission.delete({
      where: { id: permissionId }
    });

    console.log('[DEBUG] Team project permission revoked successfully');
    return true;
  } catch (error) {
    console.error('Error revoking team project permission:', error);
    return false;
  }
}

/**
 * Check if a user has specific permission on a project through their team membership
 */
export async function checkUserProjectPermission(
  userId: string,
  projectId: string,
  permission: 'canView' | 'canCreatePoints' | 'canEditPoints' | 'canDeletePoints' | 'canExportReports' | 'canTestPoints' | 'canViewMap'
): Promise<boolean> {
  try {
    if (!prisma) return false;

    // Get user's team memberships
    const memberships = await prisma.teamMember.findMany({
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

    // Check if any team has the required permission
    for (const membership of memberships) {
      for (const projectPermission of membership.team.projectPermissions) {
        if (projectPermission[permission] === true) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking user project permission:', error);
    return false;
  }
}

/**
 * Get all projects a user can access through team memberships
 */
export async function getUserAccessibleProjects(userId: string): Promise<any[]> {
  try {
    if (!prisma) return [];

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            projectPermissions: {
              where: {
                canView: true
              },
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    // Flatten and deduplicate projects
    const projectsMap = new Map();

    for (const membership of memberships) {
      for (const permission of membership.team.projectPermissions) {
        if (!projectsMap.has(permission.project.id)) {
          projectsMap.set(permission.project.id, {
            ...permission.project,
            teamName: membership.team.name,
            permissions: permission
          });
        }
      }
    }

    return Array.from(projectsMap.values());
  } catch (error) {
    console.error('Error getting user accessible projects:', error);
    return [];
  }
}
