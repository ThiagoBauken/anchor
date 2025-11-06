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
  const [drawingMode, setDrawingMode] = useState<'rectangle' | 'polygon'>('rectangle'); // Default to rectangle for speed
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [rectangleStart, setRectangleStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [editingMarker, setEditingMarker] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(false); // Quick mode: mark now, describe later

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

    // Draw existing markers (SORTED BY ZINDEX - lower first, higher on top)
    const sortedMarkers = [...markers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    sortedMarkers.forEach(marker => {
      const category = categories.find(c => c.id === marker.categoryId);
      if (!category) return;

      const isHovered = hoveredMarker === marker.id;
      const isSelected = selectedMarker === marker.id;
      const alpha = isHovered || isSelected ? 0.5 : 0.3;

      // Draw based on geometry type
      if (marker.geometry.type === 'rectangle' && marker.geometry.x !== undefined && marker.geometry.y !== undefined && marker.geometry.width !== undefined && marker.geometry.height !== undefined) {
        // RECTANGLE drawing
        const x = marker.geometry.x * scaleX;
        const y = marker.geometry.y * scaleY;
        const width = marker.geometry.width * scaleX;
        const height = marker.geometry.height * scaleY;

        // Fill
        ctx.fillStyle = category.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(x, y, width, height);

        // Stroke
        ctx.strokeStyle = category.color;
        ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
        ctx.strokeRect(x, y, width, height);

        // Draw label
        if (isHovered || isSelected) {
          const centerX = x + width / 2;
          const centerY = y + height / 2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(centerX - 50, centerY - 15, 100, 30);

          ctx.fillStyle = 'white';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(category.name, centerX, centerY);
        }
      } else if (marker.geometry.points && marker.geometry.points.length >= 2) {
        // POLYGON drawing (original implementation)
        const points = marker.geometry.points;

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

        // Fill
        ctx.fillStyle = category.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Stroke
        ctx.strokeStyle = category.color;
        ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
        ctx.stroke();

        // Draw label
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
      }
    });

    // Draw current rectangle being drawn (PREVIEW)
    if (currentRect && selectedCategoryId) {
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category) {
        ctx.fillStyle = category.color + '4D'; // 30% opacity
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);

        ctx.strokeStyle = category.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line for preview
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
        ctx.setLineDash([]); // Reset dash
      }
    }

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
  }, [imageLoaded, imageObj, canvasSize, markers, categories, hoveredMarker, selectedMarker, currentPoints, currentRect, selectedCategoryId, facadeSide.imageWidth, facadeSide.imageHeight]);

  // Handle mouse down for RECTANGLE mode
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !selectedCategoryId || !canvasRef.current) return;
    if (drawingMode !== 'rectangle') return; // Only for rectangle mode

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRectangleStart({ x, y });
    setIsDrawing(true);
  };

  // Handle mouse up for RECTANGLE mode
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !selectedCategoryId || !canvasRef.current || !rectangleStart) return;
    if (drawingMode !== 'rectangle') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = x - rectangleStart.x;
    const height = y - rectangleStart.y;

    // Only create if rectangle has minimum size (10px)
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      finishRectangleDrawing(rectangleStart, { x, y });
    }

    // Reset rectangle drawing state
    setRectangleStart(null);
    setCurrentRect(null);
    setIsDrawing(false);
  };

  // Handle canvas click for POLYGON mode
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !selectedCategoryId || !canvasRef.current) return;
    if (drawingMode !== 'polygon') return; // Only for polygon mode

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
        finishPolygonDrawing();
        return;
      }
    }

    // Add point
    setCurrentPoints(prev => [...prev, { x, y }]);
    setIsDrawing(true);
  };

  // Handle double click to finish POLYGON
  const handleCanvasDoubleClick = () => {
    if (drawingMode === 'polygon' && currentPoints.length >= 3) {
      finishPolygonDrawing();
    }
  };

  // Finish RECTANGLE drawing and create marker
  const finishRectangleDrawing = async (start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!selectedCategoryId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scaleX = (facadeSide.imageWidth || imageObj?.width || canvas.width) / canvas.width;
    const scaleY = (facadeSide.imageHeight || imageObj?.height || canvas.height) / canvas.height;

    // Normalize rectangle (handle negative width/height)
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    // Scale back to original image coordinates
    const originalX = x * scaleX;
    const originalY = y * scaleY;
    const originalWidth = width * scaleX;
    const originalHeight = height * scaleY;

    const area = originalWidth * originalHeight;

    const category = categories.find(c => c.id === selectedCategoryId);

    // Find max zIndex and add 1 (new rectangles go on top by default)
    const maxZIndex = markers.reduce((max, m) => Math.max(max, m.zIndex || 0), 0);

    await onCreateMarker({
      facadeSideId: facadeSide.id,
      categoryId: selectedCategoryId,
      geometry: {
        type: 'rectangle',
        x: originalX,
        y: originalY,
        width: originalWidth,
        height: originalHeight
      },
      zIndex: maxZIndex + 1,
      area,
      severity: category?.severity || 'medium',
      status: 'PENDING',
      priority: 0,
      photos: []
    });

    // Reset drawing state
    setRectangleStart(null);
    setCurrentRect(null);
    setIsDrawing(false);
  };

  // Finish POLYGON drawing and create marker
  const finishPolygonDrawing = async () => {
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

    // Find max zIndex and add 1
    const maxZIndex = markers.reduce((max, m) => Math.max(max, m.zIndex || 0), 0);

    await onCreateMarker({
      facadeSideId: facadeSide.id,
      categoryId: selectedCategoryId,
      geometry: {
        type: 'polygon',
        points: originalPoints
      },
      zIndex: maxZIndex + 1,
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

  // Handle mouse move to detect hover and show rectangle preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If drawing rectangle, show preview
    if (isDrawing && rectangleStart && drawingMode === 'rectangle') {
      const width = x - rectangleStart.x;
      const height = y - rectangleStart.y;
      setCurrentRect({ x: rectangleStart.x, y: rectangleStart.y, width, height });
      return; // Don't check hover while drawing
    }

    const scaleX = canvas.width / (facadeSide.imageWidth || imageObj?.width || canvas.width);
    const scaleY = canvas.height / (facadeSide.imageHeight || imageObj?.height || canvas.height);

    // Check if mouse is over any marker (support both rectangles and polygons)
    let foundMarker: string | null = null;

    for (const marker of markers) {
      if (marker.geometry.type === 'rectangle' && marker.geometry.x !== undefined && marker.geometry.y !== undefined && marker.geometry.width !== undefined && marker.geometry.height !== undefined) {
        // Rectangle hit test
        const markerX = marker.geometry.x * scaleX;
        const markerY = marker.geometry.y * scaleY;
        const markerWidth = marker.geometry.width * scaleX;
        const markerHeight = marker.geometry.height * scaleY;

        if (x >= markerX && x <= markerX + markerWidth && y >= markerY && y <= markerY + markerHeight) {
          foundMarker = marker.id;
          break;
        }
      } else if (marker.geometry.points) {
        // Polygon hit test
        const points = marker.geometry.points.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));

        if (isPointInPolygon({ x, y }, points)) {
          foundMarker = marker.id;
          break;
        }
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

  // Cancel drawing (works for both modes)
  const cancelDrawing = () => {
    setCurrentPoints([]);
    setRectangleStart(null);
    setCurrentRect(null);
    setIsDrawing(false);
  };

  // Z-index controls
  const bringForward = async (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    const maxZIndex = markers.reduce((max, m) => Math.max(max, m.zIndex || 0), 0);
    if ((marker.zIndex || 0) < maxZIndex) {
      await onUpdateMarker(markerId, { zIndex: (marker.zIndex || 0) + 1 });
    }
  };

  const sendBackward = async (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    const minZIndex = markers.reduce((min, m) => Math.min(min, m.zIndex || 0), 0);
    if ((marker.zIndex || 0) > minZIndex) {
      await onUpdateMarker(markerId, { zIndex: (marker.zIndex || 0) - 1 });
    }
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
          {/* MODE TOGGLE - Large buttons for mobile */}
          {editable && !isDrawing && (
            <div className="mb-4 flex gap-3 flex-wrap">
              <Button
                onClick={() => setDrawingMode('rectangle')}
                variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
                className="h-14 px-6 text-base font-semibold"
              >
                📐 Retângulo (Rápido)
              </Button>
              <Button
                onClick={() => setDrawingMode('polygon')}
                variant={drawingMode === 'polygon' ? 'default' : 'outline'}
                className="h-14 px-6 text-base font-semibold"
              >
                ⬟ Polígono (Preciso)
              </Button>
              <Button
                onClick={() => setQuickMode(!quickMode)}
                variant={quickMode ? 'default' : 'outline'}
                className="h-14 px-6 text-base font-semibold"
              >
                {quickMode ? '⚡ Modo Rápido: ON' : '⏱️ Modo Normal'}
              </Button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseMove={handleMouseMove}
            className="border border-gray-300 rounded-lg cursor-crosshair touch-none"
            style={{ maxWidth: '100%', touchAction: 'none' }}
          />

          {/* Drawing status message */}
          {isDrawing && (
            <div className="mt-4 flex gap-2">
              {drawingMode === 'polygon' && (
                <Button onClick={finishPolygonDrawing} disabled={currentPoints.length < 3} className="h-12">
                  <Save className="w-5 h-5 mr-2" />
                  Finalizar Marcação ({currentPoints.length} pontos)
                </Button>
              )}
              {drawingMode === 'rectangle' && rectangleStart && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg">
                  <span className="text-blue-800 font-medium">Arraste para criar retângulo...</span>
                </div>
              )}
              <Button onClick={cancelDrawing} variant="outline" className="h-12">
                <X className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {selectedMarker && (
            <div className="mt-4 p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">Marcador Selecionado</h4>
                  {(() => {
                    const marker = markers.find(m => m.id === selectedMarker);
                    const category = marker ? categories.find(c => c.id === marker.categoryId) : null;

                    return marker && category ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>Tipo:</strong> {marker.geometry.type === 'rectangle' ? '📐 Retângulo' : '⬟ Polígono'}</p>
                        <p><strong>Categoria:</strong> <span style={{ color: category.color }}>{category.name}</span></p>
                        <p><strong>Severidade:</strong> {marker.severity}</p>
                        <p><strong>Camada (Z-Index):</strong> {marker.zIndex || 0}</p>
                        {marker.floor && <p><strong>Andar:</strong> {marker.floor}</p>}
                        {marker.area && <p><strong>Área:</strong> {marker.area.toFixed(2)} px²</p>}
                        {marker.description && <p><strong>Descrição:</strong> {marker.description}</p>}
                      </div>
                    ) : null;
                  })()}

                  {/* Z-INDEX CONTROLS */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => bringForward(selectedMarker)}
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs"
                    >
                      ⬆️ Trazer p/ Frente
                    </Button>
                    <Button
                      onClick={() => sendBackward(selectedMarker)}
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs"
                    >
                      ⬇️ Enviar p/ Trás
                    </Button>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMarker(selectedMarker)}
                  className="ml-2"
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
