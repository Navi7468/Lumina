import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { PiConnectionDialog } from '../dialogs/PiConnectionDialog';
import { SettingsDialog } from '../dialogs/SettingsDialog';
import { PaletteManagerDialog } from '../dialogs/PaletteManager';
import { PreferencesDialog } from '../dialogs/PreferencesDialog';
import { NewProjectDialog } from '../dialogs/NewProjectDialog';
import { AboutDialog } from '../dialogs/AboutDialog';

interface AppHeaderProps {
  onHeightChange?: (height: number) => void;
}

export function AppHeader({ onHeightChange }: AppHeaderProps) {
  const { project } = useProjectStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      onHeightChange?.(ref.current.offsetHeight);
    }
  }, [onHeightChange]);

  return (
    <div ref={ref} className="border-b border-border px-4 py-2 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">LED Controller</h1>
        <p className="text-xs text-muted-foreground">{project.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground text-right">
          <div>{project.config.ledCount} LEDs</div>
          <div>{project.config.fps} FPS</div>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <NewProjectDialog />
        <div className="h-6 w-px bg-border mx-1" />
        <PiConnectionDialog />
        <div className="h-6 w-px bg-border mx-1" />
        <SettingsDialog />
        <PaletteManagerDialog />
        <PreferencesDialog />
        <AboutDialog />
      </div>
    </div>
  );
}
