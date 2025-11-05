/**
 * Sync Token Endpoint
 *
 * Gera um token de curta duração para permitir que o service worker
 * sincronize dados offline sem ter acesso aos cookies de sessão
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT } from 'jose';

// Secret para assinar JWT (use uma variável de ambiente em produção)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar se usuário está autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const { expiresInHours = 24 } = await request.json();

    // 2. Gerar token JWT de curta duração
    const token = await new SignJWT({
      email: session.user.email,
      type: 'sync',
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${expiresInHours}h`)
      .setIssuedAt()
      .sign(JWT_SECRET);

    console.log(`[SyncToken] Generated sync token for ${session.user.email}, expires in ${expiresInHours}h`);

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('[SyncToken] Error generating sync token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
