'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import {
  capturePhotoToGallery,
  PhotoMetadata,
  isCapacitorAvailable
} from '@/lib/gallery-photo-service';

interface CameraCaptureCapacitorProps {
  projectId: string;
  projectName: string;
  pontoId: string;
  pontoNumero: string;
  pontoLocalizacao: string; // Progressão/Localização (qualquer nome)
  type: 'ponto' | 'teste' | 'teste-final';
  onPhotoSaved: (metadata: PhotoMetadata) => void;
  existingPhoto?: string; // For displaying existing photos
  disabled?: boolean;
}

export default function CameraCaptureCapacitor({
  projectId,
  projectName,
  pontoId,
  pontoNumero,
  pontoLocalizacao,
  type,
  onPhotoSaved,
  existingPhoto,
  disabled = false
}: CameraCaptureCapacitorProps) {
  const { toast } = useToast();
  const [capturing, setCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhoto || null);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const isNative = isCapacitorAvailable();

  const handleCapture = async () => {
    if (disabled) return;

    setCapturing(true);

    try {
      const photoMetadata = await capturePhotoToGallery({
        projectId,
        projectName,
        pontoId,
        pontoNumero,
        pontoLocalizacao,
        type
      });

      if (photoMetadata) {
        // Save metadata (simplified - metadata already saved by capturePhotoToGallery)
        setMetadata(photoMetadata);
        setPreviewUrl(photoMetadata.filePath || null);

        toast({
          title: 'Foto capturada',
          description: `Salva na galeria: ${photoMetadata.fileName}`
        });

        // Notify parent component
        onPhotoSaved(photoMetadata);
      } else {
        toast({
          title: 'Captura cancelada',
          description: 'Nenhuma foto foi capturada.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível capturar a foto.',
        variant: 'destructive'
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setMetadata(null);
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'ponto':
        return 'Foto do Ponto';
      case 'teste':
        return 'Foto Durante o Teste';
      case 'teste-final':
        return 'Foto Pós-Teste';
      default:
        return 'Foto';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {getTypeLabel()}
          {isNative && (
            <span className="ml-2 text-xs text-green-600">
              • Modo Nativo (Galeria)
            </span>
          )}
        </label>
      </div>

      {previewUrl ? (
        <Card className="relative p-4">
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={previewUrl}
              alt="Foto capturada"
              fill
              className="object-cover"
            />
          </div>

          {metadata && (
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Arquivo:</span>
                <span className="truncate ml-2 max-w-[200px]" title={metadata.fileName}>
                  {metadata.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`flex items-center gap-1 ${metadata.uploaded ? 'text-green-600' : 'text-orange-600'}`}>
                  {metadata.uploaded ? (
                    <>
                      <Check className="w-3 h-3" />
                      Enviada
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Pendente
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCapture}
              disabled={capturing || disabled}
              className="flex-1"
            >
              {capturing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Tirar Nova
                </>
              )}
            </Button>

            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-violet-400 transition-colors">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
              {capturing ? (
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-violet-600" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {capturing ? 'Abrindo câmera...' : 'Nenhuma foto capturada'}
              </p>
              <p className="text-xs text-gray-500">
                {isNative
                  ? 'A foto será salva na galeria com nome estruturado'
                  : 'Modo web - funcionalidade limitada'}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCapture}
              disabled={capturing || disabled}
              size="lg"
            >
              {capturing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Tirar Foto
                </>
              )}
            </Button>

            {isNative && (
              <div className="text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-md">
                <strong>Qualidade 100%</strong> • Salvo na galeria do celular
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
