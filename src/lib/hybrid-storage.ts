'use client';

import { Project, User, Location, AnchorPoint, AnchorTest } from '@prisma/client';
import type { MarkerShape } from '@/types';

/**
 * Sistema Híbrido localStorage + PostgreSQL com Auditoria
 * 
 * Funcionalidades:
 * - Trabalha offline com localStorage
 * - Sincroniza com PostgreSQL quando disponível
 * - Log de todas as alterações
 * - Controle de versão e conflitos
 * - Backup automático
 */

// Types para controle de sincronização
interface SyncableEntity {
  id: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  localVersion: number;
  serverVersion: number;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';
  oldValues?: any;
  newValues: any;
  changes?: any;
  userId?: string;
  companyId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

// Classe principal do sistema híbrido
export class HybridStorage {
  private static instance: HybridStorage;
  private auditLogs: AuditLogEntry[] = [];
  private currentUserId?: string;
  private currentCompanyId?: string;

  static getInstance(): HybridStorage {
    if (!HybridStorage.instance) {
      HybridStorage.instance = new HybridStorage();
    }
    return HybridStorage.instance;
  }

  setCurrentUser(userId: string, companyId: string) {
    this.currentUserId = userId;
    this.currentCompanyId = companyId;
  }

  // === SISTEMA DE AUDITORIA ===
  private createAuditLog(
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE',
    newValues: any,
    oldValues?: any
  ): AuditLogEntry {
    const changes = oldValues ? this.calculateChanges(oldValues, newValues) : null;
    
    const auditLog: AuditLogEntry = {
      id: this.generateId(),
      entityType,
      entityId,
      action,
      oldValues,
      newValues,
      changes,
      userId: this.currentUserId,
      companyId: this.currentCompanyId!,
      timestamp: new Date(),
      ipAddress: typeof window !== 'undefined' ? window.location.hostname : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
    };

    this.auditLogs.push(auditLog);
    this.saveAuditLogs();
    
    return auditLog;
  }

  private calculateChanges(oldValues: any, newValues: any): any {
    const changes: any = {};
    
    for (const key in newValues) {
      if (newValues[key] !== oldValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        };
      }
    }
    
    return changes;
  }

  private saveAuditLogs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('anchor-audit-logs', JSON.stringify(this.auditLogs));
    }
  }

  private loadAuditLogs() {
    if (typeof window !== 'undefined') {
      const logs = localStorage.getItem('anchor-audit-logs');
      if (logs) {
        this.auditLogs = JSON.parse(logs);
      }
    }
  }

  // === PROJETOS ===
  getProjects(companyId: string): Project[] {
    const projects = this.getFromStorage<Project>('anchor-projects');
    return projects
      .filter(p => p.companyId === companyId && !p.deleted)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  addProject(projectData: Omit<Project, 'id' | 'deleted' | 'createdAt' | 'updatedAt'>): Project {
    const now = new Date();
    const newProject: Project = {
      ...projectData,
      id: this.generateId(),
      deleted: false,
      createdAt: now,
      updatedAt: now
    };

    const projects = this.getFromStorage<Project>('anchor-projects');
    projects.push(newProject);
    this.saveToStorage('anchor-projects', projects);

    // Log da auditoria
    this.createAuditLog('Project', newProject.id, 'CREATE', newProject);

    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getFromStorage<Project>('anchor-projects');
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    const oldProject = { ...projects[index] };
    const updatedProject = {
      ...projects[index],
      ...updates,
      updatedAt: new Date()
    };

    projects[index] = updatedProject;
    this.saveToStorage('anchor-projects', projects);

    // Log da auditoria
    this.createAuditLog('Project', id, 'UPDATE', updatedProject, oldProject);

    return updatedProject;
  }

  deleteProject(id: string): boolean {
    const projects = this.getFromStorage<Project>('anchor-projects');
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return false;

    const oldProject = { ...projects[index] };
    projects[index].deleted = true;
    projects[index].updatedAt = new Date();
    
    this.saveToStorage('anchor-projects', projects);

    // Log da auditoria
    this.createAuditLog('Project', id, 'DELETE', projects[index], oldProject);

    return true;
  }

  // === PONTOS DE ANCORAGEM ===
  getAnchorPoints(projectId: string): AnchorPoint[] {
    const points = this.getFromStorage<AnchorPoint>('anchor-points');
    return points
      .filter(p => p.projectId === projectId && !p.archived)
      .sort((a, b) => a.numeroPonto.localeCompare(b.numeroPonto));
  }

  addAnchorPoint(pointData: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'archived' | 'createdAt' | 'updatedAt'>): AnchorPoint {
    const now = new Date();
    const newPoint: AnchorPoint = {
      ...pointData,
      id: this.generateId(),
      dataHora: now.toISOString(),
      status: 'Não Testado',
      archived: false,
      archivedAt: undefined,
      // createdAt: now,
      // updatedAt: now,
      // syncStatus: 'pending',
      // localVersion: 1,
      // serverVersion: 0,
      // lastSyncAt: null
    } as any;

    const points = this.getFromStorage<AnchorPoint>('anchor-points');
    points.push(newPoint);
    this.saveToStorage('anchor-points', points);

    // Log da auditoria
    this.createAuditLog('AnchorPoint', newPoint.id, 'CREATE', newPoint);

    return newPoint;
  }

  // === TESTES ===
  getTests(pointId: string): AnchorTest[] {
    const tests = this.getFromStorage<AnchorTest>('anchor-tests');
    return tests
      .filter(t => t.pontoId === pointId)
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  addTest(testData: Omit<AnchorTest, 'id' | 'dataHora' | 'createdAt' | 'updatedAt'>): AnchorTest {
    const now = new Date();
    const newTest: AnchorTest = {
      ...testData,
      id: this.generateId(),
      dataHora: now.toISOString(),
      // createdAt: now,
      // updatedAt: now,
      // syncStatus: 'pending',
      // localVersion: 1,
      // serverVersion: 0,
      // lastSyncAt: null
    } as any;

    const tests = this.getFromStorage<AnchorTest>('anchor-tests');
    tests.push(newTest);
    this.saveToStorage('anchor-tests', tests);

    // Log da auditoria
    this.createAuditLog('AnchorTest', newTest.id, 'CREATE', newTest);

    return newTest;
  }

  // === AUDITORIA ===
  getAuditLogs(companyId: string, entityType?: string, entityId?: string): AuditLogEntry[] {
    this.loadAuditLogs();
    
    let logs = this.auditLogs.filter(log => log.companyId === companyId);
    
    if (entityType) {
      logs = logs.filter(log => log.entityType === entityType);
    }
    
    if (entityId) {
      logs = logs.filter(log => log.entityId === entityId);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // === SINCRONIZAÇÃO ===
  async syncToServer(): Promise<void> {
    // TODO: Implementar sincronização com PostgreSQL
    console.log('Sync to server - to be implemented');
  }

  async syncFromServer(): Promise<void> {
    // TODO: Implementar sincronização do PostgreSQL
    console.log('Sync from server - to be implemented');
  }

  getPendingChanges(): number {
    // TODO: Contar itens com syncStatus = 'pending'
    return 0;
  }

  // === HELPERS ===
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getFromStorage<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
}

// Export singleton instance
export const hybridStorage = HybridStorage.getInstance();