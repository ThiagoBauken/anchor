"use client";

import { useAnchorData } from '@/context/AnchorDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PointsGallery } from './points-gallery';
import { useState } from 'react';
import { Input } from './ui/input';

export function PointsTab() {
  const { currentProject } = useAnchorData();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentProject) {
    return <div>Selecione um projeto</div>;
  }

  return (
    <div className="mt-4">
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Galeria de Pontos do Projeto: {currentProject.name}</CardTitle>
            <CardDescription>Lista de todos os pontos de ancoragem cadastrados para o projeto atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 max-w-sm">
              <Input 
                placeholder="🔎 Pesquisar por nº do ponto, lacre ou equipamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <PointsGallery searchQuery={searchQuery} />
          </CardContent>
        </Card>
    </div>
  );
}
