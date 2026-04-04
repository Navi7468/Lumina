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

  // --- v0.3.0 additions ---
  /** Which Track this clip belongs to (undefined = unassigned, legacy) */
  trackId?: string;
  /** Effect chain config — when set, overrides the single-effect path */
  effectChainConfig?: EffectChainConfig;
  /** Node graph config — when set, used in Node layout mode */
  nodeGraphConfig?: NodeGraphConfig;
  /** If this clip is a pattern instance, the source pattern ID */
  patternId?: string;
  
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
  tracks?: Track[];
  patterns?: Pattern[];
  cueList?: Cue[];
  bpm?: number;           // beats per minute (default undefined = no BPM)
  timeSignature?: [number, number]; // e.g. [4, 4]
}

// -- Tracks -----------------------------------------------------------------

/** A named, colored lane on the timeline. Clips (ILayer) belong to tracks. */
export interface Track {
  id: string;
  name: string;
  color: string;           // CSS hex color, e.g. '#6366f1'
  ledRange: [number, number]; // default LED range [start, end] (inclusive)
  muted: boolean;
  soloed: boolean;
  locked: boolean;
  expanded: boolean;
  height: number;          // row height in px (min 48)
  type: 'normal' | 'bus';  // bus tracks composite child tracks through their own effect chain
  parentId?: string;       // if set, this track is a child of a bus track
}

// -- Effect Chain -----------------------------------------------------------

/** Mix mode for how one EffectBlock's output merges into the running frame. */
export type EffectBlockMixMode = 'replace' | 'add' | 'multiply' | 'screen' | 'normal';

/**
 * A single block in an EffectChain. Each block runs one IEffect (or IModifier)
 * and merges its output into the accumulated frame via mixMode.
 */
export interface EffectBlock {
  id: string;
  /** Registry ID of the effect or modifier */
  effectId: string;
  /** Whether this block is a modifier (true) or a generative effect (false) */
  isModifier: boolean;
  enabled: boolean;
  mixMode: EffectBlockMixMode;
  mixAmount: number;       // 0–1, how strongly this block blends in
  parameters: EffectParameters;
}

/**
 * Configuration for a clip using the chain authoring model (v0.3+).
 * When present on an ILayer, the chain is used instead of the single effect.
 */
export interface EffectChainConfig {
  blocks: EffectBlock[];
}

// -- Node Graph -------------------------------------------------------------

export type NodePortType = 'frame' | 'color' | 'number' | 'boolean';

export interface NodePort {
  id: string;
  label: string;
  type: NodePortType;
}

export interface GraphNode {
  id: string;
  /** Registry ID or built-in node type */
  nodeType: string;
  label: string;
  x: number;
  y: number;
  parameters: EffectParameters;
  inputs: NodePort[];
  outputs: NodePort[];
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

/** Full node graph configuration for a clip (alternative to EffectChainConfig). */
export interface NodeGraphConfig {
  nodes: GraphNode[];
  connections: NodeConnection[];
  /** The single output node that produces the final LEDFrame */
  outputNodeId: string;
}

// -- Patterns & Cues --------------------------------------------------------

/**
 * A reusable group of clip IDs. Multiple instances of a pattern can be placed
 * on the timeline; editing the pattern's clips updates all instances.
 */
export interface Pattern {
  id: string;
  name: string;
  /** IDs of ILayer objects that belong to this pattern */
  clipIds: string[];
  /** Duration of the pattern in ms (for display; actual clips may vary) */
  duration: number;
  color?: string;
}

/**
 * A cue that can be triggered live. References a pattern to start playback at
 * the cue's timeline position, or triggers an immediate one-shot pattern.
 */
export interface Cue {
  id: string;
  name: string;
  /** Pattern to trigger (undefined = jump-to position only) */
  patternId?: string;
  /** Timeline position in ms to jump to on trigger */
  timelinePosition: number;
  /** Optional keyboard key label (e.g. 'F1', '1') for live triggering */
  triggerKey?: string;
}
