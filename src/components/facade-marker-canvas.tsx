'use client';

import React, { useRef, useEffect, useState } from 'react';
import { PathologyCategory, PathologyMarker, FacadeSide } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Save, X } from 'lucide-react';

interface FacadeMarkerCanvasProps {
  facadeSide: FacadeSide;
  categories: PathologyCategory[];
  markers: PathologyMarker[];
  onCreateMarker: (marker: Omit<PathologyMarker, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateMarker: (markerId: string, data: Partial<PathologyMarker>) => Promise<void>;
  onDeleteMarker: (markerId: string) => Promise<void>;
  selectedCategoryId: string | null;
  editable?: boolean;
}

export function FacadeMarkerCanvas({
  facadeSide,
  categories,
  markers,
  onCreateMarker,
  onUpdateMarker,
  onDeleteMarker,
  selectedCategoryId,
  editable = true
}: FacadeMarkerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [editingMarker, setEditingMarker] = useState<string | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      setImageLoaded(true);

      // Calculate canvas size to fit container while maintaining aspect ratio
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = img.width / img.height;
        const canvasWidth = Math.min(containerWidth, img.width);
        const canvasHeight = canvasWidth / aspectRatio;

        setCanvasSize({ width: canvasWidth, height: canvasHeight });
      }
    };
    img.src = facadeSide.image;
  }, [facadeSide.image]);

  // Draw canvas
  useEffect(() => {
    if (!imageLoaded || !imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    // Calculate scale factors
    const scaleX = canvas.width / (facadeSide.imageWidth || imageObj.width);
    const scaleY = canvas.height / (facadeSide.imageHeight || imageObj.height);

    // Draw existing markers
    markers.forEach(marker => {
      const category = categories.find(c => c.id === marker.categoryId);
      if (!category) return;

      const points = marker.geometry.points;
      if (points.length < 2) return;

      // Scale points to canvas size
      const scaledPoints = points.map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }));

      // Draw polygon
      ctx.beginPath();
      ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
      scaledPoints.forEach((point, idx) => {
        if (idx > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();

      // Fill with category color
      const isHovered = hoveredMarker === marker.id;
      const isSelected = selectedMarker === marker.id;
      const alpha = isHovered || isSelected ? 0.5 : 0.3;

      ctx.fillStyle = category.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();

      // Stroke
      ctx.strokeStyle = category.color;
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.stroke();

      // Draw label with category name
      if (isHovered || isSelected) {
        const centerX = scaledPoints.reduce((sum, p) => sum + p.x, 0) / scaledPoints.length;
        const centerY = scaledPoints.reduce((sum, p) => sum + p.y, 0) / scaledPoints.length;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(centerX - 50, centerY - 15, 100, 30);

        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(category.name, centerX, centerY);
      }
    });

    // Draw current polygon being drawn
    if (currentPoints.length > 0 && selectedCategoryId) {
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach((point, idx) => {
          if (idx > 0) ctx.lineTo(point.x, point.y);
        });

        ctx.strokeStyle = category.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        currentPoints.forEach((point, idx) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? category.color : 'white';
          ctx.fill();
          ctx.strokeStyle = category.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    }
  }, [imageLoaded, imageObj, canvasSize, markers, categories, hoveredMarker, selectedMarker, currentPoints, selectedCategoryId, facadeSide.imageWidth, facadeSide.imageHeight]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !selectedCategoryId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on the first point to close polygon
    if (currentPoints.length >= 3) {
      const firstPoint = currentPoints[0];
      const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));

      if (distance < 10) {
        // Close polygon and create marker
        finishDrawing();
        return;
      }
    }

    // Add point
    setCurrentPoints(prev => [...prev, { x, y }]);
    setIsDrawing(true);
  };

  // Handle double click to finish
  const handleCanvasDoubleClick = () => {
    if (currentPoints.length >= 3) {
      finishDrawing();
    }
  };

  // Finish drawing and create marker
  const finishDrawing = async () => {
    if (!selectedCategoryId || currentPoints.length < 3 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scaleX = (facadeSide.imageWidth || imageObj?.width || canvas.width) / canvas.width;
    const scaleY = (facadeSide.imageHeight || imageObj?.height || canvas.height) / canvas.height;

    // Scale points back to original image coordinates
    const originalPoints = currentPoints.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY
    }));

    // Calculate area (simplified polygon area formula)
    const area = calculatePolygonArea(originalPoints);

    const category = categories.find(c => c.id === selectedCategoryId);

    await onCreateMarker({
      facadeSideId: facadeSide.id,
      categoryId: selectedCategoryId,
      geometry: { points: originalPoints },
      area,
      severity: category?.severity || 'medium',
      status: 'PENDING',
      priority: 0,
      photos: []
    });

    // Reset drawing state
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  // Calculate polygon area
  const calculatePolygonArea = (points: { x: number; y: number }[]): number => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  // Handle mouse move to detect hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / (facadeSide.imageWidth || imageObj?.width || canvas.width);
    const scaleY = canvas.height / (facadeSide.imageHeight || imageObj?.height || canvas.height);

    // Check if mouse is over any marker
    let foundMarker: string | null = null;

    for (const marker of markers) {
      const points = marker.geometry.points.map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }));

      if (isPointInPolygon({ x, y }, points)) {
        foundMarker = marker.id;
        break;
      }
    }

    setHoveredMarker(foundMarker);
  };

  // Point in polygon test
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Cancel drawing
  const cancelDrawing = () => {
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  // Handle marker click
  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(selectedMarker === markerId ? null : markerId);
  };

  // Delete marker
  const handleDeleteMarker = async (markerId: string) => {
    await onDeleteMarker(markerId);
    setSelectedMarker(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {!imageLoaded && (
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Carregando imagem...</p>
        </div>
      )}

      {imageLoaded && (
        <>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseMove={handleMouseMove}
            className="border border-gray-300 rounded-lg cursor-crosshair"
            style={{ maxWidth: '100%' }}
          />

          {isDrawing && (
            <div className="mt-4 flex gap-2">
              <Button onClick={finishDrawing} disabled={currentPoints.length < 3}>
                <Save className="w-4 h-4 mr-2" />
                Finalizar Marcação ({currentPoints.length} pontos)
              </Button>
              <Button onClick={cancelDrawing} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {selectedMarker && (
            <div className="mt-4 p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">Marcador Selecionado</h4>
                  {(() => {
                    const marker = markers.find(m => m.id === selectedMarker);
                    const category = marker ? categories.find(c => c.id === marker.categoryId) : null;

                    return marker && category ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>Categoria:</strong> <span style={{ color: category.color }}>{category.name}</span></p>
                        <p><strong>Severidade:</strong> {marker.severity}</p>
                        {marker.floor && <p><strong>Andar:</strong> {marker.floor}</p>}
                        {marker.area && <p><strong>Área:</strong> {marker.area.toFixed(2)} px²</p>}
                        {marker.description && <p><strong>Descrição:</strong> {marker.description}</p>}
                      </div>
                    ) : null;
                  })()}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMarker(selectedMarker)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {!selectedCategoryId && editable && !isDrawing && (
            <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Selecione uma categoria de patologia para começar a desenhar marcadores
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
