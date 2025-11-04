
'use server';

import { Project, Location } from '@prisma/client';
import type { MarkerShape } from '@/types';
import { prisma } from '@/lib/prisma';
import { localStorageProjects, localStorageLocations } from '@/lib/localStorage-fallback';

// == PROJECTS ==
export async function getProjectsForCompany(companyId: string): Promise<Project[]> {
  console.log('[DEBUG] getProjectsForCompany called:', { companyId });
  if (!companyId) {
    console.warn('[WARN] getProjectsForCompany: No companyId provided');
    return [];
  }

  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageProjects.getAll(companyId);
    }

    return await prisma.project.findMany({
      where: { companyId, deleted: false },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.warn('Database error, using localStorage fallback:', error);
    return localStorageProjects.getAll(companyId);
  }
}

/**
 * Busca projetos para um usuário específico (modelo B2B duplo)
 * - Projetos da própria empresa do usuário
 * - Projetos atribuídos via equipes (ProjectTeamPermission)
 */
export async function getProjectsForUser(userId: string, companyId: string): Promise<Project[]> {
  console.log('[DEBUG] getProjectsForUser called:', { userId, companyId });
  if (!userId || !companyId) {
    console.warn('[WARN] getProjectsForUser: Missing userId or companyId');
    return [];
  }

  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageProjects.getAll(companyId);
    }

    // Buscar projetos onde:
    // 1. São da empresa do usuário (próprios)
    // 2. OU usuário tem permissão via equipe
    const projects = await prisma.project.findMany({
      where: {
        deleted: false,
        OR: [
          // Projetos da própria empresa
          { companyId },
          // Projetos atribuídos via equipes
          {
            teamPermissions: {
              some: {
                team: {
                  members: {
                    some: { userId }
                  }
                }
              }
            }
          }
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        company: { select: { name: true } },
        createdBy: { select: { name: true, email: true } }
      }
    });

    console.log('[DEBUG] Found projects for user:', projects.length);
    return projects as Project[];
  } catch (error) {
    console.warn('Database error, using localStorage fallback:', error);
    return localStorageProjects.getAll(companyId);
  }
}

export async function addProject(projectData: Omit<Project, 'id' | 'deleted' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
  console.log('[DEBUG] addProject server action called:', { projectName: projectData.name, companyId: projectData.companyId });
  try {
    if (!prisma) {
      console.warn('[WARN] Prisma client not initialized, using localStorage fallback');
      return localStorageProjects.add(projectData);
    }

    console.log('[DEBUG] Attempting to create project in database...');
    const { companyId, createdByUserId, ...restData } = projectData;
    const newProject = await prisma.project.create({
      data: {
        ...restData,
        floorPlanImages: restData.floorPlanImages || [], // Ensure it's an array
        company: {
          connect: { id: companyId }
        },
        createdBy: {
          connect: { id: createdByUserId }
        }
      },
    });
    console.log('[DEBUG] ✅ Project created successfully in database:', newProject.id);
    return newProject;
  } catch (e) {
    console.error("[ERROR] Failed to create project in database:", e);
    console.error("[ERROR] Error details:", {
      name: (e as Error)?.name,
      message: (e as Error)?.message,
      code: (e as any)?.code
    });
    console.warn('[WARN] Falling back to localStorage');
    return localStorageProjects.add(projectData);
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  console.log('[DEBUG] deleteProject server action called:', { id });
  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageProjects.delete(id);
    }
    
    await prisma.project.update({
      where: { id },
      data: { deleted: true },
    });
    console.log('[DEBUG] Project deleted successfully in database');
    return true;
  } catch (error) {
    console.error(`Failed to delete project ${id}, trying localStorage fallback:`, error);
    return localStorageProjects.delete(id);
  }
}

// == LOCATIONS ==
export async function getLocationsForCompany(companyId: string): Promise<Location[]> {
  if (!companyId) return [];
  
  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageLocations.getAll(companyId);
    }
    
    return await prisma.location.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.warn('Database error, using localStorage fallback:', error);
    return localStorageLocations.getAll(companyId);
  }
}

export async function addLocation(name: string, markerShape: MarkerShape, companyId: string): Promise<Location | null> {
    console.log('[DEBUG] addLocation server action called:', { name, markerShape, companyId });
    try {
        if (!prisma) {
            console.warn('Database not available, using localStorage fallback');
            return localStorageLocations.add(name, companyId);
        }
        
        const newLocation = await prisma.location.create({
            data: { name, markerShape, companyId }
        });
        console.log('[DEBUG] Location created successfully in database:', newLocation.id);
        return newLocation;
    } catch(e) {
        console.error("Error creating location, using localStorage fallback:", e);
        return localStorageLocations.add(name, companyId);
    }
}

export async function deleteLocation(id: string): Promise<boolean> {
    try {
        if (!prisma) {
            console.warn('Database not available, using localStorage fallback');
            return localStorageLocations.delete(id);
        }
        
        await prisma.location.delete({ where: { id }});
        return true;
    } catch (e) {
        console.error(`Failed to delete location ${id}, trying localStorage fallback:`, e);
        return localStorageLocations.delete(id);
    }
}

export async function updateLocationShape(id: string, markerShape: MarkerShape): Promise<Location | null> {
    console.log('[DEBUG] updateLocationShape action called:', { id, markerShape });
    try {
        if (!prisma) {
            console.warn('Database not available, using localStorage fallback');
            const success = localStorageLocations.updateShape(id, markerShape);
            // Get the full location data from localStorage
            if (success) {
                // Get all locations and find the updated one
                const allLocations = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem('anchor-locations') || '[]') : '[]');
                const updatedLoc = allLocations.find((l: any) => l.id === id);
                console.log('[DEBUG] Location updated in localStorage:', updatedLoc);
                return updatedLoc || null;
            }
            return null;
        }
        
        const updatedLocation = await prisma.location.update({
            where: { id },
            data: { markerShape }
        });
        console.log('[DEBUG] Location updated in database:', updatedLocation);
        return updatedLocation;
    } catch(e) {
        console.error(`Failed to update location ${id}, trying localStorage fallback:`, e);
        const success = localStorageLocations.updateShape(id, markerShape);
        if (success) {
            // Get all locations and find the updated one
            const allLocations = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem('anchor-locations') || '[]') : '[]');
            const updatedLoc = allLocations.find((l: any) => l.id === id);
            console.log('[DEBUG] Location updated in localStorage (fallback):', updatedLoc);
            return updatedLoc || null;
        }
        return null;
    }
}
