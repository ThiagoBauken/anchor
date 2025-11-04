# Setup Mobile - iOS e Android

## Pré-requisitos

### Para iOS:
- macOS (obrigatório)
- Xcode 14+ instalado
- CocoaPods instalado: `sudo gem install cocoapods`

### Para Android:
- Android Studio instalado
- Java JDK 11+ instalado
- Android SDK configurado

## Passos para Adicionar Plataformas

### 1. Build do Projeto Next.js
```bash
npm run build
```

### 2. Adicionar Plataforma iOS (apenas em macOS)
```bash
npx cap add ios
npx cap sync ios
```

### 3. Adicionar Plataforma Android
```bash
npx cap add android
npx cap sync android
```

### 4. Abrir Projeto Nativo

**iOS:**
```bash
npx cap open ios
```
Isso abrirá o Xcode. Configure:
- Bundle Identifier: `com.anchorview.app`
- Signing & Capabilities: Configure seu time de desenvolvimento
- Info.plist: Permissões de câmera e galeria já configuradas

**Android:**
```bash
npx cap open android
```
Isso abrirá o Android Studio. Configure:
- Package name: `com.anchorview.app`
- AndroidManifest.xml: Permissões de câmera e storage já configuradas

### 5. Testar em Dispositivo Real

**iOS:**
1. Conecte o iPhone via USB
2. No Xcode, selecione seu dispositivo
3. Clique em "Run" (▶️)

**Android:**
1. Ative "Depuração USB" no Android
2. Conecte o dispositivo via USB
3. No Android Studio, clique em "Run" (▶️)

## Atualizando Código Web

Sempre que modificar o código Next.js:

```bash
# 1. Build
npm run build

# 2. Sync com plataformas nativas
npx cap sync
```

## Testando Fotos na Galeria

1. Abra o app no dispositivo real
2. Navegue até "Pontos" ou "Testes"
3. Clique em "Tirar Foto"
4. Tire uma foto
5. Verifique que:
   - ✅ Foto aparece no preview
   - ✅ Foto está na galeria com nome estruturado
   - ✅ Metadados salvos (veja na aba "Sync")
   - ✅ Qualidade 100%
   - ✅ Sincronização funciona quando online

## Permissões Configuradas

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>AnchorView precisa acessar a câmera para capturar fotos dos pontos de ancoragem.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>AnchorView salva fotos na galeria para backup e organização.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>AnchorView precisa adicionar fotos à galeria.</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
```

## Troubleshooting

### Erro: "Capacitor not available"
- Rode `npx cap sync` novamente
- Verifique se está testando em dispositivo real (não funciona no navegador web)

### Erro de permissão de câmera
- Verifique se o usuário aceitou as permissões
- iOS: Settings > AnchorView > Camera
- Android: Settings > Apps > AnchorView > Permissions

### Foto não aparece na galeria
- iOS: Verifique Photos app
- Android: Verifique Gallery app ou Google Photos
- O nome deve começar com "AnchorView_"

### Build falha
- Limpe cache: `npm run clean` (se disponível)
- Remova node_modules: `rm -rf node_modules && npm install`
- Remova plataformas e adicione novamente:
  ```bash
  npx cap remove ios
  npx cap remove android
  npm run build
  npx cap add ios
  npx cap add android
  ```

## Live Reload (Desenvolvimento)

Para testar rapidamente sem rebuild constante:

```bash
# 1. Inicie dev server
npm run dev

# 2. No capacitor.config.ts, adicione:
server: {
  url: 'http://192.168.1.100:9002', // Seu IP local
  cleartext: true
}

# 3. Sync
npx cap sync

# 4. Abra app
# Agora o app carrega do dev server
```

**IMPORTANTE:** Remova a configuração `server.url` antes de fazer build de produção!

## Publicação (Futuro)

### iOS - App Store
1. Archive no Xcode
2. Distribua para TestFlight
3. Submeta para App Store

### Android - Play Store
1. Generate Signed Bundle/APK no Android Studio
2. Upload para Play Console
3. Configurar release

---

**Data:** 2025-01-20
**Status:** Plataformas prontas para serem adicionadas
**Próximo:** Executar comandos acima para adicionar iOS/Android
