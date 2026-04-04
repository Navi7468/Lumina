import { useState, useEffect } from 'react';
import { FilePlus2 } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useProjectStore } from '@/store/projectStore';
import { usePlaybackStore } from '@/store/playbackStore';
import type { Project, ProjectConfig } from '@/engine/types';

const DEFAULT_NAME = 'Untitled Project';

const DEFAULT_CONFIG: ProjectConfig = {
  ledCount: 60,
  fps: 60,
  duration: 60000, // 60 seconds
  piIp: '192.168.1.1',
  piPort: 7777,
  packetTimeoutMs: 2000,
};

function createBlankProject(name: string, config: ProjectConfig): Project {
  return {
    id: crypto.randomUUID(),
    name,
    config,
    layers: [],
    selectedLayerId: null,
    playhead: 0,
    loop: false,
  };
}

export function NewProjectDialog() {
  const { project, loadProject } = useProjectStore();
  const { stop } = usePlaybackStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(DEFAULT_NAME);
  const [ledCount, setLedCount] = useState(DEFAULT_CONFIG.ledCount);
  const [fps, setFps] = useState(DEFAULT_CONFIG.fps);
  const [durationSecs, setDurationSecs] = useState(DEFAULT_CONFIG.duration / 1000);

  // Listen for the Tauri menu / keyboard-shortcut event
  useEffect(() => {
    const unsub = listen('new-project', () => setOpen(true));
    return () => { unsub.then(fn => fn()); };
  }, []);

  // Current project has meaningful content
  const hasContent = project.layers.length > 0 || project.name !== DEFAULT_NAME;

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset form to defaults each time the dialog opens
      setName(DEFAULT_NAME);
      setLedCount(DEFAULT_CONFIG.ledCount);
      setFps(DEFAULT_CONFIG.fps);
      setDurationSecs(DEFAULT_CONFIG.duration / 1000);
    }
    setOpen(isOpen);
  };

  const handleCreate = () => {
    stop();
    loadProject(createBlankProject(name.trim() || DEFAULT_NAME, {
      ...DEFAULT_CONFIG,
      ledCount,
      fps,
      duration: durationSecs * 1000,
    }));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="New Project">
          <FilePlus2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Configure your new project settings.
          </DialogDescription>
        </DialogHeader>

        {hasContent && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            The current project has unsaved content. Starting a new project will discard it.
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Project name */}
          <div className="space-y-2">
            <Label htmlFor="new-project-name">Project Name</Label>
            <Input
              id="new-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled Project"
            />
          </div>

          {/* LED count + FPS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-led-count">LED Count</Label>
              <Input
                id="new-led-count"
                type="number"
                min={1}
                max={10000}
                value={ledCount}
                onChange={(e) => setLedCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-fps">Frame Rate (FPS)</Label>
              <Input
                id="new-fps"
                type="number"
                min={1}
                max={120}
                value={fps}
                onChange={(e) => setFps(Math.max(1, parseInt(e.target.value) || 30))}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="new-duration">Duration (seconds)</Label>
            <Input
              id="new-duration"
              type="number"
              min={1}
              max={3600}
              value={durationSecs}
              onChange={(e) => setDurationSecs(Math.max(1, parseInt(e.target.value) || 60))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            {hasContent ? 'Discard & Create' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
