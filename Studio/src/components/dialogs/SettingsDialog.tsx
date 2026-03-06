import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
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
import type { ProjectConfig } from '@/engine/types';
import { listen } from '@tauri-apps/api/event';

export function SettingsDialog() {
  const { project, setProjectConfig, setProjectName } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ProjectConfig>(project.config);
  const [tempName, setTempName] = useState(project.name);

  // Listen for menu event to open settings
  useEffect(() => {
    const unlisten = listen('open-settings', () => {
      setOpen(true);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Reset temp values when opening
      setTempConfig(project.config);
      setTempName(project.name);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    setProjectName(tempName);
    setProjectConfig(tempConfig);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempConfig(project.config);
    setTempName(project.name);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Project Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure your LED project settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Untitled Project"
            />
          </div>

          {/* LED Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">LED Configuration</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="led-count">LED Count</Label>
                <Input
                  id="led-count"
                  type="number"
                  min={1}
                  max={10000}
                  value={tempConfig.ledCount}
                  onChange={(e) => setTempConfig({
                    ...tempConfig,
                    ledCount: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fps">Frame Rate (FPS)</Label>
                <Input
                  id="fps"
                  type="number"
                  min={1}
                  max={120}
                  value={tempConfig.fps}
                  onChange={(e) => setTempConfig({
                    ...tempConfig,
                    fps: parseInt(e.target.value) || 30
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Timeline Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={3600}
                step={0.1}
                value={tempConfig.duration / 1000}
                onChange={(e) => setTempConfig({
                  ...tempConfig,
                  duration: (parseFloat(e.target.value) || 1) * 1000
                })}
              />
            </div>
          </div>

          {/* Network Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Raspberry Pi Connection</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pi-ip">IP Address</Label>
                <Input
                  id="pi-ip"
                  value={tempConfig.piIp}
                  onChange={(e) => setTempConfig({
                    ...tempConfig,
                    piIp: e.target.value
                  })}
                  placeholder="192.168.1.1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pi-port">Port</Label>
                <Input
                  id="pi-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={tempConfig.piPort}
                  onChange={(e) => setTempConfig({
                    ...tempConfig,
                    piPort: parseInt(e.target.value) || 7777
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="packet-timeout">Packet Timeout (ms)</Label>
              <Input
                id="packet-timeout"
                type="number"
                min={100}
                max={10000}
                value={tempConfig.packetTimeoutMs}
                onChange={(e) => setTempConfig({
                  ...tempConfig,
                  packetTimeoutMs: parseInt(e.target.value) || 1000
                })}
              />
              <p className="text-xs text-muted-foreground">
                Time before Pi fades to black when no packets received
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
