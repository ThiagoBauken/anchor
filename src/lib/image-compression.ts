/**
 * Biblioteca de compressão de imagens para PWA
 * Reduz tamanho mantendo qualidade aceitável
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  targetSizeKB?: number; // Tamanho alvo em KB
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Comprime imagem de forma agressiva mas mantendo qualidade
 * Ideal para fotos técnicas que precisam de detalhes
 */
export async function compressImage(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,      // HD suficiente para zoom
    maxHeight = 1920,
    quality = 0.8,        // 80% mantém boa qualidade
    targetSizeKB = 200    // ~200KB por foto
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calcular dimensões mantendo aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Criar canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Melhorar qualidade do resize
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Comprimir progressivamente até atingir tamanho alvo
      let currentQuality = quality;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
      let iterations = 0;
      const maxIterations = 5;

      while (iterations < maxIterations) {
        const sizeKB = getDataUrlSizeKB(compressedDataUrl);

        if (sizeKB <= targetSizeKB) {
          break;
        }

        // Reduzir qualidade gradualmente
        currentQuality -= 0.1;
        if (currentQuality < 0.3) {
          currentQuality = 0.3; // Nunca menos que 30%
          break;
        }

        compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        iterations++;
      }

      const originalSize = getDataUrlSizeKB(dataUrl);
      const compressedSize = getDataUrlSizeKB(compressedDataUrl);

      resolve({
        originalSize,
        compressedSize,
        compressionRatio: compressedSize / originalSize,
        dataUrl: compressedDataUrl,
        width,
        height
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  dataUrls: string[],
  options?: CompressionOptions
): Promise<CompressionResult[]> {
  return Promise.all(
    dataUrls.map(dataUrl => compressImage(dataUrl, options))
  );
}

/**
 * Converte base64 para Blob (mais eficiente para storage)
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Converte Blob para base64
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Calcula tamanho em KB de uma data URL
 */
export function getDataUrlSizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  const byteSize = atob(base64).length;
  return byteSize / 1024;
}

/**
 * Otimiza foto para inspeção técnica
 * Mantém qualidade mas reduz tamanho drasticamente
 */
export async function optimizeInspectionPhoto(
  dataUrl: string
): Promise<CompressionResult> {
  return compressImage(dataUrl, {
    maxWidth: 1920,      // Full HD
    maxHeight: 1920,
    quality: 0.85,       // 85% para manter detalhes técnicos
    targetSizeKB: 150    // ~150KB por foto
  });
}

/**
 * Comprime para thumbnail (preview)
 */
export async function createThumbnail(
  dataUrl: string
): Promise<CompressionResult> {
  return compressImage(dataUrl, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
    targetSizeKB: 30 // ~30KB para thumbnail
  });
}

/**
 * Estimativa de quantas fotos cabem no storage
 */
export function estimatePhotoCapacity(
  storageLimitMB: number,
  avgPhotoKB: number = 150
): number {
  const storageLimitKB = storageLimitMB * 1024;
  return Math.floor(storageLimitKB / avgPhotoKB);
}

/**
 * Verifica espaço disponível (funciona apenas em Chrome/Edge)
 */
export async function getStorageEstimate(): Promise<{
  available: boolean;
  usage?: number;
  quota?: number;
  usagePercent?: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      return {
        available: true,
        usage,
        quota,
        usagePercent: quota > 0 ? (usage / quota) * 100 : 0
      };
    } catch (error) {
      console.error('Storage estimate failed:', error);
    }
  }

  return { available: false };
}

/**
 * Alerta quando storage está chegando no limite
 */
export async function checkStorageWarning(
  warningThresholdPercent: number = 80
): Promise<{
  shouldWarn: boolean;
  usagePercent: number;
  message?: string;
}> {
  const estimate = await getStorageEstimate();

  if (!estimate.available || !estimate.usagePercent) {
    return {
      shouldWarn: false,
      usagePercent: 0,
      message: 'Storage estimate not available (iOS)'
    };
  }

  const shouldWarn = estimate.usagePercent >= warningThresholdPercent;

  return {
    shouldWarn,
    usagePercent: estimate.usagePercent,
    message: shouldWarn
      ? `Storage ${Math.round(estimate.usagePercent)}% cheio. Sincronize fotos em breve!`
      : undefined
  };
}

/**
 * Exemplo de uso completo:
 *
 * // Ao capturar foto
 * const photo = await capturePhoto();
 * const compressed = await optimizeInspectionPhoto(photo);
 *
 * console.log(`Original: ${compressed.originalSize}KB`);
 * console.log(`Comprimido: ${compressed.compressedSize}KB`);
 * console.log(`Economia: ${Math.round((1 - compressed.compressionRatio) * 100)}%`);
 *
 * // Salvar
 * await indexedDBStorage.addPhoto({
 *   dataUrl: compressed.dataUrl,
 *   compressed: true,
 *   originalSize: compressed.originalSize
 * });
 *
 * // Verificar espaço
 * const warning = await checkStorageWarning();
 * if (warning.shouldWarn) {
 *   showNotification(warning.message);
 * }
 */
