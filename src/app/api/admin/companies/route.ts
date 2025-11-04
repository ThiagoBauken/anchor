import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/middleware/admin-auth';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/middleware/rate-limit';

/**
 * GET /api/admin/companies
 * Lista todas as empresas do sistema
 * 🔒 Requer autenticação de superadmin
 */
export const GET = withSuperAdmin(async (request, user) => {
  try {

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            teams: true
          }
        },
        subscriptions: {
          where: { status: 'active' },
          include: {
            plan: true
          },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/companies
 * Cria uma nova empresa
 * 🔒 Requer autenticação de superadmin
 * 🛡️ Rate limited: 10 requisições por minuto
 */
export const POST = withRateLimit(
  withSuperAdmin(async (request, user) => {
    try {
      const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      cnpj,
      subscriptionPlan,
      maxUsers,
      maxProjects,
      maxStorage,
      trialDays = 30
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Calcular datas do trial
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address,
        cnpj,
        subscriptionPlan: subscriptionPlan || 'trial',
        subscriptionStatus: 'active',
        isTrialActive: true,
        trialStartDate,
        trialEndDate,
        daysRemainingInTrial: trialDays,
        maxUsers,
        maxProjects,
        maxStorage,
        usersCount: 0,
        projectsCount: 0,
        pointsCount: 0,
        storageUsed: 0,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      }
    });

    // Criar configurações padrão da empresa
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
        settings: {}
      }
    });

    // Criar limites de uso
    await prisma.usageLimits.create({
      data: {
        companyId: company.id,
        usersCount: 0,
        projectsCount: 0,
        pointsCount: 0,
        storageUsedGb: 0
      }
    });

    // Criar configurações de notificação
    await prisma.notificationSettings.create({
      data: {
        companyId: company.id,
        emailNotifications: true,
        inspectionReminders: true,
        failedTestAlerts: true,
        weeklyDigest: true,
        reminderDays: [30, 15, 7],
        digestDay: 1
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId: company.id,
        activityType: 'company_created',
        description: `Company ${name} created by admin`,
        metadata: { createdBy: 'admin' }
      }
    });

      return NextResponse.json(company, { status: 201 });
    } catch (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }
  }),
  RATE_LIMIT_PRESETS.STRICT
);

/**
 * PATCH /api/admin/companies
 * Atualiza uma empresa
 * 🔒 Requer autenticação de superadmin
 */
export const PATCH = withSuperAdmin(async (request, user) => {
  try {

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...updates,
        lastActivity: new Date()
      },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            teams: true
          }
        }
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId: id,
        activityType: 'company_updated',
        description: `Company updated by admin`,
        metadata: { updates }
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/companies
 * Desativa uma empresa (soft delete)
 * 🔒 Requer autenticação de superadmin
 */
export const DELETE = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        isActive: false,
        subscriptionStatus: 'cancelled'
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId: id,
        activityType: 'company_suspended',
        description: `Company suspended by admin`,
        metadata: { suspendedAt: new Date() }
      }
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
});
