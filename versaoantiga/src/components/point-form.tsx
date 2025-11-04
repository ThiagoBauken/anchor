
"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAnchorData } from "@/context/AnchorDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea-shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CameraCapture } from "./camera-capture";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { AnchorPoint } from "@/types";

const pointSchema = z.object({
  numeroPonto: z.string().min(1, "Número do ponto é obrigatório."),
  localizacao: z.string().min(1, "Localização é obrigatória."),
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
  const { addPoint, editPoint, currentProject, points, installationDate, setInstallationDate, locations } = useAnchorData();
  const { toast } = useToast();
  
  const isEditMode = !!pointToEdit;

  const { register, handleSubmit, reset, setValue, setError, control, formState: { errors } } = useForm<PointFormData>({
    resolver: zodResolver(pointSchema),
    defaultValues: isEditMode ? {
        numeroPonto: pointToEdit.numeroPonto,
        localizacao: pointToEdit.localizacao,
        tipoEquipamento: pointToEdit.tipoEquipamento,
        dataInstalacao: pointToEdit.dataInstalacao ? new Date(pointToEdit.dataInstalacao) : undefined,
        frequenciaInspecaoMeses: pointToEdit.frequenciaInspecaoMeses,
        observacoes: pointToEdit.observacoes,
        foto: pointToEdit.foto,
        posicaoX: pointToEdit.posicaoX,
        posicaoY: pointToEdit.posicaoY,
    } : {
        posicaoX: initialX,
        posicaoY: initialY,
        dataInstalacao: installationDate,
        localizacao: locations[0]?.name || '',
    }
  });

  useEffect(() => {
      if (!isEditMode) {
        setValue('posicaoX', initialX);
        setValue('posicaoY', initialY);
      }
  }, [initialX, initialY, setValue, isEditMode]);
  
  useEffect(() => {
      if (!isEditMode) {
        setValue('dataInstalacao', installationDate);
      }
  }, [installationDate, setValue, isEditMode]);


  const onSubmit: SubmitHandler<PointFormData> = (data) => {
    if (!currentProject) {
      toast({ title: "Erro", description: "Nenhum projeto selecionado.", variant: "destructive" });
      return;
    }

    // Check for duplicate point number within the same location for this project
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
        editPoint(pointToEdit.id, pointData);
        toast({
            title: "Sucesso!",
            description: "Ponto de ancoragem atualizado com sucesso.",
            variant: 'default',
        });
        if (onPointEdited) onPointEdited();
    } else {
        addPoint({ ...pointData, projectId: currentProject.id });
        
        toast({
          title: "Sucesso!",
          description: "Ponto de ancoragem cadastrado com sucesso.",
          variant: 'default',
        });
        
        const highestPointNumber = Math.max(0, ...points.map(p => parseInt(p.numeroPonto, 10) || 0));
        const nextPointNumber = (highestPointNumber + 1).toString();

        reset({
            posicaoX: 0,
            posicaoY: 0,
            numeroPonto: nextPointNumber,
            localizacao: data.localizacao, // Keep the last used location
            tipoEquipamento: '',
            frequenciaInspecaoMeses: undefined,
            dataInstalacao: installationDate,
            observacoes: '',
            foto: ''
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
                    <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a localização..." />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.length > 0 ? (
                            locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="" disabled>Nenhuma localização criada</SelectItem>
                        )}
                    </SelectContent>
                    </Select>
                )}
            />
            {errors.localizacao && <p className="text-sm text-destructive">{errors.localizacao.message}</p>}
        </div>
      </div>

       <div className="space-y-2">
            <Label htmlFor="tipoEquipamento">Tipo de Equipamento (Opcional)</Label>
            <Input id="tipoEquipamento" {...register("tipoEquipamento")} placeholder="Ex: Placa de Ancoragem"/>
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
                                if(date) {
                                  field.onChange(date);
                                  if (!isEditMode) setInstallationDate(date);
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
            render={({ field: { onChange, value } }) => (
                <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />
            )}
        />
       </div>

       <input type="hidden" {...register("posicaoX")} />
       <input type="hidden" {...register("posicaoY")} />

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">💾 {isEditMode ? 'Salvar Alterações' : 'Salvar Ponto'}</Button>
    </form>
  );
}
