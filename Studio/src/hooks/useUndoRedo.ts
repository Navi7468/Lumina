import { useCallback, useRef } from 'react';
import type { Project } from '@/engine/types';

interface HistoryState {
  past: Project[];
  present: Project;
  future: Project[];
}

// Maximum number of undo/redo states to keep in memory
const MAX_HISTORY_SIZE = 50;

/**
 * Hook to manage undo/redo history for project state
 * Uses structured cloning to maintain independent state snapshots
 */
export function useUndoRedo() {
  const historyRef = useRef<HistoryState>({
    past: [],
    present: null as any,
    future: [],
  });

  const pushState = useCallback((project: Project) => {
    const history = historyRef.current;
    
    // Don't push if the project is the same as the current present
    if (history.present && JSON.stringify(history.present) === JSON.stringify(project)) {
      return;
    }

    // Push current present to past
    if (history.present) {
      const newPast = [...history.past, history.present];
      
      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }
      
      history.past = newPast;
    }

    history.present = structuredClone(project);
    history.future = []; // Clear future when new state is pushed
  }, []);

  const undo = useCallback((): Project | null => {
    const history = historyRef.current;
    
    if (history.past.length === 0) {
      return null;
    }

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    history.past = newPast;
    history.future = [history.present, ...history.future];
    history.present = previous;

    return structuredClone(previous);
  }, []);

  const redo = useCallback((): Project | null => {
    const history = historyRef.current;
    
    if (history.future.length === 0) {
      return null;
    }

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    history.past = [...history.past, history.present];
    history.future = newFuture;
    history.present = next;

    return structuredClone(next);
  }, []);

  const clear = useCallback(() => {
    historyRef.current = {
      past: [],
      present: null as any,
      future: [],
    };
  }, []);

  const canUndo = useCallback(() => {
    return historyRef.current.past.length > 0;
  }, []);

  const canRedo = useCallback(() => {
    return historyRef.current.future.length > 0;
  }, []);

  return {
    pushState,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  };
}
