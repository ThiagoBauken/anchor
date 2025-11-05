/**
 * Sync Token Endpoint
 *
 * Gera um token de curta duração para permitir que o service worker
 * sincronize dados offline sem ter acesso aos cookies de sessão
 *
 * Suporta AMBOS os sistemas de autenticação:
 * 1. NextAuth (Google OAuth + Credentials)
 * 2. JWT manual com cookies (auth.ts server actions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT } from 'jose';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Secret para assinar JWT (use uma variável de ambiente em produção)
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function POST(request: NextRequest) {
  try {
    let userEmail: string | null = null;
    let userId: string | null = null;
    let userRole: string | null = null;
    let companyId: string | null = null;

    // 1. Try NextAuth session first
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        userEmail = session.user.email;
        userId = session.user.id;
        userRole = session.user.role;
        companyId = session.user.companyId;
        console.log('[SyncToken] Using NextAuth session for', userEmail);
      }
    } catch (nextAuthError) {
      console.log('[SyncToken] NextAuth not available, trying JWT cookie');
    }

    // 2. If no NextAuth session, try JWT cookie (manual auth)
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth-token');

        if (authToken?.value) {
          const decoded = jwt.verify(authToken.value, JWT_SECRET_STRING) as any;

          if (decoded?.email) {
            userEmail = decoded.email;
            userId = decoded.id;
            userRole = decoded.role;
            companyId = decoded.companyId;
            console.log('[SyncToken] Using JWT cookie for', userEmail);
          }
        }
      } catch (jwtError) {
        console.log('[SyncToken] JWT cookie verification failed');
      }
    }

    // 3. Check if authenticated
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Parse request body (optional params)
    let expiresInHours = 24;
    try {
      const body = await request.json();
      expiresInHours = body.expiresInHours || 24;
    } catch {
      // Body is optional, use default
    }

    // 4. Generate JWT token for PWA (NOT httpOnly)
    const token = await new SignJWT({
      email: userEmail,
      id: userId,
      role: userRole,
      companyId: companyId,
      type: 'sync',
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${expiresInHours}h`)
      .setIssuedAt()
      .sign(JWT_SECRET);

    console.log(`[SyncToken] Generated sync token for ${userEmail}, expires in ${expiresInHours}h`);

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
