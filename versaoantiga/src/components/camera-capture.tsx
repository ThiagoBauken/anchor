"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCcw, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface CameraCaptureProps {
  onCapture: (photo: string | null) => void;
  initialPhoto?: string | null;
  allowUpload?: boolean;
}

export function CameraCapture({ onCapture, initialPhoto = null, allowUpload = false }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setPhoto(initialPhoto);
  }, [initialPhoto]);

  const openCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setPhoto(null);
    onCapture(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(newStream);
      setHasCameraPermission(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Câmera não acessível',
        description: 'Não foi possível acessar a câmera. Verifique as permissões do navegador.',
      });
    }
  }, [onCapture, stream, toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhoto(dataUrl);
        onCapture(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhoto(dataUrl);
        onCapture(dataUrl);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [onCapture, stream]);
  
  const stopStream = useCallback(() => {
    if(stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
  }, [stream]);

  if (stream) {
    return (
      <div className="space-y-2">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md aspect-video object-cover bg-muted" />
        <div className="flex gap-2">
            <Button type="button" onClick={takePhoto} className="w-full">
                <Camera className="mr-2 h-4 w-4" /> Capturar
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={stopStream}>
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>
    );
  }

  if (photo) {
    return (
      <div className="space-y-2">
        <Card className="p-2">
          <Image src={photo} alt="Preview" width={400} height={300} className="rounded-md w-full h-auto" />
        </Card>
        <Button type="button" variant="outline" onClick={() => { setPhoto(null); onCapture(null); }} className="w-full">
          <RefreshCcw className="mr-2 h-4 w-4" /> Remover Foto
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          className="w-full border-dashed border-2 p-8 flex-col h-auto hover:bg-accent/50"
        >
          <Camera className="h-8 w-8 mb-2" />
          Tirar Foto
        </Button>
        {allowUpload && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 p-8 flex-col h-auto hover:bg-accent/50"
            >
              <Upload className="h-8 w-8 mb-2" />
              Carregar Arquivo
            </Button>
          </>
        )}
      </div>
     {hasCameraPermission === false && (
         <Alert variant="destructive" className="mt-2">
            <AlertTitle>Permissão da Câmera Negada</AlertTitle>
            <AlertDescription>
                Por favor, habilite o acesso à câmera nas configurações do seu navegador para continuar.
            </AlertDescription>
        </Alert>
     )}
    </>
  );
}
