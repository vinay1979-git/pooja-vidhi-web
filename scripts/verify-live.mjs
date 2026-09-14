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
console.log('\n[1] tables readable with the anon key');
const expected = {
  poojas: 1,
  pooja_steps: 18,
  samagri_items: 7,
  naivedyam_items: 2,
  archana_items: 20,
  deities: 1,
  upachara_templates: null,
  namavalis: null,
  media_assets: null,
  pooja_date_overrides: null,
};
for (const [t, want] of Object.entries(expected)) {
  const r = await rest(`${t}?select=*&limit=1`);
  const n = count(r);
  check(
    t.padEnd(22),
    r.ok && (want === null || String(n) === String(want)),
    `http ${r.status}, rows ${n}${want !== null ? ` (expect ${want})` : ''}`,
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
// foreign keys added in 0002 to resolve these nested selects.
console.log('\n[3] PostgREST resource embedding, as used by src/lib/queries.ts');

const poojaSel =
  'poojas?id=eq.ganesha_standard&select=' +
  encodeURIComponent(
    'id,title_en,title_ta,description_en,description_ta,duration_mins,ritual_class,deity_id,eligibility,' +
      'samagri_items(seq,item_en,item_ta,quantity,category,is_required),' +
      'naivedyam_items(tier,seq,name_en,name_ta,recipe_note,prohibition_basis,reason_en)',
  );
const p = await rest(poojaSel);
check('getPooja embed resolves', p.ok, `http ${p.status}`);
if (p.ok) {
  const row = JSON.parse(p.text)[0];
  check('  samagri_items embedded', Array.isArray(row?.samagri_items), `${row?.samagri_items?.length ?? 0} rows`);
  check('  naivedyam_items embedded', Array.isArray(row?.naivedyam_items), `${row?.naivedyam_items?.length ?? 0} rows`);
} else {
  console.log(`         ${p.text.slice(0, 200)}`);
}

const stepSel =
  'pooja_steps?pooja_id=eq.ganesha_standard&order=step_number.asc&select=' +
  encodeURIComponent(
    'id,pooja_id,step_number,phase,step_title_en,step_title_ta,instruction_en,instruction_ta,' +
      'mantra_sanskrit,mantra_tamil,mantra_translit,meaning_en,philosophy_en,philosophy_ta,' +
      'gender_rule,variant_mantra_sanskrit,variant_note_en,is_dynamic_sankalpam,' +
      'archana_items(seq,invoked_name_deva,invoked_name_ta,invoked_name_translit,offering_en,botanical,meaning_en)',
  );
const s = await rest(stepSel);
check('getSteps embed resolves', s.ok, `http ${s.status}`);
if (!s.ok) {
  console.log(`         ${s.text.slice(0, 200)}`);
} else {
  const rows = JSON.parse(s.text);
  check('  18 steps returned', rows.length === 18, `${rows.length}`);
  check(
    '  step numbers dense 1..18',
    rows.every((r, i) => r.step_number === i + 1),
    rows.map((r) => r.step_number).join(','),
  );
  const withArchana = rows.filter((r) => r.archana_items?.length);
  check('  archana embedded on one step', withArchana.length === 1,
    `${withArchana.length} step(s), ${withArchana[0]?.archana_items?.length ?? 0} items`);
  const pran = rows.find((r) => r.step_title_en === 'Pranayamam');
  check('  Pranayamam is filter_male_only', pran?.gender_rule === 'filter_male_only',
    String(pran?.gender_rule));

  // --- 0005 applied? --------------------------------------------------------
  console.log('\n[4] 0005 generated scripts');
  const missingTa = rows.filter((r) => r.mantra_sanskrit && !r.mantra_tamil).length;
  if (missingTa === rows.filter((r) => r.mantra_sanskrit).length) {
    console.log('  --    0005 not applied yet. Run supabase/migrations/0005_generate_scripts.sql');
  } else {
    check('mantra_tamil filled where Devanagari exists', missingTa === 0, `${missingTa} missing`);
    const tpl = rows.find((r) => r.is_dynamic_sankalpam);
    check('sankalpam placeholder intact',
      String(tpl?.mantra_tamil ?? '').includes('[DYNAMIC_PANCHANGAM_DATA]'));
  }

  console.log('\n[5] remaining content gaps');
  const gap = (f) => rows.filter((r) => !r[f]).length;
  for (const f of ['step_title_ta', 'instruction_ta', 'meaning_en', 'philosophy_en'])
    console.log(`  ${f.padEnd(16)} missing on ${gap(f)}/${rows.length}`);
}

console.log(`\n${failed ? 'RESULT: failures above' : 'RESULT: live schema matches what the app expects'}\n`);
process.exit(failed ? 1 : 0);
