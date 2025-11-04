"use client";

import { useAnchorData } from '@/context/AnchorDataContext';
import { PointCard } from './point-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

export function PointsGallery({ searchQuery }: { searchQuery: string }) {
  const { points, setActiveTab } = useAnchorData();

  const filteredPoints = useMemo(() => {
    if (!searchQuery) return points;
    
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return points.filter(point => 
      point.numeroPonto.toLowerCase().includes(lowercasedQuery) ||
      (point.numeroLacre && point.numeroLacre.toLowerCase().includes(lowercasedQuery)) ||
      (point.tipoEquipamento && point.tipoEquipamento.toLowerCase().includes(lowercasedQuery))
    );
  }, [points, searchQuery]);

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg gap-4">
        <p className="text-muted-foreground">Nenhum ponto cadastrado ainda para este projeto.</p>
        <Button variant="outline" onClick={() => setActiveTab('map')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Adicionar um ponto no mapa
        </Button>
      </div>
    );
  }
  
  if (filteredPoints.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Nenhum ponto encontrado com o termo "{searchQuery}".</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[720px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPoints.slice().reverse().map(point => (
          <PointCard key={point.id} point={point} />
        ))}
      </div>
    </ScrollArea>
  );
}
