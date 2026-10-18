/**
 * Text preparation for the Sanskrit TTS bake-off (docs/plans/guided-mode.md
 * §4.1, §4.2 step 1, and "Vedic accents, anusvara, visarga, ꣳ").
 *
 * No TTS engine reads Vedic svara marks or the Yajurveda nasal ꣳ, and none
 * lists Sanskrit, so every clip goes through the same steps before synthesis:
 *
 *   normalize()        NFC, svara marks out, ꣳ → गुं, dandas and dashes tidied
 *   splitLines()       one recitation line per clip, split at । ॥ and newlines
 *   visargaEcho()      optional pausal echo: नमः → नमह, हरिः → हरिहि
 *   homorganicAnusvara optional: शंकर → शङ्कर, संध्या → सन्ध्या
 *   toKannada()        Devanagari → Kannada script, for a kn-IN voice
 *   toIast()           Devanagari → IAST, for display only
 *
 * Every function is pure. The stored text (shown to the judge as is) keeps
 * its marks; only the copy sent to a provider is changed.
 */

import Sanscript from '@indic-transliteration/sanscript';

/** Bump when a rule changes, so cached audio from the old rules is not reused. */
export const NORMALIZER_VERSION = 1;

// Vedic svara and cantillation marks. None of them is spoken by any TTS.
//   U+0951 udātta, U+0952 anudātta, U+0953 grave, U+0954 acute
//   U+1CD0–U+1CFF Vedic Extensions (svarita variants, tone marks, …)
//   U+A8E0–U+A8F1 Devanagari Extended combining digits and svara letters
const SVARA = /[॑-॔᳐-᳿꣠-꣱]/g;

// ꣳ (U+A8F3, candrabindu virama) is the Taittirīya anusvāra before a
// sibilant or र, which the book reads "gum": स भूमिꣳ → स भूमिगुं.
// ꣴ (U+A8F4, double candrabindu virama) follows a long vowel and is read
// "ggum" in the same tradition.
const GUM = 'गुं'; // गुं
const GGUM = 'ग्गुं'; // ग्गुं

const DANDA = '।'; // ।
const DOUBLE_DANDA = '॥'; // ॥

/**
 * Remove svara marks.
 * @param {string} s
 */
export function stripSvara(s) {
  return s.normalize('NFC').replace(SVARA, '');
}

/**
 * ꣳ → गुं and ꣴ → ग्गुं.
 * @param {string} s
 */
export function replaceGum(s) {
  return s.replace(/ꣴ/g, GGUM).replace(/ꣳ/g, GUM);
}

/**
 * Normalise one mantra for synthesis: NFC, svaras out, ꣳ replaced, ASCII
 * pipes and doubled dandas made into real dandas, dashes and stray
 * numbering removed, whitespace collapsed (newlines kept).
 * @param {string} s
 */
export function normalize(s) {
  let t = replaceGum(stripSvara(s));
  t = t
    .replace(/\r\n?/g, '\n')
    .replace(/\|\|/g, DOUBLE_DANDA)
    .replace(/\|/g, DANDA)
    .replace(new RegExp(`${DANDA}\\s*${DANDA}`, 'g'), DOUBLE_DANDA)
    // "ओम्-भूर्भुवः", "देवानामसि–सस्निततमम्": dashes are layout, not speech.
    .replace(/[–—\-]+/g, ' ')
    // Leading "1." / "१." list numbering in a stored mantra.
    .replace(/^[ \t]*[0-9०-९]+[.)][ \t]*/gm, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/ +([,।॥])/g, '$1');
  return t.trim();
}

/**
 * Split a mantra into recitation lines, one clip each: at । ॥ and newlines.
 * The dandas themselves are dropped, so a line is only the words to say.
 * @param {string} s raw or normalised Devanagari
 * @returns {string[]}
 */
export function splitLines(s) {
  return normalize(s)
    .split(/[\n।॥]+/)
    .map((l) => l.replace(/^[\s,]+|[\s,]+$/g, ''))
    .filter((l) => /[ऀ-ॿ]/.test(l));
}

// Vowel sign → the matching echo after ह. Inherent a → ह.
const ECHO = {
  'ि': 'ि', // ि  → हि
  'ी': 'ि', // ी  → हि
  'ु': 'ु', // ु  → हु
  'ू': 'ु', // ू  → हु
  'े': 'े', // े  → हे
  'ै': 'ि', // ै  → हि
  'ो': 'ो', // ो  → हो
  'ौ': 'ु', // ौ  → हु
  'ा': '', // ा  → ह
  'ृ': 'ि', // ृ  → हि
};
const INDEPENDENT_ECHO = {
  अ: '', आ: '', इ: 'ि', ई: 'ि', उ: 'ु', ऊ: 'ु',
  ए: 'े', ऐ: 'ि', ओ: 'ो', औ: 'ु',
};

/**
 * Pausal visarga echo on the last word of a line: नमः → नमह, हरिः → हरिहि,
 * गुरुः → गुरुहु. Mid-line visargas are left alone (they are not pausal).
 * Hindi voices tend to drop a visarga; this spells out how it is recited.
 * @param {string} line one recitation line (no dandas)
 */
export function visargaEcho(line) {
  return line.replace(/(.)(ः)(?=\s*$)/u, (_, prev) => {
    const echo = prev in ECHO ? ECHO[prev] : prev in INDEPENDENT_ECHO ? INDEPENDENT_ECHO[prev] : '';
    return `${prev}ह${echo}`;
  });
}

// Varga stops and their nasal: क-varga ङ, च-varga ञ, ट-varga ण, त-varga न, प-varga म.
const VARGA_NASAL = [
  ['क-घ', 'ङ'],
  ['च-झ', 'ञ'],
  ['ट-ढ', 'ण'],
  ['त-ध', 'न'],
  ['प-भ', 'म'],
];

/**
 * Anusvāra before a stop → homorganic nasal + virama, so a Hindi voice says
 * "shankara", not a nasalised vowel: शंकर → शङ्कर, संध्या → सन्ध्या.
 * Kept as is before य र ल व श ष स ह and at the end of a word.
 * @param {string} s
 */
export function homorganicAnusvara(s) {
  let t = s;
  for (const [range, nasal] of VARGA_NASAL) {
    t = t.replace(new RegExp(`ं(?=[${range}])`, 'g'), `${nasal}्`);
  }
  return t;
}

/**
 * Devanagari → Kannada script (lossless for Sanskrit, keeps the inherent
 * vowel and every aspirate). Run on prepared text: ꣳ and svaras must already
 * be gone, or they pass through untouched.
 * @param {string} s
 */
export function toKannada(s) {
  return Sanscript.t(s, 'devanagari', 'kannada');
}

/**
 * Devanagari → IAST, for showing the text to a judge. Not sent to a provider.
 * @param {string} s
 */
export function toIast(s) {
  return Sanscript.t(stripSvara(s), 'devanagari', 'iast');
}

/**
 * Prepare a mantra for one provider variant.
 * @param {string} text raw Devanagari as stored
 * @param {{script?: 'devanagari'|'kannada', visargaEcho?: boolean, homorganic?: boolean}} [opts]
 * @returns {{deva: string, input: string}[]} one entry per recitation line
 */
export function prepare(text, opts = {}) {
  const { script = 'devanagari', visargaEcho: echo = false, homorganic = false } = opts;
  return splitLines(text).map((deva) => {
    let input = deva;
    if (homorganic) input = homorganicAnusvara(input);
    if (echo) input = visargaEcho(input);
    if (script === 'kannada') input = toKannada(input);
    return { deva, input };
  });
}

/** Any character from the Devanagari blocks (incl. Vedic and Extended). */
export const DEVANAGARI_RE = /[ऀ-ॿ᳐-᳿꣠-ꣿ]/;
