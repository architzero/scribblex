import React from 'react';
import { motion } from 'motion/react';

export function Orbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      <motion.div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute rounded-full blur-3xl opacity-25"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(77, 150, 255, 0.3) 0%, transparent 70%)',
          bottom: '15%',
          right: '10%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(107, 207, 127, 0.35) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute rounded-full blur-3xl opacity-15"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(199, 128, 250, 0.3) 0%, transparent 70%)',
          top: '30%',
          right: '25%',
        }}
        animate={{
          x: [0, -25, 0],
          y: [0, 35, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
