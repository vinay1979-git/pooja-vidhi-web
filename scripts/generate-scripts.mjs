#!/usr/bin/env node
/**
 * Generate the Tamil and roman transliteration columns from the canonical
 * Devanagari, and emit them as a migration.
 *
 * mantra_tamil was null on all 18 steps. Hand-typing the same mantra in three
 * scripts is how the data ended up with "ganesovaya", which is not a word.
 * Devanagari is the single source of truth; the other two are derived.
 *
 * Devanagari has to stay canonical because Tamil cannot round-trip: plain Tamil
 * has no separate letters for ga, kha and gha, so "mahaganapataye" comes back as
 * "mahaghanabhadhaye". The superscripted convention keeps them apart.
 *
 * Usage:
 *   node scripts/generate-scripts.mjs            # compare schemes, write nothing
 *   node scripts/generate-scripts.mjs --emit > supabase/migrations/0005_generate_scripts.sql
 *   node scripts/generate-scripts.mjs --scheme=tamil --emit
 *   node scripts/generate-scripts.mjs --selftest # check the superscript fix
 */

import Sanscript from '@indic-transliteration/sanscript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const EXTRACT = REPO + '/DB Extract';

const args = process.argv.slice(2);
const emit = args.includes('--emit');
const selftest = args.includes('--selftest');
// Plain Tamil by default. The superscripted scheme is phonetically exact but
// reads as cluttered to a Tamil reader, and the roman transliteration now shown
// beneath every mantra already carries the exact pronunciation, so the
// superscripts were buying precision the page provides anyway. Pass
// --scheme=tamil_superscripted to go back.
const scheme = (
  args.find((a) => a.startsWith('--scheme=')) || '--scheme=tamil'
).split('=')[1];

const out = emit ? console.log : () => {};
const note = console.error;

// ---------------------------------------------------------------------------
// Correcting a library bug.
//
// In tamil_superscripted the voicing mark belongs immediately after the akshara
// it modifies: ga is ka+3, go is ko+3, gu is ku+3. The library does that
// correctly except when the next letter is ra or la, where it defers the mark
// past it:
//     bharata -> pa ra(4) ta     should be pa(4) ra ta
//     bhala   -> paa la(4)       should be paa(4) la
//     guru    -> ku ru(3)        should be ku(3) ru
//     brahma  -> pa. ra(3) hma   should be pa.(3) ra hma
//
// Tested against all 34 Devanagari consonants: ra and la are the only two that
// trigger it. Neither has a voiced or aspirated counterpart, so neither is ever
// marked, which makes a superscript sitting after one unambiguously misplaced.
// Walking it back onto the preceding akshara is therefore safe. Looped, for
// runs such as bhratr.
// ---------------------------------------------------------------------------
const MISPLACED_SUPERSCRIPT =
  /([க-ஹ])([ா-்]*)([ரல])([ா-்]*)([²³⁴])/g;

function fixSuperscripts(text) {
  let prev;
  let cur = text;
  do {
    prev = cur;
    cur = cur.replace(MISPLACED_SUPERSCRIPT, '$1$2$5$3$4');
  } while (cur !== prev);
  return cur;
}

// ---------------------------------------------------------------------------
// Placeholders such as [DYNAMIC_PANCHANGAM_DATA] must survive untouched, or the
// sankalpam template is destroyed. The danda and double danda need the same
// protection: the scheme otherwise rewrites them as "." and "..", which is a
// downgrade for liturgical text.
//
// Split on the protected runs and transliterate the pieces, rather than
// substituting sentinels into the string. Sentinels are what a transliterator
// is most likely to mangle.
// ---------------------------------------------------------------------------
const PROTECTED = /(\[[A-Z0-9_]+\]|[।॥])/;

// Tidy two artefacts of the plain Tamil scheme.
//  - visarga comes out as aytham; Tamil Sanskrit print uses a raised colon,
//    which is also what the archana rows already used.
//  - vocalic r and rr are marked with an ASCII apostrophe (kRShNa -> kru'Shna).
//    Tamil devotional print writes these plain, and a stray quote in the middle
//    of a mantra just looks like a typo.
const tidyTamil = (t) => t.replace(/௃|௄/g, '').replace(/ஃ/g, '꞉').replace(/'/g, '');

function transliterate(text, to) {
  if (!text) return null;
  return String(text)
    .split(PROTECTED)
    .map((part) => {
      if (part === '' || PROTECTED.test(part)) return part;
      const done = Sanscript.t(part, 'devanagari', to);
      return to.startsWith('tamil') ? tidyTamil(fixSuperscripts(done)) : done;
    })
    .join('');
}

// ---------------------------------------------------------------------------
if (selftest) {
  const cases = [
    ['भरत', 'ப⁴ரத'],
    // The mark follows the whole akshara, so it sits after the vowel sign:
    // the library's own correct output for gu is ku + u-sign + 3.
    ['गुरु', 'கு³ரு'],
    ['ब्रह्म', 'ப்³ரஹ்ம'],
    ['भ्रातृ', 'ப்⁴ராத்ருʼ'],
    ['धरा', 'த⁴ரா'],
    ['भाल', 'பா⁴ல'],
    ['बाल', 'பா³ல'],
    ['गौरी', 'கௌ³ரீ'],
    ['भालचन्द्र', 'பா⁴லசந்த்³ர'],
    ['दया', 'த³யா'],
    ['गणेश', 'க³ணேஶ'],
    ['गो', 'கோ³'],
  ];
  let bad = 0;
  for (const [deva, want] of cases) {
    const got = transliterate(deva, 'tamil_superscripted');
    const ok = got === want;
    if (!ok) bad++;
    note(`  ${ok ? 'ok  ' : 'FAIL'} ${deva}  ->  ${got}${ok ? '' : `   want ${want}`}`);
  }
  note(bad ? `\n${bad} failure(s)` : '\nsuperscript placement: all correct');
  process.exit(bad ? 1 : 0);
}

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

const steps = JSON.parse(
  readFileSync(EXTRACT + '/pooja_steps_rows.json', 'utf8'),
).sort((a, b) => a.step_number - b.step_number);

const withMantra = steps.filter((s) => s.mantra_sanskrit);
note(
  `steps: ${steps.length}, with Devanagari source: ${withMantra.length}, without: ${
    steps.length - withMantra.length
  }`,
);
note(`target Tamil scheme: ${scheme}\n`);

if (!emit) {
  note('Compare the two Tamil conventions on your own mantras:\n');
  for (const s of withMantra.slice(0, 3)) {
    const src = s.mantra_sanskrit.slice(0, 64);
    note(`  ${s.step_title_en}`);
    note(`    devanagari    ${src}`);
    note(`    tamil         ${transliterate(src, 'tamil')}`);
    note(`    superscripted ${transliterate(src, 'tamil_superscripted')}`);
    note(`    iast          ${transliterate(src, 'iast')}`);
    note('');
  }
  note('Plain tamil cannot be read back: ga, kha and gha collapse to one letter.');
  note('Re-run with --emit to write the migration, --selftest to check the fix.');
}

out('-- =============================================================================');
out('-- 0005_generate_scripts.sql');
out('--');
out('-- GENERATED by scripts/generate-scripts.mjs. Do not hand-edit; re-run instead.');
out(`-- Tamil scheme: ${scheme}`);
out('--');
out('-- Derives mantra_tamil and mantra_translit from the canonical mantra_sanskrit.');
out('-- Safe to re-run: every statement is an idempotent UPDATE.');
out('--');
out('-- Corrects a transliteration library bug: the voicing superscript was being');
out('-- deferred past a following ra or la, so bharata came out as pa-ra(4)-ta');
out('-- instead of pa(4)-ra-ta. Verified with --selftest.');
out('-- =============================================================================');
out('');
out('begin;');
out('');

let n = 0;
for (const s of withMantra) {
  out(`-- ${s.step_number}. ${s.step_title_en}`);
  out(`update public.pooja_steps set
  mantra_tamil = ${q(transliterate(s.mantra_sanskrit, scheme))},
  mantra_translit = ${q(transliterate(s.mantra_sanskrit, 'iast'))},
  scripts_generated = true
where pooja_id = ${q(s.pooja_id)} and step_title_en = ${q(s.step_title_en)};`);
  out('');
  n++;
}

const archanaStep = steps.find((s) => s.archana_list);
if (archanaStep) {
  const items = JSON.parse(archanaStep.archana_list);
  out(`-- ${items.length} archana items.`);
  items.forEach((it, i) => {
    if (!it.sanskrit) return;
    out(`update public.archana_items set
  invoked_name_ta = ${q(transliterate(it.sanskrit, scheme))},
  invoked_name_translit = ${q(transliterate(it.sanskrit, 'iast'))}
where seq = ${i + 1} and pooja_step_id = (
  select id from public.pooja_steps
  where pooja_id = ${q(archanaStep.pooja_id)}
    and step_title_en = ${q(archanaStep.step_title_en)});`);
  });
  out('');
  note(`archana items: ${items.length}`);
}

out('commit;');
note(`steps updated: ${n}`);
if (!emit) note('\n(no SQL written; pass --emit)');
