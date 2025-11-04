# 🎯 Fluxo Completo: Fotos na Galeria com Reconhecimento Automático

## 📸 Fluxo do Usuário (UX)

### Cenário 1: Captura de Foto

```
👤 Técnico está inspecionando Ponto A-1 no Edifício Central

1. Abre app → Tab "Pontos"
2. Clica no Ponto A-1
3. Clica em "📝 Adicionar Teste"
4. Formulário do teste:
   ┌──────────────────────────────────┐
   │ Teste do Ponto A-1               │
   ├──────────────────────────────────┤
   │ Resultado: ● Aprovado            │
   │ Carga: 23 kN                     │
   │ Tempo: 2 min                     │
   │ Técnico: João Silva              │
   │                                  │
   │ ┌────────────────────────────┐   │
   │ │  📷 Tirar Foto do Teste    │   │
   │ └────────────────────────────┘   │
   │                                  │
   │ ┌────────────────────────────┐   │
   │ │  📷 Foto do Ponto Pronto   │   │
   │ └────────────────────────────┘   │
   │                                  │
   │ [  Salvar Teste  ]              │
   └──────────────────────────────────┘

5. Clica em "📷 Tirar Foto do Teste"
6. Câmera abre
7. Tira foto
8. Foto é AUTOMATICAMENTE:
   ├─> Comprimida (2MB → 150KB)
   ├─> Nomeada: "AnchorView_EdificioCentral_A1_Teste_2025-01-15_14-30.jpg"
   ├─> Salva na GALERIA do celular (pasta "AnchorView")
   └─> Metadados salvos no app (1KB)

9. Thumbnail aparece no formulário:
   ┌──────────────────────────────────┐
   │ Teste do Ponto A-1               │
   ├──────────────────────────────────┤
   │ [...]                            │
   │                                  │
   │ Foto do Teste:                   │
   │ ┌──────┐                         │
   │ │[IMG] │ ✅ Salva na galeria     │
   │ └──────┘ AnchorView_..._Teste... │
   │                                  │
   │ [  Salvar Teste  ]              │
   └──────────────────────────────────┘

10. Salva teste → Foto fica associada ao ponto A-1
```

---

### Cenário 2: Sincronização Automática

```
👤 Técnico terminou inspeção, volta para área com internet

1. App detecta conexão
2. Mostra notificação:
   ┌──────────────────────────────────┐
   │ 🔄 Sincronização Disponível      │
   ├──────────────────────────────────┤
   │ 15 fotos pendentes de upload     │
   │                                  │
   │ [Sincronizar Agora] [Depois]    │
   └──────────────────────────────────┘

3. Usuário clica em "Sincronizar Agora"
4. App automaticamente:
   ├─> Lê fotos da GALERIA pelo nome
   ├─> Identifica qual ponto cada foto pertence
   ├─> Faz upload para servidor
   └─> Marca como sincronizada

5. Progress bar:
   ┌──────────────────────────────────┐
   │ 🔄 Sincronizando...              │
   ├──────────────────────────────────┤
   │ ████████████░░░░░░ 8/15         │
   │                                  │
   │ Enviando: A1_Teste_2025...      │
   └──────────────────────────────────┘

6. Após upload:
   ┌──────────────────────────────────┐
   │ ✅ Sincronização Completa!       │
   ├──────────────────────────────────┤
   │ 15 fotos enviadas com sucesso    │
   │                                  │
   │ As fotos foram mantidas na       │
   │ sua galeria como backup.         │
   │                                  │
   │ [  OK  ]                        │
   └──────────────────────────────────┘
```

---

### Cenário 3: Importação Automática

```
👤 Usuário instalou app novo ou limpou cache

1. Abre app
2. App detecta fotos do AnchorView na galeria
3. Mostra prompt:
   ┌──────────────────────────────────┐
   │ 📷 Fotos Detectadas              │
   ├──────────────────────────────────┤
   │ Encontramos 23 fotos do          │
   │ AnchorView na sua galeria.       │
   │                                  │
   │ Deseja importá-las               │
   │ automaticamente?                 │
   │                                  │
   │ [Importar] [Ignorar]            │
   └──────────────────────────────────┘

4. Usuário clica em "Importar"
5. App lê nomes dos arquivos e associa aos pontos:
   ┌──────────────────────────────────┐
   │ 🔄 Importando fotos...           │
   ├──────────────────────────────────┤
   │ ✅ A1_Teste.jpg → Ponto A-1      │
   │ ✅ A1_Final.jpg → Ponto A-1      │
   │ ✅ B3_Teste.jpg → Ponto B-3      │
   │ ⚠️ C5_Teste.jpg → Ponto não     │
   │    encontrado                    │
   │                                  │
   │ Importadas: 20/23                │
   │ Erros: 3                         │
   └──────────────────────────────────┘

6. Fotos aparecem nos pontos corretos automaticamente!
```

---

## 🔧 Implementação Técnica

### A) Captura e Salvamento

```typescript
// src/components/photo-capture-with-gallery.tsx

export function PhotoCaptureButton({
  point,
  project,
  type // 'teste' | 'final'
}) {
  const handleCapture = async () => {
    // 1. Capturar foto
    const photo = await capturePhoto();

    // 2. Comprimir
    const compressed = await optimizeInspectionPhoto(photo);

    // 3. Gerar nome estruturado
    const fileName = generatePhotoFileName({
      projectName: project.name,
      pontoNumero: point.numeroPonto,
      type: type,
      timestamp: new Date()
    });
    // => "AnchorView_EdificioCentral_A1_Teste_2025-01-15_14-30.jpg"

    // 4. Salvar na galeria
    const saved = await saveToGallery({
      dataUrl: compressed.dataUrl,
      fileName: fileName
    });

    if (!saved.success) {
      // Fallback: IndexedDB
      await saveToIndexedDB(compressed.dataUrl);
      showToast('Foto salva no app');
    } else {
      // 5. Salvar apenas metadados
      await savePhotoMetadata({
        id: generateId(),
        pontoId: point.id,
        projectId: project.id,
        fileName: fileName,
        type: type,
        storedInGallery: true,
        uploaded: false,
        timestamp: new Date().toISOString()
      });

      showToast(`Foto salva: ${fileName}`);
    }
  };

  return (
    <Button onClick={handleCapture}>
      📷 Tirar Foto do {type === 'teste' ? 'Teste' : 'Ponto Pronto'}
    </Button>
  );
}
```

### B) Sincronização

```typescript
// src/lib/sync-manager-gallery.ts

export async function syncPhotosFromGallery() {
  // 1. Buscar metadados de fotos pendentes
  const pending = await indexedDB.getPhotos({
    uploaded: false,
    storedInGallery: true
  });

  console.log(`📤 ${pending.length} fotos para sincronizar`);

  let success = 0;
  let errors = 0;

  for (const photo of pending) {
    try {
      // 2. Ler foto da galeria
      const file = await readFromGallery(photo.fileName);

      if (!file) {
        console.warn(`Foto não encontrada: ${photo.fileName}`);
        errors++;
        continue;
      }

      // 3. Converter para base64
      const dataUrl = await fileToDataUrl(file);

      // 4. Upload
      await uploadPhoto({
        pontoId: photo.pontoId,
        projectId: photo.projectId,
        dataUrl: dataUrl,
        fileName: photo.fileName,
        type: photo.type
      });

      // 5. Marcar como enviada
      await indexedDB.updatePhoto(photo.id, {
        uploaded: true,
        uploadedAt: new Date().toISOString()
      });

      success++;

      // 6. (Opcional) Deletar da galeria
      // await deleteFromGallery(photo.fileName);

    } catch (error) {
      console.error(`Erro ao enviar ${photo.fileName}:`, error);
      errors++;
    }
  }

  return { success, errors, total: pending.length };
}

// Com Capacitor
async function readFromGallery(fileName: string): Promise<File | null> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  try {
    const content = await Filesystem.readFile({
      path: `AnchorView/${fileName}`,
      directory: Directory.Documents
    });

    const blob = base64ToBlob(content.data);
    return new File([blob], fileName, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}
```

### C) Importação Automática

```typescript
// src/components/auto-import-photos-dialog.tsx

export function AutoImportPhotosDialog() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    // Ao abrir app, verificar se há fotos na galeria
    checkForPhotosInGallery();
  }, []);

  const checkForPhotosInGallery = async () => {
    // Scan galeria
    const found = await scanGalleryForAllPhotos();

    if (found.length > 0) {
      setPhotos(found);
      // Mostrar dialog
    }
  };

  const handleImport = async () => {
    setImporting(true);

    const result = await autoImportPhotosFromGallery(
      projects,
      points
    );

    setImporting(false);

    showToast(`Importadas ${result.imported} fotos`);

    if (result.errors.length > 0) {
      showErrorDialog(result.errors);
    }
  };

  if (photos.length === 0) return null;

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📷 Fotos Detectadas na Galeria</DialogTitle>
          <DialogDescription>
            Encontramos {photos.length} fotos do AnchorView.
            Deseja importá-las automaticamente?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {photos.slice(0, 5).map(photo => (
            <div key={photo.file.name} className="flex items-center gap-2">
              <Check className="text-green-500" />
              <span className="text-sm">{photo.file.name}</span>
            </div>
          ))}
          {photos.length > 5 && (
            <span className="text-sm text-gray-500">
              ... e mais {photos.length - 5} fotos
            </span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setPhotos([])}>
            Ignorar
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📱 Como Fica na Galeria

### iOS (App Fotos):

```
📱 Fotos
└── 📁 Recentes
    ├── 📷 foto-familia.jpg
    ├── 📷 AnchorView_EdificioCentral_A1_Teste_2025-01-15_14-30.jpg ⬅️
    ├── 📷 AnchorView_EdificioCentral_A1_Final_2025-01-15_14-35.jpg ⬅️
    ├── 📷 screenshot.png
    └── 📷 AnchorView_EdificioCentral_B3_Teste_2025-01-15_15-10.jpg ⬅️

📁 Álbuns
└── 📁 AnchorView
    ├── 📷 AnchorView_EdificioCentral_A1_Teste...
    ├── 📷 AnchorView_EdificioCentral_A1_Final...
    └── 📷 AnchorView_EdificioCentral_B3_Teste...
```

**Vantagens**:
- ✅ Nome descritivo (usuário sabe o que é cada foto)
- ✅ Álbum separado "AnchorView"
- ✅ Backup automático no iCloud
- ✅ Pode compartilhar via WhatsApp/Email

---

## 🎯 Vantagens da Solução

### 1. Storage Ilimitado
```
❌ IndexedDB: 50MB limite
✅ Galeria: GB disponíveis

1.000 fotos × 150KB = 150MB
✅ Cabe tranquilamente na galeria
❌ Não caberia no IndexedDB
```

### 2. Backup Automático
```
✅ iCloud (iOS) sincroniza automaticamente
✅ Google Photos (Android) sincroniza automaticamente
✅ Usuário nunca perde fotos
✅ Pode recuperar de outro device
```

### 3. Transparência
```
✅ Usuário VÊ as fotos no app Fotos nativo
✅ Pode compartilhar facilmente
✅ Confiança: "está na minha galeria"
```

### 4. Reconhecimento Automático
```
✅ App lê nome do arquivo
✅ Associa à ponto correto automaticamente
✅ Sem input manual
✅ Sem erro de associação
```

### 5. Prova Legal
```
✅ Nome do arquivo = evidência
✅ Data/hora no nome E no EXIF
✅ GPS no EXIF (se ativar)
✅ Backup na nuvem como prova
```

---

## ⚙️ Configurações do Usuário

```typescript
// src/components/gallery-settings.tsx

<Card>
  <CardHeader>
    <CardTitle>📷 Configurações de Fotos</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Onde salvar */}
      <div>
        <Label>Local de Armazenamento</Label>
        <RadioGroup defaultValue="gallery">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="gallery" id="gallery" />
            <Label htmlFor="gallery">
              Galeria do Celular (Recomendado)
              <p className="text-xs text-gray-500">
                Storage ilimitado, backup automático
              </p>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="app" id="app" />
            <Label htmlFor="app">
              Dentro do App
              <p className="text-xs text-gray-500">
                Limite de 50MB no iOS
              </p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Apagar após upload */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Apagar da galeria após upload</Label>
          <p className="text-xs text-gray-500">
            Libera espaço, mas perde backup local
          </p>
        </div>
        <Switch />
      </div>

      {/* Criar álbum separado */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Criar álbum "AnchorView"</Label>
          <p className="text-xs text-gray-500">
            Organiza fotos em álbum separado
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      {/* Qualidade de compressão */}
      <div>
        <Label>Qualidade da Foto</Label>
        <Slider
          defaultValue={[85]}
          max={100}
          min={50}
          step={5}
        />
        <p className="text-xs text-gray-500">
          85% = ~150KB por foto (recomendado)
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🚀 Implementação: O Que Preciso Fazer

### Fase 1: PWA com File System Access API (5 dias)
```
✅ Biblioteca de compressão
✅ Gerador de nome estruturado
✅ Salvar na galeria (com prompt)
✅ Parser de nome de arquivo
✅ Buscar fotos por nome
✅ Importação automática
✅ UI de sincronização

Limitação:
- Safari iOS pede confirmação a cada foto
- Mas funciona!
```

### Fase 2: Capacitor (2 semanas)
```
✅ Câmera nativa
✅ Salva direto na galeria (sem prompt)
✅ Cria álbum "AnchorView"
✅ Renomeia automaticamente
✅ Leitura automática da galeria
✅ Perfeito no iOS e Android
```

---

## ✅ Decisão Final

**Posso implementar a solução de galeria AGORA!**

Isso resolve:
- ✅ Storage limitado (fotos na galeria = ilimitado)
- ✅ Perda de dados (backup automático iCloud/Google)
- ✅ Associação automática (nome estruturado)
- ✅ Transparência (usuário vê fotos)
- ✅ Custo: R$ 0

**Você quer que eu comece?** 🚀

---

**Documento criado em**: 2025-10-20
**Versão**: 1.0
