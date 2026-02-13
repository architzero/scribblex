import React, { useRef, useEffect } from 'react';

export function GridBg() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      if (!ctx || !c) return;

      ctx.clearRect(0, 0, c.width, c.height);

      const gridSize = 80;
      const dotSize = 1.5;
      const lineOpacity = 0.08;

      ctx.fillStyle = `rgba(26, 26, 26, ${lineOpacity})`;
      
      for (let x = gridSize; x < c.width; x += gridSize) {
        for (let y = gridSize; y < c.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const gradient = ctx.createRadialGradient(
        c.width / 2,
        c.height / 2,
        0,
        c.width / 2,
        c.height / 2,
        c.width * 0.6
      );
      gradient.addColorStop(0, 'rgba(250, 250, 249, 0)');
      gradient.addColorStop(1, 'rgba(240, 240, 238, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, c.width, c.height);
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
