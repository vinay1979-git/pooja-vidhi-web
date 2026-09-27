#!/usr/bin/env node
/**
 * Put the visarga back where an ASCII colon was standing in for it.
 *
 *   node scripts/build-visarga-repair.mjs          # validate
 *   node scripts/build-visarga-repair.mjs --emit   # write it
 *
 * WHAT HAPPENED. Transcribing the book by hand, `namaḥ` was typed as नम: -- with
 * an ASCII colon (U+003A) instead of the Devanagari visarga ः (U+0903). Eighty-
 * six times, across nineteen page transcripts.
 *
 * Sanscript cannot see an ASCII colon as a letter, so it passed it through
 * untouched into BOTH generated scripts. 0032 therefore wrote:
 *
 *     deva      ॐ वरलक्ष्म्यै नम:          should be नमः
 *     tamil     ஓம் வரலக்ஷ்ம்யை நம:        should be நம꞉   (U+A789)
 *     translit  oṃ varalakṣmyai nama:      should be namaḥ  (U+1E25)
 *
 * The owner spotted it on screen: a Tamil line ending in a colon that belongs to
 * neither script. It is the third time in this project that a character which
 * LOOKS right has slipped through a conversion -- after the avagraha and the om
 * sign, both recorded in the header of _tamil.mjs.
 *
 * WHY NO GATE CAUGHT IT. proofread's checkScripts asks whether a Tamil string is
 * well-formed Tamil. ':' is punctuation, so it is not not-Tamil; the string
 * passed. The same blind spot as the mantra-shaped titles: the check looked at
 * whether the value was well formed and not at whether every character in it
 * belonged there. A gate for exactly this is added alongside.
 *
 * THE FIX. The transcripts are corrected at source, so a rebuild of the document
 * is right too. This migration re-derives the affected text from the corrected
 * transcripts and rewrites all three script columns -- it does not patch the
 * colon in place, because the Tamil and the roman have to be REGENERATED from
 * the corrected Devanagari rather than string-edited.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/4-varalakshmi/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri), pp.115-137';

const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  byPage[d.book_page] = d;
}
function deva(page, ...idx) {
  return idx.map((i) => byPage[page].blocks[i].lines.join('\n')).join('\n');
}
function rows(page, idx) {
  return byPage[page].blocks[idx].rows;
}
function scripts(d) {
  return {
    deva: d,
    ta: transliterate(Sanscript, d, 'tamil'),
    iast: transliterate(Sanscript, d, 'iast'),
  };
}

/** Exactly the mapping 0032 used, re-read from the corrected transcripts. */
const REPLACE = [
  { step: 'Peeta Pooja', d: deva('117', 10) },
  { step: 'Dhyanam', d: deva('115', 9) + '\n' + deva('116', 1, 3) },
  { step: 'Avahanam', d: deva('117', 5) },
  { step: 'Padyam, Arghyam & Achamaniyam', d: deva('118', 0, 3, 6, 9) },
  { step: 'Panchamrita & Shuddhodaka Snanam', d: deva('119', 2, 5, 8) },
  { step: 'Vastram, Abharanam & Mangalyam', d: deva('119', 11) + '\n' + deva('120', 0, 6) },
  { step: 'Gandham, Akshatai & Pushpam', d: deva('120', 3, 9) + '\n' + deva('121', 2) },
  { step: 'Dhoopam & Deepam', d: deva('129', 1, 4, 7) },
  { step: 'Karpura Neerajanam', d: deva('131', 15) + '\n' + deva('132', 2) },
  { step: 'Pushpanjali & Mantra Pushpam', d: deva('132', 5) },
  { step: 'Pradakshina', d: deva('132', 9) },
  { step: 'Namaskaram & Varalakshmi Prarthana', d: deva('133', 2, 6) },
  { step: 'Sharadu Dharanam', d: deva('134', 4) },
  { step: 'Vayana Dhanam', d: deva('136', 9, 12) + '\n' + deva('137', 0) },
  { step: 'Udvasanam', d: deva('137', 7) },
  { step: 'Dora Sthapanam', d: deva('117', 2) },
];

const ANGA = [...rows('121', 8), ...rows('122', 1)].map(([name, limb, en]) => ({
  name: name.replace(/^ओं\s*/, 'ॐ '),
  limb,
  en,
}));

// --- validate ---------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };
const COLON = /:/;

console.log('--- no ASCII colon survives anywhere in the regenerated text ---');
const all = [...REPLACE.map((r) => r.d), ...ANGA.map((a) => a.name + ' ' + a.limb)];
for (const d of all) {
  const s = scripts(d);
  for (const [name, v] of Object.entries(s)) {
    if (COLON.test(v)) fail(`an ASCII colon survives in ${name}: ${v.split('\n').find((l) => COLON.test(l))}`);
  }
}
if (!failed) console.log(`  ${all.length} texts, deva + tamil + iast all clean`);

console.log('\n--- and the visarga really is there, in each script ---');
const probe = scripts(ANGA[0].name);
console.log('  deva     ' + probe.deva);
console.log('  tamil    ' + probe.ta);
console.log('  translit ' + probe.iast);
if (!probe.deva.includes('\u0903')) fail('the Devanagari has no visarga U+0903');
if (!probe.ta.includes('\uA789')) fail('the Tamil has no visarga U+A789');
if (!probe.iast.includes('\u1E25')) fail('the roman has no visarga U+1E25');

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit -------------------------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0035_visarga_not_a_colon.sql');
out('--');
out('-- GENERATED by scripts/build-visarga-repair.mjs. Do not hand-edit.');
out('--');
out('-- namaHa was transcribed as नम: with an ASCII colon instead of the visarga ः.');
out('-- Sanscript cannot see an ASCII colon as a letter, so it passed through into');
out('-- BOTH generated scripts and 0032 wrote Tamil lines ending in a colon that');
out('-- belongs to neither script -- ஓம் வரலக்ஷ்ம்யை நம: where it should read நம꞉.');
out('--');
out('-- The transcripts are corrected at source; this re-derives the affected text');
out('-- from them. It regenerates all three script columns rather than patching the');
out('-- colon, because the Tamil and the roman have to come FROM the corrected');
out('-- Devanagari, not from a string edit of the broken output.');
out('--');
out('-- Idempotent: setting a value to what it should be.');
out('-- =============================================================================');
out();
out('begin;');
out();
out('-- --- the fifteen replaced steps, plus the one new one -----------------------');
for (const r of REPLACE) {
  const s = scripts(r.d);
  out('update public.pooja_steps set');
  out(`       mantra_sanskrit = ${q(s.deva)},`);
  out(`       mantra_tamil    = ${q(s.ta)},`);
  out(`       mantra_translit = ${q(s.iast)},`);
  out('       updated_at      = now()');
  out(` where pooja_id = 'varalakshmi_vratham' and step_title_en = ${q(r.step)};`);
  out();
}
out('-- --- the twenty-four anga pooja rows ----------------------------------------');
ANGA.forEach((a, i) => {
  const n = scripts(a.name);
  const o = scripts(a.limb + ' पूजयामि');
  out('update public.archana_items set');
  out(`       invoked_name_deva     = ${q(n.deva)},`);
  out(`       invoked_name_ta       = ${q(n.ta)},`);
  out(`       invoked_name_translit = ${q(n.iast)},`);
  out(`       offering_deva         = ${q(o.deva)},`);
  out(`       offering_ta           = ${q(o.ta)}`);
  out(' where seq = ' + (i + 1) + ' and pooja_step_id = (select id from public.pooja_steps');
  out("        where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Anga Pooja');");
});
out();
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- Not one ASCII colon may remain in any script column, in any pooja.');
out('  select count(*) into n from public.pooja_steps');
out("   where mantra_sanskrit like '%:%' or mantra_tamil like '%:%'");
out("      or mantra_translit like '%:%';");
out("  if n > 0 then raise exception '% steps still carry an ASCII colon', n; end if;");
out();
out('  select count(*) into n from public.archana_items');
out("   where invoked_name_deva like '%:%' or invoked_name_ta like '%:%'");
out("      or invoked_name_translit like '%:%' or offering_deva like '%:%'");
out("      or offering_ta like '%:%';");
out("  if n > 0 then raise exception '% archana rows still carry an ASCII colon', n; end if;");
out();
out('  select count(*) into n from public.namavali_items');
out("   where name_deva like '%:%' or name_ta like '%:%' or name_translit like '%:%';");
out("  if n > 0 then raise exception '% namavali items carry an ASCII colon', n; end if;");
out();
out('  -- And the visarga is present in each script where it belongs.');
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out("   where s.pooja_id = 'varalakshmi_vratham' and s.step_title_en = 'Anga Pooja'");
out("     and a.invoked_name_ta like '%' || chr(42889) || '%';");
out("  if n <> 24 then raise exception 'only % of 24 anga rows have the Tamil visarga', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0035_visarga_not_a_colon.sql', sql);
  console.log('\nwrote supabase/migrations/0035_visarga_not_a_colon.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
