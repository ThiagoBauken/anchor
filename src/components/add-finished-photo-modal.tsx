"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useAnchorData } from '@/context/AnchorDataContext';
import { useToast } from '@/hooks/use-toast';
import { CameraCapture } from './camera-capture';

interface AddFinishedPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  pointNumber: string;
}

export function AddFinishedPhotoModal({ isOpen, onClose, testId, pointNumber }: AddFinishedPhotoModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const { addFinishedPhotoToTest } = useAnchorData();
  const { toast } = useToast();

  const handleSave = () => {
    if (!photo) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma foto selecionada',
        description: 'Por favor, carregue uma foto ou tire uma antes de salvar.',
      });
      return;
    }
    addFinishedPhotoToTest(testId, photo);
    toast({
      title: 'Foto Salva!',
      description: `A foto final para o ponto #${pointNumber} foi salva com sucesso.`,
    });
    onClose();
    setPhoto(null);
  };
  
  const handleClose = () => {
      setPhoto(null);
      onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Foto Final para Ponto #{pointNumber}</DialogTitle>
          <DialogDescription>
            Tire ou carregue a foto do ponto de ancoragem finalizado, com lacre e pronto para uso.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <CameraCapture onCapture={setPhoto} allowUpload={true} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!photo}>
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
