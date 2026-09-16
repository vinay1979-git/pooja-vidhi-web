/**
 * The single definition of how this project writes Sanskrit in Tamil script.
 *
 * It used to live in seven scripts with four different definitions, and the
 * differences were not deliberate: three migrations generated the om sign ௐ
 * because they predated the rule that says to write ஓம், and every generator
 * let the Devanagari avagraha ऽ through into Tamil because none of them thought
 * to remove it. Both faults reached production. One module now, imported
 * everywhere, so a rule added here reaches every generator.
 *
 * THE RULES, and why each exists.
 *
 *   Plain Tamil, not superscripted.  The user rejected the Grantha voicing
 *   superscripts (ப²  ப³  ப⁴): they made ordinary words unreadable. Sanscript's
 *   'tamil' scheme is already plain; fixSuperscripts exists only for the
 *   'tamil_superscripted' scheme, which this project no longer uses but which
 *   the generator can still be asked for.
 *
 *   Visarga as ꞉ (U+A789), not ஃ.  ஃ is the Tamil aytham, a distinct letter.
 *   The published Tamil sources this project draws from use ꞉.
 *
 *   ஓம், not ௐ.  The om sign is rare in Tamil typesetting and the published
 *   pages spell it out. Two spellings on one screen looked like a bug.
 *
 *   No avagraha.  Devanagari marks an elided initial अ with ऽ and IAST with an
 *   apostrophe. Tamil does not mark it at all, and Sanscript passes ऽ straight
 *   through, so it has to be removed here or Devanagari leaks into Tamil text.
 *
 *   No vocalic-r marks.  Sanscript emits ௃ and ௄ for ऋ and ॠ. They are not part
 *   of modern Tamil and render as tofu in most fonts.
 */

/** Sanscript defers a voicing mark past a following ra or la. Undo that. */
const MISPLACED_SUPERSCRIPT = /([க-ஹ])([ா-்]*)([ரல])([ா-்]*)([²³⁴])/g;

export function fixSuperscripts(text) {
  let prev;
  let cur = String(text);
  do {
    prev = cur;
    cur = cur.replace(MISPLACED_SUPERSCRIPT, '$1$2$5$3$4');
  } while (cur !== prev);
  return cur;
}

export function tidyTamil(text) {
  return String(text)
    .replace(/[௃௄]/g, '')
    .replace(/ஃ/g, '꞉')
    .replace(/ௐ/g, 'ஓம்')
    .replace(/[ऽ']/g, '');
}

/**
 * Anything that must survive transliteration untouched: the dynamic sankalpam
 * slot, and the danda, which is shared punctuation rather than a letter.
 */
export const PROTECTED = /(\[[A-Z0-9_]+\]|[।॥])/;

/** Devanagari -> `to`, leaving the protected tokens alone. */
export function transliterate(Sanscript, text, to) {
  return String(text)
    .split(PROTECTED)
    .map((part) => {
      if (part === '' || PROTECTED.test(part)) return part;
      const done = Sanscript.t(part, 'devanagari', to);
      return to.startsWith('tamil') ? tidyTamil(fixSuperscripts(done)) : done;
    })
    .join('');
}
