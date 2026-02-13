import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const COLORS = [
  '#b47a5a', '#ff8c42', '#ff6b6b', '#ffd93d',
  '#c780fa', '#ff6392', '#6bcf7f', '#45e3cf', '#4d96ff',
];

interface LetterProps {
  letter: string;
  index: number;
  noFlicker?: boolean;
}

function Letter({ letter, index, noFlicker }: LetterProps) {
  const [color, setColor] = useState('#1a1a1a');

  useEffect(() => {
    if (noFlicker) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        setColor(randomColor);
        setTimeout(() => setColor('#1a1a1a'), 300);
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [noFlicker]);

  return (
    <motion.span
      className="inline-block font-display transition-colors duration-200"
      style={{ color }}
    >
      {letter}
    </motion.span>
  );
}

export function AnimatedTitle({ noFlicker }: { noFlicker?: boolean }) {
  const letters = 'ScribbleX'.split('');

  return (
    <span className="inline-flex tracking-wider">
      {letters.map((letter, index) => (
        <Letter
          key={index}
          letter={letter}
          index={index}
          noFlicker={noFlicker}
        />
      ))}
    </span>
  );
}
