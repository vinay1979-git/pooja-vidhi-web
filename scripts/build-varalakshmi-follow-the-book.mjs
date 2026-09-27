#!/usr/bin/env node
/**
 * Varalakshmi, converted to the book's recension.
 *
 *   node scripts/build-varalakshmi-follow-the-book.mjs          # validate
 *   node scripts/build-varalakshmi-follow-the-book.mjs --emit   # write it
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), pp.115-137.
 *
 * WHAT THIS IS, AND WHY IT IS DIFFERENT FROM 0030. Migration 0030 fixed what
 * was demonstrably WRONG in Varalakshmi -- a milk offering reciting a water
 * verse, an ungrammatical name -- and deliberately left everything that was
 * merely DIFFERENT, because the app followed StotraNidhi (Telugu tradition) and
 * the book is Smartha, and swapping one tradition for another is the owner's
 * decision, not a migration's.
 *
 * The owner has now made that decision: follow the book. So this replaces the
 * wording of the pradhana and uttaranga steps with the book's, adds the one
 * step the book has and the app had no slot for, and swaps the fifteen-limb
 * anga pooja for the book's twenty-four.
 *
 * NOTHING HERE IS RETYPED. Every mantra is read out of the page transcripts in
 * extracted/transcripts/4-varalakshmi, addressed by book page and block index.
 * Retyping a hundred lines of Devanagari by hand to move them thirty feet is
 * how a transcription that was checked against the page becomes one that was
 * not.
 *
 * WHAT IT DELIBERATELY STILL DOES NOT TOUCH:
 *
 *   The Sankalpam. It is the one step carrying [DYNAMIC_PANCHANGAM_DATA], and
 *   its cosmological frame already matches the book (verified against book
 *   p.13). Only the trailing purpose clause differs. Rewriting the step that
 *   drives the app's headline feature, in the same migration that moves
 *   eighteen others, is how one breaks the other. It gets its own pass.
 *
 *   The 108 names. Thirteen differ from the book and they are recension, like
 *   everything else here -- but the namavali is shared machinery addressed by
 *   seq, and it deserves its own migration with its own before/after counts.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/4-varalakshmi/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri), pp.115-137';

// --- read the transcripts ---------------------------------------------------
const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  byPage[d.book_page] = d;
}

/** The Devanagari of one block, addressed by book page and block index. */
function deva(page, ...idx) {
  const d = byPage[page];
  if (!d) throw new Error(`no transcript for book page ${page}`);
  return idx
    .map((i) => {
      const b = d.blocks[i];
      if (!b) throw new Error(`p.${page} has no block ${i}`);
      if (b.type !== 'deva') throw new Error(`p.${page} block ${i} is ${b.type}, not deva`);
      return b.lines.join('\n');
    })
    .join('\n');
}

/** A table block's rows, for the anga pooja. */
function rows(page, idx) {
  const b = byPage[page].blocks[idx];
  if (b.type !== 'table') throw new Error(`p.${page} block ${idx} is ${b.type}, not table`);
  return b.rows;
}

function scripts(d) {
  return {
    deva: d,
    ta: transliterate(Sanscript, d, 'tamil'),
    iast: transliterate(Sanscript, d, 'iast'),
  };
}

// --- the anga pooja, twenty-four limbs (pp.121-122) -------------------------
const ANGA = [...rows('121', 8), ...rows('122', 1)].map(([name, limb, en]) => ({
  name: name.replace(/^ओं\s*/, 'ॐ '),
  limb,
  en,
}));

// --- the new step -----------------------------------------------------------
const DORA_STHAPANAM = {
  title_en: 'Dora Sthapanam',
  title_ta: 'தோர ஸ்தாபனம்',
  deva: deva('117', 2),
  instruction_en:
    'Place the nine-knot nonbu saradu among the offerings before the Goddess is invoked, and invoke it with this verse. The thread stays there through the whole pooja and is worshipped knot by knot near the end.',
  meaning_en:
    'Radiant as the young sun, with a face like the full moon: be well established in this thread, and grant abundant boons.',
  philosophy_en:
    'The book brings the saradu into the rite at the very beginning rather than producing it at the close. The thread is not an ornament handed out at the end of the worship; it is present the whole time, taking on what is offered, so that what is finally tied on the wrist has been through the pooja rather than merely after it.',
};

// --- wording replacements, step title -> book text --------------------------
const REPLACE = [
  { step: 'Peeta Pooja', d: deva('117', 10), note: 'p.117 aasanam' },
  { step: 'Dhyanam', d: deva('115', 9) + '\n' + deva('116', 1, 3), note: 'pp.115-116, all three dhyana verses' },
  { step: 'Avahanam', d: deva('117', 5), note: 'p.117 aavaahanam' },
  { step: 'Padyam, Arghyam & Achamaniyam', d: deva('118', 0, 3, 6, 9), note: 'p.118, incl. madhuparkam' },
  { step: 'Panchamrita & Shuddhodaka Snanam', d: deva('119', 2, 5, 8), note: 'p.119' },
  { step: 'Vastram, Abharanam & Mangalyam', d: deva('119', 11) + '\n' + deva('120', 0, 6), note: 'pp.119-120, vastram + kanthasutram + aabharanam' },
  { step: 'Gandham, Akshatai & Pushpam', d: deva('120', 3, 9) + '\n' + deva('121', 2), note: 'pp.120-121' },
  { step: 'Dhoopam & Deepam', d: deva('129', 1, 4, 7), note: 'p.129' },
  { step: 'Karpura Neerajanam', d: deva('131', 15) + '\n' + deva('132', 2), note: 'pp.131-132' },
  { step: 'Pushpanjali & Mantra Pushpam', d: deva('132', 5), note: 'p.132' },
  { step: 'Pradakshina', d: deva('132', 9), note: 'p.132' },
  { step: 'Namaskaram & Varalakshmi Prarthana', d: deva('133', 2, 6), note: 'p.133, prarthana + rajopachara' },
  { step: 'Sharadu Dharanam', d: deva('134', 4), note: 'pp.134-135 dOra dhaaraNam' },
  { step: 'Vayana Dhanam', d: deva('136', 9, 12) + '\n' + deva('137', 0), note: 'pp.136-137, the full upayana formula' },
  { step: 'Udvasanam', d: deva('137', 7), note: 'p.137 punah poojaa - yathaasthaanam' },
];

// --- validate ---------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- anga pooja: the book prints twenty-four limbs ---');
if (ANGA.length !== 24) fail(`read ${ANGA.length} limbs from the transcripts, expected 24`);
if (new Set(ANGA.map((a) => a.name)).size !== 24) fail('a name repeats in the anga pooja');
console.log(`  ${ANGA.length} limbs, ${ANGA[0].en} to ${ANGA[23].en}`);

console.log('\n--- every replacement reads back as Devanagari and converts cleanly ---');
for (const r of [...REPLACE, { step: DORA_STHAPANAM.title_en, d: DORA_STHAPANAM.deva, note: 'p.117 new step' }]) {
  const s = scripts(r.d);
  const strip = (x) => x.replace(/[।॥–,()]/g, '');
  if (!/[\u0900-\u097F]/.test(r.d)) fail(`${r.step}: the text read from the transcript is not Devanagari`);
  if (/[\u0900-\u097F]/.test(strip(s.ta))) fail(`${r.step}: Devanagari leaked into Tamil`);
  if (/[\u0900-\u097F]/.test(strip(s.iast))) fail(`${r.step}: Devanagari leaked into IAST`);
  const n = r.d.split('\n').length;
  if (s.ta.split('\n').length !== n) fail(`${r.step}: Tamil lost a line break`);
  if (s.iast.split('\n').length !== n) fail(`${r.step}: IAST lost a line break`);
  console.log(`  ${String(n).padStart(2)} line(s)  ${r.step.padEnd(36)} ${r.note}`);
}

console.log('\n--- the replacements really are the book, not the app ---');
const mustAppear = [
  ['Dhyanam', 'समुद्रराज'],
  ['Vastram, Abharanam & Mangalyam', 'माङ्गल्यमणि'],
  ['Sharadu Dharanam', 'नवतन्तु'],
  ['Vayana Dhanam', 'हिरण्यगर्भ'],
  ['Udvasanam', 'कुंभात्'],
];
for (const [step, needle] of mustAppear) {
  const r = REPLACE.find((x) => x.step === step);
  if (!r.d.includes(needle)) fail(`${step}: the book's distinctive phrase ${needle} is absent`);
  else console.log(`  ${step.padEnd(36)} carries ${needle}`);
}

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit -------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);
const W = (t) => ` where pooja_id = 'varalakshmi_vratham' and step_title_en = ${q(t)};`;

out('-- =============================================================================');
out('-- 0032_varalakshmi_follows_the_book.sql');
out('--');
out('-- GENERATED by scripts/build-varalakshmi-follow-the-book.mjs. Do not hand-edit.');
out('--');
out('-- 0030 fixed what was WRONG in Varalakshmi and left what was merely DIFFERENT,');
out('-- because the app followed StotraNidhi and the book is Smartha, and choosing');
out('-- between two traditions is not a migration-s decision. That choice has now');
out('-- been made: follow the book.');
out('--');
out('-- So this replaces the wording of fifteen steps with the book-s, splits the');
out('-- combined Dhyanam & Avahanam step so that the Dora Sthapanam can sit between');
out('-- them where the book puts it, and swaps the fifteen-limb anga pooja for the');
out('-- book-s twenty-four. 29 steps become 31.');
out('--');
out('-- Not touched, each for a stated reason: the Sankalpam, because it is the one');
out('-- step carrying the dynamic panchangam slot and its frame already matches the');
out('-- book; and the 108 names, which are shared machinery addressed by seq and');
out('-- deserve their own before/after counts.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 1. make room: 29 steps become 31 ----------------------------------------');
out('-- (pooja_id, step_number) is unique, so everything from the old step 11 up is');
out('-- parked above 1000 before being reassigned. Same pattern as 0025.');
out('--');
out('-- THE WHOLE RENUMBERING IS GUARDED on the new step not already existing. The');
out('-- inserts below are ON CONFLICT DO NOTHING, so on a second run they would do');
out('-- nothing -- but the park-and-unpark around them would still add 2 to every');
out('-- step number, and every later run would add 2 more. An idempotent insert');
out('-- inside a non-idempotent renumbering is not an idempotent migration.');
out('do $guard$');
out('begin');
out('if exists (select 1 from public.pooja_steps');
out("            where pooja_id = 'varalakshmi_vratham'");
out("              and step_title_en = 'Dora Sthapanam') then");
out("  raise notice 'structural change already applied; skipping section 1';");
out('else');
out();
out("update public.pooja_steps set step_number = step_number + 1000");
out(" where pooja_id = 'varalakshmi_vratham' and step_number >= 11 and step_number < 1000;");
out();
out('-- The old step 10 was "Dhyanam & Avahanam". The book separates them, because');
out('-- the dora sthapanam happens in between.');
out("update public.pooja_steps set step_title_en = 'Dhyanam', step_title_ta = 'த்யானம்', updated_at = now()");
out(" where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Dhyanam & Avahanam';");
out();

// the two new steps: Dora Sthapanam (11) and Avahanam (12)
{
  const s = scripts(DORA_STHAPANAM.deva);
  out('-- The thread is established among the offerings BEFORE the invocation.');
  out('insert into public.pooja_steps');
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en,');
  out('   mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out('   phase, modes, gender_rule, source_ref, scripts_generated)');
  out('values');
  out(`  ('varalakshmi_vratham', 11, ${q(DORA_STHAPANAM.title_en)}, ${q(DORA_STHAPANAM.title_ta)},`);
  out(`   ${q(DORA_STHAPANAM.instruction_en)},`);
  out(`   ${q(s.deva)},`);
  out(`   ${q(s.ta)},`);
  out(`   ${q(s.iast)},`);
  out(`   ${q(DORA_STHAPANAM.meaning_en)},`);
  out(`   ${q(DORA_STHAPANAM.philosophy_en)},`);
  out(`   'pradhana', array['main']::text[], 'all', ${q(BOOK + ', p.117')}, true)`);
  out('on conflict (pooja_id, step_title_en) do nothing;');
  out();
  const a = scripts(deva('117', 5));
  out('insert into public.pooja_steps');
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en,');
  out('   mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out('   phase, modes, gender_rule, source_ref, scripts_generated)');
  out('values');
  out(`  ('varalakshmi_vratham', 12, 'Avahanam', 'ஆவாஹனம்',`);
  out(`   ${q('Invite the Goddess into the kalasham, offering flowers and akshatai.')},`);
  out(`   ${q(a.deva)},`);
  out(`   ${q(a.ta)},`);
  out(`   ${q(a.iast)},`);
  out(`   ${q('Auspiciousness of all auspicious things, who dwells on the breast of Vishnu: I invoke you, O Devi. Be the giver of what is desired.')},`);
  out(`   ${q('The dhyanam pictures her; the avahanam asks her to come. The book keeps them apart because something happens in between -- the thread is laid among the offerings -- and a rite that runs the two together loses the moment the thread is put in place.')},`);
  out(`   'pradhana', array['main']::text[], 'all', ${q(BOOK + ', p.117')}, true)`);
  out('on conflict (pooja_id, step_title_en) do nothing;');
  out();
}

out('-- Bring the parked steps back down, two higher than they were.');
out('update public.pooja_steps set step_number = step_number - 1000 + 2');
out(" where pooja_id = 'varalakshmi_vratham' and step_number >= 1000;");
out();
out('end if;');
out('end $guard$;');
out();

out('-- --- 2. the book-s wording ----------------------------------------------------');
for (const r of REPLACE) {
  const s = scripts(r.d);
  out(`-- ${r.note}`);
  out('update public.pooja_steps set');
  out(`       mantra_sanskrit = ${q(s.deva)},`);
  out(`       mantra_tamil    = ${q(s.ta)},`);
  out(`       mantra_translit = ${q(s.iast)},`);
  out(`       source_ref      = ${q(BOOK)},`);
  out('       updated_at      = now()');
  out(W(r.step));
  out();
}

out('-- --- 3. the anga pooja: fifteen limbs become twenty-four ---------------------');
out('-- The two lists share almost no names, so this is a replacement rather than an');
out('-- extension: the old rows go, the book-s twenty-four take their place.');
out('delete from public.archana_items');
out(' where pooja_step_id = (select id from public.pooja_steps');
out("                         where pooja_id = 'varalakshmi_vratham'");
out("                           and step_title_en = 'Anga Pooja');");
out();
ANGA.forEach((a, i) => {
  const n = scripts(a.name);
  const o = scripts(a.limb + ' पूजयामि');
  out('insert into public.archana_items');
  out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,');
  out('   offering_deva, offering_ta, offering_en)');
  out('select id, ' + (i + 1) + ', ' + q(n.deva) + ', ' + q(n.ta) + ', ' + q(n.iast) + ',');
  out('       ' + q(o.deva) + ', ' + q(o.ta) + ', ' + q('Worship the ' + a.en));
  out("  from public.pooja_steps where pooja_id = 'varalakshmi_vratham'");
  out("   and step_title_en = 'Anga Pooja';");
});
out();
out('update public.pooja_steps set');
out(`       instruction_en = ${q('Twenty-four names, each naming a limb, from the feet upward to the head, and a twenty-fourth for the whole body. Offer a flower or a pinch of akshatai at each.')},`);
out(`       source_ref     = ${q(BOOK + ', pp.121-123')},`);
out('       updated_at     = now()');
out(W('Anga Pooja'));
out();

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham';");
out("  if n <> 31 then raise exception 'varalakshmi has % steps, expected 31', n; end if;");
out();
out('  -- The numbering is 1..31 with no gaps and nothing left parked.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and (step_number < 1 or step_number > 31);");
out("  if n > 0 then raise exception '% steps are outside 1..31', n; end if;");
out('  select count(distinct step_number) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham';");
out("  if n <> 31 then raise exception 'step numbers are not distinct'; end if;");
out();
out('  -- The three new/split steps are in the book-s order.');
out('  select step_number into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Dhyanam';");
out("  if n <> 10 then raise exception 'Dhyanam is at % , expected 10', n; end if;");
out('  select step_number into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Dora Sthapanam';");
out("  if n <> 11 then raise exception 'Dora Sthapanam is at %, expected 11', n; end if;");
out('  select step_number into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Avahanam';");
out("  if n <> 12 then raise exception 'Avahanam is at %, expected 12', n; end if;");
out();
out('  -- The anga pooja is the book-s twenty-four, numbered 1..24.');
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out("   where s.pooja_id = 'varalakshmi_vratham' and s.step_title_en = 'Anga Pooja';");
out("  if n <> 24 then raise exception 'anga pooja has % rows, expected 24', n; end if;");
out();
out('  -- Distinctive phrases of the book, one per replaced step, so that a silent');
out('  -- no-op cannot pass for a conversion.');
for (const [step, needle] of mustAppear) {
  out('  select count(*) into n from public.pooja_steps');
  out(`   where pooja_id = 'varalakshmi_vratham' and step_title_en = ${q(step)}`);
  out(`     and mantra_sanskrit like ${q('%' + needle + '%')};`);
  out(`  if n <> 1 then raise exception ${q(step + ' does not carry the book reading')}; end if;`);
}
out();
out('  -- Every step with Devanagari still has the other two scripts.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham'");
out("     and coalesce(trim(mantra_sanskrit), '') <> ''");
out('     and (mantra_tamil is null or mantra_translit is null);');
out("  if n > 0 then raise exception '% steps are missing a script', n; end if;");
out();
out('  -- And no title got clobbered by a mantra, which is what 0025 did.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham'");
out("     and (length(coalesce(step_title_en, '')) > 60");
out("       or length(coalesce(step_title_ta, '')) > 60");
out("       or step_title_ta like '%।%');");
out("  if n > 0 then raise exception '% titles look like mantra text', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0032_varalakshmi_follows_the_book.sql', sql);
  console.log('\nwrote supabase/migrations/0032_varalakshmi_follows_the_book.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
