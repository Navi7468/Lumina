import { useEffect, useRef } from 'react';

interface UsePlaybackProps {
  isPlaying: boolean;
  playhead: number;
  duration: number;
  loop: boolean;
  setPlayhead: (time: number) => void;
  pause: () => void;
}

/**
 * Hook to handle timeline playback using requestAnimationFrame
 * Automatically updates playhead position and handles looping
 */
export function usePlayback({ isPlaying, playhead, duration, loop, setPlayhead, pause }: UsePlaybackProps) {
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const playheadRef = useRef<number>(playhead);

  // Update playhead ref when it changes externally (user scrubbing)
  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Cap delta to prevent huge jumps (e.g., when tab is inactive)
      const cappedDelta = Math.min(delta, 100);

      const newTime = playheadRef.current + cappedDelta;

      if (newTime >= duration) {
        if (loop) {
          setPlayhead(0);
          playheadRef.current = 0;
        } else {
          setPlayhead(duration);
          playheadRef.current = duration;
          pause();
        }
      } else {
        setPlayhead(newTime);
        playheadRef.current = newTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [isPlaying, duration, loop, setPlayhead, pause]);
}
