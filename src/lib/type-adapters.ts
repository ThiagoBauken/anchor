/**
 * Adaptadores de tipo para conversão entre localStorage, Prisma e PostgreSQL
 * Resolve incompatibilidades entre os 3 sistemas de dados
 */

import type { 
  Company, User, AnchorPoint, AnchorTest, Location,
  BackupConfig, BackupRecord, UsageAnalytics, 
  SystemHealth, Notification, SyncQueueItem 
} from '@/types';

export class DataAdapter {
  
  // ================== COMPANY ADAPTERS ==================
  
  /**
   * Converte Company do localStorage para formato Prisma
   */
  static companyLocalStorageToPrisma(localData: Company): any {
    return {
      id: localData.id,
      name: localData.name,
      email: localData.email || null,
      phone: localData.phone || null,
      address: localData.address || null,
      cnpj: localData.cnpj || null,
      
      // Subscription fields
      subscriptionPlan: localData.subscriptionPlan || null,
      subscriptionStatus: localData.subscriptionStatus || null,
      trialStartDate: localData.trialStartDate ? new Date(localData.trialStartDate) : null,
      trialEndDate: localData.trialEndDate ? new Date(localData.trialEndDate) : null,
      subscriptionExpiryDate: localData.subscriptionExpiryDate ? new Date(localData.subscriptionExpiryDate) : null,
      isTrialActive: localData.isTrialActive || false,
      daysRemainingInTrial: localData.daysRemainingInTrial || null,
      
      // Usage and limits
      usersCount: localData.usersCount || 0,
      projectsCount: localData.projectsCount || 0,
      pointsCount: localData.pointsCount || 0,
      storageUsed: localData.storageUsed || 0,
      maxUsers: localData.maxUsers || null,
      maxProjects: localData.maxProjects || null,
      maxStorage: localData.maxStorage || null,
      
      // Admin fields
      createdAt: localData.createdAt ? new Date(localData.createdAt) : new Date(),
      lastActivity: localData.lastActivity ? new Date(localData.lastActivity) : null,
      isActive: localData.isActive !== undefined ? localData.isActive : true,
      notes: localData.notes || null,
    };
  }

  /**
   * Converte Company do Prisma para formato localStorage
   */
  static companyPrismaToLocalStorage(prismaData: any): Company {
    return {
      id: prismaData.id,
      name: prismaData.name,
      email: prismaData.email,
      phone: prismaData.phone,
      address: prismaData.address,
      cnpj: prismaData.cnpj,
      
      // Subscription fields
      subscriptionPlan: prismaData.subscriptionPlan as any,
      subscriptionStatus: prismaData.subscriptionStatus as any,
      trialStartDate: prismaData.trialStartDate?.toISOString(),
      trialEndDate: prismaData.trialEndDate?.toISOString(),
      subscriptionExpiryDate: prismaData.subscriptionExpiryDate?.toISOString(),
      isTrialActive: prismaData.isTrialActive,
      daysRemainingInTrial: prismaData.daysRemainingInTrial,
      
      // Usage and limits
      usersCount: prismaData.usersCount,
      projectsCount: prismaData.projectsCount,
      pointsCount: prismaData.pointsCount,
      storageUsed: prismaData.storageUsed,
      maxUsers: prismaData.maxUsers,
      maxProjects: prismaData.maxProjects,
      maxStorage: prismaData.maxStorage,
      
      // Admin fields
      createdAt: prismaData.createdAt?.toISOString(),
      lastActivity: prismaData.lastActivity?.toISOString(),
      isActive: prismaData.isActive,
      notes: prismaData.notes,
    };
  }

  // ================== LOCATION ADAPTERS ==================
  
  /**
   * Converte Location do localStorage para formato Prisma
   */
  static locationLocalStorageToPrisma(localData: Location): any {
    return {
      id: localData.id,
      name: localData.name,
      markerShape: localData.markerShape,
      companyId: localData.companyId,
      projectId: localData.projectId, // ✅ AGORA INCLUÍDO
    };
  }

  /**
   * Converte Location do Prisma para formato localStorage
   */
  static locationPrismaToLocalStorage(prismaData: any): Location {
    return {
      id: prismaData.id,
      name: prismaData.name,
      markerShape: prismaData.markerShape,
      companyId: prismaData.companyId,
      projectId: prismaData.projectId, // ✅ AGORA INCLUÍDO
    };
  }

  // ================== USER ADAPTERS ==================
  
  /**
   * Converte User do localStorage para formato Prisma
   */
  static userLocalStorageToPrisma(localData: User): any {
    return {
      id: localData.id,
      name: localData.name,
      email: localData.email || null,
      role: localData.role,
      companyId: localData.companyId,
      active: localData.active,
      createdAt: localData.createdAt ? new Date(localData.createdAt) : new Date(),
      lastLogin: localData.lastLogin ? new Date(localData.lastLogin) : null,
      phone: localData.phone || null,
      password: localData.password || null,
      updatedAt: localData.updatedAt ? new Date(localData.updatedAt) : new Date(),
    };
  }

  /**
   * Converte User do Prisma para formato localStorage
   */
  static userPrismaToLocalStorage(prismaData: any): User {
    return {
      id: prismaData.id,
      name: prismaData.name,
      email: prismaData.email,
      role: prismaData.role,
      companyId: prismaData.companyId,
      active: prismaData.active,
      createdAt: prismaData.createdAt?.toISOString(),
      lastLogin: prismaData.lastLogin?.toISOString(),
      phone: prismaData.phone,
      password: prismaData.password,
      updatedAt: prismaData.updatedAt?.toISOString(),
    };
  }

  // ================== ANCHOR POINT ADAPTERS ==================
  
  /**
   * Converte AnchorPoint do localStorage para formato Prisma
   */
  static anchorPointLocalStorageToPrisma(localData: AnchorPoint): any {
    return {
      id: localData.id,
      projectId: localData.projectId,
      numeroPonto: localData.numeroPonto,
      localizacao: localData.localizacao,
      foto: localData.foto || null,
      numeroLacre: localData.numeroLacre || null,
      tipoEquipamento: localData.tipoEquipamento || null,
      dataInstalacao: localData.dataInstalacao || null,
      frequenciaInspecaoMeses: localData.frequenciaInspecaoMeses || null,
      observacoes: localData.observacoes || null,
      posicaoX: parseFloat(localData.posicaoX.toString()),
      posicaoY: parseFloat(localData.posicaoY.toString()),
      dataHora: new Date(localData.dataHora),
      status: localData.status,
      createdByUserId: localData.createdByUserId || null,
      lastModifiedByUserId: localData.lastModifiedByUserId || null,
      archived: localData.archived || false,
      archivedAt: localData.archivedAt ? new Date(localData.archivedAt) : null,
    };
  }

  /**
   * Converte AnchorPoint do Prisma para formato localStorage
   */
  static anchorPointPrismaToLocalStorage(prismaData: any): AnchorPoint {
    return {
      id: prismaData.id,
      projectId: prismaData.projectId,
      numeroPonto: prismaData.numeroPonto,
      localizacao: prismaData.localizacao,
      foto: prismaData.foto,
      numeroLacre: prismaData.numeroLacre,
      tipoEquipamento: prismaData.tipoEquipamento,
      dataInstalacao: prismaData.dataInstalacao,
      frequenciaInspecaoMeses: prismaData.frequenciaInspecaoMeses,
      observacoes: prismaData.observacoes,
      posicaoX: Number(prismaData.posicaoX),
      posicaoY: Number(prismaData.posicaoY),
      dataHora: prismaData.dataHora.toISOString(),
      status: prismaData.status as 'Aprovado' | 'Reprovado' | 'Não Testado',
      createdByUserId: prismaData.createdByUserId,
      lastModifiedByUserId: prismaData.lastModifiedByUserId,
      archived: prismaData.archived,
      archivedAt: prismaData.archivedAt?.toISOString(),
    };
  }

  // ================== ANCHOR TEST ADAPTERS ==================
  
  /**
   * Converte AnchorTest do localStorage para formato Prisma
   */
  static anchorTestLocalStorageToPrisma(localData: AnchorTest): any {
    return {
      id: localData.id,
      pontoId: localData.pontoId,
      dataHora: new Date(localData.dataHora),
      resultado: localData.resultado,
      carga: localData.carga,
      tempo: localData.tempo,
      tecnico: localData.tecnico,
      observacoes: localData.observacoes || null,
      fotoTeste: localData.fotoTeste || null,
      fotoPronto: localData.fotoPronto || null,
      dataFotoPronto: localData.dataFotoPronto || null,
    };
  }

  /**
   * Converte AnchorTest do Prisma para formato localStorage
   */
  static anchorTestPrismaToLocalStorage(prismaData: any): AnchorTest {
    return {
      id: prismaData.id,
      pontoId: prismaData.pontoId,
      dataHora: prismaData.dataHora.toISOString(),
      resultado: prismaData.resultado as 'Aprovado' | 'Reprovado',
      carga: prismaData.carga,
      tempo: prismaData.tempo,
      tecnico: prismaData.tecnico,
      observacoes: prismaData.observacoes,
      fotoTeste: prismaData.fotoTeste,
      fotoPronto: prismaData.fotoPronto,
      dataFotoPronto: prismaData.dataFotoPronto,
    };
  }

  // ================== BACKUP CONFIG ADAPTERS ==================
  
  /**
   * Converte BackupConfig do localStorage para formato Prisma
   */
  static backupConfigLocalStorageToPrisma(localData: BackupConfig): any {
    return {
      id: localData.id,
      enabled: localData.enabled,
      frequency: localData.frequency,
      retentionDays: localData.retentionDays,
      includeFiles: localData.includeFiles,
      compressBackups: localData.compressBackups,
      encryptBackups: localData.encryptBackups,
      backupPath: localData.backupPath,
      lastBackup: localData.lastBackup ? new Date(localData.lastBackup) : null,
      nextBackup: localData.nextBackup ? new Date(localData.nextBackup) : null,
      backupSize: localData.backupSize || null,
    };
  }

  /**
   * Converte BackupConfig do Prisma para formato localStorage
   */
  static backupConfigPrismaToLocalStorage(prismaData: any): BackupConfig {
    return {
      id: prismaData.id,
      enabled: prismaData.enabled,
      frequency: prismaData.frequency as 'daily' | 'weekly' | 'monthly',
      retentionDays: prismaData.retentionDays,
      includeFiles: prismaData.includeFiles,
      compressBackups: prismaData.compressBackups,
      encryptBackups: prismaData.encryptBackups,
      backupPath: prismaData.backupPath,
      lastBackup: prismaData.lastBackup?.toISOString(),
      nextBackup: prismaData.nextBackup?.toISOString(),
      backupSize: prismaData.backupSize,
    };
  }

  // ================== USAGE ANALYTICS ADAPTERS ==================
  
  /**
   * Converte UsageAnalytics do localStorage para formato Prisma
   */
  static usageAnalyticsLocalStorageToPrisma(localData: UsageAnalytics): any {
    return {
      id: localData.companyId + '_' + localData.date,
      companyId: localData.companyId,
      date: localData.date,
      activeUsers: localData.activeUsers,
      projectsCreated: localData.projectsCreated,
      pointsCreated: localData.pointsCreated,
      testsPerformed: localData.testsPerformed,
      photosUploaded: localData.photosUploaded,
      storageUsed: localData.storageUsed,
      syncOperations: localData.syncOperations,
      loginCount: localData.loginCount,
      sessionDuration: localData.sessionDuration,
      topFeatures: localData.topFeatures,
    };
  }

  /**
   * Converte UsageAnalytics do Prisma para formato localStorage
   */
  static usageAnalyticsPrismaToLocalStorage(prismaData: any): UsageAnalytics {
    return {
      companyId: prismaData.companyId,
      date: prismaData.date,
      activeUsers: prismaData.activeUsers,
      projectsCreated: prismaData.projectsCreated,
      pointsCreated: prismaData.pointsCreated,
      testsPerformed: prismaData.testsPerformed,
      photosUploaded: prismaData.photosUploaded,
      storageUsed: prismaData.storageUsed,
      syncOperations: prismaData.syncOperations,
      loginCount: prismaData.loginCount,
      sessionDuration: prismaData.sessionDuration,
      topFeatures: prismaData.topFeatures,
    };
  }

  // ================== BATCH ADAPTERS ==================
  
  /**
   * Converte arrays de dados do localStorage para Prisma
   */
  static batchLocalStorageToPrisma(data: {
    companies?: Company[];
    users?: User[];
    locations?: Location[];
    anchorPoints?: AnchorPoint[];
    anchorTests?: AnchorTest[];
    backupConfigs?: BackupConfig[];
    usageAnalytics?: UsageAnalytics[];
  }) {
    return {
      companies: data.companies?.map(item => this.companyLocalStorageToPrisma(item)) || [],
      users: data.users?.map(item => this.userLocalStorageToPrisma(item)) || [],
      locations: data.locations?.map(item => this.locationLocalStorageToPrisma(item)) || [],
      anchorPoints: data.anchorPoints?.map(item => this.anchorPointLocalStorageToPrisma(item)) || [],
      anchorTests: data.anchorTests?.map(item => this.anchorTestLocalStorageToPrisma(item)) || [],
      backupConfigs: data.backupConfigs?.map(item => this.backupConfigLocalStorageToPrisma(item)) || [],
      usageAnalytics: data.usageAnalytics?.map(item => this.usageAnalyticsLocalStorageToPrisma(item)) || [],
    };
  }

  /**
   * Converte arrays de dados do Prisma para localStorage
   */
  static batchPrismaToLocalStorage(data: {
    companies?: any[];
    users?: any[];
    locations?: any[];
    anchorPoints?: any[];
    anchorTests?: any[];
    backupConfigs?: any[];
    usageAnalytics?: any[];
  }) {
    return {
      companies: data.companies?.map(item => this.companyPrismaToLocalStorage(item)) || [],
      users: data.users?.map(item => this.userPrismaToLocalStorage(item)) || [],
      locations: data.locations?.map(item => this.locationPrismaToLocalStorage(item)) || [],
      anchorPoints: data.anchorPoints?.map(item => this.anchorPointPrismaToLocalStorage(item)) || [],
      anchorTests: data.anchorTests?.map(item => this.anchorTestPrismaToLocalStorage(item)) || [],
      backupConfigs: data.backupConfigs?.map(item => this.backupConfigPrismaToLocalStorage(item)) || [],
      usageAnalytics: data.usageAnalytics?.map(item => this.usageAnalyticsPrismaToLocalStorage(item)) || [],
    };
  }

  // ================== VALIDATION HELPERS ==================
  
  /**
   * Valida se os dados estão no formato correto para conversão
   */
  static validateForPrisma(data: any, type: 'company' | 'user' | 'location' | 'anchorPoint' | 'anchorTest'): boolean {
    if (!data || typeof data !== 'object') return false;
    
    switch (type) {
      case 'company':
        return !!(data.id && data.name);
      case 'user':
        return !!(data.id && data.name && data.companyId && data.role);
      case 'location':
        return !!(data.id && data.name && data.companyId && data.projectId && data.markerShape);
      case 'anchorPoint':
        return !!(data.id && data.projectId && data.numeroPonto && 
                 typeof data.posicaoX === 'number' && typeof data.posicaoY === 'number');
      case 'anchorTest':
        return !!(data.id && data.pontoId && data.resultado && data.carga && data.tempo && data.tecnico);
      default:
        return false;
    }
  }

  /**
   * Valida se os dados estão no formato correto para localStorage
   */
  static validateForLocalStorage(data: any, type: 'company' | 'user' | 'location' | 'anchorPoint' | 'anchorTest'): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Mesmo que validateForPrisma, mas pode ter validações específicas no futuro
    return this.validateForPrisma(data, type);
  }
}

// ================== HELPER FUNCTIONS ==================

/**
 * Converte string ISO para Date, com fallback para data atual
 */
export function safeParseDate(dateString?: string): Date {
  if (!dateString) return new Date();
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
}

/**
 * Converte Date para string ISO, com fallback para string vazia
 */
export function safeDateToISO(date?: Date): string {
  if (!date) return '';
  
  try {
    return date.toISOString();
  } catch {
    return '';
  }
}

/**
 * Converte número para float, com fallback para 0
 */
export function safeParseFloat(value: any): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte número para int, com fallback para 0
 */
export function safeParseInt(value: any): number {
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
}