import type { IEffect, EffectMetadata, ParameterDefinition, LEDFrame, RGB } from '../types';

export class TheaterChaseEffect implements IEffect {
  readonly metadata: EffectMetadata = {
    id: 'builtin.theater_chase',
    name: 'Theater Chase',
    category: 'Animated',
    version: '1.0.0',
    description: 'Classic theater marquee chase effect',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      default: [255, 255, 255] as RGB,
      animatable: true,
    },
    {
      key: 'spacing',
      label: 'Spacing',
      type: 'range',
      default: 3,
      min: 2,
      max: 10,
      step: 1,
    },
    {
      key: 'speed',
      label: 'Speed',
      type: 'range',
      default: 0.05,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      animatable: true,
    },
  ];
  
  render(ledCount: number, time: number, params: any): LEDFrame {
    const color: RGB = params.color || [255, 255, 255];
    const spacing = Math.round(params.spacing ?? 3);
    const speed = params.speed ?? 0.05;
    
    const offset = Math.floor(time * speed) % spacing;
    const data: RGB[] = [];
    
    for (let i = 0; i < ledCount; i++) {
      if ((i + offset) % spacing === 0) {
        data.push(color);
      } else {
        data.push([0, 0, 0]);
      }
    }
    
    return { data, ledCount };
  }
}
