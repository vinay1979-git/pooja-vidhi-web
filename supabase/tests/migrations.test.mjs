// Verifies 0001-0003 against a mock of the CURRENT production schema,
// loaded with the real extract data.
// Requires: npm i -D @electric-sql/pglite
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const MIG = `${REPO}/supabase/migrations`;
const EXTRACT = `${REPO}/DB Extract`;

const db = new PGlite();
const sql = (f) => readFileSync(f, 'utf8');
let failed = false;

const step = async (label, fn) => {
  try { await fn(); console.log(`  ok    ${label}`); }
  catch (e) { failed = true; console.log(`  FAIL  ${label}\n        ${String(e.message).split('\n')[0]}`); }
};

// --- 1. Recreate the schema as it exists in Supabase today -------------------
console.log('\n[1] mock current production schema');
// Supabase provides auth.users and auth.uid(); PGlite does not. Stub them so the
// RLS policies in the migration can compile unchanged.
await step('stub supabase auth schema', async () => {
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid
      language sql stable as $fn$ select null::uuid $fn$;
  `);
});

await step('create poojas + pooja_steps as they are now', async () => {
  await db.exec(`
    create table public.poojas (
      id text primary key,
      title_en text not null,
      title_ta text not null,
      samagri_list jsonb,
      naivedyam_suggestions jsonb
    );
    create table public.pooja_steps (
      id uuid default gen_random_uuid() primary key,
      pooja_id text references public.poojas(id) on delete cascade,
      step_number integer not null,
      step_title_en text not null,
      step_title_ta text,
      instruction_en text,
      instruction_ta text,
      mantra_sanskrit text,
      mantra_tamil text,
      mantra_translit text,
      meaning_en text,
      audio_url text,
      gif_url text,
      is_dynamic_sankalpam boolean default false,
      archana_list jsonb,
      gender_target text,
      philosophy_en text
    );
    alter table public.poojas enable row level security;
    alter table public.pooja_steps enable row level security;
    create policy "Allow public read access on poojas" on public.poojas for select using (true);
    create policy "Allow public read access on pooja_steps" on public.pooja_steps for select using (true);
  `);
});

// --- 2. Load the real extract ------------------------------------------------
console.log('\n[2] load the real extract');
const poojas = JSON.parse(sql(`${EXTRACT}/poojas_rows.json`));
const steps = JSON.parse(sql(`${EXTRACT}/pooja_steps_rows.json`));

await step(`insert ${poojas.length} pooja + ${steps.length} steps`, async () => {
  for (const p of poojas) {
    await db.query(
      `insert into public.poojas (id,title_en,title_ta,samagri_list,naivedyam_suggestions)
       values ($1,$2,$3,$4::jsonb,$5::jsonb)`,
      [p.id, p.title_en, p.title_ta,
       // stored double-encoded in production, so re-encode to reproduce that
       JSON.stringify(p.samagri_list), JSON.stringify(p.naivedyam_suggestions)]
    );
  }
  for (const s of steps) {
    await db.query(
      `insert into public.pooja_steps
        (id,pooja_id,step_number,step_title_en,step_title_ta,instruction_en,instruction_ta,
         mantra_sanskrit,mantra_tamil,mantra_translit,meaning_en,audio_url,gif_url,
         is_dynamic_sankalpam,archana_list,gender_target,philosophy_en)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17)`,
      [s.id, s.pooja_id, s.step_number, s.step_title_en, s.step_title_ta,
       s.instruction_en, s.instruction_ta, s.mantra_sanskrit, s.mantra_tamil,
       s.mantra_translit, s.meaning_en, s.audio_url, s.gif_url,
       s.is_dynamic_sankalpam, s.archana_list == null ? null : JSON.stringify(s.archana_list),
       s.gender_target, s.philosophy_en]
    );
  }
});

// confirm the duplicate really is present in the fixture
const dupBefore = await db.query(
  `select step_number, count(*) c from public.pooja_steps group by 1 having count(*) > 1`
);
console.log(`  note  duplicate step_number present before migration: ${
  dupBefore.rows.map(r => `${r.step_number} x${r.c}`).join(', ') || 'none'}`);

// --- 3. Run the migrations ---------------------------------------------------
console.log('\n[3] run migrations');
for (const f of ['0001_core_tables.sql', '0002_extend_existing.sql', '0003_backfill.sql']) {
  await step(f, () => db.exec(sql(`${MIG}/${f}`)));
  if (failed) { console.log('RESULT: migration failed, stopping'); process.exit(1); }
}

// --- 4. Assertions -----------------------------------------------------------
console.log('\n[4] assertions');
const one = async (q) => (await db.query(q)).rows[0];

const archanaCount = (title) =>
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = '${title}'`;

const assert = async (label, q, want) => {
  const r = await one(q);
  const got = Object.values(r)[0];
  const ok = String(got) === String(want);
  if (!ok) failed = true;
  console.log(`  ${ok ? 'ok   ' : 'FAIL '} ${label}: got ${got}, want ${want}`);
};

await assert('samagri_items backfilled',  'select count(*) from samagri_items', 7);
await assert('naivedyam primary',         "select count(*) from naivedyam_items where tier='primary'", 1);
await assert('naivedyam secondary',       "select count(*) from naivedyam_items where tier='secondary'", 1);
await assert('archana_items backfilled',  'select count(*) from archana_items', 20);
await assert('steps renumbered 1..18',    'select count(*) from pooja_steps', 18);
await assert('no duplicate step_number',
  'select count(*) from (select step_number from pooja_steps group by 1 having count(*)>1) x', 0);
await assert('step numbers are dense',
  'select (max(step_number)-min(step_number)+1) - count(*) from pooja_steps', 0);
await assert('Pranayamam is a filter',
  "select count(*) from pooja_steps where step_title_en='Pranayamam' and gender_rule='filter_male_only'", 1);
await assert('phases assigned',           "select count(*) from pooja_steps where phase is null", 0);
await assert('purvangam count',           "select count(*) from pooja_steps where phase='purvangam'", 7);
await assert('pradhana count',            "select count(*) from pooja_steps where phase='pradhana'", 6);
await assert('uttara count',              "select count(*) from pooja_steps where phase='uttara'", 5);
await assert('deity seeded',              "select count(*) from deities where id='ganesha'", 1);
await assert('calendar rule set',
  "select count(*) from poojas where rule_type='tithi_in_month' and rule_reckoning='saura' and rule_month='aavani'", 1);

// ordering sanity: Gandham must precede Anga Pooja
const ord = await db.query(
  `select step_number, step_title_en from pooja_steps
   where step_title_en in ('Gandham, Kumkumam & Pushpam','Anga Pooja') order by step_number`);
const okOrder = ord.rows[0]?.step_title_en?.startsWith('Gandham');
if (!okOrder) failed = true;
console.log(`  ${okOrder ? 'ok   ' : 'FAIL '} Gandham precedes Anga Pooja: ${
  ord.rows.map(r => `${r.step_number} ${r.step_title_en}`).join('  ->  ')}`);

// --- 5. Idempotency ----------------------------------------------------------
console.log('\n[5] re-run all three (idempotency)');
for (const f of ['0001_core_tables.sql', '0002_extend_existing.sql', '0003_backfill.sql']) {
  await step(`re-run ${f}`, () => db.exec(sql(`${MIG}/${f}`)));
}
await assert('archana_items still 20', 'select count(*) from archana_items', 20);
await assert('samagri_items still 7',  'select count(*) from samagri_items', 7);
await assert('steps still 18',         'select count(*) from pooja_steps', 18);

// --- 6. Legacy columns still readable (main keeps working) -------------------
console.log('\n[6] old code path still works');
await assert('poojas.samagri_list still present',
  "select count(*) from information_schema.columns where table_name='poojas' and column_name='samagri_list'", 1);
await assert('pooja_steps.archana_list still present',
  "select count(*) from information_schema.columns where table_name='pooja_steps' and column_name='archana_list'", 1);

// --- 7. 0004 drop, on a throwaway basis --------------------------------------
console.log('\n[7] 0004 cutover drop');
await step('0004_drop_legacy.sql', () => db.exec(sql(`${MIG}/0004_drop_legacy.sql`)));
await assert('samagri_list dropped',
  "select count(*) from information_schema.columns where table_name='poojas' and column_name='samagri_list'", 0);

// --- 8. Generated Tamil and transliteration ----------------------------------
console.log('\n[8] 0005 generated scripts');
await step('0005_generate_scripts.sql', () => db.exec(sql(`${MIG}/0005_generate_scripts.sql`)));
await assert('mantra_tamil filled where a Devanagari source exists',
  'select count(*) from pooja_steps where mantra_sanskrit is not null and mantra_tamil is null', 0);
await assert('mantra_translit filled likewise',
  'select count(*) from pooja_steps where mantra_sanskrit is not null and mantra_translit is null', 0);
await assert('archana Tamil regenerated',
  'select count(*) from archana_items where invoked_name_ta is null', 0);
await assert('scripts_generated flagged',
  'select count(*) from pooja_steps where mantra_tamil is not null and scripts_generated = false', 0);
// Plain Tamil: no voicing superscripts, no aytham standing in for visarga, and
// no stray ASCII apostrophe from the vocalic-r marker.
await assert('no voicing superscripts in Tamil',
  "select count(*) from pooja_steps where mantra_tamil ~ '[²³⁴]'", 0);
await assert('no apostrophe artefacts in Tamil',
  "select count(*) from pooja_steps where mantra_tamil like '%''%'", 0);
await assert('no superscripts in archana Tamil',
  "select count(*) from archana_items where invoked_name_ta ~ '[²³⁴]'", 0);

// The sankalpam template must survive transliteration intact.
const tpl = await one(
  `select mantra_tamil from pooja_steps where is_dynamic_sankalpam = true limit 1`);
const keptPlaceholder = String(tpl.mantra_tamil ?? '').includes('[DYNAMIC_PANCHANGAM_DATA]');
if (!keptPlaceholder) failed = true;
console.log(`  ${keptPlaceholder ? 'ok   ' : 'FAIL '} sankalpam placeholder survived transliteration`);

// Dandas are liturgical punctuation, not sentence periods.
const danda = await one(
  `select count(*) c from pooja_steps where mantra_sanskrit like '%।%' and mantra_tamil not like '%।%'`);
const keptDanda = Number(danda.c) === 0;
if (!keptDanda) failed = true;
console.log(`  ${keptDanda ? 'ok   ' : 'FAIL '} danda preserved rather than turned into a period`);

// --- 9. Tamil titles and instructions -----------------------------------------
console.log('\n[9] 0006 Tamil content');
await step('0006_tamil_content.sql', () => db.exec(sql(`${MIG}/0006_tamil_content.sql`)));
await assert('every step has a Tamil title',
  'select count(*) from pooja_steps where step_title_ta is null', 0);
await assert('every step has a Tamil instruction',
  'select count(*) from pooja_steps where instruction_ta is null', 0);
await assert('Tamil is not just a copy of the English',
  'select count(*) from pooja_steps where instruction_ta = instruction_en', 0);
await assert('drafts flagged for vaidika review',
  'select count(*) from pooja_steps where source_ref is null', 0);

// --- 9b. Tamil for the preparation screen -------------------------------------
console.log('\n[9b] 0007 Tamil prep items');
await step('0007_tamil_prep_items.sql', () => db.exec(sql(`${MIG}/0007_tamil_prep_items.sql`)));
await assert('every samagri item has Tamil',
  'select count(*) from samagri_items where item_ta is null', 0);
await assert('every naivedyam item has Tamil',
  'select count(*) from naivedyam_items where name_ta is null', 0);
await assert('recipe_note_ta column exists',
  "select count(*) from information_schema.columns where table_name='naivedyam_items' and column_name='recipe_note_ta'", 1);

// --- 9b2. Anga Vandanam scripts ----------------------------------------------
// This ran in production but was never in the harness, so the Varalakshmi
// migration copying Anga Vandanam across found it with no Tamil.
console.log('\n[9b2] 0008 Anga Vandanam scripts');
await step('0008_anga_vandanam_scripts.sql', () => db.exec(sql(`${MIG}/0008_anga_vandanam_scripts.sql`)));
await assert('Anga Vandanam has all three scripts',
  `select count(*) from pooja_steps where step_title_en = 'Anga Vandanam'
     and (mantra_sanskrit is null or mantra_tamil is null or mantra_translit is null)`, 0);
await assert('the twelve Keshavadi names are there',
  `select count(*) from pooja_steps where step_title_en = 'Anga Vandanam'
     and mantra_sanskrit like '%दामोदराय%'`, 1);

// --- 9c. Closing steps and pooja modes ----------------------------------------
console.log('\n[9c] 0009 closing steps and modes');
await step('0009_closing_steps_and_modes.sql', () => db.exec(sql(`${MIG}/0009_closing_steps_and_modes.sql`)));
await assert('20 steps now', 'select count(*) from pooja_steps', 20);
await assert('step numbers still dense',
  'select (max(step_number)-min(step_number)+1) - count(*) from pooja_steps', 0);
await assert('no duplicate step_number after the shift',
  'select count(*) from (select step_number from pooja_steps group by 1 having count(*)>1) x', 0);
await assert('Ksheera Arghyam sits at 18',
  "select count(*) from pooja_steps where step_number = 18 and step_title_en = 'Ksheera Arghyam'", 1);
await assert('Udvasanam is last',
  "select count(*) from pooja_steps where step_number = 20 and step_title_en = 'Udvasanam'", 1);
await assert('main mode steps', "select count(*) from pooja_steps where 'main' = any(modes)", 19);
await assert('punar mode steps', "select count(*) from pooja_steps where 'punar' = any(modes)", 18);
await assert('udvasana mode steps', "select count(*) from pooja_steps where 'udvasana' = any(modes)", 10);
await assert('Avahanam is not repeated on later days',
  "select count(*) from pooja_steps where step_title_en = 'Avahanam & Asanam' and 'punar' = any(modes)", 0);
await assert('Udvasanam only on the final day',
  "select count(*) from pooja_steps where step_title_en = 'Udvasanam' and 'main' = any(modes)", 0);
await assert('new steps carry all three scripts',
  "select count(*) from pooja_steps where step_number in (18,20) and (mantra_sanskrit is null or mantra_tamil is null or mantra_translit is null)", 0);

// --- 9d. Ganesha content ------------------------------------------------------
console.log('\n[9d] 0010 Ganesha content');
await step('0010_ganesha_content.sql', () => db.exec(sql(`${MIG}/0010_ganesha_content.sql`)));
await assert('24 steps now', 'select count(*) from pooja_steps', 24);
await assert('step numbers still dense',
  'select (max(step_number)-min(step_number)+1) - count(*) from pooja_steps', 0);
await assert('no duplicate step_number after the renumber',
  'select count(*) from (select step_number from pooja_steps group by 1 having count(*)>1) x', 0);
await assert('Prana Pratishtha follows Avahanam',
  "select count(*) from pooja_steps where step_number = 9 and step_title_en = 'Prana Pratishtha'", 1);
await assert('the four archana steps sit in video order 14-17',
  `select count(*) from pooja_steps where (step_number, step_title_en) in
     ((14,'Patra Pooja (21 Leaves)'),(15,'Pushpa Pooja (Shodasha Nama)'),
      (16,'Durva Pooja (21 Names)'),(17,'Ganapathi Ashtottara Shatanamavali'))`, 4);
await assert('Udvasanam is still last',
  "select count(*) from pooja_steps where step_number = 24 and step_title_en = 'Udvasanam'", 1);
await assert('108 names loaded',
  "select count(*) from namavali_items where namavali_id = 'ganesha_ashtottara_108'", 108);
await assert('the 108 carry all three scripts',
  `select count(*) from namavali_items where namavali_id = 'ganesha_ashtottara_108'
     and (name_deva is null or name_ta is null or name_translit is null)`, 0);
await assert('no superscripts left in the Tamil names',
  `select count(*) from namavali_items where name_ta ~ '[⁰¹²³⁴⁵⁶⁷⁸⁹]'`, 0);
await assert('the Ashtottara step points at the namavali',
  `select count(*) from pooja_steps where step_title_en = 'Ganapathi Ashtottara Shatanamavali'
     and namavali_id = 'ganesha_ashtottara_108'`, 1);
await assert('21 patra rows', archanaCount('Patra Pooja (21 Leaves)'), 21);
await assert('16 pushpa rows, the four surplus names dropped',
  archanaCount('Pushpa Pooja (Shodasha Nama)'), 16);
await assert('21 durva rows', archanaCount('Durva Pooja (21 Names)'), 21);
await assert('vinayakaya restored at pushpa 8',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Pushpa Pooja (Shodasha Nama)' and a.seq = 8
     and a.invoked_name_translit like '%vināyakāya%'`, 1);
await assert('every patra leaf has a botanical',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Patra Pooja (21 Leaves)' and botanical is null`, 0);
await assert('the thirteen hard-to-find leaves offer a substitute',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Patra Pooja (21 Leaves)' and is_substitutable and substitute_with is null`, 0);
await assert('tulasi is no longer forbidden to Ganesha',
  `select count(*) from deities where id = 'ganesha' and forbidden_offerings ? 'leaves'`, 0);

console.log('\n[9e] 0010 idempotency');
await step('0010 re-run', () => db.exec(sql(`${MIG}/0010_ganesha_content.sql`)));
await assert('still 24 steps', 'select count(*) from pooja_steps', 24);
await assert('still 108 names',
  "select count(*) from namavali_items where namavali_id = 'ganesha_ashtottara_108'", 108);
await assert('still 21 patra rows', archanaCount('Patra Pooja (21 Leaves)'), 21);
await assert('still no duplicate step_number',
  'select count(*) from (select step_number from pooja_steps group by 1 having count(*)>1) x', 0);

// --- 9f. Varalakshmi ----------------------------------------------------------
console.log('\n[9f] 0011 Varalakshmi');
await step('0011_varalakshmi.sql', () => db.exec(sql(`${MIG}/0011_varalakshmi.sql`)));
const VL = "pooja_id = 'varalakshmi_vratham'";
await assert('29 steps', `select count(*) from pooja_steps where ${VL}`, 29);
await assert('step numbers are dense 1..29',
  `select (max(step_number)-min(step_number)+1) - count(*) from pooja_steps where ${VL}`, 0);
await assert('no duplicate step_number',
  `select count(*) from (select step_number from pooja_steps where ${VL} group by 1 having count(*)>1) x`, 0);
await assert('the six shared purvangam steps came across',
  `select count(*) from pooja_steps where ${VL} and source_ref like '%shared purvangam%'`, 6);
await assert('the shared steps carry their mantras',
  `select coalesce(string_agg(step_title_en, ', '), '') from pooja_steps where ${VL}
     and source_ref like '%shared purvangam%'
     and (mantra_sanskrit is null or mantra_tamil is null)`, '');
await assert('Pranayamam is still filtered for women',
  `select count(*) from pooja_steps where ${VL} and step_title_en = 'Pranayamam'
     and gender_rule = 'filter_male_only'`, 1);
await assert('the sankalpam is the dynamic one',
  `select count(*) from pooja_steps where ${VL} and is_dynamic_sankalpam
     and mantra_sanskrit like '%[DYNAMIC_PANCHANGAM_DATA]%'`, 1);
await assert('Peeta Pooja is present and day-one only',
  `select count(*) from pooja_steps where ${VL} and step_title_en = 'Peeta Pooja'
     and modes = '{main}'`, 1);
await assert('the thread is tied once, not on the second day',
  `select count(*) from pooja_steps where ${VL} and step_title_en = 'Sharadu Dharanam'
     and 'punar' = any(modes)`, 0);
await assert('Udvasanam is last and final-day only',
  `select count(*) from pooja_steps where ${VL} and step_number = 29
     and step_title_en = 'Udvasanam' and modes = '{udvasana}'`, 1);
await assert('no Vrata Katha step',
  `select count(*) from pooja_steps where ${VL} and step_title_en ilike '%katha%'`, 0);
await assert('108 Lakshmi names',
  "select count(*) from namavali_items where namavali_id = 'lakshmi_ashtottara_108'", 108);
await assert('the Lakshmi list is the vratham recension, not the sahasranama one',
  `select count(*) from namavali_items where namavali_id = 'lakshmi_ashtottara_108'
     and seq = 1 and name_translit like '%prak%'`, 1);
await assert('all 108 carry three scripts',
  `select count(*) from namavali_items where namavali_id = 'lakshmi_ashtottara_108'
     and (name_deva is null or name_ta is null or name_translit is null)`, 0);
await assert('15 anga pooja rows', archanaCount('Anga Pooja') , 15);
await assert('9 nonbu sharadu knots', archanaCount('Nonbu Sharadu Pooja'), 9);
await assert('every knot names the knot it belongs to',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Nonbu Sharadu Pooja' and offering_deva is null`, 0);
await assert('samagri loaded', `select count(*) from samagri_items where ${VL}`, 21);
await assert('thamarai poo is required',
  `select count(*) from samagri_items where ${VL} and item_en like '%Thamarai%' and is_required`, 1);
await assert('naivedyam loaded', `select count(*) from naivedyam_items where ${VL}`, 7);
await assert('no Tamil superscripts anywhere in this pooja',
  `select count(*) from pooja_steps where ${VL} and mantra_tamil ~ '[⁰¹²³⁴⁵⁶⁷⁸⁹]'`, 0);
await assert('the Bengali characters are gone from the Ganesha step',
  "select count(*) from pooja_steps where mantra_sanskrit like '%পূ%'", 0);

console.log('\n[9g] 0011 idempotency');
await step('0011 re-run', () => db.exec(sql(`${MIG}/0011_varalakshmi.sql`)));
await assert('still 29 steps', `select count(*) from pooja_steps where ${VL}`, 29);
await assert('still 108 names',
  "select count(*) from namavali_items where namavali_id = 'lakshmi_ashtottara_108'", 108);
await assert('still 9 knots', archanaCount('Nonbu Sharadu Pooja'), 9);
await assert('still 21 samagri', `select count(*) from samagri_items where ${VL}`, 21);
await assert('Ganesha pooja untouched at 24 steps',
  "select count(*) from pooja_steps where pooja_id = 'ganesha_standard'", 24);

// --- 9h. Ganesha archanas from the vrata kalpam -------------------------------
console.log('\n[9h] 0012 Ganesha archanas');
await step('0012_ganesha_archanas.sql', () => db.exec(sql(`${MIG}/0012_ganesha_archanas.sql`)));
await assert('the truncated Anga Pooja mantra is gone',
  `select count(*) from pooja_steps where pooja_id = 'ganesha_standard'
     and step_title_en = 'Anga Pooja' and mantra_sanskrit is not null`, 0);
await assert('29 anga rows', archanaCount('Anga Pooja'), 29 + 15); // +15 Varalakshmi shares the title
await assert('29 Ganesha anga rows',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.pooja_id = 'ganesha_standard' and s.step_title_en = 'Anga Pooja'`, 29);
await assert('21 patra rows, now with their own names',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Patra Pooja (21 Leaves)'
     and a.invoked_name_translit not like '%mahāgaṇapataye%'`, 21);
await assert('the patra names are 21 DISTINCT names, not one repeated',
  `select count(distinct a.invoked_name_deva) from archana_items a
     join pooja_steps s on s.id = a.pooja_step_id
    where s.step_title_en = 'Patra Pooja (21 Leaves)'`, 21);
await assert('amalaki replaced devadaru at leaf 13',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Patra Pooja (21 Leaves)' and a.seq = 13
     and a.offering_en like '%Amalaki%'`, 1);
await assert('nine leaves are on the vadyar samagri list, none flagged substitutable',
  `select count(*) from archana_items a join pooja_steps s on s.id = a.pooja_step_id
     where s.step_title_en = 'Patra Pooja (21 Leaves)' and not a.is_substitutable`, 9);
await assert('Pushpa Pooja is renamed and has 21 flowers',
  archanaCount('Pushpa Pooja (21 Flowers)'), 21);
await assert('the old 16-name pushpa step is gone',
  `select count(*) from pooja_steps where step_title_en = 'Pushpa Pooja (Shodasha Nama)'`, 0);
await assert('21 durva rows', archanaCount('Durva Pooja (21 Names)'), 21);
await assert('all four Ganesha archanas are lists with no step mantra',
  `select count(*) from pooja_steps where pooja_id = 'ganesha_standard'
     and step_title_en in ('Anga Pooja','Patra Pooja (21 Leaves)',
                           'Pushpa Pooja (21 Flowers)','Durva Pooja (21 Names)')
     and mantra_sanskrit is not null`, 0);
await assert('still 24 steps',
  "select count(*) from pooja_steps where pooja_id = 'ganesha_standard'", 24);

// --- 9i. Meanings -------------------------------------------------------------
console.log('\n[9i] 0013 meanings');
await step('0013_meanings.sql', () => db.exec(sql(`${MIG}/0013_meanings.sql`)));
await assert('no step is left without a meaning',
  'select count(*) from pooja_steps where meaning_en is null', 0);
await assert('the list-only steps got one too',
  `select count(*) from pooja_steps where meaning_en is not null
     and mantra_sanskrit is null`, 8);
await assert('meanings are not one-liners',
  'select count(*) from pooja_steps where length(meaning_en) < 40', 0);

console.log('\n[9j] 0012 and 0013 idempotency');
await step('0012 re-run', () => db.exec(sql(`${MIG}/0012_ganesha_archanas.sql`)));
await step('0013 re-run', () => db.exec(sql(`${MIG}/0013_meanings.sql`)));
await assert('still 21 patra rows', archanaCount('Patra Pooja (21 Leaves)'), 21);
await assert('still 21 flowers', archanaCount('Pushpa Pooja (21 Flowers)'), 21);
await assert('still no null meanings',
  'select count(*) from pooja_steps where meaning_en is null', 0);
await assert('still 24 + 29 steps', 'select count(*) from pooja_steps', 53);

// --- 9k. Philosophy -----------------------------------------------------------
console.log('\n[9k] 0014 philosophy');
await assert('eleven steps have no philosophy before this runs',
  'select count(*) from pooja_steps where philosophy_en is null', 11);
await step('0014_philosophy.sql', () => db.exec(sql(`${MIG}/0014_philosophy.sql`)));
await assert('no step is left without philosophy',
  'select count(*) from pooja_steps where philosophy_en is null', 0);
await assert('the Varalakshmi bell got one too',
  `select count(*) from pooja_steps where pooja_id = 'varalakshmi_vratham'
     and step_title_en = 'Ghanta Pooja' and philosophy_en is not null`, 1);
await assert('nothing is a stub',
  'select count(*) from pooja_steps where length(philosophy_en) < 80', 0);

console.log('\n[9l] 0014 idempotency');
await step('0014 re-run', () => db.exec(sql(`${MIG}/0014_philosophy.sql`)));
await assert('still none missing',
  'select count(*) from pooja_steps where philosophy_en is null', 0);
// The update is guarded on "is null", so a re-run must not overwrite an entry
// that was edited by hand in between.
await assert('existing entries were not rewritten',
  `select count(*) from pooja_steps where step_title_en = 'Achamanam'
     and philosophy_en like 'Achamanam purifies%'`, 2);

// --- 9m. Hygiene ---------------------------------------------------------------
console.log('\n[9m] 0015 hygiene');
await assert('avagraha is in Tamil text before this runs',
  "select count(*) > 0 from pooja_steps where mantra_tamil like '%ऽ%'", 'true');
await step('0015_hygiene.sql', () => db.exec(sql(`${MIG}/0015_hygiene.sql`)));
await assert('no avagraha left in any Tamil field',
  "select count(*) from pooja_steps where mantra_tamil like '%ऽ%'", 0);
await assert('no om sign left in any Tamil field',
  "select count(*) from pooja_steps where mantra_tamil like '%ௐ%'", 0);
await assert('no avagraha in archana or namavali Tamil',
  "select (select count(*) from archana_items where invoked_name_ta like '%ऽ%')"
  + " + (select count(*) from namavali_items where name_ta like '%ऽ%')", 0);
await assert('no double spaces left in mantras',
  "select count(*) from pooja_steps where mantra_sanskrit ~ '[ \t]{2,}'"
  + " or mantra_tamil ~ '[ \t]{2,}' or mantra_translit ~ '[ \t]{2,}'", 0);
await assert('both poojas have a description',
  'select count(*) from poojas where description_en is null', 0);
await assert('no philosophy claims about nadis or chakras',
  "select count(*) from pooja_steps where philosophy_en ~* 'nadi|chakra|nerve cent|cosmic energ'", 0);
await assert('the seven rewrites landed on 12 rows',
  "select count(*) from pooja_steps where step_title_en in"
  + " ('Achamanam','Anga Vandanam','Vighneshwara Dhyanam','Pranayamam','Kalasha Pooja')"
  + " or (pooja_id = 'ganesha_standard' and step_title_en in ('Anga Pooja','Kshama Prarthana & Conclusion'))", 12);
await assert('the mantras themselves still have their words',
  "select count(*) from pooja_steps where mantra_sanskrit is not null and length(mantra_sanskrit) < 10", 0);
// The four prose fixes: each phrase they were written to remove must be gone.
await assert('no step still claims durva is the only twenty-one-fold upachara',
  "select count(*) from pooja_steps where instruction_en like '%only upachara in the whole pooja given twenty-one times%'", 0);
await assert('nothing still calls the Pushpa Pooja a sixteen-name step',
  "select count(*) from pooja_steps where instruction_en like '%sixteen-name Pushpa Pooja%'", 0);
await assert('dhoopam no longer contradicts the neerajanam step',
  "select count(*) from pooja_steps where philosophy_en like '%only upacharas that reach everyone present%'", 0);
await assert('arugampul is spelled one way everywhere',
  "select count(*) from pooja_steps where instruction_en like '%Arukampul%'", 0);
// ...but the two CORRECT "sixteen upachara" references must survive, because
// they render the kalpam's own shodashopachara.
await assert('the kalpam sixteen-upachara references are untouched',
  "select count(*) from pooja_steps where meaning_en like '%sixteen%upachara%'", 2);

console.log('\n[9n] 0015 idempotency');
await step('0015 re-run', () => db.exec(sql(`${MIG}/0015_hygiene.sql`)));
await assert('still no avagraha',
  "select count(*) from pooja_steps where mantra_tamil like '%ऽ%'", 0);
await assert('still 53 steps', 'select count(*) from pooja_steps', 53);

// --- 9o. Carriage returns -----------------------------------------------------
console.log('\n[9o] 0016 strip carriage returns');
await step('0016_strip_carriage_returns.sql', () => db.exec(sql(`${MIG}/0016_strip_carriage_returns.sql`)));
await assert('no carriage returns in any mantra',
  `select count(*) from pooja_steps where mantra_sanskrit like '%' || chr(13) || '%'
     or mantra_tamil like '%' || chr(13) || '%' or mantra_translit like '%' || chr(13) || '%'`, 0);
await assert('none in prose either',
  `select count(*) from pooja_steps where instruction_en like '%' || chr(13) || '%'
     or instruction_ta like '%' || chr(13) || '%' or meaning_en like '%' || chr(13) || '%'
     or philosophy_en like '%' || chr(13) || '%'`, 0);
await assert('none in archana or namavali',
  `select (select count(*) from archana_items where invoked_name_deva like '%' || chr(13) || '%')
        + (select count(*) from namavali_items where name_deva like '%' || chr(13) || '%')`, 0);
// Stripping CR must not have eaten the line breaks themselves.
await assert('multi-line mantras still have their line breaks',
  `select count(*) from pooja_steps where pooja_id = 'varalakshmi_vratham'
     and mantra_sanskrit like '%' || chr(10) || '%'`, 16);
await step('0016 re-run', () => db.exec(sql(`${MIG}/0016_strip_carriage_returns.sql`)));
await assert('still 53 steps', 'select count(*) from pooja_steps', 53);

// --- 9p. Ganesha preparation --------------------------------------------------
console.log('\n[9p] 0017 Ganesha prep');
await assert('Ganesha had only the original seven samagri',
  "select count(*) from samagri_items where pooja_id = 'ganesha_standard'", 7);
await step('0017_ganesha_prep.sql', () => db.exec(sql(`${MIG}/0017_ganesha_prep.sql`)));
await assert('36 samagri items now',
  "select count(*) from samagri_items where pooja_id = 'ganesha_standard'", 36);
await assert('7 naivedyam items now',
  "select count(*) from naivedyam_items where pooja_id = 'ganesha_standard'", 7);
await assert('the things a practitioner would have arrived without are there',
  `select count(*) from samagri_items where pooja_id = 'ganesha_standard'
     and (item_en like '%Vasthram%' or item_en like '%Poonal%' or item_en like '%Panchamirtham%'
          or item_en like '%Raw milk%' or item_en like '%Vilakku%' or item_en like '%Mani%')`, 6);
await assert('all nine leaves he lists are on the sheet',
  `select count(*) from samagri_items where pooja_id = 'ganesha_standard' and category = 'leaf'`, 9);
await assert('every samagri row is bilingual',
  "select count(*) from samagri_items where item_ta is null or item_ta = ''", 0);
await assert('seq is dense 1..36',
  `select (max(seq)-min(seq)+1) - count(*) from samagri_items where pooja_id = 'ganesha_standard'`, 0);
await assert('one spelling of arugampul in samagri',
  "select count(*) from samagri_items where item_en like '%Arukampul%' or item_ta like '%அறுகம்புல்%'", 0);
await assert('one spelling of arugampul in the steps',
  "select count(*) from pooja_steps where instruction_en like '%Arukampul%' or instruction_ta like '%அறுகம்புல்%'", 0);
await assert('substitutable samagri always names a substitute',
  'select count(*) from samagri_items where is_substitutable and substitute_with is null', 0);

console.log('\n[9q] 0017 idempotency');
await step('0017 re-run', () => db.exec(sql(`${MIG}/0017_ganesha_prep.sql`)));
await assert('still 36 samagri',
  "select count(*) from samagri_items where pooja_id = 'ganesha_standard'", 36);
await assert('Varalakshmi samagri untouched',
  "select count(*) from samagri_items where pooja_id = 'varalakshmi_vratham'", 21);

// --- 9r. The arghyam, and who ties the thread ---------------------------------
// Addressed by the natural key, not by uuid: this database generates its own
// ids in 0001-0009, so the production uuids mean nothing here. Both poojas
// have a step titled 'Ksheera Arghyam', hence the pooja_id in every locator.
const stepAt = (pooja, title) => `pooja_id = '${pooja}' and step_title_en = '${title}'`;
const GAN_ARGHYAM = stepAt('ganesha_standard', 'Ksheera Arghyam');
const VL_ARGHYAM = stepAt('varalakshmi_vratham', 'Ksheera Arghyam');
const VL_THREAD = stepAt('varalakshmi_vratham', 'Sharadu Dharanam');
const itemsOf = (...wheres) =>
  `pooja_step_id in (select id from pooja_steps where ${wheres.map((w) => `(${w})`).join(' or ')})`;

console.log('\n[9r] 0018 arghyam and thread');
await assert('the arghyam was one undifferentiated mantra with no offerings',
  `select count(*) from archana_items where ${itemsOf(GAN_ARGHYAM, VL_ARGHYAM)}`, 0);
await step('0018_arghyam_and_thread.sql', () => db.exec(sql(`${MIG}/0018_arghyam_and_thread.sql`)));
await assert('Ganesha arghyam is four numbered offerings',
  `select count(*) from archana_items where ${itemsOf(GAN_ARGHYAM)}`, 4);
await assert('Varalakshmi arghyam is one',
  `select count(*) from archana_items where ${itemsOf(VL_ARGHYAM)}`, 1);
// The pouring count lives in the refrain. A verse without one leaves the
// practitioner no way to know how many times to pour, which is the fault
// that was reported.
await assert('every arghyam line carries its idam-arghyam refrain, in all three scripts',
  `select count(*) from archana_items
    where ${itemsOf(GAN_ARGHYAM, VL_ARGHYAM)}
      and not (invoked_name_deva like '%इदमर्घ्यं%'
               and invoked_name_ta like '%இதமர்க்யம்%'
               and invoked_name_translit like '%idamarghyaṃ%')`, 0);
// Two lines per offering: the verse, then the refrain. If the newline were
// lost the two would render as one run-on sentence.
await assert('each offering is two lines',
  `select count(*) from archana_items
    where ${itemsOf(GAN_ARGHYAM, VL_ARGHYAM)}
      and invoked_name_deva not like '%' || chr(10) || '%'`, 0);
await assert('the old step-level mantra blob is gone from both',
  `select count(*) from pooja_steps
    where ((${GAN_ARGHYAM}) or (${VL_ARGHYAM})) and mantra_sanskrit is not null`, 0);
// 0009 wrote "sarva siddhi pradayaka" and "jyeshthasvamin ganeshvara"; the
// kalpam has "varaprada vinayaka" and "svami jyeshtha vinayaka".
await assert('the unsourced 0009 wording is gone',
  `select count(*) from archana_items where ${itemsOf(GAN_ARGHYAM)}
     and (invoked_name_translit like '%sarva siddhi pradāyaka%'
          or invoked_name_translit like '%jyeṣṭhasvāmin%')`, 0);
await assert('the pranava is written the same way as everywhere else',
  `select count(*) from archana_items where ${itemsOf(GAN_ARGHYAM, VL_ARGHYAM)}
     and invoked_name_deva like '%ओं %'`, 0);
await assert('the husband tying it with three knots is recorded',
  `select count(*) from pooja_steps where ${VL_THREAD}
     and instruction_en like '%husband%' and instruction_en like '%three knots%'
     and instruction_ta like '%கணவர்%'`, 1);
// Three knots of the tying next to nine knots of the thread reads as a
// contradiction unless the step says which is which.
await assert('and distinguished from the nine granthis worshipped just before',
  `select count(*) from pooja_steps where ${VL_THREAD}
     and instruction_en like '%nine granthis%'`, 1);
await assert('its source_ref admits the kalpam does not say it',
  `select count(*) from pooja_steps where ${VL_THREAD}
     and source_ref like '%NOT stated in the kalpam%'`, 1);

console.log('\n[9s] 0018 idempotency');
await step('0018 re-run', () => db.exec(sql(`${MIG}/0018_arghyam_and_thread.sql`)));
await assert('still four Ganesha offerings, not eight',
  `select count(*) from archana_items where ${itemsOf(GAN_ARGHYAM)}`, 4);
await assert('still 53 steps', 'select count(*) from pooja_steps', 53);

// --- 10. What is still missing -----------------------------------------------
console.log('\n[10] remaining content gaps');
for (const p of ['ganesha_standard', 'varalakshmi_vratham']) {
  const g = await one(`select
    count(*) as total,
    count(*) filter (where mantra_tamil   is null) as tamil,
    count(*) filter (where step_title_ta  is null) as title_ta,
    count(*) filter (where meaning_en     is null) as meaning,
    count(*) filter (where philosophy_en  is null) as philosophy
    from pooja_steps where pooja_id = '${p}'`);
  console.log(`  ${p}: of ${g.total} steps, missing mantra_tamil ${g.tamil}` +
    ` (steps whose content is a namavali or archana list have no mantra by design),` +
    ` step_title_ta ${g.title_ta}, meaning_en ${g.meaning}, philosophy_en ${g.philosophy}`);
}

console.log(`\n${failed ? 'RESULT: FAILURES ABOVE' : 'RESULT: all checks passed'}\n`);
await db.close();
process.exit(failed ? 1 : 0);
