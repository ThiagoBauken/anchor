
"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOfflineData } from "@/context/OfflineDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea-shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CameraCapture } from "./camera-capture";
import CameraCaptureCapacitor from "./camera-capture-capacitor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { AnchorPoint } from "@/types";
import { isCapacitorAvailable } from "@/lib/gallery-photo-service";

const pointSchema = z.object({
  numeroPonto: z.string().min(1, "Número do ponto é obrigatório."),
  localizacao: z.string().min(1, "Localização é obrigatória."),
  numeroLacre: z.string().optional(),
  tipoEquipamento: z.string().optional(),
  dataInstalacao: z.date().optional(),
  frequenciaInspecaoMeses: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  foto: z.string().optional(),
  posicaoX: z.coerce.number().default(0),
  posicaoY: z.coerce.number().default(0),
});

type PointFormData = z.infer<typeof pointSchema>;

interface PointFormProps {
    pointToEdit?: AnchorPoint;
    initialX?: number;
    initialY?: number;
    onPointAdded?: () => void;
    onPointEdited?: () => void;
}

export function PointForm({ pointToEdit, initialX = 0, initialY = 0, onPointAdded, onPointEdited }: PointFormProps) {
  const { 
    createPoint, updatePoint, currentProject, points, locations,
    currentUser, lastSelectedLocation, lastInstallationDate,
    setLastSelectedLocation, setLastInstallationDate
  } = useOfflineData();
  const { toast } = useToast();
  
  const isEditMode = !!pointToEdit;
  const [currentLocation, setCurrentLocation] = useState(
    lastSelectedLocation || (locations.length > 0 ? locations[0].name : '')
  );

  const getNextPointNumber = (localizacao?: string) => {
    if (!points || points.length === 0) return "1";
    
    // Se uma localização específica for fornecida, use ela; senão use a última selecionada
    const targetLocation = localizacao || currentLocation || lastSelectedLocation || (locations.length > 0 ? locations[0].name : '');
    
    console.log('🔍 getNextPointNumber chamado:', {
      localizacao,
      currentLocation,
      targetLocation,
      totalPoints: points.length,
      currentProjectId: currentProject?.id
    });
    
    // Filtrar pontos pela localização e projeto atual
    const pointsInLocation = points.filter(p => 
      p.localizacao === targetLocation && 
      p.projectId === currentProject?.id
    );
    
    console.log('📍 Pontos na localização:', {
      targetLocation,
      pointsInLocation: pointsInLocation.map(p => ({ numero: p.numeroPonto, localizacao: p.localizacao }))
    });
    
    if (pointsInLocation.length === 0) return "1";
    
    // Encontrar o maior número na localização específica
    const numbers = pointsInLocation.map(p => parseInt(p.numeroPonto, 10) || 0);
    const highestPointNumber = Math.max(0, ...numbers);
    const nextNumber = (highestPointNumber + 1).toString();
    
    console.log('📊 Números encontrados:', {
      numbers,
      highestPointNumber,
      nextNumber
    });
    
    return nextNumber;
  };

  const { register, handleSubmit, reset, setValue, setError, control, watch, formState: { errors } } = useForm<PointFormData>({
    resolver: zodResolver(pointSchema),
    defaultValues: isEditMode ? {
        numeroPonto: pointToEdit.numeroPonto,
        localizacao: pointToEdit.localizacao,
        numeroLacre: pointToEdit.numeroLacre,
        tipoEquipamento: pointToEdit.tipoEquipamento,
        dataInstalacao: pointToEdit.dataInstalacao ? new Date(pointToEdit.dataInstalacao) : undefined,
        frequenciaInspecaoMeses: pointToEdit.frequenciaInspecaoMeses || 12,
        observacoes: pointToEdit.observacoes,
        foto: pointToEdit.foto,
        posicaoX: pointToEdit.posicaoX,
        posicaoY: pointToEdit.posicaoY,
    } : {
        numeroPonto: getNextPointNumber(lastSelectedLocation || (locations.length > 0 ? locations[0].name : '')),
        posicaoX: initialX,
        posicaoY: initialY,
        dataInstalacao: lastInstallationDate || new Date(),
        localizacao: lastSelectedLocation || (locations.length > 0 ? locations[0].name : ''),
        numeroLacre: '',
        tipoEquipamento: currentProject?.dispositivoDeAncoragemPadrao || '',
        frequenciaInspecaoMeses: 12,
        observacoes: '',
        foto: '',
    }
  });

  useEffect(() => {
      if (!isEditMode) {
        setValue('posicaoX', initialX);
        setValue('posicaoY', initialY);
      }
  }, [initialX, initialY, setValue, isEditMode]);
  
  useEffect(() => {
    if (!isEditMode && currentProject) {
        setValue('tipoEquipamento', currentProject.dispositivoDeAncoragemPadrao || '');
    }
  }, [currentProject, isEditMode, setValue]);

  // Atualizar número do ponto quando a localização mudar
  useEffect(() => {
    if (!isEditMode) {
      const nextNumber = getNextPointNumber(currentLocation);
      console.log('🔄 useEffect atualizando número do ponto:', { currentLocation, nextNumber });
      setValue('numeroPonto', nextNumber);
    }
  }, [currentLocation, points, currentProject, isEditMode, setValue, getNextPointNumber]);

  // Sincronizar currentLocation quando o formulário for inicializado
  useEffect(() => {
    if (!isEditMode) {
      const initialLocation = lastSelectedLocation || (locations.length > 0 ? locations[0].name : '');
      if (initialLocation && initialLocation !== currentLocation) {
        console.log('🏁 Sincronizando localização inicial:', { initialLocation, currentLocation });
        setCurrentLocation(initialLocation);
      }
    }
  }, [lastSelectedLocation, locations, isEditMode, currentLocation]);
  


  const onSubmit: SubmitHandler<PointFormData> = (data) => {
    if (!currentProject) {
      toast({ title: "Erro", description: "Nenhum projeto selecionado.", variant: "destructive" });
      return;
    }

    const isDuplicate = points.some(point => 
      point.numeroPonto === data.numeroPonto && 
      point.localizacao === data.localizacao &&
      point.projectId === currentProject.id &&
      (!isEditMode || point.id !== pointToEdit.id)
    );

    if (isDuplicate) {
      setError("numeroPonto", { type: "manual", message: "Este número de ponto já existe nesta localização." });
      toast({ title: "Erro", description: "Este número de ponto já existe nesta localização.", variant: "destructive" });
      return;
    }
    
    const pointData = {
        ...data,
        frequenciaInspecaoMeses: data.frequenciaInspecaoMeses || undefined,
        dataInstalacao: data.dataInstalacao ? data.dataInstalacao.toISOString().split('T')[0] : undefined,
    };

    if (isEditMode) {
        updatePoint({
            ...pointToEdit,
            ...pointData,
            lastModifiedByUserId: currentUser?.id
        });
        toast({
            title: "Sucesso!",
            description: "Ponto de ancoragem atualizado com sucesso.",
            variant: 'default',
        });
        if (onPointEdited) onPointEdited();
    } else {
        createPoint({
            ...pointData,
            projectId: currentProject.id,
            createdByUserId: currentUser?.id,
            status: 'Não Testado',
        } as any);
        
        toast({
          title: "Sucesso!",
          description: "Ponto de ancoragem cadastrado com sucesso.",
          variant: 'default',
        });
        
        // Save current selection for next point
        setLastSelectedLocation(data.localizacao);
        setCurrentLocation(data.localizacao); // Atualizar estado local também
        if (data.dataInstalacao) {
            setLastInstallationDate(data.dataInstalacao);
        }
        
        // Reset form for next point, keeping some fields
        reset({
            posicaoX: 0,
            posicaoY: 0,
            numeroPonto: getNextPointNumber(data.localizacao), // Usar localização atual
            localizacao: data.localizacao, // Keep last location
            numeroLacre: '', // Clear lacre for next point
            tipoEquipamento: currentProject?.dispositivoDeAncoragemPadrao || '',
            frequenciaInspecaoMeses: 12, // Keep default frequency
            dataInstalacao: data.dataInstalacao, // Keep last date
            observacoes: '', // Clear observations
            foto: '' // Clear photo
        });

        if (onPointAdded) {
            onPointAdded();
        }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="numeroPonto">Número do Ponto</Label>
            <Input id="numeroPonto" {...register("numeroPonto")} />
            {errors.numeroPonto && <p className="text-sm text-destructive">{errors.numeroPonto.message}</p>}
        </div>
        <div className="space-y-2">
            <Label>Localização</Label>
            <Controller
                control={control}
                name="localizacao"
                render={({ field }) => (
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        setCurrentLocation(value); // Atualizar estado local
                        if (!isEditMode) {
                            setLastSelectedLocation(value); // Save for next point
                        }
                    }} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a localização..." />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.length > 0 ? (
                            locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-location" disabled>Nenhuma localização criada</SelectItem>
                        )}
                    </SelectContent>
                    </Select>
                )}
            />
            {errors.localizacao && <p className="text-sm text-destructive">{errors.localizacao.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="numeroLacre">Número do Lacre (Opcional)</Label>
            <Input id="numeroLacre" {...register("numeroLacre")} placeholder="Ex: LAC001"/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="tipoEquipamento">Tipo de Equipamento (Opcional)</Label>
            <Input id="tipoEquipamento" {...register("tipoEquipamento")} placeholder="Ex: Placa de Ancoragem"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Instalação (Opcional)</Label>
           <Controller
                control={control}
                name="dataInstalacao"
                render={({ field }) => (
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                field.onChange(date); // Update form state immediately
                                if (!isEditMode && date) {
                                  setLastInstallationDate(date); // Update context state for next point
                                }
                            }}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                )}
            />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequenciaInspecaoMeses">Freq. Inspeção em Meses (Opcional)</Label>
          <Input id="frequenciaInspecaoMeses" type="number" {...register("frequenciaInspecaoMeses")} placeholder="Padrão: 12"/>
        </div>
      </div>
      
       <div className="space-y-2">
        <Label htmlFor="observacoes">Observações (Opcional)</Label>
        <Textarea id="observacoes" {...register("observacoes")} />
      </div>

      <div className="space-y-2">
        <Label>Foto do Ponto (Opcional)</Label>
        <Controller
            control={control}
            name="foto"
            render={({ field: { onChange, value } }) => {
              // Verifica se Capacitor está disponível
              const useNativeCamera = isCapacitorAvailable();

              if (useNativeCamera && currentProject) {
                // Pega valores atuais do formulário
                const numeroPonto = watch('numeroPonto') || 'Novo';
                const localizacao = watch('localizacao') || 'Sem localização';
                const pontoId = pointToEdit?.id || `temp_${Date.now()}`;

                return (
                  <CameraCaptureCapacitor
                    projectId={currentProject.id}
                    projectName={currentProject.name}
                    pontoId={pontoId}
                    pontoNumero={numeroPonto}
                    pontoLocalizacao={localizacao}
                    type="ponto"
                    onPhotoSaved={(metadata) => {
                      // Salva o caminho da foto no formulário
                      onChange(metadata.filePath || metadata.fileName);
                    }}
                    existingPhoto={value}
                  />
                );
              } else {
                // Fallback para captura web
                return <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />;
              }
            }}
        />
       </div>

       <input type="hidden" {...register("posicaoX")} />
       <input type="hidden" {...register("posicaoY")} />

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">💾 {isEditMode ? 'Salvar Alterações' : 'Salvar Ponto'}</Button>
    </form>
  );
}
