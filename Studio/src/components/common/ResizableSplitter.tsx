import { useRef, useEffect, useState } from 'react';

interface ResizableSplitterProps {
  direction: 'horizontal' | 'vertical';
  position: { top?: number; left?: number; right?: number; bottom?: number };
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizableSplitter({ direction, position, onResize, className = '' }: ResizableSplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startPosRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Change cursor globally while dragging
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startPosRef.current = direction === 'vertical' ? e.clientX : e.clientY;
    setIsDragging(true);
  };

  const positionStyle = {
    top: position.top !== undefined ? `${position.top}px` : undefined,
    left: position.left !== undefined ? `${position.left}px` : undefined,
    right: position.right !== undefined ? `${position.right}px` : undefined,
    bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
  };

  return (
    <div
      className={`absolute z-50 ${className}`}
      style={{
        ...positionStyle,
        width: direction === 'vertical' ? '10px' : undefined,
        height: direction === 'horizontal' ? '10px' : undefined,
        cursor: direction === 'vertical' ? 'col-resize' : 'row-resize',
        transform: direction === 'vertical' ? 'translateX(-50%)' : 'translateY(-50%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="transition-all duration-150"
        style={{
          width: direction === 'vertical' ? (isHovering || isDragging ? '4px' : '1px') : '100%',
          height: direction === 'horizontal' ? (isHovering || isDragging ? '4px' : '1px') : '100%',
          backgroundColor: isHovering || isDragging 
            ? 'hsl(var(--primary))' 
            : 'hsl(var(--border))',
          margin: '0 auto',
        }}
      />
    </div>
  );
}

interface ResizableIntersectionProps {
  position: { top: number; left: number };
  onResize: (deltaX: number, deltaY: number) => void;
  className?: string;
}

export function ResizableIntersection({ position, onResize, className = '' }: ResizableIntersectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      onResize(deltaX, deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Change cursor globally while dragging
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  return (
    <div
      className={`absolute z-50 ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '16px',
        height: '16px',
        cursor: 'nwse-resize',
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="w-full h-full rounded-sm transition-all duration-150"
        style={{
          backgroundColor: isHovering || isDragging 
            ? 'hsl(var(--primary) / 0.8)' 
            : 'transparent',
          border: isHovering || isDragging 
            ? '2px solid hsl(var(--primary))' 
            : 'none',
        }}
      />
    </div>
  );
}
