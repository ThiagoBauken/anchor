'use server';

import { prisma } from '@/lib/prisma';
import {
  sendEmail,
  getTestFailEmailTemplate,
  getInspectionDueEmailTemplate,
  getPublicReportEmailTemplate,
  getWeeklyDigestEmailTemplate
} from '@/lib/email-service';

export async function getNotificationSettings(companyId: string) {
  try {
    return await prisma.notificationSettings.findUnique({
      where: { companyId },
      include: { company: true }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
}

export async function updateNotificationSettings(companyId: string, data: any) {
  try {
    const existing = await prisma.notificationSettings.findUnique({
      where: { companyId }
    });

    if (existing) {
      const updateData: any = {};
      if (data.emailEnabled !== undefined) updateData.emailNotifications = data.emailEnabled;
      if (data.notifyOnTestFail !== undefined) updateData.failedTestAlerts = data.notifyOnTestFail;
      if (data.notifyOnInspectionDue !== undefined) updateData.inspectionReminders = data.notifyOnInspectionDue;
      if (data.daysBeforeInspection !== undefined) updateData.reminderDays = [data.daysBeforeInspection];
      if (data.weeklyReportEnabled !== undefined) updateData.weeklyDigest = data.weeklyReportEnabled;

      return await prisma.notificationSettings.update({
        where: { companyId },
        data: updateData,
        include: { company: true }
      });
    }

    return await prisma.notificationSettings.create({
      data: {
        companyId,
        emailNotifications: data.emailEnabled ?? true,
        inspectionReminders: data.notifyOnInspectionDue ?? true,
        failedTestAlerts: data.notifyOnTestFail ?? true,
        weeklyDigest: data.weeklyReportEnabled ?? true,
        reminderDays: data.daysBeforeInspection ? [data.daysBeforeInspection] : [30, 15, 7],
      },
      include: { company: true }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return null;
  }
}

/**
 * Envia notificação de teste reprovado
 */
export async function sendTestFailNotification(
  companyId: string,
  projectName: string,
  anchorPointNumber: string,
  testDetails: {
    testDate: string;
    technician: string;
    observations?: string;
  }
): Promise<boolean> {
  try {
    // Buscar configurações de notificação da empresa
    const settings = await prisma.notificationSettings.findUnique({
      where: { companyId },
      include: { company: true }
    });

    if (!settings || !settings.emailNotifications || !settings.failedTestAlerts) {
      console.log('[NOTIFICATION] Test fail alerts disabled for company:', companyId);
      return false;
    }

    // Buscar emails dos admins da empresa
    const admins = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
        role: { in: ['superadmin', 'company_admin'] },
        email: { not: null }
      },
      select: { email: true }
    });

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.log('[NOTIFICATION] No admin emails found for company:', companyId);
      return false;
    }

    // Gerar template de email
    const html = getTestFailEmailTemplate({
      companyName: settings.company.name,
      projectName,
      anchorPointNumber,
      testDate: testDetails.testDate,
      technician: testDetails.technician,
      observations: testDetails.observations,
      projectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/app`
    });

    // Enviar email
    const success = await sendEmail({
      to: adminEmails,
      subject: `⚠️ Teste Reprovado - ${projectName} - Ponto ${anchorPointNumber}`,
      html
    });

    // Registrar log
    await logNotification(
      'test_failed',
      adminEmails.join(', '),
      `Teste Reprovado - ${projectName}`,
      success,
      { projectName, anchorPointNumber, testDetails }
    );

    return success;
  } catch (error) {
    console.error('[NOTIFICATION] Error sending test fail notification:', error);
    return false;
  }
}

/**
 * Envia notificação de inspeção vencida/vencendo
 */
export async function sendInspectionDueNotification(
  companyId: string,
  projectName: string,
  anchorPointNumber: string,
  dueDate: Date
): Promise<boolean> {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { companyId },
      include: { company: true }
    });

    if (!settings || !settings.emailNotifications || !settings.inspectionReminders) {
      console.log('[NOTIFICATION] Inspection reminders disabled for company:', companyId);
      return false;
    }

    // Calcular dias até a data de vencimento
    const now = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar se deve enviar baseado nos dias configurados
    if (daysUntilDue > 0 && !settings.reminderDays.includes(daysUntilDue)) {
      // Só envia nos dias configurados (ex: 30, 15, 7 dias antes)
      return false;
    }

    // Buscar emails dos admins
    const admins = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
        role: { in: ['superadmin', 'company_admin'] },
        email: { not: null }
      },
      select: { email: true }
    });

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      return false;
    }

    const html = getInspectionDueEmailTemplate({
      companyName: settings.company.name,
      projectName,
      anchorPointNumber,
      dueDate: dueDate.toLocaleDateString('pt-BR'),
      daysUntilDue,
      projectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/app`
    });

    const subject = daysUntilDue < 0
      ? `⚠️ Inspeção Vencida - ${projectName} - Ponto ${anchorPointNumber}`
      : `📅 Inspeção Programada - ${projectName} - Ponto ${anchorPointNumber}`;

    const success = await sendEmail({
      to: adminEmails,
      subject,
      html
    });

    await logNotification(
      'inspection_due',
      adminEmails.join(', '),
      subject,
      success,
      { projectName, anchorPointNumber, dueDate, daysUntilDue }
    );

    return success;
  } catch (error) {
    console.error('[NOTIFICATION] Error sending inspection due notification:', error);
    return false;
  }
}

/**
 * Envia notificação de problema reportado publicamente
 */
export async function sendPublicReportNotification(
  companyId: string,
  projectName: string,
  reportDetails: {
    reportId: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterPhone?: string;
    description: string;
    anchorPointNumber?: string;
    reportDate: string;
  }
): Promise<boolean> {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { companyId },
      include: { company: true }
    });

    if (!settings || !settings.emailNotifications) {
      return false;
    }

    const admins = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
        role: { in: ['superadmin', 'company_admin'] },
        email: { not: null }
      },
      select: { email: true }
    });

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      return false;
    }

    const html = getPublicReportEmailTemplate({
      companyName: settings.company.name,
      projectName,
      ...reportDetails
    });

    const success = await sendEmail({
      to: adminEmails,
      subject: `📢 Novo Problema Reportado - ${projectName}`,
      html
    });

    await logNotification(
      'public_report',
      adminEmails.join(', '),
      `Novo Problema Reportado - ${projectName}`,
      success,
      reportDetails
    );

    return success;
  } catch (error) {
    console.error('[NOTIFICATION] Error sending public report notification:', error);
    return false;
  }
}

/**
 * Envia relatório semanal
 */
export async function sendWeeklyReport(companyId: string): Promise<boolean> {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { companyId },
      include: { company: true }
    });

    if (!settings || !settings.emailNotifications || !settings.weeklyDigest) {
      return false;
    }

    // Calcular período da semana
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Buscar estatísticas da semana
    const [testsPerformed, testsFailed, newProjects, newPoints] = await Promise.all([
      prisma.anchorTest.count({
        where: {
          dataHora: { gte: weekStart },
          anchorPoint: {
            project: { companyId }
          }
        }
      }),
      prisma.anchorTest.count({
        where: {
          resultado: 'Reprovado',
          dataHora: { gte: weekStart },
          anchorPoint: {
            project: { companyId }
          }
        }
      }),
      prisma.project.count({
        where: {
          companyId,
          createdAt: { gte: weekStart }
        }
      }),
      prisma.anchorPoint.count({
        where: {
          dataHora: { gte: weekStart },
          project: { companyId }
        }
      })
    ]);

    // Buscar inspeções vencendo nos próximos 7 dias
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const inspectionsDue = await prisma.anchorPoint.count({
      where: {
        project: { companyId },
        // Calcular próxima inspeção baseado em dataInstalacao + frequenciaInspecaoMeses
        // TODO: Implementar lógica de cálculo de próxima inspeção
      }
    });

    const admins = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
        role: { in: ['superadmin', 'company_admin'] },
        email: { not: null }
      },
      select: { email: true }
    });

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      return false;
    }

    const html = getWeeklyDigestEmailTemplate({
      companyName: settings.company.name,
      weekStart: weekStart.toLocaleDateString('pt-BR'),
      weekEnd: now.toLocaleDateString('pt-BR'),
      stats: {
        testsPerformed,
        testsFailed,
        newProjects,
        newPoints,
        inspectionsDue
      }
    });

    const success = await sendEmail({
      to: adminEmails,
      subject: `📊 Relatório Semanal - ${settings.company.name}`,
      html
    });

    await logNotification(
      'weekly_digest',
      adminEmails.join(', '),
      `Relatório Semanal - ${settings.company.name}`,
      success,
      { weekStart, weekEnd: now, stats: { testsPerformed, testsFailed, newProjects, newPoints } }
    );

    return success;
  } catch (error) {
    console.error('[NOTIFICATION] Error sending weekly report:', error);
    return false;
  }
}

async function logNotification(
  type: string,
  recipient: string,
  subject: string,
  success: boolean,
  metadata?: any
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        type,
        recipient,
        subject,
        body: metadata ? JSON.stringify(metadata) : undefined,
        status: success ? 'sent' : 'failed',
      }
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}
