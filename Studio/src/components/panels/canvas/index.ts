/**
 * Canvas Timeline Module
 * 
 * This folder contains the modularized implementation of the Canvas Timeline component.
 * The code is split into focused, maintainable modules for better organization.
 * 
 * File Structure:
 * 
 * - types.ts
 *   TypeScript interfaces and types used across the canvas timeline
 *   - ClipDragState, HoverState, EnvelopeDragState, CanvasRefs, TimelineConfig
 * 
 * - canvasRenderers.ts
 *   All canvas drawing functions
 *   - drawGrid() - Draws the timeline grid
 *   - drawTimeRuler() - Draws the time ruler with playhead
 *   - drawFixedTracks() - Draws the track labels (Layer 1, Layer 2, etc.)
 *   - drawLayerClips() - Draws all layer clips with icons and labels
 *   - drawAutomationEnvelope() - Draws FL Studio-style automation envelopes
 *   - drawZapIcon() - Draws lucide-react style Zap icon for adjustment layers
 * 
 * - canvasHandlers.ts
 *   Event handler factories
 *   - createRulerHandlers() - Mouse handlers for playhead dragging
 *   - createMainCanvasHandlers() - Mouse handlers for clip interaction
 *   - createEnvelopeHandlers() - Mouse handlers for envelope keyframe editing
 *   - createScrollHandler() - Scroll synchronization handler
 * 
 * - useClipDrag.ts
 *   Custom hook for clip drag and drop functionality
 *   - Handles move, resize-left, and resize-right operations
 *   - Manages vertical track movement
 * 
 * - useEnvelopeDrag.ts
 *   Custom hook for envelope keyframe dragging
 *   - Handles time and value adjustment for keyframes
 *   - Clamps values to valid ranges (0-1 for value, 0-duration for time)
 * 
 * - useCanvasRender.ts
 *   Custom hook for canvas rendering
 *   - Sets up all 4 canvases (corner, ruler, labels, main)
 *   - Orchestrates all drawing operations
 * 
 * - useCanvasEvents.ts
 *   Custom hooks for canvas events
 *   - useMouseWheelZoom() - Ctrl/Alt scroll for zoom controls
 *   - useResizeObserver() - Window/container resize handling
 * 
 * Interactive Envelope Editing:
 * - Click on keyframe dots to drag them (adjust time and value)
 * - Click on envelope curve to add new keyframes
 * - Keyframes snap within layer duration bounds
 * - Values clamped to 0.0-1.0 range
 * 
 * Usage:
 * The main CanvasTimeline.tsx component imports and uses these modules
 * to create a clean, maintainable component structure.
 */

export * from './types';
export * from './canvasRenderers';
export * from './canvasHandlers';
export * from './useClipDrag';
export * from './useEnvelopeDrag';
export * from './useTensionDrag';
export * from './useCanvasRender';
export * from './useCanvasEvents';
