// IndexedDB wrapper para sistema offline-first completo
import type { Company, User, Project, Location, AnchorPoint, AnchorTest } from '@/types'

interface DBSchema {
  companies: Company
  users: User & { password_hash?: string; offline_created?: boolean }
  projects: Project
  locations: Location  
  anchor_points: AnchorPoint
  anchor_tests: AnchorTest
  sync_queue: SyncOperation
  files: FileRecord
}

interface SyncOperation {
  id: string
  operation: 'create' | 'update' | 'delete'
  table: keyof Omit<DBSchema, 'sync_queue' | 'files'>
  data: any
  timestamp: number
  retries: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

interface FileRecord {
  id: string
  filename: string
  blob: Blob
  uploaded: boolean
  url?: string
  timestamp: number
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private readonly dbName = 'AnchorViewDB'
  private readonly version = 1

  async init(): Promise<void> {
    if (this.db) return
    if (typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Companies store
        if (!db.objectStoreNames.contains('companies')) {
          const companiesStore = db.createObjectStore('companies', { keyPath: 'id' })
          companiesStore.createIndex('name', 'name', { unique: false })
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' })
          usersStore.createIndex('email', 'email', { unique: true })
          usersStore.createIndex('companyId', 'companyId', { unique: false })
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectsStore.createIndex('companyId', 'companyId', { unique: false })
          projectsStore.createIndex('name', 'name', { unique: false })
        }

        // Locations store
        if (!db.objectStoreNames.contains('locations')) {
          const locationsStore = db.createObjectStore('locations', { keyPath: 'id' })
          locationsStore.createIndex('companyId', 'companyId', { unique: false })
        }

        // Anchor points store
        if (!db.objectStoreNames.contains('anchor_points')) {
          const pointsStore = db.createObjectStore('anchor_points', { keyPath: 'id' })
          pointsStore.createIndex('projectId', 'projectId', { unique: false })
          pointsStore.createIndex('numeroPonto', 'numeroPonto', { unique: false })
          pointsStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }

        // Anchor tests store
        if (!db.objectStoreNames.contains('anchor_tests')) {
          const testsStore = db.createObjectStore('anchor_tests', { keyPath: 'id' })
          testsStore.createIndex('pontoId', 'pontoId', { unique: false })
          testsStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
          syncStore.createIndex('status', 'status', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' })
          filesStore.createIndex('uploaded', 'uploaded', { unique: false })
        }
      }
    })
  }

  private async getStore(storeName: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // Generic CRUD operations
  async get<T extends keyof DBSchema>(
    storeName: T, 
    key: string
  ): Promise<DBSchema[T] | null> {
    const store = await this.getStore(storeName)
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T extends keyof DBSchema>(storeName: T): Promise<DBSchema[T][]> {
    const store = await this.getStore(storeName)
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getByIndex<T extends keyof DBSchema>(
    storeName: T,
    indexName: string,
    value: any
  ): Promise<DBSchema[T][]> {
    const store = await this.getStore(storeName)
    const index = store.index(indexName)
    return new Promise((resolve, reject) => {
      const request = index.getAll(value)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async put<T extends keyof DBSchema>(
    storeName: T,
    data: DBSchema[T],
    addToSyncQueue = true
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite')
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...data,
        lastModified: Date.now(),
        syncStatus: 'pending'
      })
      
      request.onsuccess = async () => {
        // Add to sync queue if not a sync operation
        if (addToSyncQueue && storeName !== 'sync_queue') {
          await this.addToSyncQueue('create', storeName as any, data)
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async delete<T extends keyof DBSchema>(
    storeName: T,
    key: string,
    addToSyncQueue = true
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = async () => {
        if (addToSyncQueue && storeName !== 'sync_queue') {
          await this.addToSyncQueue('delete', storeName as any, { id: key })
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Sync queue operations
  async addToSyncQueue(
    operation: SyncOperation['operation'],
    table: SyncOperation['table'],
    data: any
  ): Promise<void> {
    const syncOperation: SyncOperation = {
      id: `${table}_${operation}_${data.id || Date.now()}`,
      operation,
      table,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    }

    await this.put('sync_queue', syncOperation, false)
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    return this.getByIndex('sync_queue', 'status', 'pending')
  }

  async updateSyncStatus(id: string, status: SyncOperation['status']): Promise<void> {
    const operation = await this.get('sync_queue', id)
    if (operation) {
      await this.put('sync_queue', { ...operation, status }, false)
    }
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return this.getAll('companies')
  }

  async createCompany(company: Company): Promise<void> {
    await this.put('companies', {
      ...company,
      // offline_created: true,
      createdAt: new Date().toISOString()
    } as any)
  }

  // User operations (with offline authentication)
  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const users = await this.getByIndex('users', 'email', email)
      if (users.length === 0) return null

      const user = users[0] as User & { password_hash?: string; password?: string }
      
      // Check both password formats for backwards compatibility
      const expectedHash = this.simpleHash(password)
      const isValidPassword = user.password_hash === expectedHash || user.password === password
      
      if (isValidPassword) {
        // Return clean user object without password fields
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          active: user.active,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        } as User
      }
      
      return null
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  async createUser(user: User & { password: string }): Promise<void> {
    const { password, ...userData } = user
    await this.put('users', {
      ...userData,
      password_hash: this.simpleHash(password),
      // offline_created: true,
      createdAt: new Date().toISOString()
    } as any)
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return this.getByIndex('users', 'companyId', companyId)
  }

  // Project operations
  async getProjectsByCompany(companyId: string): Promise<Project[]> {
    return this.getByIndex('projects', 'companyId', companyId)
  }

  async createProject(project: Project): Promise<void> {
    await this.put('projects', {
      ...project,
      // offline_created: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any)
  }

  // Location operations
  async getLocationsByCompany(companyId: string): Promise<Location[]> {
    return this.getByIndex('locations', 'companyId', companyId)
  }

  // Anchor points operations
  async getPointsByProject(projectId: string): Promise<AnchorPoint[]> {
    return this.getByIndex('anchor_points', 'projectId', projectId)
  }

  async createPoint(point: AnchorPoint): Promise<void> {
    await this.put('anchor_points', {
      ...point,
      offlineCreated: true,
      dataHora: new Date().toISOString()
    } as any)
  }

  async updatePoint(point: AnchorPoint): Promise<void> {
    await this.put('anchor_points', {
      ...point,
      lastSyncedAt: new Date().toISOString()
    })
  }

  // Anchor tests operations
  async getTestsByPoint(pontoId: string): Promise<AnchorTest[]> {
    return this.getByIndex('anchor_tests', 'pontoId', pontoId)
  }

  async createTest(test: AnchorTest): Promise<void> {
    await this.put('anchor_tests', {
      ...test,
      offlineCreated: true,
      dataHora: new Date().toISOString()
    })
  }

  // File operations
  async storeFile(id: string, filename: string, blob: Blob): Promise<void> {
    const fileRecord: FileRecord = {
      id,
      filename,
      blob,
      uploaded: false,
      timestamp: Date.now()
    }
    await this.put('files', fileRecord, false)
  }

  async getFile(id: string): Promise<FileRecord | null> {
    return this.get('files', id)
  }

  async getPendingFiles(): Promise<FileRecord[]> {
    return this.getByIndex('files', 'uploaded', false)
  }

  // Utility functions
  private simpleHash(password: string): string {
    // Simple hash for offline mode - in production use bcrypt
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  // Clear all data (for logout/reset)
  async clearAllData(): Promise<void> {
    if (!this.db) return
    
    const storeNames: (keyof DBSchema)[] = [
      'companies', 'users', 'projects', 'locations', 
      'anchor_points', 'anchor_tests', 'sync_queue', 'files'
    ]
    
    const transaction = this.db.transaction(storeNames, 'readwrite')
    
    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName)
      store.clear()
    }
  }

  // Get database stats
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {}
    
    const storeNames: (keyof DBSchema)[] = [
      'companies', 'users', 'projects', 'locations', 
      'anchor_points', 'anchor_tests', 'sync_queue', 'files'
    ]

    for (const storeName of storeNames) {
      const data = await this.getAll(storeName)
      stats[storeName] = data.length
    }

    return stats
  }
}

// Singleton instance
export const offlineDB = new OfflineDB()

// Initialize on import (only in browser)
if (typeof window !== 'undefined') {
  offlineDB.init().catch(console.error)
}

export default offlineDB