"use server";

import { flagPointsForInspection } from "@/ai/flows/flag-points-for-inspection";
import type { FlagPointsForInspectionInput } from "@/ai/flows/flag-points-for-inspection";

export async function flagPointsForInspectionAction(input: FlagPointsForInspectionInput) {
  return await flagPointsForInspection(input);
}
