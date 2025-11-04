/**
 * Analytics Middleware
 *
 * Rastreia automaticamente o uso da aplicação:
 * - Requisições por endpoint
 * - Tempo de resposta
 * - Erros e failures
 * - Uso por empresa/usuário
 * - Métricas de performance
 *
 * PRODUÇÃO: Integre com serviços como Google Analytics, Mixpanel,
 * Amplitude, ou Segment para analytics mais robustos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  companyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  metadata?: any;
}

/**
 * Extrai informações do usuário do token JWT
 */
function extractUserFromToken(request: NextRequest): {
  userId?: string;
  companyId?: string;
} {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return {};

    const token = authHeader.split(' ')[1] || authHeader;
    const payload = JSON.parse(atob(token.split('.')[1]));

    return {
      userId: payload.userId,
      companyId: payload.companyId
    };
  } catch {
    return {};
  }
}

/**
 * Extrai IP da requisição
 */
function extractIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Log de evento de analytics
 */
async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Em produção, enviar para serviço de analytics externo
    // await fetch('https://analytics-service.com/events', { ... })

    // Por enquanto, apenas log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[ANALYTICS]', {
        event: event.eventType,
        endpoint: event.endpoint,
        method: event.method,
        status: event.statusCode,
        time: `${event.responseTime}ms`,
        user: event.userId,
        company: event.companyId
      });
    }

    // Salvar no banco apenas eventos importantes
    if (shouldPersistEvent(event)) {
      await persistEvent(event);
    }
  } catch (error) {
    console.error('[ANALYTICS] Error logging event:', error);
  }
}

/**
 * Determina se evento deve ser persistido no banco
 */
function shouldPersistEvent(event: AnalyticsEvent): boolean {
  // Persistir apenas eventos importantes:
  // - Erros (4xx, 5xx)
  // - Requisições lentas (> 3s)
  // - Endpoints críticos (/api/admin/*, /api/auth/*)
  return (
    event.statusCode >= 400 ||
    event.responseTime > 3000 ||
    event.endpoint.startsWith('/api/admin/') ||
    event.endpoint.startsWith('/api/auth/')
  );
}

/**
 * Persiste evento no banco de dados
 * TODO: Implement proper event logging table (AuditLog or AnalyticsEvent)
 * UsageAnalytics table is for aggregated metrics, not individual events
 */
async function persistEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // TODO: Create proper AnalyticsEvent table in schema
    // For now, just log to console
    console.log('[ANALYTICS] Event:', {
      companyId: event.companyId,
      eventType: event.eventType,
      endpoint: event.endpoint
    });
  } catch (error) {
    console.error('[ANALYTICS] Error persisting event:', error);
  }
}

/**
 * Atualiza métricas de uso da empresa
 * TODO: Implement proper analytics tracking matching UsageAnalytics schema
 * Current schema has: activeUsers, projectsCreated, pointsCreated, testsPerformed, etc.
 * Not: apiCalls, lastActivity, usersActive, projectsActive
 */
async function updateCompanyMetrics(
  companyId: string,
  endpoint: string
): Promise<void> {
  try {
    // TODO: Implement proper analytics update
    // For now, just log
    console.log('[ANALYTICS] Metrics update for company:', companyId);

    // Atualizar lastActivity da empresa
    await prisma.company.update({
      where: { id: companyId },
      data: { lastActivity: new Date() }
    });
  } catch (error) {
    console.error('[ANALYTICS] Error updating company metrics:', error);
  }
}

/**
 * Middleware HOC para tracking de analytics
 *
 * Uso:
 * ```typescript
 * export const GET = withAnalytics(
 *   async (request) => {
 *     return NextResponse.json({ data: 'test' });
 *   }
 * );
 * ```
 */
export function withAnalytics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const { userId, companyId } = extractUserFromToken(request);
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    let response: NextResponse;
    let statusCode = 200;

    try {
      // Executar handler
      response = await handler(request);
      statusCode = response.status;

      return response;
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      // Calcular tempo de resposta
      const responseTime = Date.now() - startTime;

      // Log do evento
      const event: AnalyticsEvent = {
        eventType: statusCode >= 400 ? 'api_error' : 'api_request',
        userId,
        companyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: extractIP(request),
        metadata: {
          url: request.url,
          referer: request.headers.get('referer')
        }
      };

      // Log assíncrono (não bloquear resposta)
      logAnalyticsEvent(event).catch(console.error);

      // Atualizar métricas da empresa
      if (companyId) {
        updateCompanyMetrics(companyId, endpoint).catch(console.error);
      }
    }
  };
}

/**
 * Track evento customizado
 *
 * Uso em server actions:
 * ```typescript
 * await trackEvent({
 *   eventType: 'project_created',
 *   userId: user.id,
 *   companyId: user.companyId,
 *   metadata: { projectName: 'Projeto X' }
 * });
 * ```
 */
export async function trackEvent(params: {
  eventType: string;
  userId?: string;
  companyId?: string;
  metadata?: any;
}): Promise<void> {
  try {
    // TODO: Implement proper event tracking with correct schema
    // For now, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[ANALYTICS]', {
        event: params.eventType,
        user: params.userId,
        company: params.companyId
      });
    }
  } catch (error) {
    console.error('[ANALYTICS] Error tracking event:', error);
  }
}

/**
 * Track uso de feature
 */
export async function trackFeatureUsage(params: {
  feature: string;
  userId?: string;
  companyId?: string;
  metadata?: any;
}): Promise<void> {
  await trackEvent({
    eventType: `feature_used_${params.feature}`,
    userId: params.userId,
    companyId: params.companyId,
    metadata: params.metadata
  });
}

/**
 * Buscar analytics de uma empresa
 */
/**
 * TODO: Reimplement to match UsageAnalytics schema
 * Schema has: date, activeUsers, projectsCreated, pointsCreated, testsPerformed,
 * photosUploaded, storageUsed, syncOperations, loginCount, sessionDuration, topFeatures
 */
export async function getCompanyAnalytics(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  // Return mock/empty data for now
  return {
    summary: {
      totalRequests: 0,
      errorRequests: 0,
      errorRate: 0,
      avgResponseTime: 0
    },
    eventsByType: {},
    endpointUsage: {},
    events: [],
    metrics: []
  };
}

/**
 * Buscar analytics globais (superadmin)
 * TODO: Reimplement to match UsageAnalytics schema
 */
export async function getGlobalAnalytics(startDate?: Date, endDate?: Date) {
  // Return mock/empty data for now
  return {
    totalEvents: 0,
    errorEvents: 0,
    errorRate: 0,
    avgResponseTime: 0,
    topCompanies: []
  };
}
