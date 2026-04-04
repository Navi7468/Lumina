import { useState, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import { cn } from '@/lib/utils';
import { CanvasTimeline } from './CanvasTimeline';
import { TimelineToolbar } from './TimelineToolbar';
import { useClipInteraction } from '@/hooks/useClipInteraction';

export function Timeline() {
  const { project, setPlayhead, updateLayer, selectLayer } = useProjectStore();
  const { playhead, config, layers, selectedLayerId } = project;
  const { timelineRenderer } = usePreferencesStore();

  const [zoom, setZoom] = useState(100); // zoom percentage (50-300%)
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Calculate pixel width based on zoom percentage
  const pixelsPerSecond = zoom; // 100% = 100px per second
  const timelineWidth = (config.duration / 1000) * pixelsPerSecond; // px
  const playheadPosition = (playhead / 1000) * pixelsPerSecond; // px

  // Clip drag interaction (legacy HTML renderer only)
  const { dragState, handleClipMouseDown } = useClipInteraction({
    layers,
    pixelsPerSecond,
    duration: config.duration,
    updateLayer,
    selectLayer,
  });

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
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollOffset(scrollLeft);
    
    // Sync ruler scroll
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scrollLeft;
    }
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
      <TimelineToolbar zoom={zoom} onZoomChange={setZoom} />

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
