import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/middleware/admin-auth';

/**
 * GET /api/admin/plans
 * Lista todos os planos de assinatura
 * 🔒 Requer autenticação de superadmin
 */
export const GET = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where = activeOnly ? { active: true } : {};

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatar para o tipo SubscriptionPlan esperado pelo frontend
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.priceMonthly),
      billingCycle: 'monthly' as const,
      features: Array.isArray(plan.features)
        ? plan.features as string[]
        : Object.keys(plan.features || {}),
      limits: {
        maxUsers: plan.maxUsers || 0,
        maxProjects: plan.maxProjects || 0,
        maxStorage: (plan.maxStorageGb || 10) * 1024, // Convert GB to MB
        supportLevel: 'basic' as const
      },
      isActive: plan.active,
      displayOrder: 0,
      subscriptionCount: (plan as any)._count?.subscriptions || 0
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/plans
 * Cria um novo plano de assinatura
 * 🔒 Requer autenticação de superadmin
 */
export const POST = withSuperAdmin(async (request, user) => {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      priceMonthly,
      priceYearly,
      maxUsers,
      maxProjects,
      maxPoints,
      maxStorageGb,
      features
    } = body;

    if (!id || !name || !priceMonthly) {
      return NextResponse.json(
        { error: 'ID, name and priceMonthly are required' },
        { status: 400 }
      );
    }

    // Verificar se ID já existe
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Plan ID already exists' },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        id,
        name,
        description,
        priceMonthly,
        priceYearly,
        maxUsers,
        maxProjects,
        maxPoints,
        maxStorageGb: maxStorageGb || 10,
        features: features || {},
        active: true,
        createdAt: new Date()
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/plans
 * Atualiza um plano de assinatura
 * 🔒 Requer autenticação de superadmin
 */
export const PATCH = withSuperAdmin(async (request, user) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/plans
 * Desativa um plano de assinatura (soft delete)
 * 🔒 Requer autenticação de superadmin
 */
export const DELETE = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Verificar se há assinaturas ativas usando este plano
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: 'active'
      }
    });

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan with ${activeSubscriptions} active subscriptions`,
          activeSubscriptions
        },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        active: false
      }
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
});
