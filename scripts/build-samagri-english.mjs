#!/usr/bin/env node
/**
 * Make the English column English, and take two things off the shopping list
 * that were never shopping.
 *
 *   node scripts/build-samagri-english.mjs          # validate
 *   node scripts/build-samagri-english.mjs --emit   # write it
 *
 * THE ENGLISH COLUMN WAS OFTEN NOT ENGLISH. samagri_items has item_en and
 * item_ta, and item_ta is proper Tamil script -- so item_en is the column that
 * has to answer "what am I actually buying". For about half the rows it did
 * not: it was the Tamil or Sanskrit word in roman letters. "Chandanam".
 * "Akshadai". "Vetrilai". "Bilvam". Someone who reads English and does not
 * already know the rite gets a list of words they cannot shop with, which is
 * precisely the reader this app is for -- and the appearance of a translation
 * is worse than an obvious gap, because there is nothing to click.
 *
 * THE CONVENTION IS ALREADY IN THE DATA. Twenty-seven of ninety rows do this
 * properly already -- "Mani (pooja bell)", "Vilakku (lamp)", "Udiri pushpam
 * (loose flowers)" -- so this follows that rather than inventing a format: the
 * traditional name first, because that is what you say in the shop and what
 * every other source calls it, and the English in brackets after it. Nothing
 * is renamed and nothing is dropped; a gloss is added where one was missing.
 *
 * SANDHYAVANDANAM KEPT ITS GLOSSES IN THE WRONG COLUMN. "Uddharani (Aachamani)"
 * with quantity "1 — the spoon"; "Upavastram (uttareeyam)" with "1 — the upper
 * cloth". The English existed but sat in the quantity field, so the item list
 * read as pure transliteration and the quantity column read as a glossary. The
 * gloss moves to item_en where it belongs and the quantity goes back to being a
 * quantity.
 *
 * AND TWO ITEMS THAT ARE NOT SAMAGRI. "A recording of the mantras" and "A
 * printed sandhyavandanam text (or this app)" are learning aids, not ritual
 * material -- you cannot forget to bring them and have to stop. A checklist
 * that includes the checklist is also faintly silly. Both were optional, so
 * nothing required is lost.
 */
import { emitMigration } from './_migration.mjs';

/**
 * [pooja, seq, the English gloss to add]. Keyed on seq because that is stable
 * and short; the migration asserts the row it is about to change still says
 * what this table thinks it says, so a production row that has moved on fails
 * loudly rather than being silently overwritten.
 */
const GLOSS = [
  // --- ganesha_standard ---
  ['ganesha_standard', 1, 'Pancha pathram and uddharani', 'Pancha pathram and uddharani (water vessel and spoon)'],
  ['ganesha_standard', 6, 'Clay or turmeric Pillaiyar', 'Clay or turmeric Pillaiyar (the Ganesha idol)'],
  ['ganesha_standard', 7, 'Vasthram for Ganapati', 'Vasthram for Ganapati (a cloth for the idol)'],
  ['ganesha_standard', 8, 'Poonal, a single one for Ganapati', 'Poonal, a single one for Ganapati (sacred thread)'],
  ['ganesha_standard', 10, 'Manjal powder', 'Manjal (turmeric) powder'],
  ['ganesha_standard', 11, 'Chandanam', 'Chandanam (sandalwood paste)'],
  ['ganesha_standard', 12, 'Kumkumam', 'Kumkumam (vermilion)'],
  ['ganesha_standard', 13, 'Akshadai', 'Akshadai (rice with turmeric)'],
  ['ganesha_standard', 14, 'Panchamirtham', 'Panchamirtham (the five-food mixture)'],
  ['ganesha_standard', 15, 'Agarbatti', 'Agarbatti (incense sticks)'],
  ['ganesha_standard', 16, 'Kalpooram', 'Kalpooram (camphor)'],
  ['ganesha_standard', 18, 'Til oil for the lamp', 'Til (sesame) oil for the lamp'],
  ['ganesha_standard', 20, 'Vetrilai', 'Vetrilai (betel leaves)'],
  ['ganesha_standard', 21, 'Paakku', 'Paakku (areca nut)'],
  ['ganesha_standard', 26, 'Maalai', 'Maalai (flower garland)'],
  ['ganesha_standard', 27, 'Thoduttha pushpam', 'Thoduttha pushpam (strung flowers)'],
  ['ganesha_standard', 28, 'Arugampul', 'Arugampul (durva grass)'],
  ['ganesha_standard', 30, 'Thulasi', 'Thulasi (holy basil)'],
  ['ganesha_standard', 31, 'Bilvam', 'Bilvam (bael leaves)'],

  // --- nitya_panchayatana ---
  ['nitya_panchayatana', 2, 'Shalagrama for Vishnu', 'Shalagrama for Vishnu (the sacred stone)'],
  ['nitya_panchayatana', 6, 'Pancha pathram and uddharani', 'Pancha pathram and uddharani (water vessel and spoon)'],
  ['nitya_panchayatana', 10, 'Karpoora thattu', 'Karpoora thattu (camphor tray)'],
  ['nitya_panchayatana', 11, 'Chandanam', 'Chandanam (sandalwood paste)'],
  ['nitya_panchayatana', 12, 'Kumkumam', 'Kumkumam (vermilion)'],
  ['nitya_panchayatana', 13, 'Akshadai', 'Akshadai (rice with turmeric)'],
  ['nitya_panchayatana', 14, 'Manjal powder', 'Manjal (turmeric) powder'],
  ['nitya_panchayatana', 15, 'Agarbatti and karpooram', 'Agarbatti and karpooram (incense sticks and camphor)'],
  ['nitya_panchayatana', 17, 'Vetrilai and paakku', 'Vetrilai and paakku (betel leaves and areca nut)'],
  // Two transliterations of the SAME grass, which told the reader nothing twice.
  ['nitya_panchayatana', 18, 'Doorvai (arugampul), for Vinayaka', 'Doorvai or arugampul (durva grass), for Vinayaka'],
  ['nitya_panchayatana', 19, 'Thulasi, for Vishnu', 'Thulasi (holy basil), for Vishnu'],
  ['nitya_panchayatana', 20, 'Bilvam, for Shiva', 'Bilvam (bael leaves), for Shiva'],
  ['nitya_panchayatana', 21, 'Thamarai poo, for Surya', 'Thamarai poo (lotus), for Surya'],
  ['nitya_panchayatana', 22, 'Red aparajita, for Devi', 'Red aparajita (butterfly pea), for Devi'],

  // --- sandhyavandanam ---
  ['sandhyavandanam', 1, 'Panchapatram', 'Panchapatram (the water vessel)'],
  ['sandhyavandanam', 2, 'Uddharani (Aachamani)', 'Uddharani (the spoon water is sipped from)'],
  ['sandhyavandanam', 3, 'Theertha patram (thambalam)', 'Theertha patram (the broad plate)'],
  ['sandhyavandanam', 4, 'Aasanam', 'Aasanam (the seat)'],
  ['sandhyavandanam', 5, 'Jalapatram', 'Jalapatram (vessel for the spare water)'],
  ['sandhyavandanam', 6, 'Yajnopaveetam (poonal)', 'Yajnopaveetam (the sacred thread)'],
  ['sandhyavandanam', 8, 'Upavastram (uttareeyam)', 'Upavastram (the upper cloth)'],

  // --- varalakshmi_vratham ---
  ['varalakshmi_vratham', 1, 'Kalasham with a Lakshmi face', 'Kalasham (the pot) with a Lakshmi face'],
  ['varalakshmi_vratham', 2, 'Pancha pathram and uddharani', 'Pancha pathram and uddharani (water vessel and spoon)'],
  ['varalakshmi_vratham', 6, 'Karpoora thattu', 'Karpoora thattu (camphor tray)'],
  ['varalakshmi_vratham', 7, 'Eka aarathi and pancha aarathi', 'Eka aarathi and pancha aarathi (single-wick and five-wick camphor lamps)'],
  ['varalakshmi_vratham', 8, 'Nonbu sharadu, nine strands with nine knots', 'Nonbu sharadu (the vow thread), nine strands with nine knots'],
  ['varalakshmi_vratham', 9, 'Chandanam', 'Chandanam (sandalwood paste)'],
  ['varalakshmi_vratham', 10, 'Kumkumam', 'Kumkumam (vermilion)'],
  ['varalakshmi_vratham', 11, 'Akshadai', 'Akshadai (rice with turmeric)'],
  ['varalakshmi_vratham', 12, 'Manjal powder', 'Manjal (turmeric) powder'],
  ['varalakshmi_vratham', 13, 'Agarbatti and karpooram', 'Agarbatti and karpooram (incense sticks and camphor)'],
  ['varalakshmi_vratham', 14, 'Thamarai poo', 'Thamarai poo (lotus flowers)'],
  ['varalakshmi_vratham', 16, 'Thazam poo', 'Thazam poo (screwpine flower)'],
  ['varalakshmi_vratham', 17, 'Maalai or kadambam', 'Maalai or kadambam (flower garland)'],
  ['varalakshmi_vratham', 18, 'Doorvai (arugampul) and thulasi', 'Doorvai (durva grass) and thulasi (holy basil)'],
  ['varalakshmi_vratham', 19, 'Bilvam', 'Bilvam (bael leaves)'],
  ['varalakshmi_vratham', 20, 'Vetrilai and paakku', 'Vetrilai and paakku (betel leaves and areca nut)'],
];

/**
 * Quantities that were carrying a gloss instead of a quantity. The gloss has
 * moved into item_en above; what is left here is the number.
 */
const QUANTITY = [
  ['sandhyavandanam', 2, '1 — the spoon', '1'],
  ['sandhyavandanam', 5, '1 — for the spare water', '1'],
  ['sandhyavandanam', 6, '1 — the sacred thread', '1'],
  ['sandhyavandanam', 8, '1 — the upper cloth', '1'],
];

/** Not ritual material. Both optional, so nothing required is lost. */
const DROP = [
  ['sandhyavandanam', 9, 'A recording of the mantras'],
  ['sandhyavandanam', 10, 'A printed sandhyavandanam text'],
];

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

const seen = new Set();
for (const [p, seq, from, to] of GLOSS) {
  const k = `${p}/${seq}`;
  if (seen.has(k)) fail(`${k} appears twice`);
  seen.add(k);
  if (from === to) fail(`${k} is unchanged`);
  // The gloss must ADD to the name rather than replace it. This is the project
  // rule in miniature: the traditional word is what the reader says in the shop
  // and what every other source calls it, so losing it to gain English would
  // trade one unusable list for another.
  const kept = from.replace(/\s*\([^()]*\)/g, '').replace(/,.*$/, '').trim().split(/\s+/)[0];
  if (kept && !to.toLowerCase().includes(kept.toLowerCase())) {
    fail(`${k}: "${to}" drops the name "${kept}"`);
  }
  if (!/\(/.test(to)) fail(`${k}: "${to}" still has no English in brackets`);
}
for (const [p, seq] of DROP) {
  if (seen.has(`${p}/${seq}`)) fail(`${p}/${seq} is both glossed and dropped`);
}
for (const [p, seq, , to] of QUANTITY) {
  if (!/^\d/.test(to)) fail(`${p}/${seq}: quantity "${to}" does not start with a number`);
}

console.log('--- what this changes ---');
const byPooja = {};
for (const [p] of GLOSS) byPooja[p] = (byPooja[p] ?? 0) + 1;
for (const [p, n] of Object.entries(byPooja)) console.log(`  ${p.padEnd(22)} ${n} item(s) gain an English gloss`);
console.log(`  ${QUANTITY.length} quantity field(s) stop being a glossary`);
console.log(`  ${DROP.length} item(s) removed: ${DROP.map((d) => d[2]).join('; ')}`);
if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit --------------------------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const L = [];
const o = (s = '') => L.push(s);

o('-- =============================================================================');
o('-- 0053_samagri_in_english.sql');
o('--');
o('-- GENERATED by scripts/build-samagri-english.mjs. Do not hand-edit.');
o('--');
o('-- THE ENGLISH COLUMN WAS OFTEN NOT ENGLISH. samagri_items has item_en and');
o('-- item_ta; item_ta is proper Tamil script, so item_en is the column that has');
o('-- to answer "what am I actually buying". For about half the rows it did not --');
o('-- it was the Tamil or Sanskrit word in roman letters. Chandanam. Akshadai.');
o('-- Vetrilai. Bilvam. A reader who does not already know the rite got a list of');
o('-- words they cannot shop with, which is exactly the reader this app is for,');
o('-- and the appearance of a translation is worse than an obvious gap because');
o('-- there is nothing to click.');
o('--');
o('-- THE CONVENTION IS ALREADY IN THE DATA. 27 of 90 rows do this properly --');
o('-- "Mani (pooja bell)", "Vilakku (lamp)" -- so this follows that rather than');
o('-- inventing a format. Traditional name first, because that is what you say in');
o('-- the shop and what every other source calls it; English in brackets after.');
o('-- Nothing is renamed, nothing is dropped, a gloss is added where none was.');
o('--');
o('-- SANDHYAVANDANAM KEPT ITS GLOSSES IN THE WRONG COLUMN: "Uddharani');
o('-- (Aachamani)" with quantity "1 - the spoon". The English existed but sat in');
o('-- the quantity field, so the item list read as transliteration and the');
o('-- quantity column read as a glossary. Both go back to their own jobs.');
o('--');
o('-- AND TWO ITEMS THAT ARE NOT SAMAGRI: a recording of the mantras, and a');
o('-- printed text "or this app". Learning aids, not ritual material -- you cannot');
o('-- forget to bring them and have to stop -- and a checklist listing itself is');
o('-- faintly silly. Both were optional, so nothing required is lost.');
o('-- =============================================================================');
o();
o('begin;');
o();
o('-- Every change below asserts the row still says what the generator thought it');
o('-- said. An UPDATE whose WHERE matches nothing is the quietest failure there');
o('-- is: it reports success, changes nothing, and the next person reads the');
o('-- migration rather than the table and believes it.');
o('do $$');
o('declare n int;');
o('begin');
for (const [p, seq, from] of GLOSS) {
  o(`  select count(*) into n from public.samagri_items where pooja_id = ${q(p)} and seq = ${seq} and item_en = ${q(from)};`);
  o(`  if n <> 1 then raise exception '${p}/${seq} does not read %', ${q(from)}; end if;`);
}
for (const [p, seq, from] of QUANTITY) {
  o(`  select count(*) into n from public.samagri_items where pooja_id = ${q(p)} and seq = ${seq} and quantity = ${q(from)};`);
  o(`  if n <> 1 then raise exception '${p}/${seq} quantity does not read %', ${q(from)}; end if;`);
}
for (const [p, seq, from] of DROP) {
  o(`  select count(*) into n from public.samagri_items where pooja_id = ${q(p)} and seq = ${seq} and item_en = ${q(from)};`);
  o(`  if n <> 1 then raise exception '${p}/${seq} does not read %', ${q(from)}; end if;`);
}
o('end $$;');
o();

o('-- --- the English the list was missing ----------------------------------------');
for (const [p, seq, , to] of GLOSS) {
  o(`update public.samagri_items set item_en = ${q(to)}`);
  o(` where pooja_id = ${q(p)} and seq = ${seq};`);
}
o();
o('-- --- quantities that had become a glossary -----------------------------------');
for (const [p, seq, , to] of QUANTITY) {
  o(`update public.samagri_items set quantity = ${q(to)}`);
  o(` where pooja_id = ${q(p)} and seq = ${seq};`);
}
o();
o('-- --- things that are not ritual material --------------------------------------');
for (const [p, seq] of DROP) {
  o(`delete from public.samagri_items where pooja_id = ${q(p)} and seq = ${seq};`);
}
o();

o('-- --- assert ------------------------------------------------------------------');
o('do $$');
o('declare n int; t text;');
o('begin');
o(`  select count(*) into n from public.samagri_items where pooja_id = 'sandhyavandanam';`);
o("  if n <> 8 then raise exception 'sandhyavandanam has % samagri items, expected 8', n; end if;");
o();
o('  -- Nothing REQUIRED was removed. The two that went were both optional, and a');
o('  -- migration that trimmed a required item would be taking something off the');
o('  -- list that the rite cannot be performed without.');
o(`  select count(*) into n from public.samagri_items where pooja_id = 'sandhyavandanam' and is_required;`);
o("  if n <> 8 then raise exception 'sandhyavandanam has % required items, expected 8', n; end if;");
o();
o('  -- THE POINT OF THE MIGRATION. Every row this touched now carries English in');
o('  -- brackets, checked against the stored value rather than the generator list.');
for (const [p, seq, , to] of GLOSS) {
  o(`  select count(*) into n from public.samagri_items where pooja_id = ${q(p)} and seq = ${seq} and item_en = ${q(to)};`);
  o(`  if n <> 1 then raise exception '${p}/${seq} did not take its gloss'; end if;`);
}
o();
o('  -- And no quantity field is a glossary any more: a quantity starts with a');
o('  -- number or says how much, it does not explain what the thing is.');
o('  select string_agg(pooja_id || \'/\' || seq, \', \') into t from public.samagri_items');
o("   where quantity is not null and quantity ~ '^[0-9].* — (the|for the) ';");
o("  if t is not null then raise exception 'quantity still glosses the item on: %', t; end if;");
o('end $$;');
o();
o('commit;');

const sql = L.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0053_samagri_in_english.sql', sql);
  console.log('\nwrote supabase/migrations/0053_samagri_in_english.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
