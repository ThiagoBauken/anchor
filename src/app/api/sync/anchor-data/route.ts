import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireProjectAccess } from '@/middleware/auth-middleware';

const prisma = new PrismaClient();

/**
 * POST /api/sync/anchor-data
 *
 * Sincroniza dados de pontos e testes criados offline
 * Este endpoint processa dados que foram criados no localStorage
 * e precisam ser salvos no banco quando o usuário ficar online
 *
 * Body esperado:
 * {
 *   anchorPoints: AnchorPoint[],
 *   anchorTests: AnchorTest[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTENTICAÇÃO
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const { user } = authResult;
    console.log(`[Sync AnchorData] Authenticated user: ${user!.email}`);

    const body = await request.json();
    const { anchorPoints, anchorTests } = body;

    const results = {
      pointsSaved: 0,
      testsSaved: 0,
      errors: [] as string[]
    };

    // 2. VERIFICAR ACESSO AOS PROJETOS
    const projectIds = new Set<string>();
    if (anchorPoints && Array.isArray(anchorPoints)) {
      anchorPoints.forEach(point => {
        if (point.projectId) projectIds.add(point.projectId);
      });
    }
    if (anchorTests && Array.isArray(anchorTests)) {
      for (const test of anchorTests) {
        // Buscar projectId do ponto de ancoragem
        if (test.anchorPointId) {
          const point = await prisma.anchorPoint.findUnique({
            where: { id: test.anchorPointId },
            select: { projectId: true }
          });
          if (point?.projectId) projectIds.add(point.projectId);
        }
      }
    }

    // Verificar acesso a cada projeto
    for (const projectId of projectIds) {
      const accessCheck = await requireProjectAccess(user!.id, projectId);
      if (accessCheck.error) {
        return NextResponse.json(
          { error: `${accessCheck.error} (Project: ${projectId})` },
          { status: accessCheck.status || 403 }
        );
      }
    }

    console.log(`[Sync AnchorData] User ${user!.email} has access to ${projectIds.size} project(s)`);

    // Processa pontos de ancoragem
    if (anchorPoints && Array.isArray(anchorPoints)) {
      for (const point of anchorPoints) {
        try {
          // Upsert: cria se não existe, atualiza se existe
          await prisma.anchorPoint.upsert({
            where: { id: point.id },
            update: {
              numeroPonto: point.numeroPonto,
              localizacao: point.localizacao,
              foto: point.foto,
              numeroLacre: point.numeroLacre,
              tipoEquipamento: point.tipoEquipamento,
              dataInstalacao: point.dataInstalacao,
              frequenciaInspecaoMeses: point.frequenciaInspecaoMeses ? parseInt(point.frequenciaInspecaoMeses) : null,
              observacoes: point.observacoes,
              posicaoX: parseFloat(point.posicaoX) || 0,
              posicaoY: parseFloat(point.posicaoY) || 0,
              status: point.status,
              archived: point.archived || false,
              lastModifiedByUserId: point.lastModifiedByUserId
            },
            create: {
              id: point.id,
              projectId: point.projectId,
              numeroPonto: point.numeroPonto,
              localizacao: point.localizacao,
              foto: point.foto,
              numeroLacre: point.numeroLacre,
              tipoEquipamento: point.tipoEquipamento,
              dataInstalacao: point.dataInstalacao,
              frequenciaInspecaoMeses: point.frequenciaInspecaoMeses ? parseInt(point.frequenciaInspecaoMeses) : null,
              observacoes: point.observacoes,
              posicaoX: parseFloat(point.posicaoX) || 0,
              posicaoY: parseFloat(point.posicaoY) || 0,
              status: point.status || 'Não Testado',
              archived: point.archived || false,
              createdByUserId: point.createdByUserId,
              lastModifiedByUserId: point.lastModifiedByUserId
            }
          });

          results.pointsSaved++;
        } catch (error) {
          results.errors.push(`Error saving point ${point.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Processa testes
    if (anchorTests && Array.isArray(anchorTests)) {
      for (const test of anchorTests) {
        try {
          // Upsert: cria se não existe, atualiza se existe
          await prisma.anchorTest.upsert({
            where: { id: test.id },
            update: {
              resultado: test.resultado,
              carga: test.carga,
              tempo: test.tempo,
              tecnico: test.tecnico,
              observacoes: test.observacoes,
              fotoTeste: test.fotoTeste,
              fotoPronto: test.fotoPronto,
              dataFotoPronto: test.dataFotoPronto
            },
            create: {
              id: test.id,
              pontoId: test.pontoId,
              dataHora: test.dataHora ? new Date(test.dataHora) : new Date(),
              resultado: test.resultado,
              carga: test.carga,
              tempo: test.tempo,
              tecnico: test.tecnico,
              observacoes: test.observacoes,
              fotoTeste: test.fotoTeste,
              fotoPronto: test.fotoPronto,
              dataFotoPronto: test.dataFotoPronto
            }
          });

          results.testsSaved++;
        } catch (error) {
          results.errors.push(`Error saving test ${test.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`[Sync] Data sync completed: ${results.pointsSaved} points, ${results.testsSaved} tests`);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Sync] Error syncing anchor data:', error);
    return NextResponse.json(
      { error: 'Failed to sync anchor data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/anchor-data?projectId=xxx&lastSync=ISO_TIMESTAMP
 *
 * Busca dados atualizados desde a última sincronização
 * Usado para pull de dados do servidor para o cliente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const lastSync = searchParams.get('lastSync');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Buscar pontos e testes atualizados desde lastSync
    const anchorPoints = await prisma.anchorPoint.findMany({
      where: {
        projectId,
        dataHora: { gte: lastSyncDate }
      },
      include: {
        anchorTests: true
      }
    });

    // Buscar testes separadamente (caso tenham sido atualizados mas o ponto não)
    const anchorTests = await prisma.anchorTest.findMany({
      where: {
        anchorPoint: { projectId },
        dataHora: { gte: lastSyncDate }
      }
    });

    return NextResponse.json({
      success: true,
      anchorPoints,
      anchorTests,
      syncTimestamp: new Date().toISOString(),
      counts: {
        points: anchorPoints.length,
        tests: anchorTests.length
      }
    });

  } catch (error) {
    console.error('[Sync] Error fetching anchor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anchor data' },
      { status: 500 }
    );
  }
}
