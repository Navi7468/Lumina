import type { IEffect } from './types';

/**
 * Effect Registry - Modular plugin system for effects
 * 
 * This allows effects to be registered dynamically and loaded
 * from various sources (built-in, user plugins, etc.)
 */
class EffectRegistryClass {
  private effects = new Map<string, IEffect>();
  private categories = new Map<string, string[]>();
  
  register(effect: IEffect) {
    const { id, category } = effect.metadata;
    
    if (this.effects.has(id)) {
      console.warn(`Effect "${id}" is already registered. Overwriting.`);
    }
    
    this.effects.set(id, effect);
    
    // Add to category index
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(id);
  }
  
  unregister(id: string) {
    const effect = this.effects.get(id);
    if (!effect) return;
    
    // Remove from category
    const categoryEffects = this.categories.get(effect.metadata.category);
    if (categoryEffects) {
      const index = categoryEffects.indexOf(id);
      if (index > -1) {
        categoryEffects.splice(index, 1);
      }
    }
    
    // Cleanup effect
    effect.dispose?.();
    this.effects.delete(id);
  }
  
  get(id: string): IEffect | undefined {
    return this.effects.get(id);
  }
  
  getAll(): IEffect[] {
    return Array.from(this.effects.values());
  }
  
  getByCategory(category: string): IEffect[] {
    const ids = this.categories.get(category) || [];
    return ids.map(id => this.effects.get(id)!).filter(Boolean);
  }
  
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }
  
  has(id: string): boolean {
    return this.effects.has(id);
  }
  
  clear() {
    this.effects.forEach(effect => effect.dispose?.());
    this.effects.clear();
    this.categories.clear();
  }
}

// Singleton instance
export const EffectRegistry = new EffectRegistryClass();

// Auto-register built-in effects
import { SolidColorEffect } from './effects/SolidColor';
import { RainbowEffect } from './effects/Rainbow';
import { TheaterChaseEffect } from './effects/TheaterChase';
import { GradientEffect } from './effects/Gradient';

// Register built-in effects
EffectRegistry.register(new SolidColorEffect());
EffectRegistry.register(new RainbowEffect());
EffectRegistry.register(new TheaterChaseEffect());
EffectRegistry.register(new GradientEffect());
