// Gerenciador de dados híbrido - funciona online e offline
// Este é o coração do sistema que decide quando usar localStorage vs PostgreSQL

import { AnchorPoint, AnchorTest, Project, User } from '@/types';
import { 
  getAnchorPointsForProject, 
  addAnchorPoint, 
  updateAnchorPoint,
  getAnchorTestsForPoint,
  addAnchorTest 
} from '@/app/actions/anchor-actions';
import { DataAdapter } from './type-adapters';

export interface SyncableItem {
  id: string;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  lastModified: string;
  version?: number;
}

export class HybridDataManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private pendingSync: Set<string> = new Set();

  constructor() {
    // Monitora mudanças de conectividade
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.autoSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  // =====================================
  // ANCHOR POINTS
  // =====================================

  async getAnchorPoints(projectId: string): Promise<AnchorPoint[]> {
    if (this.isOnline) {
      try {
        // Tenta buscar do servidor primeiro
        console.log('🌐 Buscando pontos do servidor...');
        const serverData = await getAnchorPointsForProject(projectId);
        
        // Converte dados do servidor para formato localStorage
        const convertedData = serverData.map(point => 
          DataAdapter.anchorPointPrismaToLocalStorage(point)
        );
        
        // Cache no localStorage para uso offline
        this.cacheOffline('anchorPoints', convertedData, projectId);
        
        return convertedData;
      } catch (error) {
        console.warn('⚠️ Falha no servidor, usando cache offline:', error);
        return this.getPointsFromCache(projectId);
      }
    } else {
      console.log('📱 Modo offline - usando localStorage');
      return this.getPointsFromCache(projectId);
    }
  }

  async addAnchorPoint(point: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>, userId?: string): Promise<AnchorPoint> {
    const newPoint: AnchorPoint = {
      ...point,
      id: this.generateId(),
      dataHora: new Date().toISOString(),
      status: 'Não Testado',
      createdByUserId: userId,
      lastModifiedByUserId: userId,
      archived: false
    };

    // SEMPRE salva no localStorage primeiro (garante funcionamento offline)
    const savedPoint = this.savePointToLocalStorage(newPoint);
    
    if (this.isOnline) {
      try {
        // Se online, tenta salvar no servidor também
        console.log('🌐 Salvando ponto no servidor...');
        // Converte para formato Prisma antes de enviar
        const prismaData = DataAdapter.anchorPointLocalStorageToPrisma(newPoint);
        await addAnchorPoint(prismaData, userId);
        this.markAsSynced('anchorPoints', newPoint.id);
      } catch (error) {
        console.warn('⚠️ Falha ao salvar no servidor, marcando para sync:', error);
        this.markAsPending('anchorPoints', newPoint.id);
      }
    } else {
      console.log('📱 Offline - ponto salvo localmente, será sincronizado depois');
      this.markAsPending('anchorPoints', newPoint.id);
    }
    
    return savedPoint;
  }

  async updateAnchorPoint(pointId: string, updates: Partial<AnchorPoint>, userId?: string): Promise<AnchorPoint> {
    // Atualiza no localStorage
    const updatedPoint = this.updatePointInLocalStorage(pointId, updates);
    
    if (this.isOnline) {
      try {
        console.log('🌐 Atualizando ponto no servidor...');
        await updateAnchorPoint(pointId, updates, userId);
        this.markAsSynced('anchorPoints', pointId);
      } catch (error) {
        console.warn('⚠️ Falha ao atualizar no servidor:', error);
        this.markAsPending('anchorPoints', pointId);
      }
    } else {
      this.markAsPending('anchorPoints', pointId);
    }
    
    return updatedPoint;
  }

  // =====================================
  // ANCHOR TESTS
  // =====================================

  async getAnchorTests(pointId: string): Promise<AnchorTest[]> {
    if (this.isOnline) {
      try {
        console.log('🌐 Buscando testes do servidor...');
        const serverData = await getAnchorTestsForPoint(pointId);
        
        // Converte dados do servidor para formato localStorage
        const convertedData = serverData.map(test => 
          DataAdapter.anchorTestPrismaToLocalStorage(test)
        );
        
        this.cacheOffline('anchorTests', convertedData, pointId);
        return convertedData;
      } catch (error) {
        console.warn('⚠️ Falha no servidor, usando cache offline:', error);
        return this.getTestsFromCache(pointId);
      }
    } else {
      return this.getTestsFromCache(pointId);
    }
  }

  async addAnchorTest(test: Omit<AnchorTest, 'id' | 'dataHora'>): Promise<AnchorTest> {
    const newTest: AnchorTest = {
      ...test,
      id: this.generateId(),
      dataHora: new Date().toISOString()
    };

    // Salva no localStorage
    const savedTest = this.saveTestToLocalStorage(newTest);
    
    // Atualiza status do ponto automaticamente
    this.updatePointStatus(test.pontoId, test.resultado);
    
    if (this.isOnline) {
      try {
        console.log('🌐 Salvando teste no servidor...');
        // Converte para formato Prisma antes de enviar
        const prismaData = DataAdapter.anchorTestLocalStorageToPrisma(newTest);
        await addAnchorTest(prismaData);
        this.markAsSynced('anchorTests', newTest.id);
      } catch (error) {
        console.warn('⚠️ Falha ao salvar teste no servidor:', error);
        this.markAsPending('anchorTests', newTest.id);
      }
    } else {
      this.markAsPending('anchorTests', newTest.id);
    }
    
    return savedTest;
  }

  // =====================================
  // CACHE MANAGEMENT
  // =====================================

  private getPointsFromCache(projectId: string): AnchorPoint[] {
    const allPoints = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    return allPoints.filter((point: AnchorPoint) => 
      point.projectId === projectId && !point.archived
    );
  }

  private getTestsFromCache(pointId: string): AnchorTest[] {
    const allTests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');
    return allTests.filter((test: AnchorTest) => test.pontoId === pointId);
  }

  private savePointToLocalStorage(point: AnchorPoint): AnchorPoint {
    const existingPoints = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    const syncablePoint = {
      ...point,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    };
    
    existingPoints.push(syncablePoint);
    localStorage.setItem('anchorViewPoints', JSON.stringify(existingPoints));
    
    return point;
  }

  private saveTestToLocalStorage(test: AnchorTest): AnchorTest {
    const existingTests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');
    const syncableTest = {
      ...test,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    };
    
    existingTests.push(syncableTest);
    localStorage.setItem('anchorViewTests', JSON.stringify(existingTests));
    
    return test;
  }

  private updatePointInLocalStorage(pointId: string, updates: Partial<AnchorPoint>): AnchorPoint {
    const existingPoints = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    const pointIndex = existingPoints.findIndex((p: any) => p.id === pointId);
    
    if (pointIndex !== -1) {
      existingPoints[pointIndex] = {
        ...existingPoints[pointIndex],
        ...updates,
        syncStatus: 'pending',
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('anchorViewPoints', JSON.stringify(existingPoints));
      return existingPoints[pointIndex];
    }
    
    throw new Error(`Ponto ${pointId} não encontrado`);
  }

  private updatePointStatus(pointId: string, newStatus: string) {
    try {
      this.updatePointInLocalStorage(pointId, { status: newStatus as any });
    } catch (error) {
      console.error('Erro ao atualizar status do ponto:', error);
    }
  }

  private cacheOffline(type: string, data: any[], filterKey?: string) {
    const key = type === 'anchorPoints' ? 'anchorViewPoints' : 'anchorViewTests';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Merge com dados existentes, priorizando servidor
    const merged = [...existing];
    
    data.forEach(serverItem => {
      const existingIndex = merged.findIndex(item => item.id === serverItem.id);
      if (existingIndex !== -1) {
        // Atualiza item existente com dados do servidor
        merged[existingIndex] = {
          ...serverItem,
          syncStatus: 'synced',
          lastModified: new Date().toISOString()
        };
      } else {
        // Adiciona novo item do servidor
        merged.push({
          ...serverItem,
          syncStatus: 'synced',
          lastModified: new Date().toISOString()
        });
      }
    });
    
    localStorage.setItem(key, JSON.stringify(merged));
  }

  // =====================================
  // SYNC MANAGEMENT
  // =====================================

  getPendingItems(): { points: number; tests: number; total: number } {
    const points = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    const tests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');

    // Count items as pending if:
    // - syncStatus === 'pending' OR
    // - syncStatus is undefined/null (newly created items)
    const pendingPoints = points.filter((p: any) => !p.syncStatus || p.syncStatus === 'pending').length;
    const pendingTests = tests.filter((t: any) => !t.syncStatus || t.syncStatus === 'pending').length;

    return {
      points: pendingPoints,
      tests: pendingTests,
      total: pendingPoints + pendingTests
    };
  }

  // Unified method that checks BOTH localStorage and IndexedDB
  async getTotalPendingItems(): Promise<{
    localStorage: { points: number; tests: number; total: number };
    indexedDB: number;
    total: number;
    details: {
      source: string;
      count: number;
      type: string;
    }[];
  }> {
    // Get localStorage pending items
    const localStoragePending = this.getPendingItems();

    // Get IndexedDB sync queue (operations pending sync)
    let indexedDBPending = 0;
    const details: { source: string; count: number; type: string }[] = [];

    try {
      const { offlineDB } = await import('./indexeddb');
      const syncQueue = await offlineDB.getSyncQueue();
      indexedDBPending = syncQueue.filter(op => op.status === 'pending').length;

      if (localStoragePending.points > 0) {
        details.push({
          source: 'localStorage',
          count: localStoragePending.points,
          type: 'Pontos de Ancoragem'
        });
      }

      if (localStoragePending.tests > 0) {
        details.push({
          source: 'localStorage',
          count: localStoragePending.tests,
          type: 'Testes de Carga'
        });
      }

      if (indexedDBPending > 0) {
        details.push({
          source: 'IndexedDB',
          count: indexedDBPending,
          type: 'Operações na Fila'
        });
      }
    } catch (error) {
      console.warn('Failed to get IndexedDB pending items:', error);
    }

    return {
      localStorage: localStoragePending,
      indexedDB: indexedDBPending,
      total: localStoragePending.total + indexedDBPending,
      details
    };
  }

  private markAsPending(type: string, id: string) {
    this.pendingSync.add(id);
    this.updateSyncStatus(type, id, 'pending');
  }

  private markAsSynced(type: string, id: string) {
    this.pendingSync.delete(id);
    this.updateSyncStatus(type, id, 'synced');
  }

  private updateSyncStatus(type: string, id: string, status: string) {
    const key = type === 'anchorPoints' ? 'anchorViewPoints' : 'anchorViewTests';
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    
    const itemIndex = items.findIndex((item: any) => item.id === id);
    if (itemIndex !== -1) {
      items[itemIndex].syncStatus = status;
      items[itemIndex].lastModified = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  async manualSync(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    if (!this.isOnline) {
      return { success: false, synced: 0, errors: ['Sem conexão com a internet'] };
    }

    console.log('🔄 Iniciando sincronização manual...');
    
    const results = { success: true, synced: 0, errors: [] as string[] };
    
    try {
      // Sincronizar pontos pendentes
      const pendingPoints = this.getPendingPointsForSync();
      for (const point of pendingPoints) {
        try {
          await this.syncPointToServer(point);
          results.synced++;
        } catch (error) {
          results.errors.push(`Ponto ${point.numeroPonto}: ${error}`);
          results.success = false;
        }
      }
      
      // Sincronizar testes pendentes
      const pendingTests = this.getPendingTestsForSync();
      for (const test of pendingTests) {
        try {
          await this.syncTestToServer(test);
          results.synced++;
        } catch (error) {
          results.errors.push(`Teste ${test.id}: ${error}`);
          results.success = false;
        }
      }
      
      console.log('✅ Sincronização concluída:', results);
    } catch (error) {
      results.success = false;
      results.errors.push(`Erro geral: ${error}`);
    }
    
    return results;
  }

  private async autoSync() {
    if (this.isOnline && this.getPendingItems().total > 0) {
      console.log('🔄 Auto-sincronização iniciada...');
      await this.manualSync();
    }
  }

  private getPendingPointsForSync(): any[] {
    const points = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    // Items without syncStatus OR with 'pending' status need to be synced
    return points.filter((p: any) => !p.syncStatus || p.syncStatus === 'pending');
  }

  private getPendingTestsForSync(): any[] {
    const tests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');
    // Items without syncStatus OR with 'pending' status need to be synced
    return tests.filter((t: any) => !t.syncStatus || t.syncStatus === 'pending');
  }

  private async syncPointToServer(point: any) {
    // Remove campos de sync antes de enviar
    const { syncStatus, lastModified, ...pointData } = point;
    
    // Converte para formato Prisma
    const prismaData = DataAdapter.anchorPointLocalStorageToPrisma(pointData);
    
    if (point.id && point.id.startsWith('temp_')) {
      // Novo ponto local
      await addAnchorPoint(prismaData);
    } else {
      // Ponto existente
      await updateAnchorPoint(point.id, prismaData);
    }
    
    this.markAsSynced('anchorPoints', point.id);
  }

  private async syncTestToServer(test: any) {
    const { syncStatus, lastModified, ...testData } = test;
    
    // Converte para formato Prisma
    const prismaData = DataAdapter.anchorTestLocalStorageToPrisma(testData);
    
    await addAnchorTest(prismaData);
    this.markAsSynced('anchorTests', test.id);
  }

  // =====================================
  // UTILITY
  // =====================================

  private generateId(): string {
    // Gera ID temporário para uso offline
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStatus(): { isOnline: boolean; pendingItems: number } {
    return {
      isOnline: this.isOnline,
      pendingItems: this.getPendingItems().total
    };
  }

  // Exportar dados para backup
  exportOfflineData(): string {
    const data = {
      points: JSON.parse(localStorage.getItem('anchorViewPoints') || '[]'),
      tests: JSON.parse(localStorage.getItem('anchorViewTests') || '[]'),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Importar dados de backup
  importOfflineData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.points) {
        localStorage.setItem('anchorViewPoints', JSON.stringify(data.points));
      }
      
      if (data.tests) {
        localStorage.setItem('anchorViewTests', JSON.stringify(data.tests));
      }
      
      return { success: true, message: 'Dados importados com sucesso!' };
    } catch (error) {
      return { success: false, message: `Erro ao importar: ${error}` };
    }
  }
}

// Instância singleton
export const hybridDataManager = new HybridDataManager();