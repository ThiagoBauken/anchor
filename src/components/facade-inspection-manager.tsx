'use client';

import React, { useState, useEffect } from 'react';
import {
  FacadeInspection,
  FacadeSide,
  PathologyCategory,
  PathologyMarker,
  InspectionStatus,
  FacadeSideType,
  PathologySeverity
} from '@/types';
import {
  getInspectionsForProject,
  createFacadeInspection,
  updateFacadeInspection,
  deleteFacadeInspection,
  createFacadeSide,
  updateFacadeSide,
  deleteFacadeSide,
  getPathologyCategoriesForProject,
  createPathologyCategory,
  seedDefaultPathologyCategories,
  createPathologyMarker,
  updatePathologyMarker,
  deletePathologyMarker,
  getPathologyMarkersForFacadeSide
} from '@/app/actions/facade-inspection-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FacadeMarkerCanvas } from './facade-marker-canvas';
import { PathologyCategoryEditor } from './pathology-category-editor';
import { FloorDivisionConfig } from './floor-division-config';
import { PathologyMarkerForm } from './pathology-marker-form';
import { Plus, Upload, Trash2, Eye, Edit2, MapPin, Settings } from 'lucide-react';

interface FacadeInspectionManagerProps {
  projectId: string;
  companyId: string;
  currentUserId: string;
  canEdit?: boolean;
}

export function FacadeInspectionManager({
  projectId,
  companyId,
  currentUserId,
  canEdit = true
}: FacadeInspectionManagerProps) {
  const [inspections, setInspections] = useState<FacadeInspection[]>([]);
  const [categories, setCategories] = useState<PathologyCategory[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<FacadeInspection | null>(null);
  const [selectedFacadeSide, setSelectedFacadeSide] = useState<FacadeSide | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [markers, setMarkers] = useState<PathologyMarker[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [showAddSideModal, setShowAddSideModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryEditorModal, setShowCategoryEditorModal] = useState(false);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [editingMarker, setEditingMarker] = useState<PathologyMarker | null>(null);

  // Form states
  const [newInspectionName, setNewInspectionName] = useState('');
  const [newInspectionDescription, setNewInspectionDescription] = useState('');

  const [newSideName, setNewSideName] = useState('');
  const [newSideType, setNewSideType] = useState<FacadeSideType>('front');
  const [newSideImage, setNewSideImage] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#FF5733');
  const [newCategorySeverity, setNewCategorySeverity] = useState<PathologySeverity>('medium');

  // Load data
  useEffect(() => {
    loadData();
  }, [projectId, companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspectionsData, categoriesData] = await Promise.all([
        getInspectionsForProject(projectId),
        getPathologyCategoriesForProject(projectId)
      ]);

      setInspections(inspectionsData as any);
      setCategories(categoriesData as any);

      // Seed default categories if none exist
      if (categoriesData.length === 0) {
        const seededCategories = await seedDefaultPathologyCategories(projectId);
        setCategories(seededCategories as any);
      }
    } catch (error) {
      console.error('❌ Error loading facade inspections:', error);
      // Set empty arrays on error so UI shows "no inspections" instead of eternal loading
      setInspections([]);
      setCategories([]);
    } finally {
      // Always stop loading, even if there's an error
      setLoading(false);
    }
  };

  // Load markers for selected facade side
  useEffect(() => {
    if (selectedFacadeSide) {
      loadMarkersForSide(selectedFacadeSide.id);
    }
  }, [selectedFacadeSide]);

  const loadMarkersForSide = async (facadeSideId: string) => {
    const markersData = await getPathologyMarkersForFacadeSide(facadeSideId);
    setMarkers(markersData as any);
  };

  // Create inspection
  const handleCreateInspection = async () => {
    if (!newInspectionName.trim()) return;

    const inspection = await createFacadeInspection(
      projectId,
      newInspectionName,
      currentUserId,
      newInspectionDescription || undefined
    );

    if (inspection) {
      setInspections(prev => [inspection as any, ...prev]);
      setNewInspectionName('');
      setNewInspectionDescription('');
      setShowNewInspectionModal(false);
    }
  };

  // Create facade side
  const handleCreateFacadeSide = async () => {
    if (!selectedInspection || !newSideName.trim() || !newSideImage) return;

    const img = new Image();
    img.onload = async () => {
      const side = await createFacadeSide(
        selectedInspection.id,
        newSideName,
        newSideType,
        newSideImage,
        (selectedInspection.facadeSides?.length || 0) + 1,
        {
          imageWidth: img.width,
          imageHeight: img.height
        }
      );

      if (side) {
        // Update inspection with new side
        const updatedInspection = {
          ...selectedInspection,
          facadeSides: [...(selectedInspection.facadeSides || []), side]
        };
        setSelectedInspection(updatedInspection as any);
        setInspections(prev =>
          prev.map(i => i.id === selectedInspection.id ? updatedInspection as any : i)
        );

        setNewSideName('');
        setNewSideType('front');
        setNewSideImage('');
        setShowAddSideModal(false);
      }
    };
    img.src = newSideImage;
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSideImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const category = await createPathologyCategory(
      projectId,  // ← CORRIGIDO: Deve ser projectId, não companyId
      newCategoryName,
      newCategoryColor,
      newCategorySeverity,
      categories.length + 1
    );

    if (category) {
      setCategories(prev => [...prev, category as any]);
      setNewCategoryName('');
      setNewCategoryColor('#FF5733');
      setNewCategorySeverity('medium');
      setShowCategoryModal(false);
    }
  };

  // Update Floor/Division configuration
  const handleUpdateFloorDivisionConfig = async (floors: string[], divisions: string[]) => {
    if (!selectedFacadeSide) return;

    const updated = await updateFacadeSide(selectedFacadeSide.id, {
      availableFloors: floors,
      availableDivisions: divisions
    });

    if (updated) {
      setSelectedFacadeSide(updated as any);
      // Update in inspections list
      if (selectedInspection) {
        const updatedInspection = {
          ...selectedInspection,
          facadeSides: selectedInspection.facadeSides?.map(side =>
            side.id === selectedFacadeSide.id ? updated : side
          )
        };
        setSelectedInspection(updatedInspection as any);
        setInspections(prev =>
          prev.map(i => i.id === selectedInspection.id ? updatedInspection as any : i)
        );
      }
    }
  };

  // Create marker
  const handleCreateMarker = async (markerData: Omit<PathologyMarker, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedFacadeSide) return;

    const marker = await createPathologyMarker(
      markerData.facadeSideId,
      markerData.categoryId,
      markerData.geometry,
      currentUserId,
      {
        zIndex: markerData.zIndex,
        area: markerData.area,
        floor: markerData.floor,
        division: markerData.division,
        severity: markerData.severity,
        description: markerData.description,
        observations: markerData.observations,
        status: markerData.status,
        priority: markerData.priority,
        photos: markerData.photos
      }
    );

    if (marker) {
      setMarkers(prev => [...prev, marker as any]);
    }
  };

  // Update marker
  const handleUpdateMarker = async (markerId: string, data: Partial<PathologyMarker>) => {
    const marker = await updatePathologyMarker(markerId, data);
    if (marker) {
      setMarkers(prev => prev.map(m => m.id === markerId ? marker as any : m));
    }
  };

  // Delete marker
  const handleDeleteMarker = async (markerId: string) => {
    const success = await deletePathologyMarker(markerId);
    if (success) {
      setMarkers(prev => prev.filter(m => m.id !== markerId));
    }
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando inspeções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inspeções de Fachada</h2>
        <div className="flex gap-2">
          {/* Manage Categories Button */}
          <Dialog open={showCategoryEditorModal} onOpenChange={setShowCategoryEditorModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias de Patologias</DialogTitle>
              </DialogHeader>
              <PathologyCategoryEditor
                categories={categories}
                onCategoriesChange={loadData}
                canEdit={canEdit}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria de Patologia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Fissura, Infiltração..."
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Select value={newCategorySeverity} onValueChange={(v: any) => setNewCategorySeverity(v)}>
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
                <Button onClick={handleCreateCategory} className="w-full">Criar Categoria</Button>
              </div>
            </DialogContent>
          </Dialog>

          {canEdit && (
            <Dialog open={showNewInspectionModal} onOpenChange={setShowNewInspectionModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Inspeção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Inspeção de Fachada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newInspectionName}
                      onChange={(e) => setNewInspectionName(e.target.value)}
                      placeholder="Ex: Inspeção Q1 2025"
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={newInspectionDescription}
                      onChange={(e) => setNewInspectionDescription(e.target.value)}
                      placeholder="Detalhes da inspeção..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateInspection} className="w-full">Criar Inspeção</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Inspections List */}
      {inspections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Nenhuma inspeção de fachada criada</p>
          {canEdit && (
            <Button onClick={() => setShowNewInspectionModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Inspeção
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {inspections.map(inspection => (
          <div key={inspection.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{inspection.name}</h3>
                {inspection.description && (
                  <p className="text-sm text-gray-600">{inspection.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getStatusBadgeVariant(inspection.status)}>
                    {inspection.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {inspection.facadeSides?.length || 0} lados fotografados
                  </span>
                </div>
              </div>
              <Button
                variant={selectedInspection?.id === inspection.id ? 'default' : 'outline'}
                onClick={() => setSelectedInspection(
                  selectedInspection?.id === inspection.id ? null : inspection
                )}
              >
                {selectedInspection?.id === inspection.id ? 'Ocultar' : 'Ver Detalhes'}
              </Button>
            </div>

            {selectedInspection?.id === inspection.id && (
              <div className="mt-4 space-y-4">
                {/* Add Facade Side Button */}
                {canEdit && (
                  <Dialog open={showAddSideModal} onOpenChange={setShowAddSideModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Adicionar Foto de Fachada
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Foto de Fachada</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={newSideName}
                            onChange={(e) => setNewSideName(e.target.value)}
                            placeholder="Ex: Fachada Norte"
                          />
                        </div>
                        <div>
                          <Label>Lado</Label>
                          <Select value={newSideType} onValueChange={(v: FacadeSideType) => setNewSideType(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="front">Frente</SelectItem>
                              <SelectItem value="back">Atrás</SelectItem>
                              <SelectItem value="left">Esquerda</SelectItem>
                              <SelectItem value="right">Direita</SelectItem>
                              <SelectItem value="internal">Interna</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Foto</Label>
                          <Input type="file" accept="image/*" onChange={handleImageUpload} />
                          {newSideImage && (
                            <img src={newSideImage} alt="Preview" className="mt-2 max-w-full h-48 object-contain border rounded" />
                          )}
                        </div>
                        <Button onClick={handleCreateFacadeSide} className="w-full" disabled={!newSideImage}>
                          Adicionar Fachada
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Facade Sides */}
                <div className="space-y-4">
                  {inspection.facadeSides?.map(side => (
                    <div key={side.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{side.name}</h4>
                        <Button
                          variant={selectedFacadeSide?.id === side.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedFacadeSide(
                            selectedFacadeSide?.id === side.id ? null : side
                          )}
                        >
                          {selectedFacadeSide?.id === side.id ? 'Ocultar Canvas' : 'Marcar Patologias'}
                        </Button>
                      </div>

                      {selectedFacadeSide?.id === side.id && (
                        <div className="space-y-4">
                          {/* Floor/Division Configuration */}
                          <div className="flex justify-end">
                            <FloorDivisionConfig
                              availableFloors={side.availableFloors || []}
                              availableDivisions={side.availableDivisions || []}
                              onUpdateConfig={handleUpdateFloorDivisionConfig}
                              disabled={!canEdit}
                            />
                          </div>

                          {/* Category Selector */}
                          <div>
                            <Label>Selecione a Categoria de Patologia:</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              {categories.filter(c => c.active).map(category => (
                                <button
                                  key={category.id}
                                  onClick={() => setSelectedCategoryId(
                                    selectedCategoryId === category.id ? null : category.id
                                  )}
                                  className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                                    selectedCategoryId === category.id
                                      ? 'border-black'
                                      : 'border-gray-200 hover:border-gray-400'
                                  }`}
                                  style={{
                                    backgroundColor: selectedCategoryId === category.id
                                      ? category.color + '20'
                                      : 'transparent',
                                    color: category.color
                                  }}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Canvas */}
                          <FacadeMarkerCanvas
                            facadeSide={side}
                            categories={categories}
                            markers={markers}
                            onCreateMarker={handleCreateMarker}
                            onUpdateMarker={handleUpdateMarker}
                            onDeleteMarker={handleDeleteMarker}
                            selectedCategoryId={selectedCategoryId}
                            editable={canEdit}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
