'use server';

import { computePanchangam } from '@/lib/panchangam';
import {
  renderSankalpamCore,
  renderSankalpam,
  OCCASION_GANESHA_CHATURTHI,
  type SankalpamContext,
} from '@/lib/sankalpam';

/**
 * Server action for the Sankalpam.
 *
 * The previous implementation computed tithi as `(dayOfMonth - 1) % 15`,
 * nakshatra as `(dayOfMonth + month * 2) % 27`, took the Gregorian month as the
 * masa, hardcoded the samvatsara, and accepted latitude and longitude without
 * ever reading them. On Ganesha Chaturthi 2026 it would have announced
 * Chaturdashi.
 *
 * It now runs real Drik Ganita and is verified field by field against a recited
 * Sankalpam for that day at Chennai.
 */

export interface ScriptTriple {
  sanskrit: string;
  tamil: string;
  translit: string;
}

export interface PanchangamData {
  samvatsara: ScriptTriple;
  ayana: ScriptTriple;
  ritu: ScriptTriple;
  /** Solar month. Tamil Smartha recites this, not the lunar name. */
  masa: ScriptTriple;
  paksha: ScriptTriple;
  /** Tithi prevailing at sunrise. */
  tithi: ScriptTriple;
  /** The tithi that follows when it turns during the day. Null if it does not. */
  tithiUpari: ScriptTriple | null;
  vasara: ScriptTriple;
  nakshatra: ScriptTriple;
  yoga: ScriptTriple;
  karana: ScriptTriple;
  /** The dynamic middle of the sentence, ready to recite. */
  core: ScriptTriple;
  /** The whole sentence including preamble, place and performer. */
  full: ScriptTriple;
  locationText?: string;
  dateFormatted?: string;
  /** Lunar month, shown as context; not recited in Tamil Smartha. */
  lunarMasa?: string;
  sunriseLocal?: string | null;
}

const triple = (s: { deva: string; tamil: string; iast: string }): ScriptTriple => ({
  sanskrit: s.deva,
  tamil: s.tamil,
  translit: s.iast,
});

export async function fetchPanchangamData(
  dateInput: string | Date,
  lat = 13.0827,
  lon = 80.2707,
  options: {
    timezone?: string;
    place?: string;
    gotra?: string;
    name?: string;
    gender?: 'male' | 'female';
    occasionDeva?: string;
  } = {},
): Promise<PanchangamData | null> {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Midday, so the day is unambiguous whatever the timezone. The engine picks
  // the tithi at sunrise itself.
  const at = new Date(date);
  if (typeof dateInput === 'string' && !dateInput.includes('T')) at.setHours(12, 0, 0, 0);

  const tz = options.timezone ?? 'Asia/Kolkata';
  const p = computePanchangam(at, lat, lon, tz);
  if (!p) return null;

  const ctx: SankalpamContext = {
    gotra: options.gotra,
    name: options.name,
    gender: options.gender,
    place: options.place,
    occasionDeva: options.occasionDeva ?? OCCASION_GANESHA_CHATURTHI,
  };

  return {
    samvatsara: triple(p.samvatsara),
    ayana: triple(p.ayana),
    ritu: triple(p.ritu),
    masa: triple(p.masa),
    paksha: triple(p.paksha),
    tithi: triple(p.tithi),
    tithiUpari: p.tithiUpari ? triple(p.tithiUpari) : null,
    vasara: triple(p.vasara),
    nakshatra: triple(p.nakshatra),
    yoga: triple(p.yoga),
    karana: triple(p.karana),
    core: {
      sanskrit: renderSankalpamCore(p, 'deva', ctx),
      tamil: renderSankalpamCore(p, 'tamil', ctx),
      translit: renderSankalpamCore(p, 'iast', ctx),
    },
    full: {
      sanskrit: renderSankalpam(p, 'deva', ctx),
      tamil: renderSankalpam(p, 'tamil', ctx),
      translit: renderSankalpam(p, 'iast', ctx),
    },
    locationText: options.place,
    dateFormatted: at.toISOString().split('T')[0],
    lunarMasa: p.meta.lunarMasaName,
    sunriseLocal: p.sunriseLocal,
  };
}
