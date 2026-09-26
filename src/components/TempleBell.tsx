'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

/**
 * The pooja bell.
 *
 * Rung continuously while the upachara is offered, as it is held in the left
 * hand at home, rather than one chime per click.
 *
 * A RECORDING of a real household bell, not a synthesised one. The previous
 * version built the sound from seven sine partials, which was defensible --
 * nothing to ship, nothing to load -- and it did not sound like a bell. Additive
 * synthesis gets the pitch right and the metal wrong: what is missing is the
 * inharmonic clatter of the clapper and the irregularity of a hand shaking, and
 * those are not reachable by adding more partials.
 */

const SRC = '/audio/temple-bell.mp3';

/** Below this, treat the sample as silence when trimming the loop. */
const SILENCE = 0.004;
/** Fade applied when the ring stops, so releasing does not click. */
const RELEASE_S = 0.18;

/**
 * The encoded file, fetched at most once for the whole app.
 *
 * Module level, not a ref: the prefetch and the decode are triggered from
 * different places, two screens can each mount a bell, and React's development
 * StrictMode mounts every component twice. Held in a ref this was six requests
 * for one 230KB asset -- measured, not guessed.
 */
let rawPromise: Promise<ArrayBuffer> | null = null;

function fetchRaw(): Promise<ArrayBuffer> {
  if (!rawPromise) {
    rawPromise = fetch(SRC).then((r) => {
      if (!r.ok) throw new Error(`${SRC}: ${r.status}`);
      return r.arrayBuffer();
    });
    // Do not cache a failure: let the next press try the network again.
    rawPromise.catch(() => {
      rawPromise = null;
    });
  }
  return rawPromise;
}

interface TempleBellProps {
  /**
   * "floating" parks it over the bottom-right of the page. "docked" renders it
   * as a normal control, for a screen that already has a footer to sit in --
   * floating over a pooja step meant it covered the offering list.
   */
  variant?: 'floating' | 'docked';
}

/**
 * Where the sound actually starts and ends inside the file.
 *
 * A recording has a little silence at each end, and looping the whole buffer
 * would put that silence in the middle of a continuous ring -- a gap every few
 * seconds, which is the one thing a held bell must not do. Rather than trim the
 * asset by hand and hope, find the edges from the samples.
 */
function findLoopPoints(buf: AudioBuffer): { start: number; end: number } {
  const ch = buf.getChannelData(0);
  const step = Math.max(1, Math.floor(buf.sampleRate / 1000)); // ~1ms resolution
  let first = 0;
  let last = ch.length - 1;
  for (let i = 0; i < ch.length; i += step) {
    if (Math.abs(ch[i]) > SILENCE) { first = i; break; }
  }
  for (let i = ch.length - 1; i >= 0; i -= step) {
    if (Math.abs(ch[i]) > SILENCE) { last = i; break; }
  }
  if (last <= first) return { start: 0, end: buf.duration };
  return { start: first / buf.sampleRate, end: last / buf.sampleRate };
}

export const TempleBell: React.FC<TempleBellProps> = ({ variant = 'floating' }) => {
  const [isRinging, setIsRinging] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const bufRef = useRef<AudioBuffer | null>(null);
  const loadRef = useRef<Promise<AudioBuffer | null> | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const ringingRef = useRef(false);

  const audioContext = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctxRef.current = new Ctor();
    return ctxRef.current;
  }, []);

  /** Fetch and decode once; every later ring reuses the buffer. */
  const load = useCallback((): Promise<AudioBuffer | null> => {
    if (bufRef.current) return Promise.resolve(bufRef.current);
    if (loadRef.current) return loadRef.current;
    const ctx = audioContext();
    if (!ctx) return Promise.resolve(null);
    loadRef.current = fetchRaw()
      // decodeAudioData DETACHES the ArrayBuffer it is given, so hand it a copy
      // and leave the shared one intact for a retry or a second bell.
      .then((ab) => ab.slice(0))
      // The callback form, not the promise form: Safari still ships the old
      // signature and returns undefined from decodeAudioData.
      .then((ab) => new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then((buf) => {
        bufRef.current = buf;
        return buf;
      })
      .catch(() => {
        // A bell that cannot load is not a reason to break the page. Let the
        // next press try again rather than caching the failure forever.
        loadRef.current = null;
        return null;
      });
    return loadRef.current;
  }, [audioContext]);

  const stop = useCallback(() => {
    ringingRef.current = false;
    setIsRinging(false);
    const ctx = ctxRef.current;
    const src = srcRef.current;
    const gain = gainRef.current;
    srcRef.current = null;
    gainRef.current = null;
    if (!ctx || !src || !gain) return;
    // Ramp down rather than cutting: stopping a loud loop dead is a click.
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + RELEASE_S);
    try {
      src.stop(now + RELEASE_S + 0.02);
    } catch {
      // already stopped
    }
    src.onended = () => {
      src.disconnect();
      gain.disconnect();
    };
  }, []);

  const start = useCallback(async () => {
    const ctx = audioContext();
    if (!ctx) return;
    // Browsers start the context suspended until a user gesture.
    if (ctx.state === 'suspended') await ctx.resume();

    const buf = await load();
    // The press may have been released while the file was still decoding.
    if (!buf || !ringingRef.current) return;
    // A second press landed first; do not stack two loops.
    if (srcRef.current) return;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const { start: loopStart, end: loopEnd } = findLoopPoints(buf);
    src.loop = true;
    src.loopStart = loopStart;
    src.loopEnd = loopEnd;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
    src.connect(gain);
    gain.connect(ctx.destination);
    // Begin at the first real sample, not at the file's leading silence.
    src.start(0, loopStart);

    srcRef.current = src;
    gainRef.current = gain;
  }, [audioContext, load]);

  const toggle = useCallback(() => {
    if (ringingRef.current) {
      stop();
    } else {
      ringingRef.current = true;
      setIsRinging(true);
      void start();
    }
  }, [start, stop]);

  // Warm the sample once the page is idle, so the first ring is immediate
  // rather than waiting on a 230KB fetch. Idle, not on mount: this must never
  // compete with the step content for bandwidth.
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Only prefetch; creating the AudioContext is left to the user gesture,
    // because a context built without one starts suspended on iOS and some
    // browsers warn about it. The decode then reuses these bytes rather than
    // asking the network a second time.
    const warm = () => {
      void fetchRaw().catch(() => {});
    };
    if (w.requestIdleCallback) idle = w.requestIdleCallback(warm, { timeout: 4000 });
    else timer = setTimeout(warm, 2000);
    return () => {
      if (idle !== undefined) w.cancelIdleCallback?.(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);

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
