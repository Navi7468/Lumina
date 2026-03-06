import React, { useRef, useEffect } from 'react';
import type { LEDFrame } from '@/engine/types';

interface LEDPreviewProps {
  frame: LEDFrame;
  width?: number;
  height?: number;
}

export function LEDPreview({ frame, width = 1000, height = 120 }: LEDPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    const padding = 20;
    const availableWidth = width - padding * 2;
    const maxLedSize = 12;
    const minLedSize = 2;
    
    // Calculate LED size and spacing based on available space
    let ledSize = Math.max(minLedSize, Math.min(maxLedSize, (availableWidth / frame.ledCount) * 0.8));
    const spacing = Math.max(0, (availableWidth - ledSize * frame.ledCount) / Math.max(1, frame.ledCount - 1));
    const centerY = height / 2;
    
    // Draw each LED as a glowing circle
    frame.data.forEach((rgb, i) => {
      const x = padding + i * (ledSize + spacing) + ledSize / 2;
      const y = centerY;
      
      const [r, g, b] = rgb;
      
      // Skip completely black LEDs (no glow)
      if (r === 0 && g === 0 && b === 0) {
        // Draw dark LED base
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x, y, ledSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner dark circle
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.arc(x, y, ledSize / 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      
      // Calculate brightness for glow intensity
      const brightness = (r + g + b) / 3 / 255;
      
      // Outer glow (largest)
      const glowGradient1 = ctx.createRadialGradient(x, y, 0, x, y, ledSize * 1.5);
      glowGradient1.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
      glowGradient1.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.1})`);
      glowGradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient1;
      ctx.beginPath();
      ctx.arc(x, y, ledSize * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Middle glow
      const glowGradient2 = ctx.createRadialGradient(x, y, 0, x, y, ledSize);
      glowGradient2.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.6})`);
      glowGradient2.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${brightness * 0.2})`);
      glowGradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient2;
      ctx.beginPath();
      ctx.arc(x, y, ledSize, 0, Math.PI * 2);
      ctx.fill();
      
      // LED body with gradient
      const ledGradient = ctx.createRadialGradient(
        x - ledSize / 6, y - ledSize / 6, 0,
        x, y, ledSize / 2
      );
      ledGradient.addColorStop(0, `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`);
      ledGradient.addColorStop(0.6, `rgb(${r}, ${g}, ${b})`);
      ledGradient.addColorStop(1, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);
      
      ctx.fillStyle = ledGradient;
      ctx.beginPath();
      ctx.arc(x, y, ledSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Highlight for 3D effect
      const highlightGradient = ctx.createRadialGradient(
        x - ledSize / 4, y - ledSize / 4, 0,
        x - ledSize / 4, y - ledSize / 4, ledSize / 3
      );
      highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.6})`);
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(x - ledSize / 4, y - ledSize / 4, ledSize / 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [frame, width, height]);
  
  return (
    <div className="bg-[#0a0a0a] rounded-md overflow-hidden border border-border shadow-lg">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}
