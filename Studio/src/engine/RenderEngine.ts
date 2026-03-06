import type { ILayer, LEDFrame, Project, RGB } from './types';
import { blendFrames, createEmptyFrame } from './compositor';
import { AdjustmentLayer } from './AdjustmentLayer';

/**
 * Rendering Engine - Composes all layers into final output
 */
export class RenderEngine {
  render(layers: ILayer[], time: number, ledCount: number): LEDFrame {
    // Start with black frame
    let composited = createEmptyFrame(ledCount);
    
    // Sort layers by track index (lower track = rendered first = bottom layer)
    // For clips on the same track, use array order as tiebreaker
    const sortedLayers = [...layers].sort((a, b) => {
      const trackA = a.trackIndex !== undefined ? a.trackIndex : 0;
      const trackB = b.trackIndex !== undefined ? b.trackIndex : 0;
      
      // Primary sort: by track (lower track number = bottom)
      if (trackA !== trackB) {
        return trackA - trackB;
      }
      
      // Secondary sort: maintain original array order for same track
      return layers.indexOf(a) - layers.indexOf(b);
    });
    
    // Render layers bottom-to-top (sorted by track)
    for (const layer of sortedLayers) {
      if (!layer.enabled) continue;
      
      // Check if layer is active at current time
      const layerEndTime = layer.startTime + layer.duration;
      if (time < layer.startTime || time > layerEndTime) {
        continue; // Skip layers outside their time range
      }
      
      // Calculate time relative to layer start
      const relativeTime = time - layer.startTime;
      
      // Handle adjustment layers differently
      if (layer instanceof AdjustmentLayer) {
        // Apply adjustment layer's modifiers to composited result so far
        // Pass absolute time (not relative) as processFrame converts it internally
        composited = layer.processFrame(composited, time);
      } else {
        // Normal layer rendering
        const layerFrame = layer.renderAtTime(relativeTime, ledCount);
        
        // Apply LED selection (mask or range)
        let frameToComposite = layerFrame;
        if (layer.ledMask && layer.ledMask.length > 0) {
          // Use advanced mask selection
          frameToComposite = this.applyLEDMask(layerFrame, layer.ledMask, ledCount);
        } else if (layer.ledStart !== 0 || layer.ledEnd !== -1) {
          // Use legacy range selection
          frameToComposite = this.applyLEDRange(layerFrame, layer.ledStart, layer.ledEnd, ledCount);
        }
        
        composited = blendFrames(
          composited,
          frameToComposite,
          layer.transform.opacity,
          layer.transform.blend,
          layer.boundingBox
        );
      }
    }
    
    return composited;
  }
  
  /**
   * Apply LED range to a frame (only show LEDs in range, rest black)
   */
  private applyLEDRange(frame: LEDFrame, ledStart: number, ledEnd: number, totalLEDs: number): LEDFrame {
    const effectiveEnd = ledEnd === -1 ? totalLEDs - 1 : ledEnd;
    const newData: RGB[] = [];
    
    for (let i = 0; i < totalLEDs; i++) {
      if (i >= ledStart && i <= effectiveEnd) {
        newData.push(frame.data[i] || [0, 0, 0]);
      } else {
        newData.push([0, 0, 0]);
      }
    }
    
    return {
      data: newData,
      ledCount: totalLEDs,
    };
  }
  
  /**
   * Apply LED mask to a frame (only show LEDs in mask array, rest black)
   */
  private applyLEDMask(frame: LEDFrame, ledMask: number[], totalLEDs: number): LEDFrame {
    const maskSet = new Set(ledMask);
    const newData: RGB[] = [];
    
    for (let i = 0; i < totalLEDs; i++) {
      if (maskSet.has(i)) {
        newData.push(frame.data[i] || [0, 0, 0]);
      } else {
        newData.push([0, 0, 0]);
      }
    }
    
    return {
      data: newData,
      ledCount: totalLEDs,
    };
  }
  
  renderProject(project: Project): LEDFrame {
    return this.render(
      project.layers,
      project.playhead,
      project.config.ledCount
    );
  }
}

// Singleton instance
export const renderEngine = new RenderEngine();
