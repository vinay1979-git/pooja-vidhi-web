/**
 * Reading the cached published pages, and proving nothing was lost doing it.
 *
 * These helpers lived inside build-upachara-mantras.mjs. A second generator
 * needed the same Telugu section reader and the same IAST round trip, and this
 * project has already had the experience of letting one routine exist in seven
 * scripts with four different definitions -- see the header of _tamil.mjs, and
 * the om sign and the avagraha that reached production because of it. One copy,
 * before there are two.
 *
 * THE RULE THESE ENCODE: a mantra's wording comes from a published text. So the
 * text is read out of a cached page rather than typed, and every conversion is
 * proved reversible per line before anything is written. A conversion that
 * cannot be reversed is a conversion that has quietly changed the liturgy.
 */
import { readFileSync } from 'node:fs';
import { PROTECTED } from './_tamil.mjs';

/** Convert, leaving the protected tokens (the dandas, the sankalpam slot) alone. */
export function convert(Sanscript, text, from, to) {
  return String(text)
    .split(PROTECTED)
    .map((p) => (p === '' || PROTECTED.test(p) ? p : Sanscript.t(p, from, to)))
    .join('');
}

/**
 * Punctuation as this project writes it.
 *
 * StotraNidhi writes the danda as an ASCII pipe and the pranava spelt out as
 * ओं. Both have to be normalised BEFORE a round-trip check, not after: the
 * first version of this compared piped input against dandaed output and
 * reported every single line as "round trip lost text" when nothing had been
 * lost at all.
 */
export const normalise = (s) =>
  String(s)
    .replace(/\|\|/g, '॥')
    .replace(/(?<![॥|])\|(?!\|)/g, '।')
    .replace(/(^|\s)ओं(?=\s)/g, '$1ॐ')
    .replace(/[ \t]+/g, ' ')
    .trim();

/**
 * Vedic accents as the roman pages write them: U+0331 macron below, U+030D and
 * U+030E vertical lines above, plus the Devanagari udatta/anudatta.
 *
 * Strip them only AFTER NFC composition. Before it, the IAST long vowels are
 * still a base letter plus a combining macron, and stripping combining marks
 * eats every ā, ī and ū in the text.
 */
export const SVARA = /[̱॒̍̎॑᳚]/g;

/**
 * The Vedic guttural nasal, which these pages write two ways: `g` with a macron
 * below (chandā̱g̱syāpo, yajū̱g̱ṣyāpaḥ) and `g` followed by an anusvara (ogṃ,
 * idagṃ). Both are the anusvara. It has to be folded BEFORE the svara strip,
 * because stripping the macron first leaves a bare `g` that Sanscript then
 * renders literally -- इदग्ं, छन्दाग्स्यापो, which are not words.
 */
const GUTTURAL_NASAL = [
  [/g̱/g, 'ṃ'],
  [/gṃ/g, 'ṃ'],
];

/** Load a cached page as tidy lines: entities decoded, accents gone. */
export function loadRoman(path) {
  return readFileSync(path, 'utf8')
    .normalize('NFC')
    .split('\n')
    .map((l) => {
      let s = l.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'");
      for (const [re, to] of GUTTURAL_NASAL) s = s.replace(re, to);
      return s.replace(SVARA, '').trim();
    })
    .filter(Boolean);
}

/** Load a cached Telugu page as tidy lines. */
export function loadTelugu(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((l) => l.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'").trimEnd());
}

/**
 * Every line of a named section, stopping at the next heading.
 *
 * Both page families mark a heading by ending it with an en dash, which is why
 * loadRoman and loadTelugu decode &#8211; rather than dropping it.
 */
/**
 * Anything that is page furniture rather than liturgy. Ad tags sit INSIDE
 * sections on these pages, so these are skipped rather than treated as the end.
 * None of these characters occurs in a transliterated mantra.
 */
const MARKUP = /[<>="]|adsbygoogle|data-ad|https?:|\(function|\.push\(|setAttribute/;

export function section(lines, name, { script = 'telugu', stopAt, fail } = {}) {
  const isHeading = (l) => l.includes('–');
  const head = (l) => l.replace('–', '').trim();
  const at = lines.findIndex((l) => isHeading(l) && head(l) === name);
  if (at < 0) {
    fail?.(`section "${name}" not found`);
    return [];
  }
  const letters = script === 'telugu' ? /[ఀ-౿]/ : /[a-zāīūṛṝḷṅñṭḍṇśṣḥṃ]/i;
  const out = [];
  let closed = !stopAt;
  for (let i = at + 1; i < lines.length; i++) {
    const l = lines[i];
    if (isHeading(l)) break;
    const t = l.trim();
    if (!t || MARKUP.test(t)) continue;
    if (letters.test(t)) out.push(t);
    // The LAST section on a page has no heading after it, so without an
    // explicit end it ran on into the site footer -- "Support this Dharma
    // Karya", the Paypal links, the comment form -- and the round-trip check
    // dutifully reported that converting English prose to Devanagari and back
    // had lost text. True, and useless. A section that can run off the end
    // names the line it ends on.
    if (stopAt && stopAt.test(t)) { closed = true; break; }
  }
  if (!closed) fail?.(`section "${name}" never reached its stopAt line`);
  if (!out.length) fail?.(`section "${name}" is empty`);
  return out;
}

/** Telugu -> Devanagari, proving per line that converting back returns it. */
export function teluguToDeva(Sanscript, line, fail) {
  const deva = convert(Sanscript, line, 'telugu', 'devanagari');
  const back = convert(Sanscript, deva, 'devanagari', 'telugu');
  if (back !== line) fail?.(`telugu round trip lost text:\n  in   ${line}\n  back ${back}`);
  return deva;
}

/** IAST -> Devanagari, same proof. */
export function iastToDeva(Sanscript, line, fail) {
  // These pages write the visarga as a plain colon in some words (suva: , na:)
  // and as ḥ in others. Sanscript passes a colon straight through, so without
  // this the vyahritis came out as सुव: with an ASCII colon where the visarga
  // belongs. Also ogṃ, the page's way of writing the guttural nasal before a
  // sibilant, which Sanscript does not know and would leave as latin letters.
  const norm = normalise(
    String(line)
      .replace(/gṃ/g, 'ṃ') // safety net; loadRoman folds these already
      .replace(/([aāiīuūṛeo]):/g, '$1ḥ'),
  );
  if (norm.includes(':')) fail?.(`unconverted colon left in: ${norm}`);
  const deva = convert(Sanscript, norm, 'iast', 'devanagari');
  const back = convert(Sanscript, deva, 'devanagari', 'iast');
  if (back !== norm) fail?.(`iast round trip lost text:\n  in   ${norm}\n  back ${back}`);
  return deva;
}

/**
 * The fault classes this project has actually shipped, checked on every
 * generated string. Each line here is a bug that reached production once.
 */
export function checkScripts(label, o, fail) {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== 'string') continue;
    if (v.includes('\r')) fail(`${label}.${k} contains a carriage return`);
    // The avagraha is correct Devanagari and wrong Tamil, so this is a Tamil
    // check only; rejecting it everywhere rejects namo'stu te.
    if (k === 'ta' && /[ௐऽ]/.test(v)) fail(`${label}.${k} carries an om sign or avagraha`);
    if (/[²³⁴]/.test(v)) fail(`${label}.${k} carries a Grantha superscript`);
    if (k === 'deva' && /(^|\s)ओं(\s|$)/.test(v)) fail(`${label}.${k} spells the pranava ओं, not ॐ`);
    if (v.includes('...') || v.includes('…')) fail(`${label}.${k} looks truncated`);
    if (/[ \t]{2,}/.test(v)) fail(`${label}.${k} has a double space`);
    if (/[ఀ-౿]/.test(v)) fail(`${label}.${k} still has Telugu letters in it`);
    if (/[a-zA-Z]/.test(v) && k !== 'iast') fail(`${label}.${k} has latin letters left in it`);
  }
  if (o.ta !== undefined) {
    if (!/[஀-௿]/.test(o.ta)) fail(`${label}.ta has no Tamil letters`);
    // The dandas sit in the Devanagari block but are shared punctuation and are
    // carried through deliberately, so test for Devanagari LETTERS.
    if (/[ऀ-ॣ०-ॿ]/.test(o.ta)) fail(`${label}.ta has Devanagari letters in it`);
  }
  if (o.deva !== undefined && !/[ऀ-ॿ]/.test(o.deva)) {
    fail(`${label}.deva has no Devanagari letters`);
  }
}
