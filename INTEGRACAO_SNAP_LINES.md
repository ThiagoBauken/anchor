# Integração das Snap Lines no Interactive Map

## Arquivos criados:
- `/src/hooks/useSnapLines.ts` - Hook para lógica de snap
- `/src/components/snap-lines-overlay.tsx` - Componente visual das linhas

## Passos para integrar no `interactive-map.tsx`:

### 1. Importar os novos módulos no topo do arquivo:

```typescript
import { useSnapLines } from '@/hooks/useSnapLines';
import { SnapLinesOverlay } from './snap-lines-overlay';
```

### 2. Adicionar o hook dentro do componente InteractiveMap (após os outros hooks):

```typescript
const { snapLines, getSnappedPosition, clearSnapLines, calculateSnapLines } = useSnapLines(filteredPoints);
const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
```

### 3. Modificar a função `handleMouseUp` para usar snap ao criar ponto:

Encontre a linha onde você calcula `clampedX` e `clampedY` (por volta da linha 343-344).

Substitua:
```typescript
const clampedX = Math.max(0, Math.min(localMapDimensions.width, finalX));
const clampedY = Math.max(0, Math.min(localMapDimensions.height, finalY));
```

Por:
```typescript
// Apply snapping
const snapped = getSnappedPosition(finalX, finalY);
const clampedX = Math.max(0, Math.min(localMapDimensions.width, snapped.x));
const clampedY = Math.max(0, Math.min(localMapDimensions.height, snapped.y));
```

### 4. Adicionar handler para mostrar snap lines ao mover o mouse:

Modifique a função `handleMouseMove` para adicionar antes do return:

```typescript
const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
  if (!isPanning || !svgRef.current) return;
  // ... código existente de panning ...

  // Adicione isto no final, antes do setStartPanPoint:
  if (!isPanning && canAddPoints) {
    try {
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const svgPoint = pt.matrixTransform(ctm.inverse());
        calculateSnapLines(svgPoint.x, svgPoint.y);
        setMousePosition({ x: svgPoint.x, y: svgPoint.y });
      }
    } catch (error) {
      // Silently fail
    }
  }

  setStartPanPoint({ x: e.clientX, y: e.clientY });
};
```

### 5. Limpar snap lines quando sair do mapa:

Modifique `handleMouseLeave`:

```typescript
const handleMouseLeave = () => {
  setIsPanning(false);
  hasDragged.current = false;
  clearSnapLines(); // Adicione esta linha
  setMousePosition(null); // Adicione esta linha
};
```

### 6. Renderizar as snap lines no SVG:

Encontre a tag `<svg>` e dentro do `<g transform={...}>`, ANTES de `<g id="pointMarkers">`, adicione:

```typescript
<g transform={`rotate(${rotation} ${localMapDimensions.width/2} ${localMapDimensions.height/2})`}>
  <image ... />

  {/* ADICIONE AQUI */}
  {!isExport && (
    <SnapLinesOverlay
      vertical={snapLines.vertical}
      horizontal={snapLines.horizontal}
      mapWidth={localMapDimensions.width}
      mapHeight={localMapDimensions.height}
      rotation={rotation}
    />
  )}

  {lineToolMode && ...}

  <g id="pointMarkers">
    ...
  </g>
</g>
```

## Pronto!

Agora as snap lines vão aparecer automaticamente quando você mover o mouse perto de outros pontos. O snap funciona em ambos os eixos (X e Y) independentemente.

### Como funciona:

- **Limite de distância**: 10 pixels
- **Visual**: Linhas azuis tracejadas
- **Comportamento**: Aparecem ao mover o mouse, desaparecem quando você sai da área ou afasta o mouse
- **Snap suave**: Ajuda mas não força - você pode ignorar movendo o mouse para longe das linhas
