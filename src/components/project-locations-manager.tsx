"use client";

import { useState, useMemo } from 'react';
import { useOfflineData } from '@/context/OfflineDataContext';
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Trash2, Edit, Circle, Square, Triangle, Diamond } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MarkerShape, Location } from '@/types';

interface ProjectLocationsManagerProps {
    projectId: string;
    projectName: string;
}

const MARKER_SHAPES: { value: MarkerShape; label: string; icon: React.ReactNode }[] = [
    { value: 'circle', label: 'Círculo', icon: <Circle className="h-4 w-4" /> },
    { value: 'square', label: 'Quadrado', icon: <Square className="h-4 w-4" /> },
    { value: 'x', label: 'X', icon: <span className="h-4 w-4 inline-flex items-center justify-center font-bold">×</span> },
    { value: '+', label: 'Cruz', icon: <span className="h-4 w-4 inline-flex items-center justify-center font-bold">+</span> },
];

export function ProjectLocationsManager({ projectId, projectName }: ProjectLocationsManagerProps) {
    const { locations, createLocation, updateLocation, deleteLocation, points } = useOfflineData();
    const { currentUser } = useOfflineAuthSafe();
    const { toast } = useToast();
    
    // Estados do formulário
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationShape, setNewLocationShape] = useState<MarkerShape>('circle');
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
    
    // Localizações do projeto atual
    const projectLocations = useMemo(() => {
        return locations.filter(loc => loc.projectId === projectId);
    }, [locations, projectId]);
    
    // Contar quantos pontos cada localização tem
    const locationUsage = useMemo(() => {
        const usage: Record<string, number> = {};
        points.forEach(point => {
            if (point.projectId === projectId) {
                const locationName = point.localizacao;
                usage[locationName] = (usage[locationName] || 0) + 1;
            }
        });
        return usage;
    }, [points, projectId]);
    
    const handleCreateLocation = async () => {
        if (!newLocationName.trim()) {
            toast({
                title: "Erro",
                description: "Nome da localização é obrigatório.",
                variant: "destructive"
            });
            return;
        }
        
        // Verificar se já existe uma localização com o mesmo nome
        const exists = projectLocations.some(loc => 
            loc.name.toLowerCase() === newLocationName.trim().toLowerCase()
        );
        
        if (exists) {
            toast({
                title: "Erro",
                description: "Já existe uma localização com este nome.",
                variant: "destructive"
            });
            return;
        }
        
        if (!currentUser?.companyId) {
            toast({
                title: "Erro",
                description: "Usuário não autenticado.",
                variant: "destructive"
            });
            return;
        }

        try {
            await createLocation({
                name: newLocationName.trim(),
                markerShape: newLocationShape,
                projectId: projectId,
                companyId: currentUser.companyId
            });
            
            toast({
                title: "Sucesso!",
                description: `Localização "${newLocationName}" criada.`
            });
            
            // Reset form
            setNewLocationName('');
            setNewLocationShape('circle');
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error('Erro ao criar localização:', error);
            toast({
                title: "Erro",
                description: "Falha ao criar localização.",
                variant: "destructive"
            });
        }
    };
    
    const handleUpdateLocation = async () => {
        if (!editingLocation || !newLocationName.trim()) return;
        
        // Verificar se já existe uma localização com o mesmo nome (exceto a atual)
        const exists = projectLocations.some(loc => 
            loc.id !== editingLocation.id && 
            loc.name.toLowerCase() === newLocationName.trim().toLowerCase()
        );
        
        if (exists) {
            toast({
                title: "Erro",
                description: "Já existe uma localização com este nome.",
                variant: "destructive"
            });
            return;
        }
        
        try {
            await updateLocation({
                ...editingLocation,
                name: newLocationName.trim(),
                markerShape: newLocationShape
            });
            
            toast({
                title: "Sucesso!",
                description: `Localização atualizada.`
            });
            
            // Reset form
            setEditingLocation(null);
            setNewLocationName('');
            setNewLocationShape('circle');
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            toast({
                title: "Erro",
                description: "Falha ao atualizar localização.",
                variant: "destructive"
            });
        }
    };
    
    const handleDeleteLocation = async () => {
        if (!locationToDelete) return;
        
        try {
            await deleteLocation(locationToDelete.id);
            
            toast({
                title: "Sucesso!",
                description: `Localização "${locationToDelete.name}" removida.`
            });
            
            setLocationToDelete(null);
        } catch (error) {
            console.error('Erro ao deletar localização:', error);
            toast({
                title: "Erro",
                description: "Falha ao remover localização.",
                variant: "destructive"
            });
        }
    };
    
    const startEdit = (location: Location) => {
        setEditingLocation(location);
        setNewLocationName(location.name);
        setNewLocationShape(location.markerShape);
    };
    
    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Localizações do Projeto
                        </CardTitle>
                        <CardDescription>
                            Gerencie as categorias de localização para {projectName}
                        </CardDescription>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nova Localização
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Nova Localização</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location-name">Nome da Localização</Label>
                                    <Input
                                        id="location-name"
                                        placeholder="Ex: Área Externa, Sala A, Cobertura..."
                                        value={newLocationName}
                                        onChange={(e) => setNewLocationName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Formato do Marcador</Label>
                                    <RadioGroup 
                                        value={newLocationShape} 
                                        onValueChange={(value) => setNewLocationShape(value as MarkerShape)}
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            {MARKER_SHAPES.map(shape => (
                                                <div key={shape.value} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={shape.value} id={shape.value} />
                                                    <Label htmlFor={shape.value} className="flex items-center gap-2 cursor-pointer">
                                                        {shape.icon}
                                                        {shape.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreateLocation}>
                                    Criar Localização
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {projectLocations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma localização criada</p>
                        <p className="text-sm">Crie sua primeira localização para organizar os pontos do projeto</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectLocations.map(location => {
                            const usageCount = locationUsage[location.name] || 0;
                            const shapeInfo = MARKER_SHAPES.find(s => s.value === location.markerShape);
                            
                            return (
                                <Card key={location.id} className="relative">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {shapeInfo?.icon}
                                                <span className="font-medium">{location.name}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                {usageCount} ponto{usageCount !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEdit(location)}
                                                className="gap-1"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Editar
                                            </Button>
                                            
                                            {usageCount === 0 && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Remover
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem certeza que deseja remover a localização "{location.name}"?
                                                                Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => setLocationToDelete(location)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Remover
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                            
                                            {usageCount > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    Em uso
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                
                {/* Dialog de Edição */}
                <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Localização</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-location-name">Nome da Localização</Label>
                                <Input
                                    id="edit-location-name"
                                    value={newLocationName}
                                    onChange={(e) => setNewLocationName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label>Formato do Marcador</Label>
                                <RadioGroup 
                                    value={newLocationShape} 
                                    onValueChange={(value) => setNewLocationShape(value as MarkerShape)}
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        {MARKER_SHAPES.map(shape => (
                                            <div key={shape.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={shape.value} id={`edit-${shape.value}`} />
                                                <Label htmlFor={`edit-${shape.value}`} className="flex items-center gap-2 cursor-pointer">
                                                    {shape.icon}
                                                    {shape.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingLocation(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleUpdateLocation}>
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                {/* Dialog de Confirmação de Exclusão */}
                <AlertDialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja remover a localização "{locationToDelete?.name}"?
                                Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setLocationToDelete(null)}>
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteLocation}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Remover
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}