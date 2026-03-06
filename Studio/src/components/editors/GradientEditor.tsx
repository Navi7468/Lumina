import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Gradient, ColorStop, gradientToCSS, GRADIENT_PRESETS } from '@/lib/gradientUtils';
import { cn } from '@/lib/utils';

interface GradientEditorProps {
  gradient: Gradient;
  onChange: (gradient: Gradient) => void;
  className?: string;
}

export function GradientEditor({ gradient, onChange, className }: GradientEditorProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const selectedStop = selectedStopIndex !== null ? sortedStops[selectedStopIndex] : null;
  
  // Handle adding a new color stop
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingIndex !== null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    
    // Don't add if clicking on an existing stop
    const clickedOnStop = sortedStops.some(stop => {
      const stopX = stop.position * rect.width;
      return Math.abs(x - stopX) < 10;
    });
    
    if (clickedOnStop) return;
    
    // Sample the gradient at this position to get a smooth color
    const newColor = sampleColorAtPosition(position);
    
    const newStop: ColorStop = { position, color: newColor };
    const newGradient: Gradient = {
      stops: [...gradient.stops, newStop],
    };
    
    onChange(newGradient);
    
    // Select the newly added stop
    const newIndex = [...newGradient.stops].sort((a, b) => a.position - b.position)
      .findIndex(s => s.position === position && s.color === newColor);
    setSelectedStopIndex(newIndex);
  };
  
  // Sample the current gradient at a position
  const sampleColorAtPosition = (position: number): string => {
    if (sortedStops.length === 0) return '#ffffff';
    if (sortedStops.length === 1) return sortedStops[0].color;
    
    // Find surrounding stops
    let leftStop = sortedStops[0];
    let rightStop = sortedStops[sortedStops.length - 1];
    
    for (let i = 0; i < sortedStops.length - 1; i++) {
      if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
        leftStop = sortedStops[i];
        rightStop = sortedStops[i + 1];
        break;
      }
    }
    
    // Simple RGB interpolation
    const range = rightStop.position - leftStop.position;
    const t = range === 0 ? 0 : (position - leftStop.position) / range;
    
    const r1 = parseInt(leftStop.color.slice(1, 3), 16);
    const g1 = parseInt(leftStop.color.slice(3, 5), 16);
    const b1 = parseInt(leftStop.color.slice(5, 7), 16);
    
    const r2 = parseInt(rightStop.color.slice(1, 3), 16);
    const g2 = parseInt(rightStop.color.slice(3, 5), 16);
    const b2 = parseInt(rightStop.color.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Handle dragging a stop
  const handleStopMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggingIndex(index);
    setSelectedStopIndex(index);
  };
  
  useEffect(() => {
    if (draggingIndex === null) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(1, x / rect.width));
      
      const newStops = [...gradient.stops];
      newStops[draggingIndex] = { ...newStops[draggingIndex], position };
      
      onChange({ stops: newStops });
    };
    
    const handleMouseUp = () => {
      setDraggingIndex(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, gradient.stops, onChange]);
  
  // Handle color change
  const handleColorChange = (color: string) => {
    if (selectedStopIndex === null) return;
    
    const newStops = [...gradient.stops];
    const stopToUpdate = sortedStops[selectedStopIndex];
    const originalIndex = gradient.stops.findIndex(s => s === stopToUpdate);
    
    newStops[originalIndex] = { ...newStops[originalIndex], color };
    onChange({ stops: newStops });
  };
  
  // Handle position change (manual input)
  const handlePositionChange = (position: number) => {
    if (selectedStopIndex === null) return;
    
    const newStops = [...gradient.stops];
    const stopToUpdate = sortedStops[selectedStopIndex];
    const originalIndex = gradient.stops.findIndex(s => s === stopToUpdate);
    
    newStops[originalIndex] = { ...newStops[originalIndex], position: Math.max(0, Math.min(1, position)) };
    onChange({ stops: newStops });
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedStopIndex === null || gradient.stops.length <= 2) return;
    
    const stopToDelete = sortedStops[selectedStopIndex];
    const newStops = gradient.stops.filter(s => s !== stopToDelete);
    
    onChange({ stops: newStops });
    setSelectedStopIndex(null);
  };
  
  // Load preset
  const handlePresetSelect = (presetName: string) => {
    onChange(GRADIENT_PRESETS[presetName]);
    setSelectedStopIndex(null);
  };
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Gradient Track */}
      <div className="space-y-2">
        <Label className="text-xs">Gradient</Label>
        <div
          ref={trackRef}
          className="relative h-8 rounded-md cursor-crosshair border border-border"
          style={{
            background: gradientToCSS(gradient),
          }}
          onClick={handleTrackClick}
        >
          {/* Color Stops */}
          {sortedStops.map((stop, index) => {
            const originalIndex = gradient.stops.findIndex(s => s === stop);
            return (
              <div
                key={originalIndex}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing transition-all',
                  selectedStopIndex === index
                    ? 'border-primary scale-125 shadow-lg'
                    : 'border-background hover:scale-110'
                )}
                style={{
                  left: `${stop.position * 100}%`,
                  backgroundColor: stop.color,
                }}
                onMouseDown={(e) => handleStopMouseDown(e, index)}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Click to add stops, drag to reposition
        </p>
      </div>
      
      {/* Selected Stop Controls */}
      {selectedStop && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Selected Stop</Label>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDelete}
              disabled={gradient.stops.length <= 2}
              title="Delete stop (minimum 2 required)"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="w-full h-8 rounded border border-border"
                    style={{ backgroundColor: selectedStop.color }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <Label className="text-xs">Hex Color</Label>
                    <Input
                      type="text"
                      value={selectedStop.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Input
                      type="color"
                      value={selectedStop.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Position</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={selectedStop.position.toFixed(2)}
                onChange={(e) => handlePositionChange(parseFloat(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-xs">Presets</Label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(GRADIENT_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              className="h-6 rounded border border-border hover:border-primary transition-colors"
              style={{ background: gradientToCSS(preset) }}
              onClick={() => handlePresetSelect(name)}
              title={name.replace('_', ' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
