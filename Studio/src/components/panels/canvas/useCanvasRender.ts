import { useEffect } from 'react';
import type { ILayer, ProjectConfig } from '@/engine/types';
import type { CanvasRefs, TimelineConfig } from './types';
import { drawGrid, drawTimeRuler, drawFixedTracks, drawLayerClips } from './canvasRenderers';

/**
 * Hook to handle canvas rendering
 */
export function useCanvasRender(
  refs: CanvasRefs,
  config: TimelineConfig,
  projectConfig: ProjectConfig,
  layers: ILayer[],
  selectedLayerId: string | null,
  playhead: number,
  hoverState: { layerId: string; mode: 'move' | 'resize-left' | 'resize-right' } | null
) {
  useEffect(() => {
    const { mainCanvasRef, rulerCanvasRef, labelsCanvasRef, cornerCanvasRef, containerRef } = refs;
    const mainCanvas = mainCanvasRef.current;
    const rulerCanvas = rulerCanvasRef.current;
    const labelsCanvas = labelsCanvasRef.current;
    const cornerCanvas = cornerCanvasRef.current;
    const container = containerRef.current;
    
    if (!mainCanvas || !rulerCanvas || !labelsCanvas || !cornerCanvas || !container) return;
    
    const mainCtx = mainCanvas.getContext('2d');
    const rulerCtx = rulerCanvas.getContext('2d');
    const labelsCtx = labelsCanvas.getContext('2d');
    const cornerCtx = cornerCanvas.getContext('2d');
    
    if (!mainCtx || !rulerCtx || !labelsCtx || !cornerCtx) return;
    
    // Calculate content dimensions
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth - config.trackLabelWidth;
    const timelineWidth = Math.max(
      containerWidth,
      (projectConfig.duration / 1000) * config.pixelsPerSecond + 100
    );
    const contentHeight = config.numTracks * config.trackHeight;
    
    // Setup corner canvas (top-left, fixed)
    cornerCanvas.width = config.trackLabelWidth * dpr;
    cornerCanvas.height = config.rulerHeight * dpr;
    cornerCanvas.style.width = `${config.trackLabelWidth}px`;
    cornerCanvas.style.height = `${config.rulerHeight}px`;
    cornerCtx.scale(dpr, dpr);
    cornerCtx.fillStyle = '#18181b';
    cornerCtx.fillRect(0, 0, config.trackLabelWidth, config.rulerHeight);
    
    // Setup ruler canvas (top, scrolls horizontally)
    rulerCanvas.width = timelineWidth * dpr;
    rulerCanvas.height = config.rulerHeight * dpr;
    rulerCanvas.style.width = `${timelineWidth}px`;
    rulerCanvas.style.height = `${config.rulerHeight}px`;
    rulerCtx.scale(dpr, dpr);
    
    // Configure canvas for crisp text rendering
    rulerCtx.textBaseline = 'top';
    rulerCtx.imageSmoothingEnabled = false;
    
    drawTimeRuler(rulerCtx, timelineWidth, playhead, projectConfig.duration, config);
    
    // Setup labels canvas (left, scrolls vertically)
    labelsCanvas.width = config.trackLabelWidth * dpr;
    labelsCanvas.height = contentHeight * dpr;
    labelsCanvas.style.width = `${config.trackLabelWidth}px`;
    labelsCanvas.style.height = `${contentHeight}px`;
    labelsCtx.scale(dpr, dpr);
    
    // Configure for crisp text: disable smoothing, use system fonts, align to top
    labelsCtx.textBaseline = 'top';
    labelsCtx.imageSmoothingEnabled = false;
    labelsCtx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    drawFixedTracks(labelsCtx, config);
    
    // Setup main canvas (scrolls both ways)
    mainCanvas.width = timelineWidth * dpr;
    mainCanvas.height = contentHeight * dpr;
    mainCanvas.style.width = `${timelineWidth}px`;
    mainCanvas.style.height = `${contentHeight}px`;
    mainCtx.scale(dpr, dpr);
    
    // Enable smoothing for smooth curves and gradients
    mainCtx.textBaseline = 'top';
    mainCtx.imageSmoothingEnabled = true;
    
    // Clear main canvas
    mainCtx.fillStyle = '#09090b';
    mainCtx.fillRect(0, 0, timelineWidth, contentHeight);
    
    // Draw grid on main canvas
    drawGrid(mainCtx, timelineWidth, contentHeight, projectConfig.duration, config);
    
    // Draw layer clips on main canvas
    drawLayerClips(mainCtx, layers, selectedLayerId, playhead, config, hoverState);
    
  }, [refs, config, projectConfig, layers, selectedLayerId, playhead, hoverState]);
}
