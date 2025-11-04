
"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAnchorData } from "@/context/AnchorDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea-shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, TestTubeDiagonal } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CameraCapture } from "./camera-capture";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { AnchorPoint } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  // Point fields
  numeroPonto: z.string().min(1, "Número do ponto é obrigatório."),
  localizacao: z.string().min(1, "Localização é obrigatória."),
  tipoEquipamento: z.string().optional(),
  dataInstalacao: z.date().optional(),
  frequenciaInspecaoMeses: z.coerce.number().optional(),
  observacoesPonto: z.string().optional(),
  fotoPonto: z.string().optional(),
  
  // Test fields (all optional because a test might not be created)
  realizarNovoTeste: z.boolean().default(false),
  resultado: z.enum(["Aprovado", "Reprovado"]).optional(),
  numeroLacre: z.string().optional(),
  carga: z.string().optional(),
  tempo: z.string().optional(),
  tecnico: z.string().optional(),
  fotoTeste: z.string().optional(),
  fotoPronto: z.string().optional(),
  observacoesTeste: z.string().optional(),
}).refine(data => {
    // If a new test is being performed, the result and photo are required
    if (data.realizarNovoTeste) {
        return !!data.resultado && !!data.fotoTeste;
    }
    return true;
}, {
    message: "Resultado e Foto do Teste são obrigatórios ao realizar um novo teste.",
    path: ["realizarNovoTeste"], 
});

type FormValues = z.infer<typeof formSchema>;

interface EditPointAndTestFormProps {
    pointToEdit: AnchorPoint;
    onFormSubmit: () => void;
}

export function EditPointAndTestForm({ pointToEdit, onFormSubmit }: EditPointAndTestFormProps) {
  const { 
      updatePointAndAddOrUpdateTest, 
      currentProject, 
      points, 
      locations,
      getTestsByPointId,
      currentUser
  } = useAnchorData();
  const { toast } = useToast();

  const latestTest = useMemo(() => getTestsByPointId(pointToEdit.id)[0], [getTestsByPointId, pointToEdit.id]);

  const { register, handleSubmit, reset, setValue, setError, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        // Point data
        numeroPonto: pointToEdit.numeroPonto,
        localizacao: pointToEdit.localizacao,
        tipoEquipamento: pointToEdit.tipoEquipamento || '',
        dataInstalacao: pointToEdit.dataInstalacao ? new Date(pointToEdit.dataInstalacao) : undefined,
        frequenciaInspecaoMeses: pointToEdit.frequenciaInspecaoMeses,
        observacoesPonto: pointToEdit.observacoes || '',
        fotoPonto: pointToEdit.foto || '',
        
        // Default test data - pre-filled but only submitted if "realizarNovoTeste" is true
        realizarNovoTeste: false,
        resultado: 'Aprovado',
        numeroLacre: pointToEdit.numeroLacre || '',
        carga: latestTest?.carga || currentProject?.cargaDeTestePadrao || '',
        tempo: latestTest?.tempo || currentProject?.tempoDeTestePadrao || '',
        tecnico: latestTest?.tecnico || currentProject?.engenheiroResponsavelPadrao || currentUser?.name || '',
        observacoesTeste: '',
        fotoTeste: '',
        fotoPronto: latestTest?.fotoPronto || '',
    }
  });
  
  const realizarNovoTeste = watch("realizarNovoTeste");

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!currentProject) {
      toast({ title: "Erro", description: "Nenhum projeto selecionado.", variant: "destructive" });
      return;
    }

    const isDuplicate = points.some(point => 
      point.numeroPonto === data.numeroPonto && 
      point.localizacao === data.localizacao &&
      point.projectId === currentProject.id &&
      point.id !== pointToEdit.id
    );

    if (isDuplicate) {
      setError("numeroPonto", { type: "manual", message: "Este número de ponto já existe nesta localização." });
      toast({ title: "Erro", description: "Este número de ponto já existe nesta localização.", variant: "destructive" });
      return;
    }
    
    const pointData = {
        numeroPonto: data.numeroPonto,
        localizacao: data.localizacao,
        tipoEquipamento: data.tipoEquipamento,
        foto: data.fotoPonto,
        numeroLacre: data.numeroLacre,
        observacoes: data.observacoesPonto,
        frequenciaInspecaoMeses: data.frequenciaInspecaoMeses,
        dataInstalacao: data.dataInstalacao ? data.dataInstalacao.toISOString().split('T')[0] : undefined,
    };
    
    let testData;
    if (data.realizarNovoTeste && data.resultado && data.fotoTeste) {
        testData = {
            resultado: data.resultado,
            carga: data.carga || '',
            tempo: data.tempo || '',
            tecnico: data.tecnico || '',
            observacoes: data.observacoesTeste,
            fotoTeste: data.fotoTeste,
            fotoPronto: data.fotoPronto,
        };
    }
    
    updatePointAndAddOrUpdateTest(pointToEdit.id, pointData, testData);

    toast({
        title: "Sucesso!",
        description: "Ponto de ancoragem e/ou teste atualizado com sucesso.",
        variant: 'default',
    });
    
    if (onFormSubmit) onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-4">
       <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Informações do Ponto</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
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
                                {locations.map(loc => (<SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>))}
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
                   <Controller name="dataInstalacao" control={control} render={({ field }) => (
                         <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                    )}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequenciaInspecaoMeses">Freq. Inspeção em Meses (Opcional)</Label>
                  <Input id="frequenciaInspecaoMeses" type="number" {...register("frequenciaInspecaoMeses")} placeholder="Padrão: 12"/>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="observacoesPonto">Observações do Ponto (Opcional)</Label>
                <Textarea id="observacoesPonto" {...register("observacoesPonto")} />
              </div>
              <div className="space-y-2">
                <Label>Foto do Ponto (Opcional)</Label>
                <Controller control={control} name="fotoPonto" render={({ field: { onChange, value } }) => (<CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />)} />
               </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <TestTubeDiagonal className="h-5 w-5"/>
                    <span>Informações do Teste</span>
                    <Controller control={control} name="realizarNovoTeste" render={({ field }) => (<input type="checkbox" checked={field.value} onChange={field.onChange} onClick={e => e.stopPropagation()} className="ml-4 h-4 w-4"/>)} />
                    <Label htmlFor="realizarNovoTeste" onClick={e => e.stopPropagation()} className="ml-1 font-normal cursor-pointer">Realizar Novo Teste</Label>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 {realizarNovoTeste ? (
                    <>
                       <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label>Resultado</Label>
                            <Controller control={control} name="resultado" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Reprovado">Reprovado</SelectItem></SelectContent></Select>)} />
                            {errors.resultado && <p className="text-sm text-destructive">{errors.resultado.message}</p>}
                          </div>
                         <div className="space-y-2">
                            <Label htmlFor="numeroLacre">Número do Lacre (Opcional)</Label>
                            <Input id="numeroLacre" {...register("numeroLacre")} placeholder="Se aplicável"/>
                          </div>
                        </div>
                      <div className="grid md:grid-cols-3 gap-6">
                         <div className="space-y-2"><Label htmlFor="carga">Carga Aplicada (kgf)</Label><Input id="carga" {...register("carga")} placeholder="Ex: 1500" /></div>
                         <div className="space-y-2"><Label htmlFor="tempo">Tempo de Teste (min)</Label><Input id="tempo" {...register("tempo")} placeholder="Ex: 3" /></div>
                         <div className="space-y-2"><Label htmlFor="tecnico">Técnico Responsável</Label><Input id="tecnico" {...register("tecnico")} /></div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Foto Testando (Obrigatória)</Label>
                            <Controller control={control} name="fotoTeste" render={({ field: { onChange, value } }) => ( <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />)} />
                            {errors.fotoTeste && <p className="text-sm text-destructive">{errors.fotoTeste.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Foto Ponto Pronto (Opcional)</Label>
                            <Controller control={control} name="fotoPronto" render={({ field: { onChange, value } }) => ( <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />)} />
                          </div>
                      </div>
                      <div className="space-y-2"><Label>Observações da Inspeção</Label><Textarea {...register("observacoesTeste")} placeholder="Deformidades, avarias, etc."/></div>
                      {errors.realizarNovoTeste && <p className="text-sm font-semibold text-destructive">{errors.realizarNovoTeste.message}</p>}
                    </>
                 ) : (
                    <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-md">
                        <p>O teste mais recente será mantido.</p>
                        <p className="text-xs">Para adicionar ou substituir um teste, marque a caixa "Realizar Novo Teste" acima.</p>
                    </div>
                 )}
            </AccordionContent>
          </AccordionItem>
       </Accordion>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">💾 Salvar Alterações</Button>
    </form>
  );
}
