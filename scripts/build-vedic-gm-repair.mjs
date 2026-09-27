#!/usr/bin/env node
/**
 * Regenerate the Tamil and roman wherever the Yajurveda gm nasal leaked.
 *
 *   node scripts/build-vedic-gm-repair.mjs          # validate
 *   node scripts/build-vedic-gm-repair.mjs --emit   # write it
 *
 * WHAT HAPPENED, AND IT IS THE FOURTH TIME. Krishna Yajurveda writes a nasal
 * before a sibilant or semivowel as ꣳ (U+A8F3) -- गणपतिꣳ हवामहे, पार्थिवꣳरजः,
 * ओꣳ सुवः. Sanscript does not map it. So it passed straight through:
 *
 *     deva      गणपतिꣳ हवामहे      correct, this is what the book prints
 *     tamil     கணபதிꣳ ஹவாமஹே      a Devanagari codepoint inside Tamil
 *     translit  gaṇapatim̐ havāmahe  a candrabindu nobody can pronounce
 *
 * After the avagraha, the om sign and the visarga. Same shape every time: a
 * character the transliterator cannot see, riding through into the output
 * script. The fix belongs in _tamil.mjs, and is there now.
 *
 * WHY NO GATE CAUGHT IT. proofread already fails a Tamil field containing
 * Devanagari -- that gate was added for the visarga. Its character class was
 * /[ऀ-ॣ०-ॿ]/, the Devanagari block, and ꣳ lives in Devanagari EXTENDED at
 * U+A8E0-U+A8FF. The gate was looking in the right place for the wrong range.
 * Widened alongside this, which is what surfaced these four rows.
 *
 * THE READING IS NOT A JUDGEMENT CALL. The book romanises the sign itself, in
 * the Nitya Pooja volume: gaNapatigum havaamahE. So gum, and கும் in Tamil.
 *
 * KEYED ON (pooja_id, step_title_en), NOT ON id. pooja_steps.id is generated
 * per insert, so the ids in a database rebuilt from the migrations are not the
 * ids in production -- an update keyed on id matches nothing there and the
 * migration passes by doing nothing at all. The first draft did exactly that
 * and its own assertion caught it, which is the whole argument for asserting
 * the after-state rather than trusting the update.
 *
 * REGENERATED, NOT PATCHED. mantra_sanskrit is canonical and is already
 * correct -- the ꣳ in it belongs there. So the Devanagari is read back and the
 * other two columns are derived from it afresh, rather than string-editing ꣳ
 * into கும் in place. The visarga repair took the same line for the same
 * reason: a derived column that has been hand-edited is no longer derived, and
 * the next regeneration silently undoes the patch.
 */
import { readFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const S = Sanscript.default ?? Sanscript;
const GM = 'ꣳ';
const EXTENDED = /[꣠-ꣿ]/;

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const headers = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

const res = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pooja_steps` +
    '?select=id,pooja_id,step_number,step_title_en,mantra_sanskrit,mantra_tamil,mantra_translit&limit=5000',
  { headers },
);
const steps = await res.json();

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

/** Only rows whose canonical Devanagari actually carries the sign. */
const affected = steps.filter((s) => (s.mantra_sanskrit || '').includes(GM));

console.log('--- rows whose Devanagari carries the gm nasal ---');
const edits = [];
for (const s of affected) {
  const tamil = transliterate(S, s.mantra_sanskrit, 'tamil');
  const translit = transliterate(S, s.mantra_sanskrit, 'iast');
  const at = `${s.pooja_id} #${s.step_number} ${s.step_title_en}`;
  const occurrences = (s.mantra_sanskrit.match(new RegExp(GM, 'g')) || []).length;
  console.log(`  ${at.padEnd(46)} ${occurrences} occurrence(s)`);

  // The regenerated text must be clean, and must actually say what the book
  // says. Checking both directions, because "no longer wrong" and "now right"
  // are different claims.
  if (EXTENDED.test(tamil)) fail(`${at}: regenerated Tamil still carries a Devanagari-Extended character`);
  if (EXTENDED.test(translit)) fail(`${at}: regenerated roman still carries a Devanagari-Extended character`);
  if (!tamil.includes('கும்')) fail(`${at}: regenerated Tamil does not say கும்`);
  if (!translit.includes('gum')) fail(`${at}: regenerated roman does not say gum`);
  if (/m̐/.test(translit)) fail(`${at}: regenerated roman still carries a candrabindu`);
  if (tamil === s.mantra_tamil) fail(`${at}: Tamil is unchanged, so nothing was repaired`);

  edits.push({ pooja: s.pooja_id, title: s.step_title_en, at, tamil, translit });
}

if (!edits.length) fail('found no rows to repair; expected four');
if (edits.length !== 4) fail(`expected four rows, found ${edits.length}`);

// Nothing outside these rows should be touched, and nothing outside them should
// already be broken. If another row carries the sign in a DERIVED column while
// its Devanagari does not, something wrote Tamil by hand.
for (const s of steps) {
  if (affected.includes(s)) continue;
  for (const f of ['mantra_tamil', 'mantra_translit']) {
    if (EXTENDED.test(s[f] || '')) {
      fail(`${s.pooja_id} #${s.step_number}: ${f} carries the sign but its Devanagari does not`);
    }
  }
}

if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0045_vedic_gm_repair.sql');
out('--');
out('-- GENERATED by scripts/build-vedic-gm-repair.mjs. Do not hand-edit.');
out('--');
out('-- The Yajurveda gm nasal, U+A8F3, leaked into both generated scripts.');
out('--');
out('--   deva      गणपतिꣳ हवामहे      correct; this is what the book prints');
out('--   tamil     கணபதிꣳ ஹவாமஹே      a Devanagari codepoint inside Tamil');
out('--   translit  gaṇapatim̐ havāmahe  a candrabindu nobody can pronounce');
out('--');
out('-- Fourth time in this project after the avagraha, the om sign and the visarga,');
out('-- and the same shape every time: a character Sanscript cannot see, riding');
out('-- through into the output script.');
out('--');
out('-- proofread DOES fail a Tamil field containing Devanagari -- that gate went in');
out('-- for the visarga. Its character class was the Devanagari BLOCK, and this sign');
out('-- lives in Devanagari Extended. Right place, wrong range. Widened alongside.');
out('--');
out('-- The reading is the book\'s own: gaNapatigum havaamahE. So gum, and கும்.');
out('--');
out('-- REGENERATED, NOT PATCHED. mantra_sanskrit is canonical and already correct.');
out('-- The other two columns are re-derived from it rather than string-edited,');
out('-- because a derived column that has been hand-patched is no longer derived and');
out('-- the next regeneration quietly undoes the patch.');
out('-- =============================================================================');
out();
out('begin;');
out();
for (const e of edits) {
  out(`-- ${e.at}`);
  out('update public.pooja_steps set');
  out(`       mantra_tamil    = ${q(e.tamil)},`);
  out(`       mantra_translit = ${q(e.translit)},`);
  out('       updated_at      = now()');
  out(` where pooja_id = ${q(e.pooja)} and step_title_en = ${q(e.title)};`);
  out();
}
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- No Tamil field anywhere carries a Devanagari-Extended character. The range');
out('  -- is spelled out rather than named because Postgres has no such class.');
out("  select count(*) into n from public.pooja_steps");
out("   where coalesce(mantra_tamil, '') ~ '[\\uA8E0-\\uA8FF]';");
out("  if n <> 0 then raise exception '% Tamil mantra(s) still carry a Vedic-extended sign', n; end if;");
out();
out('  -- ...nor any roman field, and no candrabindu either.');
out("  select count(*) into n from public.pooja_steps");
out("   where coalesce(mantra_translit, '') ~ '[\\uA8E0-\\uA8FF]'");
out("      or coalesce(mantra_translit, '') like '%m̐%';");
out("  if n <> 0 then raise exception '% roman mantra(s) still carry the candrabindu', n; end if;");
out();
out('  -- And the Devanagari is UNTOUCHED: the sign belongs there. If this is zero,');
out('  -- something helpfully stripped the source instead of the derived columns.');
out("  select count(*) into n from public.pooja_steps");
out(`   where coalesce(mantra_sanskrit, '') like '%${GM}%';`);
out(`  if n <> ${edits.length} then raise exception 'expected ${edits.length} step(s) to keep the sign in Devanagari, found %', n; end if;`);
out();
out('  -- The repaired rows say what the book says.');
out('  --');
out('  -- Scoped to those four rows by name. An unscoped count of Tamil containing');
out('  -- கும் returns eight, because ku followed by m is an ordinary Tamil');
out('  -- sequence that occurs in mantras having nothing to do with this sign. The');
out('  -- first draft asserted the unscoped count and would have passed on four');
out('  -- unrelated rows while these four stayed broken.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(edits[0].pooja)}`);
out(`     and step_title_en in (${edits.map((e) => q(e.title)).join(', ')})`);
out("     and mantra_tamil like '%கும்%';");
out(`  if n <> ${edits.length} then raise exception 'only % of the ${edits.length} repaired step(s) say கும்', n; end if;`);
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0045_vedic_gm_repair.sql', sql);
  console.log('\nwrote supabase/migrations/0045_vedic_gm_repair.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
