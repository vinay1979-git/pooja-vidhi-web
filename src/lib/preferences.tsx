'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/**
 * Preferences that must outlive a single page.
 *
 * The language toggles lived in PoojaViewer's own useState, so every navigation
 * remounted the component and silently reset the choice back to English and
 * Sanskrit. Someone who reads Tamil had to re-pick it on every pooja.
 *
 * Persisted to localStorage and read back on mount. The first paint uses the
 * defaults so server and client markup agree; the stored values are applied
 * immediately afterwards, which avoids a hydration mismatch.
 */

export type InstructionLang = 'en' | 'ta';

/**
 * The scripts a reader can CHOOSE for the mantra.
 *
 * There used to be a third, 'translit', offered in the header as "Eng". It was
 * removed because the label promised something the button could not give:
 * mantra_translit is romanised Sanskrit, not an English translation, so
 * choosing "Eng" put `gṛhāṇārghyaṃ mayā dattaṃ` on screen where a reader
 * reasonably expected "receive this arghyam I give" -- and on the steps with no
 * roman text stored it fell through to Devanagari, so the English option
 * displayed Sanskrit. Nothing is lost by dropping it: Sanskrit and Tamil both
 * already carry the roman line underneath, and the actual English is the
 * Meaning block, which is always shown.
 */
export type MantraScript = 'sanskrit' | 'tamil';

/** What is actually on screen. Roman can still appear as a fallback. */
export type ShownScript = MantraScript | 'translit';

export type Theme = 'dark' | 'light';

interface Preferences {
  instructionLang: InstructionLang;
  mantraScript: MantraScript;
  theme: Theme;
  setInstructionLang: (v: InstructionLang) => void;
  setMantraScript: (v: MantraScript) => void;
  setTheme: (v: Theme) => void;
  toggleTheme: () => void;
  /** False until localStorage has been read, so callers can avoid flashing. */
  ready: boolean;
}

const KEY = 'pooja-vidhi:prefs';

const DEFAULTS = {
  instructionLang: 'en' as InstructionLang,
  mantraScript: 'sanskrit' as MantraScript,
  theme: 'light' as Theme,
};

const Ctx = createContext<Preferences | null>(null);

function read(): typeof DEFAULTS {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<typeof DEFAULTS>;
    return {
      instructionLang: p.instructionLang === 'ta' ? 'ta' : 'en',
      // Anything that is not 'tamil' becomes 'sanskrit', which also migrates
      // the stored 'translit' of anyone who had the old "Eng" option selected.
      mantraScript: p.mantraScript === 'tamil' ? 'tamil' : 'sanskrit',
      theme: p.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    // Private windows and blocked site data both throw here.
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = read();
    setPrefs(stored);
    setReady(true);
  }, []);

  // Keep the DOM attribute in step so CSS can theme without a re-render.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.lang = prefs.instructionLang === 'ta' ? 'ta' : 'en';
  }, [prefs.theme, prefs.instructionLang, ready]);

  const persist = useCallback((next: typeof DEFAULTS) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Not being able to remember the choice is not a reason to fail the app.
    }
  }, []);

  const value: Preferences = {
    ...prefs,
    ready,
    setInstructionLang: (v) => persist({ ...prefs, instructionLang: v }),
    setMantraScript: (v) => persist({ ...prefs, mantraScript: v }),
    setTheme: (v) => persist({ ...prefs, theme: v }),
    toggleTheme: () =>
      persist({ ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences(): Preferences {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}

/**
 * Resolve a mantra to the requested script, and say honestly what came back.
 *
 * The viewer used to fall through `mantra_tamil || mantra_sanskrit || ...` while
 * the badge kept saying "Tamil Script". With mantra_tamil null on every row,
 * switching to Tamil appeared to do nothing, and what you were shown was
 * labelled as something it was not.
 */
export function resolveScript(
  want: MantraScript,
  source: {
    mantra_sanskrit?: string | null;
    mantra_tamil?: string | null;
    mantra_translit?: string | null;
  },
): { text: string | null; shown: ShownScript | null; isFallback: boolean } {
  const byScript: Record<ShownScript, string | null | undefined> = {
    sanskrit: source.mantra_sanskrit,
    tamil: source.mantra_tamil,
    translit: source.mantra_translit,
  };

  const wanted = byScript[want];
  if (wanted) return { text: wanted, shown: want, isFallback: false };

  // Fall back in a sensible order, but report which script actually appears.
  // Roman is still reachable here even though it can no longer be chosen: a
  // step with no Devanagari is better served by readable roman than by nothing.
  const order: ShownScript[] =
    want === 'tamil' ? ['translit', 'sanskrit'] : ['translit', 'tamil'];

  for (const alt of order) {
    const text = byScript[alt];
    if (text) return { text, shown: alt, isFallback: true };
  }
  return { text: null, shown: null, isFallback: false };
}

export const SCRIPT_LABEL: Record<ShownScript, string> = {
  sanskrit: 'Sanskrit',
  tamil: 'Tamil',
  translit: 'Transliteration',
};
