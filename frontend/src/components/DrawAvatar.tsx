import { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Check, Undo2, PaintBucket } from 'lucide-react';

interface DrawAvatarProps {
  onDone: (dataUrl: string) => void;
}

const COLORS = ['#000000', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export function DrawAvatar({ onDone }: DrawAvatarProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [mode, setMode] = useState<'draw' | 'erase' | 'fill'>('draw');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    save();
  }, []);

  const save = () => {
    const c = canvas.current;
    if (c) {
      setHistory(prev => [...prev.slice(-9), c.toDataURL()]);
    }
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!ctx || !c) return;
    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const fill = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (ctx && c) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, c.width, c.height);
      save();
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = canvas.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (mode === 'fill') {
      fill();
      return;
    }
    
    setDrawing(true);
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing) return;
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;
    ctx.lineWidth = mode === 'erase' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    if (drawing) {
      setDrawing(false);
      save();
    }
  };

  const clear = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (ctx && c) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      save();
    }
  };

  const done = () => {
    const c = canvas.current;
    if (c) {
      onDone(c.toDataURL());
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-white shadow-sm mx-auto" style={{ width: '280px', height: '280px' }}>
        <canvas
          ref={canvas}
          width={280}
          height={280}
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
          className="w-full h-full touch-none block"
          style={{ cursor: mode === 'fill' ? 'pointer' : mode === 'erase' ? 'cell' : 'crosshair' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('draw')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'draw' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Pencil className="w-4 h-4" />
          Draw
        </button>
        <button
          onClick={() => setMode('erase')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'erase' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Eraser className="w-4 h-4" />
          Erase
        </button>
        <button
          onClick={() => setMode('fill')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'fill' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <PaintBucket className="w-4 h-4" />
          Fill
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={history.length <= 1}
          className="flex-1 py-2 rounded-lg font-medium text-sm bg-white text-gray-600 hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={clear}
          className="flex-1 py-2 rounded-lg font-medium text-sm bg-white text-red-600 hover:bg-red-50 transition-all border border-red-200 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
        <button
          onClick={done}
          className="flex-1 py-2 rounded-lg font-medium text-sm text-white bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Brush Size</label>
          <span className="text-sm font-semibold text-gray-900">{size}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Colors</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-10 h-10 rounded-lg transition-all"
              style={{
                backgroundColor: c,
                outline: color === c ? '3px solid #000' : 'none',
                outlineOffset: '2px',
                border: '2px solid white',
                boxShadow: color === c ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
