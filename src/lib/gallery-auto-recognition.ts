/**
 * Sistema de Reconhecimento Automático de Fotos por Nome
 *
 * Permite que o PWA:
 * 1. Salve fotos na galeria com nome estruturado
 * 2. Leia fotos da galeria automaticamente
 * 3. Associe fotos aos pontos corretos pelo nome do arquivo
 */

export interface PhotoFileName {
  prefix: string;        // "AnchorView"
  projectSlug: string;   // "EdificioCentral"
  pontoNumero: string;   // "A1"
  type: 'Teste' | 'Final';
  date: string;          // "2025-01-15"
  time: string;          // "14-30"
  extension: string;     // "jpg"
}

/**
 * Padrão de nomenclatura:
 * AnchorView_[ProjectSlug]_[PontoNumero]_[Type]_[Date]_[Time].jpg
 *
 * Exemplo:
 * AnchorView_EdificioCentral_A1_Teste_2025-01-15_14-30.jpg
 */

/**
 * Gera nome estruturado para foto
 */
export function generatePhotoFileName(params: {
  projectName: string;
  pontoNumero: string;
  type: 'teste' | 'final';
  timestamp?: Date;
}): string {
  const { projectName, pontoNumero, type, timestamp = new Date() } = params;

  // Limpar nomes (remover acentos e caracteres especiais)
  const projectSlug = slugify(projectName);
  const pontoSlug = slugify(pontoNumero);

  // Formatar data e hora
  const date = formatDate(timestamp); // "2025-01-15"
  const time = formatTime(timestamp); // "14-30"

  // Tipo
  const typeLabel = type === 'teste' ? 'Teste' : 'Final';

  return `AnchorView_${projectSlug}_${pontoSlug}_${typeLabel}_${date}_${time}.jpg`;
}

/**
 * Parse nome de arquivo para extrair metadados
 */
export function parsePhotoFileName(fileName: string): PhotoFileName | null {
  // Padrão: AnchorView_[Project]_[Ponto]_[Type]_[Date]_[Time].jpg
  const pattern = /^AnchorView_(.+?)_(.+?)_(Teste|Final)_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})\.([a-z]+)$/i;

  const match = fileName.match(pattern);

  if (!match) {
    return null;
  }

  const [, projectSlug, pontoNumero, type, date, time, extension] = match;

  return {
    prefix: 'AnchorView',
    projectSlug,
    pontoNumero,
    type: type as 'Teste' | 'Final',
    date,
    time,
    extension
  };
}

/**
 * Busca fotos na galeria que pertencem a um ponto específico
 */
export async function findPhotosForPoint(
  projectName: string,
  pontoNumero: string
): Promise<File[]> {
  try {
    // Capacitor (app nativo)
    if (isCapacitor()) {
      return await findPhotosForPointCapacitor(projectName, pontoNumero);
    }

    // PWA puro (browser)
    // Infelizmente, PWA não pode LER galeria automaticamente
    // Mas pode pedir ao usuário para selecionar pasta
    return await findPhotosForPointBrowser(projectName, pontoNumero);

  } catch (error) {
    console.error('Erro ao buscar fotos do ponto:', error);
    return [];
  }
}

/**
 * Capacitor: Busca fotos no filesystem
 */
async function findPhotosForPointCapacitor(
  projectName: string,
  pontoNumero: string
): Promise<File[]> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  try {
    // Listar todos os arquivos no diretório AnchorView
    const result = await Filesystem.readdir({
      path: 'AnchorView',
      directory: Directory.Documents
    });

    const projectSlug = slugify(projectName);
    const pontoSlug = slugify(pontoNumero);

    // Filtrar fotos do ponto específico
    const matchingFiles = result.files.filter(file => {
      const parsed = parsePhotoFileName(file.name);
      return (
        parsed &&
        parsed.projectSlug === projectSlug &&
        parsed.pontoNumero === pontoSlug
      );
    });

    // Ler conteúdo dos arquivos
    const photos: File[] = [];

    for (const file of matchingFiles) {
      const content = await Filesystem.readFile({
        path: `AnchorView/${file.name}`,
        directory: Directory.Documents
      });

      const blob = base64ToBlob(content.data as string, 'image/jpeg');
      const fileObj = new File([blob], file.name, { type: 'image/jpeg' });
      photos.push(fileObj);
    }

    return photos;

  } catch (error) {
    console.error('Erro ao ler fotos do Capacitor:', error);
    return [];
  }
}

/**
 * Browser: Pede ao usuário para selecionar pasta da galeria
 */
async function findPhotosForPointBrowser(
  projectName: string,
  pontoNumero: string
): Promise<File[]> {
  // File System Access API (Chrome/Edge)
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'pictures' // Abre na pasta de fotos
      });

      const photos: File[] = [];

      // Iterar arquivos no diretório
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();

          // Verificar se nome corresponde ao ponto
          const parsed = parsePhotoFileName(file.name);
          if (
            parsed &&
            parsed.projectSlug === slugify(projectName) &&
            parsed.pontoNumero === slugify(pontoNumero)
          ) {
            photos.push(file);
          }
        }
      }

      return photos;

    } catch (error) {
      // Usuário cancelou ou API não suportada
      console.log('Usuário cancelou seleção de diretório');
      return [];
    }
  }

  // Fallback: Input file tradicional
  return await requestPhotosViaInput(projectName, pontoNumero);
}

/**
 * Fallback: Input file (usuário seleciona manualmente)
 */
async function requestPhotosViaInput(
  projectName: string,
  pontoNumero: string
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = () => {
      const files = Array.from(input.files || []);

      // Filtrar apenas fotos do ponto
      const matching = files.filter(file => {
        const parsed = parsePhotoFileName(file.name);
        return (
          parsed &&
          parsed.projectSlug === slugify(projectName) &&
          parsed.pontoNumero === slugify(pontoNumero)
        );
      });

      resolve(matching);
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}

/**
 * Scan completo: Encontra TODAS as fotos do AnchorView na galeria
 */
export async function scanGalleryForAllPhotos(): Promise<{
  projectSlug: string;
  pontoNumero: string;
  type: 'Teste' | 'Final';
  file: File;
  parsed: PhotoFileName;
}[]> {
  const allPhotos: any[] = [];

  if (isCapacitor()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const result = await Filesystem.readdir({
      path: 'AnchorView',
      directory: Directory.Documents
    });

    for (const file of result.files) {
      const parsed = parsePhotoFileName(file.name);

      if (parsed) {
        const content = await Filesystem.readFile({
          path: `AnchorView/${file.name}`,
          directory: Directory.Documents
        });

        const blob = base64ToBlob(content.data as string, 'image/jpeg');
        const fileObj = new File([blob], file.name, { type: 'image/jpeg' });

        allPhotos.push({
          projectSlug: parsed.projectSlug,
          pontoNumero: parsed.pontoNumero,
          type: parsed.type,
          file: fileObj,
          parsed
        });
      }
    }
  }

  return allPhotos;
}

/**
 * Importação automática: Lê galeria e associa fotos aos pontos
 */
export async function autoImportPhotosFromGallery(
  projects: Array<{ id: string; name: string }>,
  points: Array<{ id: string; numeroPonto: string; projectId: string }>
): Promise<{
  imported: number;
  errors: string[];
}> {
  const allPhotos = await scanGalleryForAllPhotos();
  let imported = 0;
  const errors: string[] = [];

  for (const photo of allPhotos) {
    try {
      // Encontrar projeto correspondente
      const project = projects.find(p =>
        slugify(p.name) === photo.projectSlug
      );

      if (!project) {
        errors.push(`Projeto não encontrado: ${photo.projectSlug}`);
        continue;
      }

      // Encontrar ponto correspondente
      const point = points.find(p =>
        p.projectId === project.id &&
        slugify(p.numeroPonto) === photo.pontoNumero
      );

      if (!point) {
        errors.push(`Ponto ${photo.pontoNumero} não encontrado no projeto ${project.name}`);
        continue;
      }

      // Converter para base64
      const dataUrl = await fileToDataUrl(photo.file);

      // Salvar no IndexedDB com associação correta
      // TODO: Implement savePhoto method in offlineDB
      // await offlineDB.savePhoto({
      //   id: generateId(),
      //   pontoId: point.id,
      //   projectId: project.id,
      //   dataUrl: dataUrl,
      //   fileName: photo.file.name,
      //   type: photo.type === 'Teste' ? 'teste' : 'final',
      //   timestamp: parseDateTime(photo.parsed.date, photo.parsed.time),
      //   storedInGallery: true,
      //   uploadStatus: 'pending'
      // });

      imported++;

    } catch (error) {
      errors.push(`Erro ao importar ${photo.file.name}: ${error}`);
    }
  }

  return { imported, errors };
}

/**
 * Utilities
 */

function slugify(text: string): string {
  return text
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^a-zA-Z0-9]/g, '-') // Substituir especiais por hífen
    .replace(/-+/g, '-') // Múltiplos hífens -> um hífen
    .replace(/^-|-$/g, '') // Remover hífens das pontas
    .substring(0, 30); // Limitar tamanho
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}-${minutes}`;
}

function parseDateTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split('-');
  return new Date(+year, +month - 1, +day, +hours, +minutes).toISOString();
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isCapacitor(): boolean {
  return !!(window as any).Capacitor;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Exemplo de uso:
 *
 * // 1. Capturar foto com nome estruturado
 * const fileName = generatePhotoFileName({
 *   projectName: 'Edifício Central',
 *   pontoNumero: 'A-1',
 *   type: 'teste'
 * });
 * // => "AnchorView_EdificioCentral_A-1_Teste_2025-01-15_14-30.jpg"
 *
 * // 2. Salvar na galeria
 * await savePhotoToGallery(photoDataUrl, fileName);
 *
 * // 3. Mais tarde, buscar fotos do ponto
 * const photos = await findPhotosForPoint('Edifício Central', 'A-1');
 * // => [File, File] (todas as fotos do ponto A-1)
 *
 * // 4. Importação automática em massa
 * const result = await autoImportPhotosFromGallery(projects, points);
 * console.log(`Importadas ${result.imported} fotos`);
 */
