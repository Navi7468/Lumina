/**
 * Project serialization / deserialization for the .lumina file format.
 *
 * Class instances (EffectLayer, AdjustmentLayer, IEffect, IModifier) cannot be
 * round-tripped through JSON.stringify directly. This module converts them to
 * plain DTO objects that reference effect/modifier registry IDs, then
 * reconstructs the live class instances on load.
 */

import type {
  Project,
  ILayer,
  ProjectConfig,
  LayerTransform,
  BoundingBox,
  ModifierInstance,
  Keyframe,
  Track,
  Pattern,
  Cue,
  EffectChainConfig,
  NodeGraphConfig,
} from '@/engine/types';
import { EffectLayer } from '@/engine/Layer';
import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import { EffectRegistry } from '@/engine/EffectRegistry';
import { ModifierRegistry } from '@/engine/ModifierRegistry';

const FORMAT_VERSION = 2;

// ---------------------------------------------------------------------------
// Serialized DTO types
// ---------------------------------------------------------------------------

interface SerializedModifier {
  id: string;
  modifierId: string; // ModifierRegistry key
  enabled: boolean;
  parameters: Record<string, unknown>;
}

interface SerializedLayerBase {
  type: 'effect' | 'adjustment';
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
  ledMask?: number[];
  trackId?: string;
  effectChainConfig?: EffectChainConfig;
  nodeGraphConfig?: NodeGraphConfig;
  patternId?: string;
}

interface SerializedEffectLayer extends SerializedLayerBase {
  type: 'effect';
  effectId: string; // EffectRegistry key
  parameters: Record<string, unknown>;
  modifiers: SerializedModifier[];
}

interface SerializedAdjustmentLayer extends SerializedLayerBase {
  type: 'adjustment';
  modifierType: string;
  primaryModifier: SerializedModifier | null;
  envelope: Keyframe<number>[];
  linkedLayerIds: string[];
}

type SerializedLayer = SerializedEffectLayer | SerializedAdjustmentLayer;

export interface SerializedProject {
  __version: number;
  id: string;
  name: string;
  config: ProjectConfig;
  selectedLayerId: string | null;
  playhead: number;
  loop: boolean;
  layers: SerializedLayer[];
  tracks?: Track[];
  patterns?: Pattern[];
  cueList?: Cue[];
  bpm?: number;
  timeSignature?: [number, number];
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

function serializeModifier(m: ModifierInstance): SerializedModifier {
  return {
    id: m.id,
    modifierId: m.modifier.metadata.id,
    enabled: m.enabled,
    parameters: { ...m.parameters },
  };
}

function serializeLayer(layer: ILayer): SerializedLayer {
  const base: SerializedLayerBase = {
    type: layer instanceof AdjustmentLayer ? 'adjustment' : 'effect',
    id: layer.id,
    name: layer.name,
    enabled: layer.enabled,
    locked: layer.locked,
    transform: { ...layer.transform },
    boundingBox: layer.boundingBox ? { ...layer.boundingBox } : undefined,
    startTime: layer.startTime,
    duration: layer.duration,
    trackIndex: layer.trackIndex,
    ledStart: layer.ledStart,
    ledEnd: layer.ledEnd,
    ledMask: layer.ledMask ? [...layer.ledMask] : undefined,
    trackId: layer.trackId,
    effectChainConfig: layer.effectChainConfig
      ? JSON.parse(JSON.stringify(layer.effectChainConfig))
      : undefined,
    nodeGraphConfig: layer.nodeGraphConfig
      ? JSON.parse(JSON.stringify(layer.nodeGraphConfig))
      : undefined,
    patternId: layer.patternId,
  };

  if (layer instanceof AdjustmentLayer) {
    return {
      ...base,
      type: 'adjustment',
      modifierType: layer.modifierType,
      primaryModifier: layer.primaryModifier ? serializeModifier(layer.primaryModifier) : null,
      envelope: layer.envelope.map(kf => ({ ...kf })),
      linkedLayerIds: [...layer.linkedLayerIds],
    };
  }

  // EffectLayer – read parameters via the public API to avoid the private field
  const effectLayer = layer as EffectLayer;
  const effect = effectLayer.getEffect();
  const parameters: Record<string, unknown> = {};
  for (const param of effect.parameters) {
    parameters[param.key] = effectLayer.getParameter(param.key);
  }

  return {
    ...base,
    type: 'effect',
    effectId: effect.metadata.id,
    parameters,
    modifiers: (layer.modifiers ?? []).map(serializeModifier),
  };
}

// ---------------------------------------------------------------------------
// Public serialize
// ---------------------------------------------------------------------------

export function serializeProject(project: Project): SerializedProject {
  return {
    __version: FORMAT_VERSION,
    id: project.id,
    name: project.name,
    config: { ...project.config },
    selectedLayerId: project.selectedLayerId,
    playhead: project.playhead,
    loop: project.loop,
    layers: project.layers.map(serializeLayer),
    tracks: project.tracks ? JSON.parse(JSON.stringify(project.tracks)) : undefined,
    patterns: project.patterns ? JSON.parse(JSON.stringify(project.patterns)) : undefined,
    cueList: project.cueList ? JSON.parse(JSON.stringify(project.cueList)) : undefined,
    bpm: project.bpm,
    timeSignature: project.timeSignature ? [...project.timeSignature] : undefined,
  };
}

// ---------------------------------------------------------------------------
// Deserialization helpers
// ---------------------------------------------------------------------------

function deserializeModifier(data: SerializedModifier): ModifierInstance {
  const modifier = ModifierRegistry.get(data.modifierId);
  if (!modifier) {
    throw new Error(`Unknown modifier ID "${data.modifierId}" – is this plugin registered?`);
  }
  return {
    id: data.id,
    modifier,
    enabled: data.enabled,
    parameters: { ...data.parameters },
  };
}

function applyV030LayerFields(layer: ILayer, data: SerializedLayerBase): void {
  if (data.trackId !== undefined) layer.trackId = data.trackId;
  if (data.effectChainConfig !== undefined) layer.effectChainConfig = JSON.parse(JSON.stringify(data.effectChainConfig));
  if (data.nodeGraphConfig !== undefined) layer.nodeGraphConfig = JSON.parse(JSON.stringify(data.nodeGraphConfig));
  if (data.patternId !== undefined) layer.patternId = data.patternId;
}

function deserializeLayer(data: SerializedLayer): ILayer {
  if (data.type === 'adjustment') {
    const layer = new AdjustmentLayer(data.id, data.name, data.startTime, data.duration);
    layer.enabled = data.enabled;
    layer.locked = data.locked;
    Object.assign(layer.transform, data.transform);
    if (data.boundingBox) layer.boundingBox = { ...data.boundingBox };
    if (data.trackIndex !== undefined) layer.trackIndex = data.trackIndex;
    layer.ledStart = data.ledStart;
    layer.ledEnd = data.ledEnd;
    if (data.ledMask) (layer as ILayer).ledMask = [...data.ledMask];
    layer.modifierType = data.modifierType;
    layer.primaryModifier = data.primaryModifier ? deserializeModifier(data.primaryModifier) : null;
    layer.envelope = data.envelope.map(kf => ({ ...kf }));
    layer.linkedLayerIds = [...data.linkedLayerIds];
    applyV030LayerFields(layer, data);
    return layer;
  }

  const effect = EffectRegistry.get(data.effectId);
  if (!effect) {
    throw new Error(`Unknown effect ID "${data.effectId}" – is this plugin registered?`);
  }

  const layer = new EffectLayer(data.id, effect, data.name, data.startTime, data.duration);
  layer.enabled = data.enabled;
  layer.locked = data.locked;
  Object.assign(layer.transform, data.transform);
  if (data.boundingBox) layer.boundingBox = { ...data.boundingBox };
  if (data.trackIndex !== undefined) layer.trackIndex = data.trackIndex;
  layer.ledStart = data.ledStart;
  layer.ledEnd = data.ledEnd;
  if (data.ledMask) (layer as ILayer).ledMask = [...data.ledMask];
  for (const [key, val] of Object.entries(data.parameters)) {
    layer.setParameter(key, val);
  }
  layer.modifiers = data.modifiers.map(deserializeModifier);
  applyV030LayerFields(layer, data);
  return layer;
}

// ---------------------------------------------------------------------------
// Public deserialize
// ---------------------------------------------------------------------------

export function deserializeProject(data: SerializedProject): Project {
  // Alpha: we don't hard-reject older file versions — just warn and attempt a best-effort load.
  if (data.__version !== FORMAT_VERSION) {
    console.warn(
      `[projectSerializer] File version ${data.__version} (current: ${FORMAT_VERSION}). Loading anyway — some data may be missing or ignored.`,
    );
  }
  return {
    id: data.id,
    name: data.name,
    config: { ...data.config },
    selectedLayerId: data.selectedLayerId,
    playhead: data.playhead,
    loop: data.loop,
    layers: data.layers.map(deserializeLayer),
    // v0.3.0 fields - fall back to defaults when absent (old files)
    tracks: data.tracks ? JSON.parse(JSON.stringify(data.tracks)) : [],
    patterns: data.patterns ? JSON.parse(JSON.stringify(data.patterns)) : [],
    cueList: data.cueList ? JSON.parse(JSON.stringify(data.cueList)) : [],
    bpm: data.bpm,
    timeSignature: data.timeSignature ? [...data.timeSignature] : undefined,
  };
}
