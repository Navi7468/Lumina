import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePreferencesStore, type TimelineRenderer } from '@/store/preferencesStore';

export function EditorTab() {
  const preferences = usePreferencesStore();
  const [tempPrefs, setTempPrefs] = useState({
    timelineRenderer: preferences.timelineRenderer,
    snapToGrid: preferences.snapToGrid,
    gridSize: preferences.gridSize,
    showGridInPreview: preferences.showGridInPreview,
    experimental: preferences.experimental,
  });

  // Reset when preferences change externally
  useEffect(() => {
    setTempPrefs({
      timelineRenderer: preferences.timelineRenderer,
      snapToGrid: preferences.snapToGrid,
      gridSize: preferences.gridSize,
      showGridInPreview: preferences.showGridInPreview,
      experimental: preferences.experimental,
    });
  }, [preferences]);

  useEffect(() => {
    preferences.setTimelineRenderer(tempPrefs.timelineRenderer);
  }, [tempPrefs.timelineRenderer]);

  useEffect(() => {
    preferences.setSnapToGrid(tempPrefs.snapToGrid);
  }, [tempPrefs.snapToGrid]);

  useEffect(() => {
    preferences.setGridSize(tempPrefs.gridSize);
  }, [tempPrefs.gridSize]);

  useEffect(() => {
    preferences.setShowGridInPreview(tempPrefs.showGridInPreview);
  }, [tempPrefs.showGridInPreview]);

  // When experimental is disabled or webglTimeline sub-toggle is off, reset renderer if on webgl
  useEffect(() => {
    if (
      (!tempPrefs.experimental.enabled || !tempPrefs.experimental.webglTimeline) &&
      tempPrefs.timelineRenderer === 'webgl'
    ) {
      setTempPrefs((prev) => ({ ...prev, timelineRenderer: 'html' }));
    }
  }, [tempPrefs.experimental.enabled, tempPrefs.experimental.webglTimeline]);

  return (
    <div className="space-y-6 py-4">
      {/* Timeline & Renderer */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Timeline &amp; Renderer</h3>

        <div className="space-y-2">
          <Label htmlFor="timeline-renderer">Timeline Renderer</Label>
          <Select
            value={tempPrefs.timelineRenderer}
            onValueChange={(value: string) =>
              setTempPrefs({ ...tempPrefs, timelineRenderer: value as TimelineRenderer })
            }
          >
            <SelectTrigger id="timeline-renderer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML</SelectItem>
              {/* WebGL option visible when experimental is enabled */}
              {tempPrefs.experimental.enabled && (
                <>
                  <SelectItem value="canvas">Canvas - (Experimental)</SelectItem>
                  <SelectItem value="webgl" disabled>WebGL - (Experimental)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Canvas enables advanced rendering features. Enable Experimental Features in
            General, then toggle WebGL Timeline to unlock the WebGL option.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Grid</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="snap-to-grid">Snap to Grid</Label>
            <p className="text-xs text-muted-foreground">
              Snap clips to grid when moving on the timeline
            </p>
          </div>
          {/* TODO: wire snap behaviour into clip drag logic in Timeline/CanvasTimeline */}
          <Switch
            id="snap-to-grid"
            checked={tempPrefs.snapToGrid}
            onCheckedChange={(checked: boolean) =>
              setTempPrefs({ ...tempPrefs, snapToGrid: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grid-size">Grid Size (ms)</Label>
          {/* TODO: consume gridSize in clip snapping and timeline ruler */}
          <Input
            id="grid-size"
            type="number"
            min={10}
            max={1000}
            step={10}
            value={tempPrefs.gridSize}
            onChange={(e) =>
              setTempPrefs({ ...tempPrefs, gridSize: parseInt(e.target.value) || 100 })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-grid">Show Grid in Preview</Label>
            <p className="text-xs text-muted-foreground">
              Display grid overlay on the LED preview canvas
            </p>
          </div>
          {/* TODO: consume showGridInPreview in LEDPreview component */}
          <Switch
            id="show-grid"
            checked={tempPrefs.showGridInPreview}
            onCheckedChange={(checked: boolean) =>
              setTempPrefs({ ...tempPrefs, showGridInPreview: checked })
            }
          />
        </div>
      </div>


    </div>
  );
}
