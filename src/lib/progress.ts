import type { KartaGender, PoojaMode } from '@/types/pooja';

/**
 * Where you had got to, kept until the end of the day.
 *
 * The app remembered your language and your theme and nothing else, so closing
 * the tab in the middle of a pooja lost the step you were on, the samagri you
 * had checked and every name you had offered. The step-jump menu did not fix
 * that; it only made the hunt for step fourteen prettier.
 *
 * WHY IT LAPSES AT MIDNIGHT rather than after N hours. A rite belongs to its
 * sitting. Resuming a pooja you were interrupted in this morning is ordinary;
 * being offered last Tuesday's half-finished vratham is not, and a nitya karma
 * resumed the next day is simply a different performance. A calendar-day
 * comparison also sidesteps the clock arithmetic a rolling window needs -- no
 * timezone maths, nothing to get wrong across a DST change.
 *
 * MODE AND KARTA ARE STORED WITH THE STEP, and that is not belt and braces.
 * stepIndex indexes the full steps array, but which steps are *available* is
 * decided by the pooja mode and the karta. Restoring the index without them
 * would drop you at position fourteen of a different list -- a step you never
 * reached, or one that is skipped for whoever the toggle currently says you
 * are.
 *
 * EVERY ACCESS IS GUARDED. localStorage throws rather than returning null in a
 * private window and when site data is blocked, and this is a convenience:
 * nothing here is the only copy of anything, so failing silently and carrying
 * on unremembered is right.
 */

const KEY_PREFIX = 'pooja-vidhi:progress:';

/** Bumped when the shape changes, so an old entry is dropped, not misread. */
const VERSION = 1;

export interface SavedProgress {
  v: number;
  /** Index into the FULL steps array, the same thing currentStepIndex holds. */
  stepIndex: number;
  mode: PoojaMode;
  karta: KartaGender;
  samagri: Record<string, boolean>;
  archana: Record<string, boolean>;
  /** Local calendar day, 'YYYY-MM-DD'. What decides whether this has lapsed. */
  day: string;
  /** Epoch ms, only so the banner can say "about twenty minutes ago". */
  at: number;
}

/** Local date, not UTC: the day that lapses is the reader's, not Greenwich's. */
export function localDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function loadProgress(poojaId: string): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + poojaId);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedProgress;
    if (p?.v !== VERSION) return null;
    // Lapsed. Clear it rather than leaving it to be re-read and re-rejected on
    // every visit for the rest of the year.
    if (p.day !== localDay()) {
      clearProgress(poojaId);
      return null;
    }
    // -1 is the preparation screen, which is not progress worth restoring.
    if (typeof p.stepIndex !== 'number' || p.stepIndex < 0) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(
  poojaId: string,
  p: Omit<SavedProgress, 'v' | 'day' | 'at'>,
): void {
  try {
    const full: SavedProgress = { ...p, v: VERSION, day: localDay(), at: Date.now() };
    window.localStorage.setItem(KEY_PREFIX + poojaId, JSON.stringify(full));
  } catch {
    /* Private window, or site data blocked. Carry on unremembered. */
  }
}

export function clearProgress(poojaId: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + poojaId);
  } catch {
    /* As above. */
  }
}

/**
 * "about 20 minutes ago". Deliberately vague at every scale: the reader wants
 * to know whether this is the thing they were just doing, not the minute.
 */
export function agoText(at: number, now: number = Date.now()): string {
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return 'a minute ago';
  if (mins < 45) return `about ${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs <= 1) return 'about an hour ago';
  return `about ${hrs} hours ago`;
}
