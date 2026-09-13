'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Bell, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TempleBell: React.FC = () => {
  const [isRinging, setIsRinging] = useState(false);
  const [showRipples, setShowRipples] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTempleBellSound = useCallback(() => {
    try {
      // Initialize AudioContext lazily on user interaction
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Master output gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      masterGain.connect(ctx.destination);

      // Bell harmonics frequencies (fundamental: ~587.33 Hz - D5)
      // Metallic temple bell spectrum harmonics ratio
      const baseFreq = 587.33; 
      const overtones = [
        { ratio: 1.0, gain: 0.8, decay: 3.5 },
        { ratio: 2.76, gain: 0.5, decay: 2.2 },
        { ratio: 5.40, gain: 0.3, decay: 1.2 },
        { ratio: 8.93, gain: 0.2, decay: 0.8 },
        { ratio: 11.2, gain: 0.1, decay: 0.4 },
      ];

      overtones.forEach(({ ratio, gain, decay }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        gainNode.gain.setValueAtTime(gain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    } catch (e) {
      console.error('AudioContext synthesis failed:', e);
    }
  }, []);

  const handleRingBell = () => {
    setIsRinging(true);
    playTempleBellSound();

    const id = Date.now();
    setShowRipples((prev) => [...prev.slice(-3), id]);

    setTimeout(() => {
      setIsRinging(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center select-none">
      {/* Soundwave animation ripples */}
      <AnimatePresence>
        {showRipples.map((rippleId) => (
          <motion.div
            key={rippleId}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-amber-400/40 pointer-events-none"
          />
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleRingBell}
        aria-label="Ring Temple Bell"
        title="Ring Temple Bell (Audio)"
        className={`relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-300 ${
          isRinging
            ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-300 shadow-amber-500/50'
            : 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-950 hover:from-amber-400 hover:to-amber-600 shadow-amber-600/40 ring-2 ring-amber-300/40'
        }`}
      >
        <motion.div
          animate={isRinging ? { rotate: [0, -25, 25, -20, 20, -10, 10, 0] } : { rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="relative flex items-center justify-center"
        >
          <Bell className="w-7 h-7 md:w-8 md:h-8 fill-amber-950/20 stroke-[2.2]" />
          <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-200 animate-pulse" />
        </motion.div>

        {/* Tooltip */}
        <span className="absolute right-full mr-3 whitespace-nowrap bg-stone-900/90 text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5 backdrop-blur-md">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Ring Temple Bell (மணி அடித்தல்)
        </span>
      </motion.button>
    </div>
  );
};

export default TempleBell;
