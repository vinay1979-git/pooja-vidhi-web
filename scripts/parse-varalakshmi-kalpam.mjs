#!/usr/bin/env node
/**
 * Extracts the Varalakshmi Vrata Kalpam from StotraNidhi and converts it to
 * Devanagari, Tamil and IAST.
 *
 *   node scripts/parse-varalakshmi-kalpam.mjs   # validate, write kalpam.json
 *
 * WHY A CONVERSION IS ACCEPTABLE HERE, when parse-namavali.mjs refuses to do
 * one. StotraNidhi publishes this kalpam in Telugu only; there is no Devanagari
 * or Tamil page to take instead. Telugu is a complete abugida for Sanskrit, so
 * Telugu -> Devanagari is lossless and reversible, and this script proves it
 * per line by converting back and requiring the original. Tamil is NOT
 * reversible in the plain scheme this project uses (ka/kha/ga/gha fold onto one
 * letter), which is exactly why the namavali script would not generate it.
 *
 * So: Devanagari and IAST here are faithful re-encodings of published text.
 * Tamil is generated, same as everywhere else in this project, and carries the
 * transliteration underneath it in the UI.
 *
 * The Vrata Katha is deliberately not extracted. Sathya Vadyar's video has no
 * katha chapter, and the video is this project's authority for what a Tamil
 * household actually performs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { tidyTamil, fixSuperscripts, transliterate as trShared, PROTECTED } from './_tamil.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const SOURCE = 'StotraNidhi, Sri Varalakshmi Vrata Kalpam (Telugu), stotranidhi.com/sri-varalakshmi-vrata-kalpam-in-telugu/';

// Telugu heading -> the key this project files the section under.
const SECTIONS = [
  ['పునః సంకల్పం', 'sankalpam'],
  ['ధ్యానం', 'dhyanam'],
  ['ఆవాహనం', 'avahanam'],
  ['సింహాసనం', 'simhasanam'],
  ['అర్ఘ్యం', 'arghyam'],
  ['పాద్యం', 'padyam'],
  ['ఆచమనీయం', 'achamaniyam'],
  ['పంచామృత స్నానం', 'panchamrita_snanam'],
  ['శుద్ధోదకస్నానం', 'shuddhodaka_snanam'],
  ['వస్త్రయుగ్మం', 'vastram'],
  ['ఆభరణాని', 'abharanani'],
  ['మాంగళ్యం', 'mangalyam'],
  ['గంధం', 'gandham'],
  ['అక్షతాన్', 'akshatan'],
  ['పుష్పపూజ', 'pushpam'],
  ['అథాంగ పూజ', 'anga_pooja'],
  ['అష్టోత్తర శతనామావళిః', 'ashtottara'],
  ['ధూపం', 'dhupam'],
  ['దీపం', 'dipam'],
  ['నైవేద్యం', 'naivedyam'],
  ['పానీయం', 'paniyam'],
  ['తాంబూలం', 'tambulam'],
  ['నీరాజనం', 'nirajanam'],
  ['మంత్రపుష్పం', 'mantrapushpam'],
  ['ప్రదక్షిణ', 'pradakshina'],
  ['తోరగ్రంధి పూజ', 'tora_granthi'],
  ['తోరబంధన మంత్రం', 'tora_bandhanam'],
  ['వాయన విధిః', 'vayana_vidhi'],
  ['వాయనదానమంత్రం', 'vayana_danam'],
  ['వ్రతకథా ప్రారంభం', 'SKIP_katha'],
  ['క్షమాప్రార్థన', 'kshama'],
];

// The kalpam ends here. Past it is the site footer, which carries literal
// Devanagari in its book promos and would fail the round-trip for good reason.
const END = 'వరలక్ష్మీ వ్రత కల్పం సమాప్తం';

const allLines = readFileSync(DIR + 'vlk_te.txt', 'utf8').split('\n');
const endAt = allLines.findIndex((l) => l.trim().startsWith(END));
if (endAt < 0) {
  console.error(`FAIL closing marker "${END}" not found; the page layout changed`);
  process.exit(1);
}
const lines = allLines.slice(0, endAt);
const headIndex = new Map();
lines.forEach((l, i) => {
  const s = l.trim();
  for (const [te, key] of SECTIONS) {
    if (s === te || s === `${te} |`) headIndex.set(key, i);
  }
});

const missing = SECTIONS.filter(([, k]) => !headIndex.has(k)).map(([, k]) => k);
if (missing.length) {
  console.error('FAIL headings not found: ' + missing.join(', '));
  process.exit(1);
}

// Telugu numerals count the sixteen upacharas; the "see also" arrow points at
// another page. Neither is liturgy.
const TE_DIGITS = /[\u0C66-\u0C6F]+/g;
// A liturgy line is written in Telugu. Requiring at least one Telugu letter
// drops the page's inlined ad markup and scripts in one rule, rather than
// chasing each shape of junk with its own pattern.
const TE_LETTER = /[ఀ-౥౰-౿]/;
const NOISE = [/^చూ\.?\s*\|?$/, /^\(.*\)$/, /^శ్రీ లక్ష్మీ /];

function body(key, nextKey) {
  const from = headIndex.get(key) + 1;
  const to = nextKey ? headIndex.get(nextKey) : lines.length;
  return lines
    .slice(from, to)
    .map((l) => l.trim().replace(TE_DIGITS, '').replace(/\s+/g, ' ').trim())
    .filter((l) => TE_LETTER.test(l) && !NOISE.some((n) => n.test(l)))
    .map((l) => l.replace(/\s*\|\|\s*$/, ' ॥').replace(/\s*\|\s*$/, ' ।'));
}

// --- script conversion ------------------------------------------------------
const fixSup = fixSuperscripts;
const tidyTa = tidyTamil;
const convert = (text, to) =>
  text
    .split(PROTECTED)
    .map((p) => {
      if (p === '' || PROTECTED.test(p)) return p;
      const done = Sanscript.t(p, 'devanagari', to);
      return to === 'tamil' ? tidyTa(fixSup(done)) : done;
    })
    .join('');

// Telugu -> Devanagari must survive the return trip, per line. If it does not,
// the conversion lost something and the text must not be seeded.
let bad = 0;
const out = {};
for (let i = 0; i < SECTIONS.length; i++) {
  const [teHead, key] = SECTIONS[i];
  if (key.startsWith('SKIP_')) continue;
  const next = SECTIONS[i + 1]?.[1];
  const teLines = body(key, next);
  if (!teLines.length) { console.error(`FAIL ${key}: empty`); bad++; continue; }

  const rows = teLines.map((te) => {
    const deva = Sanscript.t(te, 'telugu', 'devanagari');
    const back = Sanscript.t(deva, 'devanagari', 'telugu');
    if (back.replace(/[।॥]/g, '').trim() !== te.replace(/[।॥]/g, '').trim()) {
      console.error(`FAIL round-trip ${key}: ${te}`);
      console.error(`               back: ${back}`);
      bad++;
    }
    // Two edits to the published text, both recorded here and in source_ref.
    //   1. The source writes the pranava out as ओं. It is the same syllable and
    //      the rest of this project uses ॐ.
    //   2. The first of the nine knots reads गंथिं where the other eight read
    //      ग्रंथिं. A one-letter slip in an otherwise identical sequence.
    const fixed = deva
      .replace(/(^|\s)ओं(?=\s)/g, '$1ॐ')
      .replace(/प्रथम गंथिं/, 'प्रथम ग्रंथिं');
    return { deva: fixed, tamil: convert(fixed, 'tamil'), iast: convert(fixed, 'iast') };
  });

  out[key] = {
    heading_te: teHead,
    source_ref: SOURCE,
    deva: rows.map((r) => r.deva).join('\n'),
    tamil: rows.map((r) => r.tamil).join('\n'),
    iast: rows.map((r) => r.iast).join('\n'),
    lines: rows.length,
  };
  console.log(`ok   ${key.padEnd(20)} ${rows.length} lines  ${rows[0].iast.slice(0, 62)}`);
}

// The two enumerated sections have a fixed length; a parse slip would show here.
const expect = { anga_pooja: 15, tora_granthi: 9 };
for (const [key, want] of Object.entries(expect)) {
  const got = out[key]?.lines;
  if (got !== want) { console.error(`FAIL ${key}: ${got} lines, expected ${want}`); bad++; }
  else console.log(`ok   ${key} has exactly ${want} lines`);
}

if (bad) {
  console.log('\nRESULT: validation failed, do not seed');
  process.exit(1);
}
writeFileSync(DIR + 'kalpam.json', JSON.stringify(out, null, 1));
console.log('\nRESULT: every line round-tripped telugu -> devanagari -> telugu, written to kalpam.json');
