import type {
  ILayer,
  IEffect,
  IModifier,
  LEDFrame,
  LayerTransform,
  EffectParameters,
  BoundingBox,
  ModifierInstance,
} from './types';
import { createEmptyFrame } from './compositor';

export class EffectLayer implements ILayer {
  id: string;
  name: string;
  enabled: boolean;
  locked: boolean;
  transform: LayerTransform;
  boundingBox?: BoundingBox;
  startTime: number;
  duration: number;
  trackIndex?: number;
  ledStart: number;
  ledEnd: number;
  modifiers: ModifierInstance[];
  
  private effect: IEffect;
  private parameters: EffectParameters;
  
  constructor(
    id: string,
    effect: IEffect,
    name?: string,
    startTime: number = 0,
    duration: number = 5000,
  ) {
    this.id = id;
    this.effect = effect;
    this.name = name || effect.metadata.name;
    this.enabled = true;
    this.locked = false;
    this.transform = {
      opacity: 1,
      blend: 'normal',
    };
    this.startTime = startTime;
    this.duration = duration;
    this.ledStart = 0;
    this.ledEnd = -1; // -1 means "all LEDs"
    this.modifiers = [];
    
    // Initialize parameters with defaults
    this.parameters = {};
    effect.parameters.forEach(param => {
      this.parameters[param.key] = param.default;
    });
    
    // Call effect initialization if available
    effect.init?.();
  }
  
  renderAtTime(time: number, ledCount: number): LEDFrame {
    if (!this.enabled) {
      return createEmptyFrame(ledCount);
    }
    
    // Resolve animated parameters at this time
    const resolvedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(this.parameters)) {
      if (value && typeof value === 'object' && 'getValueAtTime' in value) {
        resolvedParams[key] = value.getValueAtTime(time);
      } else {
        resolvedParams[key] = value;
      }
    }
    
    // Render base effect
    let frame = this.effect.render(ledCount, time, resolvedParams);
    
    // Apply modifiers in order (post-processing)
    for (const modInstance of this.modifiers) {
      if (!modInstance.enabled) continue;
      
      // Resolve animated modifier parameters
      const resolvedModParams: Record<string, any> = {};
      for (const [key, value] of Object.entries(modInstance.parameters)) {
        if (value && typeof value === 'object' && 'getValueAtTime' in value) {
          resolvedModParams[key] = value.getValueAtTime(time);
        } else {
          resolvedModParams[key] = value;
        }
      }
      
      // Apply modifier
      frame = modInstance.modifier.process(frame, time, resolvedModParams);
    }
    
    return frame;
  }
  
  setParameter(key: string, value: any) {
    this.parameters[key] = value;
  }
  
  getParameter(key: string): any {
    return this.parameters[key];
  }
  
  getEffect(): IEffect {
    return this.effect;
  }
  
  clone(newId: string): EffectLayer {
    const cloned = new EffectLayer(newId, this.effect, `${this.name} Copy`, this.startTime, this.duration);
    cloned.enabled = this.enabled;
    cloned.locked = this.locked;
    cloned.transform = { ...this.transform };
    cloned.boundingBox = this.boundingBox ? { ...this.boundingBox } : undefined;
    cloned.trackIndex = this.trackIndex;
    cloned.ledStart = this.ledStart;
    cloned.ledEnd = this.ledEnd;
    cloned.parameters = { ...this.parameters };
    
    // Clone modifiers
    cloned.modifiers = this.modifiers.map(mod => ({
      id: crypto.randomUUID(),
      modifier: mod.modifier,
      enabled: mod.enabled,
      parameters: { ...mod.parameters },
    }));
    
    return cloned;
  }
  
  // Modifier management methods
  addModifier(modifier: IModifier): ModifierInstance {
    const instance: ModifierInstance = {
      id: crypto.randomUUID(),
      modifier,
      enabled: true,
      parameters: {},
    };
    
    // Initialize parameters with defaults
    modifier.parameters.forEach(param => {
      instance.parameters[param.key] = param.default;
    });
    
    this.modifiers.push(instance);
    modifier.init?.();
    
    return instance;
  }
  
  removeModifier(modifierId: string): boolean {
    const index = this.modifiers.findIndex(m => m.id === modifierId);
    if (index === -1) return false;
    
    const modifier = this.modifiers[index];
    modifier.modifier.dispose?.();
    this.modifiers.splice(index, 1);
    
    return true;
  }
  
  reorderModifier(modifierId: string, newIndex: number): boolean {
    const oldIndex = this.modifiers.findIndex(m => m.id === modifierId);
    if (oldIndex === -1) return false;
    
    const [modifier] = this.modifiers.splice(oldIndex, 1);
    this.modifiers.splice(newIndex, 0, modifier);
    
    return true;
  }
  
  setModifierParameter(modifierId: string, key: string, value: any): boolean {
    const modifier = this.modifiers.find(m => m.id === modifierId);
    if (!modifier) return false;
    
    modifier.parameters[key] = value;
    return true;
  }
  
  getModifierParameter(modifierId: string, key: string): any {
    const modifier = this.modifiers.find(m => m.id === modifierId);
    return modifier?.parameters[key];
  }
  
  dispose() {
    this.effect.dispose?.();
    this.modifiers.forEach(mod => mod.modifier.dispose?.());
  }
}
