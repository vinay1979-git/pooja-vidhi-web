#!/usr/bin/env node
/**
 * The vaidika review sheet: every word of both poojas, on paper, in one pass.
 *
 *   node scripts/build-review-sheet.mjs            # -> review/pooja-review-sheet.html
 *   node scripts/build-review-sheet.mjs --out x.html
 *
 * WHY THIS EXISTS. Every mantra in this project now traces to a published text
 * and the inventory flags one thin step. None of it has been read by a vaidika.
 * That is the only thing standing between here and the beta, and it is not a
 * software problem: it is one person reading 53 steps and saying where they are
 * wrong.
 *
 * They cannot do that in the app. Reviewing on a phone means tapping through 53
 * screens, holding the previous one in memory, and then describing a correction
 * in prose -- "the third line of the camphor one" -- which is how corrections
 * get lost. On paper they circle it. So this prints:
 *
 *   - every mantra with NUMBERED LINES, so a correction has an address
 *   - the three scripts SIDE BY SIDE on those lines, because the Tamil and the
 *     transliteration are generated from the Devanagari and the thing most
 *     worth checking is whether they still say the same thing
 *   - the source_ref under each mantra, so "where did this come from" is
 *     answered on the page rather than asked
 *   - the open questions in the place they arise, not in a list at the end
 *
 * It reads the LIVE database, not the migration files. What needs review is
 * what a user will actually be shown, including anything applied by hand.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// .env.local, without pulling in a dependency. Same loader as proofread.mjs.
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] ??= m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY missing from .env.local');
  process.exit(1);
}

const get = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const argOut = process.argv.indexOf('--out');
const OUT = argOut > -1 ? process.argv[argOut + 1] : 'review/pooja-review-sheet.html';

// --- escaping ---------------------------------------------------------------
// Everything below interpolates database text into HTML. One helper, used
// without exception, including on the fields that "cannot" contain markup.
const e = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const lines = (s) =>
  String(s ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * The questions this project has recorded as unresolved, keyed by the step
 * where they arise.
 *
 * They are printed AT the step rather than gathered at the end. A reviewer
 * asked at the end "should the neerajanam carry na tatra suryo bhati" has to
 * page back to see what it currently carries; asked beside the mantra, they
 * answer in ten seconds. Every one of these is written in docs/sources.md under
 * an "Open for practitioners" heading.
 *
 * Keyed by step title, or by "pooja_id::step title" where the two poojas share
 * a title but not the question. Both poojas have a step called Ksheera Arghyam
 * and they are not in the same state: Ganesha's has four offerings and
 * Varalakshmi's has one.
 */
const QUESTIONS = {
  'ganesha_standard::Ksheera Arghyam': [
    'This is built as FOUR verses with a refrain, from the Siddhi Vinayaka Vrata Kalpam. ' +
      'The report that prompted it said there are THREE steps in offering arghyam. ' +
      'Which is right, and if three, which of these four is not one?',
  ],
  'varalakshmi_vratham::Ksheera Arghyam': [
    'This has a single offering, where the Ganesha pooja has four. It was left as the source ' +
      'gave it rather than made to match. Should it be one, or the same sequence as Ganesha?',
  ],
  'Naivedyam & Tambulam': [
    'The frame runs: vyahritis, then gayatri, then the five pranas, then the naivedyam is named. ' +
      'Is "deva savitaḥ prasuva" in the right place? It appears in neither published page this was ' +
      'built from, and sits here on the strength of the spoken description only.',
  ],
  'Naivedyam, Paniyam & Tambulam': [
    'Same frame as the Ganesha step, and the same question about where ' +
      '"deva savitaḥ prasuva" belongs.',
  ],
  'Karpura Neerajanam': [
    'Should this carry "na tatra sūryo bhāti" and/or "karpūragauraṃ"? Both are commonly recited ' +
      'here and neither appears in any of the five published vidhanams consulted, so neither was ' +
      'added. If they belong, say which and in what order.',
  ],
  'Patra Pooja (21 Leaves)': [
    'The 21 leaves are paired with 21 names. 14 of the 21 pairs alliterate, which suggests the ' +
      'pairing is intended and that the other 7 may be mismatched. Please check the pairing, not ' +
      'just the names.',
  ],
  'Sharadu Dharanam': [
    'The shortest mantra in either pooja, at two lines. That is all its kalpam gives. ' +
      'Is anything else recited while the thread is tied?',
  ],
  'Nonbu Sharadu Pooja': [
    'The husband tying the thread on the wife, with three knots, is household practice reported ' +
      'by the user and is NOT in the kalpam, which does not say who ties it. It is marked as ' +
      'household practice in the instruction. Is that the right call, and is three correct ' +
      'against the nine knots of the thread itself?',
  ],
  Sankalpam: [
    'The month here is the SOLAR month, computed by the panchangam engine, not the lunar month ' +
      'the printed kalpam names. Confirm that is what a Tamil Smartha recites. ' +
      'The panchangam is computed for the day and place of use, so what prints below is today at ' +
      'the default location, not a fixed text.',
  ],
};

// --- fetch ------------------------------------------------------------------
const [poojas, steps, archana, namavali, samagri, naivedyam, deities] = await Promise.all([
  get('poojas?select=*'),
  get('pooja_steps?select=*'),
  get('archana_items?select=*'),
  get('namavali_items?select=*'),
  get('samagri_items?select=*'),
  get('naivedyam_items?select=*'),
  get('deities?select=*'),
]);

const byStep = new Map();
for (const a of archana) {
  if (!byStep.has(a.pooja_step_id)) byStep.set(a.pooja_step_id, []);
  byStep.get(a.pooja_step_id).push(a);
}
for (const v of byStep.values()) v.sort((x, y) => x.seq - y.seq);

const byNamavali = new Map();
for (const n of namavali) {
  if (!byNamavali.has(n.namavali_id)) byNamavali.set(n.namavali_id, []);
  byNamavali.get(n.namavali_id).push(n);
}
for (const v of byNamavali.values()) v.sort((x, y) => x.seq - y.seq);

const deity = Object.fromEntries(deities.map((d) => [d.id, d]));

// --- rendering --------------------------------------------------------------

/**
 * A mantra as a numbered table, one row per line, three scripts across.
 *
 * The three fields are generated from one another and are supposed to agree
 * line for line. When they do not, the row count differs, and that is a review
 * finding in itself -- so it is called out rather than silently padded.
 */
function mantraTable(step) {
  const d = lines(step.mantra_sanskrit);
  const t = lines(step.mantra_tamil);
  const r = lines(step.mantra_translit);
  if (!d.length && !t.length && !r.length) return '';

  const n = Math.max(d.length, t.length, r.length);
  const mismatch = new Set([d.length, t.length, r.length].filter(Boolean)).size > 1;

  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      `<tr><td class="ln">${i + 1}</td>` +
        `<td class="deva">${e(d[i] ?? '')}</td>` +
        `<td class="ta">${e(t[i] ?? '')}</td>` +
        `<td class="iast">${e(r[i] ?? '')}</td></tr>`,
    );
  }
  return (
    (mismatch
      ? `<p class="warn">The three scripts do not have the same number of lines ` +
        `(Devanagari ${d.length}, Tamil ${t.length}, transliteration ${r.length}). ` +
        `They are generated from one another, so this is a defect to note.</p>`
      : '') +
    `<table class="mantra"><thead><tr><th class="ln"></th>` +
    `<th>Sanskrit</th><th>Tamil</th><th>Transliteration</th></tr></thead>` +
    `<tbody>${rows.join('')}</tbody></table>`
  );
}

/**
 * An archana or namavali list: numbered, two per row to save paper.
 *
 * When every item carries the SAME offering -- as the Durva Pooja does, where
 * all twenty-one names take "dūrvāyugmaṃ samarpayāmi, a pair of arugampul
 * blades, Cynodon dactylon" -- it is hoisted above the table and printed once.
 * Printed per row it was three repeated phrases twenty-one times over, which is
 * most of the ink on the page and none of the information, and it buried the
 * one thing that does vary: the names.
 */
function listTable(items, kind) {
  const same = (f) => items.length > 1 && items.every((x) => x[f] && x[f] === items[0][f]);

  /**
   * The Ksheera Arghyam stores the refrain BOTH ways: inside invoked_name_deva,
   * where it follows the verse after a line break and carries Tamil and roman
   * with it, and again alone in offering_deva, which has no Tamil or roman
   * column. Printing both puts the same Sanskrit on the page twice and makes a
   * reviewer wonder whether it is said four times or eight. So the offering
   * text is dropped wherever the name already contains it; the English stays,
   * because "Pour the arghyam three times" is a stage direction, not a repeat.
   */
  const contained = (it) =>
    !!it.offering_deva && String(it.invoked_name_deva ?? '').includes(it.offering_deva);
  const allContained = kind === 'archana' && items.every(contained);

  const shared =
    kind === 'archana' && same('offering_deva')
      ? {
          deva: allContained ? null : items[0].offering_deva,
          en: items[0].offering_en,
          botanical: same('botanical') ? items[0].botanical : null,
        }
      : null;

  // These fields are multi-line -- a verse, then its refrain -- and HTML would
  // fold the newline into a space, running two padas together.
  const br = (s) => lines(s).map(e).join('<br>');

  const cell = (it, i) => {
    const name = kind === 'archana' ? it.invoked_name_deva : it.name_deva;
    const ta = kind === 'archana' ? it.invoked_name_ta : it.name_ta;
    const tr = kind === 'archana' ? it.invoked_name_translit : it.name_translit;
    const showOff = kind === 'archana' && !shared && !contained(it);
    const off = showOff && it.offering_deva ? it.offering_deva : '';
    const offEn = kind === 'archana' && it.offering_en && !shared ? it.offering_en : '';
    const bot =
      kind === 'archana' && it.botanical && !(shared && shared.botanical) ? it.botanical : '';
    return (
      `<td class="ln">${i}</td><td class="item">` +
      `<div class="deva">${br(name)}${off ? ` <span class="off">${e(off)}</span>` : ''}</div>` +
      `<div class="ta">${br(ta)}</div>` +
      `<div class="iast">${br(tr)}` +
      (offEn ? ` <span class="off">— ${e(offEn)}</span>` : '') +
      (bot ? ` <span class="bot">[${e(bot)}]</span>` : '') +
      `</div></td>`
    );
  };
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(
      '<tr>' +
        cell(items[i], i + 1) +
        (items[i + 1] ? cell(items[i + 1], i + 2) : '<td class="ln"></td><td class="item"></td>') +
        '</tr>',
    );
  }
  const head = shared
    ? `<p class="shared">` +
      (shared.deva
        ? `Every name below takes the same offering: <span class="deva">${e(shared.deva)}</span>`
        : `Every verse below ends with the refrain already printed in it`) +
      (shared.en ? ` <span class="off">— ${e(shared.en)}</span>` : '') +
      (shared.botanical ? ` <span class="bot">[${e(shared.botanical)}]</span>` : '') +
      `</p>`
    : '';
  return `${head}<table class="list"><tbody>${rows.join('')}</tbody></table>`;
}

function stepBlock(step, poojaId) {
  const a = byStep.get(step.id) ?? [];
  const nv = step.namavali_id ? (byNamavali.get(step.namavali_id) ?? []) : [];
  const qs = QUESTIONS[`${poojaId}::${step.step_title_en}`] ?? QUESTIONS[step.step_title_en] ?? [];

  const tags = [];
  if (step.phase) tags.push(e(step.phase));
  if (step.gender_rule && step.gender_rule !== 'all') tags.push(e(step.gender_rule));
  if (step.is_dynamic_sankalpam) tags.push('computed per day and place');
  if (nv.length) tags.push(`${nv.length} names`);
  if (a.length) tags.push(`${a.length} offerings`);

  let body = '';
  if (a.length) body += listTable(a, 'archana');
  else if (nv.length) body += listTable(nv, 'namavali');
  else body += mantraTable(step);

  if (step.is_dynamic_sankalpam) {
    body +=
      `<p class="note">The panchangam portion of this mantra is computed in the app for the ` +
      `day and place of use. What is stored, and printed above, is the fixed frame around it.</p>`;
  }

  return `
<section class="step" id="${e(poojaId)}-${step.step_number}">
  <h3>
    <span class="num">${step.step_number}</span>
    <span class="title">${e(step.step_title_en)}</span>
    ${step.step_title_ta ? `<span class="title-ta">${e(step.step_title_ta)}</span>` : ''}
  </h3>
  ${tags.length ? `<p class="tags">${tags.map((t) => `<span>${t}</span>`).join('')}</p>` : ''}
  ${step.instruction_en ? `<p class="instr">${e(step.instruction_en)}</p>` : ''}
  ${step.instruction_ta ? `<p class="instr ta">${e(step.instruction_ta)}</p>` : ''}
  ${body}
  ${step.meaning_en ? `<p class="meaning"><b>Meaning.</b> ${e(step.meaning_en)}</p>` : ''}
  ${
    step.variant_mantra_sanskrit
      ? `<p class="variant"><b>Variant.</b> <span class="deva">${e(step.variant_mantra_sanskrit)}</span>` +
        (step.variant_note_en ? ` — ${e(step.variant_note_en)}` : '') +
        `</p>`
      : ''
  }
  <p class="src"><b>Source.</b> ${step.source_ref ? e(step.source_ref) : '<span class="warn-inline">none recorded</span>'}</p>
  ${
    qs.length
      ? `<div class="question"><b>Open question for you</b>${qs
          .map((q) => `<p>${e(q)}</p>`)
          .join('')}</div>`
      : ''
  }
  <div class="verdict">
    <label><span class="box"></span> correct as printed</label>
    <label><span class="box"></span> needs change — line no. ____________</label>
  </div>
  <div class="ruled"><span class="ruled-label">Notes</span></div>
</section>`;
}

function appendix(poojaId) {
  const sam = samagri.filter((s) => s.pooja_id === poojaId).sort((a, b) => a.seq - b.seq);
  const nai = naivedyam
    .filter((s) => s.pooja_id === poojaId)
    .sort((a, b) => (a.tier === b.tier ? a.seq - b.seq : a.tier === 'primary' ? -1 : 1));
  if (!sam.length && !nai.length) return '';
  return `
<section class="step appendix">
  <h3><span class="num">A</span><span class="title">Samagri and naivedyam</span></h3>
  <p class="instr">The shopping list and the offerings, which a reviewer sees as a list of
  substitutions and permissions rather than as text to recite.</p>
  ${
    sam.length
      ? `<table class="plain"><thead><tr><th>#</th><th>Item</th><th>Tamil</th><th>Qty</th>
         <th>Required</th><th>Substitute</th></tr></thead><tbody>${sam
           .map(
             (s) =>
               `<tr><td class="ln">${s.seq}</td><td>${e(s.item_en)}</td>` +
               `<td class="ta">${e(s.item_ta)}</td><td>${e(s.quantity)}</td>` +
               `<td>${s.is_required ? 'yes' : 'no'}</td>` +
               `<td>${e(s.substitute_with ?? (s.is_substitutable ? 'any suitable' : '—'))}</td></tr>`,
           )
           .join('')}</tbody></table>`
      : ''
  }
  ${
    nai.length
      ? `<table class="plain"><thead><tr><th>Tier</th><th>Offering</th><th>Tamil</th>
         <th>Note</th></tr></thead><tbody>${nai
           .map(
             (n) =>
               `<tr><td>${e(n.tier)}</td><td>${e(n.name_en)}</td>` +
               `<td class="ta">${e(n.name_ta)}</td>` +
               `<td>${e(n.recipe_note ?? n.reason_en ?? '')}</td></tr>`,
           )
           .join('')}</tbody></table>`
      : ''
  }
  <div class="ruled"><span class="ruled-label">Notes</span></div>
</section>`;
}

function poojaSection(p) {
  const mine = steps
    .filter((s) => s.pooja_id === p.id)
    .sort((a, b) => a.step_number - b.step_number);
  const d = deity[p.deity_id];
  return `
<div class="pooja">
  <h2>${e(p.title_en)}${p.title_ta ? ` <span class="title-ta">${e(p.title_ta)}</span>` : ''}</h2>
  <p class="lede">${e(p.description_en)}</p>
  <p class="meta">${mine.length} steps${d ? ` · ${e(d.name_en)}` : ''}${
    p.duration_mins ? ` · about ${p.duration_mins} minutes` : ''
  }</p>
  ${mine.map((s) => stepBlock(s, p.id)).join('')}
  ${appendix(p.id)}
</div>`;
}

// Ganesha first: it is the shorter of the two and the one a reviewer is most
// likely to know by heart, so it is the cheapest place for them to calibrate
// how much detail this sheet wants from them.
const order = ['ganesha_standard', 'varalakshmi_vratham'];
const sorted = [...poojas].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

const stamp = new Date().toISOString().slice(0, 10);
const totalSteps = steps.length;
const noSource = steps.filter((s) => !s.source_ref).length;

/**
 * Whether the snapshot this sheet was taken from is itself clean.
 *
 * A reviewer is about to spend an evening on this, and the worst outcome is
 * that they mark up a printout of data that was already known to be wrong. So
 * the sheet says on its face if the live database still carries the carriage
 * returns 0023 removes -- they are invisible in the rendered lines, so nothing
 * else on the page would betray them.
 */
const crSteps = steps.filter((s) =>
  ['mantra_sanskrit', 'mantra_tamil', 'mantra_translit', 'instruction_en', 'instruction_ta'].some(
    (k) => typeof s[k] === 'string' && s[k].includes('\r'),
  ),
).length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pooja Vidhi — review sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  /* A4 with a wide right margin: the margin is where the corrections go. */
  @page { size: A4; margin: 14mm 14mm 16mm 14mm; }
  :root {
    --ink: #1a1613;
    --faint: #6b6259;
    --rule: #d9d2c8;
    --warn: #8a3324;
    --accent: #7a5c1e;
    --paper: #fffdf9;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Noto Serif', Georgia, serif;
    color: var(--ink); background: var(--paper);
    margin: 0 auto; max-width: 190mm; padding: 10mm;
    font-size: 10.5pt; line-height: 1.45;
  }
  .deva { font-family: 'Noto Sans Devanagari', serif; font-size: 12pt; line-height: 1.6; }
  .ta   { font-family: 'Noto Sans Tamil', serif; font-size: 11pt; line-height: 1.6; }
  .iast { font-family: 'Noto Serif', Georgia, serif; font-style: italic; }

  h1 { font-size: 20pt; margin: 0 0 2mm; }
  h2 { font-size: 15pt; margin: 0 0 1mm; border-bottom: 2px solid var(--ink); padding-bottom: 2mm; }
  h3 { font-size: 11.5pt; margin: 0 0 2mm; display: flex; align-items: baseline; gap: 3mm; }
  .num {
    font-variant-numeric: tabular-nums; font-weight: 600; color: var(--paper);
    background: var(--ink); border-radius: 2mm; padding: 0.5mm 2mm; font-size: 9.5pt;
    min-width: 7mm; text-align: center;
  }
  .title { font-weight: 600; }
  .title-ta { font-family: 'Noto Sans Tamil', serif; font-weight: 400; color: var(--faint); font-size: 10pt; }

  .lede { margin: 2mm 0; }
  .meta, .tags { color: var(--faint); font-size: 9pt; margin: 1mm 0 2mm; }
  .tags span { border: 1px solid var(--rule); border-radius: 2mm; padding: 0.3mm 1.6mm; margin-right: 1.5mm; }
  .instr { margin: 1.5mm 0; }
  .instr.ta { color: var(--faint); }
  .note, .src, .meaning, .variant { font-size: 9pt; color: var(--faint); margin: 1.5mm 0 0; }
  .meaning, .variant { color: var(--ink); }

  table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
  th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em;
       color: var(--faint); font-weight: 600; border-bottom: 1px solid var(--rule); padding: 1mm; }
  td { vertical-align: top; padding: 1.2mm 1mm; border-bottom: 1px solid #f0ebe3; }
  td.ln, th.ln { width: 7mm; text-align: right; color: var(--faint);
                 font-variant-numeric: tabular-nums; font-size: 8.5pt; }
  table.mantra td:nth-child(2) { width: 32%; }
  table.mantra td:nth-child(3) { width: 30%; }
  table.list td.item { width: 43%; }
  .off { color: var(--accent); }
  .bot { color: var(--faint); font-size: 8.5pt; }

  .warn { color: var(--warn); font-size: 9pt; margin: 1.5mm 0; font-weight: 600; }
  .warn-inline { color: var(--warn); font-weight: 600; }

  .question {
    border-left: 3px solid var(--accent); background: #fbf6ea;
    padding: 2mm 3mm; margin: 2.5mm 0; font-size: 9.5pt;
  }
  .question b { color: var(--accent); }
  .question p { margin: 1mm 0 0; }

  .shared { font-size: 9.5pt; margin: 2mm 0 1mm; padding: 1.5mm 2mm;
            background: #f5f1e8; border-radius: 1mm; }
  .shared .deva { font-size: 11pt; }

  .verdict { display: flex; gap: 8mm; font-size: 9pt; margin: 2.5mm 0 1.5mm; color: var(--faint); }
  .verdict .box { display: inline-block; width: 3.5mm; height: 3.5mm; border: 1px solid var(--ink);
                  vertical-align: -0.5mm; margin-right: 1.5mm; }

  /* Ruled space, because a reviewer with no room to write writes nothing. */
  .ruled { position: relative; height: 16mm; margin: 5mm 0 3mm;
           background-image: repeating-linear-gradient(
             to bottom, transparent 0, transparent 7mm, var(--rule) 7mm, var(--rule) 7.15mm); }
  .ruled-label { position: absolute; top: -3.2mm; left: 0; font-size: 7.5pt;
                 color: var(--faint); background: var(--paper); padding-right: 2mm; }

  .step { padding: 3mm 0 0; border-top: 1px solid var(--rule); margin-top: 4mm; }
  .how { border: 1px solid var(--ink); padding: 4mm; margin: 4mm 0; }
  .how h4 { margin: 0 0 2mm; font-size: 11pt; }
  .how ol { margin: 0; padding-left: 5mm; }
  .how li { margin-bottom: 1.5mm; }

  @media print {
    body { max-width: none; padding: 0; background: #fff; }
    .step { break-inside: avoid; }
    .question, .verdict, .ruled, table.mantra { break-inside: avoid; }
    .pooja { break-before: page; }
    .pooja:first-of-type { break-before: auto; }
    thead { display: table-header-group; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>

<h1>Pooja Vidhi — review sheet</h1>
<p class="meta">Generated ${stamp} from the live database · ${totalSteps} steps across
${poojas.length} poojas${noSource ? ` · <span class="warn-inline">${noSource} step(s) with no source recorded</span>` : ''}</p>
${
  crSteps
    ? `<p class="warn">This snapshot was taken before migration 0023 was applied: ${crSteps} step(s)
       still carry carriage returns from the SQL editor. They do not change what is printed below,
       but run 0023 and regenerate before handing this to anyone, so that what is marked up and
       what is in the database are the same thing.</p>`
    : ''
}

<div class="how">
  <h4>What is being asked of you</h4>
  <p>Every mantra in this app was taken from a published text rather than typed from memory, and
  each one prints its source below it. What has <i>not</i> happened is anyone who knows the
  liturgy reading it end to end. That is this sheet.</p>
  <ol>
    <li><b>The line numbers are addresses.</b> Mark a correction against a step number and a line
    number and it can be applied exactly. "The camphor one, near the end" cannot.</li>
    <li><b>The three columns should say the same thing.</b> The Tamil and the transliteration are
    generated from the Sanskrit, so a place where they have drifted is a bug worth more than a
    wording preference.</li>
    <li><b>The instruction prose in Tamil is this project's own drafting</b>, not published text.
    It is the least reviewed thing here. Please read it as sceptically as the mantras.</li>
    <li><b>Shaded boxes are specific questions</b> where the sources disagreed or ran out, and an
    answer changes what ships. They matter more than a general impression.</li>
    <li><b>Sequence is as much the point as wording.</b> If a step is in the wrong place, or one
    is missing entirely, say so — a missing step is invisible on a page of present ones.</li>
  </ol>
</div>

${sorted.map(poojaSection).join('')}

<section class="step">
  <h3><span class="num">?</span><span class="title">Anything not asked about above</span></h3>
  <p class="instr">Omissions especially: a step that should exist and does not, an order that is
  wrong, a practice that belongs to a different sampradaya than the Tamil Smartha one this is
  written for.</p>
  <div class="ruled" style="height:45mm"><span class="ruled-label">Notes</span></div>
  <p class="meta">Reviewed by ____________________________  Date ______________</p>
</section>

</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);

const withQ = steps.filter(
  (s) => QUESTIONS[`${s.pooja_id}::${s.step_title_en}`] ?? QUESTIONS[s.step_title_en],
).length;
console.log(`wrote ${OUT}`);
console.log(`  ${totalSteps} steps, ${archana.length} archana items, ${namavali.length} namavali names`);
console.log(`  ${withQ} step(s) carry an open question`);
if (noSource) console.log(`  WARNING: ${noSource} step(s) have no source_ref`);
if (crSteps) {
  console.log(`  WARNING: ${crSteps} step(s) still carry carriage returns -- apply 0023 and re-run`);
}
