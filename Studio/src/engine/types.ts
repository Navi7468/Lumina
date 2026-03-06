// Core types for the modular LED engine
export type RGB = [number, number, number];

export interface LEDFrame {
  data: RGB[];
  ledCount: number;
}

export interface TimelinePosition {
  frame: number;
  time: number; // milliseconds
}

export interface Keyframe<T = any> {
  time: number;
  value: T;
  interpolation?: 'linear' | 'ease' | 'step' | 'bezier';
  // Tension for bezier interpolation
  // tension = 1.0 is linear, > 1.0 is concave (flat-then-steep), < 1.0 is convex (steep-then-flat)
  // Range: 0.1 to 10.0
  tension?: number;
}

export interface AnimatedProperty<T = any> {
  keyframes: Keyframe<T>[];
  getValueAtTime(time: number): T;
}

// Blend modes for layer composition
export type BlendMode =
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'difference';

export interface LayerTransform {
  opacity: number; // 0-1
  blend: BlendMode;
}

export interface BoundingBox {
  start: number; // LED index
  end: number;   // LED index
}

// Effect metadata for modularity
export interface EffectMetadata {
  id: string;
  name: string;
  category: string;
  version: string;
  author?: string;
  description?: string;
  thumbnail?: string;
}

// Parameter definition for effect UI
export interface ParameterDefinition {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'select' | 'range' | 'gradient';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  animatable?: boolean;
}

export interface EffectParameters {
  [key: string]: any | AnimatedProperty<any>;
}

// Base effect interface (plugin system)
export interface IEffect {
  readonly metadata: EffectMetadata;
  readonly parameters: ParameterDefinition[];
  
  // Render the effect for current time
  render(
    ledCount: number,
    time: number,
    params: EffectParameters
  ): LEDFrame;
  
  // Optional: Initialize effect
  init?(): void;
  
  // Optional: Cleanup
  dispose?(): void;
}

// Modifier interface (post-processing effects)
export interface IModifier {
  readonly metadata: EffectMetadata;
  readonly parameters: ParameterDefinition[];
  
  // Process an existing frame (post-processing)
  process(
    frame: LEDFrame,
    time: number,
    params: EffectParameters
  ): LEDFrame;
  
  // Optional: Initialize modifier
  init?(): void;
  
  // Optional: Cleanup
  dispose?(): void;
}

// Instance of a modifier with its parameters
export interface ModifierInstance {
  id: string;
  modifier: IModifier;
  enabled: boolean;
  parameters: EffectParameters;
}

// Layer interface
export interface ILayer {
  id: string;
  name: string;
  enabled: boolean;
  locked: boolean;
  transform: LayerTransform;
  boundingBox?: BoundingBox;
  
  // Timeline properties
  startTime: number;  // milliseconds from timeline start
  duration: number;   // milliseconds
  trackIndex?: number; // Visual track position (0-24), defaults to array index if not set
  
  // LED range (legacy continuous range)
  ledStart: number;   // First LED index (0-based)
  ledEnd: number;     // Last LED index (inclusive)
  
  // LED mask (advanced selection - overrides ledStart/ledEnd if present)
  ledMask?: number[]; // Array of specific LED indices to affect
  
  // Modifier stack (post-processing)
  modifiers?: ModifierInstance[];
  
  // Get the rendered output at a specific time
  renderAtTime(time: number, ledCount: number): LEDFrame;
}

// Project configuration
export interface ProjectConfig {
  ledCount: number;
  fps: number;
  duration: number; // milliseconds
  piIp: string;
  piPort: number;
  packetTimeoutMs: number; // timeout for Pi packet reception
}

export interface Project {
  id: string;
  name: string;
  config: ProjectConfig;
  layers: ILayer[];
  selectedLayerId: string | null;
  playhead: number; // current time in ms
  loop: boolean; // whether playback should loop
}
