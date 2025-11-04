// IndexedDB wrapper for robust offline storage
export class IndexedDBStorage {
  private dbName: string
  private dbVersion: number
  private db: IDBDatabase | null = null

  constructor(dbName = 'AnchorViewDB', dbVersion = 1) {
    this.dbName = dbName
    this.dbVersion = dbVersion
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available')
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' })
          photosStore.createIndex('anchorPointId', 'anchorPointId', { unique: false })
          photosStore.createIndex('synced', 'synced', { unique: false })
          photosStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Anchor points store
        if (!db.objectStoreNames.contains('anchorPoints')) {
          const anchorPointsStore = db.createObjectStore('anchorPoints', { keyPath: 'id' })
          anchorPointsStore.createIndex('projectId', 'projectId', { unique: false })
          anchorPointsStore.createIndex('synced', 'synced', { unique: false })
        }

        // Anchor tests store
        if (!db.objectStoreNames.contains('anchorTests')) {
          const anchorTestsStore = db.createObjectStore('anchorTests', { keyPath: 'id' })
          anchorTestsStore.createIndex('anchorPointId', 'anchorPointId', { unique: false })
          anchorTestsStore.createIndex('synced', 'synced', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncQueueStore.createIndex('type', 'type', { unique: false })
          syncQueueStore.createIndex('priority', 'priority', { unique: false })
          syncQueueStore.createIndex('retryCount', 'retryCount', { unique: false })
        }
      }
    })
  }

  async addPhoto(photo: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['photos'], 'readwrite')
    const store = transaction.objectStore('photos')
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...photo,
        createdAt: new Date().toISOString(),
        synced: false
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPhotos(anchorPointId?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['photos'], 'readonly')
    const store = transaction.objectStore('photos')
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest
      
      if (anchorPointId) {
        const index = store.index('anchorPointId')
        request = index.getAll(anchorPointId)
      } else {
        request = store.getAll()
      }
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedPhotos(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['photos'], 'readonly')
    const store = transaction.objectStore('photos')
    const index = store.index('synced')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(false as any)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markPhotoSynced(photoId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['photos'], 'readwrite')
    const store = transaction.objectStore('photos')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(photoId)
      
      getRequest.onsuccess = () => {
        const photo = getRequest.result
        if (photo) {
          photo.synced = true
          photo.syncedAt = new Date().toISOString()
          
          const putRequest = store.put(photo)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('Photo not found'))
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async addToSyncQueue(item: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        id: crypto.randomUUID(),
        ...item,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        priority: item.priority || 1
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['syncQueue'], 'readonly')
    const store = transaction.objectStore('syncQueue')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        // Sort by priority (higher first) then by creation time
        const items = request.result.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        resolve(items)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromSyncQueue(itemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(itemId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async incrementRetryCount(itemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(itemId)
      
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1
          item.lastRetry = new Date().toISOString()
          
          const putRequest = store.put(item)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('Item not found'))
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['photos', 'anchorPoints', 'anchorTests'], 'readwrite')
    
    // Clear synced photos older than 30 days
    const photosStore = transaction.objectStore('photos')
    const photoIndex = photosStore.index('synced')
    const syncedPhotos = await new Promise<any[]>((resolve, reject) => {
      const request = photoIndex.getAll(true as any)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    for (const photo of syncedPhotos) {
      if (new Date(photo.syncedAt).getTime() < thirtyDaysAgo) {
        photosStore.delete(photo.id)
      }
    }
  }

  async exportData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized')
    
    const [photos, anchorPoints, anchorTests, syncQueue] = await Promise.all([
      this.getPhotos(),
      this.getAllAnchorPoints(),
      this.getAllAnchorTests(),
      this.getSyncQueue()
    ])
    
    return {
      photos,
      anchorPoints,
      anchorTests,
      syncQueue,
      exportedAt: new Date().toISOString()
    }
  }

  private async getAllAnchorPoints(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['anchorPoints'], 'readonly')
    const store = transaction.objectStore('anchorPoints')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async getAllAnchorTests(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['anchorTests'], 'readonly')
    const store = transaction.objectStore('anchorTests')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const indexedDBStorage = new IndexedDBStorage()