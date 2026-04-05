import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePreferencesStore, type Theme, type TimelineRenderer, type LayoutMode } from '@/store/preferencesStore';

// TODO(v0.3.4): Refactor this tab — split into a dedicated "Editor" tab.
// - Move timeline renderer, grid settings, and experimental section to EditorTab.tsx
// - Keep GeneralTab for: Theme, Layout Mode, Auto-Save only
// - Experimental options (Studio/Node layouts, WebGL renderer) should remain in
//   their natural input locations but be conditionally shown when experimental.enabled
//   is true, rather than being in a separate collapsible section.

interface GeneralTabProps {
  onApplyTheme: (theme: Theme) => void;
}

export function GeneralTab({ onApplyTheme }: GeneralTabProps) {
  const preferences = usePreferencesStore();
  const [experimentalOpen, setExperimentalOpen] = useState(false);
  
  const [tempPrefs, setTempPrefs] = useState({
    theme: preferences.theme,
    timelineRenderer: preferences.timelineRenderer,
    layoutMode: preferences.layoutMode,
    experimental: preferences.experimental,
    autoSave: preferences.autoSave,
    autoSaveInterval: preferences.autoSaveInterval,
    showGridInPreview: preferences.showGridInPreview,
    snapToGrid: preferences.snapToGrid,
    gridSize: preferences.gridSize,
  });
  
  // Reset temp preferences when preferences change externally
  useEffect(() => {
    setTempPrefs({
      theme: preferences.theme,
      timelineRenderer: preferences.timelineRenderer,
      layoutMode: preferences.layoutMode,
      experimental: preferences.experimental,
      autoSave: preferences.autoSave,
      autoSaveInterval: preferences.autoSaveInterval,
      showGridInPreview: preferences.showGridInPreview,
      snapToGrid: preferences.snapToGrid,
      gridSize: preferences.gridSize,
    });
  }, [preferences]);
  
  // Auto-apply preference changes immediately
  useEffect(() => {
    preferences.setTheme(tempPrefs.theme);
    onApplyTheme(tempPrefs.theme);
  }, [tempPrefs.theme]);
  
  useEffect(() => {
    preferences.setTimelineRenderer(tempPrefs.timelineRenderer);
  }, [tempPrefs.timelineRenderer]);

  useEffect(() => {
    preferences.setLayoutMode(tempPrefs.layoutMode);
  }, [tempPrefs.layoutMode]);

  useEffect(() => {
    preferences.setExperimental(tempPrefs.experimental);
  }, [tempPrefs.experimental]);

  useEffect(() => {
    preferences.setAutoSave(tempPrefs.autoSave);
  }, [tempPrefs.autoSave]);
  
  useEffect(() => {
    preferences.setAutoSaveInterval(tempPrefs.autoSaveInterval);
  }, [tempPrefs.autoSaveInterval]);
  
  useEffect(() => {
    preferences.setShowGridInPreview(tempPrefs.showGridInPreview);
  }, [tempPrefs.showGridInPreview]);
  
  useEffect(() => {
    preferences.setSnapToGrid(tempPrefs.snapToGrid);
  }, [tempPrefs.snapToGrid]);
  
  useEffect(() => {
    preferences.setGridSize(tempPrefs.gridSize);
  }, [tempPrefs.gridSize]);
  
  return (
    <div className="space-y-6 py-4">
      {/* Appearance */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Appearance</h3>

        <div className="space-y-2">
          <Label htmlFor="layout-mode">Layout Mode</Label>
          <Select
            value={tempPrefs.layoutMode}
            onValueChange={(value: string) => setTempPrefs({
              ...tempPrefs,
              layoutMode: value as LayoutMode
            })}
          >
            <SelectTrigger id="layout-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daw">DAW (Default)</SelectItem>
              <SelectItem disabled value="studio">Studio - coming soon</SelectItem>
              <SelectItem disabled value="node">Node - coming soon</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            DAW: classic timeline. Studio: multi-panel creative view. Node: visual effect graph.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={tempPrefs.theme}
            onValueChange={(value: string) => setTempPrefs({
              ...tempPrefs,
              theme: value as Theme
            })}
          >
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color theme
          </p>
        </div>
      </div>
      
      {/* Timeline & Editor */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Timeline & Editor</h3>
        
        <div className="space-y-2">
          <Label htmlFor="timeline-renderer">Timeline Renderer</Label>
          <Select
            value={tempPrefs.timelineRenderer}
            onValueChange={(value: string) => setTempPrefs({
              ...tempPrefs,
              timelineRenderer: value as TimelineRenderer
            })}
          >
            <SelectTrigger id="timeline-renderer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML (Default)</SelectItem>
              <SelectItem value="canvas">Canvas (Experimental)</SelectItem>
              {tempPrefs.experimental.enabled && tempPrefs.experimental.webglTimeline && (
                <SelectItem value="webgl">WebGL (Experimental)</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Canvas mode enables advanced features like automation tracks
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="snap-to-grid">Snap to Grid</Label>
            <p className="text-xs text-muted-foreground">
              Snap clips to grid when moving on timeline
            </p>
          </div>
          <Switch
            id="snap-to-grid"
            checked={tempPrefs.snapToGrid}
            onCheckedChange={(checked: boolean) => setTempPrefs({
              ...tempPrefs,
              snapToGrid: checked
            })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="grid-size">Grid Size (ms)</Label>
          <Input
            id="grid-size"
            type="number"
            min={10}
            max={1000}
            step={10}
            value={tempPrefs.gridSize}
            onChange={(e) => setTempPrefs({
              ...tempPrefs,
              gridSize: parseInt(e.target.value) || 100
            })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-grid">Show Grid in Preview</Label>
            <p className="text-xs text-muted-foreground">
              Display grid overlay on preview canvas
            </p>
          </div>
          <Switch
            id="show-grid"
            checked={tempPrefs.showGridInPreview}
            onCheckedChange={(checked: boolean) => setTempPrefs({
              ...tempPrefs,
              showGridInPreview: checked
            })}
          />
        </div>
      </div>
      
      {/* Auto-Save */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Auto-Save</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-save">Enable Auto-Save</Label>
            <p className="text-xs text-muted-foreground">
              Automatically save project at regular intervals
            </p>
          </div>
          <Switch
            id="auto-save"
            checked={tempPrefs.autoSave}
            onCheckedChange={(checked: boolean) => setTempPrefs({
              ...tempPrefs,
              autoSave: checked
            })}
          />
        </div>
        
        {tempPrefs.autoSave && (
          <div className="space-y-2">
            <Label htmlFor="auto-save-interval">Interval (minutes)</Label>
            <Input
              id="auto-save-interval"
              type="number"
              min={1}
              max={60}
              value={tempPrefs.autoSaveInterval}
              onChange={(e) => setTempPrefs({
                ...tempPrefs,
                autoSaveInterval: parseInt(e.target.value) || 5
              })}
            />
          </div>
        )}      </div>

      {/* Experimental */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setExperimentalOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          <span>Experimental</span>
          {experimentalOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {experimentalOpen && (
          <div className="space-y-3">
            {/* Amber warning banner */}
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Experimental features may be unstable, incomplete, or change without
                notice. Use at your own risk.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="exp-enabled">Enable Experimental Features</Label>
                <p className="text-xs text-muted-foreground">
                  Master toggle for all experimental options
                </p>
              </div>
              <Switch
                id="exp-enabled"
                checked={tempPrefs.experimental.enabled}
                onCheckedChange={(checked: boolean) =>
                  setTempPrefs({
                    ...tempPrefs,
                    experimental: { ...tempPrefs.experimental, enabled: checked },
                  })
                }
              />
            </div>

            {tempPrefs.experimental.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exp-webgl-timeline">WebGL Timeline</Label>
                    <p className="text-xs text-muted-foreground">
                      GPU-accelerated timeline rendering
                    </p>
                  </div>
                  <Switch
                    id="exp-webgl-timeline"
                    checked={tempPrefs.experimental.webglTimeline}
                    onCheckedChange={(checked: boolean) =>
                      setTempPrefs({
                        ...tempPrefs,
                        experimental: { ...tempPrefs.experimental, webglTimeline: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exp-webgl-preview">WebGL LED Preview</Label>
                    <p className="text-xs text-muted-foreground">
                      GPU-accelerated LED strip preview
                    </p>
                  </div>
                  <Switch
                    id="exp-webgl-preview"
                    checked={tempPrefs.experimental.webglPreview}
                    onCheckedChange={(checked: boolean) =>
                      setTempPrefs({
                        ...tempPrefs,
                        experimental: { ...tempPrefs.experimental, webglPreview: checked },
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
