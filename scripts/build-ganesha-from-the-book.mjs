#!/usr/bin/env node
/**
 * The three things the Siddhivinayaka section has that the Ganesha pooja lacks.
 *
 *   node scripts/build-ganesha-from-the-book.mjs          # validate
 *   node scripts/build-ganesha-from-the-book.mjs --emit   # write the migration
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), pp.52-83, transcribed page by
 * page into G:\My Drive\Pooja Vidhi\extracted\transcripts\3-siddhivinayaka.
 *
 * HOW THIS LIST GOT SHORT, WHICH IS THE POINT. Transcribing the whole book threw
 * up a long list of things that looked like gaps in the Ganesha pooja. Querying
 * the database for each one before writing anything cut the list from eight to
 * three:
 *
 *   madhuparkam        already on step 22
 *   mantra pushpam     already on step 33 -- review 5a was fixed in 0024
 *   brahmaNE svaahaa   already on steps 12 and 31 -- review 4.2, fixed in 0024
 *   evening savitaa    already in variant_mantra_sanskrit -- review 4.3, in 0024
 *   haridraa           already on step 10
 *
 * One of those was nearly a false negative in the other direction: a search for
 * the rajopachara matched step 18, which looked like it was already there. It
 * was not. Peetha Pooja contains shvEtachCHatraaya, "him of the white parasol",
 * and CHatra matched inside it. Grep the whole line, not the fragment.
 *
 * WHAT IS ACTUALLY MISSING, each with a page:
 *
 *   1. The Ganapati Gayatri during the snanam (p.59), with the book's own
 *      rubric that it is recited TEN times. The app's snanam goes straight from
 *      the panchamrita to the shuddhodaka without it.
 *   2. The rajopachara (p.79) -- parasol, fan, dance, song and instrument,
 *      offered in the mind. 0030 added this to Varalakshmi; Ganesha never had it.
 *   3. The brahmarpanam (p.81) that closes the rite.
 *
 * THE RULE, as elsewhere. ADD what the book has and the app lacks. Do not
 * remove. Replace only for a direct alternative in the same slot or a
 * demonstrable defect -- and this migration replaces nothing at all.
 */
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

function scripts(deva) {
  return {
    deva,
    ta: transliterate(Sanscript, deva, 'tamil'),
    iast: transliterate(Sanscript, deva, 'iast'),
  };
}

/** p.59, between the panchamrita snanam and the shuddhodaka snanam. */
const gayatri = [
  'तत्पुरुषाय विद्महे वक्रतुण्डाय धीमहि ।',
  'तन्नो दन्तिः प्रचोदयात् ॥',
].join('\n');

/** p.79, after the prarthana and the prostration. */
const rajopachara = [
  'छत्र–चामर–नृत्त–गीत–वाद्य समस्त राजोपचारार्थं',
  'अक्षतान् समर्पयामि ॥',
].join('\n');

/** p.81, the last line of the rite. */
const brahmarpanam = 'ॐ तत् सत् ब्रह्मार्पणमस्तु ॥';

const ADDITIONS = [
  {
    step: 'Snanam & Vastram',
    deva: gayatri,
    needle: 'तत्पुरुषाय',
    page: 'p.59',
    why: 'The Ganapati Gayatri, which the book directs to be recited ten times during the bath.',
  },
  {
    step: 'Mantra Pushpam & Namaskaram',
    deva: rajopachara,
    needle: 'राजोपचारार्थं',
    page: 'p.79',
    why: 'The rajopachara, offered in the mind for want of the things themselves.',
  },
  {
    step: 'Kshama Prarthana & Conclusion',
    deva: brahmarpanam,
    needle: 'ब्रह्मार्पणमस्तु',
    page: 'p.81',
    why: 'The brahmarpanam that closes the rite.',
  },
];

// --- validate ---------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- script conversion, every line reversible into both targets ---');
for (const a of ADDITIONS) {
  const s = scripts(a.deva);
  for (const [name, val] of Object.entries(s)) {
    if (!val || !val.trim()) fail(`${a.step}: ${name} is empty`);
  }
  const strip = (x) => x.replace(/[।॥–,]/g, '');
  if (/[\u0900-\u097F]/.test(strip(s.ta))) fail(`${a.step}: Devanagari leaked into Tamil`);
  if (/[\u0900-\u097F]/.test(strip(s.iast))) fail(`${a.step}: Devanagari leaked into IAST`);
  const n = a.deva.split('\n').length;
  if (s.ta.split('\n').length !== n) fail(`${a.step}: Tamil lost a line break`);
  if (s.iast.split('\n').length !== n) fail(`${a.step}: IAST lost a line break`);
  if (!a.deva.includes(a.needle)) fail(`${a.step}: guard needle is not in the text it guards`);
  console.log(`  ${a.page.padEnd(6)} ${a.step.padEnd(32)} ${n} line(s)  ta+iast ok`);
}

// The rajopachara guard must not be the substring that already matches the
// Peetha Pooja's shvEtachCHatraaya. This is the mistake that nearly happened.
if (ADDITIONS[1].needle === 'छत्र') {
  fail('the rajopachara guard is the bare word CHatra, which also occurs in shvEtachCHatraaya');
}
console.log('\n  guard check: rajopachara is guarded on राजोपचारार्थं, not on the bare छत्र');

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit -------------------------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0031_ganesha_from_the_book.sql');
out('--');
out('-- GENERATED by scripts/build-ganesha-from-the-book.mjs. Do not hand-edit.');
out('--');
out('-- Three things the book gives the Ganesha pooja that the app did not have,');
out('-- from Sampradaya Vratha Pooja Vidhi (Giri), pp.52-83:');
out('--');
out('--   p.59  the Ganapati Gayatri during the snanam, recited ten times');
out('--   p.79  the rajopachara');
out('--   p.81  the brahmarpanam that closes the rite');
out('--');
out('-- Everything else the transcription turned up was already present, including');
out('-- madhuparkam, the mantra pushpam, brahmaNE svaahaa and the evening savitaa --');
out('-- the last three fixed by 0024. This migration adds only, and replaces nothing.');
out('--');
out('-- Idempotent: every append is guarded on the text it would add.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const a of ADDITIONS) {
  const s = scripts(a.deva);
  out(`-- ${a.page}: ${a.why}`);
  out('update public.pooja_steps set');
  out(`       mantra_sanskrit = mantra_sanskrit || chr(10) || ${q(s.deva)},`);
  out(`       mantra_tamil    = mantra_tamil    || chr(10) || ${q(s.ta)},`);
  out(`       mantra_translit = mantra_translit || chr(10) || ${q(s.iast)},`);
  out('       updated_at      = now()');
  out(` where pooja_id = 'ganesha_standard' and step_title_en = ${q(a.step)}`);
  out(`   and mantra_sanskrit not like ${q('%' + a.needle + '%')};`);
  out();
}

out("-- The Ganapati Gayatri carries a count the app has no column for. The book's");
out("-- rubric is dashavaaram japitvaa -- 'having recited ten times' -- so it goes");
out('-- into the instruction, which is the only place a reader will see it.');
out('update public.pooja_steps set');
out("       instruction_en = instruction_en || ' Recite the Ganapati Gayatri (tatpuruṣāya vidmahe) ten times while sprinkling the water.',");
out('       updated_at     = now()');
out(" where pooja_id = 'ganesha_standard' and step_title_en = 'Snanam & Vastram'");
out("   and instruction_en not like '%ten times%';");
out();

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
for (const a of ADDITIONS) {
  out(`  select count(*) into n from public.pooja_steps`);
  out(`   where pooja_id = 'ganesha_standard' and step_title_en = ${q(a.step)}`);
  out(`     and mantra_sanskrit like ${q('%' + a.needle + '%')};`);
  out(`  if n <> 1 then raise exception ${q(a.step + ' did not receive its addition')}; end if;`);
  out();
}
out('  -- Each addition appears exactly once, however many times this is run.');
out('  select (length(mantra_sanskrit) - length(replace(mantra_sanskrit, ' + q('राजोपचारार्थं') + ", '')))");
out('         / length(' + q('राजोपचारार्थं') + ') into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Mantra Pushpam & Namaskaram';");
out("  if n <> 1 then raise exception 'the rajopachara appears % times, expected 1', n; end if;");
out();
out('  -- Nothing structural changed.');
out("  select count(*) into n from public.pooja_steps where pooja_id = 'ganesha_standard';");
out("  if n <> 37 then raise exception 'ganesha has % steps, expected 37', n; end if;");
out();
out('  -- Every step with Devanagari still has the other two scripts.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard'");
out("     and coalesce(trim(mantra_sanskrit), '') <> ''");
out('     and (mantra_tamil is null or mantra_translit is null);');
out("  if n > 0 then raise exception '% steps are missing a script', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0031_ganesha_from_the_book.sql', sql);
  console.log('\nwrote supabase/migrations/0031_ganesha_from_the_book.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
