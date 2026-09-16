#!/usr/bin/env node
/**
 * Reads the LIVE database and checks every piece of content a user will see.
 *
 *   node scripts/proofread.mjs
 *
 * This is the pre-beta gate. It catches the classes of fault that have actually
 * occurred in this project rather than a generic lint:
 *
 *   - text in the wrong script (a Bengali "pu" inside a Devanagari mantra sat
 *     in production for weeks)
 *   - truncation left in the data (the Anga Pooja mantra ended in a literal
 *     "...")
 *   - Tamil carrying the Grantha voicing superscripts the user rejected
 *   - a field that is null where the screen expects text
 *   - two steps sharing prose that should be distinct
 *   - counts that do not match what the sources say they should be
 *
 * Exits non-zero if anything is wrong, so it can gate a deploy.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { readFileSync } = require('node:fs');

// .env.local, without pulling in a dependency.
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] ??= m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const get = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

// --- script ranges ----------------------------------------------------------
// The danda and double danda live in the Devanagari block but are shared
// punctuation: the published Tamil and IAST pages this project draws from use
// them too, and the generators preserve them deliberately. They are not
// evidence of Devanagari leaking into a Tamil field.
const DANDA = /[।॥]/g;
const DEVA = /[ऀ-ॣ०-ॿ]/;
const TAMIL = /[஀-௿]/;
const TELUGU = /[ఀ-౿]/;
const BENGALI = /[ঀ-৿]/;
const KANNADA = /[ಀ-೿]/;
const MALAYALAM = /[ഀ-ൿ]/;
const GUJARATI = /[઀-૿]/;
const GURMUKHI = /[਀-੿]/;
const ORIYA = /[଀-୿]/;
const SUPERSCRIPT = /[⁰¹²³⁴-⁹]/;
const LATIN = /[A-Za-z]/;

const STRAY = [
  ['Bengali', BENGALI], ['Kannada', KANNADA], ['Malayalam', MALAYALAM],
  ['Gujarati', GUJARATI], ['Gurmukhi', GURMUKHI], ['Oriya', ORIYA], ['Telugu', TELUGU],
];

const problems = [];
const warnings = [];
const fail = (where, what) => problems.push(`${where}: ${what}`);
const warn = (where, what) => warnings.push(`${where}: ${what}`);

/** Any Indic script that is not the one this field is supposed to be in. */
function strayScript(where, text, allow) {
  for (const [name, re] of STRAY) {
    if (name === allow) continue;
    if (re.test(text)) fail(where, `contains ${name} characters: ${text.match(re)[0]}`);
  }
}

function checkDeva(where, text) {
  if (!DEVA.test(text)) fail(where, 'is supposed to be Devanagari but has none');
  if (TAMIL.test(text)) fail(where, 'Devanagari field contains Tamil');
  strayScript(where, text, null);
  if (LATIN.test(text.replace(/\[[A-Z0-9_]+\]/g, ''))) {
    fail(where, `Devanagari field contains Latin letters: ${text.replace(/\[[A-Z0-9_]+\]/g, '').match(/[A-Za-z]+/)[0]}`);
  }
}

function checkTamil(where, text) {
  if (!TAMIL.test(text)) fail(where, 'is supposed to be Tamil but has none');
  if (DEVA.test(text.replace(DANDA, ' '))) fail(where, 'Tamil field contains Devanagari');
  strayScript(where, text, null);
  if (SUPERSCRIPT.test(text)) fail(where, 'Tamil carries Grantha voicing superscripts');
  if (/ௐ/.test(text)) fail(where, 'Tamil uses the om sign rather than ஓம்');
}

function checkTranslit(where, text) {
  const t = text.replace(DANDA, ' ');
  if (DEVA.test(t) || TAMIL.test(t)) fail(where, 'transliteration contains Indic script');
  if (!LATIN.test(t)) fail(where, 'transliteration has no Latin letters');
}

function checkProse(where, text, lang) {
  if (/\.\.\.|…/.test(text)) {
    // The Sankalpam legitimately brackets its dynamic slot with ellipses.
    if (!text.includes('[DYNAMIC_PANCHANGAM_DATA]')) fail(where, 'contains an ellipsis, which has meant truncation here before');
  }
  if (/\bTBD\b|\bTODO\b|\bXXX\b|\bplaceholder\b|\blorem\b/i.test(text)) fail(where, 'contains placeholder text');
  if (/\s{2,}/.test(text)) warn(where, 'has a double space');
  // The Sankalpam brackets its dynamic slot as "... [TOKEN] ...", so the space
  // before those dots is deliberate.
  if (/\s+[.,;]/.test(text.replace(/\.\.\.\s*\[[A-Z0-9_]+\]\s*\.\.\./g, ' '))) {
    warn(where, 'has a space before punctuation');
  }
  if (text !== text.trim()) fail(where, 'has leading or trailing whitespace');
  if (lang === 'ta') {
    if (!TAMIL.test(text)) fail(where, 'Tamil prose has no Tamil');
    strayScript(where, text, null);
  }
  if (lang === 'en') {
    if (DEVA.test(text) || TAMIL.test(text)) warn(where, 'English prose contains Indic script');
  }
}

// ---------------------------------------------------------------------------
const steps = await get('pooja_steps?select=*&order=pooja_id,step_number');
const poojas = await get('poojas?select=*');
const samagri = await get('samagri_items?select=*&order=pooja_id,seq');
const naivedyam = await get('naivedyam_items?select=*&order=pooja_id,tier,seq');
const archana = await get('archana_items?select=*,pooja_steps(pooja_id,step_title_en)&order=seq');
const namavali = await get('namavali_items?select=*&order=namavali_id,seq');
const deities = await get('deities?select=*');

console.log(`poojas ${poojas.length}, steps ${steps.length}, samagri ${samagri.length}, naivedyam ${naivedyam.length}, archana ${archana.length}, namavali ${namavali.length}, deities ${deities.length}\n`);

// --- steps ------------------------------------------------------------------
for (const s of steps) {
  const at = `${s.pooja_id} step ${s.step_number} "${s.step_title_en}"`;
  for (const f of ['step_title_en', 'step_title_ta', 'instruction_en', 'instruction_ta', 'meaning_en', 'philosophy_en']) {
    if (!s[f] || !String(s[f]).trim()) fail(at, `${f} is empty`);
  }
  if (s.step_title_ta) checkTamil(`${at}.step_title_ta`, s.step_title_ta);
  if (s.instruction_en) checkProse(`${at}.instruction_en`, s.instruction_en, 'en');
  if (s.instruction_ta) checkProse(`${at}.instruction_ta`, s.instruction_ta, 'ta');
  if (s.meaning_en) checkProse(`${at}.meaning_en`, s.meaning_en, 'en');
  if (s.philosophy_en) checkProse(`${at}.philosophy_en`, s.philosophy_en, 'en');

  // A step either has all three scripts or none. Half a mantra is the bug that
  // made the language toggle look broken.
  const have = ['mantra_sanskrit', 'mantra_tamil', 'mantra_translit'].filter((f) => s[f]);
  if (have.length && have.length !== 3) {
    fail(at, `has ${have.join(', ')} but not the other ${3 - have.length}`);
  }
  if (s.mantra_sanskrit) {
    checkDeva(`${at}.mantra_sanskrit`, s.mantra_sanskrit);
    checkProse(`${at}.mantra_sanskrit`, s.mantra_sanskrit, null);
    checkTamil(`${at}.mantra_tamil`, s.mantra_tamil);
    checkTranslit(`${at}.mantra_translit`, s.mantra_translit);
  }
  if (!s.modes?.length) fail(at, 'has no modes');
  if (!s.source_ref) warn(at, 'has no source_ref');
}

// Step numbers dense and unique per pooja.
for (const p of poojas) {
  const mine = steps.filter((s) => s.pooja_id === p.id).map((s) => s.step_number).sort((a, b) => a - b);
  mine.forEach((n, i) => { if (n !== i + 1) fail(p.id, `step numbers are not 1..n: expected ${i + 1}, got ${n}`); });
  if (!mine.length) fail(p.id, 'has no steps');
  // Every pooja must be walkable in each mode it claims.
  for (const mode of ['main', 'punar', 'udvasana']) {
    const n = steps.filter((s) => s.pooja_id === p.id && s.modes?.includes(mode)).length;
    if (n === 0) fail(p.id, `mode "${mode}" has no steps`);
    if (n === 1) warn(p.id, `mode "${mode}" has only one step`);
  }
}

// --- prose that should not be shared ----------------------------------------
// The six purvangam steps are copied between poojas on purpose. Anything else
// sharing an instruction or a philosophy is likely a copy-paste slip.
const SHARED_OK = new Set(['Achamanam', 'Anga Vandanam', 'Vighneshwara Dhyanam', 'Pranayamam', 'Kalasha Pooja', 'Ghanta Pooja']);
for (const field of ['instruction_en', 'meaning_en', 'philosophy_en']) {
  const seen = new Map();
  for (const s of steps) {
    const v = s[field];
    if (!v) continue;
    const prev = seen.get(v);
    if (prev && !(SHARED_OK.has(s.step_title_en) && SHARED_OK.has(prev.step_title_en))) {
      warn(`${field}`, `identical text on "${prev.pooja_id}/${prev.step_title_en}" and "${s.pooja_id}/${s.step_title_en}"`);
    }
    seen.set(v, s);
  }
}

// --- archana ----------------------------------------------------------------
const byStep = new Map();
for (const a of archana) {
  const k = `${a.pooja_steps?.pooja_id}/${a.pooja_steps?.step_title_en}`;
  byStep.set(k, (byStep.get(k) ?? 0) + 1);
  const at = `${k} archana ${a.seq}`;
  if (!a.invoked_name_deva) fail(at, 'has no name');
  else {
    checkDeva(`${at}.invoked_name_deva`, a.invoked_name_deva);
    if (a.invoked_name_ta) checkTamil(`${at}.invoked_name_ta`, a.invoked_name_ta);
    else fail(at, 'has no Tamil name');
    if (a.invoked_name_translit) checkTranslit(`${at}.invoked_name_translit`, a.invoked_name_translit);
    else fail(at, 'has no transliteration');
  }
  if (a.offering_en && !LATIN.test(a.offering_en)) fail(at, 'offering_en is not English');
  if (a.offering_ta && !TAMIL.test(a.offering_ta)) fail(at, 'offering_ta is not Tamil');
  if (a.is_substitutable && !a.substitute_with) fail(at, 'is substitutable but names no substitute');
}
console.log('archana rows per step:');
for (const [k, n] of [...byStep].sort()) console.log(`  ${String(n).padStart(4)}  ${k}`);

const EXPECT_ARCHANA = {
  'ganesha_standard/Anga Pooja': 29,
  'ganesha_standard/Patra Pooja (21 Leaves)': 21,
  'ganesha_standard/Pushpa Pooja (21 Flowers)': 21,
  'ganesha_standard/Durva Pooja (21 Names)': 21,
  'varalakshmi_vratham/Anga Pooja': 15,
  'varalakshmi_vratham/Nonbu Sharadu Pooja': 9,
};
for (const [k, n] of Object.entries(EXPECT_ARCHANA)) {
  if ((byStep.get(k) ?? 0) !== n) fail(k, `has ${byStep.get(k) ?? 0} archana rows, expected ${n}`);
}
for (const k of byStep.keys()) if (!(k in EXPECT_ARCHANA)) warn(k, 'has archana rows but is not in the expected list');

// A step that carries an archana list must have seq 1..n with no gaps.
for (const [k, n] of byStep) {
  const seqs = archana.filter((a) => `${a.pooja_steps?.pooja_id}/${a.pooja_steps?.step_title_en}` === k)
    .map((a) => a.seq).sort((a, b) => a - b);
  seqs.forEach((v, i) => { if (v !== i + 1) fail(k, `archana seq is not 1..${n}: expected ${i + 1}, got ${v}`); });
}

// --- namavali ---------------------------------------------------------------
const nvCount = new Map();
for (const n of namavali) {
  nvCount.set(n.namavali_id, (nvCount.get(n.namavali_id) ?? 0) + 1);
  const at = `${n.namavali_id} ${n.seq}`;
  checkDeva(`${at}.name_deva`, n.name_deva);
  if (n.name_ta) checkTamil(`${at}.name_ta`, n.name_ta); else fail(at, 'has no Tamil');
  if (n.name_translit) checkTranslit(`${at}.name_translit`, n.name_translit); else fail(at, 'has no transliteration');
}
for (const [id, n] of nvCount) {
  if (n !== 108) fail(id, `has ${n} names, expected 108`);
  const seqs = namavali.filter((x) => x.namavali_id === id).map((x) => x.seq).sort((a, b) => a - b);
  seqs.forEach((v, i) => { if (v !== i + 1) fail(id, `seq is not 1..108: expected ${i + 1}, got ${v}`); });
  const dupes = new Set();
  const seen = new Set();
  for (const x of namavali.filter((y) => y.namavali_id === id)) {
    if (seen.has(x.name_deva)) dupes.add(x.name_deva);
    seen.add(x.name_deva);
  }
  // Repeated names are not automatically a parse fault. The Lakshmi recension
  // genuinely repeats diptayai and devyai, and both the Devanagari and the IAST
  // page published by StotraNidhi repeat them at the same positions. Checked,
  // so this notes rather than warns; a NEW repeat is still worth seeing.
  const KNOWN_REPEATS = { lakshmi_ashtottara_108: 2 };
  if (dupes.size && dupes.size !== KNOWN_REPEATS[id]) {
    warn(id, `${dupes.size} repeated names, expected ${KNOWN_REPEATS[id] ?? 0}: ${[...dupes].slice(0, 3).join(', ')}`);
  } else if (dupes.size) {
    console.log(`  note  ${id} repeats ${dupes.size} names, matching the published source`);
  }
}
// Every step pointing at a namavali must point at one that exists.
for (const s of steps.filter((x) => x.namavali_id)) {
  if (!nvCount.has(s.namavali_id)) fail(`${s.pooja_id}/${s.step_title_en}`, `namavali_id "${s.namavali_id}" has no items`);
}

// --- prep items -------------------------------------------------------------
for (const p of poojas) {
  const sm = samagri.filter((x) => x.pooja_id === p.id);
  const nv = naivedyam.filter((x) => x.pooja_id === p.id);
  if (!sm.length) fail(p.id, 'has no samagri');
  if (!nv.length) fail(p.id, 'has no naivedyam');
  if (!nv.some((x) => x.tier === 'primary')) fail(p.id, 'has no primary naivedyam');
}
for (const x of samagri) {
  const at = `${x.pooja_id} samagri ${x.seq}`;
  if (!x.item_en) fail(at, 'has no English name');
  if (!x.item_ta) fail(at, 'has no Tamil name');
  else checkTamil(`${at}.item_ta`, x.item_ta);
  if (x.is_substitutable && !x.substitute_with) fail(at, 'is substitutable but names no substitute');
}
for (const x of naivedyam) {
  const at = `${x.pooja_id} naivedyam ${x.tier} ${x.seq}`;
  if (!x.name_en) fail(at, 'has no English name');
  if (!x.name_ta) fail(at, 'has no Tamil name');
  else checkTamil(`${at}.name_ta`, x.name_ta);
}

// --- poojas and deities -----------------------------------------------------
for (const p of poojas) {
  for (const f of ['title_en', 'title_ta']) if (!p[f]) fail(p.id, `${f} is empty`);
  if (p.title_ta) checkTamil(`${p.id}.title_ta`, p.title_ta);
  if (!p.deity_id) fail(p.id, 'has no deity');
  else if (!deities.some((d) => d.id === p.deity_id)) fail(p.id, `deity "${p.deity_id}" does not exist`);
  if (!p.rule_type) warn(p.id, 'has no calendar rule');
  if (!p.description_en) warn(p.id, 'has no description_en');
}
for (const d of deities) {
  if (d.name_ta) checkTamil(`deity ${d.id}.name_ta`, d.name_ta);
  if (d.name_deva) checkDeva(`deity ${d.id}.name_deva`, d.name_deva);
  if (d.name_dative_deva) checkDeva(`deity ${d.id}.name_dative_deva`, d.name_dative_deva);
}

// ---------------------------------------------------------------------------
console.log();
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log('  ~ ' + w));
  console.log();
}
if (problems.length) {
  console.log(`${problems.length} PROBLEM(s):`);
  problems.forEach((p) => console.log('  X ' + p));
  console.log('\nRESULT: not ready');
  process.exit(1);
}
console.log('RESULT: no problems found');
