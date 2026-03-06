import type { IModifier, EffectMetadata, ParameterDefinition, LEDFrame, EffectParameters } from '../types';

/**
 * Mirror Modifier - Mirrors the LED pattern from center or edge
 */
export class MirrorModifier implements IModifier {
  readonly metadata: EffectMetadata = {
    id: 'builtin.modifier.mirror',
    name: 'Mirror',
    category: 'Spatial',
    version: '1.0.0',
    description: 'Mirror LED pattern',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'mode',
      label: 'Mirror Mode',
      type: 'select',
      default: 'center',
      options: [
        { label: 'From Center', value: 'center' },
        { label: 'Left to Right', value: 'leftToRight' },
        { label: 'Right to Left', value: 'rightToLeft' },
      ],
      animatable: false,
    },
    {
      key: 'blend',
      label: 'Blend with Original',
      type: 'range',
      default: 0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ];
  
  process(frame: LEDFrame, time: number, params: EffectParameters): LEDFrame {
    const mode = params.mode || 'center';
    const blend = params.blend ?? 0;
    
    const newData = [...frame.data];
    const ledCount = frame.ledCount;
    
    if (mode === 'center') {
      // Mirror from center outward
      const center = Math.floor(ledCount / 2);
      for (let i = 0; i < ledCount; i++) {
        const distance = Math.abs(i - center);
        const mirrorIdx = i < center ? center + distance : center - distance;
        
        if (mirrorIdx >= 0 && mirrorIdx < ledCount) {
          const sourceColor = frame.data[i < center ? i : mirrorIdx];
          
          if (blend > 0) {
            // Blend mirrored with original
            const original = frame.data[i];
            newData[i] = [
              original[0] + (sourceColor[0] - original[0]) * (1 - blend),
              original[1] + (sourceColor[1] - original[1]) * (1 - blend),
              original[2] + (sourceColor[2] - original[2]) * (1 - blend),
            ];
          } else {
            newData[i] = sourceColor;
          }
        }
      }
    } else if (mode === 'leftToRight') {
      // Mirror left half to right
      const half = Math.floor(ledCount / 2);
      for (let i = half; i < ledCount; i++) {
        const mirrorIdx = ledCount - 1 - i;
        if (mirrorIdx >= 0 && mirrorIdx < half) {
          const sourceColor = frame.data[mirrorIdx];
          
          if (blend > 0) {
            const original = frame.data[i];
            newData[i] = [
              original[0] + (sourceColor[0] - original[0]) * (1 - blend),
              original[1] + (sourceColor[1] - original[1]) * (1 - blend),
              original[2] + (sourceColor[2] - original[2]) * (1 - blend),
            ];
          } else {
            newData[i] = sourceColor;
          }
        }
      }
    } else if (mode === 'rightToLeft') {
      // Mirror right half to left
      const half = Math.floor(ledCount / 2);
      for (let i = 0; i < half; i++) {
        const mirrorIdx = ledCount - 1 - i;
        if (mirrorIdx >= half && mirrorIdx < ledCount) {
          const sourceColor = frame.data[mirrorIdx];
          
          if (blend > 0) {
            const original = frame.data[i];
            newData[i] = [
              original[0] + (sourceColor[0] - original[0]) * (1 - blend),
              original[1] + (sourceColor[1] - original[1]) * (1 - blend),
              original[2] + (sourceColor[2] - original[2]) * (1 - blend),
            ];
          } else {
            newData[i] = sourceColor;
          }
        }
      }
    }
    
    return {
      ...frame,
      data: newData,
    };
  }
}
