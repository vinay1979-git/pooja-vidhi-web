import Sanscript from '@indic-transliteration/sanscript';

/**
 * The Abhivadanam, filled in.
 *
 * The book prints it with dotted blanks and a rubric telling the reader to look
 * their pravara up in a table fifteen pages later and write it in. The app never
 * sends the reader elsewhere (docs/PROJECT-GUIDE.md §2.2), so the mantra is
 * stored with tokens -- [PRAVARA_RISHIS] [ARSHEYA] [GOTRA] [NAME] -- and filled
 * here from the gotra chosen once, before the rite begins. With nothing chosen
 * the tokens render as the book's own blanks, so the sentence is never broken.
 */

export interface GotraRow {
  id: string;
  gotra_deva: string;
  gotra_main_deva: string;
  gotra_alt_deva: string | null;
  gotra_iast: string;
  pravaras_deva: string[];
  pravaras_iast: string[];
  pravara_count: number;
  rishi_group: string | null;
  variant: string | null;
}

/** What the reader chose: a row of the book's table, or their own entry. */
export interface GotraChoice {
  /** Devanagari when chosen from the table; whatever was typed otherwise. */
  gotra: string;
  pravaras: string[];
  /** The table row, so the picker can show what is selected. Null if typed. */
  rowId: string | null;
}

export type AbhivadanamScript = 'sanskrit' | 'tamil' | 'translit';

export const ABHIVADANAM_TOKENS = /\[(PRAVARA_RISHIS|ARSHEYA|GOTRA|NAME)\]/;

/** "of three rishis" etc. The book prints the table under these headings. */
const ARSHEYA: Record<number, string> = {
  1: 'एकार्षेय',
  2: 'द्व्यार्षेय',
  3: 'त्र्यार्षेय',
  5: 'पञ्चार्षेय',
};
const BLANK = '............';
const DEVA = /[ऀ-ॿ]/;

/** Devanagari into the script on screen; anything else is left as typed. */
function inScript(text: string, script: AbhivadanamScript): string {
  if (!DEVA.test(text)) return text;
  if (script === 'sanskrit') return text;
  if (script === 'translit') return Sanscript.t(text, 'devanagari', 'iast');
  // The same two repairs the rest of the app applies to Tamil: the visarga is
  // a raised colon, never the aytham, and no stray apostrophes.
  return Sanscript.t(text, 'devanagari', 'tamil').replace(/ஃ/g, '꞉').replace(/'/g, '');
}

export function fillAbhivadanam(
  text: string,
  script: AbhivadanamScript,
  choice: GotraChoice | null,
  name: string,
): string {
  if (!ABHIVADANAM_TOKENS.test(text)) return text;
  const pravaras = choice?.pravaras.filter(Boolean) ?? [];
  const arsheya = ARSHEYA[pravaras.length] ?? 'त्र्यार्षेय / पञ्चार्षेय';
  const values: Record<string, string> = {
    PRAVARA_RISHIS: pravaras.length
      ? pravaras.map((p) => inScript(p, script)).join(' ')
      : [BLANK, BLANK, BLANK].join(' '),
    ARSHEYA: inScript(arsheya, script),
    GOTRA: choice?.gotra ? inScript(choice.gotra, script) : BLANK,
    NAME: name.trim() ? inScript(name.trim(), script) : BLANK,
  };
  return text.replace(/\[(PRAVARA_RISHIS|ARSHEYA|GOTRA|NAME)\]/g, (_, k: string) => values[k]);
}

/** Loose roman matching for the picker: "bharadwaj" finds भारद्वाज. */
export function looseRoman(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/(.)\1+/g, '$1')
    .replace(/[^a-z]/g, '')
    .replace(/a+$/, '');
}
