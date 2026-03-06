import { Button } from '../ui/button';
import { MousePointer2, Hand, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionToolbarProps {
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  selectionCount: number;
  disabled?: boolean;
}

export function SelectionToolbar({
  selectionMode,
  onToggleSelectionMode,
  onClearSelection,
  selectionCount,
  disabled = false,
}: SelectionToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
      <Button
        size="sm"
        variant={selectionMode ? 'default' : 'secondary'}
        onClick={onToggleSelectionMode}
        disabled={disabled}
        className="h-8"
        title={selectionMode ? 'View Mode' : 'Selection Mode'}
      >
        {selectionMode ? (
          <>
            <MousePointer2 className="h-4 w-4 mr-1" />
            Selecting
          </>
        ) : (
          <>
            <Hand className="h-4 w-4 mr-1" />
            View
          </>
        )}
      </Button>
      
      {selectionCount > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {selectionCount} LED{selectionCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-8"
            title="Clear Selection"
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </>
      )}
      
      {selectionMode && (
        <div className="text-xs text-muted-foreground ml-2">
          Click and drag to select LEDs
        </div>
      )}
    </div>
  );
}
