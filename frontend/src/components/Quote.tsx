import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const QUOTES = [
  "Creativity takes courage.",
  "Every artist was first an amateur.",
  "Art is not what you see, but what you make others see.",
  "The purpose of art is washing the dust of daily life off our souls.",
  "Creativity is intelligence having fun.",
  "The earth without art is just 'eh'.",
  "Art enables us to find ourselves and lose ourselves at the same time.",
];

export function Quote() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  if (!quote) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 1.5 }}
      className="fixed bottom-6 left-0 right-0 flex justify-center z-5"
    >
      <p className="text-sm text-[#999999] italic">"{quote}"</p>
    </motion.div>
  );
}
