
"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAnchorData } from "@/context/AnchorDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea-shadcn";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AnchorPoint, AnchorTestResult } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CameraCapture } from "./camera-capture";

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

function PointSelector({ points, value, onChange, disabled }: { points: AnchorPoint[], value: string, onChange: (value: string) => void, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedPoint = useMemo(() => points.find(p => p.id === value), [points, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled}>
          {selectedPoint ? `Ponto #${selectedPoint.numeroPonto}` : "Selecione um ponto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar ponto..." />
          <CommandList>
            <CommandEmpty>Nenhum ponto para testar.</CommandEmpty>
            <CommandGroup>
              {points.map((point) => (
                <CommandItem key={point.id} value={point.numeroPonto} onSelect={() => { onChange(point.id); setOpen(false); }} className="cursor-pointer">
                  <Check className={cn("mr-2 h-4 w-4", value === point.id ? "opacity-100" : "opacity-0")} />
                  Ponto #{point.numeroPonto}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function TestsTab() {
  const { points, updatePointsAndAddTest, currentUser, testPointId, setTestPointId, getPointById } = useAnchorData();
  const { toast } = useToast();
  
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      pontoId: '',
      resultado: 'Aprovado',
    }
  });

  const selectedPointId = watch('pontoId');

  const availablePointsToTest = useMemo(() => {
    // A point can be re-tested, so we show all non-archived points
    return points.filter(p => !p.archived);
  }, [points]);
  
  const pointBeingTested = useMemo(() => {
      if(selectedPointId) return getPointById(selectedPointId);
      return null;
  }, [selectedPointId, getPointById])

  // Pre-fill form if navigating from another tab
  useEffect(() => {
    if (testPointId) {
        const pointExists = availablePointsToTest.some(p => p.id === testPointId);
        if (pointExists) {
            setValue('pontoId', testPointId);
        }
        setTestPointId(null); // Reset context state
    }
  }, [testPointId, setValue, setTestPointId, availablePointsToTest]);

  // Update technician name if current user changes
  useEffect(() => {
     setValue('tecnico', currentUser?.name || '');
  }, [currentUser, setValue]);

  const onSubmit: SubmitHandler<TestFormData> = (data) => {
    if (!currentUser) {
        toast({ title: 'Erro', description: 'Nenhum usuário selecionado.', variant: 'destructive'});
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
    
    updatePointsAndAddTest(data.pontoId, testData, pointUpdates);

    toast({
      title: "Sucesso!",
      description: `Teste para o Ponto #${pointBeingTested?.numeroPonto} salvo com sucesso.`,
    });
    
    reset({ pontoId: '', resultado: 'Aprovado', tecnico: currentUser?.name || '' });
  };
  
  return (
    <Card className="max-w-4xl mx-auto mt-4 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>🔬 Teste de Ponto de Ancoragem</CardTitle>
        <CardDescription>Selecione um ponto e preencha os detalhes da inspeção.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-2">
            <Label>Ponto de Ancoragem</Label>
            <Controller
                control={control}
                name="pontoId"
                render={({ field }) => (
                    <PointSelector 
                        points={availablePointsToTest} 
                        value={field.value} 
                        onChange={field.onChange} 
                        disabled={!!testPointId && availablePointsToTest.some(p => p.id === testPointId)}
                    />
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
                
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="carga">Carga Aplicada (kgf)</Label>
                    <Input id="carga" {...register("carga")} placeholder="Ex: 1500" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="tempo">Tempo de Teste (min)</Label>
                    <Input id="tempo" {...register("tempo")} placeholder="Ex: 3" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="tecnico">Técnico Responsável</Label>
                    <Input id="tecnico" {...register("tecnico")} />
                 </div>
              </div>


              <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Foto Testando (Obrigatória)</Label>
                    <Controller
                      control={control}
                      name="fotoTeste"
                      render={({ field: { onChange, value } }) => (
                         <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />
                      )}
                    />
                    {errors.fotoTeste && <p className="text-sm text-destructive">{errors.fotoTeste.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Foto Ponto Pronto (Opcional)</Label>
                    <Controller
                      control={control}
                      name="fotoPronto"
                      render={({ field: { onChange, value } }) => (
                        <CameraCapture onCapture={onChange} initialPhoto={value} allowUpload={true} />
                      )}
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
