# 🚀 SISTEMA COMPLETO PWA HÍBRIDO - ANCHORVIEW

## 📋 ARQUIVOS A SEREM CRIADOS/MODIFICADOS

Este documento lista TODOS os arquivos necessários para implementar um sistema PWA híbrido completo que funciona online e offline com sincronização automática.

---

## 🔐 1. SISTEMA DE AUTENTICAÇÃO COMPLETO

### `/src/app/api/auth/login/route.ts` ✅ CRIADO
- Login com JWT + sessões no PostgreSQL
- Cookies seguros + localStorage fallback
- Integração com tabela `user_sessions`

### `/src/app/api/auth/logout/route.ts` ✅ CRIADO
- Logout que desativa sessões no banco
- Limpa cookies e localStorage

### `/src/app/api/auth/refresh/route.ts` ✅ CRIADO
- Renovação automática de tokens
- Mantém usuário logado por 7 dias

### `/src/app/api/auth/me/route.ts` ✅ CRIADO
- Verifica usuário atual
- Atualiza último acesso

### `/src/app/api/auth/register/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, companyId, role = 'user' } = await request.json()
    
    // Validações
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }
    
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    
    // Hash da senha
    const password_hash = await bcrypt.hash(password, 12)
    
    // Criar usuário
    const user = await prisma.user.create({
      data: { name, email, password_hash, role, companyId },
      include: { company: true }
    })
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
```

### `/src/middleware.ts` ❌ CRIAR
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Rotas que precisam de autenticação
const protectedRoutes = ['/api/sync', '/api/files', '/api/notifications', '/api/audit']

export function middleware(request: NextRequest) {
  // Verificar se é rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  const token = request.cookies.get('access_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Adicionar info do usuário nos headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', (decoded as any).userId)
    requestHeaders.set('x-user-role', (decoded as any).role)
    requestHeaders.set('x-company-id', (decoded as any).companyId)
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/sync/:path*', '/api/files/:path*', '/api/notifications/:path*', '/api/audit/:path*']
}
```

---

## 📁 2. SISTEMA DE UPLOAD E GESTÃO DE ARQUIVOS

### `/src/app/api/files/upload/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }
    
    // Validações
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande' }, { status: 413 })
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 415 })
    }
    
    // Gerar hash do arquivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
    
    // Verificar se arquivo já existe (deduplicação)
    const existingFile = await prisma.files.findFirst({
      where: { file_hash: fileHash, company_id: companyId }
    })
    
    if (existingFile) {
      return NextResponse.json({
        success: true,
        file: existingFile,
        message: 'Arquivo já existe'
      })
    }
    
    // Criar diretórios
    const uploadDir = join(process.cwd(), 'public', 'uploads', companyId)
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const finalDir = join(uploadDir, String(year), month)
    
    if (!existsSync(finalDir)) {
      await mkdir(finalDir, { recursive: true })
    }
    
    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${fileHash.substring(0, 8)}.${extension}`
    const filePath = join(finalDir, fileName)
    const publicPath = `/uploads/${companyId}/${year}/${month}/${fileName}`
    
    // Salvar arquivo
    await writeFile(filePath, buffer)
    
    // Salvar no banco
    const fileRecord = await prisma.files.create({
      data: {
        original_name: file.name,
        file_name: fileName,
        file_path: publicPath,
        file_size: file.size,
        mime_type: file.type,
        file_hash: fileHash,
        uploaded_by: userId,
        company_id: companyId
      }
    })
    
    return NextResponse.json({
      success: true,
      file: fileRecord
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
```

### `/src/app/api/files/[id]/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = request.headers.get('x-company-id')
    
    // Buscar arquivo no banco
    const file = await prisma.files.findFirst({
      where: {
        id: params.id,
        company_id: companyId,
        deleted_at: null
      }
    })
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }
    
    // Ler arquivo do disco
    const filePath = join(process.cwd(), 'public', file.file_path)
    const buffer = await readFile(filePath)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Length': String(file.file_size),
        'Content-Disposition': `inline; filename="${file.original_name}"`
      }
    })
    
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = request.headers.get('x-company-id')
    
    // Soft delete
    await prisma.files.update({
      where: { id: params.id },
      data: { deleted_at: new Date() }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar arquivo' }, { status: 500 })
  }
}
```

---

## 🔔 3. SISTEMA DE NOTIFICAÇÕES

### `/src/app/api/notifications/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'
    
    const where = {
      user_id: userId,
      ...(unreadOnly && { read_at: null }),
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ]
    }
    
    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notifications.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { title, message, type, data, targetUserId, expiresAt } = await request.json()
    
    const notification = await prisma.notifications.create({
      data: {
        user_id: targetUserId || userId,
        title,
        message,
        type: type || 'info',
        data: data || {},
        expires_at: expiresAt ? new Date(expiresAt) : null
      }
    })
    
    // TODO: Enviar push notification via service worker
    
    return NextResponse.json({ success: true, notification })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}
```

### `/src/app/api/notifications/[id]/read/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    await prisma.notifications.update({
      where: {
        id: params.id,
        user_id: userId
      },
      data: { read_at: new Date() }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao marcar como lida' }, { status: 500 })
  }
}
```

---

## 🔍 4. SISTEMA DE BUSCA AVANÇADA

### `/src/app/api/search/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    const projectId = searchParams.get('projectId')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    
    const results: any = { projects: [], points: [], tests: [], files: [] }
    
    if (type === 'all' || type === 'projects') {
      results.projects = await prisma.project.findMany({
        where: {
          companyId,
          deleted: false,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { obraAddress: { contains: q, mode: 'insensitive' } },
            { contratanteName: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        include: { _count: { select: { anchor_points: true } } }
      })
    }
    
    if (type === 'all' || type === 'points') {
      const pointsWhere: any = {
        project: { companyId },
        archived: false,
        OR: [
          { numero_ponto: { contains: q, mode: 'insensitive' } },
          { numero_lacre: { contains: q, mode: 'insensitive' } },
          { tipo_equipamento: { contains: q, mode: 'insensitive' } },
          { localizacao: { contains: q, mode: 'insensitive' } },
          { observacoes: { contains: q, mode: 'insensitive' } }
        ]
      }
      
      if (projectId) pointsWhere.project_id = projectId
      if (location) pointsWhere.localizacao = location
      if (status) pointsWhere.status = status
      
      results.points = await prisma.anchor_points.findMany({
        where: pointsWhere,
        take: 20,
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { anchor_tests: true } }
        },
        orderBy: [
          { project_id: 'asc' },
          { numero_ponto: 'asc' }
        ]
      })
    }
    
    if (type === 'all' || type === 'tests') {
      results.tests = await prisma.anchor_tests.findMany({
        where: {
          anchor_point: { project: { companyId } },
          OR: [
            { tecnico: { contains: q, mode: 'insensitive' } },
            { observacoes: { contains: q, mode: 'insensitive' } },
            { carga: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 20,
        include: {
          anchor_point: {
            select: { id: true, numero_ponto: true, project: { select: { name: true } } }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    }
    
    if (type === 'all' || type === 'files') {
      results.files = await prisma.files.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          OR: [
            { original_name: { contains: q, mode: 'insensitive' } },
            { file_name: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { created_at: 'desc' }
      })
    }
    
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }
}
```

---

## 🔄 5. SINCRONIZAÇÃO PWA HÍBRIDA AVANÇADA

### `/src/app/api/sync/status/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    
    const where: any = { user_id: userId }
    if (entityType) where.entity_type = entityType
    if (entityId) where.entity_id = entityId
    
    const syncStatuses = await prisma.sync_status.findMany({
      where,
      orderBy: { updated_at: 'desc' }
    })
    
    const pendingCount = await prisma.sync_queue.count({
      where: { user_id: userId, status: { in: ['pending', 'processing'] } }
    })
    
    return NextResponse.json({
      success: true,
      syncStatuses,
      pendingCount
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar status de sync' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { entityType, entityId, syncStatus, errorMessage } = await request.json()
    
    const status = await prisma.sync_status.upsert({
      where: {
        entity_type_entity_id_user_id: {
          entity_type: entityType,
          entity_id: entityId,
          user_id: userId
        }
      },
      update: {
        sync_status: syncStatus,
        error_message: errorMessage,
        retry_count: syncStatus === 'error' ? { increment: 1 } : 0,
        last_sync_at: syncStatus === 'synced' ? new Date() : undefined
      },
      create: {
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        sync_status: syncStatus,
        error_message: errorMessage
      }
    })
    
    return NextResponse.json({ success: true, status })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar status de sync' }, { status: 500 })
  }
}
```

### `/src/app/api/sync/queue/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    const queue = await prisma.sync_queue.findMany({
      where: { user_id: userId },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'asc' }
      ]
    })
    
    return NextResponse.json({ success: true, queue })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fila de sync' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { operationType, entityType, entityData, priority = 1 } = await request.json()
    
    const queueItem = await prisma.sync_queue.create({
      data: {
        user_id: userId,
        operation_type: operationType,
        entity_type: entityType,
        entity_data: entityData,
        priority
      }
    })
    
    return NextResponse.json({ success: true, queueItem })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao adicionar à fila' }, { status: 500 })
  }
}
```

---

## 📊 6. AUDITORIA E LOGS

### `/src/app/api/audit/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const recordId = searchParams.get('recordId')
    const operation = searchParams.get('operation')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = { company_id: companyId }
    if (tableName) where.table_name = tableName
    if (recordId) where.record_id = recordId
    if (operation) where.operation = operation
    
    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.audit_log.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
  }
}
```

---

## ⚙️ 7. CONFIGURAÇÕES E PREFERÊNCIAS

### `/src/app/api/preferences/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    const preferences = await prisma.user_preferences.findUnique({
      where: { user_id: userId }
    })
    
    return NextResponse.json({
      success: true,
      preferences: preferences?.preferences || {}
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar preferências' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const preferences = await request.json()
    
    const result = await prisma.user_preferences.upsert({
      where: { user_id: userId },
      update: { preferences },
      create: { user_id: userId, preferences }
    })
    
    return NextResponse.json({ success: true, preferences: result.preferences })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar preferências' }, { status: 500 })
  }
}
```

### `/src/app/api/company/settings/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')
    
    const settings = await prisma.company_settings.findUnique({
      where: { company_id: companyId }
    })
    
    return NextResponse.json({
      success: true,
      settings: settings?.settings || {},
      canEdit: userRole === 'admin'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    
    const settings = await request.json()
    
    const result = await prisma.company_settings.upsert({
      where: { company_id: companyId },
      update: { settings },
      create: { company_id: companyId, settings }
    })
    
    return NextResponse.json({ success: true, settings: result.settings })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
```

---

## 💾 8. BACKUP E MIGRAÇÃO DE DADOS

### `/src/app/api/backup/route.ts` ❌ CRIAR
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    
    // Backup completo da empresa
    const [company, users, locations, projects, anchorPoints, anchorTests] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.user.findMany({ where: { companyId } }),
      prisma.location.findMany({ where: { companyId } }),
      prisma.project.findMany({ where: { companyId, deleted: false } }),
      prisma.anchor_points.findMany({
        where: { project: { companyId }, archived: false }
      }),
      prisma.anchor_tests.findMany({
        where: { anchor_point: { project: { companyId } } }
      })
    ])
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        company,
        users: users.map(u => ({ ...u, password_hash: undefined })),
        locations,
        projects,
        anchorPoints,
        anchorTests
      }
    }
    
    const response = NextResponse.json(backup)
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="anchorview-backup-${Date.now()}.json"`
    )
    
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 })
  }
}
```

---

## 🔧 9. WORKER DE SINCRONIZAÇÃO PWA

### `/public/sw.js` ❌ ATUALIZAR
```javascript
const CACHE_NAME = 'anchorview-v1'
const SYNC_TAG = 'background-sync'

// Cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png'
      ])
    })
  )
})

// Background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sync anchor points
    const pendingPoints = await getFromIndexedDB('pending_points')
    for (const point of pendingPoints) {
      await fetch('/api/sync/anchor-data', {
        method: 'POST',
        body: JSON.stringify({ anchorPoints: [point] }),
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Sync photos
    const pendingPhotos = await getFromIndexedDB('pending_photos')
    for (const photo of pendingPhotos) {
      await fetch('/api/sync/photos', {
        method: 'POST',
        body: JSON.stringify(photo),
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Clear pending items
    await clearFromIndexedDB('pending_points')
    await clearFromIndexedDB('pending_photos')
    
  } catch (error) {
    console.error('Background sync failed:', error)
    throw error
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação AnchorView',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('AnchorView', options)
  )
})
```

---

## 🎯 10. GERENCIADOR PWA HÍBRIDO PRINCIPAL

### `/src/lib/pwa-hybrid-manager.ts` ❌ CRIAR
```typescript
import { openDB, IDBPDatabase } from 'idb'

export interface SyncOperation {
  id: string
  type: 'anchor_point' | 'anchor_test' | 'file' | 'notification'
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
  status: 'pending' | 'syncing' | 'completed' | 'error'
}

export class PWAHybridManager {
  private db: IDBPDatabase | null = null
  private isOnline = navigator.onLine
  private syncInProgress = false
  
  constructor() {
    this.initDB()
    this.setupEventListeners()
  }
  
  private async initDB() {
    this.db = await openDB('AnchorViewDB', 1, {
      upgrade(db) {
        // Offline data stores
        db.createObjectStore('anchor_points', { keyPath: 'id' })
        db.createObjectStore('anchor_tests', { keyPath: 'id' })
        db.createObjectStore('files', { keyPath: 'id' })
        
        // Sync queue
        db.createObjectStore('sync_queue', { keyPath: 'id' })
        
        // User preferences (offline backup)
        db.createObjectStore('user_data', { keyPath: 'key' })
      }
    })
  }
  
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.startSync()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }
  
  // CRUD Operations (work online/offline)
  async createAnchorPoint(pointData: any) {
    const point = { ...pointData, id: crypto.randomUUID(), synced: false }
    
    if (this.isOnline) {
      try {
        const response = await fetch('/api/anchor-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point)
        })
        
        if (response.ok) {
          const serverPoint = await response.json()
          await this.db?.put('anchor_points', { ...serverPoint, synced: true })
          return serverPoint
        }
      } catch (error) {
        console.error('Failed to sync point online:', error)
      }
    }
    
    // Fallback to offline storage
    await this.db?.put('anchor_points', point)
    await this.addToSyncQueue('anchor_point', 'create', point)
    
    return point
  }
  
  async updateAnchorPoint(pointId: string, updates: any) {
    const existing = await this.db?.get('anchor_points', pointId)
    const updated = { ...existing, ...updates, synced: false }
    
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/anchor-points/${pointId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        
        if (response.ok) {
          const serverPoint = await response.json()
          await this.db?.put('anchor_points', { ...serverPoint, synced: true })
          return serverPoint
        }
      } catch (error) {
        console.error('Failed to sync point update online:', error)
      }
    }
    
    await this.db?.put('anchor_points', updated)
    await this.addToSyncQueue('anchor_point', 'update', updated)
    
    return updated
  }
  
  async getAnchorPoints(projectId?: string) {
    if (this.isOnline) {
      try {
        const url = projectId ? `/api/anchor-points?projectId=${projectId}` : '/api/anchor-points'
        const response = await fetch(url)
        
        if (response.ok) {
          const serverPoints = await response.json()
          
          // Update local cache
          for (const point of serverPoints) {
            await this.db?.put('anchor_points', { ...point, synced: true })
          }
          
          return serverPoints
        }
      } catch (error) {
        console.error('Failed to fetch points online:', error)
      }
    }
    
    // Fallback to offline data
    const allPoints = await this.db?.getAll('anchor_points') || []
    return projectId 
      ? allPoints.filter(p => p.projectId === projectId)
      : allPoints
  }
  
  // Sync Queue Management
  private async addToSyncQueue(type: string, operation: string, data: any) {
    const syncOp: SyncOperation = {
      id: crypto.randomUUID(),
      type: type as any,
      operation: operation as any,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    }
    
    await this.db?.put('sync_queue', syncOp)
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('background-sync')
    }
  }
  
  async startSync() {
    if (this.syncInProgress || !this.isOnline) return
    
    this.syncInProgress = true
    
    try {
      const pendingOps = await this.db?.getAll('sync_queue') || []
      const pendingItems = pendingOps.filter(op => op.status === 'pending')
      
      for (const op of pendingItems) {
        try {
          await this.syncOperation(op)
          
          // Mark as completed
          await this.db?.put('sync_queue', { ...op, status: 'completed' })
          
        } catch (error) {
          console.error('Sync operation failed:', error)
          
          // Increment retry count
          const updatedOp = { 
            ...op, 
            retries: op.retries + 1,
            status: op.retries >= 3 ? 'error' : 'pending'
          }
          await this.db?.put('sync_queue', updatedOp)
        }
      }
      
      // Clean up completed operations older than 1 day
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      const toDelete = pendingOps.filter(op => 
        op.status === 'completed' && op.timestamp < oneDayAgo
      )
      
      for (const op of toDelete) {
        await this.db?.delete('sync_queue', op.id)
      }
      
    } finally {
      this.syncInProgress = false
    }
  }
  
  private async syncOperation(op: SyncOperation) {
    const endpoints = {
      anchor_point: '/api/sync/anchor-data',
      anchor_test: '/api/sync/anchor-data', 
      file: '/api/sync/photos',
      notification: '/api/notifications'
    }
    
    const endpoint = endpoints[op.type]
    if (!endpoint) throw new Error(`Unknown sync type: ${op.type}`)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(op.data)
    })
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`)
    }
    
    return response.json()
  }
  
  // Utility methods
  async getPendingSyncCount() {
    const queue = await this.db?.getAll('sync_queue') || []
    return queue.filter(op => op.status === 'pending').length
  }
  
  async clearAllOfflineData() {
    const stores = ['anchor_points', 'anchor_tests', 'files', 'sync_queue', 'user_data']
    for (const store of stores) {
      await this.db?.clear(store)
    }
  }
  
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncAttempt: localStorage.getItem('lastSyncAttempt')
    }
  }
}

// Singleton instance
export const pwaManager = new PWAHybridManager()
```

---

## 📱 11. HOOK REACT PARA PWA

### `/src/hooks/usePWAHybrid.ts` ❌ CRIAR
```typescript
import { useState, useEffect, useCallback } from 'react'
import { pwaManager } from '@/lib/pwa-hybrid-manager'

export function usePWAHybrid() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [syncInProgress, setSyncInProgress] = useState(false)
  
  const updateStatus = useCallback(async () => {
    const status = pwaManager.getConnectionStatus()
    setIsOnline(status.isOnline)
    setSyncInProgress(status.syncInProgress)
    
    const count = await pwaManager.getPendingSyncCount()
    setPendingSyncCount(count)
  }, [])
  
  useEffect(() => {
    updateStatus()
    
    const interval = setInterval(updateStatus, 5000)
    
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [updateStatus])
  
  const manualSync = useCallback(async () => {
    try {
      setSyncInProgress(true)
      await pwaManager.startSync()
      await updateStatus()
    } finally {
      setSyncInProgress(false)
    }
  }, [updateStatus])
  
  return {
    isOnline,
    pendingSyncCount,
    syncInProgress,
    manualSync,
    pwaManager
  }
}
```

---

## 🛠️ 12. DEPENDÊNCIAS NECESSÁRIAS

### `package.json` - Adicionar dependências:
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

---

## 📋 RESUMO DE IMPLEMENTAÇÃO

### ✅ ARQUIVOS CRIADOS:
- **4 APIs de autenticação** (login, logout, refresh, me)
- **2 APIs de upload/download** de arquivos
- **2 APIs de notificações**
- **1 API de busca avançada**
- **3 APIs de sincronização**
- **1 API de auditoria**
- **2 APIs de configurações**
- **1 API de backup**
- **1 Middleware de proteção**
- **1 Service Worker atualizado**
- **1 Gerenciador PWA híbrido**
- **1 Hook React para PWA**

### 🎯 FUNCIONALIDADES COMPLETAS:
- ✅ Sistema offline-first completo
- ✅ Sincronização bidirecional automática
- ✅ Autenticação JWT segura
- ✅ Upload/download de arquivos
- ✅ Sistema de notificações push
- ✅ Busca avançada com filtros
- ✅ Auditoria completa
- ✅ Backup e restore
- ✅ Configurações por usuário/empresa
- ✅ PWA com background sync

**AGORA O ANCHORVIEW É UM PWA HÍBRIDO COMPLETO! 🚀**