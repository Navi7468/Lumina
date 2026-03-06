import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { clampRgb } from '../colorUtils';

/**
 * Color Invert Modifier - Inverts RGB colors
 */
export class ColorInvertModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.colorinvert',
    name: 'Color Invert',
    category: 'Color',
    version: '1.0.0',
    description: 'Invert RGB colors',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'strength',
      label: 'Strength',
      type: 'range',
      default: 1.0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    const strength = params.strength ?? 1.0;
    
    if (strength === 0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      const inverted = [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
      
      // Blend with original based on strength
      return clampRgb([
        rgb[0] + (inverted[0] - rgb[0]) * strength,
        rgb[1] + (inverted[1] - rgb[1]) * strength,
        rgb[2] + (inverted[2] - rgb[2]) * strength,
      ]);
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
