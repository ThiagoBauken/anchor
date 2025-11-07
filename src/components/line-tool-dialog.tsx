
"use client";

import { useEffect, useMemo, useState } from "react";
import { useOfflineData } from "@/context/OfflineDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useToast } from "@/hooks/use-toast";

interface LineToolDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function LineToolDialog({ isOpen, onOpenChange }: LineToolDialogProps) {
    const {
        lineToolStartPointId, lineToolEndPointId, getPointById, resetLineTool,
        setLineToolMode, currentProject, points, addMultiplePoints,
        setLineToolPreviewPoints
    } = useOfflineData();
    const [numPointsToAdd, setNumPointsToAdd] = useState(1);
    const [spacing, setSpacing] = useState(2.0); // meters between points
    const [useSpacing, setUseSpacing] = useState(false);
    const { toast } = useToast();

    const startPoint = useMemo(() => lineToolStartPointId ? getPointById(lineToolStartPointId) : null, [lineToolStartPointId, getPointById]);
    const endPoint = useMemo(() => lineToolEndPointId ? getPointById(lineToolEndPointId) : null, [lineToolEndPointId, getPointById]);

    // Calculate real distance between points
    const realDistance = useMemo(() => {
        if (!startPoint || !endPoint || !currentProject?.scalePixelsPerMeter) return null;
        
        const pixelDistance = Math.sqrt(
            Math.pow(endPoint.posicaoX - startPoint.posicaoX, 2) + 
            Math.pow(endPoint.posicaoY - startPoint.posicaoY, 2)
        );
        
        return pixelDistance / currentProject.scalePixelsPerMeter;
    }, [startPoint, endPoint, currentProject?.scalePixelsPerMeter]);

    // Calculate number of points based on spacing
    const calculatedNumPoints = useMemo(() => {
        if (!realDistance || !spacing) return 1;
        return Math.max(1, Math.floor(realDistance / spacing) - 1);
    }, [realDistance, spacing]);

    useEffect(() => {
        if (!isOpen) {
            setLineToolMode(false);
        }
    }, [isOpen, setLineToolMode]);

    // Calculate and update preview points
    useEffect(() => {
        const pointsToUse = useSpacing ? calculatedNumPoints : numPointsToAdd;
        if (startPoint && endPoint && pointsToUse > 0) {
            const newPreviewPoints = [];
            for (let i = 1; i <= pointsToUse; i++) {
                const fraction = i / (pointsToUse + 1);
                const x = startPoint.posicaoX + fraction * (endPoint.posicaoX - startPoint.posicaoX);
                const y = startPoint.posicaoY + fraction * (endPoint.posicaoY - startPoint.posicaoY);
                newPreviewPoints.push({ x, y });
            }
            setLineToolPreviewPoints(newPreviewPoints);
        } else {
            setLineToolPreviewPoints([]);
        }
    }, [startPoint, endPoint, numPointsToAdd, calculatedNumPoints, useSpacing, setLineToolPreviewPoints]);

    const handleConfirm = () => {
        if (!startPoint || !endPoint || !currentProject) {
            toast({ title: "Erro", description: "Pontos de início/fim ou projeto não definidos.", variant: "destructive" });
            return;
        }

        const pointsToUse = useSpacing ? calculatedNumPoints : numPointsToAdd;
        const newPointsData = [];
        const highestPointNumber = Math.max(0, ...points.map(p => parseInt(p.numeroPonto, 10) || 0));

        for (let i = 1; i <= pointsToUse; i++) {
            const fraction = i / (pointsToUse + 1);
            const x = startPoint.posicaoX + fraction * (endPoint.posicaoX - startPoint.posicaoX);
            const y = startPoint.posicaoY + fraction * (endPoint.posicaoY - startPoint.posicaoY);
            
            newPointsData.push({
                projectId: currentProject.id,
                numeroPonto: (highestPointNumber + i).toString(),
                posicaoX: x,
                posicaoY: y,
                localizacao: startPoint.localizacao || 'Área Externa', // Use start point location or default
                observacoes: '',
                numeroLacre: '',
            } as any);
        }
        
        addMultiplePoints(newPointsData);
        toast({ 
            title: "Sucesso!", 
            description: useSpacing 
                ? `${pointsToUse} pontos foram adicionados com espaçamento de ${spacing}m.`
                : `${pointsToUse} pontos foram adicionados.`
        });
        handleClose();
    };

    const handleClose = () => {
        resetLineTool();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ferramenta: Adicionar Pontos em Linha</DialogTitle>
                    <DialogDescription>
                        Selecione um ponto de início e um ponto de fim no mapa, depois defina quantos pontos quer adicionar entre eles.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-md text-center">
                            <Label>Ponto de Início</Label>
                            <p className="text-2xl font-bold text-primary">{startPoint ? `#${startPoint.numeroPonto}` : 'N/A'}</p>
                        </div>
                        <div className="p-4 border rounded-md text-center">
                            <Label>Ponto de Fim</Label>
                            <p className="text-2xl font-bold text-primary">{endPoint ? `#${endPoint.numeroPonto}` : 'N/A'}</p>
                        </div>
                    </div>

                    {realDistance && (
                        <div className="p-3 bg-muted rounded-md">
                            <Label className="text-sm font-medium">Distância Real</Label>
                            <p className="text-lg font-bold">{realDistance.toFixed(2)} metros</p>
                        </div>
                    )}

                    {currentProject?.scalePixelsPerMeter && (
                        <div className="flex items-center space-x-3">
                            <Switch 
                                id="use-spacing" 
                                checked={useSpacing} 
                                onCheckedChange={setUseSpacing}
                                disabled={!startPoint || !endPoint}
                            />
                            <Label htmlFor="use-spacing">Usar espaçamento baseado em distância real (DWG)</Label>
                        </div>
                    )}

                    {useSpacing ? (
                        <div className="space-y-2">
                            <Label htmlFor="spacing">Espaçamento entre pontos (metros)</Label>
                            <Input 
                                id="spacing"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={spacing}
                                onChange={(e) => setSpacing(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                                disabled={!startPoint || !endPoint}
                            />
                            <p className="text-sm text-muted-foreground">
                                Pontos calculados: {calculatedNumPoints}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="num-points">Número de pontos a adicionar entre eles</Label>
                            <Input 
                                id="num-points"
                                type="number"
                                min="1"
                                value={numPointsToAdd}
                                onChange={(e) => setNumPointsToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                disabled={!startPoint || !endPoint}
                            />
                        </div>
                    )}

                    {!currentProject?.scalePixelsPerMeter && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                                Para usar espaçamento baseado em distância real, configure a escala do projeto nas configurações.
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={!startPoint || !endPoint || (useSpacing ? calculatedNumPoints < 1 : numPointsToAdd < 1)}
                    >
                        Adicionar {useSpacing ? calculatedNumPoints : numPointsToAdd} Pontos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
