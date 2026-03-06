import { useEffect, useCallback } from 'react';
import { usePreferencesStore } from '@/store/preferencesStore';

export type KeyboardHandler = () => void;

interface KeyboardHandlers {
  [command: string]: KeyboardHandler;
}

/**
 * Normalizes a keyboard event to a key string (e.g., "Ctrl+Z", "Shift+A")
 */
function normalizeKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];
  
  // Add modifiers in a consistent order
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  
  // Add the main key
  let key = event.key;
  
  // Normalize special keys
  if (key === ' ') key = 'Space';
  if (key === 'Escape') key = 'Escape';
  if (key === 'Delete') key = 'Delete';
  if (key === 'Backspace') key = 'Backspace';
  if (key === 'Enter') key = 'Enter';
  if (key === 'Tab') key = 'Tab';
  if (key === '=' || key === '+') key = '=';
  if (key === '-' || key === '_') key = '-';
  
  // Convert to uppercase for consistency (except special keys)
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  
  parts.push(key);
  
  return parts.join('+');
}

/**
 * Hook to register global keyboard shortcuts
 * 
 * @param handlers - Object mapping command names to handler functions
 * @param enabled - Whether the shortcuts are enabled (default: true)
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'selection.selectAll': handleSelectAll,
 *   'edit.undo': handleUndo,
 * });
 * ```
 */
export function useKeyboardShortcuts(
  handlers: KeyboardHandlers,
  enabled: boolean = true
) {
  const keyBindings = usePreferencesStore((state) => state.keyBindings);
  
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore if typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow some shortcuts even in inputs (like Ctrl+A)
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
      }
      
      const eventKey = normalizeKeyEvent(event);
      
      // Find matching key binding
      const binding = keyBindings.find((kb) => kb.keys === eventKey);
      
      if (binding && handlers[binding.command]) {
        event.preventDefault();
        event.stopPropagation();
        handlers[binding.command]();
      }
    },
    [enabled, keyBindings, handlers]
  );
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Hook to get the current key binding for a command
 * 
 * @param command - Command name (e.g., 'selection.selectAll')
 * @returns The key string (e.g., 'Ctrl+A') or undefined
 */
export function useKeyBinding(command: string): string | undefined {
  const getKeyBinding = usePreferencesStore((state) => state.getKeyBinding);
  return getKeyBinding(command)?.keys;
}
