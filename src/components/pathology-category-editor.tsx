'use client';

import React, { useState } from 'react';
import { PathologyCategory, PathologySeverity } from '@/types';
import {
  updatePathologyCategory,
  deletePathologyCategory,
  togglePathologyCategoryActive
} from '@/app/actions/facade-inspection-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface PathologyCategoryEditorProps {
  categories: PathologyCategory[];
  onCategoriesChange: () => void;
  canEdit?: boolean;
}

export function PathologyCategoryEditor({
  categories,
  onCategoriesChange,
  canEdit = true
}: PathologyCategoryEditorProps) {
  const [editingCategory, setEditingCategory] = useState<PathologyCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editSeverity, setEditSeverity] = useState<PathologySeverity>('medium');
  const [editDescription, setEditDescription] = useState('');

  // Open edit modal
  const handleEditClick = (category: PathologyCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditColor(category.color);
    setEditSeverity(category.severity);
    setEditDescription(category.description || '');
    setShowEditModal(true);
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    await updatePathologyCategory(editingCategory.id, {
      name: editName,
      color: editColor,
      severity: editSeverity,
      description: editDescription
    });

    setShowEditModal(false);
    setEditingCategory(null);
    onCategoriesChange();
  };

  // Toggle active
  const handleToggleActive = async (categoryId: string, currentActive: boolean) => {
    await togglePathologyCategoryActive(categoryId, !currentActive);
    onCategoriesChange();
  };

  // Delete category
  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) return;

    await deletePathologyCategory(categoryId);
    onCategoriesChange();
  };

  // Get severity label
  const getSeverityLabel = (severity: PathologySeverity) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };
    return labels[severity];
  };

  // Get severity badge color
  const getSeverityColor = (severity: PathologySeverity) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Categorias</h3>
        <p className="text-sm text-gray-500">{categories.length} categorias</p>
      </div>

      <div className="space-y-2">
        {categories.map(category => (
          <div
            key={category.id}
            className={`border rounded-lg p-4 ${!category.active ? 'opacity-50 bg-gray-50' : ''}`}
          >
            <div className="flex items-start gap-4">
              {/* Color Preview */}
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded border-2 border-gray-300"
                  style={{ backgroundColor: category.color }}
                  title={category.color}
                />
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(category.severity)}`}
                    >
                      {getSeverityLabel(category.severity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.color}</code>
                  <span className="text-xs text-gray-500">
                    Ordem: {category.order}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex items-center gap-2">
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(category.id, category.active)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title={category.active ? 'Desativar' : 'Ativar'}
                  >
                    {category.active ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEditClick(category)}
                    className="p-2 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="p-2 hover:bg-red-50 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria de Patologia</DialogTitle>
          </DialogHeader>

          {editingCategory && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label>Nome</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Desplacamento Crítico"
                />
              </div>

              {/* Color */}
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="#FF5733"
                    className="flex-1"
                  />
                </div>
                <div
                  className="mt-2 h-12 rounded border-2"
                  style={{ backgroundColor: editColor }}
                />
              </div>

              {/* Severity */}
              <div>
                <Label>Severidade</Label>
                <Select
                  value={editSeverity}
                  onValueChange={(v: PathologySeverity) => setEditSeverity(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição da patologia..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Salvar Alterações
                </Button>
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
