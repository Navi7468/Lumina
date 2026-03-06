import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { clampRgb } from '../colorUtils';

/**
 * Brightness Modifier - Adjusts overall brightness
 */
export class BrightnessModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.brightness',
    name: 'Brightness',
    category: 'Color',
    version: '1.0.0',
    description: 'Adjust brightness/intensity',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'multiplier',
      label: 'Brightness',
      type: 'range',
      default: 1.0,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      key: 'pulse',
      label: 'Pulse',
      type: 'boolean',
      default: false,
      animatable: false,
    },
    {
      key: 'pulseSpeed',
      label: 'Pulse Speed',
      type: 'range',
      default: 0.001,
      min: 0,
      max: 0.01,
      step: 0.0001,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    let multiplier = params.multiplier ?? 1.0;
    
    // Add pulsing effect if enabled
    if (params.pulse) {
      const speed = params.pulseSpeed || 0.001;
      const pulse = (Math.sin(time * speed) + 1) / 2; // 0-1
      multiplier *= pulse;
    }
    
    if (multiplier === 1.0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      return clampRgb([
        rgb[0] * multiplier,
        rgb[1] * multiplier,
        rgb[2] * multiplier,
      ]);
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
