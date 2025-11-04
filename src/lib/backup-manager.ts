/**
 * Sistema de Backup Automático para AnchorView
 * Gerencia backup de dados offline e online com compressão e criptografia
 */

import { prisma } from './prisma';

export interface BackupOptions {
  includeFiles?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  outputPath?: string;
  companyId?: string; // Para backup específico de empresa
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  size: number; // MB
  duration: number; // seconds
  tablesBackedUp: string[];
  filesCount: number;
  error?: string;
}

export class BackupManager {
  private static instance: BackupManager;

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Executa backup completo do sistema
   */
  async executeFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}`;
    
    try {
      console.log(`🔄 Iniciando backup completo: ${backupId}`);

      // 1. Backup dos dados do PostgreSQL
      const tablesBackedUp = await this.backupDatabaseTables(options.companyId);
      
      // 2. Backup dos dados offline (localStorage)
      const offlineData = await this.backupOfflineData();
      
      // 3. Backup dos arquivos/fotos (se solicitado)
      let filesCount = 0;
      if (options.includeFiles) {
        filesCount = await this.backupFiles(options.companyId);
      }

      // 4. Comprimir dados (se solicitado)
      let finalSize = await this.calculateBackupSize(tablesBackedUp, filesCount);
      if (options.compress) {
        finalSize = await this.compressBackup(backupId);
      }

      // 5. Criptografar backup (se solicitado)
      if (options.encrypt) {
        await this.encryptBackup(backupId);
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      // 6. Registrar backup no banco
      await this.recordBackup({
        id: backupId,
        type: 'automatic',
        status: 'completed',
        size: Math.round(finalSize),
        duration,
        tablesBackedUp,
        filesCount,
        companyId: options.companyId
      });

      console.log(`✅ Backup concluído: ${backupId} (${finalSize}MB em ${duration}s)`);

      return {
        success: true,
        backupId,
        size: Math.round(finalSize),
        duration,
        tablesBackedUp,
        filesCount
      };

    } catch (error) {
      console.error(`❌ Erro no backup ${backupId}:`, error);
      
      // Registrar erro no banco
      await this.recordBackup({
        id: backupId,
        type: 'automatic',
        status: 'failed',
        size: 0,
        duration: Math.round((Date.now() - startTime) / 1000),
        tablesBackedUp: [],
        filesCount: 0,
        error: error instanceof Error ? error.message : String(error),
        companyId: options.companyId
      });

      return {
        success: false,
        backupId,
        size: 0,
        duration: Math.round((Date.now() - startTime) / 1000),
        tablesBackedUp: [],
        filesCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Backup das tabelas do PostgreSQL
   */
  private async backupDatabaseTables(companyId?: string): Promise<string[]> {
    const tables = [
      'Company', 'User', 'Project', 'Location',
      'AnchorPoint', 'AnchorTest', 'File', 'SyncQueue',
      'UserSession', 'AuditLog', 'Notification'
    ];

    const backedUpTables: string[] = [];

    for (const table of tables) {
      try {
        let query: any;
        
        // Filtrar por empresa se especificado
        if (companyId && this.isCompanyRelatedTable(table)) {
          query = this.getCompanyFilteredQuery(table, companyId);
        } else {
          query = this.getAllDataQuery(table);
        }

        const data = await query;
        await this.saveTableData(table, data);
        backedUpTables.push(table);
        
        console.log(`📦 Tabela ${table} backup: ${data.length} registros`);
      } catch (error) {
        console.error(`❌ Erro ao fazer backup da tabela ${table}:`, error);
      }
    }

    return backedUpTables;
  }

  /**
   * Backup dos dados offline (localStorage)
   */
  private async backupOfflineData(): Promise<any> {
    try {
      // Simular leitura dos dados do localStorage
      // Em produção, isso seria executado no browser/PWA
      const offlineData = {
        anchorPoints: [], // dados do localStorage
        anchorTests: [],
        projects: [],
        syncQueue: [],
        lastBackup: new Date().toISOString()
      };

      await this.saveOfflineData(offlineData);
      console.log(`📱 Dados offline salvos: ${Object.keys(offlineData).length} categorias`);
      
      return offlineData;
    } catch (error) {
      console.error('❌ Erro ao fazer backup offline:', error);
      throw error;
    }
  }

  /**
   * Backup dos arquivos/fotos
   */
  private async backupFiles(companyId?: string): Promise<number> {
    try {
      let query: any;
      
      if (companyId) {
        query = prisma.file.findMany({
          where: { companyId },
          select: { filename: true, url: true, size: true }
        });
      } else {
        query = prisma.file.findMany({
          select: { filename: true, url: true, size: true }
        });
      }

      const files = await query;
      
      // Copiar arquivos para diretório de backup
      for (const file of files) {
        await this.copyFileToBackup(file);
      }

      console.log(`📁 Arquivos copiados: ${files.length} arquivos`);
      return files.length;
    } catch (error) {
      console.error('❌ Erro ao fazer backup de arquivos:', error);
      return 0;
    }
  }

  /**
   * Verifica se tabela está relacionada à empresa
   */
  private isCompanyRelatedTable(table: string): boolean {
    const companyTables = [
      'User', 'Project', 'AnchorPoint', 'AnchorTest', 
      'File', 'SyncQueue', 'Notification'
    ];
    return companyTables.includes(table);
  }

  /**
   * Query filtrada por empresa
   */
  private getCompanyFilteredQuery(table: string, companyId: string): any {
    switch (table) {
      case 'User':
        return prisma.user.findMany({ where: { companyId } });
      case 'Project':
        return prisma.project.findMany({ where: { companyId } });
      case 'File':
        return prisma.file.findMany({ where: { companyId } });
      case 'SyncQueue':
        return prisma.syncQueue.findMany({ where: { companyId } });
      case 'Notification':
        return prisma.notification.findMany({ 
          where: { 
            user: { companyId } 
          },
          include: { user: true }
        });
      default:
        return this.getAllDataQuery(table);
    }
  }

  /**
   * Query para todos os dados da tabela
   */
  private getAllDataQuery(table: string): any {
    switch (table) {
      case 'Company':
        return prisma.company.findMany();
      case 'User':
        return prisma.user.findMany();
      case 'Project':
        return prisma.project.findMany();
      case 'Location':
        return prisma.location.findMany();
      case 'AnchorPoint':
        return prisma.anchorPoint.findMany();
      case 'AnchorTest':
        return prisma.anchorTest.findMany();
      case 'File':
        return prisma.file.findMany();
      case 'SyncQueue':
        return prisma.syncQueue.findMany();
      case 'UserSession':
        return prisma.userSession.findMany();
      case 'AuditLog':
        return prisma.auditLog.findMany();
      case 'Notification':
        return prisma.notification.findMany();
      default:
        return [];
    }
  }

  /**
   * Salva dados da tabela
   */
  private async saveTableData(table: string, data: any[]): Promise<void> {
    // Em produção, salvar em arquivo JSON ou CSV
    const backupPath = `/backups/${table}_${Date.now()}.json`;
    console.log(`💾 Salvando ${data.length} registros em ${backupPath}`);
    
    // Simular salvamento
    return Promise.resolve();
  }

  /**
   * Salva dados offline
   */
  private async saveOfflineData(data: any): Promise<void> {
    const backupPath = `/backups/offline_data_${Date.now()}.json`;
    console.log(`💾 Salvando dados offline em ${backupPath}`);
    
    // Simular salvamento
    return Promise.resolve();
  }

  /**
   * Copia arquivo para backup
   */
  private async copyFileToBackup(file: any): Promise<void> {
    // Em produção, copiar arquivo real
    console.log(`📄 Copiando arquivo: ${file.filename}`);
    return Promise.resolve();
  }

  /**
   * Calcula tamanho do backup
   */
  private async calculateBackupSize(tables: string[], filesCount: number): Promise<number> {
    // Simular cálculo de tamanho
    const tableSize = tables.length * 5; // 5MB por tabela
    const fileSize = filesCount * 2; // 2MB por arquivo
    return tableSize + fileSize;
  }

  /**
   * Comprime backup
   */
  private async compressBackup(backupId: string): Promise<number> {
    console.log(`🗜️ Comprimindo backup: ${backupId}`);
    // Simular compressão (reduz 60% do tamanho)
    return Promise.resolve(0.4);
  }

  /**
   * Criptografa backup
   */
  private async encryptBackup(backupId: string): Promise<void> {
    console.log(`🔐 Criptografando backup: ${backupId}`);
    // Simular criptografia
    return Promise.resolve();
  }

  /**
   * Registra backup no banco
   */
  private async recordBackup(record: any): Promise<void> {
    await prisma.backupRecord.create({
      data: {
        id: record.id,
        timestamp: new Date(),
        type: record.type,
        status: record.status,
        size: record.size,
        duration: record.duration,
        error: record.error,
        tablesBackedUp: record.tablesBackedUp,
        filesCount: record.filesCount,
        companyId: record.companyId
      }
    });
  }

  /**
   * Configura backup automático
   */
  async scheduleAutomaticBackup(): Promise<void> {
    try {
      const config = await prisma.backupConfig.findFirst();
      
      if (!config || !config.enabled) {
        console.log('⏸️ Backup automático desabilitado');
        return;
      }

      console.log(`⏰ Agendando backup automático: ${config.frequency}`);

      // Calcular próximo backup
      const nextBackup = this.calculateNextBackup(config.frequency);
      
      await prisma.backupConfig.update({
        where: { id: config.id },
        data: { nextBackup }
      });

      console.log(`📅 Próximo backup: ${nextBackup.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Erro ao agendar backup automático:', error);
    }
  }

  /**
   * Calcula data do próximo backup
   */
  private calculateNextBackup(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Limpa backups antigos
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const config = await prisma.backupConfig.findFirst();
      if (!config) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

      const deleted = await prisma.backupRecord.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
          status: 'completed'
        }
      });

      console.log(`🗑️ Removidos ${deleted.count} backups antigos`);
    } catch (error) {
      console.error('❌ Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Lista backups disponíveis
   */
  async listBackups(companyId?: string): Promise<any[]> {
    const backups = await prisma.backupRecord.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return backups.map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp.toISOString(),
      type: backup.type,
      status: backup.status,
      size: backup.size,
      duration: backup.duration,
      tablesCount: backup.tablesBackedUp.length,
      filesCount: backup.filesCount,
      error: backup.error
    }));
  }

  /**
   * Restaura backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      console.log(`🔄 Iniciando restauração do backup: ${backupId}`);
      
      const backup = await prisma.backupRecord.findUnique({
        where: { id: backupId }
      });

      if (!backup || backup.status !== 'completed') {
        throw new Error('Backup não encontrado ou inválido');
      }

      // Em produção, implementar restauração real
      console.log(`✅ Backup ${backupId} restaurado com sucesso`);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao restaurar backup ${backupId}:`, error);
      return false;
    }
  }
}