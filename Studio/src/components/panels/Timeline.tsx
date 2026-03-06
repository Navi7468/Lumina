import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, StepBack, StepForward, ZoomIn, ZoomOut, Layers, Repeat } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '@/store/projectStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import { cn } from '@/lib/utils';
import { CanvasTimeline } from './CanvasTimeline';

interface ClipDragState {
  layerId: string;
  startX: number;
  originalStartTime: number;
  originalDuration: number;
  mode: 'move' | 'resize-left' | 'resize-right';
}

export function Timeline() {
  const { project, isPlaying, setPlayhead, play, pause, stop, toggleLoop, skipToEnd, stepBackward, stepForward, updateLayer, selectLayer } = useProjectStore();
  const { playhead, config, layers, selectedLayerId, loop } = project;
  const { timelineRenderer } = usePreferencesStore();
  
  const [zoom, setZoom] = useState(100); // zoom percentage (50-300%)
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dragState, setDragState] = useState<ClipDragState | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  
  // Calculate pixel width based on zoom percentage
  const pixelsPerSecond = zoom; // 100% = 100px per second
  const timelineWidth = (config.duration / 1000) * pixelsPerSecond; // px
  const playheadPosition = (playhead / 1000) * pixelsPerSecond; // px
  
  const handleRulerInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = (x / pixelsPerSecond) * 1000;
    setPlayhead(Math.max(0, Math.min(time, config.duration)));
  };
  
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    setIsDraggingPlayhead(true);
    handleRulerInteraction(e);
  };
  
  const handleClipMouseDown = (
    e: React.MouseEvent,
    layerId: string,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    
    const layer = layers.find(l => l.id === layerId);
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
  
  // Handle playhead dragging
  useEffect(() => {
    if (!isDraggingPlayhead) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const time = (x / pixelsPerSecond) * 1000;
      setPlayhead(Math.max(0, Math.min(time, config.duration)));
    };
    
    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, scrollOffset, pixelsPerSecond, config.duration, setPlayhead]);
  
  // Handle clip dragging
  useEffect(() => {
    if (!dragState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = (deltaX / pixelsPerSecond) * 1000;
      
      const layer = layers.find(l => l.id === dragState.layerId);
      if (!layer) return;
      
      if (dragState.mode === 'move') {
        const newStartTime = Math.max(0, Math.min(
          dragState.originalStartTime + deltaTime,
          config.duration - layer.duration
        ));
        updateLayer(dragState.layerId, { startTime: newStartTime });
      } else if (dragState.mode === 'resize-left') {
        const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime);
        const newDuration = Math.max(100, dragState.originalDuration - deltaTime);
        
        // Ensure doesn't go past end
        if (newStartTime + newDuration <= config.duration) {
          updateLayer(dragState.layerId, { 
            startTime: newStartTime,
            duration: newDuration
          });
        }
      } else if (dragState.mode === 'resize-right') {
        const newDuration = Math.max(100, dragState.originalDuration + deltaTime);
        
        // Ensure doesn't exceed timeline
        if (layer.startTime + newDuration <= config.duration) {
          updateLayer(dragState.layerId, { duration: newDuration });
        }
      }
    };
    
    const handleMouseUp = () => {
      setDragState(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, layers, zoom, config.duration, updateLayer]);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollOffset(scrollLeft);
    
    // Sync ruler scroll
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scrollLeft;
    }
  };
  
  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
  };
  
  // Generate time markers for ruler
  const getTimeMarkers = () => {
    const markers: number[] = [];
    const duration = config.duration / 1000; // in seconds
    
    // Adjust interval based on zoom level
    let markerInterval = 1; // default 1 second
    if (zoom < 50) markerInterval = 5;
    else if (zoom < 80) markerInterval = 2;
    else if (zoom > 200) markerInterval = 0.5;
    
    for (let t = 0; t <= duration; t += markerInterval) {
      markers.push(t);
    }
    
    return markers;
  };
  
  return (
    <div className="border-t border-border bg-background flex flex-col h-full select-none overflow-hidden min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-1 border-b border-border bg-muted/30">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={stop}
          title="Stop (Go to Beginning)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={stepBackward}
          title="Step Backward One Frame"
        >
          <StepBack className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          className="h-6 w-6"
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={stepForward}
          title="Step Forward One Frame"
        >
          <StepForward className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={skipToEnd}
          title="Skip to End"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        <span className="text-xs tabular-nums">
          {formatTime(playhead)} / {formatTime(config.duration)}
        </span>
        
        <div className="flex-1" />
        
        <Button
          size="icon"
          variant={loop ? "default" : "ghost"}
          className="h-6 w-6"
          onClick={toggleLoop}
          title={loop ? "Loop Enabled" : "Loop Disabled"}
        >
          <Repeat className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          title="Zoom Out"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        
        <span className="text-xs text-muted-foreground w-12 text-center">
          {zoom}%
        </span>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setZoom(Math.min(300, zoom + 10))}
          title="Zoom In"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Timeline Content - Conditionally render based on preference */}
      {timelineRenderer === 'canvas' ? (
        <CanvasTimeline zoom={zoom} setZoom={setZoom} />
      ) : (
        <>
          {/* Time Ruler */}
          <div className="h-6 bg-muted/50 border-b border-border overflow-hidden relative flex">
        {/* Spacer for track labels */}
        <div className="w-24 border-r border-border/50 bg-background shrink-0" />
        
        {/* Ruler marks */}
        <div
          ref={rulerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative scrollbar-hide cursor-pointer"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleRulerMouseDown}
        >
          <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
            {getTimeMarkers().map((time) => {
              const pos = time * pixelsPerSecond;
              return (
                <div
                  key={time}
                  className="absolute top-0 h-full border-l border-border/50"
                  style={{ left: `${pos}px` }}
                >
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {time}s
                  </span>
                </div>
              );
            })}
            
            {/* Playhead in ruler */}
            <div
              className="absolute top-0 h-full w-0.5 bg-primary pointer-events-none z-10"
              style={{ left: `${playheadPosition}px` }}
            >
              <div className="absolute -top-0.5 -left-1.5 w-3 h-3 bg-primary rotate-45" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tracks Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels (Fixed) */}
        <div className="w-24 border-r border-border/50 bg-background flex flex-col">
          {layers.length === 0 ? (
            <div className="flex-1" />
          ) : (
            <div className="space-y-1 p-1">
              {[...layers].reverse().map((layer) => (
                <div
                  key={layer.id}
                  className="h-12 bg-muted/30 rounded-sm border border-border/50 px-2 flex items-center gap-1.5"
                >
                  {layer instanceof AdjustmentLayer && (
                    <Layers className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">{layer.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Scrollable Timeline */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
        >
          <div className="relative" style={{ width: `${timelineWidth}px`, minHeight: '100%' }}>
            {/* Playhead line extending down */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
              style={{ left: `${playheadPosition}px` }}
            />
            
            {/* Layer Tracks */}
            {layers.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No layers. Add an effect to get started.
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {[...layers].reverse().map((layer) => {
                  const clipLeft = (layer.startTime / 1000) * pixelsPerSecond;
                  const clipWidth = (layer.duration / 1000) * pixelsPerSecond;
                  const isSelected = layer.id === selectedLayerId;
                  const isAdjustment = layer instanceof AdjustmentLayer;
                  
                  return (
                    <div
                      key={layer.id}
                      className="h-12 bg-muted/30 rounded-sm relative border border-border/50"
                    >
                      {/* Clip */}
                      <div
                        className={cn(
                          "absolute top-1 bottom-1 rounded-sm border-2 cursor-move transition-colors overflow-hidden",
                          isSelected 
                            ? "border-primary bg-primary/30 shadow-lg" 
                            : isAdjustment
                              ? "border-primary/60 bg-primary/20 hover:bg-primary/30 hover:border-primary/80"
                              : "border-accent-foreground/40 bg-accent/60 hover:bg-accent/80 hover:border-accent-foreground/60",
                          layer.locked && "cursor-not-allowed opacity-50",
                          !layer.enabled && "opacity-40"
                        )}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                        onMouseDown={(e) => !layer.locked && handleClipMouseDown(e, layer.id, 'move')}
                      >
                        {/* Resize Handle Left */}
                        {!layer.locked && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50"
                            onMouseDown={(e) => handleClipMouseDown(e, layer.id, 'resize-left')}
                          />
                        )}
                        
                        {/* Clip Content */}
                        <div className="px-2 py-1 h-full flex items-center justify-center gap-1">
                          {isAdjustment && (
                            <Layers className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="text-[10px] font-medium truncate">
                            {layer.name}
                          </span>
                        </div>
                        
                        {/* Resize Handle Right */}
                        {!layer.locked && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50"
                            onMouseDown={(e) => handleClipMouseDown(e, layer.id, 'resize-right')}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
