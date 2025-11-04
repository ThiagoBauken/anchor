'use server';

import { prisma } from '@/lib/prisma';
import { FloorPlan } from '@/types';

export async function getFloorPlansForProject(projectId: string) {
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
