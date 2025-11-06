"use client";

import { useState } from 'react';
import { useOfflineData } from '@/context/OfflineDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, MapPin, Circle, Square, X, Plus as PlusIcon } from 'lucide-react';
import type { Location, MarkerShape } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const MarkerIcon = ({ shape, className }: { shape: MarkerShape; className?: string }) => {
  switch (shape) {
    case 'circle':
      return <Circle className={className} />;
    case 'square':
      return <div className={`w-4 h-4 border-2 border-current ${className}`} />;
    case 'x':
      return <X className={className} />;
    case '+':
      return <PlusIcon className={className} />;
    default:
      return <Circle className={className} />;
  }
};

interface LocationFormProps {
  location?: Location;
  onSuccess: () => void;
  projectId: string;
}

function LocationForm({ location, onSuccess, projectId }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '');
  const [markerShape, setMarkerShape] = useState<MarkerShape>(location?.markerShape || 'circle');
  const [markerColor, setMarkerColor] = useState(location?.markerColor || '#6941DE');
  const [isLoading, setIsLoading] = useState(false);

  const { createLocation, updateLocation, currentUser } = useOfflineData();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    setIsLoading(true);
    try {
      if (location) {
        await updateLocation({
          ...location,
          name,
          markerShape,
          markerColor
        });
        toast({
          title: 'Localização atualizada',
          description: 'A localização foi atualizada com sucesso.',
        });
      } else {
        await createLocation({
          name,
          markerShape,
          markerColor,
          companyId: currentUser.companyId,
          projectId: projectId
        });
        toast({
          title: 'Localização criada',
          description: 'A nova localização foi criada com sucesso.',
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao ${location ? 'atualizar' : 'criar'} localização.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Localização</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Sala de Máquinas, Cobertura, Área Externa"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="markerShape">Formato do Marcador</Label>
        <Select value={markerShape} onValueChange={(value: MarkerShape) => setMarkerShape(value)}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <MarkerIcon shape={markerShape} className="w-4 h-4" />
                <span className="capitalize">{
                  markerShape === 'circle' ? 'Círculo' :
                  markerShape === 'square' ? 'Quadrado' :
                  markerShape === 'x' ? 'X' :
                  markerShape === '+' ? 'Cruz' : markerShape
                }</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4" />
                <span>Círculo</span>
              </div>
            </SelectItem>
            <SelectItem value="square">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current" />
                <span>Quadrado</span>
              </div>
            </SelectItem>
            <SelectItem value="x">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                <span>X</span>
              </div>
            </SelectItem>
            <SelectItem value="+">
              <div className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                <span>Cruz (+)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="markerColor">Cor do Marcador</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="markerColor"
            type="color"
            value={markerColor}
            onChange={(e) => setMarkerColor(e.target.value)}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            value={markerColor}
            onChange={(e) => setMarkerColor(e.target.value)}
            placeholder="#6941DE"
            className="flex-1"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : location ? 'Atualizar' : 'Criar'}
      </Button>
    </form>
  );
}

interface ProgressionGeneratorProps {
  onSuccess: () => void;
}

function ProgressionGenerator({ onSuccess }: ProgressionGeneratorProps) {
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(10);
  const [location, setLocation] = useState('');
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [spacing, setSpacing] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  const { currentProject, createPoint, locations, currentUser } = useOfflineData();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!currentProject || !currentUser) return;
    if (startNumber >= endNumber) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O número inicial deve ser menor que o final.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const pointsToCreate = endNumber - startNumber + 1;
      const promises = [];

      for (let i = 0; i < pointsToCreate; i++) {
        const pointNumber = startNumber + i;
        const x = direction === 'horizontal' ? i * spacing + 100 : 100;
        const y = direction === 'vertical' ? i * spacing + 100 : 100;

        promises.push(
          createPoint({
            projectId: currentProject.id,
            numeroPonto: pointNumber.toString(),
            localizacao: location,
            posicaoX: x,
            posicaoY: y,
            status: 'Não Testado',
            createdByUserId: currentUser.id
          })
        );
      }

      await Promise.all(promises);
      
      toast({
        title: 'Progressão criada',
        description: `${pointsToCreate} pontos foram criados com sucesso.`,
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao criar progressão de pontos.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startNumber">Ponto Inicial</Label>
          <Input
            id="startNumber"
            type="number"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endNumber">Ponto Final</Label>
          <Input
            id="endNumber"
            type="number"
            value={endNumber}
            onChange={(e) => setEndNumber(parseInt(e.target.value) || 10)}
            min="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localização</Label>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma localização" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.name}>
                <div className="flex items-center gap-2">
                  <MarkerIcon shape={loc.markerShape} className="w-4 h-4" />
                  {loc.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direction">Direção</Label>
        <Select value={direction} onValueChange={(value: 'horizontal' | 'vertical') => setDirection(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spacing">Espaçamento (pixels)</Label>
        <Input
          id="spacing"
          type="number"
          value={spacing}
          onChange={(e) => setSpacing(parseInt(e.target.value) || 50)}
          min="10"
          max="200"
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={isLoading || !location}
        className="w-full"
      >
        {isLoading ? 'Criando...' : `Criar ${endNumber - startNumber + 1} Pontos`}
      </Button>
    </div>
  );
}

export function LocationsTab() {
  const { locations, createLocation, deleteLocation, currentProject, currentUser } = useOfflineData();
  const [editLocation, setEditLocation] = useState<Location | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);

  const { toast } = useToast();

  // Early return if no project selected
  if (!currentProject) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Selecione um projeto para gerenciar suas localizações.</p>
      </div>
    );
  }

  const handleSuccess = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsProgressionOpen(false);
    setEditLocation(undefined);
  };

  // Create default locations if none exist
  const createDefaultLocations = async () => {
    if (!currentUser?.companyId || !currentProject) return;

    try {
      const defaultLocs = [
        { name: 'Cobertura', markerShape: 'circle' as MarkerShape, markerColor: '#22c55e' }, // green
        { name: 'Sala de Máquinas', markerShape: 'square' as MarkerShape, markerColor: '#3b82f6' }, // blue
        { name: 'Área Externa', markerShape: 'x' as MarkerShape, markerColor: '#f59e0b' }, // amber
        { name: 'Subsolo', markerShape: '+' as MarkerShape, markerColor: '#8b5cf6' }, // purple
      ];

      for (const loc of defaultLocs) {
        await createLocation({
          ...loc,
          companyId: currentUser.companyId,
          projectId: currentProject.id
        });
      }

      toast({
        title: 'Localizações padrão criadas',
        description: 'Foram criadas 4 localizações padrão para começar.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao criar localizações padrão.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Localizações</h2>
          <p className="text-white/60">
            Adicione ou remova categorias de localização e personalize os marcadores do mapa.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProgressionOpen} onOpenChange={setIsProgressionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Criar Progressão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Progressão de Pontos</DialogTitle>
                <DialogDescription>
                  Crie uma sequência de pontos automaticamente em linha horizontal ou vertical.
                </DialogDescription>
              </DialogHeader>
              <ProgressionGenerator onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Localização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Localização</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria de localização com marcador personalizado.
                </DialogDescription>
              </DialogHeader>
              <LocationForm onSuccess={handleSuccess} projectId={currentProject.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma localização criada</h3>
            <p className="text-gray-600 mb-4">
              Crie localizações para categorizar seus pontos de ancoragem.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={createDefaultLocations} variant="outline">
                Criar Localizações Padrão
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                Criar Primeira Localização
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${location.markerColor || '#6941DE'}20` }}>
                      <div style={{ color: location.markerColor || '#6941DE' }}>
                        <MarkerIcon shape={location.markerShape} className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-base">{location.name}</CardTitle>
                      <CardDescription className="capitalize">
                        Marcador: {
                          location.markerShape === 'circle' ? 'Círculo' :
                          location.markerShape === 'square' ? 'Quadrado' :
                          location.markerShape === 'x' ? 'X' :
                          location.markerShape === '+' ? 'Cruz' : location.markerShape
                        }
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Dialog open={isEditOpen && editLocation?.id === location.id} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditLocation(undefined);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditLocation(location)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Localização</DialogTitle>
                        <DialogDescription>
                          Altere o nome ou formato do marcador desta localização.
                        </DialogDescription>
                      </DialogHeader>
                      <LocationForm location={editLocation} onSuccess={handleSuccess} projectId={currentProject.id} />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a localização "{location.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await deleteLocation(location.id);
                              toast({
                                title: 'Localização excluída',
                                description: `A localização "${location.name}" foi excluída.`,
                              });
                            } catch (error) {
                              toast({
                                variant: 'destructive',
                                title: 'Erro',
                                description: 'Erro ao excluir localização.',
                              });
                            }
                          }}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Sobre as Localizações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p><strong>• Marcadores Personalizados:</strong> Cada localização pode ter um formato de marcador diferente (círculo, quadrado, X, cruz).</p>
          <p><strong>• Progressões Automáticas:</strong> Crie sequências de pontos automaticamente em linha horizontal ou vertical.</p>
          <p><strong>• Organização:</strong> Use localizações para categorizar pontos por área (cobertura, subsolo, etc.).</p>
        </CardContent>
      </Card>
    </div>
  );
}