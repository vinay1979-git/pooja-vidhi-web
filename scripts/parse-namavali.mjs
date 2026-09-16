#!/usr/bin/env node
/**
 * Builds the two 108-name lists from PUBLISHED text in three scripts.
 *
 * Why not transliterate one script into the others: a namavali is liturgical
 * text people read aloud. StotraNidhi publishes each list in Devanagari, Tamil
 * and IAST as separately proofed pages, so we take all three as published and
 * use machine transliteration only to CHECK that the three pages are the same
 * list in the same order. Nothing generated is stored.
 *
 * Recension note. sanskritdocuments' lakShmyaShTottarashatanAmAvaliH is the
 * sahasranama-anga recension (brahmajAyai, brahmasukhadAyai...). That is NOT
 * the list recited at Varalakshmi Vratham, which begins prakRityai, vikRityai,
 * vidyAyai, sarvabhUtahitapradAyai. This file uses the latter.
 *
 * Likewise the Ganesha list here opens gajAnanAya, gaNAdhyakShAya, vighnarAjAya
 * and closes varasiddhivinAyakAya, which is the South Indian recension used at
 * Ganesha Chaturthi, not the shorter North Indian one.
 *
 *   node scripts/parse-namavali.mjs     # validate, write parsed.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';

const SOURCES = {
  ganesha: {
    deva: ['gan_hi.html', 'stotranidhi.com/hi/sri-ganesha-ashtottara-shatanamavali-in-sanskrit/'],
    ta: ['gan_ta.html', 'stotranidhi.com/ta/sri-ganesha-ashtottara-shatanamavali-in-tamil/'],
    iast: ['gan_en.html', 'stotranidhi.com/en/sri-ganesha-ashtottara-shatanamavali-in-english/'],
  },
  lakshmi: {
    deva: ['lak_hi.html', 'stotranidhi.com/hi/sri-lakshmi-ashtottara-shatanamavali-in-sanskrit/'],
    ta: ['lak_ta.html', 'stotranidhi.com/ta/sri-lakshmi-ashtottara-shatanamavali-in-tamil/'],
    iast: ['lak_en.html', 'stotranidhi.com/en/sri-lakshmi-ashtottara-shatanamavali-in-english/'],
  },
};

// Each entry sits on its own line: "<om> <name> <namah> <danda>", with every
// tenth followed by a running count we drop.
const LINE = {
  deva: /^ओं\s.+\sनमः\s*।/,
  ta: /^ஓம்\s.+\sநம꞉\s*।/,
  iast: /^ōṁ\s.+\snamaḥ\s*\|/,
};

function extract(file, script) {
  const text = readFileSync(DIR + file, 'utf8')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '\n');
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => LINE[script].test(l))
    .map((l) => l.replace(/\s*[।|]\s*[\d०-९௦-௯]*\s*$/, '').trim());
}

const SUPERSCRIPTS = /[\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079\u02bc]/g;

// ओं and ॐ are the same syllable and ॐ is what the rest of the app uses. The
// Tamil pages carry Grantha voicing superscripts, which this project dropped at
// the user's request, so they come off here too. Those are the only two edits
// made to the published text.
const normalise = {
  deva: (s) => s.replace(/^ओं(?=\s)/, 'ॐ'),
  ta: (s) => s.replace(SUPERSCRIPTS, ''),
  iast: (s) => s,
};

// Strip to bare Latin letters so orthographic variance (e vs long e, anusvara
// spelling) does not register as a difference but a different NAME does.
const skel = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const toTamil = (deva) =>
  Sanscript.t(deva, 'devanagari', 'tamil')
    .replace(SUPERSCRIPTS, '')
    .replace(/[\u0bc3\u0bc4']/g, '')
    .replace(/\u0b83/g, '\ua789');

// Ignore the leading pranava, which the two sources spell differently.
const bareTa = (t) => t.replace(/\s/g, '').replace(/^(ஓம்|ௐ)/, '');

let bad = false;
const out = {};

for (const [key, src] of Object.entries(SOURCES)) {
  const cols = {};
  for (const script of ['deva', 'ta', 'iast']) {
    cols[script] = extract(src[script][0], script).map(normalise[script]);
  }

  const counts = Object.entries(cols).map(([k, v]) => `${k}=${v.length}`).join(' ');
  const sized = Object.values(cols).every((v) => v.length === 108);
  if (!sized) bad = true;
  console.log(`${sized ? 'ok  ' : 'FAIL'} ${key}: ${counts} (want 108 each)`);

  // The Devanagari page transliterated to IAST must be the same list, in the
  // same order, as the IAST page.
  const drift = [];
  for (let i = 0; i < Math.min(cols.deva.length, cols.iast.length); i++) {
    if (skel(Sanscript.t(cols.deva[i], 'devanagari', 'iast')) !== skel(cols.iast[i])) {
      drift.push(`${i + 1}: ${cols.deva[i]} != ${cols.iast[i]}`);
    }
  }
  if (drift.length) {
    bad = true;
    console.log(`     FAIL deva/iast disagree on ${drift.length}:`);
    drift.slice(0, 6).forEach((d) => console.log('       ' + d));
  } else {
    console.log('     ok   deva and iast are the same list in the same order');
  }

  // Tamil cannot be skeleton-compared, because the plain Tamil scheme folds
  // ka/kha/ga/gha onto one letter. So generate Tamil from the Devanagari page
  // and diff. Some disagreement is expected and is orthographic: the published
  // page uses Grantha letters where the plain scheme folds. A disagreement on
  // MOST entries would instead mean the pages are different lists, and that is
  // what this gate is watching for.
  const taDrift = [];
  for (let i = 0; i < Math.min(cols.deva.length, cols.ta.length); i++) {
    if (bareTa(toTamil(cols.deva[i])) !== bareTa(cols.ta[i])) {
      taDrift.push(`${i + 1}: ${cols.ta[i]}  vs generated  ${toTamil(cols.deva[i])}`);
    }
  }
  const taOk = cols.ta.length - taDrift.length;
  console.log(`     tamil: ${taOk}/${cols.ta.length} identical to Tamil generated from the Devanagari`);
  if (taDrift.length > cols.ta.length / 2) {
    bad = true;
    console.log('     FAIL tamil page is not the same list, beyond orthographic variance:');
    taDrift.slice(0, 4).forEach((d) => console.log('       ' + d));
  }

  if (!sized || drift.length) continue;

  out[key] = cols.deva.map((deva, i) => ({
    seq: i + 1,
    deva,
    tamil: cols.ta[i],
    iast: cols.iast[i],
  }));
  console.log(`     1   ${out[key][0].deva}  /  ${out[key][0].tamil}  /  ${out[key][0].iast}`);
  console.log(`     108 ${out[key][107].deva}  /  ${out[key][107].tamil}  /  ${out[key][107].iast}`);
  console.log();
}

if (!bad) {
  writeFileSync(DIR + 'parsed.json', JSON.stringify(out, null, 1));
  console.log('RESULT: both lists are 108 in all three scripts, written to parsed.json');
} else {
  console.log('RESULT: validation failed, do not seed');
}
process.exit(bad ? 1 : 0);
