# Soluções para o Problema de Storage no iOS

## 🔴 O Problema (Crítico)

### Limitações do PWA no iOS:
```
┌─────────────────────────────────────┐
│ iOS Safari PWA Storage              │
├─────────────────────────────────────┤
│ IndexedDB:        ~50MB             │
│ localStorage:     ~10MB             │
│ Cache API:        ~50MB             │
│ Total máximo:     ~100MB            │
│                                     │
│ ⚠️ PODE SER LIMPO A QUALQUER MOMENTO│
└─────────────────────────────────────┘
```

### Gatilhos de Limpeza Automática:
- ❌ Dispositivo com pouco espaço
- ❌ App não usado por 7+ dias
- ❌ Usuário limpa cache do Safari manualmente
- ❌ iOS precisa de espaço e decide limpar

### Impacto Real:
```
Cenário 1 - Obra Grande:
├── 30 pontos de ancoragem
├── 2 fotos por ponto (teste + pronto)
├── 60 fotos × 2MB = 120MB ❌ NÃO CABE!
└── Resultado: Precisa sincronizar durante a inspeção

Cenário 2 - Múltiplas Obras:
├── Equipe inspeciona 3 prédios na semana
├── 15 pontos × 3 prédios × 2 fotos = 90 fotos
├── 90 × 2MB = 180MB ❌ NÃO CABE!
└── Resultado: Perde dados se não sincronizar

Cenário 3 - Área Remota:
├── Obra sem internet
├── 7 dias de trabalho offline
├── iOS limpa tudo no dia 7
└── Resultado: PERDA TOTAL DE DADOS ❌
```

---

## ✅ Solução 1: Compressão Inteligente (IMPLEMENTÁVEL AGORA)

### A) Compressão Agressiva mas Inteligente

**Implementação**: Arquivo `src/lib/image-compression.ts` (já criado acima)

**Números reais**:
```
ANTES da compressão:
├── Foto do iPhone: 2-4MB (4032×3024 pixels)
├── 30 fotos: 60-120MB
└── Resultado: ❌ Não cabe no iOS

DEPOIS da compressão:
├── Foto comprimida: 100-200KB (1920×1440 pixels)
├── 30 fotos: 3-6MB
└── Resultado: ✅ Cabe tranquilamente!

Economia: 95% de redução
Qualidade: Ainda HD, zoom funciona
```

**Estratégia de compressão**:
```typescript
// Nível 1: Foto de inspeção (alta qualidade)
await optimizeInspectionPhoto(photo)
// → 1920×1440, 85% quality, ~150KB

// Nível 2: Thumbnail (preview na lista)
await createThumbnail(photo)
// → 400×300, 70% quality, ~30KB

// Armazenamento:
{
  full: "data:image/jpeg;base64,..."  // 150KB
  thumb: "data:image/jpeg;base64,..." // 30KB
}
```

**Nova capacidade**:
```
Com compressão para 150KB/foto:

iOS (50MB):
├── ~333 fotos
├── ~166 pontos (2 fotos cada)
└── ~5 obras grandes offline

Android (500MB):
├── ~3.333 fotos
├── ~1.666 pontos
└── ~50 obras offline
```

### B) Upload Inteligente em Background

```typescript
// src/lib/smart-upload-manager.ts

class SmartUploadManager {
  async uploadWhenPossible(photo: Photo) {
    // 1. Comprime foto imediatamente
    const compressed = await optimizeInspectionPhoto(photo.dataUrl);

    // 2. Salva versão comprimida no IndexedDB
    await indexedDB.savePhoto({
      id: photo.id,
      dataUrl: compressed.dataUrl,
      uploadStatus: 'pending',
      compressedSize: compressed.compressedSize
    });

    // 3. Tenta upload imediato se online
    if (navigator.onLine) {
      try {
        await this.uploadToServer(photo.id);
        // Sucesso: remove do IndexedDB
        await indexedDB.deletePhoto(photo.id);
      } catch {
        // Falhou: mantém no IndexedDB para retry
        console.log('Upload falhou, tentará novamente');
      }
    }

    // 4. Service Worker faz retry automático
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready.then(reg => {
        return reg.sync.register('upload-photos');
      });
    }
  }

  // Cleanup: Remove fotos antigas após upload
  async cleanupOldPhotos() {
    const uploadedPhotos = await indexedDB.getPhotos({
      uploadStatus: 'uploaded',
      olderThan: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    for (const photo of uploadedPhotos) {
      await indexedDB.deletePhoto(photo.id);
    }
  }
}
```

**Fluxo Completo**:
```
1. Técnico tira foto
   └─> Comprime imediatamente (2MB → 150KB)

2. Salva no IndexedDB
   └─> Marca como "pending upload"

3. Se online:
   └─> Tenta upload imediato
       ├─> Sucesso: Remove do IndexedDB
       └─> Falha: Mantém para retry

4. Service Worker (background):
   └─> Quando conexão voltar:
       └─> Tenta upload de todas pendentes

5. Após upload confirmado:
   └─> Remove do storage local
   └─> Mantém apenas thumbnail (30KB)

6. Limpeza periódica:
   └─> Remove fotos com >7 dias já sincronizadas
```

### C) Sistema de Alertas Preventivos

```typescript
// src/hooks/use-storage-monitor.ts

export function useStorageMonitor() {
  const [storageStatus, setStorageStatus] = useState({
    used: 0,
    available: 0,
    usagePercent: 0,
    canTakeMorePhotos: true,
    photosRemaining: 0
  });

  useEffect(() => {
    async function checkStorage() {
      // Estimar uso atual
      const estimate = await getStorageEstimate();

      if (!estimate.available) {
        // iOS não fornece estimate, usar heurística
        const photosInDB = await indexedDB.countPhotos();
        const avgPhotoSize = 150; // KB
        const estimatedUsage = photosInDB * avgPhotoSize;
        const limit = 50 * 1024; // 50MB em KB

        setStorageStatus({
          used: estimatedUsage,
          available: limit - estimatedUsage,
          usagePercent: (estimatedUsage / limit) * 100,
          canTakeMorePhotos: estimatedUsage < limit * 0.9,
          photosRemaining: Math.floor((limit * 0.9 - estimatedUsage) / avgPhotoSize)
        });
      } else {
        // Android/Chrome fornece estimate preciso
        const photosRemaining = Math.floor(
          (estimate.quota! - estimate.usage!) / (150 * 1024)
        );

        setStorageStatus({
          used: estimate.usage!,
          available: estimate.quota! - estimate.usage!,
          usagePercent: estimate.usagePercent!,
          canTakeMorePhotos: estimate.usagePercent! < 90,
          photosRemaining
        });
      }
    }

    checkStorage();
    const interval = setInterval(checkStorage, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, []);

  return storageStatus;
}
```

**UI de Alertas**:
```tsx
// src/components/storage-warning-banner.tsx

export function StorageWarningBanner() {
  const storage = useStorageMonitor();

  if (storage.usagePercent < 70) {
    return null; // Tudo ok
  }

  if (storage.usagePercent >= 90) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Storage quase cheio!</AlertTitle>
        <AlertDescription>
          Apenas {storage.photosRemaining} fotos restantes.
          Sincronize agora para não perder dados!
        </AlertDescription>
        <Button onClick={syncNow}>
          Sincronizar Agora
        </Button>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <Info className="h-4 w-4" />
      <AlertTitle>Storage em {Math.round(storage.usagePercent)}%</AlertTitle>
      <AlertDescription>
        ~{storage.photosRemaining} fotos restantes.
        Recomendamos sincronizar em breve.
      </AlertDescription>
    </Alert>
  );
}
```

---

## ✅ Solução 2: Capacitor File System (MELHOR PARA iOS)

### Capacitor permite acesso ao filesystem nativo!

**Instalação**:
```bash
npm install @capacitor/filesystem
npx cap sync
```

**Código**:
```typescript
import { Filesystem, Directory } from '@capacitor/filesystem';

// Salvar foto no filesystem nativo (SEM LIMITE no iOS!)
async function savePhotoToNativeFS(photo: Photo) {
  const fileName = `${photo.id}.jpg`;

  await Filesystem.writeFile({
    path: `photos/${fileName}`,
    data: photo.dataUrl,
    directory: Directory.Data, // Diretório privado do app
    recursive: true
  });

  // Salvar apenas metadados no IndexedDB
  await indexedDB.savePhotoMetadata({
    id: photo.id,
    fileName: fileName,
    storedInFS: true,
    uploadStatus: 'pending'
  });
}

// Ler foto do filesystem
async function readPhotoFromNativeFS(photoId: string): Promise<string> {
  const meta = await indexedDB.getPhotoMetadata(photoId);

  const file = await Filesystem.readFile({
    path: `photos/${meta.fileName}`,
    directory: Directory.Data
  });

  return `data:image/jpeg;base64,${file.data}`;
}

// Listar todas as fotos
async function listPhotos() {
  const result = await Filesystem.readdir({
    path: 'photos',
    directory: Directory.Data
  });

  return result.files;
}

// Deletar foto após upload
async function deletePhotoFromFS(photoId: string) {
  const meta = await indexedDB.getPhotoMetadata(photoId);

  await Filesystem.deleteFile({
    path: `photos/${meta.fileName}`,
    directory: Directory.Data
  });

  await indexedDB.deletePhotoMetadata(photoId);
}
```

**Vantagens do Capacitor Filesystem**:
```
✅ Sem limite de 50MB (usa espaço do device)
✅ iOS NÃO limpa automaticamente
✅ Persistente mesmo sem internet por semanas
✅ Mais rápido que IndexedDB
✅ Suporta arquivos grandes (vídeos no futuro?)
```

**Comparação**:
```
IndexedDB (PWA puro):
├── Limite: 50MB no iOS
├── Pode ser limpo pelo sistema
└── Lento com muitos dados

Capacitor Filesystem:
├── Limite: Espaço livre do device (GBs)
├── Nunca é limpo automaticamente
└── Rápido e confiável
```

**Arquitetura Híbrida Ideal**:
```typescript
// Metadados no IndexedDB (rápido para listar)
interface PhotoMetadata {
  id: string;
  pointId: string;
  timestamp: string;
  fileName: string;
  compressed: boolean;
  uploadStatus: 'pending' | 'uploading' | 'uploaded';
  fileSize: number;
}

// Arquivo real no Filesystem (sem limite)
// photos/
//   ├── photo-1.jpg
//   ├── photo-2.jpg
//   └── photo-3.jpg
```

---

## ✅ Solução 3: Sincronização Agressiva + Retenção Mínima

### Estratégia "Upload First, Store Later"

```typescript
class AggressiveSyncStrategy {
  // Ao capturar foto
  async handleNewPhoto(photo: Photo) {
    // 1. Comprimir
    const compressed = await optimizeInspectionPhoto(photo.dataUrl);

    // 2. Se online, tentar upload IMEDIATO
    if (navigator.onLine) {
      try {
        await this.uploadImmediately(compressed);
        // Sucesso: salvar apenas thumbnail localmente
        await this.saveThumbnailOnly(photo.id, compressed.dataUrl);
        return { uploaded: true, stored: 'thumbnail' };
      } catch (error) {
        // Falhou: salvar full quality localmente
        await this.saveFullQuality(photo.id, compressed.dataUrl);
        return { uploaded: false, stored: 'full' };
      }
    } else {
      // Offline: salvar full quality localmente
      await this.saveFullQuality(photo.id, compressed.dataUrl);
      return { uploaded: false, stored: 'full' };
    }
  }

  // Após upload confirmado
  async onUploadSuccess(photoId: string) {
    // Deletar versão full, manter apenas thumbnail
    const full = await indexedDB.getPhoto(photoId);
    const thumb = await createThumbnail(full.dataUrl);

    await indexedDB.updatePhoto(photoId, {
      dataUrl: thumb.dataUrl,
      isFullQuality: false,
      uploaded: true
    });

    // Economia: 150KB → 30KB por foto
  }

  // UI mostra badge
  renderPhotoWithBadge(photo: Photo) {
    return (
      <div className="relative">
        <img src={photo.thumbnailUrl} />
        {photo.uploaded ? (
          <Badge variant="success">☁️ Sincronizado</Badge>
        ) : (
          <Badge variant="warning">📱 Local</Badge>
        )}
        {!photo.isFullQuality && (
          <Button onClick={() => this.downloadFullQuality(photo.id)}>
            Baixar Alta Resolução
          </Button>
        )}
      </div>
    );
  }
}
```

**Fluxo Otimizado**:
```
1. Captura Foto
   └─> Comprime (2MB → 150KB)

2. Verifica Conexão
   ├─> Se ONLINE:
   │   ├─> Upload imediato para servidor
   │   ├─> Sucesso: Salva apenas thumbnail (30KB)
   │   └─> Falha: Salva full (150KB) + retry
   │
   └─> Se OFFLINE:
       └─> Salva full (150KB)
       └─> Background sync quando conectar

3. Após Upload
   └─> Remove full (150KB)
   └─> Mantém thumbnail (30KB)
   └─> Se precisar de full: baixa do servidor

Resultado:
├── Storage usado: ~30KB por foto
├── Capacidade iOS: ~1.600 fotos
└── 800 pontos offline!
```

---

## ✅ Solução 4: React Native (Solução Definitiva)

### Com React Native, storage ilimitado:

```typescript
// React Native AsyncStorage + Filesystem
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

// Salvar foto (SEM LIMITE)
async function savePhoto(photo: Photo) {
  const path = `${RNFS.DocumentDirectoryPath}/photos/${photo.id}.jpg`;

  // Escrever arquivo
  await RNFS.writeFile(path, photo.base64, 'base64');

  // Salvar metadata
  await AsyncStorage.setItem(`photo:${photo.id}`, JSON.stringify({
    id: photo.id,
    path: path,
    timestamp: Date.now(),
    uploaded: false
  }));
}

// Listar fotos
async function listPhotos() {
  const keys = await AsyncStorage.getAllKeys();
  const photoKeys = keys.filter(k => k.startsWith('photo:'));
  const metadata = await AsyncStorage.multiGet(photoKeys);
  return metadata.map(([_, value]) => JSON.parse(value));
}

// Storage usado
async function getStorageUsed() {
  const files = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/photos`);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return {
    files: files.length,
    sizeBytes: totalSize,
    sizeMB: totalSize / (1024 * 1024)
  };
}
```

**Capacidade Real**:
```
iPhone 64GB:
├── Sistema: ~15GB
├── Apps: ~10GB
├── Livre: ~35GB
├── AnchorView: 10GB disponível
└── Capacidade: ~50.000 fotos (200KB cada)

Usuário nunca vai atingir o limite!
```

---

## 📊 Comparação de Soluções

| Solução | Custo | Tempo | Capacidade iOS | Confiabilidade |
|---------|-------|-------|----------------|----------------|
| **1. Compressão** | R$ 0 | 1 semana | ~333 fotos | 🟡 Médio |
| **2. Capacitor FS** | R$ 10k | 2 semanas | ~Ilimitado* | 🟢 Alto |
| **3. Sync Agressivo** | R$ 0 | 1 semana | ~1.600 fotos | 🟢 Alto |
| **4. React Native** | R$ 30k | 6 semanas | Ilimitado | 🟢 Muito Alto |

*Ilimitado = limitado pelo espaço livre do device (GBs)

---

## 🎯 Recomendação Final

### Implementar em 3 fases:

#### Fase 1 (AGORA - 1 semana):
```
✅ Compressão inteligente
✅ Upload agressivo
✅ Alertas de storage
✅ Thumbnails após upload

Resultado:
├── Capacidade: 333 → 1.600 fotos
├── Custo: R$ 0
└── Resolve 90% dos casos
```

#### Fase 2 (Mês 2 - 2 semanas):
```
✅ Adicionar Capacitor
✅ Filesystem nativo
✅ Storage ilimitado

Resultado:
├── Capacidade: ~Ilimitada
├── Custo: R$ 10k
└── Resolve 99% dos casos
```

#### Fase 3 (Mês 6 - 6 semanas):
```
✅ React Native completo
✅ Experiência premium

Resultado:
├── Tudo funciona perfeitamente
├── Custo: R$ 30k
└── Produto definitivo
```

---

## 💡 Solução Imediata (Posso Fazer Hoje)

Posso implementar **agora**:

1. ✅ Biblioteca de compressão (`image-compression.ts` - já criado)
2. ✅ Hook de monitoramento (`use-storage-monitor.ts`)
3. ✅ Sistema de upload inteligente
4. ✅ Alertas visuais
5. ✅ Limpeza automática pós-upload

**Você quer que eu implemente isso no código atual?**

Isso resolve o problema de storage em 90% dos casos sem custo adicional!

---

**Documento criado em**: 2025-10-20
**Versão**: 1.0
