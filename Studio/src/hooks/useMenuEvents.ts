import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface MenuEventHandlers {
  play: () => void;
  pause: () => void;
  stop: () => void;
  // Optional file-menu handlers
  newProject?: () => void;
  openProject?: () => void;
  saveProject?: () => void;
  saveProjectAs?: () => void;
  // Optional edit-menu handlers
  undo?: () => void;
  redo?: () => void;
}

/**
 * Hook to listen for Tauri menu events and bridge them to store actions.
 * Covers both playback events and optional file-menu events.
 */
export function useMenuEvents({
  play,
  pause,
  stop,
  newProject,
  openProject,
  saveProject,
  saveProjectAs,
  undo,
  redo,
}: MenuEventHandlers) {
  useEffect(() => {
    const subs = [
      listen('playback-play',   () => play()),
      listen('playback-pause',  () => pause()),
      listen('playback-stop',   () => stop()),
      ...(newProject    ? [listen('new-project',     () => newProject!())]    : []),
      ...(openProject   ? [listen('open-project',    () => openProject!())]   : []),
      ...(saveProject   ? [listen('save-project',    () => saveProject!())]   : []),
      ...(saveProjectAs ? [listen('save-project-as', () => saveProjectAs!())] : []),
      ...(undo          ? [listen('edit-undo',        () => undo!())]          : []),
      ...(redo          ? [listen('edit-redo',        () => redo!())]          : []),
    ];

    return () => { subs.forEach(p => p.then(fn => fn())); };
  }, [play, pause, stop, newProject, openProject, saveProject, saveProjectAs, undo, redo]);
}
