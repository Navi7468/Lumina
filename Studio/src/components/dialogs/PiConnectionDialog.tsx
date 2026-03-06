import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Play, Move } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';

export function PiConnectionDialog() {
  const { 
    project, 
    isPiConnected, 
    isStreamingOnPlayback, 
    isStreamingOnScrub, 
    setPiConnected, 
    setStreamingOnPlayback, 
    setStreamingOnScrub 
  } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [ip, setIp] = useState(project.config.piIp);
  const [port, setPort] = useState(project.config.piPort.toString());
  const [error, setError] = useState<string | null>(null);

  // Listen for menu event to open connection dialog
  useEffect(() => {
    const unlistenOpen = listen('open-pi-connect', () => {
      setOpen(true);
    });

    const unlistenDisconnect = listen('pi-disconnect', () => {
      handleDisconnect();
    });

    return () => {
      unlistenOpen.then(fn => fn());
      unlistenDisconnect.then(fn => fn());
    };
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      const result = await invoke<string>('connect_to_pi', {
        ip,
        port: parseInt(port),
      });
      console.log(result);
      setPiConnected(true);
      setOpen(false);
    } catch (err) {
      setError(err as string);
    }
  };

  const handleDisconnect = async () => {
    try {
      await invoke('disconnect');
      setPiConnected(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <div className="flex items-center gap-2">
        {isPiConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-500">Connected</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={handleDisconnect}
            >
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
            
            {/* Streaming Mode Toggles */}
            <div className="h-4 w-px bg-border mx-1" />
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-2 text-xs",
                isStreamingOnPlayback && "bg-primary/20 text-primary"
              )}
              onClick={() => setStreamingOnPlayback(!isStreamingOnPlayback)}
              title="Stream during playback"
            >
              <Play className="h-3 w-3 mr-1" />
              Play
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-2 text-xs",
                isStreamingOnScrub && "bg-primary/20 text-primary"
              )}
              onClick={() => setStreamingOnScrub(!isStreamingOnScrub)}
              title="Stream on scrub/preview"
            >
              <Move className="h-3 w-3 mr-1" />
              Scrub
            </Button>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Not Connected</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => setOpen(true)}
            >
              <Wifi className="h-3 w-3 mr-1" />
              Connect
            </Button>
          </>
        )}
      </div>

      {/* Connection Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Raspberry Pi</DialogTitle>
            <DialogDescription>
              Enter the IP address and port of your Raspberry Pi running the LED server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pi-ip">IP Address</Label>
              <Input
                id="pi-ip"
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pi-port">Port</Label>
              <Input
                id="pi-port"
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="7777"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>
              <Wifi className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
