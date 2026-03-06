import { useEffect } from 'react';
import type { ILayer } from '@/engine/types';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import type { EnvelopeDragState, TimelineConfig } from './types';

/**
 * Hook to handle envelope keyframe dragging
 */
export function useEnvelopeDrag(
  envelopeDragState: EnvelopeDragState | null,
  layers: ILayer[],
  updateEnvelopeKeyframe: (layerId: string, index: number, time?: number, value?: number) => void,
  config: TimelineConfig,
  setEnvelopeDragState: (state: EnvelopeDragState | null) => void
) {
  useEffect(() => {
    if (!envelopeDragState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - envelopeDragState.startX;
      const deltaY = e.clientY - envelopeDragState.startY;
      
      const layer = layers.find(l => l.id === envelopeDragState.layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return;
      
      // Calculate delta time (in milliseconds)
      const deltaTime = (deltaX / config.pixelsPerSecond) * 1000;
      
      // Calculate new time (clamped to layer duration)
      const newTime = Math.max(0, Math.min(
        envelopeDragState.originalTime + deltaTime,
        layer.duration
      ));
      
      // Calculate delta value from Y movement
      const trackIndex = layer.trackIndex !== undefined 
        ? layer.trackIndex 
        : layers.indexOf(layer) % config.numTracks;
      const clipHeight = config.trackHeight - 4;
      
      // Y is inverted (top = 1.0, bottom = 0.0)
      const deltaValue = -(deltaY / clipHeight);
      
      // Calculate new value (clamped to 0-1)
      const newValue = Math.max(0, Math.min(1, 
        envelopeDragState.originalValue + deltaValue
      ));
      
      // Update the keyframe
      updateEnvelopeKeyframe(
        envelopeDragState.layerId,
        envelopeDragState.keyframeIndex,
        newTime,
        newValue
      );
    };
    
    const handleMouseUp = () => {
      setEnvelopeDragState(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [envelopeDragState, layers, config, updateEnvelopeKeyframe, setEnvelopeDragState]);
}
