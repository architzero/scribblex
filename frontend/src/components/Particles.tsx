import React from 'react';
import { motion } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  color: string;
}

interface ParticlesProps {
  particles: Particle[];
}

export function Particles({ particles }: ParticlesProps) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 11 }}>
      {particles.map((particle, index) => (
        <motion.div
          key={`${particle.x}-${particle.y}-${index}`}
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 0.8,
          }}
          animate={{
            x: particle.x + (Math.random() - 0.5) * 40,
            y: particle.y + (Math.random() - 0.5) * 40,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            boxShadow: `0 0 10px ${particle.color}`,
          }}
        />
      ))}
    </div>
  );
}
