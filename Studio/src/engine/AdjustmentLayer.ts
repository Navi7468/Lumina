import type {
  ILayer,
  LEDFrame,
  LayerTransform,
  BoundingBox,
  ModifierInstance,
  EffectMetadata,
  Keyframe,
} from './types';
import { createEmptyFrame } from './compositor';
import { ModifierRegistry } from './ModifierRegistry';

/**
 * Adjustment Layer - Applies modifiers to all layers below it
 * Similar to After Effects/Photoshop adjustment layers
 */
export class AdjustmentLayer implements ILayer {
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
  
  // Single modifier controlled by envelope
  primaryModifier: ModifierInstance | null;
  modifierType: string; // Modifier ID from registry (e.g., 'brightness')
  
  // Automation envelope for modifier parameter (0.0 to 1.0)
  envelope: Keyframe<number>[];
  
  // Target specific layers (empty = affect all layers below)
  linkedLayerIds: string[];
  
  readonly metadata: EffectMetadata = {
    id: 'builtin.adjustmentlayer',
    name: 'Adjustment Layer',
    category: 'Utility',
    version: '1.0.0',
    description: 'Applies modifiers to all layers below',
  };
  
  constructor(
    id: string,
    name: string = 'Adjustment Layer',
    startTime: number = 0,
    duration: number = 5000,
  ) {
    this.id = id;
    this.name = name;
    this.enabled = true;
    this.locked = false;
    this.transform = {
      opacity: 1,
      blend: 'normal',
    };
    this.startTime = startTime;
    this.duration = duration;
    this.ledStart = 0;
    this.ledEnd = -1;
    
    // Default to Brightness modifier
    this.modifierType = 'builtin.modifier.brightness';
    this.linkedLayerIds = [];
    
    // Initialize primary modifier
    const brightnessModifier = ModifierRegistry.get('builtin.modifier.brightness');
    if (brightnessModifier) {
      this.primaryModifier = {
        id: crypto.randomUUID(),
        modifier: brightnessModifier,
        enabled: true,
        parameters: {},
      };
      
      // Initialize parameters with defaults
      brightnessModifier.parameters.forEach(param => {
        this.primaryModifier!.parameters[param.key] = param.default;
      });
      
      brightnessModifier.init?.();
    } else {
      this.primaryModifier = null;
    }
    
    // Initialize with default envelope curve (demo: 20% → 80% → 30%)
    this.envelope = [
      { time: 0, value: 0.2, interpolation: 'bezier', tension: 1.0 },
      { time: duration * 0.5, value: 0.8, interpolation: 'bezier', tension: 1.0 },
      { time: duration, value: 0.3, interpolation: 'linear' },
    ];
  }
  
  /**
   * Adjustment layers don't render themselves
   * They modify during compositing
   */
  renderAtTime(_time: number, ledCount: number): LEDFrame {
    return createEmptyFrame(ledCount);
  }
  
  /**
   * Get the envelope value at a specific time using interpolation
   */
  getEnvelopeValueAtTime(time: number): number {
    // Convert absolute time to relative time within this layer
    const relativeTime = time - this.startTime;
    
    // Clamp to layer duration
    const clampedTime = Math.max(0, Math.min(relativeTime, this.duration));
    
    // If no keyframes, return default value
    if (this.envelope.length === 0) return 0.5;
    
    // If before first keyframe, return first value
    if (clampedTime <= this.envelope[0].time) {
      return this.envelope[0].value;
    }
    
    // If after last keyframe, return last value
    if (clampedTime >= this.envelope[this.envelope.length - 1].time) {
      return this.envelope[this.envelope.length - 1].value;
    }
    
    // Find the two keyframes to interpolate between
    for (let i = 0; i < this.envelope.length - 1; i++) {
      const kf1 = this.envelope[i];
      const kf2 = this.envelope[i + 1];
      
      if (clampedTime >= kf1.time && clampedTime <= kf2.time) {
        // Calculate interpolation factor (0.0 to 1.0)
        const t = (clampedTime - kf1.time) / (kf2.time - kf1.time);
        
        // Apply interpolation based on type
        switch (kf1.interpolation) {
          case 'step':
            return kf1.value;
          
          case 'ease': {
            // Simple ease-in-out curve
            const easedT = t < 0.5 
              ? 2 * t * t 
              : 1 - Math.pow(-2 * t + 2, 2) / 2;
            return kf1.value + (kf2.value - kf1.value) * easedT;
          }
          
          case 'bezier': {
            // Function for tension curves
            // tension = 1 is linear, > 1 is concave (flat then steep), < 1 is convex (steep then flat)
            const tension = kf1.tension !== undefined ? kf1.tension : 1.0;
            
            // Apply power function to normalized time
            const poweredT = Math.pow(t, tension);
            
            // Scale to actual value range
            return kf1.value + (kf2.value - kf1.value) * poweredT;
          }
          
          case 'linear':
          default:
            return kf1.value + (kf2.value - kf1.value) * t;
        }
      }
    }
    
    // Fallback (should never reach here)
    return this.envelope[0].value;
  }
  
  /**
   * Process a composited frame through this adjustment layer's modifier
   * The envelope controls the modifier's primary parameter value
   */
  processFrame(frame: LEDFrame, time: number): LEDFrame {
    if (!this.enabled || !this.primaryModifier || !this.primaryModifier.enabled) {
      return frame;
    }
    
    // Get the envelope value at this time (0.0 to 1.0)
    const envelopeValue = this.getEnvelopeValueAtTime(time);
    
    // Clone parameters and apply envelope to the primary parameter
    const processedParams: Record<string, any> = { ...this.primaryModifier.parameters };
    
    // Map envelope value to parameter range based on modifier type
    // For now, handle common modifiers explicitly
    switch (this.modifierType) {
      case 'builtin.modifier.brightness': {
        // Brightness multiplier: 0-2 (envelope 0 = 0x brightness, envelope 1 = 2x brightness)
        processedParams['multiplier'] = envelopeValue * 2.0;
        break;
      }
      
      case 'builtin.modifier.blur': {
        // Blur radius: 0-20 pixels
        processedParams['radius'] = envelopeValue * 20;
        break;
      }
      
      case 'builtin.modifier.saturation': {
        // Saturation: 0-2 (envelope 0 = desaturated, envelope 1 = 2x saturation)
        processedParams['saturation'] = envelopeValue * 2.0;
        break;
      }
      
      case 'builtin.modifier.gamma': {
        // Gamma: 0.1-3.0
        processedParams['gamma'] = 0.1 + envelopeValue * 2.9;
        break;
      }
      
      case 'builtin.modifier.hueshift': {
        // Hue shift: 0-360 degrees
        processedParams['degrees'] = envelopeValue * 360;
        break;
      }
      
      case 'builtin.modifier.fade': {
        // Fade amount: 0-1
        processedParams['amount'] = envelopeValue;
        break;
      }
      
      default:
        console.warn(`Unknown modifier type for envelope mapping: ${this.modifierType}`);
    }
    
    // Resolve any remaining animated parameters (though envelope controls primary param)
    for (const [key, value] of Object.entries(processedParams)) {
      if (value && typeof value === 'object' && 'getValueAtTime' in value) {
        processedParams[key] = value.getValueAtTime(time);
      }
    }
    
    // Apply modifier with envelope-controlled parameters
    return this.primaryModifier.modifier.process(frame, time, processedParams);
  }
  
  /**
   * Change the primary modifier type
   */
  setModifier(modifierType: string): boolean {
    const modifier = ModifierRegistry.get(modifierType);
    if (!modifier) {
      console.error(`Modifier "${modifierType}" not found in registry`);
      return false;
    }
    
    // Dispose old modifier if exists
    if (this.primaryModifier) {
      this.primaryModifier.modifier.dispose?.();
    }
    
    // Create new modifier instance
    this.modifierType = modifierType;
    this.primaryModifier = {
      id: crypto.randomUUID(),
      modifier,
      enabled: true,
      parameters: {},
    };
    
    // Initialize parameters with defaults
    modifier.parameters.forEach(param => {
      this.primaryModifier!.parameters[param.key] = param.default;
    });
    
    modifier.init?.();
    return true;
  }
  
  /**
   * Update a secondary parameter (not the envelope-controlled one)
   */
  setModifierParameter(key: string, value: any): boolean {
    if (!this.primaryModifier) return false;
    
    this.primaryModifier.parameters[key] = value;
    return true;
  }
  
  /**
   * Get a modifier parameter value
   */
  getModifierParameter(key: string): any {
    return this.primaryModifier?.parameters[key];
  }
  
  /**
   * Add a keyframe to the envelope
   */
  addKeyframe(time: number, value: number, interpolation: 'linear' | 'step' | 'ease' = 'linear'): void {
    // Clamp values
    const clampedTime = Math.max(0, Math.min(time, this.duration));
    const clampedValue = Math.max(0, Math.min(value, 1));
    
    // Check if keyframe already exists at this time
    const existingIndex = this.envelope.findIndex(kf => Math.abs(kf.time - clampedTime) < 10);
    if (existingIndex >= 0) {
      // Update existing keyframe
      this.envelope[existingIndex].value = clampedValue;
      this.envelope[existingIndex].interpolation = interpolation;
    } else {
      // Add new keyframe
      this.envelope.push({
        time: clampedTime,
        value: clampedValue,
        interpolation,
      });
      
      // Sort by time
      this.envelope.sort((a, b) => a.time - b.time);
    }
  }
  
  /**
   * Remove a keyframe by index
   */
  removeKeyframe(index: number): boolean {
    if (index < 0 || index >= this.envelope.length) return false;
    
    // Prevent removing if only 1 keyframe left (need at least 1)
    if (this.envelope.length <= 1) {
      console.warn('Cannot remove last keyframe');
      return false;
    }
    
    this.envelope.splice(index, 1);
    return true;
  }
  
  /**
   * Update an existing keyframe
   */
  updateKeyframe(index: number, updates: Partial<Keyframe<number>>): boolean {
    if (index < 0 || index >= this.envelope.length) return false;
    
    const keyframe = this.envelope[index];
    
    if (updates.time !== undefined) {
      keyframe.time = Math.max(0, Math.min(updates.time, this.duration));
    }
    if (updates.value !== undefined) {
      keyframe.value = Math.max(0, Math.min(updates.value, 1));
    }
    if (updates.interpolation !== undefined) {
      keyframe.interpolation = updates.interpolation;
    }
    if (updates.tension !== undefined) {
      keyframe.tension = Math.max(0.1, Math.min(updates.tension, 10));
    }
    
    // Re-sort if time changed
    if (updates.time !== undefined) {
      this.envelope.sort((a, b) => a.time - b.time);
    }
    
    return true;
  }
  
  clone(newId: string): AdjustmentLayer {
    const cloned = new AdjustmentLayer(newId, `${this.name} Copy`, this.startTime, this.duration);
    cloned.enabled = this.enabled;
    cloned.locked = this.locked;
    cloned.transform = { ...this.transform };
    cloned.boundingBox = this.boundingBox ? { ...this.boundingBox } : undefined;
    cloned.trackIndex = this.trackIndex;
    cloned.ledStart = this.ledStart;
    cloned.ledEnd = this.ledEnd;
    
    // Clone envelope
    cloned.envelope = this.envelope.map(kf => ({ ...kf }));
    
    // Clone modifier type and linked layers
    cloned.modifierType = this.modifierType;
    cloned.linkedLayerIds = [...this.linkedLayerIds];
    
    // Clone primary modifier
    if (this.primaryModifier) {
      cloned.primaryModifier = {
        id: crypto.randomUUID(),
        modifier: this.primaryModifier.modifier,
        enabled: this.primaryModifier.enabled,
        parameters: { ...this.primaryModifier.parameters },
      };
    } else {
      cloned.primaryModifier = null;
    }
    
    return cloned;
  }
  
  dispose() {
    if (this.primaryModifier) {
      this.primaryModifier.modifier.dispose?.();
    }
  }
}
