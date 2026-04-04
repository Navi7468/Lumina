import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface MenuEventHandlers {
  play: () => void;
  pause: () => void;
  stop: () => void;
}

/**
 * Hook to listen for playback-related Tauri menu events and bridge them to
 * the playback store actions.
 */
export function useMenuEvents({ play, pause, stop }: MenuEventHandlers) {
  useEffect(() => {
    const unlistenPlay = listen('playback-play', () => play());
    const unlistenPause = listen('playback-pause', () => pause());
    const unlistenStop = listen('playback-stop', () => stop());

    return () => {
      unlistenPlay.then((fn) => fn());
      unlistenPause.then((fn) => fn());
      unlistenStop.then((fn) => fn());
    };
  }, [play, pause, stop]);
}
