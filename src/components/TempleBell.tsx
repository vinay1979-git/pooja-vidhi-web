'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

/**
 * Temple bell.
 *
 * Previously a single chime per click. A household pooja bell is rung
 * continuously while the upachara is offered, so this now rings repeatedly
 * until it is stopped, like holding the bell in your left hand.
 *
 * Synthesised rather than sampled: zero network, zero latency, no asset to
 * ship. A struck bell is a set of inharmonic partials over a fast attack and a
 * long exponential decay, which is what the partial table below reproduces.
 */

// Ratios of a struck bell's partials to the strike note. Deliberately
// inharmonic: whole-number ratios would sound like an organ, not a bell.
const PARTIALS: { ratio: number; gain: number; decay: number }[] = [
  { ratio: 0.5, gain: 0.32, decay: 3.4 }, // hum
  { ratio: 1.0, gain: 0.5, decay: 2.6 }, // strike note
  { ratio: 1.19, gain: 0.26, decay: 2.0 },
  { ratio: 1.56, gain: 0.22, decay: 1.5 },
  { ratio: 2.0, gain: 0.18, decay: 1.1 }, // nominal
  { ratio: 2.66, gain: 0.12, decay: 0.8 },
  { ratio: 3.42, gain: 0.08, decay: 0.55 },
  { ratio: 4.5, gain: 0.05, decay: 0.35 },
];

const BASE_HZ = 587.33; // D5
const STRIKE_INTERVAL_MS = 620; // roughly the rate of a hand-held pooja bell

export const TempleBell: React.FC = () => {
  const [isRinging, setIsRinging] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringingRef = useRef(false);

  const strike = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.connect(ctx.destination);
    // Slight variation per strike so a held ring does not sound like a loop.
    const jitter = 0.94 + Math.random() * 0.12;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22 * jitter, now + 0.004);

    let longest = 0;
    for (const p of PARTIALS) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = BASE_HZ * p.ratio * jitter;

      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(p.gain, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + p.decay + 0.05);
      longest = Math.max(longest, p.decay);
    }

    // Release the gain node once the tail has died, or a long ring leaks nodes.
    window.setTimeout(() => master.disconnect(), (longest + 0.2) * 1000);
  }, []);

  const stop = useCallback(() => {
    ringingRef.current = false;
    setIsRinging(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = new Ctor();
    }
    // Browsers start the context suspended until a user gesture.
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();

    ringingRef.current = true;
    setIsRinging(true);
    strike();
    timerRef.current = setInterval(() => {
      if (!ringingRef.current) return;
      strike();
    }, STRIKE_INTERVAL_MS);
  }, [strike]);

  const toggle = useCallback(() => {
    if (ringingRef.current) stop();
    else void start();
  }, [start, stop]);

  // Stop on unmount and when the tab is hidden: a bell ringing from a
  // backgrounded tab is a good way to get the app closed.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      stop();
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [stop]);

  return (
    <button
      onClick={toggle}
      aria-pressed={isRinging}
      aria-label={isRinging ? 'Stop the bell' : 'Ring the temple bell'}
      title={isRinging ? 'Stop the bell' : 'Ring the temple bell'}
      className={`fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center
        border shadow-2xl transition-colors
        ${
          isRinging
            ? 'bg-amber-500 border-amber-400 text-ink-inverse'
            : 'bg-stone-900 border-amber-500/40 text-amber-400 hover:border-amber-400'
        }`}
    >
      {/* Expanding rings while it sounds, so it is obvious it is still going. */}
      {isRinging && (
        <>
          <span className="absolute inset-0 rounded-full border border-amber-400/70 animate-ping" />
          <span
            className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping"
            style={{ animationDelay: '0.3s' }}
          />
        </>
      )}
      {isRinging ? (
        <BellOff className="w-6 h-6 relative" />
      ) : (
        <Bell className="w-6 h-6 relative" />
      )}
    </button>
  );
};
