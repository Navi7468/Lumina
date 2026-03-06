import { useRef, useState, useEffect } from 'react';
import { ResizableSplitter, ResizableIntersection } from '@/components/common/ResizableSplitter';

interface UseResizableSashesProps {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  effectsLibraryHeight: number;
  previewHeight: number;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setEffectsLibraryHeight: (height: number) => void;
  setPreviewHeight: (height: number) => void;
}

/**
 * Hook to manage resizable splitters (sashes) for panel layout
 * Renders visual sashes and handles drag events to resize panels
 */
export function useResizableSashes({
  leftSidebarWidth,
  rightSidebarWidth,
  effectsLibraryHeight,
  previewHeight,
  setLeftSidebarWidth,
  setRightSidebarWidth,
  setEffectsLibraryHeight,
  setPreviewHeight,
}: UseResizableSashesProps) {
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const centerAreaRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [, setUpdateTrigger] = useState(0);

  // Update sash positions on window resize
  useEffect(() => {
    const handleResize = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderSashes = (headerHeight: number) => {
    if (headerHeight === 0 || !mainContentRef.current) {
      return null;
    }

    return (
      <>
        {/* Left sidebar vertical sash */}
        <ResizableSplitter
          direction="vertical"
          position={{ 
            left: leftSidebarWidth, 
            top: 0,
            bottom: 0 
          }}
          onResize={(delta) => {
            const newWidth = Math.max(200, Math.min(600, leftSidebarWidth + delta));
            setLeftSidebarWidth(newWidth);
          }}
        />
        
        {/* Right sidebar vertical sash */}
        <ResizableSplitter
          direction="vertical"
          position={{ 
            right: rightSidebarWidth - 10, 
            top: 0,
            bottom: 0 
          }}
          onResize={(delta) => {
            const newWidth = Math.max(200, Math.min(600, rightSidebarWidth - delta));
            setRightSidebarWidth(newWidth);
          }}
        />
        
        {/* Left sidebar horizontal sash (Effects/Layers) */}
        {leftSidebarRef.current && (
          <ResizableSplitter
            direction="horizontal"
            position={{ 
              left: 0,
              top: (leftSidebarRef.current.clientHeight * effectsLibraryHeight) / 100 + 4,
              right: mainContentRef.current.clientWidth - leftSidebarWidth
            }}
            onResize={(delta) => {
              if (!leftSidebarRef.current) return;
              const containerHeight = leftSidebarRef.current.clientHeight;
              const deltaPercent = (delta / containerHeight) * 100;
              const newHeight = Math.max(10, Math.min(90, effectsLibraryHeight + deltaPercent));
              setEffectsLibraryHeight(newHeight);
            }}
          />
        )}
        
        {/* Center horizontal sash (Preview/Timeline) */}
        {centerAreaRef.current && (
          <ResizableSplitter
            direction="horizontal"
            position={{ 
              left: leftSidebarWidth,
              top: (centerAreaRef.current.clientHeight * previewHeight) / 100 + 4,
              right: rightSidebarWidth
            }}
            onResize={(delta) => {
              if (!centerAreaRef.current) return;
              const containerHeight = centerAreaRef.current.clientHeight;
              const deltaPercent = (delta / containerHeight) * 100;
              const newHeight = Math.max(20, Math.min(80, previewHeight + deltaPercent));
              setPreviewHeight(newHeight);
            }}
          />
        )}
        
        {/* Intersection: Left vertical ∩ Left horizontal */}
        {leftSidebarRef.current && (
          <ResizableIntersection
            position={{
              left: leftSidebarWidth,
              top: (leftSidebarRef.current.clientHeight * effectsLibraryHeight) / 100,
            }}
            onResize={(deltaX, deltaY) => {
              // Handle X resize (left sidebar width)
              const newWidth = Math.max(200, Math.min(600, leftSidebarWidth + deltaX));
              setLeftSidebarWidth(newWidth);
              
              // Handle Y resize (effects library height)
              if (!leftSidebarRef.current) return;
              const containerHeight = leftSidebarRef.current.clientHeight;
              const deltaPercent = (deltaY / containerHeight) * 100;
              const newHeight = Math.max(10, Math.min(90, effectsLibraryHeight + deltaPercent));
              setEffectsLibraryHeight(newHeight);
            }}
          />
        )}
        
        {/* Intersection: Right vertical ∩ Center horizontal */}
        {centerAreaRef.current && mainContentRef.current && (
          <ResizableIntersection
            position={{
              left: mainContentRef.current.clientWidth - rightSidebarWidth,
              top: (centerAreaRef.current.clientHeight * previewHeight) / 100,
            }}
            onResize={(deltaX, deltaY) => {
              // Handle X resize (right sidebar width)
              const newWidth = Math.max(200, Math.min(600, rightSidebarWidth - deltaX));
              setRightSidebarWidth(newWidth);
              
              // Handle Y resize (preview height)
              if (!centerAreaRef.current) return;
              const containerHeight = centerAreaRef.current.clientHeight;
              const deltaPercent = (deltaY / containerHeight) * 100;
              const newHeight = Math.max(20, Math.min(80, previewHeight + deltaPercent));
              setPreviewHeight(newHeight);
            }}
          />
        )}
      </>
    );
  };

  return {
    leftSidebarRef,
    centerAreaRef,
    mainContentRef,
    renderSashes,
  };
}
