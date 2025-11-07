'use server';

import { prisma } from '@/lib/prisma';
import {
  FacadeInspection,
  FacadeSide,
  PathologyCategory,
  PathologyMarker,
  InspectionReport,
  InspectionStatus,
  FacadeSideType,
  PathologySeverity
} from '@/types';
import { requireAuthentication, requireCompanyMatch, logAction } from '@/lib/auth-helpers';

// ===== FACADE INSPECTION CRUD =====

export async function getInspectionsForProject(projectId: string) {
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
    const inspections = await prisma.facadeInspection.findMany({
      where: { projectId },
      include: {
        facadeSides: {
          include: {
            pathologyMarkers: {
              include: {
                category: true
              }
            }
          }
        },
        reports: true,
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return inspections;
  } catch (error) {
    console.error('Error fetching facade inspections:', error);
    return [];
  }
}

export async function getInspectionById(inspectionId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // First get the inspection to check company access
  const inspectionCheck = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspectionCheck) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspectionCheck.project.companyId);

  try {
    const inspection = await prisma.facadeInspection.findUnique({
      where: { id: inspectionId },
      include: {
        facadeSides: {
          include: {
            pathologyMarkers: {
              include: {
                category: true,
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        reports: {
          include: {
            engineer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { version: 'desc' }
        },
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            companyId: true
          }
        }
      }
    });
    return inspection;
  } catch (error) {
    console.error('Error fetching facade inspection:', error);
    return null;
  }
}

export async function createFacadeInspection(
  projectId: string,
  name: string,
  createdByUserId: string,
  description?: string,
  scheduledDate?: string,
  inspectorName?: string,
  engineerId?: string
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
  logAction('CREATE_FACADE_INSPECTION', user.id, {
    projectId,
    inspectionName: name
  });

  try {
    const inspection = await prisma.facadeInspection.create({
      data: {
        projectId,
        name,
        description,
        status: 'scheduled',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        inspectorName,
        engineerId,
        createdByUserId: createdByUserId
      },
      include: {
        facadeSides: true,
        reports: true
      }
    });
    return inspection;
  } catch (error) {
    console.error('Error creating facade inspection:', error);
    return null;
  }
}

export async function updateFacadeInspection(
  inspectionId: string,
  data: {
    name?: string;
    description?: string;
    status?: InspectionStatus;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    inspectorId?: string;
    inspectorName?: string;
    engineerId?: string;
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  // Log action
  logAction('UPDATE_FACADE_INSPECTION', user.id, {
    inspectionId,
    updates: Object.keys(data)
  });

  try {
    const updateData: any = { ...data };

    // Convert date strings to Date objects
    if (data.scheduledDate !== undefined) {
      updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    }
    if (data.startedAt !== undefined) {
      updateData.startedAt = data.startedAt ? new Date(data.startedAt) : null;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }

    const inspection = await prisma.facadeInspection.update({
      where: { id: inspectionId },
      data: updateData,
      include: {
        facadeSides: true,
        reports: true
      }
    });
    return inspection;
  } catch (error) {
    console.error('Error updating facade inspection:', error);
    return null;
  }
}

export async function deleteFacadeInspection(inspectionId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  // Log action
  logAction('DELETE_FACADE_INSPECTION', user.id, {
    inspectionId
  });

  try {
    await prisma.facadeInspection.delete({
      where: { id: inspectionId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting facade inspection:', error);
    return false;
  }
}

// ===== FACADE SIDE CRUD =====

export async function getFacadeSidesForInspection(inspectionId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  try {
    const sides = await prisma.facadeSide.findMany({
      where: { inspectionId: inspectionId },
      include: {
        pathologyMarkers: {
          include: {
            category: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    return sides;
  } catch (error) {
    console.error('Error fetching facade sides:', error);
    return [];
  }
}

export async function createFacadeSide(
  inspectionId: string,
  name: string,
  sideType: FacadeSideType,
  image: string,
  order: number,
  metadata?: {
    dronePhotoDate?: string;
    weather?: string;
    photographer?: string;
    notes?: string;
    imageWidth?: number;
    imageHeight?: number;
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  // Log action
  logAction('CREATE_FACADE_SIDE', user.id, {
    inspectionId,
    sideName: name
  });

  try{
    const side = await prisma.facadeSide.create({
      data: {
        inspectionId: inspectionId,
        name,
        sideType,
        image,
        order,
        dronePhotoDate: metadata?.dronePhotoDate ? new Date(metadata.dronePhotoDate) : null,
        weather: metadata?.weather,
        photographer: metadata?.photographer,
        notes: metadata?.notes,
        imageWidth: metadata?.imageWidth,
        imageHeight: metadata?.imageHeight
      },
      include: {
        pathologyMarkers: true
      }
    });
    return side;
  } catch (error) {
    console.error('Error creating facade side:', error);
    return null;
  }
}

export async function updateFacadeSide(
  sideId: string,
  data: {
    name?: string;
    sideType?: FacadeSideType;
    image?: string;
    order?: number;
    dronePhotoDate?: string;
    weather?: string;
    photographer?: string;
    notes?: string;
    imageWidth?: number;
    imageHeight?: number;
    availableFloors?: string[];
    availableDivisions?: string[];
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via facade side
  const facadeSide = await prisma.facadeSide.findUnique({
    where: { id: sideId },
    include: {
      inspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!facadeSide) {
    throw new Error('Facade side not found');
  }

  await requireCompanyMatch(user.id, facadeSide.inspection.project.companyId);

  // Log action
  logAction('UPDATE_FACADE_SIDE', user.id, {
    sideId,
    updates: Object.keys(data)
  });

  try {
    const updateData: any = { ...data };

    if (data.dronePhotoDate !== undefined) {
      updateData.dronePhotoDate = data.dronePhotoDate ? new Date(data.dronePhotoDate) : null;
    }

    const side = await prisma.facadeSide.update({
      where: { id: sideId },
      data: updateData,
      include: {
        pathologyMarkers: true
      }
    });
    return side;
  } catch (error) {
    console.error('Error updating facade side:', error);
    return null;
  }
}

export async function deleteFacadeSide(sideId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via facade side
  const facadeSide = await prisma.facadeSide.findUnique({
    where: { id: sideId },
    include: {
      inspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!facadeSide) {
    throw new Error('Facade side not found');
  }

  await requireCompanyMatch(user.id, facadeSide.inspection.project.companyId);

  // Log action
  logAction('DELETE_FACADE_SIDE', user.id, {
    sideId
  });

  try {
    await prisma.facadeSide.delete({
      where: { id: sideId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting facade side:', error);
    return false;
  }
}

// ===== PATHOLOGY CATEGORY CRUD =====

export async function getPathologyCategoriesForProject(projectId: string) {
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
    const categories = await prisma.pathologyCategory.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    });
    return categories;
  } catch (error) {
    console.error('Error fetching pathology categories:', error);
    return [];
  }
}

export async function createPathologyCategory(
  projectId: string,
  name: string,
  color: string,
  severity: PathologySeverity,
  order: number,
  description?: string
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
  logAction('CREATE_PATHOLOGY_CATEGORY', user.id, {
    projectId,
    categoryName: name
  });

  try {
    const category = await prisma.pathologyCategory.create({
      data: {
        projectId,
        name,
        color,
        severity,
        order,
        description
      }
    });
    return category;
  } catch (error) {
    console.error('Error creating pathology category:', error);
    return null;
  }
}

export async function updatePathologyCategory(
  categoryId: string,
  data: {
    name?: string;
    color?: string;
    severity?: PathologySeverity;
    order?: number;
    description?: string;
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via category
  const category = await prisma.pathologyCategory.findUnique({
    where: { id: categoryId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!category) {
    throw new Error('Pathology category not found');
  }

  await requireCompanyMatch(user.id, category.project.companyId);

  // Log action
  logAction('UPDATE_PATHOLOGY_CATEGORY', user.id, {
    categoryId,
    updates: Object.keys(data)
  });

  try {
    const updatedCategory = await prisma.pathologyCategory.update({
      where: { id: categoryId },
      data
    });
    return updatedCategory;
  } catch (error) {
    console.error('Error updating pathology category:', error);
    return null;
  }
}

export async function togglePathologyCategoryActive(categoryId: string, active: boolean) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via category
  const category = await prisma.pathologyCategory.findUnique({
    where: { id: categoryId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!category) {
    throw new Error('Pathology category not found');
  }

  await requireCompanyMatch(user.id, category.project.companyId);

  // Log action
  logAction('TOGGLE_PATHOLOGY_CATEGORY', user.id, {
    categoryId,
    active
  });

  try {
    const updatedCategory = await prisma.pathologyCategory.update({
      where: { id: categoryId },
      data: { active }
    });
    return updatedCategory;
  } catch (error) {
    console.error('Error toggling pathology category:', error);
    return null;
  }
}

export async function deletePathologyCategory(categoryId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via category
  const category = await prisma.pathologyCategory.findUnique({
    where: { id: categoryId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!category) {
    throw new Error('Pathology category not found');
  }

  await requireCompanyMatch(user.id, category.project.companyId);

  // Log action
  logAction('DELETE_PATHOLOGY_CATEGORY', user.id, {
    categoryId
  });

  try {
    await prisma.pathologyCategory.delete({
      where: { id: categoryId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting pathology category:', error);
    return false;
  }
}

// ===== PATHOLOGY MARKER CRUD =====

export async function getPathologyMarkersForFacadeSide(facadeSideId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via facade side
  const facadeSide = await prisma.facadeSide.findUnique({
    where: { id: facadeSideId },
    include: {
      inspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!facadeSide) {
    throw new Error('Facade side not found');
  }

  await requireCompanyMatch(user.id, facadeSide.inspection.project.companyId);

  try {
    const markers = await prisma.pathologyMarker.findMany({
      where: { facadeSideId },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return markers;
  } catch (error) {
    console.error('Error fetching pathology markers:', error);
    return [];
  }
}

export async function createPathologyMarker(
  facadeSideId: string,
  categoryId: string,
  geometry: {
    type?: 'rectangle' | 'polygon';
    points?: { x: number; y: number }[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
  createdByUserId: string,
  metadata?: {
    area?: number;
    floor?: string;
    division?: string;
    severity?: PathologySeverity;
    description?: string;
    observations?: string;
    status?: string;
    priority?: number;
    photos?: string[];
    zIndex?: number;
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via facade side
  const facadeSide = await prisma.facadeSide.findUnique({
    where: { id: facadeSideId },
    include: {
      inspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!facadeSide) {
    throw new Error('Facade side not found');
  }

  await requireCompanyMatch(user.id, facadeSide.inspection.project.companyId);

  // Log action
  logAction('CREATE_PATHOLOGY_MARKER', user.id, {
    facadeSideId,
    categoryId
  });

  try {
    const marker = await prisma.pathologyMarker.create({
      data: {
        facadeSideId,
        categoryId,
        geometry,
        zIndex: metadata?.zIndex || 0,
        createdById: createdByUserId,
        area: metadata?.area,
        floor: metadata?.floor,
        division: metadata?.division,
        severity: metadata?.severity || 'medium',
        description: metadata?.description,
        observations: metadata?.observations,
        status: metadata?.status || 'PENDING',
        priority: metadata?.priority || 0,
        photos: metadata?.photos || []
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return marker;
  } catch (error) {
    console.error('Error creating pathology marker:', error);
    return null;
  }
}

export async function updatePathologyMarker(
  markerId: string,
  data: {
    geometry?: {
      type?: 'rectangle' | 'polygon';
      points?: { x: number; y: number }[];
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    categoryId?: string;
    zIndex?: number;
    area?: number;
    floor?: string;
    severity?: PathologySeverity;
    description?: string;
    observations?: string;
    status?: string;
    priority?: number;
    photos?: string[];
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via marker
  const marker = await prisma.pathologyMarker.findUnique({
    where: { id: markerId },
    include: {
      facadeSide: {
        include: {
          inspection: {
            include: {
              project: {
                select: { companyId: true }
              }
            }
          }
        }
      }
    }
  });

  if (!marker) {
    throw new Error('Pathology marker not found');
  }

  await requireCompanyMatch(user.id, marker.facadeSide.inspection.project.companyId);

  // Log action
  logAction('UPDATE_PATHOLOGY_MARKER', user.id, {
    markerId,
    updates: Object.keys(data)
  });

  try {
    const updatedMarker = await prisma.pathologyMarker.update({
      where: { id: markerId },
      data,
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return updatedMarker;
  } catch (error) {
    console.error('Error updating pathology marker:', error);
    return null;
  }
}

export async function deletePathologyMarker(markerId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via marker
  const marker = await prisma.pathologyMarker.findUnique({
    where: { id: markerId },
    include: {
      facadeSide: {
        include: {
          inspection: {
            include: {
              project: {
                select: { companyId: true }
              }
            }
          }
        }
      }
    }
  });

  if (!marker) {
    throw new Error('Pathology marker not found');
  }

  await requireCompanyMatch(user.id, marker.facadeSide.inspection.project.companyId);

  // Log action
  logAction('DELETE_PATHOLOGY_MARKER', user.id, {
    markerId
  });

  try {
    await prisma.pathologyMarker.delete({
      where: { id: markerId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting pathology marker:', error);
    return false;
  }
}

// ===== INSPECTION REPORT CRUD =====

export async function getReportsForInspection(inspectionId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  try {
    const reports = await prisma.inspectionReport.findMany({
      where: { facadeInspectionId: inspectionId },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { version: 'desc' }
    });
    return reports;
  } catch (error) {
    console.error('Error fetching inspection reports:', error);
    return [];
  }
}

export async function createInspectionReport(
  inspectionId: string,
  engineerId: string,
  reportNumber: string,
  title: string,
  content: string
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via inspection
  const inspection = await prisma.facadeInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await requireCompanyMatch(user.id, inspection.project.companyId);

  // Log action
  logAction('CREATE_INSPECTION_REPORT', user.id, {
    inspectionId,
    reportNumber
  });

  try {
    // Get the next version number
    const latestReport = await prisma.inspectionReport.findFirst({
      where: { facadeInspectionId: inspectionId },
      orderBy: { version: 'desc' }
    });
    const nextVersion = (latestReport?.version || 0) + 1;

    const report = await prisma.inspectionReport.create({
      data: {
        facadeInspectionId: inspectionId,
        engineerId,
        reportNumber,
        title,
        content,
        status: 'DRAFT',
        version: nextVersion,
        generatedAt: new Date()
      },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return report;
  } catch (error) {
    console.error('Error creating inspection report:', error);
    return null;
  }
}

export async function updateInspectionReport(
  reportId: string,
  data: {
    title?: string;
    content?: string;
    pdfUrl?: string;
  }
) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via report
  const report = await prisma.inspectionReport.findUnique({
    where: { id: reportId },
    include: {
      facadeInspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!report) {
    throw new Error('Inspection report not found');
  }

  await requireCompanyMatch(user.id, report.facadeInspection.project.companyId);

  // Log action
  logAction('UPDATE_INSPECTION_REPORT', user.id, {
    reportId,
    updates: Object.keys(data)
  });

  try {
    const updatedReport = await prisma.inspectionReport.update({
      where: { id: reportId },
      data,
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return updatedReport;
  } catch (error) {
    console.error('Error updating inspection report:', error);
    return null;
  }
}

export async function approveInspectionReport(reportId: string, approvedBy: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via report
  const report = await prisma.inspectionReport.findUnique({
    where: { id: reportId },
    include: {
      facadeInspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!report) {
    throw new Error('Inspection report not found');
  }

  await requireCompanyMatch(user.id, report.facadeInspection.project.companyId);

  // Log action
  logAction('APPROVE_INSPECTION_REPORT', user.id, {
    reportId
  });

  try {
    const updatedReport = await prisma.inspectionReport.update({
      where: { id: reportId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy
      },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return updatedReport;
  } catch (error) {
    console.error('Error approving inspection report:', error);
    return null;
  }
}

export async function rejectInspectionReport(reportId: string, rejectionReason: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via report
  const report = await prisma.inspectionReport.findUnique({
    where: { id: reportId },
    include: {
      facadeInspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!report) {
    throw new Error('Inspection report not found');
  }

  await requireCompanyMatch(user.id, report.facadeInspection.project.companyId);

  // Log action
  logAction('REJECT_INSPECTION_REPORT', user.id, {
    reportId,
    rejectionReason
  });

  try {
    const updatedReport = await prisma.inspectionReport.update({
      where: { id: reportId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason
      },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return updatedReport;
  } catch (error) {
    console.error('Error rejecting inspection report:', error);
    return null;
  }
}

export async function deleteInspectionReport(reportId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Check company access via report
  const report = await prisma.inspectionReport.findUnique({
    where: { id: reportId },
    include: {
      facadeInspection: {
        include: {
          project: {
            select: { companyId: true }
          }
        }
      }
    }
  });

  if (!report) {
    throw new Error('Inspection report not found');
  }

  await requireCompanyMatch(user.id, report.facadeInspection.project.companyId);

  // Log action
  logAction('DELETE_INSPECTION_REPORT', user.id, {
    reportId
  });

  try {
    await prisma.inspectionReport.delete({
      where: { id: reportId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting inspection report:', error);
    return false;
  }
}

// ===== SEED DEFAULT CATEGORIES =====

export async function seedDefaultPathologyCategories(projectId: string) {
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
  logAction('SEED_DEFAULT_PATHOLOGY_CATEGORIES', user.id, {
    projectId
  });

  try {
    const defaultCategories = [
      // CRÍTICOS (Vermelho/Laranja escuros)
      { name: 'Desplacamento Crítico', color: '#C0392B', severity: 'critical' as PathologySeverity, order: 1, description: 'Desplacamento em estado crítico com risco iminente' },
      { name: 'Desplacamento Total', color: '#E74C3C', severity: 'critical' as PathologySeverity, order: 2, description: 'Destacamento completo de revestimento' },
      { name: 'Falta de Ancoragem', color: '#D63031', severity: 'critical' as PathologySeverity, order: 3, description: 'Ausência ou falha de ancoragem estrutural' },
      { name: 'Falta de Para-raios', color: '#E17055', severity: 'critical' as PathologySeverity, order: 4, description: 'Para-raios ausente ou caindo' },
      { name: 'Corrosão', color: '#E67E22', severity: 'critical' as PathologySeverity, order: 5, description: 'Corrosão de armaduras ou elementos metálicos' },

      // ALTOS (Laranjas/Amarelos)
      { name: 'Trinca', color: '#FF7675', severity: 'high' as PathologySeverity, order: 6, description: 'Trincas e fissuras na estrutura ou revestimento' },
      { name: 'Infiltração', color: '#FD79A8', severity: 'high' as PathologySeverity, order: 7, description: 'Sinais de infiltração de água' },
      { name: 'Falta de Pingadeira', color: '#FDCB6E', severity: 'high' as PathologySeverity, order: 8, description: 'Ausência de pingadeira ou rufos' },
      { name: 'Vidros Quebrados/Trincados', color: '#F39C12', severity: 'high' as PathologySeverity, order: 9, description: 'Vidros danificados ou trincados' },

      // MÉDIOS (Azuis/Verdes/Roxos)
      { name: 'Reboco Solto', color: '#74B9FF', severity: 'medium' as PathologySeverity, order: 10, description: 'Reboco em processo de desplacamento' },
      { name: 'Pastilha Solta', color: '#A29BFE', severity: 'medium' as PathologySeverity, order: 11, description: 'Pastilhas soltas ou em deslocamento' },
      { name: 'Falta de Rejunte', color: '#6C5CE7', severity: 'medium' as PathologySeverity, order: 12, description: 'Ausência ou deterioração de rejunte' },
      { name: 'Junta de Dilatação', color: '#00B894', severity: 'medium' as PathologySeverity, order: 13, description: 'Problemas em juntas de dilatação' },
      { name: 'Umidade', color: '#00CEC9', severity: 'medium' as PathologySeverity, order: 14, description: 'Manchas de umidade e bolor/mofo' },
      { name: 'Falta de Silicone', color: '#81ECEC', severity: 'medium' as PathologySeverity, order: 15, description: 'Ausência ou deterioração de silicone' },
      { name: 'Falta de Desvios', color: '#55EFC4', severity: 'medium' as PathologySeverity, order: 16, description: 'Ausência de desvios ou calhas' },

      // BAIXOS (Tons claros/pastéis)
      { name: 'Eflorescência', color: '#DDA0DD', severity: 'low' as PathologySeverity, order: 17, description: 'Depósitos salinos na superfície (manchas brancas)' },
      { name: 'Desgaste', color: '#95A5A6', severity: 'low' as PathologySeverity, order: 18, description: 'Desgaste natural do tempo' },
      { name: 'Tinta Solta', color: '#DFE6E9', severity: 'low' as PathologySeverity, order: 19, description: 'Pintura descascando ou solta' },
      { name: 'Textura Solta', color: '#B2BEC3', severity: 'low' as PathologySeverity, order: 20, description: 'Textura em desplacamento' },
      { name: 'Moldura', color: '#636E72', severity: 'low' as PathologySeverity, order: 21, description: 'Problemas em molduras decorativas' },
      { name: 'Molduras em Isopor', color: '#A29BFE', severity: 'low' as PathologySeverity, order: 22, description: 'Molduras de isopor danificadas' },
      { name: 'Molduras em Gesso', color: '#F8A5C2', severity: 'low' as PathologySeverity, order: 23, description: 'Molduras de gesso com problemas' },
      { name: 'Silicone', color: '#FFEAA7', severity: 'low' as PathologySeverity, order: 24, description: 'Silicone envelhecido ou manchado' }
    ];

    const createdCategories = [];
    for (const category of defaultCategories) {
      const created = await prisma.pathologyCategory.create({
        data: {
          projectId,
          name: category.name,
          color: category.color,
          severity: category.severity,
          order: category.order,
          description: category.description
        }
      });
      createdCategories.push(created);
    }

    return createdCategories;
  } catch (error) {
    console.error('Error seeding default pathology categories:', error);
    return [];
  }
}
