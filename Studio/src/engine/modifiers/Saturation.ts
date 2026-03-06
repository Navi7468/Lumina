import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { rgbToHsv, hsvToRgb, clampRgb } from '../colorUtils';

/**
 * Saturation Modifier - Adjusts color saturation
 */
export class SaturationModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.saturation',
    name: 'Saturation',
    category: 'Color',
    version: '1.0.0',
    description: 'Adjust color saturation',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'saturation',
      label: 'Saturation',
      type: 'range',
      default: 1.0,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    const saturation = params.saturation ?? 1.0;
    
    if (saturation === 1.0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      // Convert to HSV
      const hsv = rgbToHsv(rgb);
      
      // Adjust saturation
      hsv[1] = Math.max(0, Math.min(1, hsv[1] * saturation));
      
      // Convert back to RGB
      return clampRgb(hsvToRgb(hsv));
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
