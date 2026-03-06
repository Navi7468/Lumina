import { useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import type { ClipDragState, HoverState, TimelineConfig, EnvelopeDragState, TensionDragState } from './canvas/types';
import { useCanvasRender } from './canvas/useCanvasRender';
import { useClipDrag } from './canvas/useClipDrag';
import { useEnvelopeDrag } from './canvas/useEnvelopeDrag';
import { useTensionDrag } from './canvas/useTensionDrag';
import { useMouseWheelZoom, useResizeObserver } from './canvas/useCanvasEvents';
import { 
  createRulerHandlers, 
  createMainCanvasHandlers, 
  createScrollHandler,
  createEnvelopeHandlers,
} from './canvas/canvasHandlers';

/**
 * Canvas-based Timeline implementation
 * Fixed grid system with pre-made "Layers" (rows) inspired by FL Studio
 * Note: Grid "Layers" are just visual rows - not to be confused with effect layers
 */
interface CanvasTimelineProps {
  zoom: number; // Zoom percentage (50-300%)
  setZoom: (zoom: number) => void; // Setter for zoom
}

export function CanvasTimeline({ zoom, setZoom }: CanvasTimelineProps) {
  const { 
    project, 
    setPlayhead, 
    updateLayer, 
    selectLayer,
    addEnvelopeKeyframe,
    updateEnvelopeKeyframe,
    updateKeyframeTension,
  } = useProjectStore();
  const { playhead, config, layers, selectedLayerId } = project;
  
  // Canvas refs
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelsCanvasRef = useRef<HTMLCanvasElement>(null);
  const cornerCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const labelsScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  
  // State
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [clipDragState, setClipDragState] = useState<ClipDragState | null>(null);
  const [envelopeDragState, setEnvelopeDragState] = useState<EnvelopeDragState | null>(null);
  const [tensionDragState, setTensionDragState] = useState<TensionDragState | null>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [, setResizeTrigger] = useState(0);
  const [trackHeight, setTrackHeight] = useState(48);
  
  // Timeline configuration
  const timelineConfig: TimelineConfig = {
    pixelsPerSecond: zoom,
    trackLabelWidth: 80,
    numTracks: 25,
    rulerHeight: 24,
    trackHeight,
    adjustmentLayerHeaderHeight: 18, // Header area for dragging/resizing adjustment layers
  };
  
  // Canvas refs bundle
  const canvasRefs = {
    mainCanvasRef,
    rulerCanvasRef,
    labelsCanvasRef,
    cornerCanvasRef,
    containerRef,
    rulerScrollRef,
    labelsScrollRef,
    mainScrollRef,
  };
  
  // Use custom hooks
  useCanvasRender(canvasRefs, timelineConfig, config, layers, selectedLayerId, playhead, hoverState);
  useClipDrag(clipDragState, layers, updateLayer, timelineConfig, config.duration, setClipDragState);
  useEnvelopeDrag(envelopeDragState, layers, updateEnvelopeKeyframe, timelineConfig, setEnvelopeDragState);
  useTensionDrag(tensionDragState, layers, updateKeyframeTension, timelineConfig, setTensionDragState);
  useMouseWheelZoom(containerRef, zoom, setZoom, trackHeight, setTrackHeight);
  useResizeObserver(containerRef, setResizeTrigger);
  
  // Event handlers
  const rulerHandlers = createRulerHandlers(
    rulerCanvasRef,
    setIsDraggingPlayhead,
    setPlayhead,
    timelineConfig.pixelsPerSecond,
    config.duration
  );
  
  const mainCanvasHandlers = createMainCanvasHandlers(
    mainCanvasRef,
    mainScrollRef,
    layers,
    setClipDragState,
    setHoverState,
    selectLayer,
    timelineConfig,
    clipDragState
  );
  
  const envelopeHandlers = createEnvelopeHandlers(
    mainCanvasRef,
    mainScrollRef,
    layers,
    selectedLayerId,
    setEnvelopeDragState,
    setTensionDragState,
    updateEnvelopeKeyframe,
    addEnvelopeKeyframe,
    timelineConfig
  );
  
  // Combined mouse down handler (envelope takes priority for selected adjustment layers)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Try envelope interaction first
    const handledByEnvelope = envelopeHandlers.handleEnvelopeMouseDown(e);
    if (handledByEnvelope) return;
    
    // Fall back to clip interaction
    mainCanvasHandlers.handleMainCanvasMouseDown(e);
  };
  
  const handleScroll = createScrollHandler(rulerScrollRef, labelsScrollRef);
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Canvas container with sticky headers */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Corner canvas (top-left, fixed) */}
        <div className="absolute top-0 left-0 z-30">
          <canvas
            ref={cornerCanvasRef}
            className="border-r border-b border-border"
          />
        </div>
        
        {/* Ruler canvas (top, scrolls horizontally) */}
        <div 
          className="absolute top-0 left-0 right-0 z-20 overflow-hidden"
          style={{ marginLeft: `${timelineConfig.trackLabelWidth}px`, height: `${timelineConfig.rulerHeight}px` }}
        >
          <div ref={rulerScrollRef} className="overflow-x-scroll overflow-y-hidden scrollbar-hide" style={{ height: `${timelineConfig.rulerHeight + 20}px` }}>
            <canvas
              ref={rulerCanvasRef}
              className="border-b border-border cursor-pointer"
              onMouseDown={rulerHandlers.handleRulerMouseDown}
              onMouseMove={(e) => rulerHandlers.handleRulerMouseMove(e, isDraggingPlayhead)}
              onMouseUp={rulerHandlers.handleRulerMouseUp}
              onMouseLeave={rulerHandlers.handleRulerMouseLeave}
              style={{ 
                cursor: isDraggingPlayhead ? 'grabbing' : 'crosshair'
              }}
            />
          </div>
        </div>
        
        {/* Labels canvas (left, scrolls vertically) */}
        <div 
          className="absolute top-0 left-0 bottom-0 z-20 overflow-hidden"
          style={{ marginTop: `${timelineConfig.rulerHeight}px`, width: `${timelineConfig.trackLabelWidth}px` }}
        >
          <div ref={labelsScrollRef} className="overflow-y-scroll overflow-x-hidden scrollbar-hide" style={{ width: `${timelineConfig.trackLabelWidth + 20}px`, height: '100%' }}>
            <canvas
              ref={labelsCanvasRef}
              className="border-r border-border"
            />
          </div>
        </div>
        
        {/* Main canvas (scrolls both ways) */}
        <div 
          ref={mainScrollRef}
          className="absolute overflow-auto"
          onScroll={handleScroll}
          style={{ 
            top: `${timelineConfig.rulerHeight}px`, 
            left: `${timelineConfig.trackLabelWidth}px`, 
            right: 0, 
            bottom: 0 
          }}
        >
          <canvas
            ref={mainCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={mainCanvasHandlers.handleMainCanvasMouseMove}
            onMouseLeave={mainCanvasHandlers.handleMainCanvasMouseLeave}
            style={{ 
              cursor: clipDragState 
                ? 'grabbing' 
                : envelopeDragState
                  ? 'grabbing'
                  : hoverState 
                    ? (hoverState.mode === 'move' ? 'grab' : 'ew-resize')
                    : 'default' 
            }}
          />
        </div>
      </div>
      
      {/* Status bar / info */}
      <div className="px-3 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        Canvas Timeline • {timelineConfig.numTracks} grid layers • {layers.length} effect layers • {(playhead / 1000).toFixed(2)}s / {(config.duration / 1000).toFixed(2)}s
      </div>
    </div>
  );
}
