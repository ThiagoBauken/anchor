"use client";

import { useOfflineData } from '@/context/OfflineDataContext';
import { PointCard } from './point-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

const naturalSort = (a, b) => {
    const numA = parseInt(a.numeroPonto.replace(/\D/g,''), 10) || 0;
    const numB = parseInt(b.numeroPonto.replace(/\D/g,''), 10) || 0;
    return numA - numB;
};


export function PointsGallery({ searchQuery, locationFilter }: { searchQuery: string, locationFilter: string }) {
  const { points, setActiveTab, showArchived } = useOfflineData();

  const filteredPoints = useMemo(() => {
    let pointsToFilter = [...points];

    // 1. Filter by archived status
    if (!showArchived) {
      pointsToFilter = pointsToFilter.filter(point => !point.archived);
    }

    // 2. Filter by location
    if (locationFilter && locationFilter !== 'all') {
      pointsToFilter = pointsToFilter.filter(point => point.localizacao === locationFilter);
    }
    
    // 3. Filter by search query
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      pointsToFilter = pointsToFilter.filter(point => 
        point.numeroPonto.toLowerCase().includes(lowercasedQuery) ||
        (point.numeroLacre && point.numeroLacre.toLowerCase().includes(lowercasedQuery)) ||
        (point.tipoEquipamento && point.tipoEquipamento.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // 4. Sort numerically by numeroPonto
    return pointsToFilter.sort(naturalSort);

  }, [points, searchQuery, locationFilter, showArchived]);

  // Check if there are any non-archived points when showArchived is false
  const hasNonArchivedPoints = points.some(p => !p.archived);
  
  if (points.length === 0 || (!showArchived && !hasNonArchivedPoints)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg gap-4">
        <p className="text-muted-foreground">
          {points.length === 0 
            ? "Nenhum ponto cadastrado ainda para este projeto."
            : "Todos os pontos estão arquivados. Ative 'Mostrar Pontos Arquivados' para visualizá-los."}
        </p>
        {points.length === 0 && (
          <Button variant="outline" onClick={() => setActiveTab('map')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Adicionar um ponto no mapa
          </Button>
        )}
      </div>
    );
  }
  
  if (filteredPoints.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Nenhum ponto encontrado com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[720px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPoints.map(point => (
          <PointCard key={point.id} point={point} />
        ))}
      </div>
    </ScrollArea>
  );
}
