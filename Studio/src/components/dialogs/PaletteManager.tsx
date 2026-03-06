import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { usePaletteStore, ColorPalette, ColorVariable } from '@/store/paletteStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Plus, Trash2, Edit2, Download, Upload, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaletteManager({ open, onOpenChange }: PaletteManagerProps) {
  const {
    palettes,
    activePaletteId,
    createPalette,
    deletePalette,
    renamePalette,
    setActivePalette,
    addColor,
    updateColor,
    deleteColor,
    exportPalette,
    importPalette,
  } = usePaletteStore();
  
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(activePaletteId);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorValue, setNewColorValue] = useState('#ffffff');
  const [newPaletteName, setNewPaletteName] = useState('');
  const [editValue, setEditValue] = useState('');
  
  const selectedPalette = palettes.find(p => p.id === selectedPaletteId);
  
  const handleCreatePalette = () => {
    if (!newPaletteName.trim()) return;
    const newPalette = createPalette(newPaletteName);
    setSelectedPaletteId(newPalette.id);
    setNewPaletteName('');
  };
  
  const handleAddColor = () => {
    if (!selectedPaletteId || !newColorName.trim()) return;
    addColor(selectedPaletteId, newColorName, newColorValue);
    setNewColorName('');
    setNewColorValue('#ffffff');
  };
  
  const handleExport = () => {
    if (!selectedPaletteId) return;
    const json = exportPalette(selectedPaletteId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPalette?.name || 'palette'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const json = e.target?.result as string;
        const palette = importPalette(json);
        if (palette) {
          setSelectedPaletteId(palette.id);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const startEditingColor = (color: ColorVariable) => {
    setEditingColorId(color.id);
    setEditValue(color.name);
  };
  
  const saveColorEdit = (paletteId: string, colorId: string) => {
    if (editValue.trim()) {
      updateColor(paletteId, colorId, { name: editValue });
    }
    setEditingColorId(null);
  };
  
  const startEditingPalette = (palette: ColorPalette) => {
    setEditingPaletteId(palette.id);
    setEditValue(palette.name);
  };
  
  const savePaletteEdit = (paletteId: string) => {
    if (editValue.trim()) {
      renamePalette(paletteId, editValue);
    }
    setEditingPaletteId(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Color Palette Manager</DialogTitle>
          <DialogDescription>
            Create and manage global color palettes for your effects
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Palette List */}
          <div className="w-48 space-y-2 flex flex-col">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New palette..."
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePalette()}
                className="h-8 text-xs flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCreatePalette}
                title="Create palette"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-1 border rounded-md p-2 bg-muted/30">
              {palettes.map((palette) => (
                <div key={palette.id} className="group">
                  {editingPaletteId === palette.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePaletteEdit(palette.id);
                          if (e.key === 'Escape') setEditingPaletteId(null);
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => savePaletteEdit(palette.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingPaletteId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                        selectedPaletteId === palette.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setSelectedPaletteId(palette.id)}
                    >
                      <span className="text-xs truncate flex-1">{palette.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingPalette(palette);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {palette.id !== 'default' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePalette(palette.id);
                              if (selectedPaletteId === palette.id) {
                                setSelectedPaletteId(palettes[0]?.id || null);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={handleImport}
                title="Import palette from JSON"
              >
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={handleExport}
                disabled={!selectedPaletteId}
                title="Export palette to JSON"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Color Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedPalette ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{selectedPalette.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedPalette.colors.length} colors
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={activePaletteId === selectedPalette.id ? 'default' : 'secondary'}
                    onClick={() => setActivePalette(selectedPalette.id)}
                  >
                    {activePaletteId === selectedPalette.id ? 'Active' : 'Set Active'}
                  </Button>
                </div>
                
                {/* Add Color Form */}
                <Card className="p-3 mb-3 bg-muted/30">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Color Name</Label>
                      <Input
                        placeholder="e.g., Primary Blue"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={newColorValue}
                        onChange={(e) => setNewColorValue(e.target.value)}
                        className="h-8 mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={handleAddColor}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
                
                {/* Color List */}
                <div className="flex-1 overflow-auto">
                  {selectedPalette.colors.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      No colors yet. Add one above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPalette.colors.map((color) => (
                        <Card key={color.id} className="p-3 group hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded border-2 border-border flex-shrink-0"
                              style={{ backgroundColor: color.color }}
                            />
                            <div className="flex-1 min-w-0">
                              {editingColorId === color.id ? (
                                <div className="space-y-1">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveColorEdit(selectedPalette.id, color.id);
                                      if (e.key === 'Escape') setEditingColorId(null);
                                    }}
                                    className="h-6 text-xs"
                                    autoFocus
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => saveColorEdit(selectedPalette.id, color.id)}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => setEditingColorId(null)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium text-sm truncate">{color.name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {color.color}
                                  </div>
                                  <div className="text-xs text-muted-foreground/70 truncate">
                                    {selectedPalette.id}:{color.id}
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                              <Input
                                type="color"
                                value={color.color}
                                onChange={(e) => updateColor(selectedPalette.id, color.id, { color: e.target.value })}
                                className="h-6 w-6 p-0 border-0"
                                title="Change color"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => startEditingColor(color)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => deleteColor(selectedPalette.id, color.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a palette to view its colors
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper component that listens to Tauri menu events
export function PaletteManagerDialog() {
  const [open, setOpen] = useState(false);
  
  // Listen for menu event to open dialog
  useEffect(() => {
    const unlisten = listen('open-palettes', () => {
      setOpen(true);
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
  
  return <PaletteManager open={open} onOpenChange={setOpen} />;
}
