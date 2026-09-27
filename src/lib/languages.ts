import type { InstructionLang, MantraScript } from '@/lib/preferences';
import type { PoojaStep } from '@/types/pooja';

/**
 * The two lists behind the settings sheet, and why they are not one list.
 *
 * MANTRA SCRIPT IS FREE. It is a deterministic function of the Devanagari:
 * sanscript exposes eighty-two schemes and about a dozen are relevant here --
 * Devanagari, Tamil, Telugu, Kannada, Malayalam, Grantha, Bengali, Gujarati,
 * Gurmukhi, Oriya, Sinhala, roman. Adding one is a build step and no human
 * judgement, and the day it exists it is complete. So this list will get long
 * and every entry on it is whole.
 *
 * INSTRUCTION LANGUAGE IS EXPENSIVE. It is human translation: every step title,
 * every instruction, every label the app writes itself. Tamil took real work.
 * So this list will grow slowly and entries on it will be partial for months at
 * a time, and the UI has to say so before the reader picks rather than after.
 *
 * Same sheet, different problems. Hence two registries.
 *
 * ENDONYM FIRST, EVERYWHERE. Someone who reads only Telugu has to be able to
 * find Telugu without reading English, so the list shows తెలుగు and puts the
 * roman name underneath as a search aid rather than as the label. That one fact
 * rules out a grid of chips labelled in English, which is what this replaced.
 */

export interface LanguageEntry {
  code: InstructionLang;
  /** The name in its own script. The label. */
  endonym: string;
  /** The roman name. A subtitle, and something to search by. */
  roman: string;
}

export interface ScriptEntry {
  code: MantraScript;
  endonym: string;
  roman: string;
}

/**
 * Instruction languages that exist. Adding one here is not enough -- ui-text.ts
 * types its table as Record<InstructionLang, UiText>, so TypeScript refuses to
 * build until every label is present.
 *
 * That is worth knowing when reading the coverage below: UI labels are never
 * partial, because a partial one does not compile. Only CONTENT can be partial.
 */
export const LANGUAGES: LanguageEntry[] = [
  { code: 'en', endonym: 'English', roman: 'English' },
  { code: 'ta', endonym: 'தமிழ்', roman: 'Tamil' },
];

/**
 * Mantra scripts that exist TODAY, which is not the same as the scripts
 * sanscript can produce. Only these two are stored, so only these two are
 * offered; listing Telugu before the rendering exists would be offering a
 * button that shows Devanagari.
 */
export const SCRIPTS: ScriptEntry[] = [
  { code: 'sanskrit', endonym: 'संस्कृतम्', roman: 'Devanagari' },
  { code: 'tamil', endonym: 'தமிழ்', roman: 'Tamil' },
];

/**
 * WHICH FIELDS COUNT AS TRANSLATABLE, and the trap in getting this wrong.
 *
 * pooja_steps has four prose fields. Only two of them are meant to exist in
 * every language:
 *
 *   step_title_*   translated.
 *   instruction_*  translated.
 *   philosophy_*   ENGLISH BY DECISION. Null on all 107 rows and staying so.
 *   meaning_*      English only -- there is no meaning_ta column in the schema.
 *
 * Counting all four would report Tamil as half finished when it is in fact
 * complete on everything it is supposed to cover. This project has thrown away
 * one gate already for crying wolf; a coverage badge that calls a finished
 * translation "partial" would be the same mistake somewhere more visible.
 */
const TRANSLATED_FIELDS = ['step_title', 'instruction'] as const;

export type CoverageLevel = 'full' | 'partial' | 'none';

export interface Coverage {
  level: CoverageLevel;
  done: number;
  total: number;
}

/**
 * How much of THIS pooja exists in each language.
 *
 * Per pooja rather than across the whole database, for two reasons: the steps
 * are already in hand so it costs no query, and it answers the question the
 * reader actually has, which is whether the thing in front of them will be in
 * their language -- not whether the app as a whole is.
 *
 * English is whole by definition: it is the column the others are derived from,
 * and a step with no English text is a missing step rather than a missing
 * translation.
 */
export function coverageFor(lang: InstructionLang, steps: PoojaStep[]): Coverage {
  if (lang === 'en') return { level: 'full', done: steps.length, total: steps.length };

  let done = 0;
  let total = 0;
  for (const s of steps) {
    for (const f of TRANSLATED_FIELDS) {
      const en = (s as unknown as Record<string, unknown>)[`${f}_en`];
      const other = (s as unknown as Record<string, unknown>)[`${f}_${lang}`];
      // A field with no English is not a gap in the translation; it is a field
      // this step does not have. Only count what there is something to render.
      if (typeof en === 'string' && en.trim()) {
        total += 1;
        if (typeof other === 'string' && other.trim()) done += 1;
      }
    }
  }

  if (total === 0) return { level: 'none', done: 0, total: 0 };
  if (done === 0) return { level: 'none', done, total };
  return { level: done === total ? 'full' : 'partial', done, total };
}

/** Case- and script-insensitive enough for a two-field search box. */
export function matchesQuery(q: string, endonym: string, roman: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return endonym.toLowerCase().includes(needle) || roman.toLowerCase().includes(needle);
}
