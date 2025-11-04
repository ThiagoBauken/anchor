"use client";

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
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineData } from '@/context/OfflineDataContext';
import { useToast } from '@/hooks/use-toast';
import type { MarkerShape } from '@/types';
import { canCreateProjects } from '@/lib/permissions';
import { Circle, Edit, FolderPlus, Plus, PlusCircle, Square, Tag, Trash2, X, XIcon, Globe } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import PublicSettingsDialog from './public-settings-dialog';


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

function FileUpload({ onFilesSelect, initialFiles = [] }: { onFilesSelect: (base64Files: string[]) => void, initialFiles?: string[] }) {
  const [previews, setPreviews] = useState<string[]>(initialFiles);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      const filePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            newPreviews.push(base64String);
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newFiles => {
        const allFiles = [...previews, ...newFiles];
        setPreviews(allFiles);
        onFilesSelect(allFiles);
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onFilesSelect(updatedPreviews);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="floor-plan">Planta(s) Baixa(s) (Pelo menos uma é obrigatória)</Label>
      <div className="flex items-center gap-2">
        <Input id="floor-plan" type="file" accept="image/*" onChange={handleFileChange} multiple className="file:text-primary file:font-semibold" />
      </div>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previews.map((src, index) => (
            <div key={index} className="relative group">
              <Image src={src} alt={`Pré-visualização da planta ${index + 1}`} width={100} height={75} className="rounded-md object-contain border p-1" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
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
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Informações Essenciais e Padrões</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Projeto (Obrigatório)</Label>
                      <Input id="name" value={newProject.name} onChange={handleInputChange} placeholder="Ex: Edifício Central" />
                    </div>
                    <div className="space-y-2">
                      <Label>Plantas Baixas (Opcional)</Label>
                      <p className="text-xs text-muted-foreground">Você pode adicionar plantas baixas aqui ou depois na aba "Mapa"</p>
                      <FileUpload onFilesSelect={handleFilesSelect} />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="dispositivoDeAncoragemPadrao">Dispositivo de Ancoragem Padrão</Label>
                      <Input id="dispositivoDeAncoragemPadrao" value={newProject.dispositivoDeAncoragemPadrao} onChange={handleInputChange} placeholder="Ex: Placa de Ancoragem Inox" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cargaDeTestePadrao">Carga de Teste Padrão (kgf)</Label>
                        <Input id="cargaDeTestePadrao" value={newProject.cargaDeTestePadrao} onChange={handleInputChange} placeholder="Ex: 1500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tempoDeTestePadrao">Tempo de Teste Padrão (min)</Label>
                        <Input id="tempoDeTestePadrao" value={newProject.tempoDeTestePadrao} onChange={handleInputChange} placeholder="Ex: 3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engenheiroResponsavelPadrao">Engenheiro Responsável Padrão</Label>
                      <Input id="engenheiroResponsavelPadrao" value={newProject.engenheiroResponsavelPadrao} onChange={handleInputChange} placeholder="Ex: Nome do Engenheiro" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Detalhes da Obra</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="obraAddress">Endereço da Obra</Label>
                      <Input id="obraAddress" value={newProject.obraAddress} onChange={handleInputChange} placeholder="Rua, nº, Bairro, Cidade - Estado" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="obraCEP">CEP da Obra</Label>
                        <Input id="obraCEP" value={newProject.obraCEP} onChange={handleInputChange} placeholder="00000-000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="obraCNPJ">CNPJ da Obra/Cliente</Label>
                        <Input id="obraCNPJ" value={newProject.obraCNPJ} onChange={handleInputChange} placeholder="00.000.000/0001-00" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Dados do Contratado</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contratanteName">Empresa Executora</Label>
                      <Input id="contratanteName" value={newProject.contratanteName} onChange={handleInputChange} placeholder="Nome da empresa ou pessoa física" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjContratado">CNPJ do Contratado</Label>
                      <Input id="cnpjContratado" value={newProject.cnpjContratado} onChange={handleInputChange} placeholder="00.000.000/0001-00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato</Label>
                      <Input id="contato" value={newProject.contato} onChange={handleInputChange} placeholder="(XX) 9XXXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contratanteAddress">Endereço do Contratante</Label>
                      <Input id="contratanteAddress" value={newProject.contratanteAddress} onChange={handleInputChange} placeholder="Rua, nº, Bairro, Cidade - Estado" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contratanteCEP">CEP do Contratante</Label>
                        <Input id="contratanteCEP" value={newProject.contratanteCEP} onChange={handleInputChange} placeholder="00000-000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valorContrato">Valor do Contrato (R$)</Label>
                        <Input id="valorContrato" value={newProject.valorContrato} onChange={handleInputChange} placeholder="Ex: 14820,00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataInicio">Data de Início</Label>
                        <Input id="dataInicio" type="date" value={newProject.dataInicio} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataTermino">Data de Término</Label>
                        <Input id="dataTermino" type="date" value={newProject.dataTermino} onChange={handleInputChange} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Responsável Técnico</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsavelTecnico">Nome do Responsável Técnico</Label>
                      <Input id="responsavelTecnico" value={newProject.responsavelTecnico} onChange={handleInputChange} placeholder="Ex: Lucas Bonissoni" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registroCREA">Registro CREA</Label>
                        <Input id="registroCREA" value={newProject.registroCREA} onChange={handleInputChange} placeholder="Ex: 148740-0-SC" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tituloProfissional">Título Profissional</Label>
                        <Input id="tituloProfissional" value={newProject.tituloProfissional} onChange={handleInputChange} placeholder="Ex: Engenheiro Civil" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numeroART">Número da ART</Label>
                        <Input id="numeroART" value={newProject.numeroART} onChange={handleInputChange} placeholder="Número do protocolo" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rnp">RNP</Label>
                        <Input id="rnp" value={newProject.rnp} onChange={handleInputChange} placeholder="Ex: 2516534876" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="escala">
                  <AccordionTrigger>Configurações de Escala (DWG)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure a escala para usar medidas reais na ferramenta de linha. Deixe em branco para usar apenas distribuição visual.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="scalePixelsPerMeter">Pixels por Metro</Label>
                      <Input
                        id="scalePixelsPerMeter"
                        type="number"
                        step="0.1"
                        value={newProject.scalePixelsPerMeter}
                        onChange={handleInputChange}
                        placeholder="Ex: 50.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dwgRealWidth">Largura Real (metros)</Label>
                        <Input
                          id="dwgRealWidth"
                          type="number"
                          step="0.1"
                          value={newProject.dwgRealWidth}
                          onChange={handleInputChange}
                          placeholder="Ex: 25.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dwgRealHeight">Altura Real (metros)</Label>
                        <Input
                          id="dwgRealHeight"
                          type="number"
                          step="0.1"
                          value={newProject.dwgRealHeight}
                          onChange={handleInputChange}
                          placeholder="Ex: 15.2"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors group`}
                  >
                    <div className="flex items-center gap-3 flex-grow cursor-pointer" onClick={() => handleSelectProject(project)}>
                      <div className={`p-1 rounded-md transition-colors ${currentProject?.id === project.id ? 'bg-primary/20' : 'group-hover:bg-muted'}`}>
                        <Image src={project.floorPlanImages?.[0] || 'https://placehold.co/80x60.png'} alt={`Planta de ${project.name}`} width={60} height={45} className="rounded-sm object-cover bg-muted" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium transition-colors ${currentProject?.id === project.id ? 'text-primary' : ''}`}>{project.name}</span>
                          {/* Show badge for team_admin and technician to distinguish own vs assigned projects */}
                          {(currentUser?.role === 'team_admin' || currentUser?.role === 'technician') && (
                            <Badge
                              variant={project.companyId === currentUser.companyId ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {project.companyId === currentUser.companyId ? 'Próprio' : 'Atribuído'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span>{projectPointCounts[project.id]?.active || 0} pontos ativos</span>
                          {(currentUser?.role === 'superadmin' || currentUser?.role === 'company_admin' || currentUser?.role === 'team_admin') && projectPointCounts[project.id]?.archived > 0 &&
                            <span className="ml-2 text-yellow-600">{projectPointCounts[project.id]?.archived} arquivados</span>
                          }
                        </div>
                      </div>
                    </div>
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'company_admin' || currentUser?.role === 'team_admin') && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPublicSettingsProject({ id: project.id, name: project.name })}
                          title="Configurar Acesso Público"
                        >
                          <Globe className="h-4 w-4 text-violet-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso marcará o projeto como excluído e ocultará todos os seus pontos e testes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
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
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Informações Essenciais e Padrões</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Projeto (Obrigatório)</Label>
                      <Input
                        id="name"
                        value={editingProject.name || ''}
                        onChange={handleEditInputChange}
                        placeholder="Ex: Edifício Central"
                      />
                    </div>
                    <FileUpload
                      onFilesSelect={handleEditFilesSelect}
                      initialFiles={editingProject.floorPlanImages || []}
                    />
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="dispositivoDeAncoragemPadrao">Dispositivo de Ancoragem Padrão</Label>
                      <Input
                        id="dispositivoDeAncoragemPadrao"
                        value={editingProject.dispositivoDeAncoragemPadrao || ''}
                        onChange={handleEditInputChange}
                        placeholder="Ex: Placa de Ancoragem Inox"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cargaDeTestePadrao">Carga de Teste Padrão (kgf)</Label>
                        <Input
                          id="cargaDeTestePadrao"
                          value={editingProject.cargaDeTestePadrao || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 1500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tempoDeTestePadrao">Tempo de Teste Padrão (min)</Label>
                        <Input
                          id="tempoDeTestePadrao"
                          value={editingProject.tempoDeTestePadrao || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engenheiroResponsavelPadrao">Engenheiro Responsável Padrão</Label>
                      <Input
                        id="engenheiroResponsavelPadrao"
                        value={editingProject.engenheiroResponsavelPadrao || ''}
                        onChange={handleEditInputChange}
                        placeholder="Ex: Nome do Engenheiro"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Detalhes da Obra</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="obraAddress">Endereço da Obra</Label>
                      <Input
                        id="obraAddress"
                        value={editingProject.obraAddress || ''}
                        onChange={handleEditInputChange}
                        placeholder="Rua, nº, Bairro, Cidade - Estado"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="obraCEP">CEP da Obra</Label>
                        <Input
                          id="obraCEP"
                          value={editingProject.obraCEP || ''}
                          onChange={handleEditInputChange}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="obraCNPJ">CNPJ da Obra/Cliente</Label>
                        <Input
                          id="obraCNPJ"
                          value={editingProject.obraCNPJ || ''}
                          onChange={handleEditInputChange}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Dados do Contratado</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contratanteName">Empresa Executora</Label>
                      <Input
                        id="contratanteName"
                        value={editingProject.contratanteName || ''}
                        onChange={handleEditInputChange}
                        placeholder="Nome da empresa ou pessoa física"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjContratado">CNPJ do Contratado</Label>
                      <Input
                        id="cnpjContratado"
                        value={editingProject.cnpjContratado || ''}
                        onChange={handleEditInputChange}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato</Label>
                      <Input
                        id="contato"
                        value={editingProject.contato || ''}
                        onChange={handleEditInputChange}
                        placeholder="(XX) 9XXXX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contratanteAddress">Endereço do Contratante</Label>
                      <Input
                        id="contratanteAddress"
                        value={editingProject.contratanteAddress || ''}
                        onChange={handleEditInputChange}
                        placeholder="Rua, nº, Bairro, Cidade - Estado"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contratanteCEP">CEP do Contratante</Label>
                        <Input
                          id="contratanteCEP"
                          value={editingProject.contratanteCEP || ''}
                          onChange={handleEditInputChange}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valorContrato">Valor do Contrato (R$)</Label>
                        <Input
                          id="valorContrato"
                          value={editingProject.valorContrato || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 14820,00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataInicio">Data de Início</Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={editingProject.dataInicio || ''}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataTermino">Data de Término</Label>
                        <Input
                          id="dataTermino"
                          type="date"
                          value={editingProject.dataTermino || ''}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Responsável Técnico</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsavelTecnico">Nome do Responsável Técnico</Label>
                      <Input
                        id="responsavelTecnico"
                        value={editingProject.responsavelTecnico || ''}
                        onChange={handleEditInputChange}
                        placeholder="Ex: Lucas Bonissoni"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registroCREA">Registro CREA</Label>
                        <Input
                          id="registroCREA"
                          value={editingProject.registroCREA || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 148740-0-SC"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tituloProfissional">Título Profissional</Label>
                        <Input
                          id="tituloProfissional"
                          value={editingProject.tituloProfissional || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: Engenheiro Civil"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numeroART">Número da ART</Label>
                        <Input
                          id="numeroART"
                          value={editingProject.numeroART || ''}
                          onChange={handleEditInputChange}
                          placeholder="Número do protocolo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rnp">RNP</Label>
                        <Input
                          id="rnp"
                          value={editingProject.rnp || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 2516534876"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="escala">
                  <AccordionTrigger>Configurações de Escala (DWG)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure a escala para usar medidas reais na ferramenta de linha. Deixe em branco para usar apenas distribuição visual.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="scalePixelsPerMeter">Pixels por Metro</Label>
                      <Input
                        id="scalePixelsPerMeter"
                        type="number"
                        step="0.1"
                        value={editingProject.scalePixelsPerMeter || ''}
                        onChange={handleEditInputChange}
                        placeholder="Ex: 50.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dwgRealWidth">Largura Real (metros)</Label>
                        <Input
                          id="dwgRealWidth"
                          type="number"
                          step="0.1"
                          value={editingProject.dwgRealWidth || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 25.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dwgRealHeight">Altura Real (metros)</Label>
                        <Input
                          id="dwgRealHeight"
                          type="number"
                          step="0.1"
                          value={editingProject.dwgRealHeight || ''}
                          onChange={handleEditInputChange}
                          placeholder="Ex: 15.2"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
