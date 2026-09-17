'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

/**
 * The pooja bell.
 *
 * Rung continuously while the upachara is offered, as it is held in the left
 * hand at home, rather than one chime per click.
 *
 * Synthesised rather than sampled: zero network, zero latency, no asset to
 * ship, and the timbre stays adjustable.
 */

// A small brass pooja hand bell, not a temple or church bell.
//
// The difference is mostly the hum partial and the decay. A large bell has a
// strong partial an octave BELOW the strike note and rings for seconds, which
// is what gives it that cathedral body. A little hand bell has almost no hum,
// its energy sits in the bright upper partials, and it dies away in well under
// a second. It is also shaken rather than struck, so the strikes come fast and
// slightly unevenly, and the clapper rebounds off the far wall of the bell.
const PARTIALS: { ratio: number; gain: number; decay: number }[] = [
  { ratio: 1.0, gain: 0.42, decay: 0.5 }, // strike note
  { ratio: 1.51, gain: 0.3, decay: 0.36 },
  { ratio: 2.14, gain: 0.26, decay: 0.27 },
  { ratio: 2.93, gain: 0.19, decay: 0.2 },
  { ratio: 3.81, gain: 0.13, decay: 0.15 },
  { ratio: 5.17, gain: 0.08, decay: 0.1 },
  { ratio: 6.72, gain: 0.05, decay: 0.07 },
];

const BASE_HZ = 1760; // A6. Small bells sit far above a temple bell's D5.
const STRIKE_INTERVAL_MS = 165; // shaken, not tolled
const REBOUND_MS = 62; // clapper coming back off the opposite wall
const REBOUND_GAIN = 0.45;

interface TempleBellProps {
  /**
   * "floating" parks it over the bottom-right of the page. "docked" renders it
   * as a normal control, for a screen that already has a footer to sit in --
   * floating over a pooja step meant it covered the offering list.
   */
  variant?: 'floating' | 'docked';
}

export const TempleBell: React.FC<TempleBellProps> = ({ variant = 'floating' }) => {
  const [isRinging, setIsRinging] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringingRef = useRef(false);

  const strike = useCallback((scale = 1) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    // Roll off the low end so it reads as small brass rather than boomy.
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    master.connect(hp);
    hp.connect(ctx.destination);

    // Vary each strike so a held ring does not sound like a loop.
    const jitter = 0.97 + Math.random() * 0.06;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16 * scale * jitter, now + 0.002);

    let longest = 0;
    for (const p of PARTIALS) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = BASE_HZ * p.ratio * jitter;

      g.gain.setValueAtTime(0.0001, now);
      // Very fast attack: a small bell has almost no strike transient.
      g.gain.exponentialRampToValueAtTime(p.gain, now + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + p.decay + 0.03);
      longest = Math.max(longest, p.decay);
    }

    // Release the nodes once the tail has died, or a long ring leaks them.
    window.setTimeout(() => {
      master.disconnect();
      hp.disconnect();
    }, (longest + 0.15) * 1000);
  }, []);

  // One shake: the strike, then the clapper rebounding off the far wall.
  const shake = useCallback(() => {
    strike(1);
    window.setTimeout(() => {
      if (ringingRef.current) strike(REBOUND_GAIN);
    }, REBOUND_MS);
  }, [strike]);

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
    shake();
    timerRef.current = setInterval(() => {
      if (!ringingRef.current) return;
      shake();
    }, STRIKE_INTERVAL_MS);
  }, [shake]);

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
      aria-label={isRinging ? 'Stop the bell' : 'Ring the pooja bell'}
      title={isRinging ? 'Stop the bell' : 'Ring the pooja bell'}
      // No position class in the base. "relative" here would beat the variant's
      // "fixed": Tailwind emits position utilities in a fixed order, relative
      // after fixed, so the later rule wins regardless of class order and the
      // floating bell silently stopped floating. Each variant sets its own.
      className={`rounded-full flex items-center justify-center shrink-0
        border transition-colors
        ${
          variant === 'floating'
            ? 'fixed bottom-24 right-5 z-40 w-14 h-14 shadow-2xl'
            : 'relative w-11 h-11 shadow-md'
        }
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
        <BellOff className={variant === 'floating' ? 'w-6 h-6 relative' : 'w-5 h-5 relative'} />
      ) : (
        <Bell className={variant === 'floating' ? 'w-6 h-6 relative' : 'w-5 h-5 relative'} />
      )}
    </button>
  );
};
