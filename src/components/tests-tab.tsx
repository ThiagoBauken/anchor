
"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOfflineData } from "@/context/OfflineDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea-shadcn";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AnchorTestResult } from "@/types";
import { CameraCapture } from "./camera-capture";
import CameraCaptureCapacitor from "./camera-capture-capacitor";
import { isCapacitorAvailable } from "@/lib/gallery-photo-service";
import { Search, MapPin, X, ShieldAlert } from "lucide-react";
import { canPerformTests } from "@/lib/permissions";

const testSchema = z.object({
  pontoId: z.string().min(1, "Selecione um ponto para testar."),
  resultado: z.enum(["Aprovado", "Reprovado"], { required_error: "Resultado é obrigatório." }),
  fotoTeste: z.string().min(1, "A foto do teste é obrigatória."),
  fotoPronto: z.string().optional(),
  observacoes: z.string().optional(),
  numeroLacre: z.string().optional(),
  carga: z.string().optional(),
  tempo: z.string().optional(),
  tecnico: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

export function TestsTab() {
  const { points, updatePointsAndAddTest, currentUser, currentProject, testPointId, setTestPointId, getPointById, locations } = useOfflineData();
  const { toast } = useToast();

  // Permission check - Technicians and above can perform tests
  const userCanPerformTests = currentUser ? canPerformTests({ user: currentUser }) : false;

  // Show access denied if user doesn't have permission
  if (!currentUser) {
    return (
      <Card className="mt-4 bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Autenticação Necessária
          </CardTitle>
          <CardDescription>
            Você precisa estar logado para realizar testes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!userCanPerformTests) {
    return (
      <Card className="mt-4 bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
          <CardDescription>
            Você não tem permissão para realizar testes. Apenas técnicos, team admins, company admins e superadmins podem realizar testes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      pontoId: testPointId || '',
      resultado: 'Aprovado',
      carga: currentProject?.cargaDeTestePadrao || '',
      tempo: currentProject?.tempoDeTestePadrao || '',
      tecnico: currentProject?.engenheiroResponsavelPadrao || currentUser?.name || '',
    }
  });

  const selectedPointId = watch('pontoId');
  
  // A point can be re-tested, so we show all non-archived points with search and location filter
  const availablePointsToTest = useMemo(() => {
    let filteredPoints = points.filter(p => !p.archived);
    
    // Apply location filter
    if (locationFilter && locationFilter !== 'all') {
      filteredPoints = filteredPoints.filter(point => point.localizacao === locationFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filteredPoints = filteredPoints.filter(point => 
        point.numeroPonto.toLowerCase().includes(lowercasedQuery) ||
        (point.numeroLacre && point.numeroLacre.toLowerCase().includes(lowercasedQuery)) ||
        (point.tipoEquipamento && point.tipoEquipamento.toLowerCase().includes(lowercasedQuery)) ||
        (point.localizacao && point.localizacao.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // Sort numerically by numeroPonto
    return filteredPoints.sort((a, b) => {
      const numA = parseInt(a.numeroPonto.replace(/\D/g,''), 10) || 0;
      const numB = parseInt(b.numeroPonto.replace(/\D/g,''), 10) || 0;
      return numA - numB;
    });
  }, [points, searchQuery, locationFilter]);
  
  const pointBeingTested = useMemo(() => {
      if(selectedPointId) return getPointById(selectedPointId);
      return null;
  }, [selectedPointId, getPointById])

  // Pre-fill form if navigating from another tab
  useEffect(() => {
    if (testPointId && availablePointsToTest.length > 0) {
        const pointExists = availablePointsToTest.some(p => p.id === testPointId);
        
        if (pointExists) {
            setValue('pontoId', testPointId);
            
            // Verificar se realmente foi setado
            setTimeout(() => {
                const currentValue = watch('pontoId');
                if (currentValue === testPointId) {
                    setTestPointId(null);
                } else {
                    setValue('pontoId', testPointId, { shouldValidate: true });
                }
            }, 200);
        } else {
            setTestPointId(null);
        }
    }
  }, [testPointId, setValue, setTestPointId, availablePointsToTest, watch]);

  // Update technician name if current user changes or project changes
  useEffect(() => {
     setValue('tecnico', currentProject?.engenheiroResponsavelPadrao || currentUser?.name || '');
     setValue('carga', currentProject?.cargaDeTestePadrao || '');
     setValue('tempo', currentProject?.tempoDeTestePadrao || '');
  }, [currentUser, currentProject, setValue]);

  const onSubmit: SubmitHandler<TestFormData> = (data) => {
    console.log('[DEBUG] Test form submitted:', { pontoId: data.pontoId, resultado: data.resultado });
    
    if (!currentUser) {
        console.error('[ERROR] onSubmit: No user selected');
        toast({ title: 'Erro', description: 'Nenhum usuário selecionado.', variant: 'destructive'});
        return;
    }
    
    if (!data.pontoId) {
        console.error('[ERROR] onSubmit: No point selected');
        toast({ title: 'Erro', description: 'Selecione um ponto para testar.', variant: 'destructive'});
        return;
    }
    
    if (!data.fotoTeste) {
        console.error('[ERROR] onSubmit: No test photo provided');
        toast({ title: 'Erro', description: 'A foto do teste é obrigatória.', variant: 'destructive'});
        return;
    }
    
    // The data for the test itself
    const testData: Omit<AnchorTestResult, 'id' | 'dataHora' | 'pontoId' | 'createdByUserId'> = {
      resultado: data.resultado,
      observacoes: data.observacoes,
      fotoTeste: data.fotoTeste,
      fotoPronto: data.fotoPronto,
      carga: data.carga || '',
      tempo: data.tempo || '',
      tecnico: data.tecnico || ''
    };

    // The optional update to the point's seal number
    const pointUpdates = {
        numeroLacre: data.numeroLacre,
    };
    
    try {
      updatePointsAndAddTest(data.pontoId, testData, pointUpdates);
      
      toast({
        title: "Sucesso!",
        description: `Teste para o Ponto #${pointBeingTested?.numeroPonto} salvo com sucesso.`,
      });
      console.log('[DEBUG] Test submitted successfully for point:', data.pontoId);
    } catch (error) {
      console.error('[ERROR] Failed to submit test:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar o teste. Tente novamente.',
        variant: 'destructive'
      });
      return;
    }
    
    reset({ 
        pontoId: '', 
        resultado: 'Aprovado', 
        tecnico: currentProject?.engenheiroResponsavelPadrao || currentUser?.name || '',
        carga: currentProject?.cargaDeTestePadrao || '',
        tempo: currentProject?.tempoDeTestePadrao || '',
        numeroLacre: '',
        observacoes: '',
        fotoPronto: '',
        fotoTeste: '',
    });
  };
  
  return (
    <Card className="max-w-4xl mx-auto mt-4 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>🔬 Teste de Ponto de Ancoragem</CardTitle>
        <CardDescription>Selecione um ponto e preencha os detalhes da inspeção.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Section */}
        <div className="p-4 bg-muted/50 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="search-tests">
                <Search className="inline w-4 h-4 mr-2" />
                Pesquisar Pontos
              </Label>
              <Input 
                id="search-tests"
                placeholder="🔎 Pesquisar por nº, lacre, equipamento ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-filter-tests">
                <MapPin className="inline w-4 h-4 mr-2" />
                Filtrar por Localização
              </Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="location-filter-tests">
                  <SelectValue placeholder="Selecione uma localização..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Localizações</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {(searchQuery || locationFilter !== 'all') && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('all');
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-2">
            <Label>Ponto de Ancoragem ({availablePointsToTest.length} pontos disponíveis)</Label>
             <Controller
                control={control}
                name="pontoId"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um ponto..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePointsToTest.length > 0 ? (
                            availablePointsToTest.map(point => (
                                <SelectItem key={point.id} value={point.id}>
                                    Ponto #{point.numeroPonto} - {point.localizacao || 'Sem localização'} 
                                    {point.tipoEquipamento && ` (${point.tipoEquipamento})`}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-points" disabled>
                                {searchQuery || locationFilter !== 'all' 
                                    ? 'Nenhum ponto encontrado com os filtros aplicados' 
                                    : 'Nenhum ponto para testar'
                                }
                            </SelectItem>
                        )}
                    </SelectContent>
                    </Select>
                )}
            />
            {errors.pontoId && <p className="text-sm text-destructive">{errors.pontoId.message}</p>}
          </div>

          {selectedPointId && (
            <div className="space-y-4 pt-4 border-t">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>Resultado</Label>
                    <Controller
                        control={control}
                        name="resultado"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o resultado..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Aprovado">Aprovado</SelectItem>
                                <SelectItem value="Reprovado">Reprovado</SelectItem>
                            </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.resultado && <p className="text-sm text-destructive">{errors.resultado.message}</p>}
                  </div>
                 <div className="space-y-2">
                    <Label htmlFor="numeroLacre">Número do Lacre (Opcional)</Label>
                    <Input id="numeroLacre" {...register("numeroLacre")} placeholder="Se aplicável"/>
                  </div>
                </div>
                
              {/* Informação sobre valores padrão */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ℹ️ Os valores de carga, tempo e técnico são definidos no cadastro do projeto e aplicados automaticamente a todos os testes.
                </p>
              </div>
                
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="carga">Carga Aplicada (kgf) - Padrão do Projeto</Label>
                    <Input 
                      id="carga" 
                      {...register("carga")} 
                      placeholder="Definido no projeto" 
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="tempo">Tempo de Teste (min) - Padrão do Projeto</Label>
                    <Input 
                      id="tempo" 
                      {...register("tempo")} 
                      placeholder="Definido no projeto"
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="tecnico">Técnico Responsável - Padrão do Projeto</Label>
                    <Input 
                      id="tecnico" 
                      {...register("tecnico")}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                 </div>
              </div>


              <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Foto Testando (Obrigatória)</Label>
                    <Controller
                      control={control}
                      name="fotoTeste"
                      render={({ field: { onChange, value } }) => {
                        const useNativeCamera = isCapacitorAvailable();

                        if (useNativeCamera && currentProject && pointBeingTested) {
                          return (
                            <CameraCaptureCapacitor
                              projectId={currentProject.id}
                              projectName={currentProject.name}
                              pontoId={pointBeingTested.id}
                              pontoNumero={pointBeingTested.numeroPonto}
                              pontoLocalizacao={pointBeingTested.localizacao}
                              type="teste"
                              onPhotoSaved={(metadata) => {
                                onChange(metadata.filePath || metadata.fileName);
                              }}
                              existingPhoto={value}
                            />
                          );
                        } else {
                          return <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />;
                        }
                      }}
                    />
                    {errors.fotoTeste && <p className="text-sm text-destructive">{errors.fotoTeste.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Foto Ponto Pronto (Opcional)</Label>
                    <Controller
                      control={control}
                      name="fotoPronto"
                      render={({ field: { onChange, value } }) => {
                        const useNativeCamera = isCapacitorAvailable();

                        if (useNativeCamera && currentProject && pointBeingTested) {
                          return (
                            <CameraCaptureCapacitor
                              projectId={currentProject.id}
                              projectName={currentProject.name}
                              pontoId={pointBeingTested.id}
                              pontoNumero={pointBeingTested.numeroPonto}
                              pontoLocalizacao={pointBeingTested.localizacao}
                              type="teste-final"
                              onPhotoSaved={(metadata) => {
                                onChange(metadata.filePath || metadata.fileName);
                              }}
                              existingPhoto={value}
                            />
                          );
                        } else {
                          return <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />;
                        }
                      }}
                    />
                  </div>
              </div>
              
              <div className="space-y-2">
                  <Label>Observações da Inspeção</Label>
                  <Textarea {...register("observacoes")} placeholder="Deformidades, avarias, etc."/>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  💾 Salvar Teste do Ponto #{pointBeingTested?.numeroPonto}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
