import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePreferencesStore, type Theme, type LayoutMode } from '@/store/preferencesStore';

interface GeneralTabProps {
  onApplyTheme: (theme: Theme) => void;
}

export function GeneralTab({ onApplyTheme }: GeneralTabProps) {
  const preferences = usePreferencesStore();

  const [experimentalOpen, setExperimentalOpen] = useState(false);

  const [tempPrefs, setTempPrefs] = useState({
    theme: preferences.theme,
    layoutMode: preferences.layoutMode,
    autoSave: preferences.autoSave,
    autoSaveInterval: preferences.autoSaveInterval,
    experimental: preferences.experimental,
  });

  // Reset when preferences change externally
  useEffect(() => {
    setTempPrefs({
      theme: preferences.theme,
      layoutMode: preferences.layoutMode,
      autoSave: preferences.autoSave,
      autoSaveInterval: preferences.autoSaveInterval,
      experimental: preferences.experimental,
    });
  }, [preferences]);

  useEffect(() => {
    preferences.setTheme(tempPrefs.theme);
    onApplyTheme(tempPrefs.theme);
  }, [tempPrefs.theme]);

  useEffect(() => {
    preferences.setLayoutMode(tempPrefs.layoutMode);
  }, [tempPrefs.layoutMode]);

  useEffect(() => {
    preferences.setAutoSave(tempPrefs.autoSave);
  }, [tempPrefs.autoSave]);

  useEffect(() => {
    preferences.setAutoSaveInterval(tempPrefs.autoSaveInterval);
  }, [tempPrefs.autoSaveInterval]);

  useEffect(() => {
    preferences.setExperimental(tempPrefs.experimental);
  }, [tempPrefs.experimental]);

  // experimental.enabled gates Studio/Node layouts and is the master toggle for all experimental features â€” the master toggle lives in the Editor tab.
  // It is only consumed here to gate Studio/Node layout options in the dropdown.

  return (
    <div className="space-y-6 py-4">
      {/* Appearance */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Appearance</h3>

        <div className="space-y-2">
          <Label htmlFor="layout-mode">Layout Mode</Label>
          <Select
            value={tempPrefs.layoutMode}
            onValueChange={(value: string) =>
              setTempPrefs({ ...tempPrefs, layoutMode: value as LayoutMode })
            }
          >
            <SelectTrigger id="layout-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daw">DAW</SelectItem>
              {/* Studio and Node are experimental â€” hidden until experimental features are enabled in the Editor tab */}
              {tempPrefs.experimental.enabled && (
                <SelectItem value="studio">Studio - (Experimental)</SelectItem>
              )}
              {tempPrefs.experimental.enabled && (
                <SelectItem value="node">Node - (Experimental)</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            DAW: classic timeline.
            {tempPrefs.experimental.enabled
              ? ' Studio and Node layouts are experimental, use at your own risk.'
              : ' Enable Experimental Features below to unlock Studio and Node layouts.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={tempPrefs.theme}
            onValueChange={(value: string) =>
              setTempPrefs({ ...tempPrefs, theme: value as Theme })
            }
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
          {/* TODO: wire auto-save timer into useProjectFile hook */}
          <Switch
            id="auto-save"
            checked={tempPrefs.autoSave}
            onCheckedChange={(checked: boolean) =>
              setTempPrefs({ ...tempPrefs, autoSave: checked })
            }
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
              onChange={(e) =>
                setTempPrefs({
                  ...tempPrefs,
                  autoSaveInterval: parseInt(e.target.value) || 5,
                })
              }
            />
          </div>
        )}
      </div>

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
                  Master toggle — unlocks Studio/Node layouts and WebGL rendering options
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exp-webgl-preview">WebGL LED Preview</Label>
                  <p className="text-xs text-muted-foreground">
                    GPU-accelerated LED strip preview
                    {/* TODO: swap LEDPreview renderer when this is true */}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
