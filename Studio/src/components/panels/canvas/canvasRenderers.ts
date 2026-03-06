import { AdjustmentLayer } from '@/engine/AdjustmentLayer';
import type { ILayer } from '@/engine/types';
import type { TimelineConfig, HoverState } from './types';

/**
 * Draw the grid on the main canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  duration: number,
  config: TimelineConfig
) {
  // Draw vertical time grid lines
  const durationSeconds = duration / 1000;
  ctx.strokeStyle = '#27272a50'; // border-color with transparency
  ctx.lineWidth = 1;
  
  for (let t = 0; t <= durationSeconds; t += 1) {
    const x = t * config.pixelsPerSecond;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Draw horizontal track separator lines
  ctx.strokeStyle = '#27272a'; // border-color
  for (let i = 0; i <= config.numTracks; i++) {
    const y = i * config.trackHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Draw the time ruler with markers and playhead
 */
export function drawTimeRuler(
  ctx: CanvasRenderingContext2D,
  width: number,
  playhead: number,
  duration: number,
  config: TimelineConfig
) {
  // Background
  ctx.fillStyle = '#18181b'; // bg-muted/50
  ctx.fillRect(0, 0, width, config.rulerHeight);
  
  // Time markers
  const durationSeconds = duration / 1000;
  ctx.fillStyle = '#a1a1aa'; // text-muted-foreground
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  
  for (let t = 0; t <= durationSeconds; t += 1) {
    const x = Math.floor(t * config.pixelsPerSecond);
    
    // Tick mark
    ctx.strokeStyle = '#27272a'; // border-color
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, config.rulerHeight);
    ctx.stroke();
    
    // Time label (positioned at whole pixels for crisp rendering)
    ctx.fillText(`${t}s`, x + 4, 7);
  }
  
  // Playhead indicator
  const playheadX = Math.floor((playhead / 1000) * config.pixelsPerSecond);
  ctx.fillStyle = '#3b82f6'; // primary color
  ctx.fillRect(playheadX - 1, 0, 2, config.rulerHeight);
  
  // Playhead triangle
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX - 5, 5);
  ctx.lineTo(playheadX + 5, 5);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the fixed track labels (Layer 1, Layer 2, etc.)
 */
export function drawFixedTracks(ctx: CanvasRenderingContext2D, config: TimelineConfig) {
  for (let i = 0; i < config.numTracks; i++) {
    const y = Math.floor(i * config.trackHeight);
    
    // Track label background
    ctx.fillStyle = '#18181b'; // bg-muted/30
    ctx.fillRect(0, y, config.trackLabelWidth, config.trackHeight);
    
    // Layer indicator dot
    ctx.fillStyle = '#22c55e'; // green indicator
    ctx.beginPath();
    ctx.arc(10, y + config.trackHeight / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Layer label text (positioned at whole pixels for crisp rendering)
    ctx.fillStyle = '#71717a'; // text-muted-foreground
    // Font is already set in the canvas setup
    ctx.fillText(`Layer ${i + 1}`, 20, Math.floor(y + (config.trackHeight - 10) / 2));
  }
}

/**
 * Draw a Zap icon (lucide-react style) for adjustment layers
 */
function drawZapIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24); // Lucide icons are 24x24
  
  // Zap icon path from lucide-react
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw the lightning bolt path
  const path = new Path2D('M13 2L3 14h8l-1 8 10-12h-8l1-8z');
  ctx.stroke(path);
  
  ctx.restore();
}

/**
 * Draw automation envelope for adjustment layers
 */
function drawAutomationEnvelope(
  ctx: CanvasRenderingContext2D,
  layer: AdjustmentLayer,
  clipX: number,
  clipY: number,
  clipWidth: number,
  clipHeight: number,
  _config: TimelineConfig,
  isSelected: boolean
) {
  if (!layer.envelope || layer.envelope.length === 0) return;
  
  const envelope = layer.envelope;
  const layerDuration = layer.duration;
  
  // Draw grid lines (horizontal reference lines)
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  
  // Draw 25%, 50%, 75% reference lines
  [0.25, 0.5, 0.75].forEach(percent => {
    const y = clipY + clipHeight * (1 - percent);
    ctx.beginPath();
    ctx.moveTo(clipX, y);
    ctx.lineTo(clipX + clipWidth, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.restore();
  
  // Draw the envelope curve
  ctx.save();
  ctx.beginPath();
  
  // Sort keyframes by time
  const sortedKeyframes = [...envelope].sort((a, b) => a.time - b.time);
  
  // Draw the line connecting all points
  sortedKeyframes.forEach((keyframe, index) => {
    const relativeTime = keyframe.time;
    const x = clipX + (relativeTime / layerDuration) * clipWidth;
    const y = clipY + clipHeight * (1 - keyframe.value); // Invert: top = 1.0, bottom = 0.0
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      // Check interpolation type
      const prevKeyframe = sortedKeyframes[index - 1];
      const prevX = clipX + (prevKeyframe.time / layerDuration) * clipWidth;
      const prevY = clipY + clipHeight * (1 - prevKeyframe.value);
      
      if (prevKeyframe.interpolation === 'step') {
        // Step interpolation: horizontal then vertical
        ctx.lineTo(x, prevY);
        ctx.lineTo(x, y);
      } else if (prevKeyframe.interpolation === 'bezier') {
        const tension = prevKeyframe.tension !== undefined ? prevKeyframe.tension : 1.0;
        
        // Use more segments for higher/lower tension values to avoid sharp corners
        // Higher or lower tension creates steeper curves that need more segments
        const baseSegments = 40;
        const tensionDeviation = Math.abs(Math.log(tension)); // how far from 1.0 (linear)
        const segments = Math.min(100, Math.ceil(baseSegments * (1 + tensionDeviation)));
        
        // Draw smooth curve using multiple line segments
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const poweredT = Math.pow(t, tension);
          const interpValue = prevKeyframe.value + (keyframe.value - prevKeyframe.value) * poweredT;
          const interpX = prevX + (x - prevX) * t;
          const interpY = clipY + clipHeight * (1 - interpValue);
          ctx.lineTo(interpX, interpY);
        }
      } else {
        // Linear interpolation
        ctx.lineTo(x, y);
      }
    }
  });
  
  ctx.strokeStyle = isSelected ? '#3b82f6' : '#60a5fa'; // primary blue
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  
  // Draw tension handles (small dots on curve segments)
  if (isSelected) {
    sortedKeyframes.forEach((keyframe, index) => {
      if (index === 0) return; // Skip first keyframe
      
      const prevKeyframe = sortedKeyframes[index - 1];
      if (prevKeyframe.interpolation === 'bezier') {
        const prevX = clipX + (prevKeyframe.time / layerDuration) * clipWidth;
        const prevY = clipY + clipHeight * (1 - prevKeyframe.value);
        const currX = clipX + (keyframe.time / layerDuration) * clipWidth;
        const currY = clipY + clipHeight * (1 - keyframe.value);
        
        const tension = prevKeyframe.tension !== undefined ? prevKeyframe.tension : 1.0;
        
        // Calculate position on the power curve at t=0.5 (midpoint)
        const t = 0.5;
        const poweredT = Math.pow(t, tension);
        const controlValue = prevKeyframe.value + (keyframe.value - prevKeyframe.value) * poweredT;
        const controlY = clipY + clipHeight * (1 - controlValue);
        const controlX = prevX + (currX - prevX) * t;
        
        // Draw tension handle (larger and more visible)
        ctx.beginPath();
        ctx.arc(controlX, controlY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }
  
  // Draw control points (the keyframe dots)
  sortedKeyframes.forEach(keyframe => {
    const relativeTime = keyframe.time;
    const x = clipX + (relativeTime / layerDuration) * clipWidth;
    const y = clipY + clipHeight * (1 - keyframe.value);
    
    // Draw outer circle (border)
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#3b82f6' : '#60a5fa';
    ctx.fill();
    
    // Draw inner circle (white center)
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  
  // Draw value labels at keyframe points (if selected)
  if (isSelected) {
    ctx.font = '9px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    sortedKeyframes.forEach(keyframe => {
      const relativeTime = keyframe.time;
      const x = clipX + (relativeTime / layerDuration) * clipWidth;
      const y = clipY + clipHeight * (1 - keyframe.value);
      
      const valueText = `${Math.round(keyframe.value * 100)}%`;
      ctx.fillText(valueText, x, y - 6);
    });
  }
}

/**
 * Draw layer clips on the main canvas
 */
export function drawLayerClips(
  ctx: CanvasRenderingContext2D,
  layers: ILayer[],
  selectedId: string | null,
  playhead: number,
  config: TimelineConfig,
  hoverState: HoverState | null
) {
  // Map layers to tracks (use trackIndex property if set, otherwise use array index)
  layers.forEach((layer, index) => {
    const trackIndex = layer.trackIndex !== undefined ? layer.trackIndex : (index % config.numTracks);
    const y = trackIndex * config.trackHeight;
    
    // Clip dimensions
    const clipX = (layer.startTime / 1000) * config.pixelsPerSecond;
    const clipWidth = (layer.duration / 1000) * config.pixelsPerSecond;
    const clipY = y + 2;
    const clipHeight = config.trackHeight - 4;
    
    // Clip styling
    const isSelected = layer.id === selectedId;
    const isHovered = hoverState?.layerId === layer.id;
    const isAdjustment = layer instanceof AdjustmentLayer;
    
    // For adjustment layers, draw a header section for dragging/resizing
    if (isAdjustment) {
      const headerHeight = config.adjustmentLayerHeaderHeight;
      const envelopeY = clipY + headerHeight;
      const envelopeHeight = clipHeight - headerHeight;
      
      // Draw header background (darker, interactive area)
      ctx.fillStyle = isSelected 
        ? 'rgba(59, 130, 246, 0.5)' // primary/50 when selected
        : 'rgba(59, 130, 246, 0.35)'; // primary/35 normally
      ctx.fillRect(clipX, clipY, clipWidth, headerHeight);
      
      // Draw envelope area background (lighter)
      ctx.fillStyle = isSelected
        ? 'rgba(59, 130, 246, 0.25)' // primary/25 when selected
        : 'rgba(59, 130, 246, 0.15)'; // primary/15 normally
      ctx.fillRect(clipX, envelopeY, clipWidth, envelopeHeight);
      
      // Draw border around entire clip
      ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(clipX, clipY, clipWidth, clipHeight);
      
      // Draw separator line between header and envelope area
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clipX, envelopeY);
      ctx.lineTo(clipX + clipWidth, envelopeY);
      ctx.stroke();
      
      // Draw icon in header
      drawZapIcon(ctx, clipX + 4, clipY + (headerHeight - 12) / 2, 12, '#3b82f6');
      
      // Draw label in header
      ctx.fillStyle = '#fafafa';
      ctx.font = 'bold 9px system-ui';
      const clipLabelX = clipX + 20;
      const clipLabelY = clipY + headerHeight / 2 + 3;
      const maxLabelWidth = clipWidth - 26;
      
      let labelText = layer.name;
      let textWidth = ctx.measureText(labelText).width;
      
      // Truncate with ellipsis if too wide
      if (textWidth > maxLabelWidth && maxLabelWidth > 0) {
        while (labelText.length > 0 && textWidth > maxLabelWidth) {
          labelText = labelText.substring(0, labelText.length - 1);
          textWidth = ctx.measureText(labelText + '...').width;
        }
        labelText = labelText + '...';
      }
      
      // Clip to prevent overflow
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipWidth, headerHeight);
      ctx.clip();
      ctx.fillText(labelText, clipLabelX, clipLabelY);
      ctx.restore();
      
      // Draw automation envelope in the envelope area (below header)
      drawAutomationEnvelope(
        ctx,
        layer as AdjustmentLayer,
        clipX,
        envelopeY,
        clipWidth,
        envelopeHeight,
        config,
        isSelected
      );
    } else {
      // Normal layer rendering (non-adjustment)
      if (isSelected) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // primary/30
        ctx.strokeStyle = '#3b82f6'; // primary
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.75)'; // accent/75 (brighter when hovered)
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)'; // accent/90
      } else {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.6)'; // accent/60
        ctx.strokeStyle = 'rgba(113, 113, 122, 0.4)'; // accent-foreground/40
      }
      
      // Draw clip
      ctx.fillRect(clipX, clipY, clipWidth, clipHeight);
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(clipX, clipY, clipWidth, clipHeight);
      
      // Clip label with ellipsis if too long
      ctx.fillStyle = '#fafafa';
      ctx.font = 'bold 9px system-ui';
      
      const clipLabelX = clipX + 6;
      const clipLabelY = clipY + clipHeight / 2 + 3;
      const maxLabelWidth = clipWidth - 12;
      
      let labelText = layer.name;
      let textWidth = ctx.measureText(labelText).width;
      
      // Truncate with ellipsis if too wide
      if (textWidth > maxLabelWidth && maxLabelWidth > 0) {
        while (labelText.length > 0 && textWidth > maxLabelWidth) {
          labelText = labelText.substring(0, labelText.length - 1);
          textWidth = ctx.measureText(labelText + '...').width;
        }
        labelText = labelText + '...';
      }
      
      // Clip to prevent overflow
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipWidth, clipHeight);
      ctx.clip();
      ctx.fillText(labelText, clipLabelX, clipLabelY);
      ctx.restore();
    }

    // Resize handles (only for selected clips)
    if (isSelected && !layer.locked) {
      const handleWidth = 4;
      ctx.fillStyle = '#3b82f6';
      
      // Left resize handle
      ctx.fillRect(clipX, clipY, handleWidth, clipHeight);
      
      // Right resize handle
      ctx.fillRect(clipX + clipWidth - handleWidth, clipY, handleWidth, clipHeight);
    }
    
    // Disabled/locked overlay
    if (!layer.enabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(clipX, clipY, clipWidth, clipHeight);
    }
  });
  
  // Draw playhead line through all tracks
  const playheadX = (playhead / 1000) * config.pixelsPerSecond;
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, config.numTracks * config.trackHeight);
  ctx.stroke();
}
