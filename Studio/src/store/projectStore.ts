import { create } from 'zustand';
import type { Project, ILayer, ProjectConfig } from '@/engine/types';
import { EffectLayer } from '@/engine/Layer';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import { EffectRegistry } from '@/engine/EffectRegistry';
import { ModifierRegistry } from '@/engine/ModifierRegistry';

interface ProjectState {
  project: Project;

  // History
  history: {
    past: Project[];
    future: Project[];
  };

  // Project actions
  setProjectName: (name: string) => void;
  setProjectConfig: (config: Partial<ProjectConfig>) => void;

  // Playhead control
  setPlayhead: (time: number) => void;
  toggleLoop: () => void;
  skipToEnd: () => void;
  stepBackward: () => void;
  stepForward: () => void;

  // Layer management
  addLayer: (effectId: string, name?: string) => void;
  addAdjustmentLayer: (name?: string) => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (layerId: string, newIndex: number) => void;
  updateLayer: (layerId: string, updates: Partial<ILayer>) => void;
  selectLayer: (layerId: string | null) => void;

  // Modifier management
  addModifierToLayer: (layerId: string, modifierId: string) => void;
  removeModifierFromLayer: (layerId: string, modifierInstanceId: string) => void;
  updateModifierParameter: (layerId: string, modifierInstanceId: string, key: string, value: any) => void;
  reorderModifier: (layerId: string, modifierInstanceId: string, newIndex: number) => void;
  toggleModifier: (layerId: string, modifierInstanceId: string) => void;

  // Envelope management (for AdjustmentLayer)
  addEnvelopeKeyframe: (layerId: string, time: number, value: number) => void;
  removeEnvelopeKeyframe: (layerId: string, index: number) => void;
  updateEnvelopeKeyframe: (layerId: string, index: number, time?: number, value?: number) => void;
  updateKeyframeTension: (layerId: string, index: number, tension: number, interpolation: 'bezier') => void;

  // History management
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project management
  newProject: () => void;
  loadProject: (project: Project) => void;
}

// Maximum number of undo/redo states to keep in memory
const MAX_HISTORY_SIZE = 50;

const createDefaultProject = (): Project => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  config: {
    ledCount: 60,
    fps: 60,
    duration: 60000, // 60 seconds
    piIp: '192.168.1.1',
    piPort: 7777,
    packetTimeoutMs: 2000, // 2 second default timeout
  },
  layers: [],
  selectedLayerId: null,
  playhead: 0,
  loop: false, // default to looping disabled
});

export const useProjectStore = create<ProjectState>((set, get) => {
  // Helper to save current project to history before making changes
  const setWithHistory = (updater: (state: ProjectState) => Partial<ProjectState>) => {
    set((state) => {
      const updates = updater(state);

      // Only save to history if project is being modified
      if (updates.project && updates.project !== state.project) {
        const newPast = [...state.history.past, structuredClone(state.project)];

        // Limit history size
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast.shift();
        }

        return {
          ...updates,
          history: {
            past: newPast,
            future: [], // Clear future when new state is pushed
          },
        };
      }

      return updates;
    });
  };

  return {
    project: createDefaultProject(),
    history: {
      past: [],
      future: [],
    },

    setProjectName: (name) => setWithHistory((state) => ({
      project: { ...state.project, name },
    })),

    setProjectConfig: (config) => setWithHistory((state) => ({
      project: {
        ...state.project,
        config: { ...state.project.config, ...config },
      },
    })),

    setPlayhead: (time) => set((state) => ({
      project: { ...state.project, playhead: Math.max(0, Math.min(time, state.project.config.duration)) },
    })),

    toggleLoop: () => set((state) => ({
      project: { ...state.project, loop: !state.project.loop },
    })),

    skipToEnd: () => set((state) => ({
      project: { ...state.project, playhead: state.project.config.duration },
    })),

    stepBackward: () => set((state) => {
      const frameDuration = 1000 / state.project.config.fps;
      const newPlayhead = Math.max(0, state.project.playhead - frameDuration);
      return {
        project: { ...state.project, playhead: newPlayhead },
      };
    }),

    stepForward: () => set((state) => {
      const frameDuration = 1000 / state.project.config.fps;
      const newPlayhead = Math.min(state.project.config.duration, state.project.playhead + frameDuration);
      return {
        project: { ...state.project, playhead: newPlayhead },
      };
    }),

    addLayer: (effectId, name) => setWithHistory((state) => {
      const effect = EffectRegistry.get(effectId);
      if (!effect) {
        console.error(`Effect "${effectId}" not found`);
        return state;
      }

      // Place new layer at current playhead position
      const startTime = state.project.playhead;
      const duration = 5000; // 5 seconds default

      const newLayer = new EffectLayer(
        crypto.randomUUID(),
        effect,
        name,
        startTime,
        duration
      );

      // Place new layer on next available track index
      newLayer.trackIndex = state.project.layers.length;

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers, newLayer],
          selectedLayerId: newLayer.id,
        },
      };
    }),

    addAdjustmentLayer: (name) => setWithHistory((state) => {
      // Place new adjustment layer at current playhead position
      const startTime = state.project.playhead;
      const duration = 5000; // 5 seconds default

      const newLayer = new AdjustmentLayer(
        crypto.randomUUID(),
        name || 'Adjustment Layer',
        startTime,
        duration
      );

      // Place new adjustment layer on next available track index
      newLayer.trackIndex = state.project.layers.length;

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers, newLayer],
          selectedLayerId: newLayer.id,
        },
      };
    }),

    removeLayer: (layerId) => setWithHistory((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.filter((l) => l.id !== layerId),
        selectedLayerId: state.project.selectedLayerId === layerId ? null : state.project.selectedLayerId,
      },
    })),

    duplicateLayer: (layerId) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      const newId = crypto.randomUUID();
      let cloned: ILayer;

      if (layer instanceof EffectLayer) {
        cloned = layer.clone(newId);
      } else if (layer instanceof AdjustmentLayer) {
        cloned = layer.clone(newId);
      } else {
        return state; // Unknown layer type
      }

      // Place duplicated layer on a new track
      cloned.trackIndex = state.project.layers.length;

      const index = state.project.layers.findIndex((l) => l.id === layerId);
      const newLayers = [...state.project.layers];
      newLayers.splice(index + 1, 0, cloned);

      return {
        project: {
          ...state.project,
          layers: newLayers,
          selectedLayerId: newId,
        },
      };
    }),

    moveLayer: (layerId, newIndex) => setWithHistory((state) => {
      const layers = [...state.project.layers];
      const currentIndex = layers.findIndex((l) => l.id === layerId);

      if (currentIndex === -1) return state;

      const [layer] = layers.splice(currentIndex, 1);
      layers.splice(newIndex, 0, layer);

      return {
        project: { ...state.project, layers },
      };
    }),

    updateLayer: (layerId, updates) => setWithHistory((state) => {
      const layers = state.project.layers.map((l) => {
        if (l.id === layerId) {
          // Update layer properties directly to preserve class instance
          Object.assign(l, updates);
          return l;
        }
        return l;
      });

      return {
        project: {
          ...state.project,
          layers: [...layers], // Create new array reference to trigger re-render
        },
      };
    }),

    selectLayer: (layerId) => set((state) => ({
      project: { ...state.project, selectedLayerId: layerId },
    })),

    // Modifier management
    addModifierToLayer: (layerId, modifierId) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      // Handle AdjustmentLayer differently (single modifier)
      if (layer instanceof AdjustmentLayer) {
        layer.setModifier(modifierId);
      } else if (layer instanceof EffectLayer) {
        const modifier = ModifierRegistry.get(modifierId);
        if (!modifier) {
          console.error(`Modifier "${modifierId}" not found`);
          return state;
        }
        layer.addModifier(modifier);
      } else {
        return state;
      }

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers], // Trigger re-render
        },
      };
    }),

    removeModifierFromLayer: (layerId, modifierInstanceId) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      // Handle AdjustmentLayer differently (single modifier)
      if (layer instanceof AdjustmentLayer) {
        // Clear the primary modifier
        if (layer.primaryModifier) {
          layer.primaryModifier.modifier.dispose?.();
          layer.primaryModifier = null;
        }
      } else if (layer instanceof EffectLayer) {
        layer.removeModifier(modifierInstanceId);
      } else {
        return state;
      }

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers], // Trigger re-render
        },
      };
    }),

    updateModifierParameter: (layerId, modifierInstanceId, key, value) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      // Both AdjustmentLayer and EffectLayer support setModifierParameter
      if (layer instanceof AdjustmentLayer) {
        layer.setModifierParameter(key, value);
      } else if (layer instanceof EffectLayer) {
        layer.setModifierParameter(modifierInstanceId, key, value);
      } else {
        return state;
      }

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers], // Trigger re-render
        },
      };
    }),

    reorderModifier: (layerId, modifierInstanceId, newIndex) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      // Only EffectLayer supports reordering (AdjustmentLayer has single modifier)
      if (layer instanceof EffectLayer) {
        layer.reorderModifier(modifierInstanceId, newIndex);
      } else {
        return state; // AdjustmentLayer doesn't support reordering
      }

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers], // Trigger re-render
        },
      };
    }),

    toggleModifier: (layerId, modifierInstanceId) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer) return state;

      // Handle AdjustmentLayer differently (single modifier)
      if (layer instanceof AdjustmentLayer) {
        if (layer.primaryModifier && layer.primaryModifier.id === modifierInstanceId) {
          layer.primaryModifier.enabled = !layer.primaryModifier.enabled;
        }
      } else if (layer instanceof EffectLayer) {
        const modInstance = layer.modifiers.find((m) => m.id === modifierInstanceId);
        if (modInstance) {
          modInstance.enabled = !modInstance.enabled;
        }
      } else {
        return state;
      }

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers], // Trigger re-render
        },
      };
    }),

    // Envelope management methods
    addEnvelopeKeyframe: (layerId, time, value) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return state;

      layer.addKeyframe(time, value);

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers],
        },
      };
    }),

    removeEnvelopeKeyframe: (layerId, index) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return state;

      layer.removeKeyframe(index);

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers],
        },
      };
    }),

    updateEnvelopeKeyframe: (layerId, index, time, value) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return state;

      const updates: any = {};
      if (time !== undefined) updates.time = time;
      if (value !== undefined) updates.value = value;

      layer.updateKeyframe(index, updates);

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers],
        },
      };
    }),

    updateKeyframeTension: (layerId, index, tension, interpolation) => setWithHistory((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId);
      if (!layer || !(layer instanceof AdjustmentLayer)) return state;

      layer.updateKeyframe(index, { tension, interpolation });

      return {
        project: {
          ...state.project,
          layers: [...state.project.layers],
        },
      };
    }),

    newProject: () => set({
      project: createDefaultProject(),
      history: { past: [], future: [] },
    }),

    loadProject: (project) => set({
      project,
      history: { past: [], future: [] },
    }),

    undo: () => set((state) => {
      if (state.history.past.length === 0) {
        return state;
      }

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        project: previous,
        history: {
          past: newPast,
          future: [state.project, ...state.history.future],
        },
      };
    }),

    redo: () => set((state) => {
      if (state.history.future.length === 0) {
        return state;
      }

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        project: next,
        history: {
          past: [...state.history.past, state.project],
          future: newFuture,
        },
      };
    }),

    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,
  };
});
