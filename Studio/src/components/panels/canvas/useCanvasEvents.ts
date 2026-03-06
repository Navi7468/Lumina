import { useEffect } from 'react';

/**
 * Hook to handle mouse wheel zoom (Ctrl for timeline, Alt for track height)
 */
export function useMouseWheelZoom(
  containerRef: React.RefObject<HTMLDivElement>,
  zoom: number,
  setZoom: (zoom: number) => void,
  trackHeight: number,
  setTrackHeight: (height: number) => void
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Horizontal zoom (timeline zoom)
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(Math.max(50, Math.min(300, zoom + delta)));
      } else if (e.altKey) {
        // Vertical zoom (layer height)
        e.preventDefault();
        const delta = e.deltaY > 0 ? -2 : 2;
        setTrackHeight(Math.max(26, Math.min(108, trackHeight + delta)));
      }
      // Shift+Scroll will naturally scroll horizontally (browser default)
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, zoom, trackHeight, setZoom, setTrackHeight]);
}

/**
 * Hook to handle window/container resize
 */
export function useResizeObserver(
  containerRef: React.RefObject<HTMLDivElement>,
  setResizeTrigger: (fn: (prev: number) => number) => void
) {
  useEffect(() => {
    const handleResize = () => {
      setResizeTrigger(prev => prev + 1);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also observe container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef, setResizeTrigger]);
}
