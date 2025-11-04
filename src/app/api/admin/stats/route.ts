import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SystemStats } from '@/types';
import { withSuperAdmin } from '@/middleware/admin-auth';

/**
 * GET /api/admin/stats
 * Retorna estatísticas gerais do sistema para o dashboard admin
 * 🔒 Requer autenticação de superadmin
 */
export const GET = withSuperAdmin(async (request, user) => {
  try {
    // user já foi validado pelo middleware

    // Buscar estatísticas do sistema
    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      totalUsers,
      activeUsers,
      totalProjects,
      totalPoints,
      totalTests,
      activeSubscriptions,
      trialSubscriptions,
      expiredSubscriptions
    ] = await Promise.all([
      // Companies
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isTrialActive: true } }),
      prisma.company.count({ where: { isActive: false } }),

      // Users
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),

      // Projects
      prisma.project.count({ where: { deleted: false } }),

      // Points
      prisma.anchorPoint.count({ where: { archived: false } }),

      // Tests
      prisma.anchorTest.count(),

      // Subscriptions
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trialing' } }),
      prisma.subscription.count({
        where: {
          status: { in: ['canceled', 'past_due'] }
        }
      })
    ]);

    // Calcular storage usado (em GB)
    const companies = await prisma.company.findMany({
      select: { storageUsed: true }
    });
    const storageUsed = companies.reduce((sum, c) => sum + (c.storageUsed || 0), 0) / 1024; // Convert MB to GB

    // Calcular médias
    const projectsData = await prisma.project.findMany({
      where: { deleted: false },
      include: {
        anchorPoints: {
          where: { archived: false },
          include: {
            anchorTests: true
          }
        }
      }
    });

    const totalPointsInProjects = projectsData.reduce(
      (sum, p) => sum + p.anchorPoints.length,
      0
    );
    const totalTestsInProjects = projectsData.reduce(
      (sum, p) => sum + p.anchorPoints.reduce((s, point) => s + point.anchorTests.length, 0),
      0
    );

    const avgPointsPerProject = totalProjects > 0 ? totalPointsInProjects / totalProjects : 0;
    const avgTestsPerPoint = totalPoints > 0 ? totalTestsInProjects / totalPoints : 0;

    // Empresa com maior uso
    const topCompany = await prisma.company.findFirst({
      orderBy: { storageUsed: 'desc' },
      select: { name: true }
    });

    // Último backup
    const lastBackup = await prisma.backupRecord.findFirst({
      where: { status: 'completed' },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });

    // Calcular uptime do sistema (assumindo criação do sistema = primeira empresa)
    const firstCompany = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const systemUptime = firstCompany
      ? Math.floor((Date.now() - new Date(firstCompany.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calcular receita (simplificado - em produção buscar de Payment)
    const payments = await prisma.payment.findMany({
      where: { status: 'paid' },
      select: { amount: true, createdAt: true }
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const monthlyRevenue = payments
      .filter(p => new Date(p.createdAt) >= monthStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const yearlyRevenue = payments
      .filter(p => new Date(p.createdAt) >= yearStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const stats: SystemStats = {
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      totalUsers,
      activeUsers,
      totalProjects,
      totalPoints,
      totalTests,
      storageUsed,
      monthlyRevenue,
      yearlyRevenue,
      activeSubscriptions,
      trialSubscriptions,
      expiredSubscriptions,
      avgPointsPerProject,
      avgTestsPerPoint,
      topCompanyByUsage: topCompany?.name || 'N/A',
      systemUptime,
      lastBackupDate: lastBackup?.timestamp.toISOString() || 'Never'
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
});
