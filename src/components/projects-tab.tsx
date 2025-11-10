"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineData } from '@/context/OfflineDataContext';
import { useToast } from '@/hooks/use-toast';
import type { MarkerShape } from '@/types';
import { canCreateProjects } from '@/lib/permissions';
import { Circle, Edit, FolderPlus, Plus, PlusCircle, Square, Tag, Trash2, X, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import PublicSettingsDialog from './public-settings-dialog';
import { ProjectFormSections } from './project-form-sections';
import { ProjectCard } from './project-card';
import Image from 'next/image';


function LocationManager() {
    const { locations, createLocation, deleteLocation, updateLocationShape, points, currentProject } = useOfflineData();
    const [newLocation, setNewLocation] = useState('');
    const { toast } = useToast();

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocation.trim()) {
            return;
        }

        if (!currentProject) {
            toast({
                title: 'Nenhum projeto selecionado',
                description: 'Selecione um projeto antes de adicionar localizações.',
                variant: 'destructive'
            });
            return;
        }

        if (locations.some(l => l.name === newLocation.trim())) {
            toast({ title: 'Localização já existe', variant: 'destructive' });
            return;
        }

        try {
            await createLocation({
                name: newLocation.trim(),
                markerShape: 'circle',
                companyId: '', // Will be set by the context
                projectId: '' // Will be set by the context
            });
            setNewLocation('');
            toast({ title: 'Localização Adicionada' });
        } catch (error) {
            console.error('Error creating location:', error);
            toast({
                title: 'Erro ao adicionar localização',
                description: 'Ocorreu um erro. Tente novamente.',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteLocation = async (locationId: string) => {
        const locationToDelete = locations.find(l => l.id === locationId);
        if (!locationToDelete) return;

        const isLocationInUse = points.some(p => p.localizacao === locationToDelete.name);
        if (isLocationInUse) {
            toast({
                title: 'Não é possível excluir',
                description: 'Esta localização está sendo usada por um ou mais pontos de ancoragem.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await deleteLocation(locationId);
            toast({ title: 'Localização Removida' });
        } catch (error) {
            console.error('Error deleting location:', error);
            toast({
                title: 'Erro ao remover localização',
                variant: 'destructive'
            });
        }
    };

    const handleUpdateShape = async (locationId: string, shape: MarkerShape) => {
        try {
            await updateLocationShape(locationId, shape);
        } catch (error) {
            console.error('Error updating location shape:', error);
            toast({
                title: 'Erro ao atualizar forma do marcador',
                variant: 'destructive'
            });
        }
    };

    return (
        <Card className="bg-card/90 backdrop-blur-sm self-start">
            <CardHeader>
                <CardTitle>Gerenciar Localizações</CardTitle>
                <CardDescription>Adicione ou remova as categorias de localização e personalize os marcadores do mapa.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddLocation} className="flex gap-2 mb-4">
                    <Input
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Nome da nova localização"
                    />
                    <Button type="submit" size="icon">
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {locations.map(loc => (
                        <div key={loc.id} className="p-2 rounded-md bg-muted/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4"/> {loc.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            <RadioGroup value={loc.markerShape} onValueChange={(v) => handleUpdateShape(loc.id, v as MarkerShape)} className="flex items-center gap-4 pt-1">
                                <Label className="text-xs">Marcador:</Label>
                                <RadioGroupItem value="circle" id={`shape-circle-${loc.id}`} className="sr-only" /><Label htmlFor={`shape-circle-${loc.id}`}><Circle className={`h-5 w-5 cursor-pointer ${loc.markerShape === 'circle' ? 'text-primary' : 'text-muted-foreground'}`} /></Label>
                                <RadioGroupItem value="square" id={`shape-square-${loc.id}`} className="sr-only" /><Label htmlFor={`shape-square-${loc.id}`}><Square className={`h-4 w-4 cursor-pointer ${loc.markerShape === 'square' ? 'text-primary' : 'text-muted-foreground'}`} /></Label>
                                <RadioGroupItem value="x" id={`shape-x-${loc.id}`} className="sr-only" /><Label htmlFor={`shape-x-${loc.id}`}><XIcon className={`h-5 w-5 cursor-pointer ${loc.markerShape === 'x' ? 'text-primary' : 'text-muted-foreground'}`} /></Label>
                                <RadioGroupItem value="+" id={`shape-plus-${loc.id}`} className="sr-only" /><Label htmlFor={`shape-plus-${loc.id}`}><Plus className={`h-5 w-5 cursor-pointer ${loc.markerShape === '+' ? 'text-primary' : 'text-muted-foreground'}`} /></Label>
                             </RadioGroup>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function ProjectsTab() {
  const { projects, createProject, updateProject, deleteProject, setCurrentProject, currentProject, currentUser, points: allPointsForProject } = useOfflineData();
  const [newProject, setNewProject] = useState({
    name: '',
    floorPlanImages: [] as string[],
    obraAddress: '',
    obraCEP: '',
    obraCNPJ: '',
    contratanteName: '',
    contratanteAddress: '',
    contratanteCEP: '',
    cnpjContratado: '',
    contato: '',
    valorContrato: '',
    dataInicio: '',
    dataTermino: '',
    responsavelTecnico: '',
    registroCREA: '',
    tituloProfissional: '',
    numeroART: '',
    rnp: '',
    cargaDeTestePadrao: '',
    tempoDeTestePadrao: '',
    engenheiroResponsavelPadrao: '',
    dispositivoDeAncoragemPadrao: '',
    scalePixelsPerMeter: '',
    dwgRealWidth: '',
    dwgRealHeight: '',
  });
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [publicSettingsProject, setPublicSettingsProject] = useState<{id: string, name: string} | null>(null);
  const { toast} = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewProject(prev => ({ ...prev, [id]: value }));
  };

  const handleFilesSelect = (base64Files: string[]) => {
    setNewProject(prev => ({ ...prev, floorPlanImages: base64Files }));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleAddProject called:', { projectName: newProject.name, hasImages: newProject.floorPlanImages.length > 0 });

    if (!newProject.name.trim()) {
      setFormError('O Nome do Projeto é obrigatório.');
      console.error('[ERROR] handleAddProject: Missing project name');
      return;
    }

    try {
      // Convert scale values to numbers
      const projectData = {
        ...newProject,
        companyId: currentUser?.companyId || '',
        scalePixelsPerMeter: newProject.scalePixelsPerMeter ? parseFloat(newProject.scalePixelsPerMeter) : undefined,
        dwgRealWidth: newProject.dwgRealWidth ? parseFloat(newProject.dwgRealWidth) : undefined,
        dwgRealHeight: newProject.dwgRealHeight ? parseFloat(newProject.dwgRealHeight) : undefined,
      };
      createProject(projectData);

      toast({
        title: 'Projeto Adicionado',
        description: `O projeto ${newProject.name.trim()} foi criado com sucesso.`,
      });
      console.log('[DEBUG] Project added successfully');
    } catch (error) {
      console.error('[ERROR] handleAddProject failed:', error);
      toast({
        title: 'Erro ao adicionar projeto',
        description: 'Ocorreu um erro ao criar o projeto. Tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    // Reset form
    setNewProject({
      name: '', floorPlanImages: [], obraAddress: '', obraCEP: '', obraCNPJ: '',
      contratanteName: '', contratanteAddress: '', contratanteCEP: '', valorContrato: '',
      dataInicio: '', dataTermino: '', responsavelTecnico: '', registroCREA: '',
      tituloProfissional: '', numeroART: '', rnp: '', cnpjContratado: '', contato: '',
      cargaDeTestePadrao: '', tempoDeTestePadrao: '', engenheiroResponsavelPadrao: '', dispositivoDeAncoragemPadrao: '',
      scalePixelsPerMeter: '', dwgRealWidth: '', dwgRealHeight: '',
    });
    setFormError(null);
    const fileInput = document.getElementById('floor-plan') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSelectProject = (project: any) => {
    console.log('[DEBUG] handleSelectProject called:', { projectId: project.id, projectName: project.name });
    try {
      setCurrentProject(project);
      toast({ title: 'Projeto Selecionado', description: `Visualizando ${project.name}` });
    } catch (error) {
      console.error('[ERROR] handleSelectProject failed:', error);
    }
  }

  const handleDeleteProject = (projectId: string) => {
    console.log('[DEBUG] handleDeleteProject called:', { projectId });
    try {
      deleteProject(projectId);
      toast({ title: 'Projeto Excluído', description: 'O projeto e todos os seus dados foram removidos.' });
    } catch (error) {
      console.error('[ERROR] handleDeleteProject failed:', error);
      toast({
        title: 'Erro ao excluir projeto',
        description: 'Ocorreu um erro ao excluir o projeto. Tente novamente.',
        variant: 'destructive'
      });
    }
  }

  const handleEditProject = (project: any) => {
    setEditingProject({ ...project });
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProject?.name.trim()) {
      setFormError('O Nome do Projeto é obrigatório.');
      return;
    }

    try {
      const projectData = {
        ...editingProject,
        companyId: editingProject.companyId || currentUser?.companyId || '',
        scalePixelsPerMeter: editingProject.scalePixelsPerMeter ? parseFloat(editingProject.scalePixelsPerMeter) : undefined,
        dwgRealWidth: editingProject.dwgRealWidth ? parseFloat(editingProject.dwgRealWidth) : undefined,
        dwgRealHeight: editingProject.dwgRealHeight ? parseFloat(editingProject.dwgRealHeight) : undefined,
      };

      await updateProject(projectData);

      toast({
        title: 'Projeto Atualizado',
        description: `O projeto ${editingProject.name.trim()} foi atualizado com sucesso.`,
      });

      setIsEditModalOpen(false);
      setEditingProject(null);
      setFormError(null);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Erro ao atualizar projeto',
        description: 'Ocorreu um erro ao atualizar o projeto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditingProject((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleEditFilesSelect = (base64Files: string[]) => {
    setEditingProject((prev: any) => ({ ...prev, floorPlanImages: base64Files }));
  };

  const projectPointCounts = useMemo(() => {
    const counts: Record<string, { active: number, archived: number }> = {};
    if (projects && allPointsForProject) {
      for (const project of projects) {
        const pointsInProject = allPointsForProject.filter(p => p.projectId === project.id);
        counts[project.id] = {
          active: pointsInProject.filter(p => !p.archived).length,
          archived: pointsInProject.filter(p => p.archived).length,
        }
      }
    }
    return counts;
  }, [projects, allPointsForProject]);

  // Verifica se o usuário pode criar projetos
  const userCanCreateProjects = currentUser && canCreateProjects({ user: currentUser });

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-4">
      <div className="space-y-6">
        {userCanCreateProjects && (
        <Card className="bg-card/90 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle>Adicionar Novo Projeto</CardTitle>
            <CardDescription>Crie um novo projeto e preencha os detalhes para o relatório técnico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProject} className="space-y-4">
              <ProjectFormSections
                formData={newProject}
                onInputChange={handleInputChange}
                onFilesSelect={handleFilesSelect}
                showFloorPlanUpload={true}
              />

              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" className="w-full mt-4">
                <FolderPlus className="mr-2 h-4 w-4" /> Criar Projeto
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card className="bg-card/90 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle>Projetos Registrados</CardTitle>
            <CardDescription>Selecione um projeto para ver seus detalhes e pontos de ancoragem.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={currentProject?.id === project.id}
                    currentUser={currentUser}
                    pointCounts={projectPointCounts[project.id] || { active: 0, archived: 0 }}
                    onSelect={handleSelectProject}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onPublicSettings={setPublicSettingsProject}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum projeto registrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <LocationManager />
      </div>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>

          {editingProject && (
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <ProjectFormSections
                formData={editingProject}
                onInputChange={handleEditInputChange}
                onFilesSelect={handleEditFilesSelect}
                showFloorPlanUpload={true}
                initialFloorPlans={editingProject.floorPlanImages || []}
              />

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" /> Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Public Settings Dialog */}
      {publicSettingsProject && (
        <PublicSettingsDialog
          projectId={publicSettingsProject.id}
          projectName={publicSettingsProject.name}
          open={!!publicSettingsProject}
          onOpenChange={(open) => !open && setPublicSettingsProject(null)}
        />
      )}
    </div>
  );
}
