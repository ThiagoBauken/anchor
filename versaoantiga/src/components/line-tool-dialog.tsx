
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAnchorData } from "@/context/AnchorDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
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
    } = useAnchorData();
    const [numPointsToAdd, setNumPointsToAdd] = useState(1);
    const { toast } = useToast();

    const startPoint = useMemo(() => lineToolStartPointId ? getPointById(lineToolStartPointId) : null, [lineToolStartPointId, getPointById]);
    const endPoint = useMemo(() => lineToolEndPointId ? getPointById(lineToolEndPointId) : null, [lineToolEndPointId, getPointById]);

    useEffect(() => {
        if (!isOpen) {
            setLineToolMode(false);
        }
    }, [isOpen, setLineToolMode]);

    // Calculate and update preview points
    useEffect(() => {
        if (startPoint && endPoint && numPointsToAdd > 0) {
            const newPreviewPoints = [];
            for (let i = 1; i <= numPointsToAdd; i++) {
                const fraction = i / (numPointsToAdd + 1);
                const x = startPoint.posicaoX + fraction * (endPoint.posicaoX - startPoint.posicaoX);
                const y = startPoint.posicaoY + fraction * (endPoint.posicaoY - startPoint.posicaoY);
                newPreviewPoints.push({ x, y });
            }
            setLineToolPreviewPoints(newPreviewPoints);
        } else {
            setLineToolPreviewPoints([]);
        }
    }, [startPoint, endPoint, numPointsToAdd, setLineToolPreviewPoints]);

    const handleConfirm = () => {
        if (!startPoint || !endPoint || !currentProject) {
            toast({ title: "Erro", description: "Pontos de início/fim ou projeto não definidos.", variant: "destructive" });
            return;
        }

        const newPointsData = [];
        const highestPointNumber = Math.max(0, ...points.map(p => parseInt(p.numeroPonto, 10) || 0));

        for (let i = 1; i <= numPointsToAdd; i++) {
            const fraction = i / (numPointsToAdd + 1);
            const x = startPoint.posicaoX + fraction * (endPoint.posicaoX - startPoint.posicaoX);
            const y = startPoint.posicaoY + fraction * (endPoint.posicaoY - startPoint.posicaoY);
            
            newPointsData.push({
                projectId: currentProject.id,
                numeroPonto: (highestPointNumber + i).toString(),
                posicaoX: x,
                posicaoY: y,
            });
        }
        
        addMultiplePoints(newPointsData);
        toast({ title: "Sucesso!", description: `${numPointsToAdd} pontos foram adicionados.` });
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
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!startPoint || !endPoint || numPointsToAdd < 1}>
                        Adicionar {numPointsToAdd} Pontos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
