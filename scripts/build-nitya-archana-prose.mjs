#!/usr/bin/env node
/**
 * Give the five archanas five different explanations.
 *
 *   node scripts/build-nitya-archana-prose.mjs          # validate
 *   node scripts/build-nitya-archana-prose.mjs --emit   # write it
 *
 * WHAT WAS WRONG. 0037 generated the meaning and the philosophy of all five
 * archanas from one template, varying only the count word and the flower. So
 * every one of them carried the same paragraph, and Shiva and Devi carried the
 * same meaning as well, because both lists happen to have eight names.
 *
 * proofread flagged it as duplicated text and it was right: five different
 * deities were being explained with one sentence that fitted none of them
 * particularly. A template is fine for a hundred rows of a namavali. It is not
 * fine for the one paragraph that tells a reader what they are looking at.
 *
 * Each of these five actually has something specific to say, and the book
 * supplies it -- see especially Devi, who is not given eight names of her own.
 */
import { emitMigration } from './_migration.mjs';

const POOJA = 'nitya_panchayatana';

const PROSE = [
  {
    step: 'Archana — Vinayaka',
    meaning:
      'Sixteen names, from Sumukha the fair-faced to Skandapurvaja the elder brother of Skanda, ' +
      'each closed with namaha, and then the offering of fragrant leaves and flowers of many kinds.',
    philosophy:
      'These are the same sixteen names the book gives in the Purvanga section and again in the ' +
      'Siddhivinayaka pooja. Three separate places, the same list in the same order -- which is ' +
      'how you can tell a short archana is fixed rather than chosen.',
  },
  {
    step: 'Archana — Surya',
    meaning:
      'Twelve names -- Mitra, Ravi, Surya, Bhanu, Khaga, Pushan, Hiranyagarbha, Marichi, Aditya, ' +
      'Savitr, Arka, Bhaskara -- offered to Surya with Chhaya and Sanjna.',
    philosophy:
      'Twelve names for twelve months, one Aditya for each. The sun is the only one of the five ' +
      'whose archana is counted by the year, and the only one invoked in a stone you can see ' +
      'through.',
  },
  {
    step: 'Archana — Vishnu',
    meaning:
      'Twenty-four names, from Keshava to Shri Krishna, offered to Mahavishnu with Bhumi and Nila.',
    philosophy:
      'The first twelve are exactly the twelve of the Anga Vandanam, in the same order. There they ' +
      'are said bare while touching the limbs of your own body; here they take the dative and ' +
      'namaha and are said to an image. The same names, used twice in one rite for two different ' +
      'things. The book also prints a twenty-fifth, hayagreevaaya, in brackets and does not count ' +
      'it -- the same convention it uses for two of the Lakshmi hundred and eight.',
  },
  {
    step: 'Archana — Shiva',
    meaning:
      'Eight names -- Bhava, Sharva, Ishana, Pashupati, Rudra, Ugra, Bhima and Mahat -- each ' +
      'addressed as devaaya, to the god.',
    philosophy:
      'The eight forms of Rudra, and the shortest archana of the five. The deity at the centre of ' +
      'the arrangement is given fewer names than any of the four around him.',
  },
  {
    step: 'Archana — Devi',
    meaning:
      'Eight names, each one the genitive of a form of Shiva followed by patnyai: to the wife of ' +
      'Bhava the god, to the wife of Sharva the god, and so on through the same eight.',
    philosophy:
      'Devi is given no eight names of her own here. She is worshipped as the consort of each of ' +
      'Shiva’s eight forms, using his list in the genitive -- so the two archanas either side of ' +
      'the centre are the same eight words said twice, once in the dative and once in the ' +
      'possessive. Whether that reads as subordination or as inseparability is exactly the ' +
      'question the arrangement is posing, and the book does not answer it.',
  },
];

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- each archana gets its own meaning and philosophy ---');
const meanings = new Set(), phils = new Set();
for (const p of PROSE) {
  if (meanings.has(p.meaning)) fail(`${p.step}: meaning duplicates another`);
  if (phils.has(p.philosophy)) fail(`${p.step}: philosophy duplicates another`);
  meanings.add(p.meaning); phils.add(p.philosophy);
  if (/[ऀ-ॿ஀-௿]/.test(p.meaning + p.philosophy)) fail(`${p.step}: prose contains Indic script`);
  console.log(`  ${p.step.padEnd(22)} meaning ${String(p.meaning.length).padStart(3)} ch, philosophy ${String(p.philosophy.length).padStart(3)} ch`);
}
if (meanings.size !== 5 || phils.size !== 5) fail('five distinct texts expected on both fields');
if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0040_nitya_archana_prose.sql');
out('--');
out('-- GENERATED by scripts/build-nitya-archana-prose.mjs. Do not hand-edit.');
out('--');
out('-- 0037 generated the meaning and philosophy of all five archanas from one');
out('-- template, varying only the count word and the flower. Every one carried the');
out('-- same paragraph, and Shiva and Devi carried the same meaning too, because both');
out('-- lists have eight names. proofread flagged the duplication and was right:');
out('-- five deities were being explained with one sentence that fitted none of them.');
out('--');
out('-- A template is fine for a hundred rows of a namavali. It is not fine for the');
out('-- one paragraph that tells a reader what they are looking at.');
out('-- =============================================================================');
out();
out('begin;');
out();
for (const p of PROSE) {
  out('update public.pooja_steps set');
  out(`       meaning_en    = ${q(p.meaning)},`);
  out(`       philosophy_en = ${q(p.philosophy)},`);
  out('       updated_at    = now()');
  out(` where pooja_id = ${q(POOJA)} and step_title_en = ${q(p.step)};`);
  out();
}
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- All five carry prose, and no two of them carry the same prose.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en like 'Archana%'`);
out("     and coalesce(trim(meaning_en), '') <> '' and coalesce(trim(philosophy_en), '') <> '';");
out("  if n <> 5 then raise exception 'only % of 5 archanas have prose', n; end if;");
out();
out('  select count(distinct meaning_en) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en like 'Archana%';`);
out("  if n <> 5 then raise exception 'the archanas share a meaning: % distinct of 5', n; end if;");
out();
out('  select count(distinct philosophy_en) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en like 'Archana%';`);
out("  if n <> 5 then raise exception 'the archanas share a philosophy: % distinct of 5', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0040_nitya_archana_prose.sql', sql);
  console.log('\nwrote supabase/migrations/0040_nitya_archana_prose.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
