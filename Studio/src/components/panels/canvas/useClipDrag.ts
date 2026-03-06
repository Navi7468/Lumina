import { useEffect } from 'react';
import type { ILayer } from '@/engine/types';
import type { ClipDragState, TimelineConfig } from './types';

/**
 * Hook to handle clip dragging (move and resize)
 */
export function useClipDrag(
  clipDragState: ClipDragState | null,
  layers: ILayer[],
  updateLayer: (layerId: string, updates: Partial<ILayer>) => void,
  config: TimelineConfig,
  maxDuration: number,
  setClipDragState: (state: ClipDragState | null) => void
) {
  useEffect(() => {
    if (!clipDragState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - clipDragState.startX;
      const deltaY = e.clientY - clipDragState.startY;
      const deltaTime = (deltaX / config.pixelsPerSecond) * 1000;
      
      const layer = layers.find(l => l.id === clipDragState.layerId);
      if (!layer) return;
      
      if (clipDragState.mode === 'move') {
        // Calculate new start time
        const newStartTime = Math.max(0, Math.min(
          clipDragState.originalStartTime + deltaTime,
          maxDuration - layer.duration
        ));
        
        // Update position
        updateLayer(clipDragState.layerId, { startTime: newStartTime });
        
        // Vertical track movement - calculate new track index (0-24)
        const trackDelta = Math.round(deltaY / config.trackHeight);
        const currentTrack = clipDragState.originalTrackIndex;
        const newTrack = Math.max(0, Math.min(config.numTracks - 1, currentTrack + trackDelta));
        
        // Update the layer's track position (use trackIndex property)
        if (newTrack !== currentTrack) {
          updateLayer(clipDragState.layerId, { trackIndex: newTrack } as any);
        }
        
      } else if (clipDragState.mode === 'resize-left') {
        const newStartTime = Math.max(0, clipDragState.originalStartTime + deltaTime);
        const newDuration = Math.max(100, clipDragState.originalDuration - deltaTime);
        
        // Ensure doesn't go past end
        if (newStartTime + newDuration <= maxDuration) {
          updateLayer(clipDragState.layerId, { 
            startTime: newStartTime,
            duration: newDuration
          });
        }
      } else if (clipDragState.mode === 'resize-right') {
        const newDuration = Math.max(100, clipDragState.originalDuration + deltaTime);
        
        // Ensure doesn't exceed timeline
        if (layer.startTime + newDuration <= maxDuration) {
          updateLayer(clipDragState.layerId, { duration: newDuration });
        }
      }
    };
    
    const handleMouseUp = () => {
      setClipDragState(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clipDragState, layers, config, maxDuration, updateLayer, setClipDragState]);
}
