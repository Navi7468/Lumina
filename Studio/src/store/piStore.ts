import { create } from 'zustand';

interface PiState {
  isPiConnected: boolean;
  isStreamingOnPlayback: boolean;
  isStreamingOnScrub: boolean;
  setPiConnected: (connected: boolean) => void;
  setStreamingOnPlayback: (enabled: boolean) => void;
  setStreamingOnScrub: (enabled: boolean) => void;
}

export const usePiStore = create<PiState>((set) => ({
  isPiConnected: false,
  isStreamingOnPlayback: true,  // Default: stream during playback
  isStreamingOnScrub: true,     // Default: stream on scrub
  setPiConnected: (connected) => set({ isPiConnected: connected }),
  setStreamingOnPlayback: (enabled) => set({ isStreamingOnPlayback: enabled }),
  setStreamingOnScrub: (enabled) => set({ isStreamingOnScrub: enabled }),
}));
