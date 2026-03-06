import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';

export function LayerPanel() {
  const { project, selectLayer, removeLayer, duplicateLayer, updateLayer, moveLayer } = useProjectStore();
  const { layers, selectedLayerId } = project;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const layer = layers[draggedIndex];
      moveLayer(layer.id, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  return (
    <div className="space-y-1">
        {layers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No layers yet. Add an effect to get started.
          </div>
        ) : (
          [...layers].reverse().map((layer, reverseIndex) => {
            const index = layers.length - 1 - reverseIndex;
            const isSelected = layer.id === selectedLayerId;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
              <div
                key={layer.id}
                draggable={!layer.locked}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                  isSelected && "bg-accent",
                  !isSelected && "hover:bg-muted",
                  isDragging && "opacity-50",
                  isDragOver && "border-t-2 border-primary"
                )}
                onClick={() => selectLayer(layer.id)}
              >
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { enabled: !layer.enabled });
                  }}
                >
                  {layer.enabled ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{layer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(layer.transform.opacity * 100)}% • {layer.transform.blend}
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { locked: !layer.locked });
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
    </div>
  );
}
