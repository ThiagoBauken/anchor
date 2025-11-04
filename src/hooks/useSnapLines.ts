import { useState, useCallback } from 'react';
import { AnchorPoint } from '@/types';

interface SnapLines {
  vertical: number[];
  horizontal: number[];
}

interface SnappedPosition {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

const SNAP_THRESHOLD = 10; // pixels

export function useSnapLines(points: AnchorPoint[]) {
  const [snapLines, setSnapLines] = useState<SnapLines>({ vertical: [], horizontal: [] });
  const [isSnapping, setIsSnapping] = useState(false);

  const calculateSnapLines = useCallback((mouseX: number, mouseY: number, excludePointId?: string) => {
    const verticalLines: number[] = [];
    const horizontalLines: number[] = [];

    points.forEach(point => {
      // Don't snap to the point being moved
      if (point.id === excludePointId) return;
      if (point.archived) return; // Don't snap to archived points

      // Check if mouse is close to this point's X coordinate
      if (Math.abs(point.posicaoX - mouseX) < SNAP_THRESHOLD) {
        verticalLines.push(point.posicaoX);
      }

      // Check if mouse is close to this point's Y coordinate
      if (Math.abs(point.posicaoY - mouseY) < SNAP_THRESHOLD) {
        horizontalLines.push(point.posicaoY);
      }
    });

    // Remove duplicates
    const uniqueVertical = [...new Set(verticalLines)];
    const uniqueHorizontal = [...new Set(horizontalLines)];

    setSnapLines({
      vertical: uniqueVertical,
      horizontal: uniqueHorizontal
    });

    setIsSnapping(uniqueVertical.length > 0 || uniqueHorizontal.length > 0);

    return {
      vertical: uniqueVertical,
      horizontal: uniqueHorizontal
    };
  }, [points]);

  const getSnappedPosition = useCallback((
    mouseX: number,
    mouseY: number,
    excludePointId?: string
  ): SnappedPosition => {
    const lines = calculateSnapLines(mouseX, mouseY, excludePointId);

    let snappedX = mouseX;
    let snappedY = mouseY;
    let hasSnappedX = false;
    let hasSnappedY = false;

    // Snap to nearest vertical line
    if (lines.vertical.length > 0) {
      const nearestVertical = lines.vertical.reduce((prev, curr) =>
        Math.abs(curr - mouseX) < Math.abs(prev - mouseX) ? curr : prev
      );
      if (Math.abs(nearestVertical - mouseX) < SNAP_THRESHOLD) {
        snappedX = nearestVertical;
        hasSnappedX = true;
      }
    }

    // Snap to nearest horizontal line
    if (lines.horizontal.length > 0) {
      const nearestHorizontal = lines.horizontal.reduce((prev, curr) =>
        Math.abs(curr - mouseY) < Math.abs(prev - mouseY) ? curr : prev
      );
      if (Math.abs(nearestHorizontal - mouseY) < SNAP_THRESHOLD) {
        snappedY = nearestHorizontal;
        hasSnappedY = true;
      }
    }

    return {
      x: snappedX,
      y: snappedY,
      snappedX: hasSnappedX,
      snappedY: hasSnappedY
    };
  }, [calculateSnapLines]);

  const clearSnapLines = useCallback(() => {
    setSnapLines({ vertical: [], horizontal: [] });
    setIsSnapping(false);
  }, []);

  return {
    snapLines,
    isSnapping,
    calculateSnapLines,
    getSnappedPosition,
    clearSnapLines
  };
}
