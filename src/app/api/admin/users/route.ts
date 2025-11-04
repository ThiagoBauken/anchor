import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withSuperAdmin } from '@/middleware/admin-auth';

/**
 * GET /api/admin/users
 * Lista todos os usuários do sistema
 * 🔒 Requer autenticação de superadmin
 */
export const GET = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where = companyId ? { companyId } : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            createdProjects: true,
            teamMemberships: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remover senhas dos resultados
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/users
 * Cria um novo usuário
 * 🔒 Requer autenticação de superadmin
 */
export const POST = withSuperAdmin(async (request, user) => {
  try {
    const body = await request.json();
    const { name, email, password, role, companyId, phone } = body;

    if (!name || !password || !role || !companyId) {
      return NextResponse.json(
        { error: 'Name, password, role and companyId are required' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId,
        phone,
        active: true,
        createdAt: new Date()
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Atualizar contador de usuários da empresa
    await prisma.company.update({
      where: { id: companyId },
      data: {
        usersCount: {
          increment: 1
        }
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId,
        userId: newUser.id,
        activityType: 'user_created',
        description: `User ${name} created by admin`,
        metadata: { role }
      }
    });

    // Remover senha do resultado
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/users
 * Atualiza um usuário
 * 🔒 Requer autenticação de superadmin
 */
export const PATCH = withSuperAdmin(async (request, user) => {
  try {
    const body = await request.json();
    const { id, password, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data: any = { ...updates };

    // Se está atualizando a senha, fazer hash
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId: updatedUser.companyId,
        userId: id,
        activityType: 'user_updated',
        description: `User updated by admin`,
        metadata: { updates: Object.keys(updates) }
      }
    });

    // Remover senha do resultado
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/users
 * Desativa um usuário (soft delete)
 * 🔒 Requer autenticação de superadmin
 */
export const DELETE = withSuperAdmin(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        active: false
      }
    });

    // Decrementar contador de usuários da empresa
    await prisma.company.update({
      where: { id: deletedUser.companyId },
      data: {
        usersCount: {
          decrement: 1
        }
      }
    });

    // Log da atividade
    await prisma.saasActivityLog.create({
      data: {
        companyId: deletedUser.companyId,
        userId: id,
        activityType: 'user_deactivated',
        description: `User deactivated by admin`,
        metadata: { deactivatedAt: new Date() }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
});
