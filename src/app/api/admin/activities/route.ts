import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/middleware/admin-auth';

/**
 * GET /api/admin/activities
 * Lista logs de atividades do sistema
 * 🔒 Requer autenticação de superadmin
 */
export const GET = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const activityType = searchParams.get('type');

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (activityType) {
      where.activityType = activityType;
    }

    const activities = await prisma.saasActivityLog.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Formatar para o tipo AdminActivity esperado pelo frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      adminId: activity.userId || 'system',
      adminName: activity.user?.name || 'System',
      action: activity.activityType,
      targetType: getTargetType(activity.activityType),
      targetId: activity.companyId,
      targetName: activity.company?.name || '',
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      ipAddress: undefined // Não armazenado no SaasActivityLog
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/activities
 * Cria um novo log de atividade
 * 🔒 Requer autenticação de superadmin
 */
export const POST = withSuperAdmin(async (request, user) => {
  try {
    const body = await request.json();
    const {
      companyId,
      userId,
      activityType,
      description,
      metadata
    } = body;

    if (!activityType || !description) {
      return NextResponse.json(
        { error: 'Activity type and description are required' },
        { status: 400 }
      );
    }

    const activity = await prisma.saasActivityLog.create({
      data: {
        companyId,
        userId,
        activityType,
        description,
        metadata: metadata || {},
        timestamp: new Date()
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/admin/activities/summary
 * Retorna resumo de atividades por tipo
 * 🔒 Requer autenticação de superadmin
 */
export const PATCH = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Buscar atividades agrupadas por tipo
    const activities = await prisma.saasActivityLog.groupBy({
      by: ['activityType'],
      where: {
        timestamp: {
          gte: since
        }
      },
      _count: {
        activityType: true
      },
      orderBy: {
        _count: {
          activityType: 'desc'
        }
      }
    });

    const summary = activities.map(item => ({
      type: item.activityType,
      count: item._count.activityType
    }));

    return NextResponse.json({
      period: `${days} days`,
      summary
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity summary' },
      { status: 500 }
    );
  }
});

/**
 * Helper: Determina o tipo de alvo baseado no tipo de atividade
 */
function getTargetType(activityType: string): 'company' | 'user' | 'subscription' | 'system' {
  if (activityType.includes('company')) return 'company';
  if (activityType.includes('user')) return 'user';
  if (activityType.includes('subscription') || activityType.includes('payment')) return 'subscription';
  return 'system';
}
