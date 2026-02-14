import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Github } from 'lucide-react';
import { GridBg } from '../components/GridBg';
import { AnimatedTitle } from '../components/AnimatedTitle';
import { Orbs } from '../components/Orbs';
import { DrawCanvas } from '../components/DrawCanvas';
import { Particles } from '../components/Particles';
import { Quote } from '../components/Quote';
import { API_BASE_URL } from '../lib/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number}>>([]);
  const [cursorParticles, setCursorParticles] = useState<Array<{x: number, y: number, id: number}>>([]);
  const nav = useNavigate();

  const addParticle = useCallback((x: number, y: number) => {
    setParticles(prev => [...prev.slice(-20), { x, y }]);
  }, []);

  useEffect(() => {
    let particleId = 0;
    let lastSpawn = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (loading) return;
      const now = Date.now();
      if (now - lastSpawn > 80) {
        setCursorParticles(prev => {
          const newParticles = [...prev, { x: e.clientX, y: e.clientY, id: particleId++ }];
          return newParticles.slice(-15);
        });
        lastSpawn = now;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [loading]);

  const loginGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = `${API_BASE_URL}/auth/google`;
    }, 600);
  };

  const loginEmail = () => {
    setLoading(true);
    setTimeout(() => {
      nav('/email-login');
    }, 600);
  };

  const loginGithub = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = `${API_BASE_URL}/auth/github`;
    }, 600);
  };

  const loginApple = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = `${API_BASE_URL}/auth/apple`;
    }, 600);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafaf9]">
      {!loading && (
        <>
          <Orbs />
          <DrawCanvas onParticle={addParticle} />
          <Particles particles={particles.map(p => ({ ...p, color: '#ff6392' }))} />
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {cursorParticles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 0.6 }}
                animate={{ 
                  x: particle.x + (Math.random() - 0.5) * 40,
                  y: particle.y + (Math.random() - 0.5) * 40,
                  scale: [0, 1.2, 0],
                  opacity: [0.7, 0.9, 0]
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#e7628a] shadow-[0_0_8px_#ff6392] blur-[0.5px]"
                style={{ left: 0, top: 0 }}
              />
            ))}
          </div>
          <Quote />
        </>
      )}

      <GridBg />

      {!loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ zIndex: 20, pointerEvents: 'none' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mb-12 sm:mb-16"
            style={{ pointerEvents: 'auto' }}
          >
            <h1 className="text-[58px] sm:text-[74px] md:text-[88px] tracking-tight mb-3 font-display">
              <AnimatedTitle />
            </h1>
            <p className="text-center text-[15px] sm:text-[17px] text-[#666666] tracking-wide">
              Your creative canvas awaits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="w-full max-w-sm space-y-4"
            style={{ pointerEvents: 'auto' }}
          >
            <motion.button
              onClick={loginGoogle}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 sm:gap-4 bg-white px-6 sm:px-8 py-4 sm:py-5 rounded-full shadow-lg hover:shadow-xl border border-black/5 transition-all"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="sm:w-7 sm:h-7">
                  <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.5818C15.3273 13.3 14.5636 14.3591 13.4182 15.0682V17.5773H16.7364C18.6091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                  <path d="M10.2 20C12.9 20 15.1727 19.1045 16.7364 17.5773L13.4182 15.0682C12.4636 15.6682 11.2545 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.54091 11.9H1.11364V14.4909C2.66818 17.5909 6.20455 20 10.2 20Z" fill="#34A853"/>
                  <path d="M4.54091 11.9C4.32273 11.3 4.2 10.6591 4.2 10C4.2 9.34091 4.32273 8.7 4.54091 8.1V5.50909H1.11364C0.418182 6.89091 0 8.44545 0 10C0 11.5545 0.418182 13.1091 1.11364 14.4909L4.54091 11.9Z" fill="#FBBC05"/>
                  <path d="M10.2 3.97727C11.3545 3.97727 12.3818 4.35909 13.1909 5.13182L16.1273 2.19545C15.1682 1.31818 12.9045 0 10.2 0C6.20455 0 2.66818 2.40909 1.11364 5.50909L4.54091 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
                </svg>
              </motion.div>
              <span className="text-[15px] sm:text-[17px] font-medium text-[#1a1a1a]">Continue with Google</span>
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-[12px] sm:text-[14px] text-[#999999]">or</span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <motion.button
                onClick={loginEmail}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-md hover:shadow-lg border border-black/5 transition-all group"
                title="Continue with Email"
              >
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#666666] group-hover:text-[#1a1a1a] transition-colors" />
              </motion.button>

              <motion.button
                onClick={loginApple}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-md hover:shadow-lg border border-black/5 transition-all group"
                title="Continue with Apple"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#666666] group-hover:text-[#1a1a1a] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </motion.button>

              <motion.button
                onClick={loginGithub}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-md hover:shadow-lg border border-black/5 transition-all group"
                title="Continue with GitHub"
              >
                <Github className="w-5 h-5 sm:w-6 sm:h-6 text-[#666666] group-hover:text-[#1a1a1a] transition-colors" />
              </motion.button>
            </div>

            <p className="text-[12px] sm:text-[13px] text-[#999999] text-center">
              Sign in or create an account to save your drawings
            </p>
          </motion.div>
        </div>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-[#fafaf9] z-50"
        />
      )}
    </div>
  );
}
