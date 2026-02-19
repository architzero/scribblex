import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  createdBy: string;
  createdAt: number;
}

export function useDrawing(socket: Socket | null, roomId: string) {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(2);

  useEffect(() => {
    if (!socket) return;

    // Sync existing strokes
    socket.on('drawing:sync', (existingStrokes: DrawingStroke[]) => {
      setStrokes(existingStrokes);
    });

    // Receive new stroke
    socket.on('drawing:stroke', (stroke: DrawingStroke) => {
      setStrokes((prev) => [...prev, stroke]);
    });

    // Clear canvas
    socket.on('drawing:clear', () => {
      setStrokes([]);
    });

    return () => {
      socket.off('drawing:sync');
      socket.off('drawing:stroke');
      socket.off('drawing:clear');
    };
  }, [socket]);

  const startDrawing = (point: { x: number; y: number }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      points: [point],
      color,
      width,
      createdBy: user.id || 'unknown',
      createdAt: Date.now(),
    };
    // Initialize with two points so it's visible even as a dot
    newStroke.points.push(point);
    setCurrentStroke(newStroke);
    setIsDrawing(true);
  };

  const continueDrawing = (point: { x: number; y: number }) => {
    if (!isDrawing || !currentStroke) return;

    // Add point to current stroke
    const newPoints = [...currentStroke.points, point];

    setCurrentStroke({
      ...currentStroke,
      points: newPoints,
    });
  };

  const endDrawing = () => {
    if (!currentStroke || !socket) return;

    // Broadcast the finished stroke
    if (currentStroke.points.length > 1) {
      socket.emit('drawing:stroke', { roomId, stroke: currentStroke });
      // Verify we don't duplicate via socket event
      setStrokes((prev) => [...prev, currentStroke]);
    }

    setCurrentStroke(null);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!socket) return;
    socket.emit('drawing:clear', { roomId });
    setStrokes([]);
  };

  return {
    strokes,
    currentStroke,
    isDrawing,
    color,
    width,
    setColor,
    setWidth,
    startDrawing,
    continueDrawing,
    endDrawing,
    clearCanvas,
  };
}
