
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { InteractiveMap } from './interactive-map';
import { Badge } from './ui/badge';
import { useAnchorData } from '@/context/AnchorDataContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Download, RotateCw, RotateCcw, Archive, Spline, Search } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { LineToolDialog } from './line-tool-dialog';
import { PointDetailsModal } from './point-details-modal';

const Legend = () => {
  return (
    <div className="flex justify-center flex-wrap gap-4 mt-4 text-xs">
      <div className="flex items-center gap-2">
        <Badge className="bg-green-500 hover:bg-green-500"> </Badge>
        <span>Aprovado</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-red-500 hover:bg-red-500"> </Badge>
        <span>Reprovado</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-yellow-500 hover:bg-yellow-500"> </Badge>
        <span>Não Testado</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-500 hover:bg-blue-500"> </Badge>
        <span>Ponto Pesquisado</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="animate-pulse"> </Badge>
        <span>Requer Inspeção</span>
      </div>
    </div>
  );
};

export function MapTab({ onActiveFloorPlanChange }: { onActiveFloorPlanChange?: (url: string) => void }) {
  const { currentProject, points, currentUser, showArchived, setShowArchived, lineToolMode, setLineToolMode, resetLineTool } = useAnchorData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPointIdFromSearch, setSelectedPointIdFromSearch] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [markerSize, setMarkerSize] = useState(4);
  const [labelFontSize, setLabelFontSize] = useState(10);
  const [isLineToolOpen, setIsLineToolOpen] = useState(false);
  const { toast } = useToast();
  const [mapDimensions, setMapDimensions] = useState({ width: 1200, height: 900 });
  const [activeFloorPlan, setActiveFloorPlan] = useState(currentProject?.floorPlanImages?.[0] || '');

  const defaultFloorPlan = currentProject?.floorPlanImages?.[0] || '';
  
  const handleRotateCw = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateCcw = () => setRotation(prev => (prev - 90 + 360) % 360);

  const handleDownloadMap = async () => {
    // We now use a more specific ID including the floor plan URL to ensure we get the right one
    const mapElement = document.getElementById(`export-map-${activeFloorPlan}`);
    
    if (!mapElement) {
        toast({ title: 'Erro', description: 'Não foi possível encontrar o elemento do mapa para download.', variant: 'destructive' });
        return;
    }
    toast({ title: 'Gerando imagem do mapa...', description: 'Aguarde um momento, por favor.' });
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const dataUrl = await toPng(mapElement, { 
            quality: 1.0, 
            pixelRatio: 2,
            width: mapDimensions.width,
            height: mapDimensions.height,
            style: {
                width: `${mapDimensions.width}px`,
                height: `${mapDimensions.height}px`,
            }
        });
        const link = document.createElement('a');
        link.download = `mapa_${currentProject?.name.replace(/\s+/g, '_') || 'projeto'}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('oops, something went wrong!', err);
        toast({ title: 'Erro ao gerar imagem', description: 'Não foi possível criar o arquivo de imagem do mapa.', variant: 'destructive' });
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const foundPoint = points.find(p => p.numeroPonto.toLowerCase() === searchQuery.toLowerCase().trim());

    if (foundPoint) {
      setSelectedPointIdFromSearch(foundPoint.id);
    } else {
      toast({
        variant: 'destructive',
        title: 'Ponto não encontrado',
        description: `Nenhum ponto com o número "${searchQuery}" foi encontrado neste projeto.`
      });
    }
  };
  
  const handleTabChange = (newTabValue: string) => {
      setActiveFloorPlan(newTabValue);
      if(onActiveFloorPlanChange) {
          onActiveFloorPlanChange(newTabValue);
      }
  };

  const handleToggleLineTool = () => {
    const newMode = !lineToolMode;
    setLineToolMode(newMode);
    if (newMode) {
      setIsLineToolOpen(true);
      toast({ title: 'Ferramenta de Linha Ativada', description: 'Selecione um ponto de início e um ponto de fim no mapa.' });
    } else {
      setIsLineToolOpen(false);
      resetLineTool();
    }
  };

  return (
    <>
    <Card className="mt-4 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>🗺️ Mapa Interativo do Projeto: {currentProject?.name}</CardTitle>
        <CardDescription>
          {currentUser?.role === 'admin' 
            ? "Clique no mapa para adicionar um ponto. Segure SHIFT e use o scroll para zoom. Arraste para mover."
            : "Visualize os pontos de ancoragem no mapa do projeto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            <form onSubmit={handleSearchSubmit} className="space-y-2">
                <Label htmlFor="search-point">Pesquisar Ponto e Ver Detalhes</Label>
                <div className="flex gap-2">
                    <Input 
                        id="search-point" 
                        placeholder="Digite o nº do ponto e aperte Enter"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" size="icon" variant="outline"><Search className="h-4 w-4"/></Button>
                </div>
            </form>
            
            <div className="space-y-2">
                <Label>Controles do Mapa</Label>
                <div className="flex items-center gap-2">
                    <Button onClick={handleRotateCcw} variant="outline" size="icon" aria-label="Girar anti-horário"><RotateCcw className="h-4 w-4" /></Button>
                    <Button onClick={handleRotateCw} variant="outline" size="icon" aria-label="Girar horário"><RotateCw className="h-4 w-4" /></Button>
                    <Button onClick={handleDownloadMap} variant="outline" className="flex-grow"><Download className="mr-2 h-4 w-4" /> Download</Button>
                </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                  <Label htmlFor="marker-size">Tamanho do Marcador</Label>
                  <Slider id="marker-size" min={2} max={10} step={1} value={[markerSize]} onValueChange={(value) => setMarkerSize(value[0])} />
              </div>

              <div className="space-y-2 flex-1">
                  <Label htmlFor="label-font-size">Tamanho da Fonte</Label>
                  <Slider id="label-font-size" min={6} max={20} step={1} value={[labelFontSize]} onValueChange={(value) => setLabelFontSize(value[0])} />
              </div>
            </div>

             <div className="space-y-2">
                <Label>Ferramentas de Admin</Label>
                <div className='flex items-center gap-2'>
                    {currentUser?.role === 'admin' && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
                            <Label htmlFor="show-archived">Mostrar Arquivados</Label>
                        </div>
                     )}
                     <Button onClick={handleToggleLineTool} variant={lineToolMode ? 'secondary' : 'outline'} className="w-full">
                        <Spline className="mr-2 h-4 w-4" />
                        {lineToolMode ? 'Desativar Ferramenta' : 'Adicionar Pontos Entre'}
                    </Button>
                </div>
            </div>
        </div>

        {currentProject && currentProject.floorPlanImages && currentProject.floorPlanImages.length > 0 ? (
          <Tabs defaultValue={defaultFloorPlan} className="w-full" onValueChange={handleTabChange}>
            {currentProject.floorPlanImages.length > 1 && (
              <TabsList>
                {currentProject.floorPlanImages.map((image, index) => (
                  <TabsTrigger key={index} value={image}>Planta {index + 1}</TabsTrigger>
                ))}
              </TabsList>
            )}
            {currentProject.floorPlanImages.map((image, index) => (
              <TabsContent key={index} value={image} forceMount>
                 <div className={activeFloorPlan === image ? 'block' : 'hidden'}>
                    <InteractiveMap 
                        points={points} 
                        searchQuery={searchQuery} 
                        floorPlanImage={image} 
                        rotation={rotation} 
                        markerSize={markerSize} 
                        labelFontSize={labelFontSize} 
                        onPointSelect={(id) => setSelectedPointIdFromSearch(id)}
                        setMapDimensions={setMapDimensions}
                        mapDimensions={mapDimensions}
                    />
                 </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <InteractiveMap 
            points={points} 
            searchQuery={searchQuery} 
            floorPlanImage="" 
            rotation={rotation} 
            markerSize={markerSize}
            labelFontSize={labelFontSize} 
            onPointSelect={(id) => setSelectedPointIdFromSearch(id)}
            setMapDimensions={setMapDimensions}
            mapDimensions={mapDimensions}
            />
        )}
        
        <Legend />
      </CardContent>
    </Card>

    {/* Hidden map container for exports */}
    <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        {currentProject?.floorPlanImages?.map(image => (
            <div key={`export-${image}`} id={`export-map-${image}`}>
                <InteractiveMap
                    isExport={true}
                    points={points}
                    floorPlanImage={image}
                    onPointSelect={() => {}}
                    mapDimensions={mapDimensions}
                    setMapDimensions={setMapDimensions}
                />
            </div>
        ))}
    </div>

    <LineToolDialog isOpen={isLineToolOpen} onOpenChange={setIsLineToolOpen} />
    {selectedPointIdFromSearch && (
        <PointDetailsModal 
            isOpen={!!selectedPointIdFromSearch}
            onClose={() => setSelectedPointIdFromSearch(null)}
            pointId={selectedPointIdFromSearch}
        />
    )}
    </>
  );
}
