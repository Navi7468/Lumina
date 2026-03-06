import type { IEffect, EffectMetadata, ParameterDefinition, LEDFrame, RGB } from '../types';
import { sampleGradient, createSimpleGradient, type Gradient } from '@/lib/gradientUtils';

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export class GradientEffect implements IEffect {
  readonly metadata: EffectMetadata = {
    id: 'builtin.gradient',
    name: 'Gradient',
    category: 'Basic',
    version: '1.0.0',
    description: 'Multi-stop gradient with customizable colors',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'gradient',
      label: 'Gradient',
      type: 'gradient',
      default: createSimpleGradient('#ff0000', '#0000ff'),
      animatable: false,
    },
    {
      key: 'mode',
      label: 'Interpolation',
      type: 'select',
      default: 'hsv',
      options: [
        { value: 'rgb', label: 'RGB' },
        { value: 'hsv', label: 'HSV' },
      ],
      animatable: false,
    },
  ];
  
  render(ledCount: number, _time: number, params: any): LEDFrame {
    const gradient: Gradient = params.gradient || this.parameters[0].default;
    const mode: 'rgb' | 'hsv' = params.mode || 'hsv';
    
    const data: RGB[] = [];
    
    for (let i = 0; i < ledCount; i++) {
      const position = ledCount > 1 ? i / (ledCount - 1) : 0;
      const hexColor = sampleGradient(gradient, position, mode);
      data.push(hexToRgb(hexColor));
    }
    
    return { data, ledCount };
  }
}
