#!/usr/bin/env node
/**
 * Four defects 0037 shipped, which proofread caught and the harness did not.
 *
 *   node scripts/build-nitya-repair.mjs          # validate
 *   node scripts/build-nitya-repair.mjs --emit   # write it
 *
 * WHY THE HARNESS MISSED ALL FOUR. Its assertions for 0037 counted things: 39
 * steps, 5 avahanams, 5 archanas, 17 tarpanam rows, no ASCII colon. Every count
 * was right. proofread looks at what is IN the rows, and found:
 *
 *   1. THE TARPANAM STORED ROW NUMBERS AS DEITY NAMES. The transcript table is
 *      [No., Name, Verb] and the generator destructured it as [name, verb], so
 *      seq 1 was invoked as "1" and offered "ओं भवं देवं". All seventeen rows.
 *      The harness asserted there were seventeen of them, which there were.
 *
 *   2. "(Morning)" LEAKED INTO A MANTRA. The transcript keeps the book's own
 *      labels inside the Devanagari line, which is right for a transcription and
 *      wrong for a field that gets transliterated -- Sanscript would render the
 *      English. The label belongs in variant_note_en, which already carries it.
 *
 *   3. THE SANKALPAM KEPT THE BOOK'S BLANKS. The book prints *...नाम संवत्सरे
 *      with an asterisk for the reader to fill from an almanac. The app fills it
 *      from the panchangam through [DYNAMIC_PANCHANGAM_DATA]. Copying the book
 *      literally left a step that asks the user to consult a book the app exists
 *      to replace.
 *
 *   4. NO SAMAGRI AND NO NAIVEDYAM. Simply not written.
 *
 * The lesson is the same one the anga pooja meaning taught: a count is not a
 * check. Both gates were needed and only one of them was mine.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/2-nitya/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri), pp.27-51';
const POOJA = 'nitya_panchayatana';

const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  if (d.quality !== 'duplicate') byPage[d.book_page] = d;
}
const blk = (p, i) => byPage[p].blocks[i];
/** Strip the book's own English labels, which belong in a note, not a mantra. */
const clean = (s) => s.replace(/\s*\((Morning|Evening)\)\s*/g, '').replace(/[ \t]+$/gm, '').trim();
const deva = (p, ...idx) => idx.map((i) => clean(blk(p, i).lines.join('\n'))).join('\n');
const rows = (p, i) => blk(p, i).rows;
const scripts = (d) => ({
  deva: d,
  ta: transliterate(Sanscript, d, 'tamil'),
  iast: transliterate(Sanscript, d, 'iast'),
});

// --- 1. the tarpanam, destructured correctly this time ----------------------
// columns are ['No.', 'Name', 'Verb'] -- the first cell is the printed number.
const TARPANA = [...rows('47', 7), ...rows('48', 1)].map(([no, name, verb]) => ({
  no, name: name.replace(/^ओं\s*/, 'ॐ '), verb,
}));

// --- 2. the naivedyam, with the labels stripped ------------------------------
const NAIVEDYAM_MANTRA = deva('41', 7, 10, 13, 18) + '\n' + deva('42', 1, 3, 4, 7);
const NAIVEDYAM_VARIANT = deva('41', 15);

// --- 3. the sankalpam, on the app's dynamic frame ----------------------------
// The cosmological opening is the shared one the other two poojas already use;
// only the purpose clause is this rite's own, and it is the book's (p.28).
const SANKALPAM = [
  'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे',
  'वैवस्वत मन्वन्तरे अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे',
  'भरतवर्षे भरतखण्डे मेरोः दक्षिणे पार्श्वे अस्मिन् वर्तमाने व्यावहारिके',
  '[DYNAMIC_PANCHANGAM_DATA]',
  'ममोपात्त समस्त दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं,',
  'अस्माकं सहकुटुम्बानां क्षेमस्थैर्यवीर्य विजय आयुरारोग्य',
  'ऐश्वर्याणां अभिवृद्ध्यर्थं, समस्त मङ्गलावाप्त्यर्थं,',
  'समस्त दुरितोपशान्त्यर्थं, अचञ्चल निष्कपटभक्ति सिद्ध्यर्थं',
  'सपरिवार सांबपरमेश्वर चरणारविन्दयोः यथाशक्ति',
  'ध्यानावाहनादि षोडशोपचारैः श्री पञ्चायतन देवतानां पूजनं अहं करिष्ये ।',
].join('\n');

// --- 4. samagri and naivedyam ------------------------------------------------
const SAMAGRI = [
  ['Shiva linga', 'சிவலிங்கம்', '1', 'core', true],
  ['Shalagrama for Vishnu', 'விஷ்ணுவுக்கு ஶாலக்ராமம்', '1', 'core', true],
  ['Sphatika (crystal) for Surya', 'சூரியனுக்கு ஸ்படிகம்', '1', 'core', true],
  ['Shonabhadra (red stone) for Vinayaka', 'விநாயகருக்கு ஶோணபத்ரம்', '1', 'core', true],
  ['Image for Devi, silver if possible', 'தேவிக்கு பிம்பம் (முடிந்தால் வெள்ளி)', '1', 'core', true],
  ['Pancha pathram and uddharani', 'பஞ்ச பாத்திரம் & உத்தரிணி', '1 set', 'vessel', true],
  ['Conch on a stand', 'சங்கு (பீடத்துடன்)', '1', 'vessel', false],
  ['Mani (pooja bell) with Nandi on it', 'மணி (நந்தியுடன்)', '1', 'vessel', true],
  ['Copper plate for the nirmalya bali', 'நிர்மால்ய பலிக்கு செம்புத் தட்டு', '1', 'vessel', true],
  ['Karpoora thattu', 'கற்பூரத் தட்டு', '1', 'vessel', true],
  ['Chandanam', 'சந்தனம்', null, 'offering', true],
  ['Kumkumam', 'குங்குமம்', null, 'offering', true],
  ['Akshadai', 'அக்ஷதை', null, 'offering', true],
  ['Manjal powder', 'மஞ்சள் தூள்', null, 'offering', true],
  ['Agarbatti and karpooram', 'ஊதுபத்தி & கற்பூரம்', null, 'offering', true],
  ['Ghee for the lamp', 'தீபத்திற்கு நெய்', null, 'offering', true],
  ['Vetrilai and paakku', 'வெற்றிலை & பாக்கு', null, 'offering', true],
  ['Doorvai (arugampul), for Vinayaka', 'அருகம்புல் (விநாயகருக்கு)', 'a bunch', 'leaf', false],
  ['Thulasi, for Vishnu', 'துளசி (விஷ்ணுவுக்கு)', 'a few', 'leaf', false],
  ['Bilvam, for Shiva', 'வில்வம் (சிவனுக்கு)', 'a few', 'leaf', false],
  ['Thamarai poo, for Surya', 'தாமரைப் பூ (சூரியனுக்கு)', 'a few', 'flower', false],
  ['Red aparajita, for Devi', 'சிவப்பு அபராஜிதா (தேவிக்கு)', 'a few', 'flower', false],
  ['Udiri pushpam (loose flowers)', 'உதிரி புஷ்பம்', null, 'flower', true],
];

// The book's own naivedya list, p.42.
const NAIVEDYAM = [
  ['primary', 'Shaalyannam (cooked rice)', 'சாலியன்னம் (சாதம்)', 'Plain cooked white rice, the first of the book\u2019s list.'],
  ['primary', 'Ghrita-gula payasam', 'நெய் வெல்லப் பாயசம்', 'Payasam with ghee and jaggery.'],
  ['primary', 'Ksheeram (milk)', 'பால்', 'Offered at the prana pratishtha as well as here.'],
  ['secondary', 'Maashaapoopam (ulundhu vadai)', 'உளுந்து வடை', 'Black gram vada.'],
  ['secondary', 'Gudaapoopam (appam)', 'அப்பம்', 'Sweet appam.'],
  ['secondary', 'Chitrannam', 'சித்ரான்னம்', 'Mixed rice. The daily list has this where the Varalakshmi list does not.'],
  ['secondary', 'Laddukam', 'லட்டு', null],
  ['secondary', 'Modakam (kozhukattai)', 'கொழுக்கட்டை', null],
  ['secondary', 'Naarikela khanda dvayam', 'தேங்காய் (இரு பாதி)', 'A coconut broken into two halves.'],
  ['secondary', 'Kadaliphalam (banana)', 'வாழைப்பழம்', null],
];

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- 1. the tarpanam, read from the right columns ---');
if (TARPANA.length !== 17) fail(`${TARPANA.length} rows, expected 17`);
for (const t of TARPANA) {
  if (!/[\u0900-\u097F]/.test(t.name)) fail(`row ${t.no}: the name is not Devanagari ("${t.name}")`);
  if (!/[\u0900-\u097F]/.test(t.verb)) fail(`row ${t.no}: the verb is not Devanagari`);
  if (/^\d+$/.test(t.name)) fail(`row ${t.no}: the name is a row NUMBER -- the columns are still misread`);
}
console.log(`  ${TARPANA.length} rows; 1 = ${TARPANA[0].name} ${TARPANA[0].verb}; 17 = ${TARPANA[16].name} ${TARPANA[16].verb}`);

console.log('\n--- 2. no English left in any mantra ---');
for (const [label, txt] of [['naivedyam', NAIVEDYAM_MANTRA], ['variant', NAIVEDYAM_VARIANT], ['sankalpam', SANKALPAM]]) {
  const stripped = txt.replace(/\[DYNAMIC_PANCHANGAM_DATA\]/g, '');
  if (/[A-Za-z]/.test(stripped)) fail(`${label} still contains Latin letters: ${stripped.match(/[A-Za-z]+/)[0]}`);
  else console.log(`  ${label.padEnd(10)} clean`);
}

console.log('\n--- 3. the sankalpam is on the dynamic frame, not the book blanks ---');
if (!SANKALPAM.includes('[DYNAMIC_PANCHANGAM_DATA]')) fail('no dynamic slot');
if (/\*|\.\.\.|…/.test(SANKALPAM)) fail('the book\u2019s asterisk blanks are still in it');
if (!SANKALPAM.includes('अचञ्चल')) fail('the purpose clause of the daily rite is missing');
console.log('  dynamic slot present, no blanks, purpose clause achanchala niSHkapaTa bhakti');

console.log('\n--- 4. samagri and naivedyam ---');
if (!SAMAGRI.length) fail('no samagri');
if (!NAIVEDYAM.some((n) => n[0] === 'primary')) fail('no primary naivedyam');
console.log(`  ${SAMAGRI.length} samagri items, ${NAIVEDYAM.length} naivedyam (${NAIVEDYAM.filter((n) => n[0] === 'primary').length} primary)`);

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit ---------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);
const STEP = (t) => `(select id from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = ${q(t)})`;

out('-- =============================================================================');
out('-- 0039_nitya_repair.sql');
out('--');
out('-- GENERATED by scripts/build-nitya-repair.mjs. Do not hand-edit.');
out('--');
out('-- Four defects 0037 shipped. proofread caught all four; the harness caught none');
out('-- of them, because its assertions COUNTED rows and these are faults INSIDE the');
out('-- rows. A count is not a check.');
out('--');
out('--   1. The Deva Tarpanam stored row NUMBERS as deity names. The transcript');
out('--      table is [No., Name, Verb] and the generator read it as [name, verb], so');
out('--      seq 1 was invoked as "1". All seventeen rows -- and the harness asserted');
out('--      there were seventeen of them, which there were.');
out('--   2. "(Morning)" leaked into a mantra. The transcript keeps the book-s own');
out('--      labels inside the Devanagari, which is right for a transcription and');
out('--      wrong for a field that gets transliterated. The label belongs in');
out('--      variant_note_en, where it already is.');
out('--   3. The Sankalpam kept the book-s asterisk blanks instead of the app-s');
out('--      [DYNAMIC_PANCHANGAM_DATA]. It asked the user to consult an almanac the');
out('--      app exists to consult for them.');
out('--   4. No samagri and no naivedyam were written at all.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 1. the tarpanam names ----------------------------------------------------');
TARPANA.forEach((t, i) => {
  const n = scripts(t.name);
  const v = scripts(t.verb);
  out('update public.archana_items set');
  out(`       invoked_name_deva     = ${q(n.deva)},`);
  out(`       invoked_name_ta       = ${q(n.ta)},`);
  out(`       invoked_name_translit = ${q(n.iast)},`);
  out(`       offering_deva         = ${q(v.deva)},`);
  out(`       offering_ta           = ${q(v.ta)}`);
  out(` where seq = ${i + 1} and pooja_step_id = ${STEP('Deva Tarpanam')};`);
});
out();

out('-- --- 2. the naivedyam mantra, without the English labels ---------------------');
{
  const m = scripts(NAIVEDYAM_MANTRA);
  const v = scripts(NAIVEDYAM_VARIANT);
  out('update public.pooja_steps set');
  out(`       mantra_sanskrit         = ${q(m.deva)},`);
  out(`       mantra_tamil            = ${q(m.ta)},`);
  out(`       mantra_translit         = ${q(m.iast)},`);
  out(`       variant_mantra_sanskrit = ${q(v.deva)},`);
  out('       updated_at              = now()');
  out(` where pooja_id = ${q(POOJA)} and step_title_en = 'Naivedyam';`);
  out();
}

out('-- --- 3. the sankalpam on the dynamic frame -----------------------------------');
{
  const s = scripts(SANKALPAM);
  out('update public.pooja_steps set');
  out(`       mantra_sanskrit      = ${q(s.deva)},`);
  out(`       mantra_tamil         = ${q(s.ta)},`);
  out(`       mantra_translit      = ${q(s.iast)},`);
  out('       is_dynamic_sankalpam = true,');
  out('       updated_at           = now()');
  out(` where pooja_id = ${q(POOJA)} and step_title_en = 'Sankalpam';`);
  out();
}

out('-- --- 4. samagri and naivedyam --------------------------------------------------');
SAMAGRI.forEach(([en, ta, qty, cat, req], i) => {
  out('insert into public.samagri_items (pooja_id, seq, item_en, item_ta, quantity, category, is_required)');
  out(`values (${q(POOJA)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(qty)}, ${q(cat)}, ${req})`);
  out('on conflict do nothing;');
});
out();
NAIVEDYAM.forEach(([tier, en, ta, note], i) => {
  out('insert into public.naivedyam_items (pooja_id, tier, seq, name_en, name_ta, recipe_note)');
  out(`values (${q(POOJA)}, ${q(tier)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(note)})`);
  out('on conflict do nothing;');
});
out();

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- No tarpanam row may be invoked by a number.');
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = 'Deva Tarpanam'`);
out("     and a.invoked_name_deva ~ '^[0-9]+$';");
out("  if n > 0 then raise exception '% tarpanam rows are still invoked by a number', n; end if;");
out();
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = 'Deva Tarpanam'`);
out("     and a.invoked_name_deva ~ '[\\u0900-\\u097F]';");
out("  if n <> 17 then raise exception 'only % of 17 tarpanam rows have a Devanagari name', n; end if;");
out();
out('  -- No Latin in any nitya mantra, apart from the dynamic slot.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and replace(coalesce(mantra_sanskrit, ''), '[DYNAMIC_PANCHANGAM_DATA]', '') ~ '[A-Za-z]';");
out("  if n > 0 then raise exception '% nitya mantras still contain Latin letters', n; end if;");
out();
out('  -- The sankalpam is dynamic and carries no leftover blanks.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en = 'Sankalpam'`);
out("     and is_dynamic_sankalpam and mantra_sanskrit like '%[DYNAMIC_PANCHANGAM_DATA]%'");
out("     and mantra_sanskrit not like '%*%';");
out("  if n <> 1 then raise exception 'the nitya sankalpam is not on the dynamic frame'; end if;");
out();
out('  -- Samagri and naivedyam exist, with at least one primary.');
out(`  select count(*) into n from public.samagri_items where pooja_id = ${q(POOJA)};`);
out("  if n < 1 then raise exception 'nitya has no samagri'; end if;");
out(`  select count(*) into n from public.naivedyam_items where pooja_id = ${q(POOJA)} and tier = 'primary';`);
out("  if n < 1 then raise exception 'nitya has no primary naivedyam'; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0039_nitya_repair.sql', sql);
  console.log('\nwrote supabase/migrations/0039_nitya_repair.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
