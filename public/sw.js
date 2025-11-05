// AnchorView Service Worker - Offline-First PWA
// Funcionalidades: Cache completo, Background Sync, IndexedDB sync, Push Notifications, JWT Auth

const CACHE_NAME = 'anchorview-v4'
const STATIC_CACHE = 'anchorview-static-v4'
const DYNAMIC_CACHE = 'anchorview-dynamic-v4'
const API_CACHE = 'anchorview-api-v4'

// JWT Token Cache (armazenado em memória)
let jwtToken = null
let tokenExpiry = null

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
  { pattern: /\/$/, strategy: CACHE_STRATEGIES.CACHE_FIRST } // Mudança para cache first na home
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando v4 (com JWT Auth)...')
  
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
  console.log('✅ Service Worker: Ativando v4 (com JWT Auth)...')
  
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
  
  // Ignorar requisições do Next.js router que causam "Failed to fetch"
  if (url.pathname.includes('/_next/') && url.searchParams.has('__rsc')) {
    return // Deixa o Next.js gerenciar
  }
  
  // Ignorar prefetch requests que podem falhar offline
  if (request.mode === 'navigate' && request.destination === '') {
    return // Deixa o Next.js gerenciar prefetch
  }
  
  // Determinar estratégia de cache baseada na URL
  const strategy = determineStrategy(request.url)
  
  event.respondWith(
    handleRequest(request, strategy).catch(async (error) => {
      console.log('🔄 SW: Request failed, trying fallback:', url.pathname)
      
      // Para navegação (incluindo refresh/F5), primeiro tenta página principal em cache
      if (request.mode === 'navigate') {
        // Primeiro tenta a página principal em cache
        const cachedHomePage = await caches.match('/')
        if (cachedHomePage) {
          console.log('📱 SW: Serving cached home page for navigation:', url.pathname)
          return cachedHomePage
        }
        
        // Se não encontrar, tenta a página offline
        const offlinePage = await caches.match('/offline')
        if (offlinePage) {
          console.log('📱 SW: Serving offline page for navigation:', url.pathname)
          return offlinePage
        }
        
        // Última opção: resposta genérica
        return new Response('App offline - Recarregue quando tiver conexão', { 
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
      
      // Para outros recursos, tenta cache
      return caches.match(request) || new Response('', { status: 503 })
    })
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
  
  // Para navegação, primeiro tenta página principal, depois offline
  if (request.mode === 'navigate') {
    // Primeiro tenta a página principal em cache
    const cachedHomePage = await caches.match('/')
    if (cachedHomePage) {
      console.log('📱 SW: Fallback serving cached home page for:', url.pathname)
      return cachedHomePage
    }
    
    // Se não encontrar, tenta a página offline
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      console.log('📱 SW: Fallback serving offline page for:', url.pathname)
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
    
    // Verificar se as stores existem
    if (!db.objectStoreNames.contains('sync_queue')) {
      console.log('📦 Service Worker: Store sync_queue não existe, ignorando sync')
      return
    }
    
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
    // Notificar sobre falha
    await notifyClients('sync-failed', { error: error.message })
  }
}

// ===== JWT AUTHENTICATION =====

/**
 * Busca um novo JWT token do servidor
 * Requer que o usuário esteja autenticado (session cookie)
 */
async function fetchNewJWTToken() {
  try {
    console.log('🔑 Service Worker: Buscando novo JWT token...')

    const response = await fetch('/api/auth/sync-token', {
      method: 'POST',
      credentials: 'include' // Inclui cookies de sessão
    })

    if (!response.ok) {
      console.error('❌ Service Worker: Falha ao obter JWT token:', response.status)
      return null
    }

    const data = await response.json()

    jwtToken = data.token
    tokenExpiry = new Date(data.expiresAt).getTime()

    console.log('✅ Service Worker: JWT token obtido com sucesso')
    console.log('⏰ Service Worker: Token expira em:', new Date(tokenExpiry).toLocaleString())

    return jwtToken

  } catch (error) {
    console.error('❌ Service Worker: Erro ao buscar JWT token:', error)
    return null
  }
}

/**
 * Garante que temos um token JWT válido
 * Busca novo token se não existe ou está expirado
 */
async function ensureValidToken() {
  const now = Date.now()

  // Se não tem token ou está expirado (ou expirando nos próximos 5 min)
  if (!jwtToken || !tokenExpiry || tokenExpiry - now < 5 * 60 * 1000) {
    console.log('🔄 Service Worker: Token inválido ou expirando, renovando...')
    return await fetchNewJWTToken()
  }

  return jwtToken
}

/**
 * Cria headers com autenticação JWT
 */
function createAuthHeaders(additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`
  }

  return headers
}

// ===== END JWT AUTHENTICATION =====

// Executar operação de sync no servidor (COM AUTENTICAÇÃO JWT)
async function executeServerSync(syncItem) {
  try {
    const { table, operation, data } = syncItem

    // IMPORTANTE: Garantir token válido antes de sincronizar
    const token = await ensureValidToken()

    if (!token) {
      console.error('❌ Service Worker: Não foi possível obter token JWT para sync')
      return false
    }

    let response

    switch (operation) {
      case 'create':
        response = await fetch(`/api/sync/${table}`, {
          method: 'POST',
          headers: createAuthHeaders(),
          body: JSON.stringify(data)
        })
        break

      case 'update':
        response = await fetch(`/api/sync/${table}/${data.id}`, {
          method: 'PUT',
          headers: createAuthHeaders(),
          body: JSON.stringify(data)
        })
        break

      case 'delete':
        response = await fetch(`/api/sync/${table}/${data.id}`, {
          method: 'DELETE',
          headers: createAuthHeaders()
        })
        break

      default:
        return false
    }

    // Se token expirou durante a operação, tentar renovar e fazer retry
    if (response.status === 401) {
      console.log('🔄 Service Worker: Token expirado, renovando e tentando novamente...')
      jwtToken = null // Forçar renovação
      const newToken = await ensureValidToken()

      if (newToken) {
        // Retry da operação com novo token
        return await executeServerSync(syncItem)
      }
    }

    return response.ok

  } catch (error) {
    console.error('❌ Service Worker: Erro no sync:', error)
    return false
  }
}

// Sincronizar arquivos offline (COM AUTENTICAÇÃO JWT)
async function syncOfflineFiles() {
  try {
    console.log('📎 Service Worker: Iniciando sync de arquivos...')

    // IMPORTANTE: Garantir token válido antes de sincronizar
    const token = await ensureValidToken()

    if (!token) {
      console.error('❌ Service Worker: Não foi possível obter token JWT para sync de arquivos')
      return
    }

    const db = await openIndexedDB()
    const files = await getFilesToUpload(db)

    console.log(`📤 Service Worker: Enviando ${files.length} arquivos`)

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file.blob, file.filename)
        formData.append('id', file.id)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}` // Adicionar JWT
            // Não adicionar Content-Type para FormData (browser define automaticamente)
          },
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          await markFileAsUploaded(db, file.id, result.url)
          console.log(`✅ Service Worker: Arquivo ${file.filename} enviado com sucesso`)
        } else if (response.status === 401) {
          console.log('🔄 Service Worker: Token expirado no upload, renovando...')
          jwtToken = null // Forçar renovação
          // Token será renovado na próxima tentativa de sync
          break // Sair do loop para tentar novamente no próximo sync
        }
      } catch (error) {
        console.error('❌ Service Worker: Erro no upload:', error)
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
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    
    const request = indexedDB.open('AnchorViewDB', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
        syncStore.createIndex('status', 'status', { unique: false })
      }
      
      if (!db.objectStoreNames.contains('files')) {
        const filesStore = db.createObjectStore('files', { keyPath: 'id' })
        filesStore.createIndex('uploaded', 'uploaded', { unique: false })
      }
    }
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

console.log('🚀 Service Worker v4: Carregado com JWT Authentication!')
console.log('🔐 Service Worker v4: Background sync protegido com autenticação')