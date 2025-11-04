
"use client";

import { AnchorPoint } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TestTubeDiagonal, Trash2, Eye, Camera, CheckCircle } from 'lucide-react';
import { useAnchorData } from '@/context/AnchorDataContext';
import { PointDetailsModal } from './point-details-modal';
import { useState } from 'react';
import { AddFinishedPhotoModal } from './add-finished-photo-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PointCardProps {
  point: AnchorPoint;
}

const getStatusVariant = (status: AnchorPoint['status']): 'default' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'Aprovado':
      return 'default'; // default is green-ish in our theme
    case 'Reprovado':
      return 'destructive';
    case 'Não Testado':
    default:
      return 'secondary';
  }
};

const getStatusClass = (status: AnchorPoint['status']): string => {
    switch (status) {
        case 'Aprovado': return 'bg-green-500 hover:bg-green-600';
        case 'Reprovado': return 'bg-red-500 hover:bg-red-600';
        case 'Não Testado':
        default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
}


export function PointCard({ point }: PointCardProps) {
  const { deletePoint, inspectionFlags, getProjectById, currentUser, getTestByPointId, setActiveTab, setTestPointId } = useAnchorData();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const needsInspection = inspectionFlags.includes(point.id);
  const project = getProjectById(point.projectId);
  const test = getTestByPointId(point.id);

  const handleTestClick = () => {
    setTestPointId(point.id);
    setActiveTab('tests');
  };

  const handleDelete = () => {
    deletePoint(point.id);
    setIsDeleteAlertOpen(false);
  }

  const renderPrimaryAction = () => {
    if (point.status === 'Não Testado') {
      return (
        <Button className="w-full" onClick={handleTestClick}>
          <TestTubeDiagonal className="mr-2" />
          Realizar Teste
        </Button>
      );
    }

    if (test && !test.fotoPronto) {
      return (
        <Button className="w-full" variant="secondary" onClick={() => setIsPhotoModalOpen(true)}>
          <Camera className="mr-2" />
          Adicionar Foto do Ponto Pronto
        </Button>
      );
    }
    
    return (
       <Button className="w-full" disabled>
          <CheckCircle className="mr-2" />
          Teste Finalizado
       </Button>
    );
  };


  return (
    <>
      <Card className={`overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full ${needsInspection ? 'ring-2 ring-offset-2 ring-offset-background ring-yellow-400' : ''}`}>
        <div>
            <CardHeader className="p-0 relative">
              <div className="relative w-full h-40 bg-muted">
                <Image
                    src={point.foto || "https://placehold.co/400x200.png"}
                    alt={`Foto do ponto ${point.numeroPonto}`}
                    layout="fill"
                    objectFit="cover"
                    className="cursor-pointer"
                    onClick={() => setIsDetailsModalOpen(true)}
                    data-ai-hint="industrial climbing"
                />
              </div>
            {needsInspection && <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">Requer Inspeção</Badge>}
            </CardHeader>
            <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div>
                <CardTitle className="text-lg">{project?.name}</CardTitle>
                <CardDescription>Ponto #{point.numeroPonto} / Lacre #{point.numeroLacre || 'N/A'}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(point.status)} className={getStatusClass(point.status)}>{point.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{point.localizacao || 'Sem localização'}</p>
            <p className="text-xs text-muted-foreground mt-2">
                {new Date(point.dataHora).toLocaleString('pt-BR')}
            </p>
            </CardContent>
        </div>
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
            {renderPrimaryAction()}
            <div className="flex justify-end gap-2 w-full">
                <Button variant="ghost" size="sm" onClick={() => setIsDetailsModalOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" /> Detalhes
                </Button>
                {currentUser?.role === 'admin' && (
                    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Arquivar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá arquivar o ponto de ancoragem, ocultando-o do mapa principal e da galeria. Ele ainda existirá nos registros.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Sim, Arquivar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </CardFooter>
      </Card>
      <PointDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} pointId={point.id} />
      {test && <AddFinishedPhotoModal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} testId={test.id} pointNumber={point.numeroPonto} />}
    </>
  );
}
