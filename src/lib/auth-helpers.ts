/**
 * Authentication Helpers para Server Actions
 *
 * Fornece funções para verificar autenticação e autorização
 * em server actions (funções 'use server')
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { User } from '@/types';

/**
 * Busca o usuário autenticado da sessão atual
 * Retorna null se não houver sessão
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role as any,
      companyId: user.companyId,
      company: user.company as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    } as User;
  } catch (error) {
    console.error('[AuthHelpers] Error in getAuthenticatedUser:', error);
    return null;
  }
}

/**
 * Requer que o usuário esteja autenticado
 * Lança erro se não estiver
 */
export async function requireAuthentication(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Authentication required. Please log in.');
  }

  return user;
}

/**
 * Verifica se o usuário tem acesso à empresa especificada
 * Lança erro se não tiver acesso
 */
export async function requireCompanyMatch(
  userId: string,
  resourceCompanyId: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, role: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Superadmin pode acessar qualquer empresa
  if (user.role === 'superadmin') {
    return;
  }

  // Outros usuários só podem acessar sua própria empresa
  if (user.companyId !== resourceCompanyId) {
    throw new Error('Access denied: Company mismatch');
  }
}

/**
 * Verifica se o usuário tem acesso a um projeto
 * Lança erro se não tiver acesso
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { companyId: true }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await requireCompanyMatch(userId, project.companyId);
}

/**
 * Verifica se o usuário tem uma das roles permitidas
 * Lança erro se não tiver
 */
export async function requireRole(
  user: User,
  allowedRoles: string[]
): Promise<void> {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Access denied: Requires one of these roles: ${allowedRoles.join(', ')}`
    );
  }
}

/**
 * Verifica se o recurso pertence ao usuário
 * Útil para operações de update/delete
 */
export async function requireOwnership(
  userId: string,
  resourceUserId: string | null | undefined
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Superadmin pode editar/deletar qualquer coisa
  if (user?.role === 'superadmin') {
    return;
  }

  if (resourceUserId !== userId) {
    throw new Error('Access denied: You can only modify your own resources');
  }
}

/**
 * Helper para log de auditoria
 * Registra ações importantes no console (pode ser expandido para BD)
 */
export function logAction(
  action: string,
  userId: string,
  details?: Record<string, any>
): void {
  console.log(`[Audit] ${action}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
}
