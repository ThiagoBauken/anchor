'use server';

import { ProjectPublicSettings, PublicViewLog, PublicProblemReport } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ===== PUBLIC SETTINGS MANAGEMENT =====

/**
 * Get public settings for a project
 */
export async function getProjectPublicSettings(projectId: string): Promise<ProjectPublicSettings | null> {
  try {
    if (!prisma) return null;

    const settings = await prisma.projectPublicSettings.findUnique({
      where: { projectId },
      include: {
        project: {
          include: {
            company: true
          }
        }
      }
    });

    return settings;
  } catch (error) {
    console.error('Error fetching project public settings:', error);
    return null;
  }
}

/**
 * Get public settings by public token (for public viewing)
 */
export async function getPublicSettingsByToken(token: string): Promise<ProjectPublicSettings | null> {
  try {
    if (!prisma) return null;

    const settings = await prisma.projectPublicSettings.findUnique({
      where: { publicToken: token },
      include: {
        project: {
          include: {
            company: true
          }
        }
      }
    });

    // Only return if public viewing is enabled
    if (settings && !settings.isPublic) {
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Error fetching public settings by token:', error);
    return null;
  }
}

/**
 * Enable public viewing for a project (creates settings if not exists)
 */
export async function enablePublicViewing(
  projectId: string,
  options?: {
    showTestHistory?: boolean;
    showPhotos?: boolean;
    welcomeMessage?: string;
  }
): Promise<ProjectPublicSettings | null> {
  console.log('[DEBUG] enablePublicViewing called:', { projectId });

  try {
    if (!prisma) {
      console.error('[ERROR] Database not available for public viewing');
      return null;
    }

    // Check if project exists in database
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!projectExists) {
      console.warn('[WARN] Project not found in database (localStorage only):', projectId);
      console.warn('[WARN] Public viewing will work locally but won\'t be accessible from other devices until synced.');

      // Return mock settings for localStorage projects
      // The link won't work on other devices until the project is synced to database
      return {
        id: `local-${projectId}`,
        projectId,
        isPublic: true,
        publicToken: `local-${Date.now()}`,
        showTestHistory: options?.showTestHistory ?? true,
        showPhotos: options?.showPhotos ?? true,
        showTechnicalData: true,
        showCompanyInfo: true,
        showTeamInfo: true,
        showLocation: false,
        showContactInfo: true,
        welcomeMessage: options?.welcomeMessage || null,
        footerMessage: null,
        allowReportProblem: true,
        reportEmail: null,
        totalViews: 0,
        lastViewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null
      } as any;
    }

    // Check if settings already exist
    const existing = await prisma.projectPublicSettings.findUnique({
      where: { projectId }
    });

    if (existing) {
      // Update existing settings to enable public viewing
      const updated = await prisma.projectPublicSettings.update({
        where: { projectId },
        data: {
          isPublic: true,
          showTestHistory: options?.showTestHistory ?? true,
          showPhotos: options?.showPhotos ?? true,
          welcomeMessage: options?.welcomeMessage,
        },
        include: {
          project: true
        }
      });

      console.log('[DEBUG] Public viewing enabled for existing settings');
      return updated;
    }

    // Create new public settings
    const newSettings = await prisma.projectPublicSettings.create({
      data: {
        projectId,
        isPublic: true,
        showTestHistory: options?.showTestHistory ?? true,
        showPhotos: options?.showPhotos ?? true,
        welcomeMessage: options?.welcomeMessage,
        totalViews: 0
      },
      include: {
        project: true
      }
    });

    console.log('[DEBUG] Public settings created and enabled:', newSettings.id);
    return newSettings;
  } catch (error) {
    console.error('Error enabling public viewing:', error);
    return null;
  }
}

/**
 * Disable public viewing for a project
 */
export async function disablePublicViewing(projectId: string): Promise<boolean> {
  console.log('[DEBUG] disablePublicViewing called:', { projectId });

  try {
    if (!prisma) return false;

    await prisma.projectPublicSettings.update({
      where: { projectId },
      data: { isPublic: false }
    });

    console.log('[DEBUG] Public viewing disabled');
    return true;
  } catch (error) {
    console.error('Error disabling public viewing:', error);
    return false;
  }
}

/**
 * Update public viewing settings
 */
export async function updatePublicSettings(
  projectId: string,
  data: {
    showTestHistory?: boolean;
    showPhotos?: boolean;
    welcomeMessage?: string;
  }
): Promise<ProjectPublicSettings | null> {
  try {
    if (!prisma) return null;

    const updated = await prisma.projectPublicSettings.update({
      where: { projectId },
      data: {
        ...(data.showTestHistory !== undefined && { showTestHistory: data.showTestHistory }),
        ...(data.showPhotos !== undefined && { showPhotos: data.showPhotos }),
        ...(data.welcomeMessage !== undefined && { welcomeMessage: data.welcomeMessage }),
      },
      include: {
        project: true
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating public settings:', error);
    return null;
  }
}

/**
 * Regenerate public token for a project (invalidates old token)
 */
export async function regeneratePublicToken(projectId: string): Promise<ProjectPublicSettings | null> {
  console.log('[DEBUG] regeneratePublicToken called:', { projectId });

  try {
    if (!prisma) return null;

    // Generate new token using Prisma's default cuid()
    const updated = await prisma.projectPublicSettings.update({
      where: { projectId },
      data: {
        publicToken: require('cuid').default() // Generate new CUID
      },
      include: {
        project: true
      }
    });

    console.log('[DEBUG] Public token regenerated');
    return updated;
  } catch (error) {
    console.error('Error regenerating public token:', error);
    return null;
  }
}

/**
 * Get the public URL for a project
 */
export async function getPublicUrl(token: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  return `${baseUrl}/public/project/${token}`;
}

/**
 * Get QR code data URL for a project's public link
 */
export async function getPublicQrCode(projectId: string): Promise<string | null> {
  try {
    const settings = await getProjectPublicSettings(projectId);
    if (!settings || !settings.isPublic) return null;

    const publicUrl = getPublicUrl(settings.publicToken);

    // You can use a QR code generation library here
    // For now, returning the URL to be generated client-side
    return publicUrl;
  } catch (error) {
    console.error('Error getting public QR code:', error);
    return null;
  }
}

// ===== PUBLIC VIEW LOGS =====

/**
 * Log a public view access
 */
export async function logPublicView(
  projectId: string,
  data: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
  }
): Promise<PublicViewLog | null> {
  try {
    if (!prisma) return null;

    // Increment total views counter
    await prisma.projectPublicSettings.update({
      where: { projectId },
      data: {
        totalViews: {
          increment: 1
        }
      }
    });

    // Get token for logging (schema uses token, not projectId)
    const settings = await prisma.projectPublicSettings.findUnique({
      where: { projectId }
    });

    if (!settings?.publicToken) {
      console.warn('[WARN] No public token found for project');
      return null;
    }

    // Create log entry
    const log = await prisma.publicViewLog.create({
      data: {
        token: settings.publicToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        referer: data.deviceType // Using referer field for device type temporarily
      }
    });

    return log;
  } catch (error) {
    console.error('Error logging public view:', error);
    return null;
  }
}

/**
 * Get public view logs for a project
 */
export async function getPublicViewLogs(
  projectId: string,
  limit: number = 100
): Promise<PublicViewLog[]> {
  try {
    if (!prisma) return [];

    // Get token for this project
    const settings = await prisma.projectPublicSettings.findUnique({
      where: { projectId }
    });

    if (!settings?.publicToken) {
      return [];
    }

    const logs = await prisma.publicViewLog.findMany({
      where: { token: settings.publicToken },
      orderBy: { viewedAt: 'desc' },
      take: limit
    });

    return logs;
  } catch (error) {
    console.error('Error fetching public view logs:', error);
    return [];
  }
}

/**
 * Get public view statistics for a project
 */
export async function getPublicViewStats(projectId: string): Promise<{
  totalViews: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  deviceTypes: { [key: string]: number };
}> {
  try {
    if (!prisma) {
      return {
        totalViews: 0,
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0,
        deviceTypes: {}
      };
    }

    const settings = await prisma.projectPublicSettings.findUnique({
      where: { projectId }
    });

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (!settings?.publicToken) {
      return {
        totalViews: 0,
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0,
        deviceTypes: {}
      };
    }

    const [views24h, views7d, views30d] = await Promise.all([
      prisma.publicViewLog.count({
        where: {
          token: settings.publicToken,
          viewedAt: { gte: last24h }
        }
      }),
      prisma.publicViewLog.count({
        where: {
          token: settings.publicToken,
          viewedAt: { gte: last7d }
        }
      }),
      prisma.publicViewLog.count({
        where: {
          token: settings.publicToken,
          viewedAt: { gte: last30d }
        }
      })
    ]);

    // Device types temporarily disabled (schema mismatch)
    const deviceTypes: { [key: string]: number } = {};

    return {
      totalViews: settings?.totalViews || 0,
      last24Hours: views24h,
      last7Days: views7d,
      last30Days: views30d,
      deviceTypes
    };
  } catch (error) {
    console.error('Error fetching public view stats:', error);
    return {
      totalViews: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      deviceTypes: {}
    };
  }
}

// ===== PUBLIC PROBLEM REPORTS =====

/**
 * Submit a problem report from public viewer
 */
export async function submitPublicProblemReport(
  projectId: string,
  data: {
    anchorPointNumber?: string;
    description: string;
    contactEmail?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }
): Promise<PublicProblemReport | null> {
  console.log('[DEBUG] submitPublicProblemReport called:', { projectId });

  try {
    if (!prisma) return null;

    const report = await prisma.publicProblemReport.create({
      data: {
        projectId,
        description: data.description,
        reporterEmail: data.contactEmail,
        status: 'pending'
      }
    });

    console.log('[DEBUG] Problem report submitted:', report.id);
    return report;
  } catch (error) {
    console.error('Error submitting problem report:', error);
    return null;
  }
}

/**
 * Get all problem reports for a project
 */
export async function getProjectProblemReports(
  projectId: string,
  status?: 'pending' | 'acknowledged' | 'resolved' | 'rejected'
): Promise<PublicProblemReport[]> {
  try {
    if (!prisma) return [];

    const reports = await prisma.publicProblemReport.findMany({
      where: {
        projectId,
        ...(status && { status })
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return reports;
  } catch (error) {
    console.error('Error fetching problem reports:', error);
    return [];
  }
}

/**
 * Update status of a problem report
 */
export async function updateProblemReportStatus(
  reportId: string,
  status: 'pending' | 'acknowledged' | 'resolved' | 'rejected',
  adminNotes?: string
): Promise<PublicProblemReport | null> {
  console.log('[DEBUG] updateProblemReportStatus called:', { reportId, status });

  try {
    if (!prisma) return null;

    const updated = await prisma.publicProblemReport.update({
      where: { id: reportId },
      data: {
        status,
        ...(adminNotes && { adminNotes }),
        ...(status === 'resolved' && { resolvedAt: new Date() })
      }
    });

    console.log('[DEBUG] Problem report status updated');
    return updated;
  } catch (error) {
    console.error('Error updating problem report status:', error);
    return null;
  }
}

/**
 * Get problem report statistics for a project
 */
export async function getProblemReportStats(projectId: string): Promise<{
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  rejected: number;
  byPriority: { [key: string]: number };
}> {
  try {
    if (!prisma) {
      return {
        total: 0,
        pending: 0,
        acknowledged: 0,
        resolved: 0,
        rejected: 0,
        byPriority: {}
      };
    }

    const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
      prisma.publicProblemReport.count({ where: { projectId } }),
      prisma.publicProblemReport.count({ where: { projectId, status: 'pending' } }),
      prisma.publicProblemReport.count({ where: { projectId, status: 'reviewing' } }),
      prisma.publicProblemReport.count({ where: { projectId, status: 'resolved' } }),
      prisma.publicProblemReport.count({ where: { projectId, status: 'dismissed' } })
    ]);

    // Priority field not in schema - return empty object
    const byPriority: { [key: string]: number } = {};

    return {
      total,
      pending,
      acknowledged: reviewing,
      resolved,
      rejected: dismissed,
      byPriority
    };
  } catch (error) {
    console.error('Error fetching problem report stats:', error);
    return {
      total: 0,
      pending: 0,
      acknowledged: 0,
      resolved: 0,
      rejected: 0,
      byPriority: {}
    };
  }
}

/**
 * Delete a problem report
 */
export async function deleteProblemReport(reportId: string): Promise<boolean> {
  try {
    if (!prisma) return false;

    await prisma.publicProblemReport.delete({
      where: { id: reportId }
    });

    return true;
  } catch (error) {
    console.error('Error deleting problem report:', error);
    return false;
  }
}
