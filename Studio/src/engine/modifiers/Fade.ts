import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';
import { clampRgb } from '../colorUtils';

/**
 * Fade Modifier - Fades in/out over time
 */
export class FadeModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.fade',
    name: 'Fade',
    category: 'Color',
    version: '1.0.0',
    description: 'Fade in/out over time',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'fadeIn',
      label: 'Fade In Duration (ms)',
      type: 'number',
      default: 0,
      min: 0,
      max: 10000,
      step: 100,
      animatable: false,
    },
    {
      key: 'fadeOut',
      label: 'Fade Out Duration (ms)',
      type: 'number',
      default: 0,
      min: 0,
      max: 10000,
      step: 100,
      animatable: false,
    },
    {
      key: 'opacity',
      label: 'Base Opacity',
      type: 'range',
      default: 1.0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    const fadeIn = params.fadeIn || 0;
    const fadeOut = params.fadeOut || 0;
    const baseOpacity = params.opacity ?? 1.0;
    
    let opacity = baseOpacity;
    
    // Apply fade in
    if (fadeIn > 0 && time < fadeIn) {
      const fadeInProgress = time / fadeIn;
      opacity *= fadeInProgress;
    }
    
    // Apply fade out (assumes we know the layer duration via time)
    // For now, fadeOut is relative to the end of the effect
    // This could be enhanced to work with layer duration
    
    if (opacity === 1.0) {
      return frame;
    }
    
    const newData = frame.data.map(rgb => {
      return clampRgb([
        rgb[0] * opacity,
        rgb[1] * opacity,
        rgb[2] * opacity,
      ]);
    });
    
    return {
      ...frame,
      data: newData,
    };
  }
}
