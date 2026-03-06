import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import type { LEDFrame } from '@/engine/types';

/**
 * Hook to stream LED frames to Raspberry Pi
 */
export function usePiStreaming(
  isPlaying: boolean,
  isConnected: boolean,
  streamOnPlayback: boolean,
  streamOnScrub: boolean,
  currentFrame: LEDFrame,
  fps: number,
  packetTimeoutMs: number = 1000
) {
  const sequenceRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // Stream on playback (interval-based)
  useEffect(() => {
    // Only stream if playing, connected, and streaming on playback is enabled
    if (!isPlaying || !isConnected || !streamOnPlayback) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculate frame interval based on FPS
    const frameInterval = 1000 / fps; // milliseconds

    // Start streaming frames
    const streamFrame = async () => {
      try {
        // Convert LEDFrame RGB data to flat byte array
        const rgbData: number[] = [];
        for (const [r, g, b] of currentFrame.data) {
          rgbData.push(r, g, b);
        }

        // Send frame to Pi
        await invoke('send_frame', {
          sequence: sequenceRef.current,
          rgbData: rgbData,
        });

        sequenceRef.current++;
      } catch (error) {
        console.error('Failed to send frame to Pi:', error);
      }
    };

    // Send initial frame immediately
    streamFrame();

    // Set up interval for subsequent frames
    intervalRef.current = window.setInterval(streamFrame, frameInterval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isConnected, streamOnPlayback, currentFrame, fps]);

  // Stream on scrub/playhead position change (frame-based)
  useEffect(() => {
    // Only send if not playing, connected, and streaming on scrub is enabled
    if (isPlaying || !isConnected || !streamOnScrub) {
      return;
    }

    const sendCurrentFrame = async () => {
      try {
        // Convert LEDFrame RGB data to flat byte array
        const rgbData: number[] = [];
        for (const [r, g, b] of currentFrame.data) {
          rgbData.push(r, g, b);
        }

        // Send timeout configuration first time (extend to 5x normal during scrubbing)
        if (sequenceRef.current === 0) {
          await invoke('set_timeout', { timeoutMs: packetTimeoutMs * 5 });
        }

        // Send static frame packet
        await invoke('send_static_frame', {
          sequence: sequenceRef.current,
          rgbData: rgbData,
        });
        sequenceRef.current++;

      } catch (error) {
        console.error('Failed to send frame to Pi:', error);
      }
    };

    sendCurrentFrame();
  }, [isPlaying, isConnected, streamOnScrub, currentFrame, packetTimeoutMs]);

  // Reset timeout to normal when starting playback
  useEffect(() => {
    if (isPlaying && isConnected && streamOnPlayback) {
      // Reset to configured timeout for playback
      invoke('set_timeout', { timeoutMs: packetTimeoutMs }).catch(err => {
        console.error('Failed to reset timeout:', err);
      });
    }
  }, [isPlaying, isConnected, streamOnPlayback, packetTimeoutMs]);

  // Reset sequence counter when connection changes
  useEffect(() => {
    if (isConnected) {
      sequenceRef.current = 0;
    }
  }, [isConnected]);
}
