import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { rgbToHsv, hsvToRgb, clampRgb } from '../colorUtils';

/**
 * Hue Shift Modifier - Rotates the hue of all colors
 */
export class HueShiftModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.hueshift',
    name: 'Hue Shift',
    category: 'Color',
    version: '1.0.0',
    description: 'Rotate hue of all colors',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'shift',
      label: 'Hue Shift',
      type: 'range',
      default: 0,
      min: -180,
      max: 180,
      step: 1,
      animatable: true,
    },
    {
      key: 'animate',
      label: 'Animate',
      type: 'boolean',
      default: false,
      animatable: false,
    },
    {
      key: 'speed',
      label: 'Animation Speed',
      type: 'range',
      default: 0.05,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    let shift = params.shift || 0;
    
    // Add time-based animation if enabled
    if (params.animate) {
      const speed = params.speed || 0.05;
      shift += (time * speed) % 360;
    }
    
    if (shift === 0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      // Convert to HSV
      const hsv = rgbToHsv(rgb);
      
      // Shift hue
      hsv[0] = (hsv[0] + shift + 360) % 360;
      
      // Convert back to RGB
      return clampRgb(hsvToRgb(hsv));
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
