#!/usr/bin/env node
/**
 * Extracts the four enumerated archanas of the Ganesha Chaturthi pooja from
 * StotraNidhi's Sri Siddhi Vinayaka Vrata Kalpam, and converts them to
 * Devanagari, Tamil and IAST.
 *
 *   node scripts/parse-vinayaka-kalpam.mjs   # validate, write vinayaka.json
 *
 * WHY THIS SOURCE REPLACES THE PATCHWORK. Migration 0010 stitched the four
 * archanas together from four different places, and one of them -- the pairing
 * of a Ganesha name to each of the 21 leaves -- could not be sourced at all,
 * because every aggregator gave a different pairing and none agreed. This is
 * the vrata kalpam FOR Ganesha Chaturthi, and it carries all four in one
 * internally consistent paddhati.
 *
 * The patra pairing carries internal evidence that it was transmitted intact:
 * most names alliterate with their leaf. dhUmaketave/dhattUra,
 * apavargadAya/apAmArga, chirantanAya/chUta, kapilAya/karavIra,
 * amalAya/AmalakI, sindhUrAya/sindhuvAra, shankarapriyAya/shamI,
 * arkaprabhAya/arka. Fourteen of the twenty-one, which is far past coincidence
 * but is NOT all of them -- seven pairs, including the first three, do not
 * alliterate. The gate below asserts the pattern loosely for that reason: it
 * exists to catch a re-parse that misaligns names against leaves, where the
 * count would collapse to one or two, not to claim a rule without exceptions.
 *
 * It also settles a loose end: leaf 13 here is AmalakI, the gooseberry, which
 * is the "nellikkai elai" in Sathya Vadyar's samagri list that matched nothing
 * in the leaf list 0010 used.
 *
 * Telugu -> Devanagari is lossless for Sanskrit and this script proves it per
 * line by converting back, same discipline as parse-varalakshmi-kalpam.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { tidyTamil, fixSuperscripts, transliterate as trShared, PROTECTED } from './_tamil.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const SOURCE =
  'StotraNidhi, Sri Siddhi Vinayaka Vrata Kalpam part 2 (Telugu), stotranidhi.com/sri-vinayaka-vrata-kalpam-two/';

const SECTIONS = [
  ['అథాంగపూజా', 'anga_pooja', 29],
  ['ఏకవింశతి పత్ర పూజ', 'patra', 21],
  ['ఏకవింశతి పుష్ప పూజా', 'pushpa', 21],
  ['ఏకవింశతి దూర్వాయుగ్మ పూజా', 'durva', 21],
  ['అథ అష్టోత్తరశతనామ పూజా', 'END', 0],
];

const lines = readFileSync(DIR + 'vvk_te.txt', 'utf8').split('\n');
const at = new Map();
lines.forEach((l, i) => {
  const s = l.trim();
  for (const [te, key] of SECTIONS) if (s.startsWith(te)) at.set(key, i);
});
const missing = SECTIONS.filter(([, k]) => !at.has(k)).map(([, k]) => k);
if (missing.length) {
  console.error('FAIL headings not found: ' + missing.join(', '));
  process.exit(1);
}

const TE_LETTER = /[\u0C00-\u0C65\u0C70-\u0C7F]/;
// Each entry is "OM <name> namaH | <act> (<telugu gloss>) |". The gloss names
// the plant or body part in Telugu for a Telugu reader; this project carries
// its own Tamil names, so the gloss is dropped rather than half-translated.
const GLOSS = /\s*\([^)]*\)\s*/g;

function body(key, nextKey) {
  return lines
    .slice(at.get(key) + 1, at.get(nextKey))
    .map((l) => l.trim().replace(GLOSS, ' ').replace(/\s+/g, ' ').trim())
    // The durva block ends with a summary line addressing the deity by name
    // and offering all the leaves and flowers at once. It is not a 22nd durva.
    .filter((l) => TE_LETTER.test(l) && l.includes('|') && !l.includes('స్వామినే'))
    .map((l) => l.replace(/\s*\|\s*$/, ''));
}

const fixSup = fixSuperscripts;
const tidyTa = tidyTamil;
const toTamil = (d) => tidyTa(fixSup(Sanscript.t(d, 'devanagari', 'tamil')));
const toIast = (d) => Sanscript.t(d, 'devanagari', 'iast');
const skel = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

let bad = 0;
const out = {};

for (let i = 0; i < SECTIONS.length - 1; i++) {
  const [, key, want] = SECTIONS[i];
  const next = SECTIONS[i + 1][1];
  const teLines = body(key, next);

  if (teLines.length !== want) {
    console.error(`FAIL ${key}: ${teLines.length} lines, expected ${want}`);
    bad++;
  }

  out[key] = teLines.map((te, idx) => {
    const deva = Sanscript.t(te, 'telugu', 'devanagari');
    const back = Sanscript.t(deva, 'devanagari', 'telugu');
    if (back.trim() !== te.trim()) {
      console.error(`FAIL round-trip ${key} ${idx + 1}: ${te}`);
      bad++;
    }
    // The source writes the pranava as ओं; the rest of this project uses ॐ.
    const fixed = deva.replace(/(^|\s)ओं(?=\s|[^\s])/g, '$1ॐ ').replace(/\s+/g, ' ').trim();
    const [name, act] = fixed.split('|').map((p) => p.trim());
    return {
      seq: idx + 1,
      name_deva: name,
      name_ta: toTamil(name),
      name_iast: toIast(name),
      act_deva: act ?? null,
      act_ta: act ? toTamil(act) : null,
      act_iast: act ? toIast(act) : null,
    };
  });

  const split = out[key].filter((r) => !r.act_deva).length;
  if (split) { console.error(`FAIL ${key}: ${split} lines did not split into name and act`); bad++; }
  console.log(`${bad ? 'FAIL' : 'ok  '} ${key.padEnd(11)} ${out[key].length} lines  ${out[key][0]?.name_iast} | ${out[key][0]?.act_iast}`);
}

// Most of the patra names begin with the same sound as their leaf. The point of
// checking is alignment, not orthodoxy: if a re-parse shifted names against
// leaves the count would fall to one or two by chance, so anything at or above
// half means the two columns still belong to each other.
const ALLITERATION_FLOOR = 11; // of 21; the source scores 14
if (out.patra) {
  const off = [];
  for (const r of out.patra) {
    const n = skel(r.name_iast).replace(/^om/, '');
    if (n[0] !== skel(r.act_iast)[0]) off.push(`${r.seq}: ${r.name_iast} / ${r.act_iast}`);
  }
  const hit = out.patra.length - off.length;
  console.log(`     patra alliteration: ${hit}/${out.patra.length} names share their leaf's initial (floor ${ALLITERATION_FLOOR})`);
  if (hit < ALLITERATION_FLOOR) {
    console.error('FAIL the patra names are not aligned with the leaves');
    off.forEach((o) => console.error('       ' + o));
    bad++;
  }
}

if (bad) {
  console.log('\nRESULT: validation failed, do not seed');
  process.exit(1);
}
writeFileSync(DIR + 'vinayaka.json', JSON.stringify({ source: SOURCE, ...out }, null, 1));
console.log('\nRESULT: all four archanas round-tripped, written to vinayaka.json');
