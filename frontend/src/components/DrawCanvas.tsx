import React, { useRef, useEffect, useState } from 'react';

interface DrawCanvasProps {
  onParticle: (x: number, y: number) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  createdAt: number;
  opacity: number;
}

export function DrawCanvas({ onParticle }: DrawCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [overButton, setOverButton] = useState(false);
  const animFrame = useRef<number>();

  const color = '#ff6392';

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    c.width = window.innerWidth;
    c.height = window.innerHeight;

    const resize = () => {
      if (c) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    };

    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const over = target?.closest('button') !== null;
      setOverButton(over);
      setMouse({ x: e.clientX, y: e.clientY });
      
      if (drawing && !over) {
        setCurrent(prev => [...prev, { x: e.clientX, y: e.clientY }]);
        onParticle(e.clientX, e.clientY);
      }
    };

    const handleDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const over = target?.closest('button') !== null;
      if (!over) {
        setDrawing(true);
        setCurrent([{ x: e.clientX, y: e.clientY }]);
      }
    };

    const handleUp = () => {
      if (drawing && current.length > 0) {
        setStrokes(prev => [...prev, {
          points: current,
          color: color,
          createdAt: Date.now(),
          opacity: 1
        }]);
        setCurrent([]);
      }
      setDrawing(false);
    };

    const handleEnter = () => setShowCursor(true);
    const handleLeave = () => setShowCursor(false);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    document.body.addEventListener('mouseenter', handleEnter);
    document.body.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      document.body.removeEventListener('mouseenter', handleEnter);
      document.body.removeEventListener('mouseleave', handleLeave);
    };
  }, [drawing, current]);

  useEffect(() => {
    const fade = setInterval(() => {
      const now = Date.now();
      setStrokes(prev => 
        prev
          .map(stroke => {
            const age = now - stroke.createdAt;
            const fadeTime = 7000 + Math.random() * 5000;
            const opacity = Math.max(0, 1 - (age / fadeTime));
            return { ...stroke, opacity };
          })
          .filter(stroke => stroke.opacity > 0)
      );
    }, 100);

    return () => clearInterval(fade);
  }, []);

  const redraw = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!ctx || !c) return;

    ctx.clearRect(0, 0, c.width, c.height);

    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });

    if (current.length > 0) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(current[0].x, current[0].y);

      for (let i = 1; i < current.length; i++) {
        ctx.lineTo(current[i].x, current[i].y);
      }

      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const animate = () => {
      redraw();
      animFrame.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
      }
    };
  }, [strokes, current]);

  return (
    <>
      <canvas
        ref={canvas}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ 
          zIndex: 1,
          cursor: 'none',
          backgroundColor: 'transparent',
          pointerEvents: 'none'
        }}
      />

      {showCursor && !overButton && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${mouse.x}px`,
            top: `${mouse.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="relative w-4 h-4 rounded-full border-2 border-white/80 shadow-lg transition-transform duration-100"
            style={{ 
              backgroundColor: color,
              transform: 'scale(1)',
              boxShadow: `0 0 20px ${color}40`
            }}
          >
            <div
              className="absolute inset-0 rounded-full transition-all duration-150"
              style={{
                border: `2px solid ${color}`,
                transform: 'scale(2)',
                opacity: 0.15
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
