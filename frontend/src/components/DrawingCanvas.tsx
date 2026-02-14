import { useRef, useEffect } from 'react';
import { DrawingStroke } from '../hooks/useDrawing';

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  currentStroke: DrawingStroke | null;
  isDrawing: boolean;
  onMouseDown: (x: number, y: number) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: () => void;
  enabled: boolean;
}

export default function DrawingCanvas({
  strokes,
  currentStroke,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  enabled,
}: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!enabled) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMouseDown(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!enabled || !isDrawing) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMouseMove(x, y);
  };

  const handleMouseUp = () => {
    if (!enabled) return;
    onMouseUp();
  };

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ cursor: enabled ? 'crosshair' : 'default', zIndex: enabled ? 10 : 1 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render completed strokes */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      
      {/* Render current stroke being drawn */}
      {currentStroke && (
        <path
          d={pointsToPath(currentStroke.points)}
          stroke={currentStroke.color}
          strokeWidth={currentStroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  );
}
