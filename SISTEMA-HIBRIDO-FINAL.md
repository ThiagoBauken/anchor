# 🏔️ SISTEMA HÍBRIDO FINAL - ONLINE/OFFLINE

## 📋 RESUMO EXECUTIVO

**PRISMA NÃO FUNCIONA OFFLINE!** Prisma precisa de conexão com PostgreSQL. A solução é um **sistema híbrido**:

- **OFFLINE (campo)**: localStorage + IndexedDB
- **ONLINE (base)**: PostgreSQL + Prisma + Sincronização

---

## 🔧 ARQUITETURA TÉCNICA

### 1. **ARMAZENAMENTO DE DADOS**

```typescript
// =====================================
// OFFLINE STORAGE (NO CAMPO)
// =====================================

// localStorage - Dados estruturados JSON
const offlineStorage = {
  anchorPoints: localStorage,    // ✅ Pontos de ancoragem
  anchorTests: localStorage,     // ✅ Testes realizados
  users: localStorage,           // ✅ Cache de usuários
  currentUser: localStorage,     // ✅ Usuário logado
  currentProject: localStorage,  // ✅ Projeto ativo
  settings: localStorage         // ✅ Configurações
};

// IndexedDB - Arquivos binários
const fileStorage = {
  photos: indexedDB,             // ✅ Fotos dos pontos
  documents: indexedDB,          // ✅ Documentos anexos
  cache: indexedDB               // ✅ Cache de recursos
};

// =====================================
// ONLINE STORAGE (NA BASE)
// =====================================

// PostgreSQL + Prisma - Banco central
const onlineStorage = {
  companies: 'PostgreSQL',       // ✅ Empresas
  users: 'PostgreSQL',           // ✅ Usuários
  projects: 'PostgreSQL',        // ✅ Projetos
  locations: 'PostgreSQL',       // ✅ Localizações
  anchorPoints: 'PostgreSQL',    // ✅ Backup de pontos
  anchorTests: 'PostgreSQL',     // ✅ Backup de testes
  files: 'PostgreSQL',           // ✅ Metadados de arquivos
  auditLog: 'PostgreSQL',        // ✅ Logs de auditoria
  subscriptions: 'PostgreSQL'    // ✅ Sistema SaaS
};
```

### 2. **FLUXO DE DADOS**

```
┌─────────────────────────────────────┐
│           NO CAMPO (OFFLINE)         │
├─────────────────────────────────────┤
│                                     │
│  📱 PWA no Celular                  │
│  ├─ localStorage (pontos/testes)    │
│  ├─ IndexedDB (fotos)               │
│  └─ Service Worker (cache)          │
│                                     │
│  ✅ Funciona 100% sem internet     │
│                                     │
└─────────────────────────────────────┘
              ↕️ (Sincronização)
┌─────────────────────────────────────┐
│           NA BASE (ONLINE)           │
├─────────────────────────────────────┤
│                                     │
│  🖥️ Servidor PostgreSQL             │
│  ├─ Prisma ORM                      │
│  ├─ Server Actions                  │
│  └─ Background Sync                 │
│                                     │
│  ✅ Backup permanente              │
│  ✅ Compartilhamento equipe        │
│  ✅ Relatórios gerenciais          │
│                                     │
└─────────────────────────────────────┘
```

---

## 💻 IMPLEMENTAÇÃO DO CÓDIGO

### 1. **OFFLINE-FIRST DATA MANAGER**

```typescript
// src/lib/hybrid-data-manager.ts
export class HybridDataManager {
  private isOnline = navigator.onLine;
  
  // CRUD Operations - Funciona online e offline
  async getAnchorPoints(projectId: string): Promise<AnchorPoint[]> {
    if (this.isOnline) {
      try {
        // Tenta buscar do servidor primeiro
        const serverData = await getAnchorPointsForProject(projectId);
        // Cache no localStorage
        this.cacheOffline('anchorPoints', serverData);
        return serverData;
      } catch (error) {
        // Se falhar, usa cache offline
        return this.getFromCache('anchorPoints', projectId);
      }
    } else {
      // Se offline, usa só localStorage
      return this.getFromCache('anchorPoints', projectId);
    }
  }
  
  async addAnchorPoint(point: AnchorPoint): Promise<AnchorPoint> {
    // SEMPRE salva no localStorage primeiro (funciona offline)
    const savedPoint = this.saveToLocalStorage('anchorPoints', point);
    
    if (this.isOnline) {
      try {
        // Se online, tenta salvar no servidor também
        await addAnchorPoint(point);
        this.markAsSynced(point.id);
      } catch (error) {
        // Se falhar, marca como pendente para sync
        this.markAsPending(point.id);
      }
    } else {
      // Se offline, marca como pendente
      this.markAsPending(point.id);
    }
    
    return savedPoint;
  }
  
  private saveToLocalStorage(key: string, data: any) {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({...data, syncStatus: 'pending'});
    localStorage.setItem(key, JSON.stringify(existing));
    return data;
  }
  
  private getFromCache(key: string, projectId?: string) {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return projectId ? 
      data.filter((item: any) => item.projectId === projectId) : 
      data;
  }
}
```

### 2. **SYNC MANAGER**

```typescript
// src/lib/sync-manager-v2.ts
export class SyncManager {
  async syncWhenOnline() {
    if (!navigator.onLine) return;
    
    try {
      // Busca dados pendentes do localStorage
      const pendingPoints = this.getPendingData('anchorPoints');
      const pendingTests = this.getPendingData('anchorTests');
      const pendingPhotos = await this.getPendingPhotos();
      
      // Sincroniza com o servidor
      const results = await Promise.all([
        this.syncPointsToServer(pendingPoints),
        this.syncTestsToServer(pendingTests),
        this.syncPhotosToServer(pendingPhotos)
      ]);
      
      // Marca como sincronizado
      this.markAllAsSynced(results);
      
      console.log('✅ Sincronização completa!', results);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }
  
  private getPendingData(key: string) {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return data.filter((item: any) => item.syncStatus === 'pending');
  }
}
```

### 3. **CONTEXT HÍBRIDO**

```typescript
// src/context/HybridDataContext.tsx
export const HybridDataProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dataManager = new HybridDataManager();
  const syncManager = new SyncManager();
  
  // Detecta mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync quando volta online
      syncManager.syncWhenOnline();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Métodos que funcionam online e offline
  const addPoint = async (point: Omit<AnchorPoint, 'id'>) => {
    return await dataManager.addAnchorPoint({
      ...point,
      id: generateId(),
      dataHora: new Date().toISOString(),
      status: 'Não Testado'
    });
  };
  
  const getPoints = async (projectId: string) => {
    return await dataManager.getAnchorPoints(projectId);
  };
  
  return (
    <HybridDataContext.Provider value={{
      isOnline,
      addPoint,
      getPoints,
      manualSync: () => syncManager.syncWhenOnline()
    }}>
      {children}
    </HybridDataContext.Provider>
  );
};
```

---

## 🎯 PÁGINAS QUE FALTAM

### 1. **Dashboard de Sincronização**

```typescript
// src/app/sync/page.tsx
export default function SyncPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Status de Sincronização</h1>
      
      <SyncStatusIndicator />
      
      <div className="grid gap-4 mt-6">
        <PendingItemsCard />
        <SyncHistoryCard />
        <ManualSyncButton />
      </div>
    </div>
  );
}
```

### 2. **Página de Auditoria**

```typescript
// src/app/audit/page.tsx
export default function AuditPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Log de Auditoria</h1>
      
      <AuditLogTable />
      <AuditFilters />
    </div>
  );
}
```

### 3. **Configurações Offline**

```typescript
// src/app/offline-settings/page.tsx
export default function OfflineSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Configurações Offline</h1>
      
      <OfflineStorageManager />
      <CacheSettings />
      <ExportImportData />
    </div>
  );
}
```

---

## ✅ CHECKLIST FINAL

### **BACKEND (PostgreSQL + Prisma):**
- [x] 23 tabelas criadas
- [x] 47+ funções implementadas
- [x] Server actions completas
- [x] Sistema de auditoria
- [x] API de sincronização

### **FRONTEND (PWA + React):**
- [ ] HybridDataManager ✨ (precisa criar)
- [ ] SyncManager v2 ✨ (precisa criar)
- [ ] SyncStatusIndicator ✨ (precisa criar)
- [ ] Páginas de sync/audit ✨ (precisa criar)
- [x] localStorage integration
- [x] IndexedDB integration
- [x] Service Worker

### **FUNCIONALIDADES:**
- [x] Login offline
- [x] Captura de fotos offline
- [x] Formulários offline
- [x] Cache de recursos
- [ ] Sincronização automática ✨ (precisa melhorar)
- [ ] Resolução de conflitos ✨ (precisa criar)

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar HybridDataManager** - Gerencia dados online/offline
2. **Criar páginas de sincronização** - UI para monitorar sync
3. **Melhorar detecção offline** - Indicadores visuais
4. **Testar cenário completo** - Campo → Base → Sincronização

**RESULTADO:** Sistema que funciona 100% offline no campo e sincroniza quando volta à base! 🎯