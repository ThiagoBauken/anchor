/**
 * Middleware de Autenticação para API Routes
 *
 * Fornece funções para verificar autenticação e autorização
 * em endpoints de API
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export interface AuthResult {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
  error?: string;
  status?: number;
}

// Secret para validar JWT (mesma que em sync-token)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

/**
 * Verifica se a requisição tem um usuário autenticado
 * Suporta autenticação via sessão (NextAuth) ou token JWT (para sync offline)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. Tentar autenticação via sessão (NextAuth)
    const session = await getServerSession(authOptions);

    if (session && session.user && session.user.email) {
      // Buscar dados completos do usuário do banco
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true
        }
      });

      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            companyId: user.companyId
          }
        };
      }
    }

    // 2. Tentar autenticação via token JWT (para service worker)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        if (payload.email && payload.type === 'sync') {
          // Buscar usuário do token
          const user = await prisma.user.findUnique({
            where: { email: payload.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              companyId: true
            }
          });

          if (user) {
            console.log(`[Auth] Authenticated via sync token: ${user.email}`);
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.name || '',
                role: user.role,
                companyId: user.companyId
              }
            };
          }
        }
      } catch (jwtError) {
        console.error('[Auth] Invalid JWT token:', jwtError);
        // Continue para retornar 401 abaixo
      }
    }

    // 3. Nenhuma autenticação válida encontrada
    return {
      error: 'Unauthorized: Authentication required',
      status: 401
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error in requireAuth:', error);
    return {
      error: 'Internal server error during authentication',
      status: 500
    };
  }
}

/**
 * Verifica se o usuário tem acesso a uma empresa específica
 */
export async function requireCompanyAccess(
  userId: string,
  companyId: string
): Promise<{ allowed?: boolean; error?: string; status?: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, role: true }
    });

    if (!user) {
      return {
        error: 'Forbidden: User not found',
        status: 403
      };
    }

    // Superadmin pode acessar qualquer empresa
    if (user.role === 'superadmin') {
      return { allowed: true };
    }

    // Outros usuários só podem acessar sua própria empresa
    if (user.companyId !== companyId) {
      return {
        error: 'Forbidden: Access to this company denied',
        status: 403
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[AuthMiddleware] Error in requireCompanyAccess:', error);
    return {
      error: 'Internal server error during authorization',
      status: 500
    };
  }
}

/**
 * Verifica se o usuário tem acesso a um projeto específico
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string
): Promise<{ allowed?: boolean; error?: string; status?: number }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true }
    });

    if (!project) {
      return {
        error: 'Not Found: Project not found',
        status: 404
      };
    }

    // Verificar se usuário tem acesso à empresa do projeto
    return requireCompanyAccess(userId, project.companyId);
  } catch (error) {
    console.error('[AuthMiddleware] Error in requireProjectAccess:', error);
    return {
      error: 'Internal server error during authorization',
      status: 500
    };
  }
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function requireRole(
  userId: string,
  allowedRoles: string[]
): Promise<{ allowed?: boolean; error?: string; status?: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return {
        error: 'Forbidden: User not found',
        status: 403
      };
    }

    if (!allowedRoles.includes(user.role)) {
      return {
        error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`,
        status: 403
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[AuthMiddleware] Error in requireRole:', error);
    return {
      error: 'Internal server error during authorization',
      status: 500
    };
  }
}
