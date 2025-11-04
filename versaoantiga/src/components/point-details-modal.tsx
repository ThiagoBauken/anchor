
"use client";

import { useAnchorData } from '@/context/AnchorDataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { TestTubeDiagonal, Edit } from 'lucide-react';
import { useState } from 'react';
import { PointForm } from './point-form';

interface PointDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointId: string | null;
}

const getStatusClass = (status: 'Aprovado' | 'Reprovado' | 'Não Testado'): string => {
    switch (status) {
        case 'Aprovado': return 'bg-green-500 hover:bg-green-600';
        case 'Reprovado': return 'bg-red-500 hover:bg-red-600';
        case 'Não Testado': default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
}

export function PointDetailsModal({ isOpen, onClose, pointId }: PointDetailsModalProps) {
  const { getPointById, getTestByPointId, users, getProjectById, setActiveTab, setTestPointId, currentUser } = useAnchorData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const point = pointId ? getPointById(pointId) : null;
  const project = point ? getProjectById(point.projectId) : null;
  const test = pointId ? getTestByPointId(pointId) : null;

  if (!point) return null;

  const createdByUser = users.find(u => u.id === point.createdByUserId)?.name || 'Desconhecido';
  const lastModifiedByUser = users.find(u => u.id === point.lastModifiedByUserId)?.name || 'Desconhecido';
  const testedByUser = test ? (users.find(u => u.id === test.createdByUserId)?.name || 'Desconhecido') : '';

  const handleTestClick = () => {
    if (point) {
        setTestPointId(point.id);
        setActiveTab('tests');
        onClose();
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };
  
  const handleEditClose = () => {
      setIsEditModalOpen(false);
      onClose();
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Ponto #{point.numeroPonto}</DialogTitle>
            <DialogDescription>Projeto: {project?.name}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
          <div className="grid md:grid-cols-2 gap-6 mt-4 pr-6">
            {/* Point Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informações do Ponto</h3>
              {point.foto && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image src={point.foto} alt={`Foto do ponto ${point.numeroPonto}`} layout="fill" objectFit="cover" data-ai-hint="construction site"/>
                </div>
              )}
              <div className="text-sm space-y-2">
                <p><strong>Lacre:</strong> {point.numeroLacre || 'N/A'}</p>
                <p><strong>Localização:</strong> {point.localizacao || 'N/A'}</p>
                <p><strong>Equipamento:</strong> {point.tipoEquipamento || 'N/A'}</p>
                <p><strong>Posição no Mapa:</strong> X: {point.posicaoX.toFixed(2)}px, Y: {point.posicaoY.toFixed(2)}px</p>
                <p><strong>Data de Instalação:</strong> {point.dataInstalacao ? new Date(point.dataInstalacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
                <p><strong>Frequência de Inspeção:</strong> {point.frequenciaInspecaoMeses ? `${point.frequenciaInspecaoMeses} meses` : 'N/A'}</p>
                <p><strong>Data de Cadastro:</strong> {new Date(point.dataHora).toLocaleString('pt-BR')}</p>
                <p><strong>Cadastrado por:</strong> {createdByUser}</p>
                <p><strong>Última Modificação por:</strong> {lastModifiedByUser}</p>
                {point.observacoes && <p><strong>Observações do Ponto:</strong> {point.observacoes}</p>}
              </div>
            </div>
            
            {/* Test Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Resultado da Inspeção</h3>
              {test ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                      {test.fotoTeste && (
                         <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                          <Image src={test.fotoTeste} alt="Foto do teste" layout="fill" objectFit="cover" data-ai-hint="safety inspection"/>
                          <p className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">Testando</p>
                        </div>
                      )}
                      {test.fotoPronto && (
                         <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                          <Image src={test.fotoPronto} alt="Foto do ponto pronto" layout="fill" objectFit="cover" data-ai-hint="finished construction"/>
                           <p className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">Pronto</p>
                        </div>
                      )}
                  </div>

                  <div className="text-sm space-y-2">
                    <p><strong>Resultado:</strong> <Badge className={getStatusClass(test.resultado)}>{test.resultado}</Badge></p>
                    <p><strong>Carga Aplicada:</strong> {test.carga} kgf</p>
                    <p><strong>Tempo de Teste:</strong> {test.tempo} min</p>
                    <p><strong>Técnico Responsável:</strong> {test.tecnico}</p>
                    <p><strong>Data do Teste:</strong> {new Date(test.dataHora).toLocaleString('pt-BR')}</p>
                    {test.dataFotoPronto && <p><strong>Data da Foto "Pronto":</strong> {new Date(test.dataFotoPronto).toLocaleString('pt-BR')}</p>}
                    <p><strong>Testado por:</strong> {testedByUser}</p>
                    {test.observacoes && <p><strong>Observações do Teste:</strong> {test.observacoes}</p>}
                  </div>
                </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                      <Badge className={getStatusClass('Não Testado')}>Não Testado</Badge>
                      <p className="mt-2 text-sm text-muted-foreground">Este ponto ainda não foi inspecionado.</p>
                       <Button className="mt-4" onClick={handleTestClick}>
                          <TestTubeDiagonal className="mr-2 h-4 w-4" />
                          Realizar Teste
                      </Button>
                  </div>
              )}
            </div>
          </div>
          </ScrollArea>
          <DialogFooter>
              {currentUser?.role === 'admin' && (
                <Button variant="secondary" onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Ponto
                </Button>
              )}
              {point.status !== "Não Testado" && (
                  <Button variant="outline" onClick={handleTestClick}>
                      <TestTubeDiagonal className="mr-2 h-4 w-4" />
                      Realizar Novo Teste
                  </Button>
              )}
              <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Ponto de Ancoragem #{point.numeroPonto}</DialogTitle>
                <DialogDescription>Altere as informações do ponto de ancoragem.</DialogDescription>
            </DialogHeader>
            <PointForm pointToEdit={point} onPointEdited={handleEditClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}
