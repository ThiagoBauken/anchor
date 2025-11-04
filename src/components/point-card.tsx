
"use client";

import { AnchorPoint } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TestTubeDiagonal, Trash2, Eye, Camera, CheckCircle, ArchiveRestore } from 'lucide-react';
import { useOfflineData } from '@/context/OfflineDataContext';
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
  const { deletePoint, unarchivePoint, inspectionFlags, getProjectById, currentUser, getTestsByPoint, setActiveTab, setTestPointId } = useOfflineData();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const needsInspection = inspectionFlags.includes(point.id);
  const project = getProjectById(point.projectId);
  const test = getTestsByPoint(point.id)[0]; // Get the latest test

  const handleTestClick = () => {
    console.log('[DEBUG] handleTestClick called for point:', point.id);
    try {
      setTestPointId(point.id);
      setActiveTab('tests');
    } catch (error) {
      console.error('[ERROR] handleTestClick failed:', error);
    }
  };

  const handleDelete = () => {
    console.log('[DEBUG] handleDelete called for point:', point.id);
    try {
      deletePoint(point.id);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error('[ERROR] handleDelete failed:', error);
    }
  }

  const handleUnarchive = () => {
    console.log('[DEBUG] handleUnarchive called for point:', point.id);
    try {
      unarchivePoint(point.id);
    } catch (error) {
      console.error('[ERROR] handleUnarchive failed:', error);
    }
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


  // Renderizar imagem com base no status
  const renderCardImage = () => {
    console.log('[DEBUG] renderCardImage - point:', {
      id: point.id,
      status: point.status,
      hasFoto: !!point.foto,
      hasTest: !!test,
      hasFotoTeste: !!test?.fotoTeste,
      hasFotoPronto: !!test?.fotoPronto
    });

    // Se APROVADO e tem teste com AMBAS as fotos - mostrar metade fotoTeste + metade fotoPronto
    if (point.status === 'Aprovado' && test?.fotoTeste && test?.fotoPronto) {
      console.log('[DEBUG] Showing SPLIT view (fotoTeste + fotoPronto) for point:', point.id);
      return (
        <div className="relative w-full h-40 bg-muted flex cursor-pointer" onClick={() => setIsDetailsModalOpen(true)}>
          {/* Metade esquerda - Foto do Teste (durante) */}
          <div className="relative w-1/2 h-full overflow-hidden">
            <Image
              src={test.fotoTeste}
              alt={`Foto do teste ${point.numeroPonto}`}
              layout="fill"
              objectFit="cover"
              className="border-r-2 border-white"
              data-ai-hint="industrial climbing test"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-semibold py-1 px-2 text-center">
              PONTO
            </div>
          </div>

          {/* Metade direita - Foto do Ponto Pronto */}
          <div className="relative w-1/2 h-full overflow-hidden">
            <Image
              src={test.fotoPronto}
              alt={`Foto do ponto pronto ${point.numeroPonto}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint="industrial climbing anchor point finished"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-semibold py-1 px-2 text-center">
              TESTE
            </div>
          </div>
        </div>
      );
    }

    // Se NÃO TESTADO - mostrar placeholder dividido com texto
    if (point.status === 'Não Testado' && !point.foto) {
      console.log('[DEBUG] Showing PLACEHOLDER view for point:', point.id);
      return (
        <div className="relative w-full h-40 bg-muted flex cursor-pointer" onClick={() => setIsDetailsModalOpen(true)}>
          {/* Metade esquerda - PONTO */}
          <div className="relative w-1/2 h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-r-2 border-white">
            <span className="text-4xl font-bold text-gray-400 dark:text-gray-500">PONTO</span>
          </div>

          {/* Metade direita - TESTE */}
          <div className="relative w-1/2 h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-500 dark:text-gray-600">TESTE</span>
          </div>
        </div>
      );
    }

    // Caso padrão - mostrar foto do ponto ou placeholder normal
    console.log('[DEBUG] Showing DEFAULT view for point:', point.id);
    return (
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
    );
  };

  return (
    <>
      <Card className={`overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full ${needsInspection ? 'ring-2 ring-offset-2 ring-offset-background ring-yellow-400' : ''} ${point.archived ? 'opacity-60 border-gray-400' : ''}`}>
        <div>
            <CardHeader className="p-0 relative">
              {renderCardImage()}
            {needsInspection && <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">Requer Inspeção</Badge>}
            {point.archived && <Badge variant="secondary" className="absolute top-2 left-2 bg-gray-500 text-white">Arquivado</Badge>}
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
            {!point.archived && renderPrimaryAction()}
            <div className="flex justify-end gap-2 w-full">
                <Button variant="ghost" size="sm" onClick={() => setIsDetailsModalOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" /> Detalhes
                </Button>
                {(currentUser?.role === 'superadmin' || currentUser?.role === 'company_admin' || currentUser?.role === 'team_admin') && (
                    point.archived ? (
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleUnarchive}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <ArchiveRestore className="h-4 w-4 mr-2" /> Desarquivar
                        </Button>
                    ) : (
                        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Arquivar</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação irá arquivar o ponto de ancoragem, ocultando-o do mapa principal e da galeria quando o filtro de arquivados estiver desativado. Você poderá desarquivá-lo posteriormente.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Sim, Arquivar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    )
                )}
            </div>
        </CardFooter>
      </Card>
      <PointDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} pointId={point.id} />
      {test && <AddFinishedPhotoModal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} testId={test.id} pointNumber={point.numeroPonto} />}
    </>
  );
}
