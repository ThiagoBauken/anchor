'use server';

/**
 * @fileOverview This file defines a function for flagging anchor points that require inspection.
 * No AI required - just simple date logic.
 */

export interface FlagPointsForInspectionInput {
  anchorPoints: Array<{
    id: string;
    type: string;
    installationDate: string;
    lastInspectionDate?: string;
    inspectionFrequencyMonths: number;
  }>;
}

export interface FlagPointsForInspectionOutput {
  pointsNeedingInspection: string[];
}

export async function flagPointsForInspection(
  input: FlagPointsForInspectionInput
): Promise<FlagPointsForInspectionOutput> {
  const now = new Date();
  const pointsNeedingInspection: string[] = [];

  for (const point of input.anchorPoints) {
    const installationDate = new Date(point.installationDate);
    const monthsSinceInstallation = 
      (now.getFullYear() - installationDate.getFullYear()) * 12 +
      (now.getMonth() - installationDate.getMonth());

    let monthsSinceLastInspection = monthsSinceInstallation;

    if (point.lastInspectionDate) {
      const lastInspectionDate = new Date(point.lastInspectionDate);
      monthsSinceLastInspection = 
        (now.getFullYear() - lastInspectionDate.getFullYear()) * 12 +
        (now.getMonth() - lastInspectionDate.getMonth());
    }

    // Check if inspection is needed based on frequency
    if (monthsSinceLastInspection >= point.inspectionFrequencyMonths) {
      pointsNeedingInspection.push(point.id);
    }
  }

  return { pointsNeedingInspection };
}
