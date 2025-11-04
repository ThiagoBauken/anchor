'use client'

import { indexedDBStorage } from './indexeddb-storage'

// Extend ServiceWorkerRegistration with Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>
  getTags(): Promise<string[]>
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: SyncManager
}

export class PWAIntegration {
  private serviceWorker: ServiceWorker | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker()
      this.setupEventListeners()
    }
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registrado:', registration)
        
        // Get active service worker
        this.serviceWorker = registration.active || registration.waiting || registration.installing
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this))
        
        // Initialize IndexedDB
        await indexedDBStorage.init()
        
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error)
      }
    }
  }

  private setupEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      this.triggerBackgroundSync()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    
    // App visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerBackgroundSync()
      }
    })
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data
    
    switch (type) {
      case 'sync-completed':
        console.log('Sincronização completa:', data)
        this.notifyApp('sync-completed', data)
        break
        
      case 'sync-failed':
        console.log('Falha na sincronização:', data)
        this.notifyApp('sync-failed', data)
        break
        
      default:
        console.log('Mensagem do Service Worker:', type, data)
    }
  }

  private notifyApp(type: string, data: any) {
    // Dispatch custom event for app components to listen
    window.dispatchEvent(new CustomEvent('pwa-event', {
      detail: { type, data }
    }))
  }

  // Trigger background sync manually
  async triggerBackgroundSync() {
    if (typeof window === 'undefined') return
    
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration

        // Register different sync tags
        await registration.sync.register('background-sync-anchor-data')
        await registration.sync.register('background-sync-photos')
        await registration.sync.register('background-sync-inspection-data')
        
        console.log('Background sync registrado')
      } catch (error) {
        console.error('Erro ao registrar background sync:', error)
      }
    }
  }

  // Queue photo for background sync
  async queuePhotoForSync(photoData: any) {
    try {
      // Add to IndexedDB
      await indexedDBStorage.addPhoto(photoData)
      
      // Add to sync queue
      await indexedDBStorage.addToSyncQueue({
        type: 'photos-pending-sync',
        data: photoData,
        priority: 2 // High priority for photos
      })
      
      // If online, try immediate sync
      if (this.isOnline) {
        this.triggerBackgroundSync()
      }
      
      return true
    } catch (error) {
      console.error('Erro ao enfileirar foto para sync:', error)
      return false
    }
  }

  // Queue anchor data for sync
  async queueAnchorDataForSync(anchorData: any) {
    try {
      await indexedDBStorage.addToSyncQueue({
        type: 'anchor-pending-sync',
        data: anchorData,
        priority: 1 // Medium priority
      })
      
      if (this.isOnline) {
        this.triggerBackgroundSync()
      }
      
      return true
    } catch (error) {
      console.error('Erro ao enfileirar dados de ancoragem para sync:', error)
      return false
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const [unsyncedPhotos, syncQueue] = await Promise.all([
        indexedDBStorage.getUnsyncedPhotos(),
        indexedDBStorage.getSyncQueue()
      ])
      
      return {
        pendingPhotos: unsyncedPhotos.length,
        pendingItems: syncQueue.length,
        isOnline: this.isOnline,
        lastSync: localStorage.getItem('lastSyncTime') || null
      }
    } catch (error) {
      console.error('Erro ao obter status de sync:', error)
      return {
        pendingPhotos: 0,
        pendingItems: 0,
        isOnline: this.isOnline,
        lastSync: null
      }
    }
  }

  // Manual sync trigger (for user-initiated sync)
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('Não é possível sincronizar offline')
    }
    
    try {
      await this.triggerBackgroundSync()
      
      // Wait a bit for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update last sync time
      localStorage.setItem('lastSyncTime', new Date().toISOString())
      
      return true
    } catch (error) {
      console.error('Erro na sincronização manual:', error)
      throw error
    }
  }

  // Request push notification permission
  async requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  // Install PWA prompt
  async installPWA() {
    if (typeof window === 'undefined') return false
    
    const deferredPrompt = (window as any).deferredPrompt
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('PWA install outcome:', outcome)
      return outcome === 'accepted'
    }
    return false
  }

  // Check if app is installed
  isInstalled() {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://')
  }

  // Get network status
  getNetworkStatus() {
    if (typeof navigator === 'undefined') {
      return { online: true, connection: null, effectiveType: null }
    }
    
    return {
      online: this.isOnline,
      connection: (navigator as any).connection,
      effectiveType: (navigator as any).connection?.effectiveType
    }
  }
}

// Singleton instance
export const pwaIntegration = new PWAIntegration()