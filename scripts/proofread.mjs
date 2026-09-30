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
// Devanagari proper AND Devanagari Extended (U+A8E0-U+A8FF), which is where the
// Vedic accent marks and the Yajurveda gm nasal live.
//
// The narrow range missed the gm sign. Transliterating the Sandhyavandanam
// vyahritis produced Tamil reading `ஓꣳ ஸுவ꞉` -- a raw Devanagari codepoint
// sitting inside a Tamil string, which is the avagraha, the om sign and the
// visarga all over again, and this gate would have waved it through.
const DEVA = /[ऀ-ॣ०-ॿ꣠-ꣿ]/;
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

/**
 * Steps whose text carries ellipses ON PURPOSE.
 *
 * The gate exists because an ellipsis has three times meant a mantra that was
 * cut short. But the Abhivadanam is PRINTED with blanks -- the book sets the
 * sutra and the shakha in type and leaves dotted rules for the pravaras, the
 * gotra and the name, because the reciter knows their own -- and the Samarpanam
 * abbreviates it the same way. Declared by name rather than by pattern, so a
 * genuinely truncated mantra somewhere else still fails.
 */
const ELLIPSIS_IS_DELIBERATE = new Set([
  'sandhyavandanam/Abhivadanam',
  'sandhyavandanam/Samarpanam',
]);

function checkProse(where, text, lang) {
  if (/\.\.\.|…/.test(text)) {
    // The Sankalpam legitimately brackets its dynamic slot with ellipses.
    if (!text.includes('[DYNAMIC_PANCHANGAM_DATA]')) fail(where, 'contains an ellipsis, which has meant truncation here before');
  }
  if (/\bTBD\b|\bTODO\b|\bXXX\b|\bplaceholder\b|\blorem\b/i.test(text)) fail(where, 'contains placeholder text');
  // Name carriage returns specifically. Reported as "a double space" they read
  // as cosmetic and were nearly dismissed; they were actually git's autocrlf
  // writing CRLF into the migration files and so into the database.
  if (text.includes('\r')) fail(where, 'contains a carriage return');
  if (/[ \t]{2,}/.test(text)) warn(where, 'has a double space');
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
// Arrives with 0047. Absent before it, which is not a fault -- the checks below
// degrade to nothing rather than failing a database that has not been migrated.
const poojaModes = await get('pooja_modes?select=*&order=pooja_id,seq').catch(() => []);

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
    if (!ELLIPSIS_IS_DELIBERATE.has(`${s.pooja_id}/${s.step_title_en}`)) {
      checkProse(`${at}.mantra_sanskrit`, s.mantra_sanskrit, null);
    }
    checkTamil(`${at}.mantra_tamil`, s.mantra_tamil);
    checkTranslit(`${at}.mantra_translit`, s.mantra_translit);
  }
  if (!s.modes?.length) fail(at, 'has no modes');
  if (!s.source_ref) warn(at, 'has no source_ref');
}

/**
 * A rite that is listed but not written yet.
 *
 * 0043 put four nitya karmas on the shelf ahead of their transcription so the
 * section would not claim there is one daily rite. Checking them for steps,
 * samagri, naivedyam and a deity reports ten faults that are all the same fact
 * -- it has not been written -- and a checker that reports ten faults for one
 * known absence is the kind this project deletes.
 *
 * So the CONTENT checks skip them, and the checks that still mean something do
 * not: a placeholder must still carry both titles, well-formed Tamil and a
 * description, because those are what the catalogue card shows.
 */
const isPlanned = (p) => p.status === 'planned';

// Step numbers dense and unique per pooja.
for (const p of poojas) {
  const mine = steps.filter((s) => s.pooja_id === p.id).map((s) => s.step_number).sort((a, b) => a - b);
  mine.forEach((n, i) => { if (n !== i + 1) fail(p.id, `step numbers are not 1..n: expected ${i + 1}, got ${n}`); });
  // Both directions. A planned rite must have NO steps -- if it has some, the
  // catalogue is hiding something that is ready, which is the opposite fault
  // and the one nobody would notice.
  if (isPlanned(p)) {
    if (mine.length) fail(p.id, `is marked planned but has ${mine.length} step(s); publish it`);
    continue;
  }
  if (!mine.length) fail(p.id, 'has no steps');
  // Every pooja must be walkable in each mode IT CLAIMS -- not in a fixed list.
  //
  // This used to require punar and udvasana of every pooja, which is wrong for a
  // nitya rite: it is performed every morning, so there is no second day to
  // return for and no image to release. Demanding those modes of it would have
  // forced empty steps into the data to satisfy a checker.
  //
  // A pooja nobody can walk once is not a pooja, so SOME mode must be walkable.
  // It used to be 'main' specifically, seeded unconditionally -- fine while every
  // rite in the app used that word. Sandhyavandanam's modes are pratah,
  // madhyahnika and sayam, so demanding 'main' of it reported a mode with no
  // steps when the truth was a mode that does not exist. Derive the set from
  // what the steps claim, and require only that it is not empty.
  const claimed = new Set();
  for (const s of steps) {
    if (s.pooja_id === p.id) for (const m of s.modes ?? []) claimed.add(m);
  }
  if (!claimed.size) fail(p.id, 'no step claims any mode, so the pooja cannot be walked');
  for (const mode of claimed) {
    const n = steps.filter((s) => s.pooja_id === p.id && s.modes?.includes(mode)).length;
    if (n === 0) fail(p.id, `mode "${mode}" has no steps`);
    if (n === 1) warn(p.id, `mode "${mode}" has only one step`);
  }
}

// --- prose that should not be shared ----------------------------------------
// The six purvangam steps are copied between poojas on purpose. Anything else
// sharing an instruction or a philosophy is likely a copy-paste slip.
// Steps that are deliberately the SAME text in more than one pooja. The book
// works this way too: its Nitya section lists the shared opening as page
// references into the Purvanga rather than reprinting it, and 0037 copies these
// from the Ganesha pooja for exactly that reason. Identical text here is the
// design, not a smell -- and a warning that fires fifteen times on purpose is a
// warning nobody reads.
const SHARED_OK = new Set([
  'Achamanam', 'Anga Vandanam', 'Vighneshwara Dhyanam', 'Pranayamam',
  'Kalasha Pooja', 'Ghanta Pooja',
  'Asana Pooja', 'Shankha Pooja', 'Atma Pooja', 'Peetha Pooja', 'Guru Dhyanam',
]);
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
  // The sixteen names of the preliminary Vighneshwara pooja, added in 0025.
  // The obstacle-removing rite has its own archana, distinct from the main
  // pooja's Anga, Patra, Pushpa and Durva lists.
  'ganesha_standard/Vighneshwara Shodasha Nama Archana': 16,
  // Twenty-four, not fifteen, since 0032. The app followed StotraNidhi's
  // fifteen-limb anga pooja; the owner chose to follow the book, whose list is
  // twenty-four limbs sharing almost no names with the other. Changing this
  // number is the whole point of that migration, so it is not a drift to guard
  // against -- but it IS the kind of number that silently disagrees with the
  // database after a recension change, which is why it is asserted at all.
  'varalakshmi_vratham/Anga Pooja': 24,
  'varalakshmi_vratham/Nonbu Sharadu Pooja': 9,
  // Not a namavali: the arghyam verses, each with its pouring refrain, moved
  // into archana_items in 0018 so the screen can number them and be ticked
  // off. Four for Ganesha, from the kalpam's punararghyam; one for Varalakshmi.
  'ganesha_standard/Ksheera Arghyam': 4,
  'varalakshmi_vratham/Ksheera Arghyam': 1,
  // The daily rite worships five deities, so it has five archanas rather than
  // one, each with its own flower. The Vishnu list is twenty-four counted names:
  // the book prints a twenty-fifth, hayagreevaaya, in brackets and does not
  // count it, the same convention as the two bracketed names in the Lakshmi 108.
  'nitya_panchayatana/Archana — Vinayaka': 16,
  'nitya_panchayatana/Archana — Surya': 12,
  'nitya_panchayatana/Archana — Vishnu': 24,
  'nitya_panchayatana/Archana — Shiva': 8,
  'nitya_panchayatana/Archana — Devi': 8,
  'nitya_panchayatana/Deva Tarpanam': 17,
};
// A TITLE is a few words. A mantra has dandas and runs to hundreds of
// characters. 0025 put the Tamil mantra into step_title_ta on twelve steps and
// every existing gate passed it: a Tamil mantra is well-formed Tamil, is not
// null and is not truncated. They were all checking the value and none was
// checking what kind of value it was.
for (const s of steps) {
  for (const k of ['step_title_en', 'step_title_ta']) {
    const v = s[k];
    if (!v) continue;
    if (v.length > 60 || /[।॥\n]/.test(v)) {
      fail(`${s.pooja_id} step ${s.step_number} "${s.step_title_en}"`,
           `${k} looks like mantra text, not a title`);
    }
  }
}

for (const [k, n] of Object.entries(EXPECT_ARCHANA)) {
  if ((byStep.get(k) ?? 0) !== n) fail(k, `has ${byStep.get(k) ?? 0} archana rows, expected ${n}`);
}

// A step's PROSE has to agree with the step's DATA.
//
// 0032 replaced Varalakshmi's fifteen-limb anga pooja with the book's twenty-four
// and updated the instruction, but left meaning_en saying "Fourteen names ... and
// a fifteenth for the whole body", naming limbs that had just been deleted. The
// screen showed twenty-four offerings under a paragraph describing fifteen other
// ones, and every existing check passed it: meaning_en was not null, not
// truncated, and well-formed English. It surfaced only by opening the step in a
// browser and reading it.
//
// A GENERAL version of this check was tried first -- find any spelled-out number
// in the prose and compare it with the row count -- and it was abandoned because
// it fired on four pieces of perfectly good writing: "Nine of them are on the
// samagri list", "fifteen names more", "twelve pourings in all", and the ordinal
// "a twenty-fourth for the whole body". Four false alarms to catch one fault is
// how a gate gets ignored.
//
// So the count is declared instead, per step, next to the row count it has to
// agree with. Explicit, and it would have caught the fault: the meaning said
// "Fourteen" when this table says twenty-four.
// An ASCII colon has no business in a Devanagari, Tamil or IAST field.
//
// namaHa was transcribed as नम: with an ASCII colon (U+003A) instead of the
// visarga (U+0903), eighty-six times across nineteen page transcripts. Sanscript
// cannot see an ASCII colon as a letter, so it passed straight through into BOTH
// generated scripts, and the app showed Tamil lines ending in a colon that
// belongs to neither script.
//
// checkScripts did not catch it because it asks whether a Tamil string is
// well-formed Tamil, and a colon is punctuation rather than not-Tamil. The same
// blind spot as the mantra-shaped titles: the check looked at whether the value
// was well formed, not at whether every character in it belonged there.
//
// The visarga is U+0903 in Devanagari, U+A789 in Tamil and U+1E25 in roman.
// None of them is U+003A.
for (const s of steps) {
  for (const f of ['mantra_sanskrit', 'mantra_tamil', 'mantra_translit']) {
    if ((s[f] || '').includes(':')) {
      fail(`${s.pooja_id} step ${s.step_number} "${s.step_title_en}"`,
           `${f} contains an ASCII colon; the visarga is not a colon`);
    }
  }
}
for (const a of archana) {
  const at = a.pooja_steps
    ? `${a.pooja_steps.pooja_id}/${a.pooja_steps.step_title_en} #${a.seq}`
    : `archana row ${a.seq}`;
  for (const f of ['invoked_name_deva', 'invoked_name_ta', 'invoked_name_translit',
                   'offering_deva', 'offering_ta']) {
    if ((a[f] || '').includes(':')) {
      fail(at, `${f} contains an ASCII colon; the visarga is not a colon`);
    }
  }
}

// The app says karta. "The performer" was a translation of a word the reader
// already has -- the sankalpam they recite names them the karta -- and it made
// the prose describe the rite from outside it. 0042 replaced the eight
// mentions; this keeps them from coming back one meaning_en at a time.
//
// The word boundary matters. Two steps say a household vidhi "expects to be
// performed by real households", which is the ordinary verb and must survive.
for (const s of steps) {
  for (const f of ['instruction_en', 'meaning_en', 'philosophy_en']) {
    if (/\bperformers?\b/i.test(s[f] || '')) {
      fail(`${s.pooja_id} step ${s.step_number} "${s.step_title_en}"`,
           `${f} says "performer"; this project says karta`);
    }
  }
}

const EXPECT_PROSE_COUNT = {
  'ganesha_standard/Anga Pooja': 'twenty-nine',
  'ganesha_standard/Patra Pooja (21 Leaves)': 'twenty-one',
  'ganesha_standard/Pushpa Pooja (21 Flowers)': 'twenty-one',
  'ganesha_standard/Durva Pooja (21 Names)': 'twenty-one',
  'ganesha_standard/Vighneshwara Shodasha Nama Archana': 'sixteen',
  'varalakshmi_vratham/Anga Pooja': 'twenty-four',
  'varalakshmi_vratham/Nonbu Sharadu Pooja': 'nine',
  // null means "this step's prose deliberately does not count its rows". Both
  // arghyam steps hold verses rather than a namavali, and their prose counts
  // POURINGS: Ganesha's four verses make "twelve pourings in all", Varalakshmi's
  // one verse is offered "three times". Declaring the exemption is better than
  // leaving a standing warning nobody reads.
  'ganesha_standard/Ksheera Arghyam': null,
  'varalakshmi_vratham/Ksheera Arghyam': null,
  'nitya_panchayatana/Archana — Vinayaka': 'sixteen',
  'nitya_panchayatana/Archana — Surya': 'twelve',
  'nitya_panchayatana/Archana — Vishnu': 'twenty-four',
  'nitya_panchayatana/Archana — Shiva': 'eight',
  'nitya_panchayatana/Archana — Devi': 'eight',
  // The tarpanam's prose counts 8 + 8 + 1 rather than 17, and says so in the
  // philosophy: "Seventeen offerings, not sixteen".
  'nitya_panchayatana/Deva Tarpanam': 'seventeen',
};
for (const s of steps) {
  const key = `${s.pooja_id}/${s.step_title_en}`;
  if (!(key in EXPECT_PROSE_COUNT)) continue;
  const word = EXPECT_PROSE_COUNT[key];
  if (word === null) continue;   // declared exempt, see the table
  const prose = [s.instruction_en, s.meaning_en, s.philosophy_en].filter(Boolean).join(' ');
  if (!prose) continue;
  if (!new RegExp(`\\b${word}\\b`, 'i').test(prose)) {
    fail(key, `has ${byStep.get(key) ?? 0} archana rows but its prose never says "${word}"`);
  }
}
for (const k of byStep.keys()) {
  if (k in EXPECT_ARCHANA && !(k in EXPECT_PROSE_COUNT)) {
    fail(k, 'has archana rows but no declared prose count (add it, or declare null)');
  }
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
  if (isPlanned(p)) continue;
  const sm = samagri.filter((x) => x.pooja_id === p.id);
  const nv = naivedyam.filter((x) => x.pooja_id === p.id);
  if (!sm.length) fail(p.id, 'has no samagri');
  // NAIVEDYAM IS REQUIRED ONLY BY RITES THAT MAKE ONE.
  //
  // It used to be demanded of every pooja, which was true of all three the app
  // had: each offers food and each has a Naivedyam step. Sandhyavandanam offers
  // water and nothing else -- there is no naivedyam anywhere in its
  // forty-five steps -- so the blanket rule reported three faults for a rite
  // that is complete.
  //
  // Tied to the rite's own content instead: if it has a step that offers
  // naivedyam, it must have something to offer.
  const offersFood = steps.some(
    (x) => x.pooja_id === p.id && /naivedyam/i.test(x.step_title_en ?? ''),
  );
  if (offersFood) {
    if (!nv.length) fail(p.id, 'has a Naivedyam step but nothing to offer');
    else if (!nv.some((x) => x.tier === 'primary')) fail(p.id, 'has no primary naivedyam');
  } else if (nv.length) {
    fail(p.id, `has ${nv.length} naivedyam item(s) but no step that offers them`);
  }
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

// --- modes ------------------------------------------------------------------
//
// The invariant 0047 exists to protect, checked here too because a migration
// after it could break either half without anything noticing:
//
//   a mode a STEP claims and nothing DECLARES is a step the picker can never
//   reach -- no error, no empty screen, just a step quietly unavailable;
//
//   a mode DECLARED with no steps is a button that empties the screen when
//   pressed.
//
// Neither shows up in any other check, because both halves are individually
// well formed.
if (poojaModes.length) {
  const declared = new Set(poojaModes.map((m) => `${m.pooja_id}/${m.mode}`));
  const claimed = new Set();
  for (const s of steps) for (const m of s.modes ?? []) claimed.add(`${s.pooja_id}/${m}`);

  for (const key of claimed) {
    if (!declared.has(key)) fail(key, 'step mode is not declared in pooja_modes, so the picker cannot reach it');
  }
  const haveSteps = new Set(steps.map((s) => s.pooja_id));
  for (const m of poojaModes) {
    const key = `${m.pooja_id}/${m.mode}`;
    if (haveSteps.has(m.pooja_id) && !claimed.has(key)) {
      fail(key, 'mode is declared but no step uses it, so the button would empty the screen');
    }
    for (const f of ['label_en', 'label_ta', 'hint_en', 'hint_ta']) {
      if (!m[f] || !String(m[f]).trim()) fail(key, `${f} is empty`);
    }
    if (m.label_ta) checkTamil(`${key}.label_ta`, m.label_ta);
    if (m.hint_ta) checkTamil(`${key}.hint_ta`, m.hint_ta);
  }
  // seq orders the picker and must be dense per pooja, or two buttons collide
  // or a gap hints at a mode someone deleted.
  const bySeq = {};
  for (const m of poojaModes) (bySeq[m.pooja_id] ??= []).push(m.seq);
  for (const [pid, seqs] of Object.entries(bySeq)) {
    seqs.sort((a, b) => a - b);
    seqs.forEach((n, i) => {
      if (n !== i + 1) fail(pid, `pooja_modes seq is not 1..n: got ${seqs.join(',')}`);
    });
  }
}

// --- poojas and deities -----------------------------------------------------
for (const p of poojas) {
  for (const f of ['title_en', 'title_ta']) if (!p[f]) fail(p.id, `${f} is empty`);
  if (p.title_ta) checkTamil(`${p.id}.title_ta`, p.title_ta);
  // A deity it names must exist, whether or not the rite is written yet.
  if (p.deity_id && !deities.some((d) => d.id === p.deity_id)) {
    fail(p.id, `deity "${p.deity_id}" does not exist`);
  } else if (!p.deity_id && !isPlanned(p)) {
    fail(p.id, 'has no deity');
  }
  if (!p.description_en) warn(p.id, 'has no description_en');
  if (!p.description_ta) warn(p.id, 'has no description_ta');

  // "Why we do it", 0044. The app explained every step and never the rite, and
  // the point of a gate here is that the next pooja added cannot quietly ship
  // without one -- it is the easiest section to forget, because nothing on
  // screen looks broken when it is missing.
  //
  // Absent on a planned rite is correct: there is no preparation screen to
  // show it on, and writing it before transcribing the book would be writing
  // about something nobody has read.
  if (!isPlanned(p)) {
    if (!p.why_en) fail(p.id, 'has no "why we do it" text');
    if (!p.why_ta) warn(p.id, 'has no Tamil "why we do it" text');
    else checkTamil(`${p.id}.why_ta`, p.why_ta);
  } else if (p.why_en) {
    fail(p.id, 'is planned but carries "why we do it" text, which nothing shows');
  }
  // A nitya rite has no calendar rule because it is performed every day. 0002
  // makes rule_type nullable for precisely this, so the absence is correct
  // rather than missing.
  if (!p.rule_type && p.ritual_class !== 'nitya') warn(p.id, 'has no calendar rule');
  if (p.rule_type && p.ritual_class === 'nitya') {
    fail(p.id, 'is nitya but carries a calendar rule; a daily rite has no date');
  }
  // karta_recommended arrives with 0041 and is absent before it, which is not a
  // fault. What would be a fault is a value the karta toggle has no button for:
  // the app drops anything it does not recognise, so the recommendation would
  // simply vanish rather than announce itself.
  if (p.karta_recommended != null && !['male', 'female', 'couple'].includes(p.karta_recommended)) {
    fail(p.id, `karta_recommended is "${p.karta_recommended}", which is not male, female or couple`);
  }
  // eligibility says who MAY perform the rite and is a prohibition. Nothing in
  // the book supports one, so anything but 'all' should have arrived with a
  // source, not with a migration nobody argued for.
  if (p.eligibility && p.eligibility !== 'all') {
    warn(p.id, `eligibility is "${p.eligibility}" -- that is a prohibition; the book makes none, and a recommendation belongs in karta_recommended`);
  }
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
