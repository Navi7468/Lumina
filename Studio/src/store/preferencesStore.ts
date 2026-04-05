import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type TimelineRenderer = 'html' | 'canvas';
export type LayoutMode = 'daw' | 'studio' | 'node';

export interface KeyBinding {
  id: string;
  description: string;
  keys: string; // e.g., "Ctrl+Z", "Ctrl+Shift+Z", "Ctrl+A"
  command: string;
  category: 'selection' | 'edit' | 'view' | 'file' | 'general';
}

const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // Selection commands
  {
    id: 'selectAll',
    description: 'Select all LEDs',
    keys: 'Ctrl+A',
    command: 'selection.selectAll',
    category: 'selection',
  },
  {
    id: 'clearSelection',
    description: 'Clear LED selection',
    keys: 'Escape',
    command: 'selection.clear',
    category: 'selection',
  },
  {
    id: 'selectEveryOther',
    description: 'Select every other LED',
    keys: 'Ctrl+Shift+E',
    command: 'selection.everyOther',
    category: 'selection',
  },
  {
    id: 'selectFirstHalf',
    description: 'Select first half of LEDs',
    keys: 'Ctrl+Shift+F',
    command: 'selection.firstHalf',
    category: 'selection',
  },
  {
    id: 'selectLastHalf',
    description: 'Select last half of LEDs',
    keys: 'Ctrl+Shift+L',
    command: 'selection.lastHalf',
    category: 'selection',
  },
  
  // Edit commands
  {
    id: 'undo',
    description: 'Undo',
    keys: 'Ctrl+Z',
    command: 'edit.undo',
    category: 'edit',
  },
  {
    id: 'redo',
    description: 'Redo',
    keys: 'Ctrl+Shift+Z',
    command: 'edit.redo',
    category: 'edit',
  },
  {
    id: 'copy',
    description: 'Copy layer',
    keys: 'Ctrl+C',
    command: 'edit.copy',
    category: 'edit',
  },
  {
    id: 'paste',
    description: 'Paste layer',
    keys: 'Ctrl+V',
    command: 'edit.paste',
    category: 'edit',
  },
  {
    id: 'delete',
    description: 'Delete layer',
    keys: 'Delete',
    command: 'edit.delete',
    category: 'edit',
  },
  {
    id: 'duplicate',
    description: 'Duplicate layer',
    keys: 'Ctrl+D',
    command: 'edit.duplicate',
    category: 'edit',
  },
  
  // File commands
  {
    id: 'save',
    description: 'Save project',
    keys: 'Ctrl+S',
    command: 'file.save',
    category: 'file',
  },
  {
    id: 'open',
    description: 'Open project',
    keys: 'Ctrl+O',
    command: 'file.open',
    category: 'file',
  },
  {
    id: 'new',
    description: 'New project',
    keys: 'Ctrl+N',
    command: 'file.new',
    category: 'file',
  },
  
  // View commands
  {
    id: 'togglePlayback',
    description: 'Toggle playback',
    keys: 'Space',
    command: 'view.togglePlayback',
    category: 'view',
  },
  {
    id: 'toggleSelectionMode',
    description: 'Toggle selection mode',
    keys: 'S',
    command: 'view.toggleSelectionMode',
    category: 'view',
  },
];

interface PreferencesState {
  theme: Theme;
  timelineRenderer: TimelineRenderer;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  showGridInPreview: boolean;
  snapToGrid: boolean;
  gridSize: number; // ms
  keyBindings: KeyBinding[];
  
  // Panel sizes (in pixels)
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  effectsLibraryHeight: number; // percentage of left sidebar
  previewHeight: number; // percentage of center area
  
  layoutMode: LayoutMode;

  // Actions
  setTheme: (theme: Theme) => void;
  setTimelineRenderer: (renderer: TimelineRenderer) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (minutes: number) => void;
  setShowGridInPreview: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setEffectsLibraryHeight: (height: number) => void;
  setPreviewHeight: (height: number) => void;
  updateKeyBinding: (id: string, keys: string) => void;
  resetKeyBindings: () => void;
  getKeyBinding: (command: string) => KeyBinding | undefined;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      timelineRenderer: 'html',
      layoutMode: 'daw' as LayoutMode,
      autoSave: false,
      autoSaveInterval: 5,
      showGridInPreview: false,
      snapToGrid: false,
      gridSize: 100,
      keyBindings: DEFAULT_KEY_BINDINGS,
      leftSidebarWidth: 256,
      rightSidebarWidth: 320,
      effectsLibraryHeight: 50, // percentage
      previewHeight: 60, // percentage
      
      setTheme: (theme) => set({ theme }),
      setTimelineRenderer: (renderer) => set({ timelineRenderer: renderer }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setAutoSaveInterval: (minutes) => set({ autoSaveInterval: minutes }),
      setShowGridInPreview: (show) => set({ showGridInPreview: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      setGridSize: (size) => set({ gridSize: size }),
      setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
      setEffectsLibraryHeight: (height) => set({ effectsLibraryHeight: height }),
      setPreviewHeight: (height) => set({ previewHeight: height }),
      
      updateKeyBinding: (id: string, keys: string) => {
        set((state) => ({
          keyBindings: state.keyBindings.map((kb) =>
            kb.id === id ? { ...kb, keys } : kb
          ),
        }));
      },
      
      resetKeyBindings: () => {
        set({ keyBindings: DEFAULT_KEY_BINDINGS });
      },
      
      getKeyBinding: (command: string) => {
        return get().keyBindings.find((kb) => kb.command === command);
      },
    }),
    {
      name: 'led-controller-preferences',
    }
  )
);
