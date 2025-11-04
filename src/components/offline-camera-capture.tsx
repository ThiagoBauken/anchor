"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, Check, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { offlineDB } from '@/lib/indexeddb';

interface OfflineCameraCaptureProps {
  onPhotoCapture?: (photoData: string, fileId: string) => void;
  onClose?: () => void;
  companyId: string;
  userId?: string;
  pointId?: string;
  testId?: string;
}

export function OfflineCameraCapture({
  onPhotoCapture,
  onClose,
  companyId,
  userId,
  pointId,
  testId
}: OfflineCameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast({
        title: 'Erro na Câmera',
        description: 'Não foi possível acessar a câmera. Verifique as permissões.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Definir tamanho do canvas igual ao vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoData);
    stopCamera();

    toast({
      title: 'Foto Capturada',
      description: 'Foto salva localmente. Será sincronizada quando voltar online.',
    });
  }, [stopCamera, toast]);

  const savePhotoOffline = useCallback(async () => {
    if (!capturedPhoto) return;

    try {
      // Converter base64 para blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();

      // Gerar ID único para o arquivo
      const fileId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filename = `${fileId}.jpg`;

      // Salvar no IndexedDB
      await offlineDB.storeFile(fileId, filename, blob);

      // Criar registro de arquivo no banco local
      const fileRecord = {
        id: fileId,
        filename,
        originalName: filename,
        mimeType: 'image/jpeg',
        size: blob.size,
        uploaded: false,
        companyId,
        userId,
        timestamp: Date.now(),
        metadata: {
          pointId,
          testId,
          capturedAt: new Date().toISOString(),
          offline: true
        }
      };

      // Callback para componente pai
      if (onPhotoCapture) {
        onPhotoCapture(capturedPhoto, fileId);
      }

      toast({
        title: 'Foto Salva Offline',
        description: 'Foto armazenada localmente e será sincronizada automaticamente.',
        variant: 'default'
      });

      // Fechar modal
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Erro ao salvar foto offline:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a foto offline.',
        variant: 'destructive'
      });
    }
  }, [capturedPhoto, companyId, userId, pointId, testId, onPhotoCapture, onClose, toast]);

  const uploadPhotoOnline = useCallback(async () => {
    if (!capturedPhoto || !isOnline) return;

    try {
      // Converter base64 para blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();

      // Criar FormData
      const formData = new FormData();
      const fileId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const file = new File([blob], `${fileId}.jpg`, { type: 'image/jpeg' });
      
      formData.append('file', file);
      formData.append('id', fileId);
      formData.append('companyId', companyId);
      if (userId) formData.append('userId', userId);

      // Upload para servidor
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();

        if (onPhotoCapture) {
          onPhotoCapture(result.file.url, fileId);
        }

        toast({
          title: 'Foto Enviada',
          description: 'Foto enviada e salva no servidor.',
        });

        if (onClose) {
          onClose();
        }
      } else {
        throw new Error('Falha no upload');
      }

    } catch (error) {
      console.error('Erro no upload online:', error);
      toast({
        title: 'Falha no Upload',
        description: 'Salvando offline...',
        variant: 'destructive'
      });
      // Fallback para modo offline
      await savePhotoOffline();
    }
  }, [capturedPhoto, isOnline, companyId, userId, onPhotoCapture, onClose, toast, savePhotoOffline]);

  // Monitorar status de conexão
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Capturar Foto
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-500" />
          )}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isCapturing && !capturedPhoto && (
          <Button onClick={startCamera} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Abrir Câmera
          </Button>
        )}

        {isCapturing && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-md"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Capturar
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {capturedPhoto && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="w-full rounded-md"
              />
            </div>
            
            <div className="flex gap-2">
              {isOnline ? (
                <Button onClick={uploadPhotoOnline} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Online
                </Button>
              ) : (
                <Button onClick={savePhotoOffline} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Salvar Offline
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  setCapturedPhoto(null);
                  startCamera();
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Nova Foto
              </Button>
            </div>
            
            {!isOnline && (
              <p className="text-xs text-muted-foreground text-center">
                📱 Modo offline: Foto será sincronizada automaticamente quando voltar online
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}