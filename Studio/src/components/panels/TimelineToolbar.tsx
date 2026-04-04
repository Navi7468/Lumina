import { Play, Pause, SkipBack, SkipForward, StepBack, StepForward, ZoomIn, ZoomOut, Repeat } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '@/store/projectStore';
import { usePlaybackStore } from '@/store/playbackStore';

interface TimelineToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function TimelineToolbar({ zoom, onZoomChange }: TimelineToolbarProps) {
  const { project, toggleLoop, skipToEnd, stepBackward, stepForward } = useProjectStore();
  const { isPlaying, play, pause, stop } = usePlaybackStore();
  const { playhead, config, loop } = project;

  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="flex items-center gap-2 p-1 border-b border-border bg-muted/30">
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={stop}
        title="Stop (Go to Beginning)"
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={stepBackward}
        title="Step Backward One Frame"
      >
        <StepBack className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        className="h-6 w-6"
        onClick={isPlaying ? pause : play}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={stepForward}
        title="Step Forward One Frame"
      >
        <StepForward className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={skipToEnd}
        title="Skip to End"
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-border mx-1" />

      <span className="text-xs tabular-nums">
        {formatTime(playhead)} / {formatTime(config.duration)}
      </span>

      <div className="flex-1" />

      <Button
        size="icon"
        variant={loop ? 'default' : 'ghost'}
        className="h-6 w-6"
        onClick={toggleLoop}
        title={loop ? 'Loop Enabled' : 'Loop Disabled'}
      >
        <Repeat className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-border mx-1" />

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => onZoomChange(Math.max(50, zoom - 10))}
        title="Zoom Out"
      >
        <ZoomOut className="h-3 w-3" />
      </Button>

      <span className="text-xs text-muted-foreground w-12 text-center">
        {zoom}%
      </span>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => onZoomChange(Math.min(300, zoom + 10))}
        title="Zoom In"
      >
        <ZoomIn className="h-3 w-3" />
      </Button>
    </div>
  );
}
