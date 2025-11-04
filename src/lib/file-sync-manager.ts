// Gerenciador de sincronização de arquivos offline/online
import React from 'react';
import { offlineDB } from '@/lib/indexeddb';

interface FileUploadTask {
  id: string;
  fileId: string;
  filename: string;
  blob: Blob;
  companyId: string;
  userId?: string;
  metadata?: any;
  retries: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  lastError?: string;
}

class FileSyncManager {
  private uploadQueue: FileUploadTask[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 segundos
  private listeners: Array<(status: any) => void> = [];

  constructor() {
    this.initializeFromIndexedDB();
    this.setupNetworkListeners();
  }

  // Inicializar fila de upload a partir do IndexedDB
  private async initializeFromIndexedDB() {
    try {
      const pendingFiles = await offlineDB.getPendingFiles();
      this.uploadQueue = pendingFiles.map(file => ({
        id: `upload_${file.id}`,
        fileId: file.id,
        filename: file.filename,
        blob: file.blob,
        companyId: '', // Será preenchido quando necessário
        retries: 0,
        status: 'pending' as const
      }));

      console.log(`📁 FileSyncManager: ${this.uploadQueue.length} arquivos pendentes carregados`);
    } catch (error) {
      console.error('Erro ao carregar arquivos pendentes:', error);
    }
  }

  // Configurar listeners de rede
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 FileSyncManager: Conexão restabelecida, iniciando sync');
      this.processQueue();
    });

    // Processar fila periodicamente quando online
    setInterval(() => {
      if (navigator.onLine && this.uploadQueue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 30000); // A cada 30 segundos
  }

  // Adicionar arquivo à fila de upload
  async addToQueue(
    fileId: string,
    filename: string,
    blob: Blob,
    companyId: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    const task: FileUploadTask = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId,
      filename,
      blob,
      companyId,
      userId,
      metadata,
      retries: 0,
      status: 'pending'
    };

    this.uploadQueue.push(task);
    
    // Salvar no IndexedDB se ainda não estiver
    try {
      await offlineDB.storeFile(fileId, filename, blob);
    } catch (error) {
      console.warn('Arquivo já existe no IndexedDB:', fileId);
    }

    console.log(`📤 FileSyncManager: Arquivo ${filename} adicionado à fila`);
    this.notifyListeners({ type: 'queue_updated', queueSize: this.uploadQueue.length });

    // Processar imediatamente se online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  // Processar fila de upload
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.uploadQueue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 FileSyncManager: Processando ${this.uploadQueue.length} arquivos`);
    
    this.notifyListeners({ 
      type: 'sync_started', 
      queueSize: this.uploadQueue.length 
    });

    const pendingTasks = this.uploadQueue.filter(task => 
      task.status === 'pending' || task.status === 'failed'
    );

    for (const task of pendingTasks) {
      await this.uploadFile(task);
      
      // Pequeno delay entre uploads para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Remover tarefas completadas
    this.uploadQueue = this.uploadQueue.filter(task => 
      task.status !== 'completed'
    );

    this.isProcessing = false;
    
    this.notifyListeners({
      type: 'sync_completed',
      queueSize: this.uploadQueue.length
    });

    console.log(`✅ FileSyncManager: Sync completado, ${this.uploadQueue.length} arquivos restantes`);
  }

  // Upload de arquivo individual
  private async uploadFile(task: FileUploadTask): Promise<void> {
    if (task.retries >= this.maxRetries) {
      task.status = 'failed';
      task.lastError = 'Máximo de tentativas excedido';
      return;
    }

    task.status = 'uploading';
    task.retries++;

    try {
      console.log(`⬆️ FileSyncManager: Enviando ${task.filename} (tentativa ${task.retries})`);

      const formData = new FormData();
      const file = new File([task.blob], task.filename, { type: task.blob.type });
      
      formData.append('file', file);
      formData.append('id', task.fileId);
      formData.append('companyId', task.companyId);
      
      if (task.userId) {
        formData.append('userId', task.userId);
      }
      
      if (task.metadata) {
        formData.append('metadata', JSON.stringify(task.metadata));
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        task.status = 'completed';

        // Marcar como enviado no IndexedDB
        // TODO: Implement markFileAsUploaded method in offlineDB
        // await offlineDB.markFileAsUploaded(task.fileId, result.file.url);

        console.log(`✅ FileSyncManager: ${task.filename} enviado com sucesso`);
        
        this.notifyListeners({
          type: 'file_uploaded',
          fileId: task.fileId,
          filename: task.filename,
          url: result.file.url
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`❌ FileSyncManager: Erro no upload de ${task.filename}:`, error);
      task.status = 'failed';
      task.lastError = error.message;

      // Retry após delay
      if (task.retries < this.maxRetries) {
        setTimeout(() => {
          task.status = 'pending';
        }, this.retryDelay * task.retries); // Delay exponencial
      }
    }
  }

  // Adicionar listener para eventos de sync
  addListener(callback: (status: any) => void): void {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback: (status: any) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notificar todos os listeners
  private notifyListeners(status: any): void {
    this.listeners.forEach(callback => callback(status));
  }

  // Obter status da fila
  getQueueStatus(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.uploadQueue.length,
      pending: this.uploadQueue.filter(t => t.status === 'pending').length,
      uploading: this.uploadQueue.filter(t => t.status === 'uploading').length,
      completed: this.uploadQueue.filter(t => t.status === 'completed').length,
      failed: this.uploadQueue.filter(t => t.status === 'failed').length,
    };
  }

  // Retry de arquivos falhados
  retryFailedUploads(): void {
    const failedTasks = this.uploadQueue.filter(task => task.status === 'failed');
    failedTasks.forEach(task => {
      task.status = 'pending';
      task.retries = 0;
      task.lastError = undefined;
    });

    if (failedTasks.length > 0) {
      console.log(`🔄 FileSyncManager: Reativando ${failedTasks.length} uploads falhados`);
      this.processQueue();
    }
  }

  // Limpar arquivos completados
  clearCompleted(): void {
    this.uploadQueue = this.uploadQueue.filter(task => task.status !== 'completed');
    this.notifyListeners({
      type: 'queue_cleared',
      queueSize: this.uploadQueue.length
    });
  }
}

// Singleton instance
export const fileSyncManager = new FileSyncManager();

// Hook para usar o sync manager em componentes React
export function useFileSyncManager() {
  const [status, setStatus] = React.useState(fileSyncManager.getQueueStatus());
  
  React.useEffect(() => {
    const handleStatusUpdate = (newStatus: any) => {
      if (newStatus.type === 'queue_updated' || 
          newStatus.type === 'sync_completed' || 
          newStatus.type === 'queue_cleared') {
        setStatus(fileSyncManager.getQueueStatus());
      }
    };

    fileSyncManager.addListener(handleStatusUpdate);
    return () => fileSyncManager.removeListener(handleStatusUpdate);
  }, []);

  return {
    status,
    addToQueue: fileSyncManager.addToQueue.bind(fileSyncManager),
    retryFailed: fileSyncManager.retryFailedUploads.bind(fileSyncManager),
    clearCompleted: fileSyncManager.clearCompleted.bind(fileSyncManager),
  };
}

export default fileSyncManager;