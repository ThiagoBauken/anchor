'use client';

import React, { useState } from 'react';
import { PathologyMarker, PathologyCategory, PathologySeverity } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Upload, X, Save } from 'lucide-react';
import { Badge } from './ui/badge';

interface PathologyMarkerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PathologyMarker>) => Promise<void>;
  marker?: PathologyMarker | null;
  categories: PathologyCategory[];
  availableFloors: string[];
  availableDivisions: string[];
  title?: string;
}

export function PathologyMarkerForm({
  isOpen,
  onClose,
  onSave,
  marker,
  categories,
  availableFloors,
  availableDivisions,
  title = 'Detalhes da Patologia'
}: PathologyMarkerFormProps) {
  const [formData, setFormData] = useState({
    floor: marker?.floor || '',
    division: marker?.division || '',
    categoryId: marker?.categoryId || '',
    severity: marker?.severity || 'medium' as PathologySeverity,
    description: marker?.description || '',
    observations: marker?.observations || '',
    status: marker?.status || 'PENDING',
    priority: marker?.priority || 0,
  });

  const [photos, setPhotos] = useState<string[]>(marker?.photos || []);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotos([...photos, base64]);
        setNewPhotoPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await onSave({
      ...formData,
      photos,
    });
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Floor and Division */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">🏢 Andar *</Label>
              {availableFloors.length > 0 ? (
                <Select value={formData.floor} onValueChange={(v) => handleInputChange('floor', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o andar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFloors.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="floor"
                  placeholder="Ex: 7 ou Térreo"
                  value={formData.floor}
                  onChange={(e) => handleInputChange('floor', e.target.value)}
                />
              )}
              {availableFloors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Configure andares primeiro
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">📍 Divisão *</Label>
              {availableDivisions.length > 0 ? (
                <Select value={formData.division} onValueChange={(v) => handleInputChange('division', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a divisão" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDivisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="division"
                  placeholder="Ex: D1 ou Setor A"
                  value={formData.division}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                />
              )}
              {availableDivisions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Configure divisões primeiro
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">🎨 Tipo de Patologia *</Label>
            <Select value={formData.categoryId} onValueChange={(v) => handleInputChange('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.active).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">⚠️ Gravidade *</Label>
            <Select value={formData.severity} onValueChange={(v) => handleInputChange('severity', v as PathologySeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Baixa</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="high">🟠 Alta</SelectItem>
                <SelectItem value="critical">🔴 Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">📝 Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a patologia..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">💬 Observações</Label>
            <Textarea
              id="observations"
              placeholder="Observações adicionais..."
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              rows={3}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>📷 Fotos (Opcional)</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="flex-1"
              />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">📊 Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="RESOLVED">Resolvido</SelectItem>
                  <SelectItem value="IGNORED">Ignorado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">🎯 Prioridade (0-10)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.floor || !formData.division || !formData.categoryId}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
