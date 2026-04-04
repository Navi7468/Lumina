import { useCallback, useEffect, useState } from 'react';
import { LEDPreview } from './components/preview/LEDPreview';
import { LEDSelectionPreview } from './components/preview/LEDSelectionPreview';
import { SelectionToolbar } from './components/common/SelectionToolbar';
import { Timeline } from './components/panels/Timeline';
import { LayerPanel } from './components/panels/LayerPanel';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { EffectsLibrary } from './components/panels/EffectsLibrary';
import { AppHeader } from './components/common/AppHeader';
import { useProjectStore } from './store/projectStore';
import { usePlaybackStore } from './store/playbackStore';
import { usePiStore } from './store/piStore';
import { usePreferencesStore, type Theme } from './store/preferencesStore';
import { renderEngine } from './engine/RenderEngine';
import { usePiStreaming } from './hooks/usePiStreaming';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePlayback } from './hooks/usePlayback';
import { useMenuEvents } from './hooks/useMenuEvents';
import { useProjectFile } from './hooks/useProjectFile';
import { useResizableSashes } from './hooks/useResizableSashes';
import { Module } from './components/common/Module';
import { Sparkles, Layers, Clock, Settings, Eye } from 'lucide-react';

function App() {
  const { 
    project, 
    setPlayhead, 
    updateLayer,
    undo,
    redo,
    newProject,
  } = useProjectStore();
  const { isPlaying, play, pause, stop } = usePlaybackStore();
  const { isPiConnected, isStreamingOnPlayback, isStreamingOnScrub } = usePiStore();
  const {
    theme, 
    leftSidebarWidth, 
    rightSidebarWidth,
    effectsLibraryHeight,
    previewHeight,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setEffectsLibraryHeight,
    setPreviewHeight
  } = usePreferencesStore();
  const [headerHeight, setHeaderHeight] = useState(0);
  
  // Resizable sashes hook
  const { leftSidebarRef, centerAreaRef, mainContentRef, renderSashes } = useResizableSashes({
    leftSidebarWidth,
    rightSidebarWidth,
    effectsLibraryHeight,
    previewHeight,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setEffectsLibraryHeight,
    setPreviewHeight,
  });
  
  // LED selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const selectedLayer = project.layers.find(l => l.id === project.selectedLayerId);
  const selectedLEDs = selectedLayer?.ledMask || [];
  
  // Playback hook
  usePlayback({
    isPlaying,
    playhead: project.playhead,
    duration: project.config.duration,
    loop: project.loop,
    setPlayhead,
    pause,
  });
  
  // Keyboard shortcut handlers
  useKeyboardShortcuts({
    // Edit commands
    'edit.undo': () => undo(),
    'edit.redo': () => redo(),
    
    // Selection commands
    'selection.selectAll': () => {
      if (selectedLayer) {
        const allLEDs = Array.from({ length: project.config.ledCount }, (_, i) => i);
        updateLayer(selectedLayer.id, { ledMask: allLEDs });
      }
    },
    'selection.clear': () => {
      if (selectedLayer) {
        updateLayer(selectedLayer.id, { ledMask: [] });
      }
    },
    'selection.everyOther': () => {
      if (selectedLayer) {
        const everyOther = Array.from({ length: project.config.ledCount }, (_, i) => i).filter((_, idx) => idx % 2 === 0);
        updateLayer(selectedLayer.id, { ledMask: everyOther });
      }
    },
    'selection.firstHalf': () => {
      if (selectedLayer) {
        const half = Math.floor(project.config.ledCount / 2);
        const firstHalf = Array.from({ length: half }, (_, i) => i);
        updateLayer(selectedLayer.id, { ledMask: firstHalf });
      }
    },
    'selection.lastHalf': () => {
      if (selectedLayer) {
        const half = Math.floor(project.config.ledCount / 2);
        const lastHalf = Array.from({ length: project.config.ledCount - half }, (_, i) => i + half);
        updateLayer(selectedLayer.id, { ledMask: lastHalf });
      }
    },
    
    // View commands
    'view.togglePlayback': () => {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    },
    'view.toggleSelectionMode': () => {
      setSelectionMode(!selectionMode);
    },
  });
  
  // File menu handlers
  const { save: saveProject, open: openProject } = useProjectFile();
  const handleNewProject = useCallback(() => { stop(); newProject(); }, [stop, newProject]);

  // Menu event bridge (Tauri → store actions)
  useMenuEvents({
    play,
    pause,
    stop,
    newProject: handleNewProject,
    openProject,
    saveProject: () => saveProject(),
    saveProjectAs: () => saveProject(true),
  });

  // Apply theme on load and when it changes
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };
    
    applyTheme(theme);
    
    // Listen for system theme changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);
  
  // Render current frame
  const currentFrame = renderEngine.renderProject(project);
  
  // Stream frames to Pi
  usePiStreaming(
    isPlaying, 
    isPiConnected, 
    isStreamingOnPlayback, 
    isStreamingOnScrub, 
    currentFrame, 
    project.config.fps,
    project.config.packetTimeoutMs
  );
  
  return (
    <div className="h-screen flex flex-col bg-background text-foreground relative">
      <AppHeader onHeightChange={setHeaderHeight} />
      
      {/* Main content */}
      <div ref={mainContentRef} className="flex-1 flex overflow-hidden relative">
        {/* Left sidebar - Effects and Layers */}
        <div 
          ref={leftSidebarRef}
          className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{ width: `${leftSidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
        >
          <div 
            className="overflow-auto flex-shrink-0"
            style={{ height: `${effectsLibraryHeight}%` }}
          >
            <Module 
              title="Effects"
              icon={<Sparkles className="h-4 w-4" />}
              
            >
              <EffectsLibrary />
            </Module>
          </div>
          
          <div 
            className="overflow-auto flex-1"
            style={{ height: `${100 - effectsLibraryHeight}%` }}
          >
            <Module 
              title="Layers"
              icon={<Layers className="h-4 w-4" />}
              noPadding
            >
              <LayerPanel />
            </Module>
          </div>
        </div>
        
        {/* Center - Preview and Timeline */}
        <div ref={centerAreaRef} className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div 
            className="flex flex-col gap-2 flex-shrink-0 overflow-auto"
            style={{ height: `${previewHeight}%` }}
          >
            <Module
              title="Preview"
              icon={<Eye className="h-4 w-4" />}
              noPadding
            >
              <div className="w-full max-w-5xl p-3 mx-auto space-y-3 bg-muted/5">
                {selectedLayer && (
                  <SelectionToolbar
                    selectionMode={selectionMode}
                    onToggleSelectionMode={() => setSelectionMode(!selectionMode)}
                    onClearSelection={() => {
                      if (selectedLayer) {
                        updateLayer(selectedLayer.id, { ledMask: [] });
                      }
                    }}
                    selectionCount={selectedLEDs.length}
                    disabled={!selectedLayer}
                  />
                )}
                
                {selectedLayer && selectionMode ? (
                  <LEDSelectionPreview
                    frame={currentFrame}
                    selectedLEDs={selectedLEDs}
                    selectionMode={selectionMode}
                    onSelectionChange={(newSelection) => {
                      if (selectedLayer) {
                        updateLayer(selectedLayer.id, { ledMask: newSelection });
                      }
                    }}
                  />
                ) : (
                  <LEDPreview frame={currentFrame} />
                )}
              </div>
            </Module>
          </div>
          
          {/* Timeline */}
          <div className="flex-1 overflow-hidden">
            <Module 
              title="Timeline"
              icon={<Clock className="h-4 w-4" />}
              noPadding
            >
              <Timeline />
            </Module>
          </div>
        </div>
        
        {/* Right sidebar - Properties */}
        <div 
          className="overflow-auto flex-shrink-0"
          style={{ width: `${rightSidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
        >
          <Module 
            title="Properties"
            icon={<Settings className="h-4 w-4" />}
          >
            <PropertiesPanel />
          </Module>
        </div>
        
        {/* Overlay Sashes */}
        {renderSashes(headerHeight)}
      </div>
    </div>
  );
}

export default App;
