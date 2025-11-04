
"use client";

import { useState } from 'react';
import { useAnchorData } from '@/context/AnchorDataContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Bell, AlertCircle } from 'lucide-react';
import { PointDetailsModal } from './point-details-modal';
import { ScrollArea } from './ui/scroll-area';

export function InspectionRemindersPopover() {
    const { inspectionFlags, getPointById, points } = useAnchorData();
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

    const flaggedPoints = inspectionFlags
        .map(id => getPointById(id))
        .filter(p => p && points.some(point => point.id === p.id)); // Ensure point exists in current project

    const handleSelectPoint = (pointId: string) => {
        setSelectedPointId(pointId);
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {flaggedPoints.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 justify-center items-center text-xs text-white">
                                    {flaggedPoints.length}
                                </span>
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Lembretes de Inspeção</h4>
                            <p className="text-sm text-muted-foreground">
                                Pontos que precisam de atenção imediata.
                            </p>
                        </div>
                        <ScrollArea className="h-64">
                            <div className="grid gap-2">
                                {flaggedPoints.length > 0 ? (
                                    flaggedPoints.map(point => point && (
                                        <div
                                            key={point.id}
                                            onClick={() => handleSelectPoint(point.id)}
                                            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                        >
                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            <div>
                                                <p className="text-sm font-medium">Ponto #{point.numeroPonto}</p>
                                                <p className="text-xs text-muted-foreground">{point.localizacao}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">Nenhum lembrete no momento.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </PopoverContent>
            </Popover>
            
            {selectedPointId && (
                <PointDetailsModal
                    isOpen={!!selectedPointId}
                    onClose={() => setSelectedPointId(null)}
                    pointId={selectedPointId}
                />
            )}
        </>
    );
}
