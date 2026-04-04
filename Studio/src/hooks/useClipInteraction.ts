import { useState, useEffect } from 'react';
import type { ILayer } from '@/engine/types';

interface ClipDragState {
  layerId: string;
  startX: number;
  originalStartTime: number;
  originalDuration: number;
  mode: 'move' | 'resize-left' | 'resize-right';
}

interface UseClipInteractionProps {
  layers: ILayer[];
  pixelsPerSecond: number;
  duration: number;
  updateLayer: (layerId: string, updates: Partial<ILayer>) => void;
  selectLayer: (layerId: string | null) => void;
}

interface UseClipInteractionResult {
  dragState: ClipDragState | null;
  handleClipMouseDown: (
    e: React.MouseEvent,
    layerId: string,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => void;
}

/**
 * Manages clip drag-move and resize interactions on the legacy HTML timeline.
 */
export function useClipInteraction({
  layers,
  pixelsPerSecond,
  duration,
  updateLayer,
  selectLayer,
}: UseClipInteractionProps): UseClipInteractionResult {
  const [dragState, setDragState] = useState<ClipDragState | null>(null);

  const handleClipMouseDown = (
    e: React.MouseEvent,
    layerId: string,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();

    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    selectLayer(layerId);

    setDragState({
      layerId,
      startX: e.clientX,
      originalStartTime: layer.startTime,
      originalDuration: layer.duration,
      mode,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = (deltaX / pixelsPerSecond) * 1000;

      const layer = layers.find((l) => l.id === dragState.layerId);
      if (!layer) return;

      if (dragState.mode === 'move') {
        const newStartTime = Math.max(
          0,
          Math.min(
            dragState.originalStartTime + deltaTime,
            duration - layer.duration
          )
        );
        updateLayer(dragState.layerId, { startTime: newStartTime });
      } else if (dragState.mode === 'resize-left') {
        const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime);
        const newDuration = Math.max(100, dragState.originalDuration - deltaTime);
        if (newStartTime + newDuration <= duration) {
          updateLayer(dragState.layerId, { startTime: newStartTime, duration: newDuration });
        }
      } else if (dragState.mode === 'resize-right') {
        const newDuration = Math.max(100, dragState.originalDuration + deltaTime);
        if (layer.startTime + newDuration <= duration) {
          updateLayer(dragState.layerId, { duration: newDuration });
        }
      }
    };

    const handleMouseUp = () => setDragState(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, layers, pixelsPerSecond, duration, updateLayer]);

  return { dragState, handleClipMouseDown };
}
