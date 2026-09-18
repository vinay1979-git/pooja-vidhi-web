#!/usr/bin/env node
/**
 * The Ganesha Sankalpam, and line breaks for the mantras stored as one run.
 * Emits 0022.
 *
 *   node scripts/build-sankalpam-and-format.mjs          # validate only
 *   node scripts/build-sankalpam-and-format.mjs --emit   # write it
 *
 * ---------------------------------------------------------------------------
 * 1. THE SANKALPAM
 *
 * The last step carrying "Tamil draft, pending vaidika review". It was 275
 * characters against Varalakshmi's 509, and it had literal ellipses in it --
 * "bharata khaṇḍe ... [DYNAMIC_PANCHANGAM_DATA] ... mama upātta" -- which is
 * the truncation marker proofread.mjs exists to catch, sitting in the one step
 * that step could not be regenerated without care.
 *
 * What it was missing, against the kalpam's own sankalpam: the rest of the
 * geography (meroḥ dakṣiṇe pārśve asmin vartamāne vyāvahārike), and every
 * purpose clause -- asmākaṃ sahakuṭumbānāṃ kṣema sthairya dhairya, the
 * caturvidha puruṣārtha, putrapautrābhivṛddhi, iṣṭakāmyārtha siddhi, samasta
 * duritopaśānti, samasta maṅgaḷāvāpti -- and the deity's own uddiśya /
 * prītyarthaṃ pair.
 *
 * TWO THINGS ARE DELIBERATELY NOT TAKEN FROM THE KALPAM.
 *
 * Its sankalpam fixes the date as "bhādrapada śukla caturthī puṇyakāle". That
 * is the LUNAR month, and Tamil Smartha recites the SOLAR one; the panchangam
 * engine computes it and supplies it through the slot. Hardcoding the kalpam's
 * phrase would both fix the date to one day and use the wrong reckoning.
 *
 * Its "mama upātta ………. sametasya" carries a form blank for the family names.
 * The standard opener, mama upātta samasta duritakṣaya dvārā śrī parameśvara
 * prītyarthaṃ, is used instead -- it is what the step already said, it is what
 * the Smartha Paddhati purvangam prints, and it is what src/lib/sankalpam.ts
 * renders.
 *
 * ---------------------------------------------------------------------------
 * 2. THE DUPLICATE THIS EXPOSED
 *
 * Varalakshmi's sankalpam opens its clause list with "pūrvokta evaṃ guṇa
 * viśeṣaṇa viśiṣṭāyāṃ śubhatithau" -- "at the auspicious tithi qualified by the
 * AFORESAID attributes". In the kalpam that is a back-reference: the section is
 * headed punaḥ saṅkalpam, said after a full sankalpam earlier.
 *
 * Here there is no earlier one. The slot supplies the attributes in full, and
 * PoojaViewer now renders the engine's complete core into it, so the sentence
 * read "...evaṃguṇa viśeṣaṇa viśiṣṭāyām asyāṃ vartamānāyām pūrvokta evaṃ guṇa
 * viśeṣaṇa viśiṣṭāyāṃ śubhatithau" -- the same phrase twice, once computed and
 * once as a reference to itself. The back-reference is dropped.
 *
 * ---------------------------------------------------------------------------
 * 3. LINE BREAKS
 *
 * Done in SQL rather than by restating the text here, so the migration breaks
 * whatever is actually in the column instead of whatever this script believes
 * is in it. Only steps whose mantra is currently a SINGLE line are touched, and
 * only at a danda, which is where the reciter pauses anyway. Idempotent: after
 * one run there is no "। " left to split on.
 */
import { emitMigration } from './_migration.mjs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate as tr } from './_tamil.mjs';
import { loadTelugu, section, teluguToDeva, normalise, checkScripts } from './_sources.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';

const fail = (m) => {
  console.error(`FAIL  ${m}`);
  process.exitCode = 1;
};

const kalpam = loadTelugu(`${DIR}vvk_te.txt`);
const vlKalpam = loadTelugu(`${DIR}vlk_te.txt`);

/**
 * The two kalpam pages mark their headings differently: the Ganesha one uses an
 * en dash ("సంకల్పం –") and the Varalakshmi one a pipe ("పునః సంకల్పం |"), which
 * is why parse-varalakshmi-kalpam.mjs always had its own reader. section() only
 * knows the en dash, so the Varalakshmi sankalpam is taken by its heading line
 * directly. Both are asserted rather than assumed.
 */
const longestLine = (ls, what) => {
  const best = ls.slice().sort((a, b) => b.length - a.length)[0];
  if (!best || best.length < 200) fail(`the ${what} sankalpam line looks too short: ${best}`);
  return best;
};

// The section also contains "sri govinda govinda" and the "vinayaka puja
// prarambhah" header that follows it; the sankalpam itself is the long line.
const ganeshaSankalpamTe = longestLine(
  section(kalpam, 'సంకల్పం', { script: 'telugu', fail }),
  'Ganesha',
);

const vlHeadAt = vlKalpam.findIndex((l) => l.trim() === 'పునః సంకల్పం |');
if (vlHeadAt < 0) fail('the Varalakshmi punah sankalpam heading was not found');
const vlSankalpamTe = longestLine(
  vlKalpam.slice(vlHeadAt + 1, vlHeadAt + 4).map((l) => l.trim()).filter(Boolean),
  'Varalakshmi',
);

/** Cut a named span out of a source line, asserting it was there. */
function cut(text, what, why) {
  if (!what.test(text)) {
    fail(`could not find ${what} to remove (${why})`);
    return text;
  }
  return text.replace(what, ' ');
}

let gan = ganeshaSankalpamTe;
// The form blank for the family names, and the clause that governs it.
gan = cut(gan, /మమ ఉపాత్త [….\s]*సమేతస్య,/, 'form blank for the family names');
// The lunar date. The slot supplies the solar one, computed.
gan = cut(gan, /భాద్రపద శుక్ల చతుర్థీ పుణ్యకాలే/, 'hardcoded lunar date');
if (/[…\u2026]/.test(gan)) fail('an ellipsis survived in the Ganesha sankalpam');

let vl = vlSankalpamTe;
// The back-reference. See the header.
vl = cut(vl, /పూర్వోక్త ఏవం గుణ విశేషణ విశిష్టాయాం శుభతిథౌ,/, 'back-reference the slot already supplies');

const toDeva = (te) => normalise(teluguToDeva(Sanscript, te.replace(/\s+/g, ' ').trim(), fail));

/**
 * The fixed cosmological preamble.
 *
 * Kept identical to PREAMBLE in src/lib/sankalpam.ts, which renders it for the
 * Sankalpam card on the same screen. Two spellings of the same sentence, one
 * above the other, is the fault this migration is here to stop repeating.
 */
const PREAMBLE = [
  'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे',
  'वैवस्वत मन्वन्तरे अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे',
  'भरतवर्षे भरतखण्डे मेरोः दक्षिणे पार्श्वे अस्मिन् वर्तमाने व्यावहारिके',
];
const OPENER = 'मम उपात्त समस्त दुरितक्षय द्वारा श्री परमेश्वर प्रीत्यर्थं,';

/**
 * Break the purpose run into lines at its clause ends.
 *
 * Commas alone are not enough: the Varalakshmi kalpam sets its whole purpose
 * list without a single comma, so splitting on commas left it as one 300
 * character line -- the thing this migration is here to fix. A sankalpam's
 * clauses end in -arthaṃ ("for the sake of"), and at uddiśya, so those are the
 * breaks.
 */
const byClause = (deva) =>
  deva
    // र्थं, not अर्थं. The clauses end -yarthaṃ, -ptyarthaṃ, where the a of
    // artha is the inherent vowel of the preceding consonant and there is no
    // standalone अ in the string at all -- so matching अर्थं found nothing and
    // left the Varalakshmi purposes as one 300-character line.
    .replace(/(र्थं|र्थम्|उद्दिश्य|,)\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const SANKALPAM = {
  ganesha_standard: [...PREAMBLE, '[DYNAMIC_PANCHANGAM_DATA]', OPENER, ...byClause(toDeva(gan))],
  varalakshmi_vratham: [...PREAMBLE, '[DYNAMIC_PANCHANGAM_DATA]', OPENER, ...byClause(toDeva(vl))],
};

for (const [pooja, lines] of Object.entries(SANKALPAM)) {
  const t = lines.join('\n');
  if (!t.includes('[DYNAMIC_PANCHANGAM_DATA]')) fail(`${pooja} sankalpam lost the dynamic slot`);
  if (t.includes('...') || /[…\u2026]/.test(t)) fail(`${pooja} sankalpam still has an ellipsis`);
  if (t.includes('पूर्वोक्त')) fail(`${pooja} sankalpam still back-references the slot`);
  if (t.includes('भाद्रपद')) fail(`${pooja} sankalpam hardcodes a lunar month`);
  if (!/पूजां करिष्ये|पूजाम् करिष्ये/.test(t)) fail(`${pooja} sankalpam does not end in the sankalpa verb`);
  if (lines.length < 8) fail(`${pooja} sankalpam is only ${lines.length} lines`);
}
if (!SANKALPAM.ganesha_standard.join(' ').includes('वरसिद्धिविनायक')) {
  fail('the Ganesha sankalpam does not name the deity');
}
if (!SANKALPAM.varalakshmi_vratham.join(' ').includes('वरलक्ष्मी')) {
  fail('the Varalakshmi sankalpam does not name the deity');
}

// Scripts. The slot is a PROTECTED token and survives transliteration.
const built = {};
for (const [pooja, lines] of Object.entries(SANKALPAM)) {
  const deva = lines.join('\n');
  built[pooja] = { deva, ta: tr(Sanscript, deva, 'tamil'), iast: tr(Sanscript, deva, 'iast') };
  // checkScripts rejects latin outside iast; the slot is latin on purpose.
  const scrub = (o) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.replace('[DYNAMIC_PANCHANGAM_DATA]', '')]));
  checkScripts(`${pooja}/Sankalpam`, scrub(built[pooja]), fail);
  for (const [k, v] of Object.entries(built[pooja])) {
    if (!v.includes('[DYNAMIC_PANCHANGAM_DATA]')) fail(`${pooja}/Sankalpam.${k} lost the slot in conversion`);
  }
}

if (process.exitCode) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

// The steps whose mantra is stored as one run and reads better as verses.
const FORMAT = ['Achamanam', 'Anga Vandanam', 'Manjal Pillaiyar Pooja'];

out('-- =============================================================================');
out('-- 0022_sankalpam_and_line_breaks.sql');
out('--');
out('-- GENERATED by scripts/build-sankalpam-and-format.mjs. Do not hand-edit.');
out('--');
out('-- 1. The Ganesha Sankalpam, the last step marked "Tamil draft, pending vaidika');
out('--    review". It had literal ellipses around the dynamic slot -- the very');
out('--    truncation marker proofread.mjs looks for -- and was missing the rest of');
out('--    the geography and every purpose clause the kalpam gives.');
out('--');
out('--    NOT taken from the kalpam: its hardcoded "bhadrapada shukla chaturthi',);
out('--    punyakale", because that is the LUNAR month and Tamil Smartha recites the');
out('--    SOLAR one, which the panchangam engine computes into the slot; and its');
out('--    "mama upatta ......... sametasya", which is a form blank.');
out('--');
out('-- 2. Varalakshmi loses "purvokta evam guna visesana visistayam subhatithau".');
out('--    In the kalpam that is a back-reference, in a section headed PUNAH');
out('--    sankalpam. Here there is no earlier sankalpam to refer back to, and the');
out('--    slot supplies those attributes in full, so it read as the same phrase');
out('--    twice -- once computed, once as a reference to itself.');
out('--');
out('-- 3. Line breaks for the mantras stored as a single run. Done with a string');
out('--    replace on whatever is in the column rather than by restating the text,');
out('--    and only where the mantra is currently one line. Idempotent: after one');
out('--    run there is no "danda space" left to split on.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const [pooja, s] of Object.entries(built)) {
  out(`-- --- ${pooja} / Sankalpam`);
  out('update public.pooja_steps set');
  out(`  mantra_sanskrit = ${q(s.deva)},`);
  out(`  mantra_tamil = ${q(s.ta)},`);
  out(`  mantra_translit = ${q(s.iast)},`);
  out(
    `  source_ref = ${q(
      pooja === 'ganesha_standard'
        ? 'Purpose clauses from StotraNidhi Sri Siddhi Vinayaka Vrata Kalpam (Telugu), saṅkalpam section, round-trip verified Telugu->Devanagari by scripts/build-sankalpam-and-format.mjs. Preamble and opener as in StotraNidhi Puja Vidhanam (Poorvangam, Smartha Paddhati), kept identical to PREAMBLE in src/lib/sankalpam.ts so the card and the mantra cannot show two spellings of one sentence. The kalpam\u2019s hardcoded "bhadrapada shukla chaturthi punyakale" is NOT used: that is the lunar month and Tamil Smartha recites the solar one, which the panchangam engine computes into [DYNAMIC_PANCHANGAM_DATA]. The kalpam\u2019s form blank for family names is replaced by the standard opener.'
        : 'Purpose clauses from StotraNidhi Sri Varalakshmi Vrata Kalpam (Telugu), punaḥ saṅkalpam section, round-trip verified. Preamble and opener as in the Smartha Paddhati purvangam, matching PREAMBLE in src/lib/sankalpam.ts. The kalpam\u2019s opening "purvokta evam guna visesana visistayam subhatithau" is dropped: it is a back-reference to a sankalpam said earlier, and here the dynamic slot supplies those attributes in full.',
    )},`,
  );
  out('  verified_by = null,');
  out('  verified_at = null,');
  out('  updated_at = now()');
  out(`where pooja_id = '${pooja}' and step_title_en = 'Sankalpam';`);
  out();
}

out('-- --- line breaks at the danda, for mantras still stored as one run ------------');
out('update public.pooja_steps set');
for (const col of ['mantra_sanskrit', 'mantra_tamil', 'mantra_translit']) {
  out(`  ${col} = replace(replace(${col}, '\u0964 ', '\u0964' || chr(10)), '\u0965 ', '\u0965' || chr(10)),`);
}
out('  updated_at = now()');
out(`where step_title_en in (${FORMAT.map((t) => `'${t}'`).join(', ')})`);
out("  and mantra_sanskrit is not null");
out("  and mantra_sanskrit not like '%' || chr(10) || '%';");
out();

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- Nothing anywhere may still be an unreviewed draft.');
out('  select count(*) into n from public.pooja_steps');
out("   where source_ref is null or source_ref like '%pending vaidika review%';");
out("  if n > 0 then raise exception '% steps are still unsourced drafts', n; end if;");
out('  -- Both sankalpams keep the slot, in all three scripts.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Sankalpam'");
out("     and mantra_sanskrit like '%[DYNAMIC_PANCHANGAM_DATA]%'");
out("     and mantra_tamil like '%[DYNAMIC_PANCHANGAM_DATA]%'");
out("     and mantra_translit like '%[DYNAMIC_PANCHANGAM_DATA]%';");
out("  if n <> 2 then raise exception 'expected 2 sankalpams with the slot intact, found %', n; end if;");
out('  -- No ellipsis, no back-reference, no hardcoded lunar month.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Sankalpam'");
out("     and (position('...' in mantra_sanskrit) > 0");
out("          or mantra_sanskrit like '%पूर्वोक्त%' or mantra_sanskrit like '%भाद्रपद%');");
out("  if n > 0 then raise exception '% sankalpams still carry a removed phrase', n; end if;");
out('  -- Every mantra that is meant to read as verses is on more than one line.');
out('  select count(*) into n from public.pooja_steps');
out(`   where step_title_en in (${FORMAT.map((t) => `'${t}'`).join(', ')})`);
out("     and mantra_sanskrit not like '%' || chr(10) || '%';");
out("  if n > 0 then raise exception '% formatted steps are still a single line', n; end if;");
out('  -- A line break must not have been inserted into the middle of a word.');
out('  select count(*) into n from public.pooja_steps');
out("   where mantra_sanskrit like '%' || chr(10) || ' %' or mantra_sanskrit like '% ' || chr(10) || '%';");
out("  if n > 0 then raise exception '% mantras have a space beside a line break', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select pooja_id, step_title_en from pooja_steps where source_ref like '%pending%';");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0022_sankalpam_and_line_breaks.sql', sql);
} else {
  console.log('--- validated, not written (pass --emit) ---\n');
  for (const [pooja, s] of Object.entries(built)) {
    console.log(`##### ${pooja} / Sankalpam (${s.deva.length} chars, ${s.deva.split('\n').length} lines)`);
    console.log(s.deva.split('\n').map((l) => '  ' + l).join('\n'));
    console.log();
  }
}
