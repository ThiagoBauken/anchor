"use client";

import { useOfflineData } from '@/context/OfflineDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PointsGallery } from './points-gallery';
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { SkeletonPointCard } from './ui/skeleton';
import { LoadingSpinner } from './ui/loading-spinner';
import { CreateProgressionDialog } from './create-progression-dialog';
import { Hash, Search, MapPin } from 'lucide-react';

export function PointsTab() {
  const { currentProject, locations, isLoading, currentUser, showArchived, setShowArchived } = useOfflineData();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);

  if (!currentProject) {
    return <div>Selecione um projeto</div>;
  }

  if (isLoading) {
    return (
      <div className="mt-4">
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <CardTitle>Carregando pontos...</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonPointCard key={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-4">
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Galeria de Pontos do Projeto: {currentProject.name}</CardTitle>
                <CardDescription>Lista de todos os pontos de ancoragem cadastrados para o projeto atual.</CardDescription>
              </div>
              <Button
                onClick={() => setShowProgressionDialog(true)}
                className="gap-2"
                size="sm"
              >
                <Hash className="h-4 w-4" />
                Criar Progressão
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <Label htmlFor="search-points" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Pesquisar
                    </Label>
                    <Input 
                        id="search-points"
                        placeholder="Pesquisar por nº do ponto, lacre ou equipamento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location-filter" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Filtrar por Localização
                    </Label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger id="location-filter">
                            <SelectValue placeholder="Selecione uma localização..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Localizações</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Switch id="show-archived-points" checked={showArchived} onCheckedChange={setShowArchived} />
                <Label htmlFor="show-archived-points">Mostrar Pontos Arquivados</Label>
            </div>
            <PointsGallery searchQuery={searchQuery} locationFilter={locationFilter} />
          </CardContent>
        </Card>
        
        <CreateProgressionDialog 
          isOpen={showProgressionDialog}
          onOpenChange={setShowProgressionDialog}
        />
    </div>
  );
}
