import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { averageColors } from '../colorUtils';

/**
 * Blur Modifier - Smooths LED colors by averaging with neighbors
 */
export class BlurModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.blur',
    name: 'Blur',
    category: 'Distortion',
    version: '1.0.0',
    description: 'Blur/smooth LED colors',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'radius',
      label: 'Blur Radius',
      type: 'range',
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      animatable: true,
    },
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
    const radius = Math.floor(params.radius || 1);
    const strength = params.strength ?? 1.0;
    
    if (radius === 0 || strength === 0) {
      return frame;
    }
    
    const newData = [...frame.data];
    
    for (let i = 0; i < frame.ledCount; i++) {
      const samples = [];
      
      // Collect neighboring pixels
      for (let j = -radius; j <= radius; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < frame.ledCount) {
          samples.push(frame.data[idx]);
        }
      }
      
      // Average the colors
      const blurred = averageColors(samples);
      
      // Blend with original based on strength
      const original = frame.data[i];
      newData[i] = [
        original[0] + (blurred[0] - original[0]) * strength,
        original[1] + (blurred[1] - original[1]) * strength,
        original[2] + (blurred[2] - original[2]) * strength,
      ];
    }
    
    return {
      ...frame,
      data: newData,
    };
  }
}
