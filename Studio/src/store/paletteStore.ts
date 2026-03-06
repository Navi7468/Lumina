import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColorVariable {
  id: string;
  name: string;
  color: string; // hex color
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: ColorVariable[];
}

interface PaletteStore {
  palettes: ColorPalette[];
  activePaletteId: string | null;
  
  // Palette management
  createPalette: (name: string) => ColorPalette;
  deletePalette: (id: string) => void;
  renamePalette: (id: string, name: string) => void;
  setActivePalette: (id: string | null) => void;
  
  // Color variable management
  addColor: (paletteId: string, name: string, color: string) => ColorVariable;
  updateColor: (paletteId: string, colorId: string, updates: Partial<ColorVariable>) => void;
  deleteColor: (paletteId: string, colorId: string) => void;
  
  // Utilities
  getActivePalette: () => ColorPalette | null;
  getPalette: (id: string) => ColorPalette | undefined;
  getColor: (paletteId: string, colorId: string) => ColorVariable | undefined;
  resolveColorValue: (colorOrVariableId: string) => string; // Returns hex color
  
  // Import/Export
  exportPalette: (id: string) => string; // JSON string
  importPalette: (json: string) => ColorPalette | null;
}

const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: 'default',
    name: 'Default',
    colors: [
      { id: 'red', name: 'Red', color: '#ff0000' },
      { id: 'green', name: 'Green', color: '#00ff00' },
      { id: 'blue', name: 'Blue', color: '#0000ff' },
      { id: 'white', name: 'White', color: '#ffffff' },
      { id: 'cyan', name: 'Cyan', color: '#00ffff' },
      { id: 'magenta', name: 'Magenta', color: '#ff00ff' },
      { id: 'yellow', name: 'Yellow', color: '#ffff00' },
      { id: 'orange', name: 'Orange', color: '#ff8800' },
    ],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: [
      { id: 'neon-pink', name: 'Neon Pink', color: '#ff00ff' },
      { id: 'neon-cyan', name: 'Neon Cyan', color: '#00ffff' },
      { id: 'electric-blue', name: 'Electric Blue', color: '#0088ff' },
      { id: 'hot-pink', name: 'Hot Pink', color: '#ff0088' },
      { id: 'neon-green', name: 'Neon Green', color: '#00ff88' },
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: [
      { id: 'sunset-orange', name: 'Sunset Orange', color: '#ff6b35' },
      { id: 'golden-yellow', name: 'Golden Yellow', color: '#fbc02d' },
      { id: 'warm-red', name: 'Warm Red', color: '#e63946' },
      { id: 'amber', name: 'Amber', color: '#f77f00' },
      { id: 'cream', name: 'Cream', color: '#ffe8d1' },
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: [
      { id: 'ice-blue', name: 'Ice Blue', color: '#a0d2eb' },
      { id: 'deep-blue', name: 'Deep Blue', color: '#0055aa' },
      { id: 'mint', name: 'Mint', color: '#90ee90' },
      { id: 'lavender', name: 'Lavender', color: '#b19cd9' },
      { id: 'teal', name: 'Teal', color: '#20b2aa' },
    ],
  },
];

export const usePaletteStore = create<PaletteStore>()(
  persist(
    (set, get) => ({
      palettes: DEFAULT_PALETTES,
      activePaletteId: 'default',
      
      createPalette: (name: string) => {
        const newPalette: ColorPalette = {
          id: `palette-${Date.now()}`,
          name,
          colors: [],
        };
        
        set((state) => ({
          palettes: [...state.palettes, newPalette],
        }));
        
        return newPalette;
      },
      
      deletePalette: (id: string) => {
        set((state) => ({
          palettes: state.palettes.filter(p => p.id !== id),
          activePaletteId: state.activePaletteId === id ? null : state.activePaletteId,
        }));
      },
      
      renamePalette: (id: string, name: string) => {
        set((state) => ({
          palettes: state.palettes.map(p =>
            p.id === id ? { ...p, name } : p
          ),
        }));
      },
      
      setActivePalette: (id: string | null) => {
        set({ activePaletteId: id });
      },
      
      addColor: (paletteId: string, name: string, color: string) => {
        const newColor: ColorVariable = {
          id: `color-${Date.now()}`,
          name,
          color,
        };
        
        set((state) => ({
          palettes: state.palettes.map(p =>
            p.id === paletteId
              ? { ...p, colors: [...p.colors, newColor] }
              : p
          ),
        }));
        
        return newColor;
      },
      
      updateColor: (paletteId: string, colorId: string, updates: Partial<ColorVariable>) => {
        set((state) => ({
          palettes: state.palettes.map(p =>
            p.id === paletteId
              ? {
                  ...p,
                  colors: p.colors.map(c =>
                    c.id === colorId ? { ...c, ...updates } : c
                  ),
                }
              : p
          ),
        }));
      },
      
      deleteColor: (paletteId: string, colorId: string) => {
        set((state) => ({
          palettes: state.palettes.map(p =>
            p.id === paletteId
              ? { ...p, colors: p.colors.filter(c => c.id !== colorId) }
              : p
          ),
        }));
      },
      
      getActivePalette: () => {
        const state = get();
        if (!state.activePaletteId) return null;
        return state.palettes.find(p => p.id === state.activePaletteId) || null;
      },
      
      getPalette: (id: string) => {
        return get().palettes.find(p => p.id === id);
      },
      
      getColor: (paletteId: string, colorId: string) => {
        const palette = get().palettes.find(p => p.id === paletteId);
        return palette?.colors.find(c => c.id === colorId);
      },
      
      resolveColorValue: (colorOrVariableId: string) => {
        // If it's already a hex color, return it
        if (colorOrVariableId.startsWith('#')) {
          return colorOrVariableId;
        }
        
        // Try to resolve as variable (format: "paletteId:colorId")
        const [paletteId, colorId] = colorOrVariableId.split(':');
        if (paletteId && colorId) {
          const color = get().getColor(paletteId, colorId);
          if (color) return color.color;
        }
        
        // Fallback to white if resolution fails
        return '#ffffff';
      },
      
      exportPalette: (id: string) => {
        const palette = get().palettes.find(p => p.id === id);
        if (!palette) return '{}';
        return JSON.stringify(palette, null, 2);
      },
      
      importPalette: (json: string) => {
        try {
          const palette = JSON.parse(json) as ColorPalette;
          
          // Validate structure
          if (!palette.id || !palette.name || !Array.isArray(palette.colors)) {
            return null;
          }
          
          // Ensure unique ID
          const existingIds = get().palettes.map(p => p.id);
          if (existingIds.includes(palette.id)) {
            palette.id = `${palette.id}-${Date.now()}`;
          }
          
          set((state) => ({
            palettes: [...state.palettes, palette],
          }));
          
          return palette;
        } catch (error) {
          console.error('Failed to import palette:', error);
          return null;
        }
      },
    }),
    {
      name: 'led-palette-storage',
      version: 1,
    }
  )
);
