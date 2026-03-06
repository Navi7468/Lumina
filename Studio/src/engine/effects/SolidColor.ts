import type { IEffect, EffectMetadata, ParameterDefinition, LEDFrame, RGB } from '../types';

export class SolidColorEffect implements IEffect {
  readonly metadata: EffectMetadata = {
    id: 'builtin.solid',
    name: 'Solid Color',
    category: 'Basic',
    version: '1.0.0',
    description: 'Fill all LEDs with a single color',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      default: [255, 0, 0] as RGB,
      animatable: true,
    },
  ];
  
  render(ledCount: number, _time: number, params: any): LEDFrame {
    const color: RGB = params.color || this.parameters[0].default;
    
    return {
      data: Array(ledCount).fill(color),
      ledCount,
    };
  }
}
