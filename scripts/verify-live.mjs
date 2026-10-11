#!/usr/bin/env node
/**
 * Verify the live Supabase project against what the app expects.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * .env.local. The anon key is enough: it is the key that ships to the browser
 * anyway, and every content table has a public read policy.
 *
 * Deliberately does not need, want, or accept the service_role key. That key
 * bypasses row level security entirely and belongs only in the Supabase
 * dashboard and in Vercel's encrypted environment settings.
 *
 *   node scripts/verify-live.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));

let env;
try {
  env = Object.fromEntries(
    readFileSync(`${REPO}/.env.local`, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
} catch {
  console.error('No .env.local found. Copy .env.example and fill it in.');
  process.exit(1);
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_ || !KEY || /your-supabase|your-anon|YOUR_/.test(`${URL_}${KEY}`)) {
  console.error('.env.local still holds placeholder values. Fill in the real ones');
  console.error('from Supabase, under Project Settings -> API.');
  process.exit(1);
}
if (/service_role|eyJ.*service/.test(KEY)) {
  console.error('That looks like a service_role key. Use the anon (public) key.');
  process.exit(1);
}

let failed = false;
const rest = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' },
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, range: r.headers.get('content-range'), text };
};
const count = (r) => (r.range ? r.range.split('/')[1] : '?');

const check = (label, ok, detail = '') => {
  if (!ok) failed = true;
  console.log(`  ${ok ? 'ok   ' : 'FAIL '} ${label}${detail ? `  ${detail}` : ''}`);
};

// --- tables exist and are readable -------------------------------------------
// Presence, not exact counts. The counts this used to assert were the 18-step
// snapshot from before 0005, so every content migration since turned this
// script red without anything being wrong. Whether there are the RIGHT number of
// names, leaves and steps is a content question, and proofread.mjs answers it
// against the sources. This script answers the schema question: can the app
// read what it needs.
console.log('\n[1] tables readable with the anon key');
const MUST_HAVE_ROWS = [
  'poojas', 'pooja_steps', 'pooja_modes', 'samagri_items', 'naivedyam_items',
  'archana_items', 'deities', 'namavalis',
];
const MAY_BE_EMPTY = ['upachara_templates', 'media_assets', 'pooja_date_overrides'];
for (const t of [...MUST_HAVE_ROWS, ...MAY_BE_EMPTY]) {
  const r = await rest(`${t}?select=*&limit=1`);
  const n = count(r);
  check(
    t.padEnd(22),
    r.ok && (!MUST_HAVE_ROWS.includes(t) || Number(n) > 0),
    `http ${r.status}, rows ${n}${MUST_HAVE_ROWS.includes(t) ? ' (expect some)' : ''}`,
  );
}

// --- user_sessions must NOT be readable anonymously --------------------------
console.log('\n[2] user_sessions is private');
const sess = await rest('user_sessions?select=*&limit=1');
check(
  'anon cannot read other people\'s sessions',
  sess.ok ? count(sess) === '0' : true,
  `http ${sess.status}, rows ${count(sess)}`,
);

// --- the exact embedded selects queries.ts uses ------------------------------
// This is the part that cannot be tested offline: PostgREST has to detect the
// foreign keys to resolve these nested selects. Kept in step with the top rung
// (Tier.All) of POOJA_SELECT and STEPS_SELECT in src/lib/queries.ts -- if that
// rung fails here, the deployed app is running on a fallback rung.
console.log('\n[3] PostgREST resource embedding, as used by src/lib/queries.ts');

const POOJA_SELECT =
  'id,title_en,title_ta,description_en,description_ta,duration_mins,ritual_class,deity_id,eligibility,' +
  'status,karta_recommended,why_en,why_ta,' +
  'pooja_modes(mode,seq,label_en,label_ta,hint_en,hint_ta,from_hour),' +
  'samagri_items(seq,item_en,item_ta,quantity,category,is_required),' +
  'naivedyam_items(tier,seq,name_en,name_ta,recipe_note,recipe_note_ta,prohibition_basis,reason_en)';
const STEPS_SELECT =
  'id,pooja_id,step_number,phase,step_title_en,step_title_ta,instruction_en,instruction_ta,' +
  'mantra_sanskrit,mantra_tamil,mantra_translit,meaning_en,philosophy_en,philosophy_ta,' +
  'gender_rule,variant_mantra_sanskrit,variant_note_en,is_dynamic_sankalpam,modes,' +
  'archana_items(seq,invoked_name_deva,invoked_name_ta,invoked_name_translit,offering_deva,' +
  'offering_en,offering_ta,botanical,is_substitutable,substitute_with,meaning_en),' +
  'namavalis(id,namavali_items(seq,name_deva,name_ta,name_translit,meaning_en))';

const list = await rest('poojas?select=id,status&order=id');
check('poojas listable', list.ok, `http ${list.status}`);
const poojaRows = list.ok ? JSON.parse(list.text) : [];
const allSteps = [];

for (const { id, status } of poojaRows) {
  const published = status !== 'planned';
  console.log(`  -- ${id} (${published ? 'published' : 'planned'})`);

  const p = await rest(`poojas?id=eq.${id}&select=${encodeURIComponent(POOJA_SELECT)}`);
  check('getPooja embed resolves', p.ok, `http ${p.status}`);
  if (!p.ok) { console.log(`         ${p.text.slice(0, 200)}`); continue; }
  const row = JSON.parse(p.text)[0];

  const s = await rest(
    `pooja_steps?pooja_id=eq.${id}&order=step_number.asc&select=${encodeURIComponent(STEPS_SELECT)}`,
  );
  check('getSteps embed resolves', s.ok, `http ${s.status}`);
  if (!s.ok) { console.log(`         ${s.text.slice(0, 200)}`); continue; }
  const rows = JSON.parse(s.text);
  allSteps.push(...rows);

  if (!published) {
    // A planned rite is a catalogue card and nothing more. Steps under it would
    // be content the app refuses to show (see app/pooja/[id]/page.tsx).
    check('no steps yet', rows.length === 0, `${rows.length}`);
    continue;
  }

  check('has steps', rows.length > 0, `${rows.length}`);
  check(
    `step numbers dense 1..${rows.length}`,
    rows.every((r, i) => r.step_number === i + 1),
    rows.every((r, i) => r.step_number === i + 1) ? '' : rows.map((r) => r.step_number).join(','),
  );
  check('samagri embedded', (row?.samagri_items?.length ?? 0) > 0, `${row?.samagri_items?.length ?? 0} rows`);

  // A step claiming a mode the pooja does not declare is a step no picker
  // button can ever reach. 0047 asserts this at write time; this catches drift.
  const declared = new Set((row?.pooja_modes ?? []).map((m) => m.mode));
  if (declared.size) {
    const stray = rows.flatMap((r) => (r.modes ?? []).filter((m) => !declared.has(m)));
    check('every claimed mode is declared', stray.length === 0, stray.length ? [...new Set(stray)].join(',') : '');
  }
}

if (allSteps.length) {
  const withList = allSteps.filter((r) => r.archana_items?.length || r.namavalis?.namavali_items?.length);
  check('archana or namavali embedded somewhere', withList.length > 0, `${withList.length} step(s)`);

  // The original guard: 0003 mapping gender_target 'male' onto
  // filter_male_only rather than a variant. Ganesha is the rite it was found on.
  const pran = allSteps.find((r) => r.pooja_id === 'ganesha_standard' && r.step_title_en === 'Pranayamam');
  check('ganesha Pranayamam is filter_male_only', pran?.gender_rule === 'filter_male_only',
    String(pran?.gender_rule));

  // --- generated scripts --------------------------------------------------
  console.log('\n[4] generated scripts');
  const missingTa = allSteps.filter((r) => r.mantra_sanskrit && !r.mantra_tamil).length;
  check('mantra_tamil filled where Devanagari exists', missingTa === 0, `${missingTa} missing`);
  for (const r of allSteps.filter((r) => r.is_dynamic_sankalpam)) {
    check(`${r.pooja_id} #${r.step_number} sankalpam placeholder intact`,
      ['mantra_sanskrit', 'mantra_tamil'].every((f) =>
        String(r[f] ?? '').includes('[DYNAMIC_PANCHANGAM_DATA]')));
  }

  console.log('\n[5] remaining content gaps');
  const gap = (f) => allSteps.filter((r) => !r[f]).length;
  for (const f of ['step_title_ta', 'instruction_ta', 'meaning_en', 'philosophy_en'])
    console.log(`  ${f.padEnd(16)} missing on ${gap(f)}/${allSteps.length}`);
}

console.log(`\n${failed ? 'RESULT: failures above' : 'RESULT: live schema matches what the app expects'}\n`);
process.exit(failed ? 1 : 0);
