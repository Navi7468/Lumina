import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePreferencesStore, type Theme, type TimelineRenderer } from '@/store/preferencesStore';

interface GeneralTabProps {
  onApplyTheme: (theme: Theme) => void;
}

export function GeneralTab({ onApplyTheme }: GeneralTabProps) {
  const preferences = usePreferencesStore();
  
  const [tempPrefs, setTempPrefs] = useState({
    theme: preferences.theme,
    timelineRenderer: preferences.timelineRenderer,
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
              <SelectItem value="html">HTML (Current)</SelectItem>
              <SelectItem value="canvas">Canvas (Experimental)</SelectItem>
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
        )}
      </div>
    </div>
  );
}
