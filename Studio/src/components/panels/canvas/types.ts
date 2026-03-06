export interface ClipDragState {
  layerId: string;
  startX: number;
  startY: number;
  originalStartTime: number;
  originalDuration: number;
  originalTrackIndex: number;
  scrollLeft: number;
  scrollTop: number;
  mode: 'move' | 'resize-left' | 'resize-right';
}

export interface HoverState {
  layerId: string;
  mode: 'move' | 'resize-left' | 'resize-right';
}

export interface EnvelopeDragState {
  layerId: string;
  keyframeIndex: number;
  startX: number;
  startY: number;
  originalTime: number;
  originalValue: number;
  scrollLeft: number;
  scrollTop: number;
}

export interface TensionDragState {
  layerId: string;
  keyframeIndex: number; // Index of the keyframe that owns this tension (the one BEFORE the segment)
  startY: number;
  originalTension: number;
  scrollTop: number;
}

export interface CanvasRefs {
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  rulerCanvasRef: React.RefObject<HTMLCanvasElement>;
  labelsCanvasRef: React.RefObject<HTMLCanvasElement>;
  cornerCanvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  rulerScrollRef: React.RefObject<HTMLDivElement>;
  labelsScrollRef: React.RefObject<HTMLDivElement>;
  mainScrollRef: React.RefObject<HTMLDivElement>;
}

export interface TimelineConfig {
  pixelsPerSecond: number;
  trackLabelWidth: number;
  numTracks: number;
  rulerHeight: number;
  trackHeight: number;
  adjustmentLayerHeaderHeight: number; // Height of header area for drag/resize (leaves envelope area free)
}
