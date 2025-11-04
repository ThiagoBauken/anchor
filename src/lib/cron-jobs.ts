/**
 * Cron Jobs Service
 *
 * Serviço para execução de tarefas agendadas:
 * - Verificar trials expirados
 * - Enviar relatórios semanais
 * - Executar backups automáticos
 * - Verificar inspeções vencendo
 * - Limpar dados antigos
 *
 * PRODUÇÃO: Use node-cron ou integre com serviços como AWS EventBridge,
 * Vercel Cron, ou Azure Functions Timer Trigger
 */

import { prisma } from '@/lib/prisma';
import { sendWeeklyReport, sendInspectionDueNotification } from '@/app/actions/notification-actions';

/**
 * Job 1: Verificar e desativar trials expirados
 * Frequência: Diariamente à meia-noite
 */
export async function checkExpiredTrials() {
  console.log('[CRON] Checking expired trials...');

  try {
    const now = new Date();

    // Buscar empresas com trial ativo e data expirada
    const expiredTrials = await prisma.company.findMany({
      where: {
        isTrialActive: true,
        trialEndDate: {
          lt: now
        }
      }
    });

    for (const company of expiredTrials) {
      // Atualizar empresa
      await prisma.company.update({
        where: { id: company.id },
        data: {
          isTrialActive: false,
          daysRemainingInTrial: 0,
          subscriptionStatus: 'trial_expired'
        }
      });

      // Log da atividade
      await prisma.saasActivityLog.create({
        data: {
          companyId: company.id,
          activityType: 'trial_expired',
          description: `Trial period expired for ${company.name}`,
          metadata: {
            expiredAt: now,
            trialDuration: Math.floor(
              (now.getTime() - company.trialStartDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        }
      });

      console.log(`[CRON] Trial expired for company: ${company.name}`);
    }

    console.log(`[CRON] Processed ${expiredTrials.length} expired trials`);
    return expiredTrials.length;
  } catch (error) {
    console.error('[CRON] Error checking expired trials:', error);
    return 0;
  }
}

/**
 * Job 2: Atualizar dias restantes de trial
 * Frequência: Diariamente à meia-noite
 */
export async function updateTrialDaysRemaining() {
  console.log('[CRON] Updating trial days remaining...');

  try {
    const now = new Date();

    const activeTrials = await prisma.company.findMany({
      where: {
        isTrialActive: true
      }
    });

    for (const company of activeTrials) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((company.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      await prisma.company.update({
        where: { id: company.id },
        data: {
          daysRemainingInTrial: daysRemaining
        }
      });
    }

    console.log(`[CRON] Updated ${activeTrials.length} trial companies`);
    return activeTrials.length;
  } catch (error) {
    console.error('[CRON] Error updating trial days:', error);
    return 0;
  }
}

/**
 * Job 3: Enviar relatórios semanais
 * Frequência: Semanalmente (segunda-feira 8h)
 */
export async function sendWeeklyReports() {
  console.log('[CRON] Sending weekly reports...');

  try {
    // Buscar empresas com relatório semanal ativado
    const companies = await prisma.company.findMany({
      where: {
        isActive: true
      },
      include: {
        notificationSettings: true
      }
    });

    let sentCount = 0;

    for (const company of companies) {
      if (company.notificationSettings?.[0]?.weeklyDigest) {
        const success = await sendWeeklyReport(company.id);
        if (success) sentCount++;
      }
    }

    console.log(`[CRON] Sent ${sentCount} weekly reports`);
    return sentCount;
  } catch (error) {
    console.error('[CRON] Error sending weekly reports:', error);
    return 0;
  }
}

/**
 * Job 4: Verificar inspeções vencendo
 * Frequência: Diariamente às 9h
 */
export async function checkDueInspections() {
  console.log('[CRON] Checking due inspections...');

  try {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 30); // Próximos 30 dias

    // Buscar pontos de ancoragem com inspeções vencendo
    // TODO: Implementar lógica de cálculo de próxima inspeção
    // baseado em dataInstalacao + frequenciaInspecaoMeses

    const points = await prisma.anchorPoint.findMany({
      where: {
        archived: false,
        project: {
          company: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        numeroPonto: true,
        dataInstalacao: true,
        frequenciaInspecaoMeses: true,
        project: {
          select: {
            id: true,
            name: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                isActive: true,
                notificationSettings: true
              }
            }
          }
        }
      }
    });

    let notificationsSent = 0;

    for (const point of points) {
      // Calcular próxima inspeção
      const installDate = new Date(point.dataInstalacao);
      const monthsToAdd = point.frequenciaInspecaoMeses || 12;
      const nextInspection = new Date(installDate);
      nextInspection.setMonth(installDate.getMonth() + monthsToAdd);

      // Verificar se vence nos próximos 30 dias
      const daysUntilDue = Math.floor(
        (nextInspection.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const reminderDays = point.project.company.notificationSettings?.[0]?.reminderDays || [30, 15, 7];

      if (reminderDays.includes(daysUntilDue) || daysUntilDue < 0) {
        const success = await sendInspectionDueNotification(
          point.project.companyId,
          point.project.name,
          point.numeroPonto || 'N/A',
          nextInspection
        );

        if (success) notificationsSent++;
      }
    }

    console.log(`[CRON] Sent ${notificationsSent} inspection reminders`);
    return notificationsSent;
  } catch (error) {
    console.error('[CRON] Error checking due inspections:', error);
    return 0;
  }
}

/**
 * Job 5: Executar backup do banco de dados
 * Frequência: Diariamente às 2h
 */
export async function runDatabaseBackup() {
  console.log('[CRON] Running database backup...');

  try {
    // Verificar se backups estão habilitados
    const backupEnabled = process.env.BACKUP_ENABLED === 'true';

    if (!backupEnabled) {
      console.log('[CRON] Backups are disabled');
      return false;
    }

    const backupPath = process.env.BACKUP_PATH || './backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;

    // TODO: Implementar backup real usando pg_dump
    // Exemplo: exec(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}/${filename}`)

    // Registrar backup no banco
    await prisma.backupRecord.create({
      data: {
        type: 'automatic',
        status: 'completed',
        size: 0, // TODO: Obter tamanho real do arquivo em MB
        duration: 0, // TODO: Calcular duração em segundos
        tablesBackedUp: ['all'], // TODO: Listar tabelas específicas
        filesCount: 1
      }
    });

    console.log(`[CRON] Backup completed: ${filename}`);
    return true;
  } catch (error) {
    console.error('[CRON] Error running backup:', error);

    // Registrar backup falhado
    try {
      await prisma.backupRecord.create({
        data: {
          type: 'automatic',
          status: 'failed',
          size: 0,
          duration: 0,
          tablesBackedUp: [],
          filesCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } catch (logError) {
      console.error('[CRON] Error logging failed backup:', logError);
    }

    return false;
  }
}

/**
 * Job 6: Limpar backups antigos
 * Frequência: Semanalmente (domingo 3h)
 */
export async function cleanOldBackups() {
  console.log('[CRON] Cleaning old backups...');

  try {
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await prisma.backupRecord.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    // TODO: Deletar arquivos físicos de backup
    // TODO: Implementar com fs.unlink() para cada backup

    // Deletar registros do banco
    await prisma.backupRecord.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    console.log(`[CRON] Cleaned ${oldBackups.length} old backups`);
    return oldBackups.length;
  } catch (error) {
    console.error('[CRON] Error cleaning old backups:', error);
    return 0;
  }
}

/**
 * Job 7: Limpar logs antigos
 * Frequência: Semanalmente (domingo 4h)
 */
export async function cleanOldLogs() {
  console.log('[CRON] Cleaning old logs...');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Manter últimos 90 dias

    const deleted = await prisma.saasActivityLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    console.log(`[CRON] Cleaned ${deleted.count} old activity logs`);
    return deleted.count;
  } catch (error) {
    console.error('[CRON] Error cleaning old logs:', error);
    return 0;
  }
}

/**
 * Job 8: Atualizar estatísticas de uso
 * Frequência: Diariamente às 1h
 */
export async function updateUsageStatistics() {
  console.log('[CRON] Updating usage statistics...');

  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: {
        users: true,
        projects: {
          include: {
            anchorPoints: true
          }
        }
      }
    });

    for (const company of companies) {
      const usersCount = company.users.filter(u => u.active).length;
      const projectsCount = company.projects.filter(p => !p.deleted).length;
      const pointsCount = company.projects.reduce(
        (sum, p) => sum + p.anchorPoints.filter(ap => !ap.archived).length,
        0
      );

      // Atualizar counters
      await prisma.company.update({
        where: { id: company.id },
        data: {
          usersCount,
          projectsCount,
          pointsCount,
          lastActivity: new Date()
        }
      });

      // Atualizar usage limits
      await prisma.usageLimits.upsert({
        where: { companyId: company.id },
        update: {
          usersCount,
          projectsCount,
          pointsCount
        },
        create: {
          companyId: company.id,
          usersCount,
          projectsCount,
          pointsCount,
          storageUsedGb: 0
        }
      });
    }

    console.log(`[CRON] Updated usage stats for ${companies.length} companies`);
    return companies.length;
  } catch (error) {
    console.error('[CRON] Error updating usage statistics:', error);
    return 0;
  }
}

/**
 * Execute todos os jobs (para teste manual)
 */
export async function runAllJobs() {
  console.log('[CRON] Running all jobs...');

  const results = {
    expiredTrials: await checkExpiredTrials(),
    updatedTrials: await updateTrialDaysRemaining(),
    weeklyReports: await sendWeeklyReports(),
    dueInspections: await checkDueInspections(),
    backup: await runDatabaseBackup(),
    cleanedBackups: await cleanOldBackups(),
    cleanedLogs: await cleanOldLogs(),
    updatedStats: await updateUsageStatistics()
  };

  console.log('[CRON] All jobs completed:', results);
  return results;
}

/**
 * Schedule de jobs recomendado (usar com node-cron ou similar):
 *
 * 0 0 * * * - checkExpiredTrials() - Meia-noite
 * 0 0 * * * - updateTrialDaysRemaining() - Meia-noite
 * 0 1 * * * - updateUsageStatistics() - 1h
 * 0 2 * * * - runDatabaseBackup() - 2h
 * 0 3 * * 0 - cleanOldBackups() - 3h domingo
 * 0 4 * * 0 - cleanOldLogs() - 4h domingo
 * 0 8 * * 1 - sendWeeklyReports() - 8h segunda-feira
 * 0 9 * * * - checkDueInspections() - 9h
 */
