/**
 * Rate Limiting Middleware
 *
 * Protege APIs contra abuso limitando número de requisições por IP/usuário
 *
 * PRODUÇÃO: Considere usar Redis para distributed rate limiting
 * DESENVOLVIMENTO: Usa in-memory store (resetado ao reiniciar servidor)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis em produção)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  /** Número máximo de requisições permitidas */
  maxRequests: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
  /** Mensagem customizada de erro */
  message?: string;
}

/**
 * Configurações pré-definidas de rate limit
 */
export const RATE_LIMIT_PRESETS = {
  /** Strict: 10 req/min - Para operações sensíveis (criação de recursos) */
  STRICT: { maxRequests: 10, windowSeconds: 60 },

  /** Moderate: 30 req/min - Para APIs administrativas */
  MODERATE: { maxRequests: 30, windowSeconds: 60 },

  /** Relaxed: 100 req/min - Para leitura de dados */
  RELAXED: { maxRequests: 100, windowSeconds: 60 },

  /** Auth: 5 req/15min - Para login/registro */
  AUTH: { maxRequests: 5, windowSeconds: 900 },
} as const;

/**
 * Limpa entradas expiradas do store (executado periodicamente)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Extrai identificador único da requisição
 * Usa userId se autenticado, caso contrário usa IP
 */
function getIdentifier(request: NextRequest): string {
  // Tentar extrair userId do token (se autenticado)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1] || authHeader;
      // Parse básico do JWT (não valida, apenas extrai userId)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) {
        return `user:${payload.userId}`;
      }
    } catch {
      // Ignorar erro de parse, usar IP
    }
  }

  // Usar IP como fallback
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Verifica se requisição excede o rate limit
 * @returns true se excedeu o limite
 */
export function isRateLimited(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; retryAfter?: number; remaining?: number } {
  const now = Date.now();
  const key = `${identifier}:${config.windowSeconds}`;

  // Se não existe ou expirou, criar nova entrada
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowSeconds * 1000
    };
    return {
      limited: false,
      remaining: config.maxRequests - 1
    };
  }

  // Incrementar contador
  store[key].count++;

  // Verificar se excedeu o limite
  if (store[key].count > config.maxRequests) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return {
      limited: true,
      retryAfter
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - store[key].count
  };
}

/**
 * Middleware HOC para aplicar rate limiting em rotas
 *
 * Uso:
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request) => { ... },
 *   RATE_LIMIT_PRESETS.STRICT
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.MODERATE
) {
  return async (request: NextRequest) => {
    const identifier = getIdentifier(request);
    const { limited, retryAfter, remaining } = isRateLimited(identifier, config);

    if (limited) {
      return NextResponse.json(
        {
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + (retryAfter || 60) * 1000).toString()
          }
        }
      );
    }

    // Adicionar headers de rate limit à resposta
    const response = await handler(request);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining?.toString() || '0');

    return response;
  };
}

/**
 * Combina rate limiting com autenticação
 * Ordem: Rate Limit → Auth
 *
 * Uso:
 * ```typescript
 * export const POST = withRateLimitAndAuth(
 *   async (request, user) => { ... },
 *   RATE_LIMIT_PRESETS.STRICT
 * );
 * ```
 */
export function withRateLimitAndAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.MODERATE
) {
  return async (request: NextRequest) => {
    // Primeiro, verificar rate limit
    const identifier = getIdentifier(request);
    const { limited, retryAfter, remaining } = isRateLimited(identifier, config);

    if (limited) {
      return NextResponse.json(
        {
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Depois, aplicar autenticação
    const { withSuperAdmin } = await import('./admin-auth');
    const wrappedHandler = withSuperAdmin(handler);
    const response = await wrappedHandler(request);

    // Adicionar headers de rate limit
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining?.toString() || '0');

    return response;
  };
}

/**
 * Reseta o contador de rate limit para um identificador
 * Útil para testes ou casos especiais
 */
export function resetRateLimit(identifier: string) {
  Object.keys(store).forEach(key => {
    if (key.startsWith(identifier)) {
      delete store[key];
    }
  });
}

/**
 * Retorna estatísticas do rate limiter
 * Útil para monitoramento
 */
export function getRateLimitStats() {
  return {
    totalKeys: Object.keys(store).length,
    entries: Object.entries(store).map(([key, value]) => ({
      key,
      count: value.count,
      resetIn: Math.max(0, Math.ceil((value.resetTime - Date.now()) / 1000))
    }))
  };
}
