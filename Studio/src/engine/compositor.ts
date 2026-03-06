import type { RGB, LEDFrame, BlendMode } from './types';

/**
 * Color blending utilities with proper alpha compositing
 */

export function blendColors(
  bottom: RGB,
  top: RGB,
  opacity: number,
  mode: BlendMode
): RGB {
  const alpha = Math.max(0, Math.min(1, opacity));
  
  let blended: RGB;
  
  switch (mode) {
    case 'normal':
      blended = top;
      break;
      
    case 'add':
      blended = [
        Math.min(255, bottom[0] + top[0]),
        Math.min(255, bottom[1] + top[1]),
        Math.min(255, bottom[2] + top[2]),
      ];
      break;
      
    case 'multiply':
      blended = [
        (bottom[0] * top[0]) / 255,
        (bottom[1] * top[1]) / 255,
        (bottom[2] * top[2]) / 255,
      ];
      break;
      
    case 'screen':
      blended = [
        255 - ((255 - bottom[0]) * (255 - top[0])) / 255,
        255 - ((255 - bottom[1]) * (255 - top[1])) / 255,
        255 - ((255 - bottom[2]) * (255 - top[2])) / 255,
      ];
      break;
      
    case 'overlay':
      blended = [
        overlayChannel(bottom[0], top[0]),
        overlayChannel(bottom[1], top[1]),
        overlayChannel(bottom[2], top[2]),
      ];
      break;
      
    case 'difference':
      blended = [
        Math.abs(bottom[0] - top[0]),
        Math.abs(bottom[1] - top[1]),
        Math.abs(bottom[2] - top[2]),
      ];
      break;
      
    default:
      blended = top;
  }
  
  // Alpha compositing
  return [
    Math.round(bottom[0] * (1 - alpha) + blended[0] * alpha),
    Math.round(bottom[1] * (1 - alpha) + blended[1] * alpha),
    Math.round(bottom[2] * (1 - alpha) + blended[2] * alpha),
  ] as RGB;
}

function overlayChannel(bottom: number, top: number): number {
  const b = bottom / 255;
  const t = top / 255;
  const result = b < 0.5 
    ? 2 * b * t 
    : 1 - 2 * (1 - b) * (1 - t);
  return Math.round(result * 255);
}

export function blendFrames(
  bottom: LEDFrame,
  top: LEDFrame,
  opacity: number,
  mode: BlendMode,
  boundingBox?: { start: number; end: number }
): LEDFrame {
  const result: RGB[] = [...bottom.data];
  
  const start = boundingBox?.start ?? 0;
  const end = boundingBox?.end ?? Math.min(bottom.ledCount, top.ledCount);
  
  for (let i = start; i < end; i++) {
    if (i < result.length && i < top.data.length) {
      result[i] = blendColors(result[i], top.data[i], opacity, mode);
    }
  }
  
  return {
    data: result,
    ledCount: bottom.ledCount,
  };
}

export function createEmptyFrame(ledCount: number): LEDFrame {
  return {
    data: Array(ledCount).fill([0, 0, 0] as RGB),
    ledCount,
  };
}

export function createSolidFrame(ledCount: number, color: RGB): LEDFrame {
  return {
    data: Array(ledCount).fill(color),
    ledCount,
  };
}
