
"use client";

import { useAnchorData } from '@/context/AnchorDataContext';
import { useMemo, useState, useRef, WheelEvent, MouseEvent as ReactMouseEvent, useEffect, useCallback } from 'react';
import type { AnchorPoint, MarkerShape } from '@/types';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { PointForm } from './point-form';

const LABEL_OFFSET_THRESHOLD = 30; // Min distance between points to trigger alternating labels

type LabelPosition = 'top' | 'bottom' | 'left' | 'right';

const getStatusColor = (status: AnchorPoint['status']): string => {
  switch (status) {
    case 'Aprovado': return '#22c55e'; // green-500
    case 'Reprovado': return '#ef4444'; // red-500
    case 'Não Testado': default: return '#f59e0b'; // amber-500
  }
};

const getPointLabelPosition = (point: AnchorPoint, allPoints: AnchorPoint[], rotation: number): LabelPosition => {
    const neighbors = allPoints.filter(p => {
        if (p.id === point.id) return false;
        const dx = Math.abs(p.posicaoX - point.posicaoX);
        const dy = Math.abs(p.posicaoY - point.posicaoY);
        return dx < LABEL_OFFSET_THRESHOLD && dy < LABEL_OFFSET_THRESHOLD;
    });

    if (neighbors.length === 0) return 'top';

    const isMapViewedHorizontally = rotation === 0 || rotation === 180;
    
    let isHorizontalLine = neighbors.some(n => Math.abs(n.posicaoY - point.posicaoY) < 5);
    let isVerticalLine = neighbors.some(n => Math.abs(n.posicaoX - point.posicaoX) < 5);
    
    // Swap logic for rotated views
    if (!isMapViewedHorizontally) {
        [isHorizontalLine, isVerticalLine] = [isVerticalLine, isHorizontalLine];
    }

    // Prioritize horizontal alignment if points are aligned in both ways
    if (isHorizontalLine) {
        const pointsInLine = [point, ...allPoints.filter(p => Math.abs(p.posicaoY - point.posicaoY) < 5)];
        pointsInLine.sort((a, b) => a.posicaoX - b.posicaoX);
        const myIndex = pointsInLine.findIndex(p => p.id === point.id);
        return myIndex % 2 === 0 ? 'top' : 'bottom';
    }

    if (isVerticalLine) {
        const pointsInLine = [point, ...allPoints.filter(p => Math.abs(p.posicaoX - point.posicaoX) < 5)];
        pointsInLine.sort((a, b) => a.posicaoY - b.posicaoY);
        const myIndex = pointsInLine.findIndex(p => p.id === point.id);
        return myIndex % 2 === 0 ? 'left' : 'right';
    }

    return 'top'; // Default for diagonal or scattered close points
};

export function InteractiveMap({
    points,
    searchQuery = '',
    floorPlanImage,
    rotation = 0,
    markerSize = 4,
    labelFontSize = 10,
    onPointSelect,
    isExport = false,
    setMapDimensions,
    mapDimensions,
}: {
    points: AnchorPoint[],
    searchQuery?: string,
    floorPlanImage: string,
    rotation?: number,
    markerSize?: number,
    labelFontSize?: number,
    onPointSelect: (pointId: string) => void;
    isExport?: boolean;
    setMapDimensions: (dims: { width: number; height: number; }) => void;
    mapDimensions: { width: number; height: number; };
}) {
  const { 
    inspectionFlags, allPointsForProject, currentUser, showArchived, 
    lineToolMode, setLineToolStartPoint, setLineToolEndPoint, 
    lineToolStartPointId, lineToolEndPointId, getPointById,
    lineToolPreviewPoints, locations
  } = useAnchorData();
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pan and Zoom state
  const localMapDimensions = useMemo(() => mapDimensions || { width: 1200, height: 900 }, [mapDimensions]);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: localMapDimensions.width, height: localMapDimensions.height });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const hasDragged = useRef(false);
  
  const updateMapDimensions = useCallback(() => {
    if (floorPlanImage && setMapDimensions) {
      const img = document.createElement('img');
      img.src = floorPlanImage;
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        setMapDimensions(dims);
        setViewBox({ x: 0, y: 0, width: dims.width, height: dims.height });
      };
      img.onerror = () => {
        // Fallback if image fails to load
        const dims = { width: 1200, height: 900 };
        setMapDimensions(dims);
        setViewBox({ x: 0, y: 0, width: dims.width, height: dims.height });
      }
    }
  }, [floorPlanImage, setMapDimensions]);

  useEffect(() => {
    updateMapDimensions();
  }, [updateMapDimensions]);


  if (!floorPlanImage) {
    return (
      <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Nenhuma planta baixa selecionada. Adicione uma na aba 'Projetos'.</p>
      </div>
    );
  }

  const handlePointAdded = () => {
    setIsModalOpen(false);
    setClickCoords(null);
  }

  const handlePointMarkerClick = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation();
    if (lineToolMode) {
      if (!lineToolStartPointId) {
        setLineToolStartPoint(pointId);
      } else if (!lineToolEndPointId) {
        setLineToolEndPoint(pointId);
      } else {
         // If both are set, clicking another point resets the start point
         setLineToolStartPoint(pointId);
      }
      return;
    }
    onPointSelect(pointId);
  };
  
  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    if (!e.shiftKey || isExport) {
        return;
    }
    e.preventDefault();

    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = viewBox.width * scaleFactor;
    const newHeight = viewBox.height * scaleFactor;
    
    // Zoom limits
    if (newWidth > localMapDimensions.width * 5 || newWidth < localMapDimensions.width / 5) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x: mouseX, y: mouseY } = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const newX = viewBox.x + (mouseX - viewBox.x) * (1 - scaleFactor);
    const newY = viewBox.y + (mouseY - viewBox.y) * (1 - scaleFactor);

    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  };
  
  const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (e.button !== 0 || isExport) return; // Only pan with left-click
    hasDragged.current = false;
    setIsPanning(true);
    setStartPanPoint({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!isPanning || !svgRef.current) return;
    e.preventDefault();
    hasDragged.current = true;

    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const dx = (e.clientX - startPanPoint.x) / CTM.a;
    const dy = (e.clientY - startPanPoint.y) / CTM.d;

    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setStartPanPoint({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = (e: ReactMouseEvent<SVGSVGElement>) => {
     // Check for right-click and do nothing
    if (e.button !== 0) {
      setIsPanning(false);
      return;
    }
    if (hasDragged.current) {
        // This was a drag, so don't treat it as a click
        setIsPanning(false);
        hasDragged.current = false;
        return;
    }

    // This was a click
    setIsPanning(false);

    if (lineToolMode || currentUser?.role !== 'admin' || !svgRef.current) return;

    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const centerX = localMapDimensions.width / 2;
    const centerY = localMapDimensions.height / 2;
    const angleRad = -rotation * (Math.PI / 180);
    
    const clickedX = svgPoint.x;
    const clickedY = svgPoint.y;

    const translatedX = clickedX - centerX;
    const translatedY = clickedY - centerY;
    const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
    const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

    const finalX = rotatedX + centerX;
    const finalY = rotatedY + centerY;
    
    const clampedX = Math.max(0, Math.min(localMapDimensions.width, finalX));
    const clampedY = Math.max(0, Math.min(localMapDimensions.height, finalY));

    setClickCoords({ x: clampedX, y: clampedY });
    setIsModalOpen(true);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    hasDragged.current = false;
  };

  const PointMarker = ({ shape, cx, cy, size, color, stroke, strokeWidth, ...props }: { shape: MarkerShape, cx: number, cy: number, size: number, color: string, stroke?: string, strokeWidth?: number, [key: string]: any }) => {
    const s = size;
    switch (shape) {
      case 'x':
        return <path d={`M ${cx-s} ${cy-s} L ${cx+s} ${cy+s} M ${cx+s} ${cy-s} L ${cx-s} ${cy+s}`} stroke={color} strokeWidth={strokeWidth || 2} fill="none" className="group-hover:scale-125 transition-transform origin-center" {...props}/>;
      case '+':
        return <path d={`M ${cx-s} ${cy} L ${cx+s} ${cy} M ${cx} ${cy-s} L ${cx} ${cy+s}`} stroke={color} strokeWidth={strokeWidth || 2} fill="none" className="group-hover:scale-125 transition-transform origin-center" {...props}/>;
      case 'square':
        return <rect x={cx-s} y={cy-s} width={s*2} height={s*2} fill={color} stroke={stroke || "hsl(var(--card))"} strokeWidth={strokeWidth || 1} className="group-hover:scale-110 transition-transform origin-center" {...props}/>;
      case 'circle':
      default:
        return <circle cx={cx} cy={cy} r={size} fill={color} stroke={stroke || "hsl(var(--card))"} strokeWidth={strokeWidth || 1} className="group-hover:scale-110 transition-transform origin-center" {...props}/>;
    }
  }

  const lineToolPoints = useMemo(() => {
    const startPoint = lineToolStartPointId ? getPointById(lineToolStartPointId) : null;
    const endPoint = lineToolEndPointId ? getPointById(lineToolEndPointId) : null;
    return { startPoint, endPoint };
  }, [lineToolStartPointId, lineToolEndPointId, getPointById]);


  const canAddPoints = currentUser?.role === 'admin' && !lineToolMode;
  const cursorClass = isExport ? '' : (canAddPoints ? 'cursor-crosshair' : (isPanning ? 'cursor-grabbing' : 'cursor-grab'));

  return (
    <>
      <div 
        className={`relative w-full overflow-hidden rounded-lg border bg-background/50 p-2 ${cursorClass}`}
        id="map-container"
        style={isExport ? { width: `${localMapDimensions.width}px`, height: `${localMapDimensions.height}px` } : {}}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
      >
        <svg 
            ref={svgRef}
            viewBox={isExport ? `0 0 ${localMapDimensions.width} ${localMapDimensions.height}` : `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            className="w-full h-auto"
            width={localMapDimensions.width}
            height={localMapDimensions.height}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            id={isExport ? 'floor-plan-map-for-export' : 'floor-plan-map'}
        >
            <g transform={`rotate(${rotation} ${localMapDimensions.width/2} ${localMapDimensions.height/2})`}>
                <image href={floorPlanImage} x="0" y="0" width={localMapDimensions.width} height={localMapDimensions.height} />
                
                {lineToolMode && lineToolPoints.startPoint && lineToolPoints.endPoint && (
                    <g>
                        <line x1={lineToolPoints.startPoint.posicaoX} y1={lineToolPoints.startPoint.posicaoY} x2={lineToolPoints.endPoint.posicaoX} y2={lineToolPoints.endPoint.posicaoY} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5" />
                        {lineToolPreviewPoints.map((pos, index) => (
                          <PointMarker key={`preview-${index}`} shape="circle" cx={pos.x} cy={pos.y} size={markerSize} color="#3b82f6" stroke="#fff" strokeWidth={1} style={{ opacity: 0.7 }} />
                        ))}
                    </g>
                )}

                <g id="pointMarkers">
                    {points.map(point => {
                        const svgX = point.posicaoX;
                        const svgY = point.posicaoY;
                        const needsInspection = inspectionFlags.includes(point.id);
                        const isHighlighted = searchQuery.length > 0 && point.numeroPonto.toLowerCase().includes(searchQuery.toLowerCase());
                        const isLineToolSelection = point.id === lineToolStartPointId || point.id === lineToolEndPointId;
                        const highlightColor = '#3b82f6'; // blue-500
                        const pointColor = getStatusColor(point.status);
                        
                        const locationStyle = locations.find(loc => loc.name === point.localizacao);
                        const markerShape: MarkerShape = locationStyle?.markerShape || 'circle';

                        const labelPosition = getPointLabelPosition(point, points, rotation);
                        let textX = svgX;
                        let textY = svgY;
                        let textAnchor: "middle" | "end" | "start" = "middle";
                        let dominantBaseline: "middle" | "auto" = "auto";
                        
                        const labelOffset = markerSize + 4;
                        
                        // New logic to handle rotation for text label positioning
                        let adjustedRotation = rotation % 360;
                        if (adjustedRotation < 0) adjustedRotation += 360;

                        const getRotatedPosition = (pos: LabelPosition) => {
                             if (adjustedRotation === 90) {
                                if (pos === 'top') return 'left';
                                if (pos === 'bottom') return 'right';
                                if (pos === 'left') return 'bottom';
                                if (pos === 'right') return 'top';
                            }
                            if (adjustedRotation === 180) {
                                if (pos === 'top') return 'bottom';
                                if (pos === 'bottom') return 'top';
                                if (pos === 'left') return 'right';
                                if (pos === 'right') return 'left';
                            }
                            if (adjustedRotation === 270) {
                                if (pos === 'top') return 'right';
                                if (pos === 'bottom') return 'left';
                                if (pos === 'left') return 'top';
                                if (pos === 'right') return 'bottom';
                            }
                            return pos;
                        }
                        
                        const finalLabelPosition = getRotatedPosition(labelPosition);


                        switch (finalLabelPosition) {
                            case 'top':
                                textY -= labelOffset;
                                break;
                            case 'bottom':
                                textY += labelOffset + 2; // +2 for better spacing below
                                break;
                            case 'left':
                                textX -= labelOffset;
                                textAnchor = "end";
                                dominantBaseline = "middle";
                                break;
                            case 'right':
                                textX += labelOffset;
                                textAnchor = "start";
                                dominantBaseline = "middle";
                                break;
                        }

                        return (
                            <g key={point.id} onClick={(e) => handlePointMarkerClick(e, point.id)} className={`group ${lineToolMode ? 'cursor-crosshair' : 'cursor-pointer'}`}>
                                {isLineToolSelection && (
                                     <circle cx={svgX} cy={svgY} r={markerSize + 6} fill={highlightColor} className="opacity-50 animate-pulse" />
                                )}
                                {markerShape === 'circle' && (
                                    <circle cx={svgX} cy={svgY} r={markerSize + 2} fill={isHighlighted ? highlightColor : pointColor} className="opacity-30 group-hover:opacity-50" />
                                )}
                                {needsInspection && !isHighlighted && markerShape === 'circle' && (
                                    <circle cx={svgX} cy={svgY} r={markerSize + 2} fill="none" stroke="#f59e0b" strokeWidth="2">
                                        <animate attributeName="r" from={markerSize + 2} to={markerSize + 7} dur="1.5s" begin="0s" repeatCount="indefinite"/>
                                        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                                    </circle>
                                )}
                                
                                <PointMarker shape={markerShape} cx={svgX} cy={svgY} size={markerSize} color={isHighlighted ? highlightColor : pointColor} />

                                <g transform={`rotate(${-rotation} ${svgX} ${svgY})`}>
                                   <text x={textX} y={textY} textAnchor={textAnchor} dominantBaseline={dominantBaseline} className="font-bold fill-black stroke-white stroke-[0.5px] paint-order-stroke select-none pointer-events-none" style={{ fontSize: `${labelFontSize}px` }}>{point.numeroPonto}</text>
                                </g>
                            </g>
                        )
                    })}
                    {currentUser?.role === 'admin' && showArchived && allPointsForProject.filter(p => p.archived).map(point => {
                        return (
                            <g key={point.id} onClick={(e) => handlePointMarkerClick(e, point.id)} className="cursor-pointer group">
                                <circle cx={point.posicaoX} cy={point.posicaoY} r={markerSize} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" className="group-hover:stroke-destructive transition-colors" />
                                <text x={point.posicaoX} y={point.posicaoY + (markerSize/2)} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-400 select-none pointer-events-none group-hover:fill-destructive transition-colors">X</text>
                            </g>
                        )
                    })}
                </g>
            </g>
        </svg>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Ponto de Ancoragem</DialogTitle>
                <DialogDescription>Preencha os dados do novo ponto.</DialogDescription>
            </DialogHeader>
            {clickCoords && <PointForm initialX={clickCoords.x} initialY={clickCoords.y} onPointAdded={handlePointAdded} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
