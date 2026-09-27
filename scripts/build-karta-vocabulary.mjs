#!/usr/bin/env node
/**
 * Say karta, not "the performer".
 *
 *   node scripts/build-karta-vocabulary.mjs          # validate
 *   node scripts/build-karta-vocabulary.mjs --emit   # write it
 *
 * Karta is the ordinary word for the one performing a rite -- the karta of a
 * shraddha, the karta of the household -- and every reader who would open this
 * app already has it. "The performer" was a translation of a term they had, and
 * it made the prose read like a description of the rite from outside it.
 *
 * WHAT THE BOOK ACTUALLY SAYS, since an earlier draft of this header claimed the
 * sankalpam uses the word and it does not. The book never names the performer at
 * all. The only kart- forms in 125 pages are sRSTikartrE and svayamkartrE on
 * Siddhivinayaka pages 21 and 23, and both are the dative of kartR used as an
 * epithet of the DEITY, "to the creator". So this is the project choosing a word
 * the tradition uses, not quoting one the source supplied.
 *
 * THE FORM IS MASCULINE, and the app pre-selects a woman for Varalakshmi. Karta
 * is the masculine nominative singular of the stem kartR; the feminine is
 * kartrI, and a husband and wife acting as one are the dampati. The UI inflects
 * accordingly, because the karta toggle is the one place on the screen that
 * knows who is sitting there.
 *
 * THE PROSE BELOW DOES NOT, and that is the point of writing it down. These
 * five sentences are about whoever is performing -- the karta getting ready,
 * the karta prepared like an object in the rite -- not about a named person, so
 * they take the bare role noun the way English takes "the cook" or "the driver".
 * Inflecting them would mean storing three versions of every paragraph and
 * choosing between them at render, to say nothing new. It is also why the one
 * gendered pronoun goes out with the noun: "what HE is about to become" was
 * about a man, and nothing else here is.
 *
 * FIVE STRINGS, SEVEN ROWS. The purvangam steps are shared, so the Anga Vandanam
 * paragraph is on three poojas and the two Asana Pooja strings are on two each --
 * but those two are the INSTRUCTION and the PHILOSOPHY of the same step, so they
 * are four mentions on two rows and not four rows. Counted the other way first,
 * which is how this file came to assert eight.
 *
 * They are matched on their full current text rather than patched with a regex:
 * a blind replace across a text column is how you discover afterwards that it
 * also rewrote something you had not read.
 *
 * WHAT IS DELIBERATELY NOT TOUCHED. Two steps say a household vidhi "expects to
 * be performed by real households". That is the ordinary English verb, not the
 * noun this migration is replacing, and changing it would be a grammar error
 * rather than a vocabulary correction. The word "performer" must therefore be
 * gone after this runs while "performed" remains, and the assertions say so
 * separately.
 *
 * ONE PRONOUN GOES WITH IT. The Asana Pooja philosophy said the performer "is
 * about to become" an object in the rite, "because that is what HE is about to
 * become". Nothing in the step is about a man; it happens to describe whoever is
 * sitting down. It now says they.
 */
import { emitMigration } from './_migration.mjs';

/**
 * [before, after]. `before` is the exact text currently in the column, so a row
 * that has already been edited by hand will not match and will be left alone
 * rather than silently overwritten with a stale version.
 */
const EDITS = [
  {
    col: 'philosophy_en',
    what: 'Anga Vandanam',
    before:
      'Twelve names of Vishnu touched to twelve places, and again they are the same twelve in any Smartha pooja whichever god it is for. The body is being named part by part before it is asked to do anything. Nothing has been offered yet and no deity has been invited; this is still the performer getting ready.',
    after:
      'Twelve names of Vishnu touched to twelve places, and again they are the same twelve in any Smartha pooja whichever god it is for. The body is being named part by part before it is asked to do anything. Nothing has been offered yet and no deity has been invited; this is still the karta getting ready.',
  },
  {
    col: 'philosophy_en',
    what: 'Asana Pooja',
    before:
      'You consecrate the seat while sitting outside it, and only then take your place. Every other upachara in the pooja is offered to someone else. This one is offered to the ground under yourself, and it is asked of the earth rather than of a god — bear me, and make this seat pure. The performer is prepared like an object in the rite, because that is what he is about to become.',
    after:
      'You consecrate the seat while sitting outside it, and only then take your place. Every other upachara in the pooja is offered to someone else. This one is offered to the ground under yourself, and it is asked of the earth rather than of a god — bear me, and make this seat pure. The karta is prepared like an object in the rite, because that is what they are about to become.',
  },
  {
    col: 'instruction_en',
    what: 'Asana Pooja',
    before:
      'Sprinkle a little water on your seat while reciting this, sitting OUTSIDE the seat. Then take your place on it. The seat is consecrated before the performer occupies it, not after.',
    after:
      'Sprinkle a little water on your seat while reciting this, sitting OUTSIDE the seat. Then take your place on it. The seat is consecrated before the karta occupies it, not after.',
  },
  {
    col: 'philosophy_en',
    what: 'Kshama Prarthana & Conclusion',
    before:
      'Yat pujitam maya deva paripurnam tad astu te: whatever I have worshipped, let it stand complete FOR YOU. Not "forgive me" and not "I did my best". Completion is asked for as something the deity grants, not something the performer achieved, which is why the verse can concede mantra, rite and devotion all at once and still end the pooja properly.',
    after:
      'Yat pujitam maya deva paripurnam tad astu te: whatever I have worshipped, let it stand complete FOR YOU. Not "forgive me" and not "I did my best". Completion is asked for as something the deity grants, not something the karta achieved, which is why the verse can concede mantra, rite and devotion all at once and still end the pooja properly.',
  },
  {
    col: 'philosophy_en',
    what: 'Teertham',
    before:
      'Both rubrics here are about everyone else in the room: the conch water is sprinkled on all present INCLUDING oneself, and the teertham is given to all the other members of the household. The rest of this app is written for a single performer; this step is not.',
    after:
      'Both rubrics here are about everyone else in the room: the conch water is sprinkled on all present INCLUDING oneself, and the teertham is given to all the other members of the household. The rest of this app is written for a single karta; this step is not.',
  },
];

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- the edits ---');
for (const e of EDITS) {
  console.log(`  ${e.what.padEnd(30)} ${e.col}`);
  if (!/\bperformer\b/.test(e.before)) fail(`${e.what}/${e.col}: "before" has no performer to replace`);
  if (/\bperformer\b/.test(e.after)) fail(`${e.what}/${e.col}: "after" still says performer`);
  if (e.before === e.after) fail(`${e.what}/${e.col}: before and after are identical`);
  // Only the noun -- and the one pronoun -- may change. Everything else must be
  // character for character what it was, or this is not a vocabulary edit.
  const old = e.before
    .replace(/\bperformer\b/g, '<WORD>')
    .replace(/what he is about to become/g, '<PRONOUN>');
  const neu = e.after
    .replace(/\bkarta\b/g, '<WORD>')
    .replace(/what they are about to become/g, '<PRONOUN>');
  if (old !== neu) fail(`${e.what}/${e.col}: the edit changes more than the word performer`);
}
if (EDITS.length !== 5) fail(`expected 5 strings, have ${EDITS.length}`);
if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0042_karta_vocabulary.sql');
out('--');
out('-- GENERATED by scripts/build-karta-vocabulary.mjs. Do not hand-edit.');
out('--');
out('-- Say karta, not "the performer". It is the ordinary word for the one');
out('-- performing a rite -- the karta of a shraddha, the karta of the household --');
out('-- and every reader who opens this app already has it; "the performer" was a');
out('-- translation of a term they had, and it described the rite from outside it.');
out('--');
out('-- The BOOK never names the performer at all. The only kart- forms in its 125');
out('-- pages are sRSTikartrE and svayamkartrE, both the dative of kartR used as an');
out('-- epithet of the DEITY. So this is the project choosing a word the tradition');
out('-- uses, not quoting one the source supplied.');
out('--');
out('-- karta is the MASCULINE nominative of kartR; the feminine is kartrI, and a');
out('-- husband and wife acting as one are the dampati. The UI inflects accordingly,');
out('-- because the karta toggle knows who is sitting there. This prose does not:');
out('-- these five sentences are about whoever is performing, not a named person, so');
out('-- they take the bare role noun the way English takes "the cook". It is also');
out('-- why the one gendered pronoun goes out with the noun -- "what HE is about to');
out('-- become" was about a man, and nothing else here is.');
out('--');
out('-- Five strings across seven rows -- the purvangam is shared, so the Anga');
out('-- Vandanam paragraph is on three poojas, and the two Asana Pooja strings are');
out('-- the instruction and the philosophy of the SAME step on two poojas, which is');
out('-- four mentions on two rows. Matched on the FULL current text, not a regex: a');
out('-- blind replace on a text column is how you find out afterwards that it also');
out('-- rewrote something you had not read.');
out('--');
out('-- NOT touched: two steps say a household vidhi "expects to be performed by');
out('-- real households". That is the ordinary verb, not the noun, and rewriting it');
out('-- would be a grammar error rather than a vocabulary correction.');
out('--');
out('-- One pronoun goes with the noun. The Asana Pooja philosophy said the seat is');
out('-- consecrated "because that is what HE is about to become". Nothing in the step');
out('-- is about a man; it describes whoever is sitting down. It now says they.');
out('--');
out('-- Idempotent: a row already carrying the new text matches nothing and is left.');
out('-- =============================================================================');
out();
out('begin;');
out();
for (const e of EDITS) {
  out(`-- ${e.what} (${e.col})`);
  out(`update public.pooja_steps set ${e.col} = ${q(e.after)}, updated_at = now()`);
  out(` where ${e.col} = ${q(e.before)};`);
  out();
}
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- The noun is gone from every column a reader sees.');
out('  select count(*) into n from public.pooja_steps');
out("   where coalesce(instruction_en, '') ~* '\\mperformer\\M'");
out("      or coalesce(meaning_en, '')     ~* '\\mperformer\\M'");
out("      or coalesce(philosophy_en, '')  ~* '\\mperformer\\M';");
out("  if n <> 0 then raise exception '% step(s) still say performer', n; end if;");
out();
out('  -- ...and the verb is still there, so this was a vocabulary change and not a');
out('  -- regex that ate the word wherever it appeared.');
out('  select count(*) into n from public.pooja_steps');
out("   where coalesce(philosophy_en, '') like '%expects to be performed by real households%';");
out("  if n < 1 then raise exception 'the ordinary verb \"performed by\" was destroyed too'; end if;");
out();
out('  -- The replacements landed rather than merely not-failing. Seven rows: the');
out('  -- purvangam steps are shared between poojas, and Asana Pooja says it twice');
out('  -- in one row, once in the instruction and once in the philosophy.');
out('  select count(*) into n from public.pooja_steps');
out("   where coalesce(instruction_en, '') ~* '\\mkarta\\M'");
out("      or coalesce(philosophy_en, '')  ~* '\\mkarta\\M';");
out("  if n <> 7 then raise exception 'expected 7 rows to say karta, found %', n; end if;");
out();
out('  -- The pronoun went with it.');
out('  select count(*) into n from public.pooja_steps');
out("   where coalesce(philosophy_en, '') like '%what he is about to become%';");
out("  if n <> 0 then raise exception '% row(s) still say \"what he is about to become\"', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0042_karta_vocabulary.sql', sql);
  console.log('\nwrote supabase/migrations/0042_karta_vocabulary.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
