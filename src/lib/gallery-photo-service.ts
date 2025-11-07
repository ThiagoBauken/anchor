/**
 * Gallery Photo Service
 *
 * Serviço para captura e gerenciamento de fotos usando Capacitor
 * - Salva fotos na galeria com nome estruturado
 * - Armazena apenas metadados (não a foto inteira)
 * - Upload de fotos salvas quando online
 * - Qualidade 100% sem compressão
 */

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// Metadados da foto (armazenados no IndexedDB)
export interface PhotoMetadata {
  id: string;
  fileName: string; // Nome estruturado
  filePath?: string; // Caminho completo (para leitura)
  projectId: string;
  projectName: string;
  pontoId: string; // ID ÚNICO do ponto (evita confusão)
  pontoNumero: string;
  pontoLocalizacao: string; // Progressão/Localização (Horizontal, Vertical, etc.)
  type: 'ponto' | 'teste' | 'teste-final';
  capturedAt: string; // ISO timestamp
  uploaded: boolean;
  uploadedAt?: string;
  fileSize?: number; // Bytes (estimado)
}

/**
 * Gera nome de arquivo estruturado
 * Formato: AnchorView_[ProjectSlug]_[Localizacao]_[PontoNumero]_[PontoID-Short]_[Type]_[Date]_[Time].jpg
 *
 * O PontoID garante unicidade mesmo se houver pontos com mesmo número em prédios diferentes
 * A Localização diferencia pontos com mesmo número em progressões diferentes (Horizontal, Vertical, etc.)
 */
export function generateStructuredFileName(metadata: {
  projectName: string;
  pontoLocalizacao: string; // Progressão (Horizontal, Vertical, etc.)
  pontoNumero: string;
  pontoId: string; // ID único do ponto
  type: 'ponto' | 'teste' | 'teste-final';
}): string {
  const now = new Date();

  // Slug do projeto (remove espaços, acentos, caracteres especiais)
  const projectSlug = metadata.projectName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '_') // Substitui não-alfanuméricos por _
    .replace(/_+/g, '_') // Remove múltiplos _
    .substring(0, 15); // Limita tamanho

  // Slug da localização/progressão
  const localizacaoSlug = metadata.pontoLocalizacao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 12); // Limita tamanho

  // Slug do ponto
  const pontoSlug = metadata.pontoNumero.replace(/[^a-zA-Z0-9]/g, '_');

  // ID curto do ponto (últimos 8 caracteres para garantir unicidade)
  const pontoIdShort = metadata.pontoId.substring(metadata.pontoId.length - 8);

  // Tipo legível
  const typeLabel = {
    'ponto': 'Ponto',
    'teste': 'Teste',
    'teste-final': 'TesteFinal'
  }[metadata.type];

  // Data: YYYYMMDD
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Hora: HHMMSS
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  // Exemplo final: AnchorView_EdSolar_Horizontal_P1_a3b4c5d6_Ponto_20250120_153045.jpg
  return `AnchorView_${projectSlug}_${localizacaoSlug}_${pontoSlug}_${pontoIdShort}_${typeLabel}_${date}_${time}.jpg`;
}

/**
 * Parse filename para extrair metadados
 * Retorna null se não for um arquivo AnchorView válido
 */
export function parsePhotoFileName(fileName: string): Partial<PhotoMetadata> | null {
  // Formato: AnchorView_[Project]_[Localizacao]_[Ponto]_[PontoID]_[Type]_[Date]_[Time].jpg
  const match = fileName.match(/^AnchorView_(.+?)_(.+?)_(.+?)_([a-zA-Z0-9]{8})_(Ponto|Teste|TesteFinal)_(\d{8})_(\d{6})\.jpg$/);

  if (!match) return null;

  const [, projectSlug, localizacaoSlug, pontoSlug, pontoIdShort, type, date, time] = match;

  // Reconstrói timestamp
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6)) - 1;
  const day = parseInt(date.substring(6, 8));
  const hour = parseInt(time.substring(0, 2));
  const minute = parseInt(time.substring(2, 4));
  const second = parseInt(time.substring(4, 6));

  const capturedAt = new Date(year, month, day, hour, minute, second).toISOString();

  const typeMap: Record<string, 'ponto' | 'teste' | 'teste-final'> = {
    'Ponto': 'ponto',
    'Teste': 'teste',
    'TesteFinal': 'teste-final'
  };

  return {
    fileName,
    pontoLocalizacao: localizacaoSlug.replace(/_/g, ' '),
    pontoNumero: pontoSlug.replace(/_/g, ''),
    type: typeMap[type],
    capturedAt,
    uploaded: false
    // pontoId completo não pode ser recuperado, apenas o short
  };
}

/**
 * Captura foto com câmera nativa e salva na galeria
 * Retorna metadados para armazenar no IndexedDB
 */
export async function capturePhotoToGallery(metadata: {
  projectId: string;
  projectName: string;
  pontoId: string; // ID único do ponto
  pontoNumero: string;
  pontoLocalizacao: string; // Progressão/Localização (qualquer nome)
  type: 'ponto' | 'teste' | 'teste-final';
}): Promise<PhotoMetadata | null> {
  try {
    // Verifica se Capacitor está disponível
    if (!Capacitor.isNativePlatform()) {
      console.warn('Capacitor not available - using web fallback');
      return null;
    }

    // Gera nome estruturado
    const fileName = generateStructuredFileName(metadata);

    // Captura foto com qualidade máxima
    const photo: Photo = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: true, // Salva automaticamente na galeria
    });

    if (!photo.path) {
      throw new Error('Photo path not available');
    }

    // No Android/iOS, a foto já está salva na galeria
    // Vamos copiar com o nome estruturado para a pasta do app
    try {
      // Lê a foto original
      const photoData = await Filesystem.readFile({
        path: photo.path
      });

      // Salva com nome estruturado na pasta Documents
      await Filesystem.writeFile({
        path: `AnchorView/${fileName}`,
        data: photoData.data,
        directory: Directory.Documents,
      });

      console.log(`[Gallery] Photo saved: ${fileName}`);
    } catch (error) {
      console.warn('[Gallery] Could not save structured copy:', error);
      // Não é crítico - a foto já está na galeria
    }

    // Cria metadados (sem base64!)
    const photoMetadata: PhotoMetadata = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fileName,
      filePath: photo.path,
      projectId: metadata.projectId,
      projectName: metadata.projectName,
      pontoId: metadata.pontoId, // ID único
      pontoNumero: metadata.pontoNumero,
      pontoLocalizacao: metadata.pontoLocalizacao, // Progressão
      type: metadata.type,
      capturedAt: new Date().toISOString(),
      uploaded: false,
      fileSize: undefined // Será calculado no upload
    };

    // Salva metadados no IndexedDB
    await savePhotoMetadata(photoMetadata);
    console.log(`[PhotoDB] Metadata saved for: ${fileName}`);

    return photoMetadata;
  } catch (error) {
    console.error('[Gallery] Error capturing photo:', error);
    return null;
  }
}

/**
 * Lê foto da galeria pelo caminho
 * Retorna base64 para upload
 */
export async function readPhotoFromGallery(filePath: string): Promise<string | null> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    const photoData = await Filesystem.readFile({
      path: filePath
    });

    // Retorna data URL completo
    return `data:image/jpeg;base64,${photoData.data}`;
  } catch (error) {
    console.error('[Gallery] Error reading photo:', error);
    return null;
  }
}

/**
 * Upload de foto para o servidor
 * Lê da galeria e envia
 */
export async function uploadPhotoToServer(
  photoMetadata: PhotoMetadata,
  serverEndpoint: string
): Promise<boolean> {
  try {
    if (!photoMetadata.filePath) {
      console.error('[Gallery] No file path in metadata');
      return false;
    }

    // Lê foto da galeria
    const base64Data = await readPhotoFromGallery(photoMetadata.filePath);

    if (!base64Data) {
      console.error('[Gallery] Could not read photo from gallery');
      return false;
    }

    // Envia para o servidor
    const response = await fetch(serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: photoMetadata.fileName,
        projectId: photoMetadata.projectId,
        pontoNumero: photoMetadata.pontoNumero,
        type: photoMetadata.type,
        photoData: base64Data,
        capturedAt: photoMetadata.capturedAt
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    console.log(`[Gallery] Photo uploaded: ${photoMetadata.fileName}`);
    return true;
  } catch (error) {
    console.error('[Gallery] Error uploading photo:', error);
    return false;
  }
}

/**
 * Sincroniza todas as fotos pendentes
 * Retorna quantidade de fotos sincronizadas
 */
export async function syncAllPhotos(
  photos: PhotoMetadata[],
  serverEndpoint: string,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const pendingPhotos = photos.filter(p => !p.uploaded);

  let synced = 0;

  for (let i = 0; i < pendingPhotos.length; i++) {
    const photo = pendingPhotos[i];

    onProgress?.(i + 1, pendingPhotos.length);

    const success = await uploadPhotoToServer(photo, serverEndpoint);

    if (success) {
      synced++;
      // Atualizar metadados no IndexedDB (marcar como uploaded)
      await updatePhotoMetadata(photo.id, {
        uploaded: true,
        uploadedAt: new Date().toISOString()
      });
      console.log(`[PhotoDB] Photo marked as uploaded: ${photo.fileName}`);
    }
  }

  return synced;
}

/**
 * ==================================
 * INDEXEDDB MANAGEMENT FOR PHOTO METADATA
 * ==================================
 */

const DB_NAME = 'AnchorViewPhotoDB';
const DB_VERSION = 1;
const STORE_NAME = 'photoMetadata';

/**
 * Abre conexão com IndexedDB
 */
async function openPhotoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Criar object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('uploaded', 'uploaded', { unique: false });
        objectStore.createIndex('projectId', 'projectId', { unique: false });
        objectStore.createIndex('pontoId', 'pontoId', { unique: false });
        objectStore.createIndex('capturedAt', 'capturedAt', { unique: false });
      }
    };
  });
}

/**
 * Busca todos os metadados de fotos
 */
export async function getAllPhotoMetadata(): Promise<PhotoMetadata[]> {
  try {
    const db = await openPhotoDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PhotoDB] Error getting all photo metadata:', error);
    return [];
  }
}

/**
 * Salva metadados de foto no IndexedDB
 */
export async function savePhotoMetadata(metadata: PhotoMetadata): Promise<boolean> {
  try {
    const db = await openPhotoDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(metadata);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PhotoDB] Error saving photo metadata:', error);
    return false;
  }
}

/**
 * Atualiza metadados de foto (ex: marcar como uploaded)
 */
export async function updatePhotoMetadata(
  photoId: string,
  updates: Partial<PhotoMetadata>
): Promise<boolean> {
  try {
    const db = await openPhotoDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Busca o metadata atual
    const getRequest = store.get(photoId);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const existingMetadata = getRequest.result;

        if (!existingMetadata) {
          reject(new Error('Photo metadata not found'));
          return;
        }

        // Merge updates
        const updatedMetadata = { ...existingMetadata, ...updates };
        const putRequest = store.put(updatedMetadata);

        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('[PhotoDB] Error updating photo metadata:', error);
    return false;
  }
}

/**
 * Deleta metadados de foto
 */
export async function deletePhotoMetadata(photoId: string): Promise<boolean> {
  try {
    const db = await openPhotoDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(photoId);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PhotoDB] Error deleting photo metadata:', error);
    return false;
  }
}

/**
 * Busca fotos pendentes de upload
 */
export async function getPendingPhotoMetadata(): Promise<PhotoMetadata[]> {
  try {
    const db = await openPhotoDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('uploaded');
    const request = index.getAll(IDBKeyRange.only(false)); // uploaded === false

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PhotoDB] Error getting pending photos:', error);
    return [];
  }
}

/**
 * Verifica se Capacitor está disponível
 */
export function isCapacitorAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Verifica permissões de câmera
 */
export async function checkCameraPermissions(): Promise<boolean> {
  try {
    const permission = await Camera.checkPermissions();
    return permission.camera === 'granted' && permission.photos === 'granted';
  } catch (error) {
    console.error('[Gallery] Error checking permissions:', error);
    return false;
  }
}

/**
 * Solicita permissões de câmera
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const permission = await Camera.requestPermissions();
    return permission.camera === 'granted' && permission.photos === 'granted';
  } catch (error) {
    console.error('[Gallery] Error requesting permissions:', error);
    return false;
  }
}
