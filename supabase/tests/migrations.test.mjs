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

// --- 10. What is still missing -----------------------------------------------
console.log('\n[10] remaining content gaps');
const gaps = await one(`select
  count(*) filter (where mantra_tamil   is null) as tamil,
  count(*) filter (where step_title_ta  is null) as title_ta,
  count(*) filter (where meaning_en     is null) as meaning,
  count(*) filter (where philosophy_en  is null) as philosophy
  from pooja_steps`);
console.log(`  missing mantra_tamil ${gaps.tamil}/18, step_title_ta ${gaps.title_ta}/18, meaning_en ${gaps.meaning}/18, philosophy_en ${gaps.philosophy}/18`);

console.log(`\n${failed ? 'RESULT: FAILURES ABOVE' : 'RESULT: all checks passed'}\n`);
await db.close();
process.exit(failed ? 1 : 0);
