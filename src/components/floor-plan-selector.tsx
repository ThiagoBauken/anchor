"use client";

import React, { useState } from 'react';
import { FloorPlan } from '@/types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit2, Trash2, Eye, EyeOff, Settings } from 'lucide-react';
import { Card } from './ui/card';

interface FloorPlanSelectorProps {
  floorPlans: FloorPlan[];
  activeFloorPlanId: string | null;
  onSelectFloorPlan: (floorPlanId: string | null) => void;
  onAddFloorPlan: (name: string, image: string, order: number) => Promise<void>;
  onEditFloorPlan: (floorPlanId: string, name: string, order: number) => Promise<void>;
  onDeleteFloorPlan: (floorPlanId: string) => Promise<void>;
  onToggleFloorPlanActive: (floorPlanId: string, active: boolean) => Promise<void>;
  canEdit?: boolean;
}

export function FloorPlanSelector({
  floorPlans,
  activeFloorPlanId,
  onSelectFloorPlan,
  onAddFloorPlan,
  onEditFloorPlan,
  onDeleteFloorPlan,
  onToggleFloorPlanActive,
  canEdit = true,
}: FloorPlanSelectorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingFloorPlan, setEditingFloorPlan] = useState<FloorPlan | null>(null);
  const [newFloorPlanName, setNewFloorPlanName] = useState('');
  const [newFloorPlanImage, setNewFloorPlanImage] = useState('');
  const [newFloorPlanOrder, setNewFloorPlanOrder] = useState(0);

  const sortedFloorPlans = [...floorPlans].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const activeFloorPlan = floorPlans.find(fp => fp.id === activeFloorPlanId);

  const handleAddFloorPlan = async () => {
    if (newFloorPlanName.trim() && newFloorPlanImage) {
      await onAddFloorPlan(newFloorPlanName, newFloorPlanImage, newFloorPlanOrder);
      setNewFloorPlanName('');
      setNewFloorPlanImage('');
      setNewFloorPlanOrder(floorPlans.length);
      setIsAddModalOpen(false);
    }
  };

  const handleEditFloorPlan = async () => {
    if (editingFloorPlan && newFloorPlanName.trim()) {
      await onEditFloorPlan(editingFloorPlan.id, newFloorPlanName, newFloorPlanOrder);
      setEditingFloorPlan(null);
      setNewFloorPlanName('');
      setNewFloorPlanOrder(0);
      setIsEditModalOpen(false);
    }
  };

  const openEditModal = (floorPlan: FloorPlan) => {
    setEditingFloorPlan(floorPlan);
    setNewFloorPlanName(floorPlan.name);
    setNewFloorPlanOrder(floorPlan.order);
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFloorPlanImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeFloorPlanId || "all"}
        onValueChange={(value) => onSelectFloorPlan(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue>
            {activeFloorPlan ? activeFloorPlan.name : "Todas as plantas"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span className="font-medium">Todas as plantas</span>
            </div>
          </SelectItem>
          {sortedFloorPlans.map((floorPlan) => (
            <SelectItem
              key={floorPlan.id}
              value={floorPlan.id}
              disabled={!floorPlan.active}
            >
              <div className="flex items-center gap-2">
                <span>{floorPlan.name}</span>
                {!floorPlan.active && (
                  <span className="text-xs text-muted-foreground">(Inativa)</span>
                )}
                <span className="text-xs text-muted-foreground">
                  ({floorPlan.anchorPoints?.length || 0} pontos)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canEdit && (
        <>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Nova Planta
          </Button>

          {floorPlans.length > 0 && (
            <Button onClick={() => setIsManageModalOpen(true)} size="sm" variant="ghost">
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </>
      )}

      {/* Adicionar Planta Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Planta Baixa</DialogTitle>
            <DialogDescription>
              Adicione uma nova planta baixa ao projeto. Cada planta terá sua própria numeração de pontos (P1, P2, P3...).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="floor-plan-name">Nome da Planta</Label>
              <Input
                id="floor-plan-name"
                placeholder="Ex: Térreo, 1º Andar, Fachada Norte"
                value={newFloorPlanName}
                onChange={(e) => setNewFloorPlanName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="floor-plan-image">Imagem da Planta Baixa</Label>
              <Input
                id="floor-plan-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {newFloorPlanImage && (
                <p className="text-xs text-muted-foreground mt-1">Imagem selecionada</p>
              )}
            </div>
            <div>
              <Label htmlFor="floor-plan-order">Ordem de Exibição</Label>
              <Input
                id="floor-plan-order"
                type="number"
                value={newFloorPlanOrder}
                onChange={(e) => setNewFloorPlanOrder(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ordem numérica (0, 1, 2...). Menor número aparece primeiro.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddFloorPlan} disabled={!newFloorPlanName.trim() || !newFloorPlanImage}>
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editar Planta Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Planta Baixa</DialogTitle>
            <DialogDescription>
              Altere o nome ou ordem da planta baixa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-floor-plan-name">Nome da Planta</Label>
              <Input
                id="edit-floor-plan-name"
                value={newFloorPlanName}
                onChange={(e) => setNewFloorPlanName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-floor-plan-order">Ordem de Exibição</Label>
              <Input
                id="edit-floor-plan-order"
                type="number"
                value={newFloorPlanOrder}
                onChange={(e) => setNewFloorPlanOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditFloorPlan} disabled={!newFloorPlanName.trim()}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gerenciar Plantas Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Plantas Baixas</DialogTitle>
            <DialogDescription>
              Organize, edite ou remova plantas baixas do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedFloorPlans.map((floorPlan) => (
              <Card key={floorPlan.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6">{floorPlan.order}.</span>
                    <div>
                      <div className="font-medium">{floorPlan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {floorPlan.anchorPoints?.length || 0} pontos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleFloorPlanActive(floorPlan.id, !floorPlan.active)}
                      title={floorPlan.active ? "Ocultar planta" : "Mostrar planta"}
                    >
                      {floorPlan.active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(floorPlan)}
                      title="Editar planta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Deseja realmente deletar a planta "${floorPlan.name}"? Os pontos desta planta não serão deletados, mas perderão a associação com a planta.`)) {
                          onDeleteFloorPlan(floorPlan.id);
                        }
                      }}
                      title="Deletar planta"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {sortedFloorPlans.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma planta baixa adicionada ainda.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
