"use client";

import { useEffect, useMemo, useState } from "react";
import { useOfflineData } from "@/context/OfflineDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface CreateProgressionDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function CreateProgressionDialog({ isOpen, onOpenChange }: CreateProgressionDialogProps) {
    const { 
        points, 
        currentProject, 
        currentLocation,
        createPoint
    } = useOfflineData();
    
    const { toast } = useToast();
    
    // Estados do formulário
    const [mode, setMode] = useState<'between' | 'new'>('between');
    const [startPointId, setStartPointId] = useState<string>('');
    const [endPointId, setEndPointId] = useState<string>('');
    const [numPoints, setNumPoints] = useState(3);
    const [startNumber, setStartNumber] = useState('');
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');
    
    // Pontos disponíveis ordenados
    const availablePoints = useMemo(() => {
        return points
            .filter(p => !p.archived && p.projectId === currentProject?.id)
            .sort((a, b) => {
                const numA = parseInt(a.numeroPonto.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.numeroPonto.replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });
    }, [points, currentProject]);
    
    // Pontos selecionados
    const startPoint = useMemo(() => 
        availablePoints.find(p => p.id === startPointId), 
        [availablePoints, startPointId]
    );
    
    const endPoint = useMemo(() => 
        availablePoints.find(p => p.id === endPointId), 
        [availablePoints, endPointId]
    );
    
    // Calcular distância entre pontos
    const distance = useMemo(() => {
        if (!startPoint || !endPoint) return null;
        
        return Math.sqrt(
            Math.pow(endPoint.posicaoX - startPoint.posicaoX, 2) + 
            Math.pow(endPoint.posicaoY - startPoint.posicaoY, 2)
        );
    }, [startPoint, endPoint]);
    
    // Preview dos números que serão criados
    const previewNumbers = useMemo(() => {
        const numbers = [];
        
        if (mode === 'between' && startPoint && endPoint) {
            // Modo entre pontos: gerar números intermediários
            const startNum = parseInt(startPoint.numeroPonto.replace(/\D/g, ''), 10);
            const endNum = parseInt(endPoint.numeroPonto.replace(/\D/g, ''), 10);
            
            if (startNum && endNum && endNum > startNum) {
                // Tentar distribuir números uniformemente entre os pontos
                const step = (endNum - startNum) / (numPoints + 1);
                for (let i = 1; i <= numPoints; i++) {
                    const num = Math.round(startNum + step * i);
                    numbers.push(`${prefix}${num}${suffix}`);
                }
            } else {
                // Se não for possível, usar decimais ou letras
                for (let i = 1; i <= numPoints; i++) {
                    numbers.push(`${startPoint.numeroPonto}.${i}`);
                }
            }
        } else if (mode === 'new') {
            // Modo novos pontos
            const start = parseInt(startNumber) || 1;
            for (let i = 0; i < numPoints; i++) {
                numbers.push(`${prefix}${start + i}${suffix}`);
            }
        }
        
        return numbers;
    }, [mode, startPoint, endPoint, numPoints, startNumber, prefix, suffix]);
    
    const handleConfirm = async () => {
        if (!currentProject) {
            toast({ 
                title: "Erro", 
                description: "Nenhum projeto selecionado.", 
                variant: "destructive" 
            });
            return;
        }
        
        if (mode === 'between' && (!startPoint || !endPoint)) {
            toast({ 
                title: "Erro", 
                description: "Selecione os pontos inicial e final.", 
                variant: "destructive" 
            });
            return;
        }
        
        try {
            const newPoints = [];
            
            for (let i = 0; i < numPoints; i++) {
                let x, y;
                
                if (mode === 'between' && startPoint && endPoint) {
                    // Calcular posição interpolada
                    const fraction = (i + 1) / (numPoints + 1);
                    x = startPoint.posicaoX + fraction * (endPoint.posicaoX - startPoint.posicaoX);
                    y = startPoint.posicaoY + fraction * (endPoint.posicaoY - startPoint.posicaoY);
                } else {
                    // Posição padrão para novos pontos
                    x = 100 + i * 50;
                    y = 100;
                }
                
                const pointData = {
                    projectId: currentProject.id,
                    numeroPonto: previewNumbers[i],
                    posicaoX: x,
                    posicaoY: y,
                    localizacao: currentLocation?.name || startPoint?.localizacao || 'Não definido',
                    status: 'Não Testado' as const,
                    archived: false
                };
                
                await createPoint(pointData);
                newPoints.push(pointData);
            }
            
            toast({ 
                title: "Sucesso!", 
                description: `${numPoints} pontos criados com sucesso.`
            });
            
            onOpenChange(false);
            resetForm();
            
        } catch (error) {
            console.error('Erro ao criar progressão:', error);
            toast({ 
                title: "Erro", 
                description: "Falha ao criar pontos.", 
                variant: "destructive" 
            });
        }
    };
    
    const resetForm = () => {
        setStartPointId('');
        setEndPointId('');
        setNumPoints(3);
        setStartNumber('');
        setPrefix('');
        setSuffix('');
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>🔢 Criar Progressão de Pontos</DialogTitle>
                    <DialogDescription>
                        Crie múltiplos pontos de forma automática, entre pontos existentes ou com nova numeração.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Modo de criação */}
                    <div className="space-y-3">
                        <Label>Modo de Criação</Label>
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'between' | 'new')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="between" id="between" />
                                <Label htmlFor="between" className="font-normal cursor-pointer">
                                    Adicionar pontos ENTRE dois pontos existentes
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new" className="font-normal cursor-pointer">
                                    Criar nova sequência de pontos
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    {mode === 'between' ? (
                        <>
                            {/* Seleção de pontos inicial e final */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ponto Inicial</Label>
                                    <Select value={startPointId} onValueChange={setStartPointId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePoints.map(point => (
                                                <SelectItem 
                                                    key={point.id} 
                                                    value={point.id}
                                                    disabled={point.id === endPointId}
                                                >
                                                    Ponto #{point.numeroPonto}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Ponto Final</Label>
                                    <Select value={endPointId} onValueChange={setEndPointId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePoints.map(point => (
                                                <SelectItem 
                                                    key={point.id} 
                                                    value={point.id}
                                                    disabled={point.id === startPointId}
                                                >
                                                    Ponto #{point.numeroPonto}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Visualização da progressão */}
                            {startPoint && endPoint && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">#{startPoint.numeroPonto}</span>
                                            <ArrowRight className="h-4 w-4" />
                                            <span className="text-sm">
                                                {previewNumbers.join(', ')}
                                            </span>
                                            <ArrowRight className="h-4 w-4" />
                                            <span className="font-bold">#{endPoint.numeroPonto}</span>
                                        </div>
                                        {distance && (
                                            <p className="text-xs mt-2">
                                                Distância: {distance.toFixed(0)} pixels
                                            </p>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Configuração para nova sequência */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Prefixo (opcional)</Label>
                                    <Input 
                                        value={prefix}
                                        onChange={(e) => setPrefix(e.target.value)}
                                        placeholder="Ex: P"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Número Inicial</Label>
                                    <Input 
                                        type="number"
                                        value={startNumber}
                                        onChange={(e) => setStartNumber(e.target.value)}
                                        placeholder="Ex: 100"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Sufixo (opcional)</Label>
                                    <Input 
                                        value={suffix}
                                        onChange={(e) => setSuffix(e.target.value)}
                                        placeholder="Ex: A"
                                    />
                                </div>
                            </div>
                            
                            {/* Preview da numeração */}
                            {previewNumbers.length > 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <span className="font-medium">Pontos a criar: </span>
                                        {previewNumbers.join(', ')}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}
                    
                    {/* Quantidade de pontos */}
                    <div className="space-y-2">
                        <Label>Quantidade de Pontos</Label>
                        <Input 
                            type="number"
                            min="1"
                            max="50"
                            value={numPoints}
                            onChange={(e) => setNumPoints(parseInt(e.target.value) || 1)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Máximo de 50 pontos por vez
                        </p>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={
                            (mode === 'between' && (!startPointId || !endPointId)) ||
                            numPoints < 1 || 
                            numPoints > 50
                        }
                    >
                        Criar {numPoints} Pontos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}