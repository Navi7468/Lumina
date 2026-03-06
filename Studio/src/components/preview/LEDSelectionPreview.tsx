import React, { useRef, useEffect, useState } from 'react';
import type { LEDFrame } from '@/engine/types';
import { cn } from '@/lib/utils';

interface LEDSelectionPreviewProps {
  frame: LEDFrame;
  selectedLEDs?: number[];
  onSelectionChange?: (selectedLEDs: number[]) => void;
  selectionMode?: boolean;
  width?: number;
  height?: number;
}

export function LEDSelectionPreview({
  frame,
  selectedLEDs = [],
  onSelectionChange,
  selectionMode = false,
  width = 1000,
  height = 120,
}: LEDSelectionPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [tempSelection, setTempSelection] = useState<number[]>([]);
  const [lastClickedLED, setLastClickedLED] = useState<number | null>(null);
  const [isAdditive, setIsAdditive] = useState(false); // Ctrl/Cmd modifier
  
  // LED positioning calculations
  const padding = 20;
  const availableWidth = width - padding * 2;
  const maxLedSize = 12;
  const minLedSize = 2;
  const ledSize = Math.max(minLedSize, Math.min(maxLedSize, (availableWidth / frame.ledCount) * 0.8));
  const spacing = Math.max(0, (availableWidth - ledSize * frame.ledCount) / Math.max(1, frame.ledCount - 1));
  const centerY = height / 2;
  
  // Get LED position
  const getLEDPosition = (index: number): { x: number; y: number } => {
    const x = padding + index * (ledSize + spacing) + ledSize / 2;
    const y = centerY;
    return { x, y };
  };
  
  // Get LED index from mouse position
  const getLEDIndexAtPosition = (x: number, y: number): number | null => {
    for (let i = 0; i < frame.ledCount; i++) {
      const pos = getLEDPosition(i);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance <= ledSize / 2 + 2) {
        return i;
      }
    }
    return null;
  };
  
  // Get all LED indices within a rectangle
  const getLEDsInRect = (x1: number, y1: number, x2: number, y2: number): number[] => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    const indices: number[] = [];
    for (let i = 0; i < frame.ledCount; i++) {
      const pos = getLEDPosition(i);
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        indices.push(i);
      }
    }
    return indices;
  };
  
  // Render main LED frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw each LED
    frame.data.forEach((rgb, i) => {
      const pos = getLEDPosition(i);
      const [r, g, b] = rgb;
      
      // Check if LED is selected
      const isSelected = selectedLEDs.includes(i) || tempSelection.includes(i);
      const isTempOnly = tempSelection.includes(i) && !selectedLEDs.includes(i);
      
      // Skip completely black LEDs (no glow)
      if (r === 0 && g === 0 && b === 0) {
        // Draw dark LED base
        ctx.fillStyle = isSelected ? '#333333' : '#1a1a1a';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ledSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Selection indicator
        if (isSelected) {
          ctx.strokeStyle = isTempOnly ? '#00ff88' : '#0088ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, ledSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Inner dark circle
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ledSize / 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      
      // Calculate brightness
      const brightness = Math.max(r, g, b) / 255;
      
      // Outer glow
      if (brightness > 0.1) {
        const glowGradient = ctx.createRadialGradient(
          pos.x, pos.y, 0,
          pos.x, pos.y, ledSize * 1.2
        );
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.8})`);
        glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ledSize * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // LED body with gradient
      const ledGradient = ctx.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, ledSize / 2
      );
      ledGradient.addColorStop(0, `rgb(${Math.min(255, r * 1.2)}, ${Math.min(255, g * 1.2)}, ${Math.min(255, b * 1.2)})`);
      ledGradient.addColorStop(0.6, `rgb(${r}, ${g}, ${b})`);
      ledGradient.addColorStop(1, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);
      ctx.fillStyle = ledGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ledSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = isTempOnly ? '#00ff88' : '#0088ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ledSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Highlight
      const highlightGradient = ctx.createRadialGradient(
        pos.x - ledSize / 4, pos.y - ledSize / 4, 0,
        pos.x - ledSize / 4, pos.y - ledSize / 4, ledSize / 3
      );
      highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.6})`);
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(pos.x - ledSize / 4, pos.y - ledSize / 4, ledSize / 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [frame, selectedLEDs, tempSelection, width, height, ledSize, spacing]);
  
  // Render selection overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !selectionMode) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear overlay
    ctx.clearRect(0, 0, width, height);
    
    // Draw selection rectangle
    if (isDragging && dragStart && dragEnd) {
      ctx.strokeStyle = '#0088ff';
      ctx.fillStyle = 'rgba(0, 136, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      const rectX = Math.min(dragStart.x, dragEnd.x);
      const rectY = Math.min(dragStart.y, dragEnd.y);
      const rectWidth = Math.abs(dragEnd.x - dragStart.x);
      const rectHeight = Math.abs(dragEnd.y - dragStart.y);
      
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      ctx.setLineDash([]);
    }
  }, [isDragging, dragStart, dragEnd, selectionMode, width, height]);
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectionMode || !onSelectionChange) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    setIsAdditive(isCtrlOrCmd);
    
    // Check if clicking on a specific LED
    const clickedLED = getLEDIndexAtPosition(x, y);
    
    if (clickedLED !== null && isShift && lastClickedLED !== null) {
      // Shift+click: Range selection from lastClickedLED to clickedLED
      const start = Math.min(lastClickedLED, clickedLED);
      const end = Math.max(lastClickedLED, clickedLED);
      const rangeSelection = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      
      if (isCtrlOrCmd) {
        // Ctrl+Shift: Add range to existing selection
        const newSelection = Array.from(new Set([...selectedLEDs, ...rangeSelection]));
        onSelectionChange(newSelection);
      } else {
        // Shift only: Replace with range
        onSelectionChange(rangeSelection);
      }
      
      setLastClickedLED(clickedLED);
      return;
    }
    
    if (clickedLED !== null && !isShift) {
      // Single LED click
      setLastClickedLED(clickedLED);
      
      if (isCtrlOrCmd) {
        // Ctrl+click: Toggle LED in selection
        const newSelection = selectedLEDs.includes(clickedLED)
          ? selectedLEDs.filter(led => led !== clickedLED)
          : [...selectedLEDs, clickedLED];
        onSelectionChange(newSelection);
      } else {
        // Normal click: Select only this LED
        onSelectionChange([clickedLED]);
      }
      return;
    }
    
    // Start drag selection
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
    setTempSelection([]);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragEnd({ x, y });
    
    // Calculate temp selection
    const selected = getLEDsInRect(dragStart.x, dragStart.y, x, y);
    setTempSelection(selected);
  };
  
  const handleMouseUp = () => {
    if (!isDragging || !onSelectionChange) return;
    
    // Finalize selection
    if (tempSelection.length > 0) {
      if (isAdditive) {
        // Ctrl/Cmd drag: Add to existing selection
        const newSelection = Array.from(new Set([...selectedLEDs, ...tempSelection]));
        onSelectionChange(newSelection);
      } else {
        // Normal drag: Replace selection
        onSelectionChange(tempSelection);
      }
      
      // Set last clicked LED to the last one in the selection
      if (tempSelection.length > 0) {
        setLastClickedLED(tempSelection[tempSelection.length - 1]);
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTempSelection([]);
    setIsAdditive(false);
  };
  
  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ width, height }}
      />
      {selectionMode && (
        <canvas
          ref={overlayCanvasRef}
          className={cn(
            "absolute top-0 left-0",
            selectionMode && "cursor-crosshair"
          )}
          style={{ width, height }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </div>
  );
}
