import type { ILayer } from '@/engine/types';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import type { TimelineConfig, ClipDragState, HoverState, EnvelopeDragState, TensionDragState } from './types';

/**
 * Create ruler mouse event handlers
 */
export function createRulerHandlers(
  rulerCanvasRef: React.RefObject<HTMLCanvasElement>,
  setIsDraggingPlayhead: (value: boolean) => void,
  setPlayhead: (time: number) => void,
  pixelsPerSecond: number,
  maxDuration: number
) {
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = rulerCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    setIsDraggingPlayhead(true);
    const time = (x / pixelsPerSecond) * 1000;
    setPlayhead(Math.max(0, Math.min(time, maxDuration)));
  };

  const handleRulerMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, isDragging: boolean) => {
    if (!isDragging) return;
    
    const canvas = rulerCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const time = (x / pixelsPerSecond) * 1000;
    setPlayhead(Math.max(0, Math.min(time, maxDuration)));
  };

  const handleRulerMouseUp = () => {
    setIsDraggingPlayhead(false);
  };

  const handleRulerMouseLeave = () => {
    setIsDraggingPlayhead(false);
  };
  
  return {
    handleRulerMouseDown,
    handleRulerMouseMove,
    handleRulerMouseUp,
    handleRulerMouseLeave,
  };
}

/**
 * Create main canvas mouse event handlers for clip interaction
 */
export function createMainCanvasHandlers(
  mainCanvasRef: React.RefObject<HTMLCanvasElement>,
  mainScrollRef: React.RefObject<HTMLDivElement>,
  layers: ILayer[],
  setClipDragState: (state: ClipDragState | null) => void,
  setHoverState: (state: HoverState | null) => void,
  selectLayer: (layerId: string | null) => void,
  config: TimelineConfig,
  clipDragState: ClipDragState | null
) {
  const RESIZE_HANDLE_WIDTH = 8;
  
  const handleMainCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    const scrollContainer = mainScrollRef.current;
    if (!canvas || !scrollContainer) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollContainer.scrollLeft;
    const y = e.clientY - rect.top + scrollContainer.scrollTop;
    
    // Check if clicked on a clip
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.locked) continue;
      
      const trackIndex = layer.trackIndex !== undefined ? layer.trackIndex : (i % config.numTracks);
      const trackY = trackIndex * config.trackHeight;
      
      const clipX = (layer.startTime / 1000) * config.pixelsPerSecond;
      const clipWidth = (layer.duration / 1000) * config.pixelsPerSecond;
      const clipY = trackY + 2;
      const clipHeight = config.trackHeight - 4;
      
      // Check if click is within this clip
      if (x >= clipX && x <= clipX + clipWidth && y >= clipY && y <= clipY + clipHeight) {
        selectLayer(layer.id);
        
        // For adjustment layers, only allow dragging/resizing in the header area
        // This leaves the envelope area free for envelope interaction
        const isAdjustmentLayer = layer instanceof AdjustmentLayer;
        if (isAdjustmentLayer) {
          const headerHeight = config.adjustmentLayerHeaderHeight;
          const headerBottom = clipY + headerHeight;
          
          // If clicking below the header (in envelope area), skip this layer for dragging
          if (y > headerBottom) {
            continue; // Let envelope handler take over
          }
        }
        
        // Determine drag mode
        let mode: 'move' | 'resize-left' | 'resize-right' = 'move';
        
        if (x <= clipX + RESIZE_HANDLE_WIDTH) {
          mode = 'resize-left';
        } else if (x >= clipX + clipWidth - RESIZE_HANDLE_WIDTH) {
          mode = 'resize-right';
        }
        
        setClipDragState({
          layerId: layer.id,
          startX: e.clientX,
          startY: e.clientY,
          originalStartTime: layer.startTime,
          originalDuration: layer.duration,
          originalTrackIndex: trackIndex,
          scrollLeft: scrollContainer.scrollLeft,
          scrollTop: scrollContainer.scrollTop,
          mode,
        });
        
        return;
      }
    }
  };
  
  const handleMainCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (clipDragState) return; // Don't update hover while dragging
    
    const canvas = mainCanvasRef.current;
    const scrollContainer = mainScrollRef.current;
    if (!canvas || !scrollContainer) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollContainer.scrollLeft;
    const y = e.clientY - rect.top + scrollContainer.scrollTop;
    
    // Check if hovering over a clip
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.locked) continue;
      
      const trackIndex = layer.trackIndex !== undefined ? layer.trackIndex : (i % config.numTracks);
      const trackY = trackIndex * config.trackHeight;
      
      const clipX = (layer.startTime / 1000) * config.pixelsPerSecond;
      const clipWidth = (layer.duration / 1000) * config.pixelsPerSecond;
      const clipY = trackY + 2;
      const clipHeight = config.trackHeight - 4;
      
      // Check if hover is within this clip
      if (x >= clipX && x <= clipX + clipWidth && y >= clipY && y <= clipY + clipHeight) {
        // For adjustment layers, only show hover state in the header area
        const isAdjustmentLayer = layer instanceof AdjustmentLayer;
        if (isAdjustmentLayer) {
          const headerHeight = config.adjustmentLayerHeaderHeight;
          const headerBottom = clipY + headerHeight;
          
          // If hovering below the header (in envelope area), skip this layer for hover state
          if (y > headerBottom) {
            continue; // Don't show drag cursor in envelope area
          }
        }
        
        // Determine hover mode
        let mode: 'move' | 'resize-left' | 'resize-right' = 'move';
        
        if (x <= clipX + RESIZE_HANDLE_WIDTH) {
          mode = 'resize-left';
        } else if (x >= clipX + clipWidth - RESIZE_HANDLE_WIDTH) {
          mode = 'resize-right';
        }
        
        setHoverState({ layerId: layer.id, mode });
        return;
      }
    }
    
    // Not hovering over any clip
    setHoverState(null);
  };
  
  const handleMainCanvasMouseLeave = () => {
    setHoverState(null);
  };
  
  return {
    handleMainCanvasMouseDown,
    handleMainCanvasMouseMove,
    handleMainCanvasMouseLeave,
  };
}

/**
 * Create scroll sync handler
 */
export function createScrollHandler(
  rulerScrollRef: React.RefObject<HTMLDivElement>,
  labelsScrollRef: React.RefObject<HTMLDivElement>
) {
  return (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    
    // Sync horizontal scroll for ruler
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = container.scrollLeft;
    }
    
    // Sync vertical scroll for labels
    if (labelsScrollRef.current) {
      labelsScrollRef.current.scrollTop = container.scrollTop;
    }
  };
}

/**
 * Create envelope editing handlers for adjustment layers
 */
export function createEnvelopeHandlers(
  mainCanvasRef: React.RefObject<HTMLCanvasElement>,
  mainScrollRef: React.RefObject<HTMLDivElement>,
  layers: ILayer[],
  selectedLayerId: string | null,
  setEnvelopeDragState: (state: EnvelopeDragState | null) => void,
  setTensionDragState: (state: TensionDragState | null) => void,
  updateEnvelopeKeyframe: (layerId: string, index: number, time?: number, value?: number) => void,
  addEnvelopeKeyframe: (layerId: string, time: number, value: number) => void,
  config: TimelineConfig
) {
  const KEYFRAME_HIT_RADIUS = 6; // Click detection radius for keyframe dots
  const TENSION_HIT_RADIUS = 8; // Click detection radius for tension handles (increased for easier clicking)
  
  /**
   * Check if a click is near a keyframe control point
   */
  const findKeyframeAtPosition = (
    layer: AdjustmentLayer,
    clickX: number,
    clickY: number,
    clipX: number,
    clipY: number,
    clipWidth: number,
    clipHeight: number
  ): number | null => {
    if (!layer.envelope) return null;
    
    for (let i = 0; i < layer.envelope.length; i++) {
      const kf = layer.envelope[i];
      const kfX = clipX + (kf.time / layer.duration) * clipWidth;
      const kfY = clipY + clipHeight * (1 - kf.value);
      
      const distance = Math.sqrt(
        Math.pow(clickX - kfX, 2) + Math.pow(clickY - kfY, 2)
      );
      
      if (distance <= KEYFRAME_HIT_RADIUS) {
        return i;
      }
    }
    
    return null;
  };
  
  /**
   * Check if a click is near a tension handle (Bézier control point)
   * Returns the index of the keyframe that owns this tension handle (the one BEFORE the segment)
   */
  const findTensionHandleAtPosition = (
    layer: AdjustmentLayer,
    clickX: number,
    clickY: number,
    clipX: number,
    clipY: number,
    clipWidth: number,
    clipHeight: number
  ): number | null => {
    if (!layer.envelope || layer.envelope.length < 2) return null;
    
    const sortedKeyframes = [...layer.envelope].sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const kf1 = sortedKeyframes[i];
      const kf2 = sortedKeyframes[i + 1];
      
      // Only check if this segment uses bezier interpolation
      if (kf1.interpolation !== 'bezier') {
        continue;
      }
      
      const tension = kf1.tension !== undefined ? kf1.tension : 1.0;
      
      // Calculate tension handle position on the power curve at t=0.5
      const kf1X = clipX + (kf1.time / layer.duration) * clipWidth;
      const kf1Y = clipY + clipHeight * (1 - kf1.value);
      const kf2X = clipX + (kf2.time / layer.duration) * clipWidth;
      const kf2Y = clipY + clipHeight * (1 - kf2.value);
      
      const t = 0.5;
      const poweredT = Math.pow(t, tension);
      const controlValue = kf1.value + (kf2.value - kf1.value) * poweredT;
      const controlY = clipY + clipHeight * (1 - controlValue);
      const controlX = kf1X + (kf2X - kf1X) * t;
      
      const distance = Math.sqrt(
        Math.pow(clickX - controlX, 2) + Math.pow(clickY - controlY, 2)
      );
      
      if (distance <= TENSION_HIT_RADIUS) {
        return layer.envelope.indexOf(kf1);
      }
    }
    
    return null;
  };
  
  /**
   * Check if a click is on the envelope curve (for adding keyframes)
   */
  const isClickOnEnvelopeCurve = (
    layer: AdjustmentLayer,
    clickX: number,
    clickY: number,
    clipX: number,
    clipY: number,
    clipWidth: number,
    clipHeight: number
  ): { time: number; value: number } | null => {
    if (!layer.envelope || layer.envelope.length < 2) return null;
    
    // Check if click is within clip bounds
    if (clickX < clipX || clickX > clipX + clipWidth) return null;
    if (clickY < clipY || clickY > clipY + clipHeight) return null;
    
    // Calculate time and value from click position
    const relativeX = clickX - clipX;
    const relativeY = clickY - clipY;
    
    const clickTime = (relativeX / clipWidth) * layer.duration;
    const clickValue = 1 - (relativeY / clipHeight);
    
    // Get interpolated envelope value at this time
    const sortedKeyframes = [...layer.envelope].sort((a, b) => a.time - b.time);
    
    // Find surrounding keyframes
    let beforeKf = null;
    let afterKf = null;
    
    for (let i = 0; i < sortedKeyframes.length; i++) {
      if (sortedKeyframes[i].time <= clickTime) {
        beforeKf = sortedKeyframes[i];
      }
      if (sortedKeyframes[i].time >= clickTime && !afterKf) {
        afterKf = sortedKeyframes[i];
        break;
      }
    }
    
    if (!beforeKf || !afterKf) return null;
    
    // Calculate interpolated value at click time
    const t = (clickTime - beforeKf.time) / (afterKf.time - beforeKf.time);
    let interpolatedValue: number;
    
    if (beforeKf.interpolation === 'step') {
      interpolatedValue = beforeKf.value;
    } else if (beforeKf.interpolation === 'ease') {
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      interpolatedValue = beforeKf.value + (afterKf.value - beforeKf.value) * easedT;
    } else if (beforeKf.interpolation === 'bezier') {
      const tension = beforeKf.tension !== undefined ? beforeKf.tension : 1.0;
      const poweredT = Math.pow(t, tension);
      interpolatedValue = beforeKf.value + (afterKf.value - beforeKf.value) * poweredT;
    } else {
      // Linear
      interpolatedValue = beforeKf.value + (afterKf.value - beforeKf.value) * t;
    }
    
    // Check if click Y is close to the curve (within 8 pixels)
    const interpolatedY = clipY + clipHeight * (1 - interpolatedValue);
    const distanceToCurve = Math.abs(clickY - interpolatedY);
    
    if (distanceToCurve <= 8) {
      return { time: clickTime, value: Math.max(0, Math.min(1, clickValue)) };
    }
    
    return null;
  };
  
  const handleEnvelopeMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
    const canvas = mainCanvasRef.current;
    const scrollContainer = mainScrollRef.current;
    if (!canvas || !scrollContainer) return false;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollContainer.scrollLeft;
    const y = e.clientY - rect.top + scrollContainer.scrollTop;
    
    // Only handle adjustment layers
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || !(selectedLayer instanceof AdjustmentLayer)) return false;
    
    const trackIndex = selectedLayer.trackIndex !== undefined 
      ? selectedLayer.trackIndex 
      : layers.indexOf(selectedLayer) % config.numTracks;
    const trackY = trackIndex * config.trackHeight;
    
    const clipX = (selectedLayer.startTime / 1000) * config.pixelsPerSecond;
    const clipWidth = (selectedLayer.duration / 1000) * config.pixelsPerSecond;
    const clipY = trackY + 2;
    const clipHeight = config.trackHeight - 4;
    
    // For adjustment layers, only interact with the envelope area (below the header)
    const headerHeight = config.adjustmentLayerHeaderHeight;
    const envelopeY = clipY + headerHeight;
    const envelopeHeight = clipHeight - headerHeight;
    
    // Check if click is within the envelope area bounds
    if (x < clipX || x > clipX + clipWidth || y < envelopeY || y > envelopeY + envelopeHeight) {
      return false;
    }
    
    // First priority: Check if clicking on a tension handle
    const tensionHandleIndex = findTensionHandleAtPosition(selectedLayer, x, y, clipX, envelopeY, clipWidth, envelopeHeight);
    
    if (tensionHandleIndex !== null) {
      // Start dragging the tension handle
      const kf = selectedLayer.envelope[tensionHandleIndex];
      setTensionDragState({
        layerId: selectedLayer.id,
        keyframeIndex: tensionHandleIndex,
        startY: e.clientY,
        originalTension: kf.tension !== undefined ? kf.tension : 0.5,
        scrollTop: scrollContainer.scrollTop,
      });
      return true;
    }
    
    // Second priority: Check if clicking on an existing keyframe (use envelope area coordinates)
    const keyframeIndex = findKeyframeAtPosition(selectedLayer, x, y, clipX, envelopeY, clipWidth, envelopeHeight);
    
    if (keyframeIndex !== null) {
      // Start dragging this keyframe
      const kf = selectedLayer.envelope[keyframeIndex];
      setEnvelopeDragState({
        layerId: selectedLayer.id,
        keyframeIndex,
        startX: e.clientX,
        startY: e.clientY,
        originalTime: kf.time,
        originalValue: kf.value,
        scrollLeft: scrollContainer.scrollLeft,
        scrollTop: scrollContainer.scrollTop,
      });
      return true;
    }
    
    // If not clicking a keyframe, check if clicking on the curve (use envelope area coordinates)
    const curveHit = isClickOnEnvelopeCurve(selectedLayer, x, y, clipX, envelopeY, clipWidth, envelopeHeight);
    
    if (curveHit) {
      // Add a new keyframe at this position
      addEnvelopeKeyframe(selectedLayer.id, curveHit.time, curveHit.value);
      return true;
    }
    
    return false;
  };
  
  return {
    handleEnvelopeMouseDown,
    findKeyframeAtPosition,
  };
}
