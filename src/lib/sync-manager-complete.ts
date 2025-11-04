// Sync Manager - Handles bidirectional sync between IndexedDB and PostgreSQL
import { offlineDB } from './indexeddb'
import type { Company, User, Project, Location, AnchorPoint, AnchorTest } from '@/types'

interface SyncOperation {
  id: string
  operation: 'create' | 'update' | 'delete'
  table: 'companies' | 'users' | 'projects' | 'locations' | 'anchor_points' | 'anchor_tests'
  data: any
  timestamp: number
  retries: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

interface SyncResponse {
  success: boolean
  results: { success: boolean; error?: string; id: string }[]
  serverData: {
    projects: Project[]
    locations: Location[]
    users: User[]
    anchorPoints: AnchorPoint[]
    anchorTests: AnchorTest[]
  }
  syncTimestamp: string
  message: string
}

class SyncManager {
  private isOnline = true
  private syncInProgress = false
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncTimestamp: string | null = null
  
  constructor() {
    this.initializeOnlineDetection()
    this.loadLastSyncTimestamp()
  }

  private initializeOnlineDetection() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        console.log('🟢 Connection restored - triggering sync')
        this.isOnline = true
        this.syncNow()
      })
      
      window.addEventListener('offline', () => {
        console.log('🔴 Connection lost')
        this.isOnline = false
      })
    }
  }

  private async loadLastSyncTimestamp() {
    if (typeof localStorage !== 'undefined') {
      this.lastSyncTimestamp = localStorage.getItem('lastSyncTimestamp')
    }
  }

  private async saveLastSyncTimestamp(timestamp: string) {
    this.lastSyncTimestamp = timestamp
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastSyncTimestamp', timestamp)
    }
  }

  // Start automatic sync (call this when app starts)
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    // Sync immediately if online
    if (this.isOnline) {
      this.syncNow()
    }
    
    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncNow()
      }
    }, intervalMinutes * 60 * 1000)
    
    console.log(`🔄 Auto-sync started (every ${intervalMinutes} minutes)`)
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Manual sync trigger
  async syncNow(): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      return { success: false, message: 'Sem conexão com internet' }
    }
    
    if (this.syncInProgress) {
      return { success: false, message: 'Sincronização já em andamento' }
    }

    console.log('🔄 Starting sync process...')
    this.syncInProgress = true

    try {
      // Get pending operations from IndexedDB
      const operations = await offlineDB.getSyncQueue()
      console.log(`📤 Found ${operations.length} pending operations`)

      if (operations.length === 0) {
        // No pending operations, but still check for server updates
        const serverUpdates = await this.fetchServerUpdates()
        if (serverUpdates) {
          await this.applyServerUpdates(serverUpdates)
          return { success: true, message: 'Dados atualizados do servidor' }
        }
        return { success: true, message: 'Nenhuma sincronização necessária' }
      }

      // Get current user context
      const currentUserId = localStorage.getItem('currentUserId')
      const currentCompanyId = localStorage.getItem('currentCompanyId')
      
      if (!currentUserId || !currentCompanyId) {
        console.warn('⚠️ No user context for sync')
        return { success: false, message: 'Usuário não autenticado' }
      }

      // Send operations to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations,
          lastSync: this.lastSyncTimestamp,
          companyId: currentCompanyId,
          userId: currentUserId
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na sincronização: ${response.status}`)
      }

      const result: SyncResponse = await response.json()
      
      // Mark successful operations as synced
      for (let i = 0; i < result.results.length; i++) {
        const operationResult = result.results[i]
        const operation = operations[i]
        
        if (operationResult.success) {
          await offlineDB.updateSyncStatus(operation.id, 'synced')
        } else {
          await offlineDB.updateSyncStatus(operation.id, 'failed')
          console.error(`❌ Operation ${operation.id} failed:`, operationResult.error)
        }
      }

      // Apply server updates to local IndexedDB
      await this.applyServerUpdates(result.serverData)
      
      // Update last sync timestamp
      await this.saveLastSyncTimestamp(result.syncTimestamp)

      const successCount = result.results.filter(r => r.success).length
      console.log(`✅ Sync completed: ${successCount}/${result.results.length} operations successful`)
      
      return { 
        success: true, 
        message: `Sincronização concluída. ${successCount}/${result.results.length} operações bem-sucedidas.` 
      }

    } catch (error: any) {
      console.error('❌ Sync failed:', error)
      return { 
        success: false, 
        message: `Erro na sincronização: ${error.message}` 
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Fetch updates from server without sending local changes
  private async fetchServerUpdates(): Promise<any> {
    const currentUserId = localStorage.getItem('currentUserId')
    const currentCompanyId = localStorage.getItem('currentCompanyId')
    
    if (!currentUserId || !currentCompanyId) return null

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: [], // No operations to send
          lastSync: this.lastSyncTimestamp,
          companyId: currentCompanyId,
          userId: currentUserId
        })
      })

      if (response.ok) {
        const result: SyncResponse = await response.json()
        await this.saveLastSyncTimestamp(result.syncTimestamp)
        return result.serverData
      }
    } catch (error) {
      console.warn('Failed to fetch server updates:', error)
    }
    
    return null
  }

  // Apply server updates to local IndexedDB
  private async applyServerUpdates(serverData: SyncResponse['serverData']) {
    console.log('📥 Applying server updates...')
    
    try {
      // Update projects
      for (const project of serverData.projects) {
        await offlineDB.put('projects', project, false) // false = don't add to sync queue
      }
      
      // Update locations  
      for (const location of serverData.locations) {
        await offlineDB.put('locations', location, false)
      }
      
      // Update users
      for (const user of serverData.users) {
        await offlineDB.put('users', user, false)
      }
      
      // Update anchor points
      for (const point of serverData.anchorPoints) {
        await offlineDB.put('anchor_points', point, false)
      }
      
      // Update anchor tests
      for (const test of serverData.anchorTests) {
        await offlineDB.put('anchor_tests', test, false)
      }
      
      console.log('✅ Server updates applied to IndexedDB')
      
      // Notify other parts of the app that data has been updated
      window.dispatchEvent(new CustomEvent('dataSync', { 
        detail: { 
          type: 'updated',
          timestamp: new Date().toISOString()
        } 
      }))
      
    } catch (error) {
      console.error('❌ Failed to apply server updates:', error)
    }
  }

  // Get sync status info
  async getSyncStatus(): Promise<{
    isOnline: boolean
    syncInProgress: boolean
    pendingOperations: number
    lastSync: string | null
  }> {
    const operations = await offlineDB.getSyncQueue()
    
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: operations.length,
      lastSync: this.lastSyncTimestamp
    }
  }

  // Force sync of specific operation
  async forceSyncOperation(operationId: string): Promise<boolean> {
    try {
      const operation = await offlineDB.get('sync_queue', operationId)
      if (!operation) return false

      // Reset operation status to pending
      await offlineDB.updateSyncStatus(operationId, 'pending')
      
      // Trigger sync
      const result = await this.syncNow()
      return result.success
      
    } catch (error) {
      console.error('Failed to force sync operation:', error)
      return false
    }
  }

  // Clear failed operations (admin function)
  async clearFailedOperations(): Promise<number> {
    const operations = await offlineDB.getSyncQueue()
    const failedOps = operations.filter(op => op.status === 'failed')
    
    for (const op of failedOps) {
      await offlineDB.delete('sync_queue', op.id)
    }
    
    console.log(`🧹 Cleared ${failedOps.length} failed operations`)
    return failedOps.length
  }
}

// Export singleton instance
export const syncManager = new SyncManager()

// Export for use in React components
export function useSyncManager() {
  return {
    syncNow: () => syncManager.syncNow(),
    getSyncStatus: () => syncManager.getSyncStatus(),
    forceSyncOperation: (id: string) => syncManager.forceSyncOperation(id),
    clearFailedOperations: () => syncManager.clearFailedOperations()
  }
}