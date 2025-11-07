import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireProjectAccess } from '@/middleware/auth-middleware';

/**
 * POST /api/sync/photos
 *
 * Recebe fotos capturadas offline e salva no servidor
 *
 * Body esperado:
 * {
 *   fileName: string,
 *   projectId: string,
 *   pontoId: string,
 *   pontoNumero: string,
 *   pontoLocalizacao: string,
 *   type: 'ponto' | 'teste' | 'teste-final',
 *   photoData: string (base64 data URL),
 *   capturedAt: string (ISO timestamp)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTENTICAÇÃO
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const { user } = authResult;
    console.log(`[Sync Photos] Authenticated user: ${user!.email}`);

    const body = await request.json();

    const {
      fileName,
      projectId,
      pontoId,
      pontoNumero,
      pontoLocalizacao,
      type,
      photoData,
      capturedAt
    } = body;

    // Validação básica
    if (!fileName || !projectId || !pontoId || !photoData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. VERIFICAR ACESSO AO PROJETO
    const accessCheck = await requireProjectAccess(user!.id, projectId);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status || 403 }
      );
    }

    console.log(`[Sync Photos] User ${user!.email} has access to project ${projectId}`);

    // Verifica se é data URL válido
    if (!photoData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid photo data format' },
        { status: 400 }
      );
    }

    // Extrai base64 da data URL
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Define diretório de upload
    // Estrutura: /uploads/photos/[projectId]/[pontoId]/[fileName]
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos', projectId, pontoId);

    // Cria diretório se não existir
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Salva arquivo
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL pública da foto
    const publicUrl = `/uploads/photos/${projectId}/${pontoId}/${fileName}`;

    console.log(`[Sync] Photo saved: ${fileName} (${buffer.length} bytes)`);

    // Salvar referência no banco de dados
    try {
      await prisma.photo.create({
        data: {
          fileName,
          filePath: filePath,
          publicUrl,
          projectId,
          pontoId,
          pontoNumero,
          pontoLocalizacao,
          type,
          capturedAt: new Date(capturedAt),
          uploadedAt: new Date(),
          uploaded: true,
          fileSize: buffer.length
        }
      });

      console.log(`[Sync] Photo metadata saved to database: ${fileName}`);
    } catch (dbError) {
      console.error('[Sync] Error saving to database:', dbError);
      // Foto foi salva em filesystem mas não no banco
      // Continua retornando sucesso mas log o erro
    }

    return NextResponse.json({
      success: true,
      fileName,
      url: publicUrl,
      size: buffer.length
    });

  } catch (error) {
    console.error('[Sync] Error saving photo:', error);
    return NextResponse.json(
      { error: 'Failed to save photo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/photos?projectId=xxx
 *
 * Lista todas as fotos de um projeto (para verificação)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTENTICAÇÃO
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // 2. VERIFICAR ACESSO AO PROJETO
    const accessCheck = await requireProjectAccess(user!.id, projectId);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status || 403 }
      );
    }

    // 3. Buscar fotos do banco de dados
    const photos = await prisma.photo.findMany({
      where: { projectId },
      orderBy: { capturedAt: 'desc' }
    });

    console.log(`[Sync Photos GET] User ${user!.email} retrieved ${photos.length} photos from project ${projectId}`);

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    });

  } catch (error) {
    console.error('[Sync] Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
