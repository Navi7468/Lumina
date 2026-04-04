import { create } from 'zustand';
import { useProjectStore } from './projectStore';

interface PlaybackState {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => {
    set({ isPlaying: false });
    useProjectStore.getState().setPlayhead(0);
  },
}));
