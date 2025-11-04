
"use client";

import { useState, useMemo } from 'react';
import { useAnchorData } from '@/context/AnchorDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderPlus, Trash2, X, PlusCircle, Tag, Circle, Square, Plus, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import type { MarkerShape } from '@/types';


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

function LocationManager() {
    const { locations, addLocation, deleteLocation, updateLocationShape, points } = useAnchorData();
    const [newLocation, setNewLocation] = useState('');
    const { toast } = useToast();

    const handleAddLocation = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLocation.trim() && !locations.some(l => l.name === newLocation.trim())) {
            addLocation(newLocation.trim());
            setNewLocation('');
            toast({ title: 'Localização Adicionada' });
        } else if (locations.some(l => l.name === newLocation.trim())) {
            toast({ title: 'Localização já existe', variant: 'destructive' });
        }
    };

    const handleDeleteLocation = (locationId: string) => {
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
        deleteLocation(locationId);
        toast({ title: 'Localização Removida' });
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
                            <RadioGroup value={loc.markerShape} onValueChange={(v) => updateLocationShape(loc.id, v as MarkerShape)} className="flex items-center gap-4 pt-1">
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
  const { projects, addProject, deleteProject, setCurrentProject, currentProject, currentUser, allPointsForProject } = useAnchorData();
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
      rnp: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewProject(prev => ({ ...prev, [id]: value }));
  };

  const handleFilesSelect = (base64Files: string[]) => {
    setNewProject(prev => ({ ...prev, floorPlanImages: base64Files }));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || newProject.floorPlanImages.length === 0) {
      setFormError('O Nome do Projeto e pelo menos uma Planta Baixa são obrigatórios.');
      return;
    }
    
    addProject(newProject);

    toast({
      title: 'Projeto Adicionado',
      description: `O projeto ${newProject.name.trim()} foi criado com sucesso.`,
    });
    
    // Reset form
    setNewProject({
        name: '', floorPlanImages: [], obraAddress: '', obraCEP: '', obraCNPJ: '',
        contratanteName: '', contratanteAddress: '', contratanteCEP: '', valorContrato: '',
        dataInicio: '', dataTermino: '', responsavelTecnico: '', registroCREA: '',
        tituloProfissional: '', numeroART: '', rnp: '', cnpjContratado: '', contato: ''
    });
    setFormError(null);
    const fileInput = document.getElementById('floor-plan') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
    toast({ title: 'Projeto Selecionado', description: `Visualizando ${project.name}`});
  }
  
  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    toast({ title: 'Projeto Excluído', description: 'O projeto e todos os seus dados foram removidos.' });
  }

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

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-4">
      <div className="space-y-6">
          <Card className="bg-card/90 backdrop-blur-sm self-start">
            <CardHeader>
              <CardTitle>Adicionar Novo Projeto</CardTitle>
              <CardDescription>Crie um novo projeto e preencha os detalhes para o relatório técnico.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProject} className="space-y-4">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Informações Essenciais</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Projeto (Obrigatório)</Label>
                        <Input id="name" value={newProject.name} onChange={handleInputChange} placeholder="Ex: Edifício Central" />
                      </div>
                      <FileUpload onFilesSelect={handleFilesSelect} />
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
                </Accordion>
                
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" className="w-full mt-4">
                  <FolderPlus className="mr-2 h-4 w-4" /> Criar Projeto
                </Button>
              </form>
            </CardContent>
          </Card>
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
                            <Image src={project.floorPlanImages[0] || 'https://placehold.co/80x60.png'} alt={`Planta de ${project.name}`} width={60} height={45} className="rounded-sm object-cover bg-muted"/>
                         </div>
                         <div>
                            <span className={`font-medium transition-colors ${currentProject?.id === project.id ? 'text-primary' : ''}`}>{project.name}</span>
                            <div className="text-xs text-muted-foreground">
                                <span>{projectPointCounts[project.id]?.active || 0} pontos ativos</span>
                                {currentUser?.role === 'admin' && projectPointCounts[project.id]?.archived > 0 && 
                                    <span className="ml-2 text-yellow-600">{projectPointCounts[project.id]?.archived} arquivados</span>
                                }
                            </div>
                         </div>
                      </div>
                      {currentUser?.role === 'admin' && (
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive"/>
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
    </div>
  );
}
