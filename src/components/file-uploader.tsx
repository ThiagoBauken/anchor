"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from './ui/button';

interface FileUploaderProps {
  onFileSelect: (base64: string | null) => void;
  initialFile?: string | null;
}

export function FileUploader({ onFileSelect, initialFile = null }: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialFile);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(initialFile);
  }, [initialFile]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: `O arquivo ${fileRejections[0].file.name} foi rejeitado. Apenas imagens são permitidas.`,
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onFileSelect(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
    },
    maxFiles: 1,
  });

  const removePreview = () => {
    setPreview(null);
    onFileSelect(null);
  };

  if (preview) {
    return (
      <div className="relative w-full aspect-video group">
        <Image src={preview} alt="Pré-visualização" layout="fill" objectFit="contain" className="rounded-md bg-muted/30" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={removePreview}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center 
        cursor-pointer transition-colors duration-200 ease-in-out text-muted-foreground
        ${isDragActive ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-primary/50 hover:bg-accent/50'}
      `}
    >
      <input {...getInputProps()} />
      <div className="text-center p-4">
        <UploadCloud className="mx-auto h-12 w-12" />
        <p className="mt-2 text-sm">
          {isDragActive
            ? 'Solte a imagem aqui...'
            : 'Arraste uma imagem ou clique para selecionar'}
        </p>
        <p className="text-xs mt-1">PNG, JPG, GIF até 10MB</p>
      </div>
    </div>
  );
}
