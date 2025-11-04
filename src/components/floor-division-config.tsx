'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, X, Settings, Check } from 'lucide-react';
import { Badge } from './ui/badge';

interface FloorDivisionConfigProps {
  availableFloors: string[];
  availableDivisions: string[];
  onUpdateConfig: (floors: string[], divisions: string[]) => Promise<void>;
  disabled?: boolean;
}

export function FloorDivisionConfig({
  availableFloors,
  availableDivisions,
  onUpdateConfig,
  disabled = false
}: FloorDivisionConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [floors, setFloors] = useState<string[]>(availableFloors);
  const [divisions, setDivisions] = useState<string[]>(availableDivisions);
  const [newFloor, setNewFloor] = useState('');
  const [newDivision, setNewDivision] = useState('');

  const handleAddFloor = () => {
    if (newFloor.trim() && !floors.includes(newFloor.trim())) {
      setFloors([...floors, newFloor.trim()]);
      setNewFloor('');
    }
  };

  const handleAddDivision = () => {
    if (newDivision.trim() && !divisions.includes(newDivision.trim())) {
      setDivisions([...divisions, newDivision.trim()]);
      setNewDivision('');
    }
  };

  const handleRemoveFloor = (floor: string) => {
    setFloors(floors.filter(f => f !== floor));
  };

  const handleRemoveDivision = (division: string) => {
    setDivisions(divisions.filter(d => d !== division));
  };

  const handleSave = async () => {
    await onUpdateConfig(floors, divisions);
    setIsOpen(false);
  };

  const handleQuickSetup = (type: 'numeric' | 'alphanumeric') => {
    if (type === 'numeric') {
      // Andares: 1, 2, 3... 10
      setFloors(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
      // Divisões: D1, D2... D7
      setDivisions(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']);
    } else {
      // Andares: A1, A2... A10
      setFloors(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      // Divisões: D1, D2... D7
      setDivisions(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Settings className="w-4 h-4 mr-2" />
          Configurar Andares e Divisões
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⚙️ Configurar Referências da Fachada</DialogTitle>
          <DialogDescription>
            Defina os andares e divisões disponíveis. Estes valores serão usados ao marcar patologias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração Rápida</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSetup('numeric')}
              >
                Padrão Numérico (1-10, D1-D7)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSetup('alphanumeric')}
              >
                Padrão Alfanumérico (A1-A10, D1-D7)
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Andares */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏢 Andares</CardTitle>
                <CardDescription className="text-xs">
                  Ex: 1, 2, 3... ou A1, A2, A3... ou Térreo, 1º Andar...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 7 ou A7"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFloor()}
                  />
                  <Button size="sm" onClick={handleAddFloor}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {floors.map((floor) => (
                    <Badge
                      key={floor}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {floor}
                      <button
                        onClick={() => handleRemoveFloor(floor)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {floors.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum andar configurado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Divisões */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📍 Divisões</CardTitle>
                <CardDescription className="text-xs">
                  Ex: D1, D2, D3... ou Setor A, Setor B...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: D1 ou Setor A"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDivision()}
                  />
                  <Button size="sm" onClick={handleAddDivision}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {divisions.map((division) => (
                    <Badge
                      key={division}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {division}
                      <button
                        onClick={() => handleRemoveDivision(division)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {divisions.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma divisão configurada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
