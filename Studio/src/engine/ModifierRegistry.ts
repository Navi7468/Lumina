import type { IModifier } from './types';

/**
 * Modifier Registry - Modular plugin system for modifiers
 * 
 * This allows modifiers to be registered dynamically and loaded
 * from various sources (built-in, user plugins, etc.)
 */
class ModifierRegistryClass {
  private modifiers = new Map<string, IModifier>();
  private categories = new Map<string, string[]>();
  
  register(modifier: IModifier) {
    const { id, category } = modifier.metadata;
    
    if (this.modifiers.has(id)) {
      console.warn(`Modifier "${id}" is already registered. Overwriting.`);
    }
    
    this.modifiers.set(id, modifier);
    
    // Add to category index
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(id);
  }
  
  unregister(id: string) {
    const modifier = this.modifiers.get(id);
    if (!modifier) return;
    
    // Remove from category
    const categoryModifiers = this.categories.get(modifier.metadata.category);
    if (categoryModifiers) {
      const index = categoryModifiers.indexOf(id);
      if (index > -1) {
        categoryModifiers.splice(index, 1);
      }
    }
    
    // Cleanup modifier
    modifier.dispose?.();
    this.modifiers.delete(id);
  }
  
  get(id: string): IModifier | undefined {
    return this.modifiers.get(id);
  }
  
  getAll(): IModifier[] {
    return Array.from(this.modifiers.values());
  }
  
  getByCategory(category: string): IModifier[] {
    const ids = this.categories.get(category) || [];
    return ids.map(id => this.modifiers.get(id)!).filter(Boolean);
  }
  
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }
  
  has(id: string): boolean {
    return this.modifiers.has(id);
  }
  
  clear() {
    this.modifiers.forEach(modifier => modifier.dispose?.());
    this.modifiers.clear();
    this.categories.clear();
  }
}

// Singleton instance
export const ModifierRegistry = new ModifierRegistryClass();

// Auto-register built-in modifiers
import { BlurModifier } from './modifiers/Blur';
import { HueShiftModifier } from './modifiers/HueShift';
import { BrightnessModifier } from './modifiers/Brightness';
import { FadeModifier } from './modifiers/Fade';
import { SaturationModifier } from './modifiers/Saturation';
import { ColorInvertModifier } from './modifiers/ColorInvert';
import { GammaModifier } from './modifiers/Gamma';
import { MirrorModifier } from './modifiers/Mirror';

// Register built-in modifiers
ModifierRegistry.register(new BlurModifier());
ModifierRegistry.register(new HueShiftModifier());
ModifierRegistry.register(new BrightnessModifier());
ModifierRegistry.register(new FadeModifier());
ModifierRegistry.register(new SaturationModifier());
ModifierRegistry.register(new ColorInvertModifier());
ModifierRegistry.register(new GammaModifier());
ModifierRegistry.register(new MirrorModifier());
