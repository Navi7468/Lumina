import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { EffectLayer } from '@/engine/Layer';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { ModifiersLibrary } from '../editors/ModifiersLibrary';
import { GradientEditor } from '../editors/GradientEditor';
import { Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import type { BlendMode } from '@/engine/types';

export function PropertiesPanel() {
  const { 
    project, 
    updateLayer, 
    addModifierToLayer, 
    removeModifierFromLayer, 
    updateModifierParameter, 
    toggleModifier,
    addEnvelopeKeyframe,
    removeEnvelopeKeyframe,
  } = useProjectStore();
  const selectedLayer = project.layers.find(l => l.id === project.selectedLayerId);
  
  const [isModifierLibraryOpen, setIsModifierLibraryOpen] = useState(false);
  const [expandedModifiers, setExpandedModifiers] = useState<Set<string>>(new Set());
  
  if (!selectedLayer) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No layer selected
      </div>
    );
  }
  
  const isEffectLayer = selectedLayer instanceof EffectLayer;
  const isAdjustmentLayer = selectedLayer instanceof AdjustmentLayer;
  const effect = isEffectLayer ? selectedLayer.getEffect() : null;
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLayer(selectedLayer.id, { name: e.target.value });
  };
  
  const handleOpacityChange = (value: number[]) => {
    updateLayer(selectedLayer.id, {
      transform: { ...selectedLayer.transform, opacity: value[0] },
    });
  };
  
  const handleBlendModeChange = (value: BlendMode) => {
    updateLayer(selectedLayer.id, {
      transform: { ...selectedLayer.transform, blend: value },
    });
  };
  
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) * 1000; // Convert seconds to ms
    if (!isNaN(value) && value >= 0) {
      updateLayer(selectedLayer.id, { startTime: value });
    }
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) * 1000; // Convert seconds to ms
    if (!isNaN(value) && value > 0) {
      updateLayer(selectedLayer.id, { duration: value });
    }
  };
  
  const handleLedStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      updateLayer(selectedLayer.id, { ledStart: value });
    }
  };
  
  const handleLedEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      updateLayer(selectedLayer.id, { ledEnd: value });
    }
  };
  
  const handleParameterChange = (key: string, value: any) => {
    if (isEffectLayer) {
      selectedLayer.setParameter(key, value);
      // Trigger React state update to re-render with new parameter values
      updateLayer(selectedLayer.id, {});
    }
  };
  
  const handleAddModifier = (modifierId: string) => {
    if (selectedLayer) {
      addModifierToLayer(selectedLayer.id, modifierId);
    }
  };
  
  const handleRemoveModifier = (modifierInstanceId: string) => {
    if (selectedLayer) {
      removeModifierFromLayer(selectedLayer.id, modifierInstanceId);
    }
  };
  
  const handleToggleModifier = (modifierInstanceId: string) => {
    if (selectedLayer) {
      toggleModifier(selectedLayer.id, modifierInstanceId);
    }
  };
  
  // LED Selection helpers
  const formatLEDMask = (mask: number[]): string => {
    if (!mask || mask.length === 0) return 'None';
    
    // Sort the mask
    const sorted = [...mask].sort((a, b) => a - b);
    
    // Group into ranges
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];
    
    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === rangeEnd + 1) {
        rangeEnd = sorted[i];
      } else {
        if (rangeStart === rangeEnd) {
          ranges.push(`${rangeStart}`);
        } else if (rangeEnd === rangeStart + 1) {
          ranges.push(`${rangeStart}, ${rangeEnd}`);
        } else {
          ranges.push(`${rangeStart}-${rangeEnd}`);
        }
        if (i < sorted.length) {
          rangeStart = sorted[i];
          rangeEnd = sorted[i];
        }
      }
    }
    
    // Limit display to avoid overflow
    if (ranges.length > 5) {
      return `${ranges.slice(0, 5).join(', ')}... (${sorted.length} total)`;
    }
    return ranges.join(', ');
  };
  
  const handleSelectAllLEDs = () => {
    const allLEDs = Array.from({ length: project.config.ledCount }, (_, i) => i);
    updateLayer(selectedLayer.id, { ledMask: allLEDs });
  };
  
  const handleSelectEveryOther = () => {
    const everyOther = Array.from({ length: project.config.ledCount }, (_, i) => i).filter((_, idx) => idx % 2 === 0);
    updateLayer(selectedLayer.id, { ledMask: everyOther });
  };
  
  const handleSelectFirstHalf = () => {
    const half = Math.floor(project.config.ledCount / 2);
    const firstHalf = Array.from({ length: half }, (_, i) => i);
    updateLayer(selectedLayer.id, { ledMask: firstHalf });
  };
  
  const handleSelectLastHalf = () => {
    const half = Math.floor(project.config.ledCount / 2);
    const lastHalf = Array.from({ length: project.config.ledCount - half }, (_, i) => i + half);
    updateLayer(selectedLayer.id, { ledMask: lastHalf });
  };
  
  const handleClearSelection = () => {
    updateLayer(selectedLayer.id, { ledMask: [] });
  };

  const handleModifierParameterChange = (modifierInstanceId: string, key: string, value: any) => {
    if (selectedLayer) {
      updateModifierParameter(selectedLayer.id, modifierInstanceId, key, value);
    }
  };
  
  const toggleModifierExpanded = (modifierInstanceId: string) => {
    setExpandedModifiers(prev => {
      const next = new Set(prev);
      if (next.has(modifierInstanceId)) {
        next.delete(modifierInstanceId);
      } else {
        next.add(modifierInstanceId);
      }
      return next;
    });
  };
  
  return (
    <div className="space-y-6">
        {/* Adjustment Layer Badge */}
        {isAdjustmentLayer && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <Layers className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Adjustment Layer</div>
              <div className="text-xs text-muted-foreground">
                Modifiers affect all layers below this one
              </div>
            </div>
          </div>
        )}
        
        {/* Basic Properties */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Layer</h3>
          
          <div className="space-y-2">
            <Label htmlFor="layer-name" className="text-xs">Name</Label>
            <Input
              id="layer-name"
              value={selectedLayer.name}
              onChange={handleNameChange}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opacity" className="text-xs">
              Opacity: {Math.round(selectedLayer.transform.opacity * 100)}%
            </Label>
            <Slider
              id="opacity"
              min={0}
              max={1}
              step={0.01}
              value={[selectedLayer.transform.opacity]}
              onValueChange={handleOpacityChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="blend-mode" className="text-xs">Blend Mode</Label>
            <Select value={selectedLayer.transform.blend} onValueChange={handleBlendModeChange}>
              <SelectTrigger id="blend-mode" className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="multiply">Multiply</SelectItem>
                <SelectItem value="screen">Screen</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
                <SelectItem value="difference">Difference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Timing Properties */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-medium">Timing</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-xs">Start (s)</Label>
              <Input
                id="start-time"
                type="number"
                min={0}
                step={0.1}
                value={(selectedLayer.startTime / 1000).toFixed(2)}
                onChange={handleStartTimeChange}
                className="h-8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-xs">Duration (s)</Label>
              <Input
                id="duration"
                type="number"
                min={0.1}
                step={0.1}
                value={(selectedLayer.duration / 1000).toFixed(2)}
                onChange={handleDurationChange}
                className="h-8"
              />
            </div>
          </div>
        </div>
        
        {/* LED Range Properties */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-medium">LED Range</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="led-start" className="text-xs">Start LED</Label>
              <Input
                id="led-start"
                type="number"
                min={0}
                max={project.config.ledCount - 1}
                value={selectedLayer.ledStart}
                onChange={handleLedStartChange}
                className="h-8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="led-end" className="text-xs">
                End LED {selectedLayer.ledEnd === -1 && '(All)'}
              </Label>
              <Input
                id="led-end"
                type="number"
                min={-1}
                max={project.config.ledCount - 1}
                value={selectedLayer.ledEnd}
                onChange={handleLedEndChange}
                className="h-8"
                placeholder="-1 for all"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Affects LEDs {selectedLayer.ledStart} to{' '}
            {selectedLayer.ledEnd === -1 ? project.config.ledCount - 1 : selectedLayer.ledEnd}
            {' '}({(selectedLayer.ledEnd === -1 ? project.config.ledCount : selectedLayer.ledEnd - selectedLayer.ledStart + 1)} LEDs)
          </p>
        </div>
        
        {/* LED Selection */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-medium">LED Selection</h3>
          
          {selectedLayer.ledMask && selectedLayer.ledMask.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {selectedLayer.ledMask.length} LED{selectedLayer.ledMask.length !== 1 ? 's' : ''} selected
              </div>
              <div className="text-xs font-mono bg-muted/50 p-2 rounded border max-h-16 overflow-y-auto">
                {formatLEDMask(selectedLayer.ledMask)}
              </div>
              <Button 
                onClick={handleClearSelection}
                variant="secondary"
                className="w-full h-8 text-xs"
              >
                Clear Selection
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No specific LEDs selected (uses LED Range above)
            </div>
          )}
          
          {/* Selection Presets */}
          <div className="space-y-2">
            <Label className="text-xs">Quick Selections</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleSelectAllLEDs}
                variant="secondary"
                className="h-8 text-xs"
              >
                Select All
              </Button>
              <Button 
                onClick={handleSelectEveryOther}
                variant="secondary"
                className="h-8 text-xs"
              >
                Every Other
              </Button>
              <Button 
                onClick={handleSelectFirstHalf}
                variant="secondary"
                className="h-8 text-xs"
              >
                First Half
              </Button>
              <Button 
                onClick={handleSelectLastHalf}
                variant="secondary"
                className="h-8 text-xs"
              >
                Last Half
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Use the selection tool in the preview to select specific LEDs. LED Selection overrides LED Range when active.
          </p>
        </div>
        
        {/* Effect Parameters */}
        {isEffectLayer && effect && effect.parameters.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-medium">Effect: {effect.metadata.name}</h3>
            
            {effect.parameters.map((param) => {
              const currentValue = selectedLayer.getParameter(param.key);
              
              if (param.type === 'number' || param.type === 'range') {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={`param-${param.key}`} className="text-xs">
                      {param.label}: {currentValue}
                    </Label>
                    {param.type === 'range' ? (
                      <Slider
                        id={`param-${param.key}`}
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step ?? 1}
                        value={[currentValue]}
                        onValueChange={(v: number[]) => handleParameterChange(param.key, v[0])}
                      />
                    ) : (
                      <Input
                        id={`param-${param.key}`}
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={param.step ?? 1}
                        value={currentValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParameterChange(param.key, parseFloat(e.target.value))}
                        className="h-8"
                      />
                    )}
                  </div>
                );
              }
              
              if (param.type === 'color') {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={`param-${param.key}`} className="text-xs">{param.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`param-${param.key}`}
                        type="color"
                        value={`#${currentValue.map((c: number) => c.toString(16).padStart(2, '0')).join('')}`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const hex = e.target.value.slice(1);
                          const rgb: [number, number, number] = [
                            parseInt(hex.slice(0, 2), 16),
                            parseInt(hex.slice(2, 4), 16),
                            parseInt(hex.slice(4, 6), 16),
                          ];
                          handleParameterChange(param.key, rgb);
                        }}
                        className="h-8 w-16"
                      />
                      <Input
                        value={`rgb(${currentValue.join(', ')})`}
                        readOnly
                        className="h-8 flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                );
              }
              
              if (param.type === 'gradient') {
                return (
                  <div key={param.key}>
                    <GradientEditor
                      gradient={currentValue || param.default}
                      onChange={(gradient) => handleParameterChange(param.key, gradient)}
                    />
                  </div>
                );
              }
              
              if (param.type === 'boolean') {
                return (
                  <div key={param.key} className="flex items-center space-x-2">
                    <input
                      id={`param-${param.key}`}
                      type="checkbox"
                      checked={currentValue}
                      onChange={(e) => handleParameterChange(param.key, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`param-${param.key}`} className="text-xs">{param.label}</Label>
                  </div>
                );
              }
              
              if (param.type === 'select' && param.options) {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={`param-${param.key}`} className="text-xs">{param.label}</Label>
                    <Select
                      value={String(currentValue)}
                      onValueChange={(v: string) => handleParameterChange(param.key, v)}
                    >
                      <SelectTrigger id={`param-${param.key}`} className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        )}
        
        {/* Modifiers Section */}
        {isEffectLayer && selectedLayer.modifiers && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Modifiers</h3>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2"
                onClick={() => setIsModifierLibraryOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            {selectedLayer.modifiers && selectedLayer.modifiers.length > 0 ? (
              <div className="space-y-2">
                {selectedLayer.modifiers.map((modInstance) => {
                  const isExpanded = expandedModifiers.has(modInstance.id);
                  
                  return (
                    <div key={modInstance.id} className="border rounded-lg p-2 bg-muted/30">
                      {/* Modifier Header */}
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 hover:bg-muted rounded cursor-move"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </button>
                        
                        <button
                          className="flex-1 flex items-center gap-1 text-left"
                          onClick={() => toggleModifierExpanded(modInstance.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span className="text-sm font-medium">
                            {modInstance.modifier.metadata.name}
                          </span>
                        </button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleToggleModifier(modInstance.id)}
                          title={modInstance.enabled ? 'Disable' : 'Enable'}
                        >
                          {modInstance.enabled ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveModifier(modInstance.id)}
                          title="Remove modifier"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Modifier Parameters */}
                      {isExpanded && modInstance.modifier.parameters.length > 0 && (
                        <div className="mt-3 space-y-3 pl-6">
                          {modInstance.modifier.parameters.map((param) => {
                            const currentValue = modInstance.parameters[param.key];
                            
                            if (param.type === 'number' || param.type === 'range') {
                              return (
                                <div key={param.key} className="space-y-2">
                                  <Label htmlFor={`mod-${modInstance.id}-${param.key}`} className="text-xs">
                                    {param.label}: {typeof currentValue === 'number' ? currentValue.toFixed(3) : currentValue}
                                  </Label>
                                  {param.type === 'range' ? (
                                    <Slider
                                      id={`mod-${modInstance.id}-${param.key}`}
                                      min={param.min ?? 0}
                                      max={param.max ?? 100}
                                      step={param.step ?? 1}
                                      value={[currentValue]}
                                      onValueChange={(v: number[]) => handleModifierParameterChange(modInstance.id, param.key, v[0])}
                                    />
                                  ) : (
                                    <Input
                                      id={`mod-${modInstance.id}-${param.key}`}
                                      type="number"
                                      min={param.min}
                                      max={param.max}
                                      step={param.step ?? 1}
                                      value={currentValue}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        handleModifierParameterChange(modInstance.id, param.key, parseFloat(e.target.value))
                                      }
                                      className="h-8"
                                    />
                                  )}
                                </div>
                              );
                            }
                            
                            if (param.type === 'boolean') {
                              return (
                                <div key={param.key} className="flex items-center space-x-2">
                                  <input
                                    id={`mod-${modInstance.id}-${param.key}`}
                                    type="checkbox"
                                    checked={currentValue}
                                    onChange={(e) => handleModifierParameterChange(modInstance.id, param.key, e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor={`mod-${modInstance.id}-${param.key}`} className="text-xs">
                                    {param.label}
                                  </Label>
                                </div>
                              );
                            }
                            
                            if (param.type === 'select' && param.options) {
                              return (
                                <div key={param.key} className="space-y-2">
                                  <Label htmlFor={`mod-${modInstance.id}-${param.key}`} className="text-xs">
                                    {param.label}
                                  </Label>
                                  <Select
                                    value={String(currentValue)}
                                    onValueChange={(v: string) => handleModifierParameterChange(modInstance.id, param.key, v)}
                                  >
                                    <SelectTrigger id={`mod-${modInstance.id}-${param.key}`} className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.options.map((opt) => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }
                            
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No modifiers added. Click "Add" to add post-processing effects.
              </p>
            )}
          </div>
        )}
        
        {/* Adjustment Layer Envelope Section */}
        {isAdjustmentLayer && (
          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-medium">Envelope-Controlled Modifier</h3>
            
            <div className="space-y-2">
              <Label className="text-xs">Modifier Type</Label>
              <p className="text-xs text-muted-foreground mb-2">
                The envelope controls the modifier's primary parameter over time
              </p>
              <Select
                value={selectedLayer.modifierType}
                onValueChange={(value: string) => {
                  if (selectedLayer instanceof AdjustmentLayer) {
                    selectedLayer.setModifier(value);
                    updateLayer(selectedLayer.id, {});
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builtin.modifier.brightness">Brightness</SelectItem>
                  <SelectItem value="builtin.modifier.blur">Blur</SelectItem>
                  <SelectItem value="builtin.modifier.saturation">Saturation</SelectItem>
                  <SelectItem value="builtin.modifier.gamma">Gamma</SelectItem>
                  <SelectItem value="builtin.modifier.hueshift">Hue Shift</SelectItem>
                  <SelectItem value="builtin.modifier.fade">Fade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Envelope Keyframes</Label>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    if (selectedLayer instanceof AdjustmentLayer) {
                      // Add keyframe at current playhead position with 50% value
                      const relativeTime = project.playhead - selectedLayer.startTime;
                      const clampedTime = Math.max(0, Math.min(relativeTime, selectedLayer.duration));
                      addEnvelopeKeyframe(selectedLayer.id, clampedTime, 0.5);
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedLayer.envelope.map((kf, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs bg-muted/30 rounded p-2">
                    <span className="text-muted-foreground min-w-12">
                      {(kf.time / 1000).toFixed(2)}s
                    </span>
                    <span className="flex-1">
                      {(kf.value * 100).toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground min-w-16">
                      {kf.interpolation}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (selectedLayer instanceof AdjustmentLayer) {
                          removeEnvelopeKeyframe(selectedLayer.id, index);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Modifiers Library Dialog */}
        <ModifiersLibrary
          open={isModifierLibraryOpen}
          onOpenChange={setIsModifierLibraryOpen}
          onSelectModifier={handleAddModifier}
        />
    </div>
  );
}
