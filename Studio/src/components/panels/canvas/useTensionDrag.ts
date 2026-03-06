import { useEffect } from 'react';
import type { ILayer } from '@/engine/types';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import type { TensionDragState, TimelineConfig } from './types';

/**
 * Hook to handle tension handle dragging for Bézier curve editing
 */
export function useTensionDrag(
  tensionDragState: TensionDragState | null,
  layers: ILayer[],
  updateKeyframeTension: (layerId: string, index: number, tension: number, interpolation: 'bezier') => void,
  config: TimelineConfig,
  setTensionDragState: (state: TensionDragState | null) => void
) {
  useEffect(() => {
    if (!tensionDragState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - tensionDragState.startY;
      
      const layer = layers.find(l => l.id === tensionDragState.layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return;
      
      const keyframe = layer.envelope[tensionDragState.keyframeIndex];
      if (!keyframe) return;
      
      // Find the next keyframe to calculate the value range
      const sortedKeyframes = [...layer.envelope].sort((a, b) => a.time - b.time);
      const currentIndex = sortedKeyframes.indexOf(keyframe);
      if (currentIndex === -1 || currentIndex >= sortedKeyframes.length - 1) return;
      
      const nextKeyframe = sortedKeyframes[currentIndex + 1];
      const valueDiff = nextKeyframe.value - keyframe.value;
      
      // Calculate tension change based on vertical drag
      // Dragging up (negative deltaY) = lower tension (convex - steep then flat)
      // Dragging down (positive deltaY) = higher tension (concave - flat then steep)
      const trackHeight = config.trackHeight - config.adjustmentLayerHeaderHeight;
      const sensitivity = 5; // High sensitivity for dramatic curves
      const tensionChange = (deltaY / trackHeight) * sensitivity;
      
      // Calculate new tension (0.1 to 10.0 for curves)
      // tension = 1 is linear, > 1 is concave, < 1 is convex
      const newTension = Math.max(0.1, Math.min(10, tensionDragState.originalTension + tensionChange));
      
      // Update the keyframe's tension
      updateKeyframeTension(tensionDragState.layerId, tensionDragState.keyframeIndex, newTension, 'bezier');
    };
    
    const handleMouseUp = () => {
      setTensionDragState(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [tensionDragState, layers, config, updateKeyframeTension, setTensionDragState]);
}
