import React from 'react';

interface SnapLinesOverlayProps {
  vertical: number[];
  horizontal: number[];
  mapWidth: number;
  mapHeight: number;
  rotation?: number;
}

export function SnapLinesOverlay({
  vertical,
  horizontal,
  mapWidth,
  mapHeight,
  rotation = 0
}: SnapLinesOverlayProps) {
  if (vertical.length === 0 && horizontal.length === 0) {
    return null;
  }

  return (
    <g className="snap-lines" pointerEvents="none">
      {/* Vertical snap lines */}
      {vertical.map((x, i) => (
        <line
          key={`v-${i}-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={mapHeight}
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.6"
          style={{ transition: 'opacity 0.2s ease-in-out' }}
        />
      ))}

      {/* Horizontal snap lines */}
      {horizontal.map((y, i) => (
        <line
          key={`h-${i}-${y}`}
          x1={0}
          y1={y}
          x2={mapWidth}
          y2={y}
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.6"
          style={{ transition: 'opacity 0.2s ease-in-out' }}
        />
      ))}
    </g>
  );
}
