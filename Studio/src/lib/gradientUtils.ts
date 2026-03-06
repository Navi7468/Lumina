import { rgbToHsv, hsvToRgb } from '@/engine/colorUtils';

export interface ColorStop {
  position: number; // 0.0 to 1.0
  color: string; // hex color
}

export interface Gradient {
  stops: ColorStop[];
}

/**
 * Interpolate between two colors in RGB space
 */
export function lerpColorRGB(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Interpolate between two colors in HSV space (better for gradients)
 */
export function lerpColorHSV(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const hsv1 = rgbToHsv([r1, g1, b1]);
  const hsv2 = rgbToHsv([r2, g2, b2]);
  
  // Interpolate hue with wrap-around
  let h = hsv1[0] + (hsv2[0] - hsv1[0]) * t;
  
  // Handle hue wrap (shortest path around color wheel)
  const hDiff = hsv2[0] - hsv1[0];
  if (Math.abs(hDiff) > 180) {
    if (hDiff > 0) {
      h = hsv1[0] + (hsv2[0] - 360 - hsv1[0]) * t;
    } else {
      h = hsv1[0] + (hsv2[0] + 360 - hsv1[0]) * t;
    }
  }
  
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  
  const s = hsv1[1] + (hsv2[1] - hsv1[1]) * t;
  const v = hsv1[2] + (hsv2[2] - hsv1[2]) * t;
  
  const rgb = hsvToRgb([h, s, v]);
  
  return `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`;
}

/**
 * Sample a color from a gradient at a specific position
 */
export function sampleGradient(gradient: Gradient, position: number, mode: 'rgb' | 'hsv' = 'hsv'): string {
  // Clamp position to 0-1
  position = Math.max(0, Math.min(1, position));
  
  // Sort stops by position
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  
  // Handle edge cases
  if (sortedStops.length === 0) return '#000000';
  if (sortedStops.length === 1) return sortedStops[0].color;
  if (position <= sortedStops[0].position) return sortedStops[0].color;
  if (position >= sortedStops[sortedStops.length - 1].position) return sortedStops[sortedStops.length - 1].color;
  
  // Find the two stops to interpolate between
  let leftStop = sortedStops[0];
  let rightStop = sortedStops[1];
  
  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
      leftStop = sortedStops[i];
      rightStop = sortedStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = rightStop.position - leftStop.position;
  const t = range === 0 ? 0 : (position - leftStop.position) / range;
  
  // Interpolate based on mode
  if (mode === 'rgb') {
    return lerpColorRGB(leftStop.color, rightStop.color, t);
  } else {
    return lerpColorHSV(leftStop.color, rightStop.color, t);
  }
}

/**
 * Generate an array of colors from a gradient
 */
export function generateGradientColors(gradient: Gradient, count: number, mode: 'rgb' | 'hsv' = 'hsv'): string[] {
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const position = i / (count - 1 || 1);
    colors.push(sampleGradient(gradient, position, mode));
  }
  
  return colors;
}

/**
 * Predefined gradient presets
 */
export const GRADIENT_PRESETS: Record<string, Gradient> = {
  rainbow: {
    stops: [
      { position: 0.0, color: '#ff0000' },
      { position: 0.17, color: '#ff8800' },
      { position: 0.33, color: '#ffff00' },
      { position: 0.5, color: '#00ff00' },
      { position: 0.67, color: '#0088ff' },
      { position: 0.83, color: '#8800ff' },
      { position: 1.0, color: '#ff0088' },
    ],
  },
  fire: {
    stops: [
      { position: 0.0, color: '#000000' },
      { position: 0.33, color: '#ff0000' },
      { position: 0.67, color: '#ff8800' },
      { position: 1.0, color: '#ffff00' },
    ],
  },
  ocean: {
    stops: [
      { position: 0.0, color: '#001133' },
      { position: 0.5, color: '#0055aa' },
      { position: 1.0, color: '#00ddff' },
    ],
  },
  sunset: {
    stops: [
      { position: 0.0, color: '#1a1a2e' },
      { position: 0.3, color: '#ff6b35' },
      { position: 0.6, color: '#f7931e' },
      { position: 1.0, color: '#fbc02d' },
    ],
  },
  cyberpunk: {
    stops: [
      { position: 0.0, color: '#ff00ff' },
      { position: 0.5, color: '#00ffff' },
      { position: 1.0, color: '#ff00ff' },
    ],
  },
  forest: {
    stops: [
      { position: 0.0, color: '#0d3b0d' },
      { position: 0.5, color: '#228b22' },
      { position: 1.0, color: '#90ee90' },
    ],
  },
  lava: {
    stops: [
      { position: 0.0, color: '#330000' },
      { position: 0.4, color: '#cc0000' },
      { position: 0.7, color: '#ff6600' },
      { position: 1.0, color: '#ffcc00' },
    ],
  },
  purple_haze: {
    stops: [
      { position: 0.0, color: '#4a0080' },
      { position: 0.5, color: '#8b00ff' },
      { position: 1.0, color: '#ff00ff' },
    ],
  },
};

/**
 * Create a simple two-color gradient
 */
export function createSimpleGradient(startColor: string, endColor: string): Gradient {
  return {
    stops: [
      { position: 0.0, color: startColor },
      { position: 1.0, color: endColor },
    ],
  };
}

/**
 * Validate a gradient (ensure stops are valid)
 */
export function validateGradient(gradient: Gradient): boolean {
  if (!gradient.stops || gradient.stops.length < 2) return false;
  
  for (const stop of gradient.stops) {
    if (stop.position < 0 || stop.position > 1) return false;
    if (!/^#[0-9a-fA-F]{6}$/.test(stop.color)) return false;
  }
  
  return true;
}

/**
 * Convert gradient to CSS linear-gradient string
 */
export function gradientToCSS(gradient: Gradient, direction: string = 'to right'): string {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopStrings = sortedStops.map(stop => `${stop.color} ${(stop.position * 100).toFixed(1)}%`);
  return `linear-gradient(${direction}, ${stopStrings.join(', ')})`;
}
