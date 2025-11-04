/**
 * Admin Authentication Middleware
 *
 * Protege rotas administrativas verificando:
 * 1. Usuário está autenticado
 * 2. Usuário tem role = 'superadmin'
 * 3. Token é válido
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Extrai e valida o token JWT do header Authorization
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Suporta "Bearer TOKEN" ou apenas "TOKEN"
  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];

  return token;
}

/**
 * Valida o token JWT e retorna o payload
 */
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return null;
  }
}

/**
 * Busca o usuário no banco de dados
 */
async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true
      }
    });

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      role: user.role,
      companyId: user.companyId,
      company: user.company as any,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      phone: user.phone || undefined
    };
  } catch (error) {
    console.error('[AUTH] Error fetching user:', error);
    return null;
  }
}

/**
 * Middleware principal: Requer autenticação de superadmin
 *
 * @throws Error 401 se não autenticado
 * @throws Error 403 se não for superadmin
 * @returns User object se autenticado
 */
export async function requireSuperAdmin(request: NextRequest): Promise<User> {
  // Extrair token
  const token = extractToken(request);

  if (!token) {
    throw new Error('UNAUTHORIZED: No authentication token provided');
  }

  // Validar token
  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('UNAUTHORIZED: Invalid or expired token');
  }

  // Buscar usuário
  const user = await getUserById(payload.userId);

  if (!user) {
    throw new Error('UNAUTHORIZED: User not found or inactive');
  }

  // Verificar role
  if (user.role !== 'superadmin') {
    throw new Error('FORBIDDEN: Superadmin access required');
  }

  return user;
}

/**
 * Middleware alternativo: Requer qualquer admin (superadmin ou company_admin)
 */
export async function requireAdmin(request: NextRequest): Promise<User> {
  const token = extractToken(request);

  if (!token) {
    throw new Error('UNAUTHORIZED: No authentication token provided');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('UNAUTHORIZED: Invalid or expired token');
  }

  const user = await getUserById(payload.userId);

  if (!user) {
    throw new Error('UNAUTHORIZED: User not found or inactive');
  }

  if (user.role !== 'superadmin' && user.role !== 'company_admin') {
    throw new Error('FORBIDDEN: Admin access required');
  }

  return user;
}

/**
 * Middleware para autenticação opcional
 * Retorna user se autenticado, null se não
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = extractToken(request);

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    return await getUserById(payload.userId);
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Cria resposta de erro padronizada
 */
export function createAuthErrorResponse(error: Error): NextResponse {
  const message = error.message;

  if (message.includes('UNAUTHORIZED')) {
    return NextResponse.json(
      { error: message.replace('UNAUTHORIZED: ', '') },
      { status: 401 }
    );
  }

  if (message.includes('FORBIDDEN')) {
    return NextResponse.json(
      { error: message.replace('FORBIDDEN: ', '') },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: 'Authentication failed' },
    { status: 500 }
  );
}

/**
 * Helper: Wrapper para rotas protegidas
 *
 * Uso:
 * export const GET = withSuperAdmin(async (request, user) => {
 *   // user está garantido como superadmin aqui
 *   return NextResponse.json({ data: 'protected' });
 * });
 */
export function withSuperAdmin(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireSuperAdmin(request);
      return await handler(request, user);
    } catch (error) {
      return createAuthErrorResponse(error as Error);
    }
  };
}

/**
 * Helper: Wrapper para rotas que requerem qualquer admin
 */
export function withAdmin(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAdmin(request);
      return await handler(request, user);
    } catch (error) {
      return createAuthErrorResponse(error as Error);
    }
  };
}
