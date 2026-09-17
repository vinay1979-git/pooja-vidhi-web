#!/usr/bin/env node
/**
 * Brings the Ganesha preparation screen up to the vadyar's own list, and
 * settles one spelling.
 *
 *   node scripts/build-ganesha-prep.mjs --emit > supabase/migrations/0017_ganesha_prep.sql
 *
 * WHY. Varalakshmi's samagri came straight from Sathya Vadyar's video
 * description and runs to 21 items. Ganesha's was never revisited: it still had
 * the SEVEN items the original content shipped with, so a practitioner reading
 * that screen would arrive at the mat without the vastram, the poonal, the
 * panchamirtham, the raw milk for the arghyam, the lamp, the bell, or any of
 * the nine leaves. Everything here is from the same video's description, which
 * docs/sources.md records as reliable.
 *
 * SPELLING. Arugampul was written three ways across the app -- "Arukampul
 * (Bermuda Grass)" in the Ganesha samagri, "arugampul" in the instructions,
 * "Arugampul" in the local catalogue -- and the Tamil two ways, அறுகம்புல் and
 * அருகம்புல். One spelling now, அருகம்புல், which is the form the Varalakshmi
 * list and the Tamil sources use.
 */

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const G = 'ganesha_standard';
const SRC = 'Sathya Vadyar, Ganesha Chaturthi 2026, samagri list from the video description';

// [item_en, item_ta, quantity, category, required, substitutable, substitute_with]
const SAMAGRI = [
  // vessels
  ['Pancha pathram and uddharani', 'பஞ்ச பாத்திரம் & உத்தரிணி', '1 set', 'vessel', true],
  ['Thambalam (plates)', 'தாம்பாளம்', '2 to 3', 'vessel', true],
  ['Kinnam (small cups)', 'கிண்ணம்', '5 to 6', 'vessel', true],
  ['Mani (pooja bell)', 'மணி', '1', 'vessel', true],
  ['Vilakku (lamp)', 'விளக்கு', '1', 'vessel', true],

  // the deity and what is his alone
  ['Clay or turmeric Pillaiyar', 'களிமண் அல்லது மஞ்சள் பிள்ளையார்', '1', 'core', true, true,
    'A turmeric cone on a betel leaf, made in the minute before it is needed'],
  ['Vasthram for Ganapati', 'கணபதிக்கு வஸ்திரம்', '1', 'core', true, true, 'Akshatai, which the mantra names as the stand-in for cloth'],
  ['Poonal, a single one for Ganapati', 'பூணூல் (ஒற்றை)', '1', 'core', true],
  ['Raw milk for the arghyam', 'அர்க்யத்திற்கு பச்சைப் பால்', 'half a glass', 'core', true],

  // offerings
  ['Manjal powder', 'மஞ்சள் தூள்', null, 'offering', true],
  ['Chandanam', 'சந்தனம்', null, 'offering', true],
  ['Kumkumam', 'குங்குமம்', null, 'offering', true],
  ['Akshadai', 'அக்ஷதை', null, 'offering', true],
  ['Panchamirtham', 'பஞ்சாமிர்தம்', null, 'offering', true],
  ['Agarbatti', 'ஊதுபத்தி', null, 'offering', true],
  ['Kalpooram', 'கற்பூரம்', null, 'offering', true],
  ['Ghee', 'நெய்', '100 g', 'offering', true],
  ['Til oil for the lamp', 'நல்லெண்ணெய்', null, 'offering', true],
  ['Thiri nool (lamp wicks)', 'திரி நூல்', null, 'offering', true],
  ['Vetrilai', 'வெற்றிலை', '15', 'offering', true],
  ['Paakku', 'பாக்கு', '10', 'offering', true],
  ['Banana', 'வாழைப்பழம்', '1 dozen', 'offering', true],
  ['Mixed fruits', 'கலவை பழங்கள்', null, 'offering', true],
  ['Coconut', 'தேங்காய்', '2', 'offering', true],

  // flowers
  ['Udiri pushpam (loose flowers)', 'உதிரி புஷ்பம்', '1.5 kg', 'flower', true],
  ['Maalai', 'மாலை', '1', 'flower', true],
  ['Thoduttha pushpam', 'தொடுத்த புஷ்பம்', '5 feet', 'flower', false],

  // the nine leaves he actually lists, of the twenty-one the archana names
  ['Arugampul', 'அருகம்புல்', null, 'leaf', true],
  ['Maavilai (mango leaf)', 'மாவிலை', null, 'leaf', true],
  ['Thulasi', 'துளசி', null, 'leaf', true],
  ['Bilvam', 'வில்வம்', null, 'leaf', true, true, 'Arugampul or thulasi'],
  ['Mari kozhundu (marjoram)', 'மருக்கொழுந்து', null, 'leaf', false, true, 'Arugampul or thulasi'],
  ['Nellikkai elai (gooseberry leaf)', 'நெல்லிக்காய் இலை', null, 'leaf', false, true, 'Arugampul or thulasi'],
  ['Arali elai (oleander leaf)', 'அரளி இலை', null, 'leaf', false, true, 'Arugampul or thulasi'],
  ['Erukka elai (calotropis leaf)', 'எருக்கு இலை', null, 'leaf', false, true, 'Arugampul or thulasi'],
  ['Vanni elai (shami leaf)', 'வன்னி இலை', null, 'leaf', false, true, 'Arugampul or thulasi'],
];

// [tier, name_en, name_ta, recipe_note, recipe_note_ta]
const NAIVEDYAM = [
  ['primary', 'Modakam (kozhukattai)', 'கொழுக்கட்டை',
    'Steamed rice-flour dumplings filled with jaggery and coconut. The offering Ganesha is given first, and the one the day is known for.',
    'வெல்லமும் தேங்காயும் நிரப்பிய அரிசி மாவு கொழுக்கட்டை, ஆவியில் வேகவைத்தது. விநாயகருக்கு முதலில் படைக்கப்படுவதும், இந்நாளுக்கே உரியதும் இதுவே.'],
  ['primary', 'Appam', 'அப்பம்',
    'Sweet rice-and-jaggery fritters fried in ghee.',
    'அரிசி மாவும் வெல்லமும் சேர்த்து நெய்யில் சுட்ட அப்பம்.'],
  ['secondary', 'Sundal', 'சுண்டல்',
    'Boiled chickpeas tempered with mustard and coconut.',
    'கடுகு தாளித்து தேங்காய் சேர்த்த வேகவைத்த கொண்டைக்கடலை.'],
  ['secondary', 'Payasam', 'பாயசம்', null, null],
  ['secondary', 'Idli', 'இட்லி', null, null],
  ['secondary', 'Vadai', 'வடை', null, null],
  ['secondary', 'Annam', 'அன்னம்', 'Plain cooked rice, offered with the rest of the meal.',
    'வெறும் சாதம், மற்ற உணவுடன் சேர்த்துப் படைக்கப்படுகிறது.'],
];

// ---------------------------------------------------------------------------
const problems = [];
const seen = new Set();
for (const [en, ta, , cat, , sub, subWith] of SAMAGRI) {
  if (seen.has(en)) problems.push(`duplicate samagri: ${en}`);
  seen.add(en);
  if (!ta) problems.push(`${en}: no Tamil`);
  if (!['vessel', 'core', 'offering', 'flower', 'leaf'].includes(cat)) problems.push(`${en}: bad category ${cat}`);
  if (sub && !subWith) problems.push(`${en}: substitutable with no substitute named`);
  if (/Arukampul|அறுகம்புல்/.test(`${en} ${ta}`)) problems.push(`${en}: still the old arugampul spelling`);
}
if (SAMAGRI.length < 30) problems.push(`only ${SAMAGRI.length} samagri items; the video lists more`);
if (!NAIVEDYAM.some(([t]) => t === 'primary')) problems.push('no primary naivedyam');
const tiers = {};
for (const [t] of NAIVEDYAM) tiers[t] = (tiers[t] ?? 0) + 1;
if (problems.length) { problems.forEach((x) => console.error('FAIL ' + x)); process.exit(1); }

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0017_ganesha_prep.sql
--
-- GENERATED by scripts/build-ganesha-prep.mjs. Do not hand-edit.
--
-- The Ganesha preparation screen still listed the SEVEN samagri items the
-- original content shipped with, while Varalakshmi's came from Sathya Vadyar's
-- video description and runs to twenty-one. A practitioner following the
-- Ganesha screen would have reached the mat without the vastram, the poonal,
-- the panchamirtham, the raw milk for the arghyam, the lamp, the bell or any
-- of the nine leaves.
--
-- ${SAMAGRI.length} samagri and ${NAIVEDYAM.length} naivedyam items, all from the same video
-- description that docs/sources.md records as reliable.
--
-- Also settles one spelling. Arugampul appeared as "Arukampul (Bermuda
-- Grass)" here, "arugampul" in the instructions and "Arugampul" in the local
-- catalogue, with the Tamil as both அறுகம்புல் and அருகம்புல். One spelling
-- now, matching the Varalakshmi list.
--
-- Idempotent.
-- =============================================================================

begin;

-- --- samagri ------------------------------------------------------------------
insert into public.samagri_items
  (pooja_id, seq, item_en, item_ta, quantity, category, is_required, is_substitutable, substitute_with)
values`);
out(SAMAGRI.map(([en, ta, qty, cat, req, sub, subWith], i) =>
  `  (${q(G)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(qty)}, ${q(cat)}, ${req ? 'true' : 'false'}, ${sub ? 'true' : 'false'}, ${q(subWith ?? null)})`,
).join(',\n'));
out(`on conflict (pooja_id, seq) do update set
  item_en = excluded.item_en, item_ta = excluded.item_ta, quantity = excluded.quantity,
  category = excluded.category, is_required = excluded.is_required,
  is_substitutable = excluded.is_substitutable, substitute_with = excluded.substitute_with;

delete from public.samagri_items where pooja_id = ${q(G)} and seq > ${SAMAGRI.length};
`);

// --- naivedyam --------------------------------------------------------------
const counter = {};
out(`-- --- naivedyam ----------------------------------------------------------------
insert into public.naivedyam_items
  (pooja_id, tier, seq, name_en, name_ta, recipe_note, recipe_note_ta)
values`);
out(NAIVEDYAM.map(([tier, en, ta, note, noteTa]) => {
  counter[tier] = (counter[tier] ?? 0) + 1;
  return `  (${q(G)}, ${q(tier)}, ${counter[tier]}, ${q(en)}, ${q(ta)}, ${q(note)}, ${q(noteTa)})`;
}).join(',\n'));
out(`on conflict (pooja_id, tier, seq) do update set
  name_en = excluded.name_en, name_ta = excluded.name_ta,
  recipe_note = excluded.recipe_note, recipe_note_ta = excluded.recipe_note_ta;
`);
for (const [tier, n] of Object.entries(counter)) {
  out(`delete from public.naivedyam_items where pooja_id = ${q(G)} and tier = ${q(tier)} and seq > ${n};`);
}

out(`
-- --- one spelling of arugampul, everywhere -----------------------------------
update public.samagri_items set
  item_en = replace(item_en, 'Arukampul', 'Arugampul'),
  item_ta = replace(item_ta, 'அறுகம்புல்', 'அருகம்புல்')
where item_en like '%Arukampul%' or item_ta like '%அறுகம்புல்%';

update public.pooja_steps set
  instruction_en = replace(instruction_en, 'Arukampul', 'Arugampul'),
  instruction_ta = replace(instruction_ta, 'அறுகம்புல்', 'அருகம்புல்'),
  updated_at = now()
where instruction_en like '%Arukampul%' or instruction_ta like '%அறுகம்புல்%';

update public.archana_items set
  offering_en = replace(offering_en, 'Arukampul', 'Arugampul'),
  offering_ta = replace(offering_ta, 'அறுகம்புல்', 'அருகம்புல்'),
  substitute_with = replace(substitute_with, 'Arukampul', 'Arugampul')
where offering_en like '%Arukampul%' or offering_ta like '%அறுகம்புல்%'
   or substitute_with like '%Arukampul%';

do $$
declare n integer;
begin
  select count(*) into n from public.samagri_items where pooja_id = ${q(G)};
  if n <> ${SAMAGRI.length} then raise exception 'ganesha samagri is %, expected ${SAMAGRI.length}', n; end if;
  select count(*) into n from public.samagri_items where item_en like '%Arukampul%' or item_ta like '%அறுகம்புல்%';
  if n > 0 then raise exception '% rows still use the old arugampul spelling', n; end if;
end $$;

commit;

-- Verify:
--   select count(*) from samagri_items where pooja_id = 'ganesha_standard';    -- ${SAMAGRI.length}
--   select count(*) from naivedyam_items where pooja_id = 'ganesha_standard';  -- ${NAIVEDYAM.length}`);

console.error(`${SAMAGRI.length} samagri (${Object.entries(SAMAGRI.reduce((a, [, , , c]) => ({ ...a, [c]: (a[c] ?? 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.error(`${NAIVEDYAM.length} naivedyam (${Object.entries(tiers).map(([k, v]) => `${k} ${v}`).join(', ')})`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
