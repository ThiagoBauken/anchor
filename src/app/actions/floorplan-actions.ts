'use server';

import { prisma } from '@/lib/prisma';
import { FloorPlan } from '@/types';
import { requireAuthentication, requireCompanyMatch, logAction } from '@/lib/auth-helpers';

export async function getFloorPlansForProject(projectId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Verify user has access to this project's company
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { companyId: true }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await requireCompanyMatch(user.id, project.companyId);

  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { anchorPoints: true }
        }
      }
    });
    return floorPlans;
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    return [];
  }
}

export async function createFloorPlan(
  projectId: string,
  name: string,
  image: string,
  order: number
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Verify user has access to this project's company
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { companyId: true }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await requireCompanyMatch(user.id, project.companyId);

  // Log action
  logAction('CREATE_FLOOR_PLAN', user.id, {
    projectId,
    floorPlanName: name
  });

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
    console.error('Error creating floor plan:', error);
    return null;
  }
}

export async function updateFloorPlan(
  id: string,
  name: string,
  order: number
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via floor plan
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!floorPlan) {
    throw new Error('Floor plan not found');
  }

  await requireCompanyMatch(user.id, floorPlan.project.companyId);

  // Log action
  logAction('UPDATE_FLOOR_PLAN', user.id, {
    floorPlanId: id,
    newName: name
  });

  try {
    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: { name, order }
    });
    return floorPlan;
  } catch (error) {
    console.error('Error updating floor plan:', error);
    return null;
  }
}

export async function toggleFloorPlanActive(id: string, active: boolean) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via floor plan
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!floorPlan) {
    throw new Error('Floor plan not found');
  }

  await requireCompanyMatch(user.id, floorPlan.project.companyId);

  // Log action
  logAction('TOGGLE_FLOOR_PLAN', user.id, {
    floorPlanId: id,
    active
  });

  try {
    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: { active }
    });
    return floorPlan;
  } catch (error) {
    console.error('Error toggling floor plan active:', error);
    return null;
  }
}

export async function deleteFloorPlan(id: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via floor plan
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!floorPlan) {
    throw new Error('Floor plan not found');
  }

  await requireCompanyMatch(user.id, floorPlan.project.companyId);

  // Log action
  logAction('DELETE_FLOOR_PLAN', user.id, {
    floorPlanId: id
  });

  try {
    // First, update all anchor points to remove the floorPlanId reference
    await prisma.anchorPoint.updateMany({
      where: { floorPlanId: id },
      data: { floorPlanId: null }
    });

    // Then delete the floor plan
    await prisma.floorPlan.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return false;
  }
}

export async function updateFloorPlanOrder(floorPlanIds: string[]) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access for all floor plans
  // Get all floor plans to verify they belong to the same company
  const floorPlans = await prisma.floorPlan.findMany({
    where: {
      id: {
        in: floorPlanIds
      }
    },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (floorPlans.length !== floorPlanIds.length) {
    throw new Error('One or more floor plans not found');
  }

  // Verify all floor plans belong to the same company and user has access
  const companyIds = new Set(floorPlans.map(fp => fp.project.companyId));
  if (companyIds.size !== 1) {
    throw new Error('Floor plans belong to different companies');
  }

  const companyId = Array.from(companyIds)[0];
  await requireCompanyMatch(user.id, companyId);

  // Log action
  logAction('UPDATE_FLOOR_PLAN_ORDER', user.id, {
    floorPlanCount: floorPlanIds.length
  });

  try {
    // Update order for each floor plan
    await Promise.all(
      floorPlanIds.map((id, index) =>
        prisma.floorPlan.update({
          where: { id },
          data: { order: index }
        })
      )
    );
    return true;
  } catch (error) {
    console.error('Error updating floor plan order:', error);
    return false;
  }
}
