// AnchorView Service Worker - Offline-First PWA
// Funcionalidades: Cache completo, Background Sync, IndexedDB sync, Push Notifications

const CACHE_NAME = 'anchorview-v2'
const STATIC_CACHE = 'anchorview-static-v2'
const DYNAMIC_CACHE = 'anchorview-dynamic-v2'
const API_CACHE = 'anchorview-api-v2'

// Arquivos para cache estático (essenciais para funcionamento offline)
const STATIC_FILES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js'
]

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Sempre cache first para arquivos estáticos
  CACHE_FIRST: 'cache-first',
  // Network first para APIs com fallback para cache
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate para dados dinâmicos
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Configuração de rotas
const ROUTE_CONFIGS = [
  { pattern: /\/_next\/static\//, strategy: CACHE_STRATEGIES.CACHE_FIRST },
  { pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
  { pattern: /\/api\/auth\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
  { pattern: /\/$/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE }
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando v2...')
  
  event.waitUntil(
    Promise.all([
      // Cache arquivos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Cacheando arquivos estáticos')
        return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })))
      }),
      
      // Inicializar cache dinâmico
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      
      // Skip waiting para ativar imediatamente
      self.skipWaiting()
    ])
  )
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativando v2...')
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE &&
                     cacheName !== CACHE_NAME
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      
      // Claim todos os clientes
      self.clients.claim()
    ])
  )
})

// Interceptar requisições (fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignorar requisições não-HTTP
  if (!url.protocol.startsWith('http')) return
  
  // Determinar estratégia de cache baseada na URL
  const strategy = determineStrategy(request.url)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Determinar estratégia de cache para uma URL
function determineStrategy(url) {
  for (const config of ROUTE_CONFIGS) {
    if (config.pattern.test(url)) {
      return config.strategy
    }
  }
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE // default
}

// Lidar com requisições baseado na estratégia
async function handleRequest(request, strategy) {
  const url = new URL(request.url)
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request)
        
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request)
        
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request)
        
      default:
        return await networkFirst(request)
    }
  } catch (error) {
    console.error('❌ Service Worker: Erro no fetch:', error)
    return await handleOfflineFallback(request)
  }
}

// Estratégia Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(
        request.url.includes('/api/') ? API_CACHE : DYNAMIC_CACHE
      )
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback para cache se network falhar
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      console.log('📱 Service Worker: Servindo do cache (offline):', request.url)
      return cachedResponse
    }
    
    throw error
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = caches.match(request)
  
  const networkResponsePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => null)
  
  // Retornar cache imediatamente se disponível, senão esperar network
  return (await cachedResponse) || (await networkResponsePromise)
}

// Fallback para quando tudo falha
async function handleOfflineFallback(request) {
  const url = new URL(request.url)
  
  // Para navegação, mostrar página offline
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
  }
  
  // Para APIs, retornar resposta JSON offline
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'Offline - dados não disponíveis',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Para outros recursos, retornar erro
  return new Response('Recurso não disponível offline', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  })
}

// Background Sync para sincronização de dados
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncOfflineData())
  }
  
  if (event.tag === 'background-sync-files') {
    event.waitUntil(syncOfflineFiles())
  }
})

// Sincronizar dados offline com servidor
async function syncOfflineData() {
  try {
    console.log('🔄 Service Worker: Iniciando sync de dados...')
    
    // Abrir IndexedDB
    const db = await openIndexedDB()
    
    // Pegar itens da fila de sync
    const syncQueue = await getAllFromStore(db, 'sync_queue')
    const pendingItems = syncQueue.filter(item => item.status === 'pending')
    
    console.log(`📤 Service Worker: Sincronizando ${pendingItems.length} itens`)
    
    let synced = 0
    let failed = 0
    
    for (const item of pendingItems) {
      try {
        // Atualizar status para 'syncing'
        await updateSyncItemStatus(db, item.id, 'syncing')
        
        // Executar operação no servidor
        const success = await executeServerSync(item)
        
        if (success) {
          await updateSyncItemStatus(db, item.id, 'synced')
          synced++
        } else {
          await updateSyncItemStatus(db, item.id, 'failed')
          failed++
        }
      } catch (error) {
        console.error('❌ Service Worker: Erro no sync do item:', item.id, error)
        await updateSyncItemStatus(db, item.id, 'failed')
        failed++
      }
    }
    
    console.log(`✅ Service Worker: Sync completo - ${synced} ok, ${failed} falhas`)
    
    // Notificar clientes sobre o sync
    await notifyClients('sync-completed', { synced, failed })
    
  } catch (error) {
    console.error('❌ Service Worker: Erro no background sync:', error)
  }
}

// Executar operação de sync no servidor
async function executeServerSync(syncItem) {
  try {
    const { table, operation, data } = syncItem
    
    let response
    
    switch (operation) {
      case 'create':
        response = await fetch(`/api/sync/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
        
      case 'update':
        response = await fetch(`/api/sync/${table}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
        
      case 'delete':
        response = await fetch(`/api/sync/${table}/${data.id}`, {
          method: 'DELETE'
        })
        break
        
      default:
        return false
    }
    
    return response.ok
    
  } catch (error) {
    console.error('Server sync error:', error)
    return false
  }
}

// Sincronizar arquivos offline
async function syncOfflineFiles() {
  try {
    console.log('📎 Service Worker: Iniciando sync de arquivos...')
    
    const db = await openIndexedDB()
    const files = await getFilesToUpload(db)
    
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file.blob, file.filename)
        formData.append('id', file.id)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          await markFileAsUploaded(db, file.id, result.url)
        }
      } catch (error) {
        console.error('File upload error:', error)
      }
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Erro no sync de arquivos:', error)
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'Você tem novos dados sincronizados!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'sync-notification',
    data: { url: '/' }
  }
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data.url = data.url || options.data.url
  }
  
  event.waitUntil(
    self.registration.showNotification('AnchorView', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.openWindow(url)
  )
})

// Utilitários IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AnchorViewDB', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function updateSyncItemStatus(db, id, status) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const item = getRequest.result
      if (item) {
        item.status = status
        const putRequest = store.put(item)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

async function getFilesToUpload(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['files'], 'readonly')
    const store = transaction.objectStore('files')
    const index = store.index('uploaded')
    const request = index.getAll(false) // uploaded: false
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function markFileAsUploaded(db, fileId, url) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['files'], 'readwrite')
    const store = transaction.objectStore('files')
    const getRequest = store.get(fileId)
    
    getRequest.onsuccess = () => {
      const file = getRequest.result
      if (file) {
        file.uploaded = true
        file.url = url
        const putRequest = store.put(file)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Comunicação com clientes
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type, data })
  })
}

console.log('🚀 Service Worker v2: Carregado e pronto para funcionar offline!')