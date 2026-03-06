import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { applyGamma, clampRgb } from '../colorUtils';

/**
 * Gamma Correction Modifier - Applies gamma curve for brightness correction
 */
export class GammaModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.gamma',
    name: 'Gamma Correction',
    category: 'Color',
    version: '1.0.0',
    description: 'Apply gamma correction curve',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'gamma',
      label: 'Gamma',
      type: 'range',
      default: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    const gamma = params.gamma ?? 1.0;
    
    if (gamma === 1.0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      return clampRgb(applyGamma(rgb, gamma));
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
