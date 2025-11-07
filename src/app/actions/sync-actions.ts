// Server Actions para Sincronização Offline -> Online
// Este arquivo gerencia a sincronização dos dados offline para o PostgreSQL

"use server";

import { prisma } from '@/lib/prisma';
import { AnchorPoint, AnchorTest } from '@/types';
import { requireAuthentication, requireCompanyMatch, logAction } from '@/lib/auth-helpers';

// Sincronizar pontos de ancoragem do offline para o banco
export async function syncAnchorPoints(offlinePoints: any[]) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Verify all points belong to projects in the user's company
  const projectIds = [...new Set(offlinePoints.map(p => p.projectId))];
  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds }
    },
    select: { id: true, companyId: true }
  });

  // Check all projects belong to user's company
  for (const project of projects) {
    await requireCompanyMatch(user.id, project.companyId);
  }

  // Log action
  logAction('SYNC_ANCHOR_POINTS', user.id, {
    pointCount: offlinePoints.length,
    projectIds
  });

  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const point of offlinePoints) {
    try {
      // Remove campos do localStorage que não existem no banco
      const { syncStatus, ...pointData } = point;
      
      // Verifica se já existe (por ID local ou número do ponto)
      const existing = await prisma.anchorPoint.findFirst({
        where: {
          OR: [
            { id: point.id },
            { 
              projectId: point.projectId,
              numeroPonto: point.numeroPonto 
            }
          ]
        }
      });

      if (existing) {
        // Atualiza se já existe
        await prisma.anchorPoint.update({
          where: { id: existing.id },
          data: {
            ...pointData,
            id: existing.id // Mantém o ID do servidor
          }
        });
      } else {
        // Cria novo se não existe
        await prisma.anchorPoint.create({
          data: {
            ...pointData,
            id: point.id || undefined // Usa o ID local ou deixa o banco gerar
          }
        });
      }
      
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Ponto ${point.numeroPonto}: ${error}`);
    }
  }

  return results;
}

// Sincronizar testes de ancoragem
export async function syncAnchorTests(offlineTests: any[]) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Verify all tests belong to anchor points in the user's company
  const anchorPointIds = [...new Set(offlineTests.map(t => t.pontoId))];
  const anchorPoints = await prisma.anchorPoint.findMany({
    where: {
      id: { in: anchorPointIds }
    },
    include: {
      project: {
        select: { companyId: true }
      }
    }
  });

  // Check all anchor points belong to user's company
  for (const point of anchorPoints) {
    await requireCompanyMatch(user.id, point.project.companyId);
  }

  // Log action
  logAction('SYNC_ANCHOR_TESTS', user.id, {
    testCount: offlineTests.length,
    anchorPointIds
  });

  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const test of offlineTests) {
    try {
      const { syncStatus, ...testData } = test;
      
      // Verifica se o teste já existe
      const existing = await prisma.anchorTest.findFirst({
        where: { id: test.id }
      });

      if (existing) {
        await prisma.anchorTest.update({
          where: { id: existing.id },
          data: testData
        });
      } else {
        await prisma.anchorTest.create({
          data: {
            ...testData,
            id: test.id || undefined
          }
        });
      }
      
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Teste ${test.id}: ${error}`);
    }
  }

  return results;
}

// Sincronizar fotos (base64)
export async function syncPhotos(offlinePhotos: any[]) {
  // Authentication and authorization
  const user = await requireAuthentication();

  // Verify all photos belong to the user's company
  const companyIds = [...new Set(offlinePhotos.map(p => p.companyId).filter(Boolean))];
  for (const companyId of companyIds) {
    await requireCompanyMatch(user.id, companyId);
  }

  // Log action
  logAction('SYNC_PHOTOS', user.id, {
    photoCount: offlinePhotos.length
  });

  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const photo of offlinePhotos) {
    try {
      // Salva foto como arquivo no banco
      await prisma.file.create({
        data: {
          id: photo.id || undefined,
          filename: photo.filename || `photo_${Date.now()}.jpg`,
          originalName: photo.originalName || 'photo.jpg',
          mimeType: 'image/jpeg',
          size: photo.size || 0,
          url: photo.data, // Base64 data URL
          uploaded: true,
          companyId: photo.companyId,
          userId: photo.userId
        }
      });
      
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Foto ${photo.id}: ${error}`);
    }
  }

  return results;
}

// Buscar dados do servidor para cachear offline
export async function fetchDataForOffline(companyId: string, projectId?: string) {
  // Authentication and authorization
  const user = await requireAuthentication();
  await requireCompanyMatch(user.id, companyId);

  // If projectId provided, verify it belongs to the company
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.companyId !== companyId) {
      throw new Error('Project does not belong to the specified company');
    }
  }

  // Log action
  logAction('FETCH_DATA_FOR_OFFLINE', user.id, {
    companyId,
    projectId
  });

  try {
    // Busca todos os dados necessários para trabalhar offline
    const [company, users, projects, locations] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId }
      }),
      prisma.user.findMany({
        where: { companyId }
      }),
      prisma.project.findMany({
        where: { companyId }
      }),
      prisma.location.findMany({
        where: { companyId }
      })
    ]);

    // Se tiver projeto específico, busca pontos e testes
    let points = [];
    let tests = [];
    
    if (projectId) {
      points = await prisma.anchorPoint.findMany({
        where: { projectId }
      });
      
      const pointIds = points.map(p => p.id);
      tests = await prisma.anchorTest.findMany({
        where: { pontoId: { in: pointIds } }
      });
    }

    return {
      company,
      users,
      projects,
      locations,
      points,
      tests,
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar dados para offline:', error);
    throw error;
  }
}

// Verificar status de sincronização
export async function checkSyncStatus(lastSyncTime: string, companyId: string) {
  // Authentication and authorization
  const user = await requireAuthentication();
  await requireCompanyMatch(user.id, companyId);

  try {
    // Conta quantos registros foram modificados após última sync na company do usuário
    const projectIds = (await prisma.project.findMany({
      where: { companyId },
      select: { id: true }
    })).map(p => p.id);

    const [pointsToSync, testsToSync] = await Promise.all([
      prisma.anchorPoint.count({
        where: {
          projectId: { in: projectIds },
          dataHora: { gt: new Date(lastSyncTime) }
        }
      }),
      prisma.anchorTest.count({
        where: {
          dataHora: { gt: new Date(lastSyncTime) }
        }
      })
    ]);

    return {
      hasUpdates: pointsToSync > 0 || testsToSync > 0,
      pointsToSync,
      testsToSync,
      serverTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao verificar status de sync:', error);
    return {
      hasUpdates: false,
      error: error.message
    };
  }
}

// Registrar atividade de sincronização
export async function logSyncActivity(
  userId: string,
  companyId: string,
  details: any
) {
  // Authentication and authorization
  const user = await requireAuthentication();
  await requireCompanyMatch(user.id, companyId);

  // Verify the userId matches the authenticated user (users can only log their own activity)
  if (user.id !== userId) {
    throw new Error('Cannot log activity for another user');
  }

  try {
    await prisma.saasActivityLog.create({
      data: {
        companyId,
        userId,
        activityType: 'sync',
        description: `Sincronização de dados offline`,
        metadata: details
      }
    });
  } catch (error) {
    console.error('Erro ao registrar atividade de sync:', error);
  }
}