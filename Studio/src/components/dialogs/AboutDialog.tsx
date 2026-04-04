import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { open as shellOpen } from '@tauri-apps/api/shell';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { VERSION_SUFFIX } from '@/lib/buildInfo';

export function AboutDialog() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<string>('...');

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion('unknown'));
  }, []);

  useEffect(() => {
    const unsubAbout = listen('open-about', () => setOpen(true));
    const unsubDocs  = listen('open-docs',  () => {
      shellOpen('https://github.com/').catch(console.error);
    });
    return () => {
      unsubAbout.then(fn => fn());
      unsubDocs.then(fn => fn());
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="About Lumina">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>About Lumina</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">{VERSION_SUFFIX ? `${version}-${VERSION_SUFFIX}` : version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span>Tauri + React + TypeScript</span>
          </div>
          <p className="text-muted-foreground text-xs pt-1">
            LED animation sequencer for WS2811 / WS2812 strips via UDP.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
