"use server";

import { prisma } from '@/lib/prisma';
import { AnchorPoint, AnchorTest } from '@/types';

// =====================================
// ANCHOR POINTS ACTIONS
// =====================================

// Buscar pontos de ancoragem de um projeto
export async function getAnchorPointsForProject(projectId: string) {
  try {
    const points = await prisma.anchorPoint.findMany({
      where: { 
        projectId,
        archived: false 
      },
      orderBy: { numeroPonto: 'asc' }
    });
    
    return points.map(point => ({
      ...point,
      posicaoX: Number(point.posicaoX),
      posicaoY: Number(point.posicaoY),
      frequenciaInspecaoMeses: point.frequenciaInspecaoMeses || undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    return [];
  }
}

// Buscar pontos arquivados
export async function getArchivedAnchorPointsForProject(projectId: string) {
  try {
    const points = await prisma.anchorPoint.findMany({
      where: { 
        projectId,
        archived: true 
      },
      orderBy: { archivedAt: 'desc' }
    });
    
    return points.map(point => ({
      ...point,
      posicaoX: Number(point.posicaoX),
      posicaoY: Number(point.posicaoY),
      frequenciaInspecaoMeses: point.frequenciaInspecaoMeses || undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar pontos arquivados:', error);
    return [];
  }
}

// Adicionar novo ponto de ancoragem
export async function addAnchorPoint(pointData: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>, userId?: string) {
  try {
    const newPoint = await prisma.anchorPoint.create({
      data: {
        ...pointData,
        posicaoX: Number(pointData.posicaoX),
        posicaoY: Number(pointData.posicaoY),
        status: 'Não Testado',
        createdByUserId: userId,
        lastModifiedByUserId: userId,
        archived: false,
        dataHora: new Date(),
        frequenciaInspecaoMeses: pointData.frequenciaInspecaoMeses || null
      }
    });

    return {
      ...newPoint,
      posicaoX: Number(newPoint.posicaoX),
      posicaoY: Number(newPoint.posicaoY),
      frequenciaInspecaoMeses: newPoint.frequenciaInspecaoMeses || undefined
    };
  } catch (error) {
    console.error('Erro ao adicionar ponto:', error);
    throw new Error('Falha ao adicionar ponto de ancoragem');
  }
}

// Atualizar ponto de ancoragem
export async function updateAnchorPoint(pointId: string, updates: Partial<AnchorPoint>, userId?: string) {
  try {
    const updatedPoint = await prisma.anchorPoint.update({
      where: { id: pointId },
      data: {
        ...updates,
        posicaoX: updates.posicaoX ? Number(updates.posicaoX) : undefined,
        posicaoY: updates.posicaoY ? Number(updates.posicaoY) : undefined,
        lastModifiedByUserId: userId,
        frequenciaInspecaoMeses: updates.frequenciaInspecaoMeses || null
      }
    });

    return {
      ...updatedPoint,
      posicaoX: Number(updatedPoint.posicaoX),
      posicaoY: Number(updatedPoint.posicaoY),
      frequenciaInspecaoMeses: updatedPoint.frequenciaInspecaoMeses || undefined
    };
  } catch (error) {
    console.error('Erro ao atualizar ponto:', error);
    throw new Error('Falha ao atualizar ponto de ancoragem');
  }
}

// Arquivar ponto de ancoragem (soft delete)
export async function archiveAnchorPoint(pointId: string, userId?: string) {
  try {
    const archivedPoint = await prisma.anchorPoint.update({
      where: { id: pointId },
      data: {
        archived: true,
        archivedAt: new Date(),
        lastModifiedByUserId: userId
      }
    });

    return archivedPoint;
  } catch (error) {
    console.error('Erro ao arquivar ponto:', error);
    throw new Error('Falha ao arquivar ponto de ancoragem');
  }
}

// Restaurar ponto arquivado
export async function restoreAnchorPoint(pointId: string, userId?: string) {
  try {
    const restoredPoint = await prisma.anchorPoint.update({
      where: { id: pointId },
      data: {
        archived: false,
        archivedAt: null,
        lastModifiedByUserId: userId
      }
    });

    return restoredPoint;
  } catch (error) {
    console.error('Erro ao restaurar ponto:', error);
    throw new Error('Falha ao restaurar ponto de ancoragem');
  }
}

// =====================================
// ANCHOR TESTS ACTIONS
// =====================================

// Buscar testes de um ponto específico
export async function getAnchorTestsForPoint(pointId: string) {
  try {
    const tests = await prisma.anchorTest.findMany({
      where: { pontoId: pointId },
      orderBy: { dataHora: 'desc' }
    });
    
    return tests;
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    return [];
  }
}

// Buscar todos os testes de um projeto
export async function getAnchorTestsForProject(projectId: string) {
  try {
    const tests = await prisma.anchorTest.findMany({
      where: {
        anchorPoint: {
          projectId: projectId
        }
      },
      include: {
        anchorPoint: {
          select: {
            numeroPonto: true,
            localizacao: true
          }
        }
      },
      orderBy: { dataHora: 'desc' }
    });
    
    return tests;
  } catch (error) {
    console.error('Erro ao buscar testes do projeto:', error);
    return [];
  }
}

// Adicionar novo teste
export async function addAnchorTest(testData: Omit<AnchorTest, 'id' | 'dataHora'>) {
  try {
    const newTest = await prisma.anchorTest.create({
      data: {
        ...testData,
        dataHora: new Date()
      }
    });

    // Atualizar status do ponto automaticamente
    await prisma.anchorPoint.update({
      where: { id: testData.pontoId },
      data: { 
        status: testData.resultado,
        lastModifiedByUserId: testData.pontoId // Assume que o técnico que testou é quem modificou
      }
    });

    return newTest;
  } catch (error) {
    console.error('Erro ao adicionar teste:', error);
    throw new Error('Falha ao adicionar teste de ancoragem');
  }
}

// Atualizar teste existente
export async function updateAnchorTest(testId: string, updates: Partial<AnchorTest>) {
  try {
    const updatedTest = await prisma.anchorTest.update({
      where: { id: testId },
      data: updates
    });

    // Se mudou o resultado, atualizar status do ponto
    if (updates.resultado) {
      await prisma.anchorPoint.update({
        where: { id: updatedTest.pontoId },
        data: { status: updates.resultado }
      });
    }

    return updatedTest;
  } catch (error) {
    console.error('Erro ao atualizar teste:', error);
    throw new Error('Falha ao atualizar teste de ancoragem');
  }
}

// =====================================
// SYNC FUNCTIONS
// =====================================

// Sincronizar pontos do localStorage para o banco
export async function syncPointsFromLocalStorage(localPoints: AnchorPoint[], userId?: string) {
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const point of localPoints) {
    try {
      // Verifica se o ponto já existe
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
            localizacao: point.localizacao,
            foto: point.foto,
            numeroLacre: point.numeroLacre,
            tipoEquipamento: point.tipoEquipamento,
            dataInstalacao: point.dataInstalacao,
            frequenciaInspecaoMeses: point.frequenciaInspecaoMeses || null,
            observacoes: point.observacoes,
            posicaoX: Number(point.posicaoX),
            posicaoY: Number(point.posicaoY),
            status: point.status,
            archived: point.archived || false,
            archivedAt: point.archivedAt ? new Date(point.archivedAt) : null,
            lastModifiedByUserId: userId
          }
        });
      } else {
        // Cria novo se não existe
        await prisma.anchorPoint.create({
          data: {
            id: point.id,
            projectId: point.projectId,
            numeroPonto: point.numeroPonto,
            localizacao: point.localizacao,
            foto: point.foto,
            numeroLacre: point.numeroLacre,
            tipoEquipamento: point.tipoEquipamento,
            dataInstalacao: point.dataInstalacao,
            frequenciaInspecaoMeses: point.frequenciaInspecaoMeses || null,
            observacoes: point.observacoes,
            posicaoX: Number(point.posicaoX),
            posicaoY: Number(point.posicaoY),
            dataHora: point.dataHora ? new Date(point.dataHora) : new Date(),
            status: point.status || 'Não Testado',
            createdByUserId: userId,
            lastModifiedByUserId: userId,
            archived: point.archived || false,
            archivedAt: point.archivedAt ? new Date(point.archivedAt) : null
          }
        });
      }
      
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Ponto ${point.numeroPonto}: ${error}`);
      console.error(`Erro ao sincronizar ponto ${point.numeroPonto}:`, error);
    }
  }

  return results;
}

// Sincronizar testes do localStorage para o banco
export async function syncTestsFromLocalStorage(localTests: AnchorTest[]) {
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const test of localTests) {
    try {
      // Verifica se o teste já existe
      const existing = await prisma.anchorTest.findFirst({
        where: { id: test.id }
      });

      if (existing) {
        // Atualiza se já existe
        await prisma.anchorTest.update({
          where: { id: existing.id },
          data: {
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
      } else {
        // Cria novo se não existe
        await prisma.anchorTest.create({
          data: {
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
      }
      
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Teste ${test.id}: ${error}`);
      console.error(`Erro ao sincronizar teste ${test.id}:`, error);
    }
  }

  return results;
}

// Buscar dados completos para cache offline
export async function fetchDataForOfflineCache(companyId: string, projectId?: string) {
  try {
    const baseData = {
      users: await prisma.user.findMany({
        where: { companyId }
      }),
      projects: await prisma.project.findMany({
        where: { companyId }
      }),
      locations: await prisma.location.findMany({
        where: { companyId }
      })
    };

    if (projectId) {
      const [points, tests] = await Promise.all([
        getAnchorPointsForProject(projectId),
        getAnchorTestsForProject(projectId)
      ]);
      
      return {
        ...baseData,
        points,
        tests,
        syncedAt: new Date().toISOString()
      };
    }

    return {
      ...baseData,
      points: [],
      tests: [],
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar dados para cache offline:', error);
    throw error;
  }
}