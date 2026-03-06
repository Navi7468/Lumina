import type { IEffect, EffectMetadata, ParameterDefinition, LEDFrame, RGB } from '../types';

function hsvToRgb(h: number, s: number, v: number): RGB {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  let r: number, g: number, b: number;
  
  switch (i % 6) {
    case 0: [r, g, b] = [v, t, p]; break;
    case 1: [r, g, b] = [q, v, p]; break;
    case 2: [r, g, b] = [p, v, t]; break;
    case 3: [r, g, b] = [p, q, v]; break;
    case 4: [r, g, b] = [t, p, v]; break;
    case 5: [r, g, b] = [v, p, q]; break;
    default: [r, g, b] = [0, 0, 0];
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
}

export class RainbowEffect implements IEffect {
  readonly metadata: EffectMetadata = {
    id: 'builtin.rainbow',
    name: 'Rainbow',
    category: 'Animated',
    version: '1.0.0',
    description: 'Animated rainbow gradient',
  };
  
  readonly parameters: ParameterDefinition[] = [
    {
      key: 'speed',
      label: 'Speed',
      type: 'range',
      default: 0.001,
      min: 0,
      max: 0.01,
      step: 0.0001,
      animatable: true,
    },
    {
      key: 'density',
      label: 'Density',
      type: 'range',
      default: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      animatable: true,
    },
    {
      key: 'saturation',
      label: 'Saturation',
      type: 'range',
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      key: 'brightness',
      label: 'Brightness',
      type: 'range',
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ];
  
  render(ledCount: number, time: number, params: any): LEDFrame {
    const speed = params.speed ?? 0.001;
    const density = params.density ?? 1;
    const saturation = params.saturation ?? 1;
    const brightness = params.brightness ?? 1;
    
    const data: RGB[] = [];
    
    for (let i = 0; i < ledCount; i++) {
      const hue = ((i / ledCount) * density + time * speed) % 1;
      data.push(hsvToRgb(hue, saturation, brightness));
    }
    
    return { data, ledCount };
  }
}
