#!/usr/bin/env node
/**
 * Replaces the four enumerated Ganesha archanas with the Siddhi Vinayaka Vrata
 * Kalpam's, which is one coherent published paddhati for this festival instead
 * of the four-source patchwork migration 0010 used.
 *
 *   node scripts/build-ganesha-archanas.mjs --emit > supabase/migrations/0012_ganesha_archanas.sql
 *
 * WHAT CHANGES AND WHY
 *
 *   Anga Pooja   was a mantra literally truncated mid-list with an ellipsis:
 *                three limbs then "...". Now 29 limbs as archana rows, the
 *                same shape as the Varalakshmi anga pooja.
 *
 *   Patra Pooja  0010 could not source WHICH Ganesha name goes with which of
 *                the 21 leaves, so it offered every leaf with the deity's own
 *                mantra. The kalpam has the pairing. Two leaves also change:
 *                position 13 is AmalakI, not devadAru, and 17 is gaNDavI, not
 *                gaNDakI.
 *
 *   Pushpa Pooja was the 16-name Shodashanama verse. The video's chapter is
 *                "21 type Pushpa Archana" and the kalpam has a 21-FLOWER
 *                pooja, which is what that chapter is. The step is renamed and
 *                its 16 rows replaced by 21.
 *
 *   Durva Pooja  swapped to the kalpam's 21 names so all four archanas come
 *                from one paddhati. The reading 0010 used, from
 *                sanskritdocuments and corroborated by StotraNidhi's
 *                Sankatahara vidhanam, is a real variant and is recorded in
 *                source_ref rather than discarded silently.
 *
 * THE LEAF LIST NOW ACCOUNTS FOR ALL NINE LEAVES the vadyar actually lists in
 * his samagri. Adding AmalakI is what did it: nellikkai elai had no match in
 * the list 0010 used, which should have been the signal that list was wrong.
 */

import { readFileSync } from 'node:fs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const V = JSON.parse(readFileSync(DIR + 'vinayaka.json', 'utf8'));

const POOJA = 'ganesha_standard';
const SRC = 'StotraNidhi Sri Siddhi Vinayaka Vrata Kalpam (Telugu), round-trip verified by scripts/parse-vinayaka-kalpam.mjs';
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

// --- what each limb is, in order, so offering_en is English not IAST --------
const ANGA = [
  ['the feet', 'பாதங்கள்'], ['the ankles', 'கணுக்கால்கள்'], ['the shins', 'கெண்டைக்கால்கள்'],
  ['the knees', 'முழங்கால்கள்'], ['the thighs', 'தொடைகள்'], ['the waist', 'இடுப்பு'],
  ['the private parts', 'குய்யம்'], ['the generative organ', 'மேட்ரம்'], ['the navel', 'நாபி'],
  ['the belly', 'வயிறு'], ['the chest', 'மார்பு'], ['the sides', 'விலாப் புறங்கள்'],
  ['the heart', 'இதயம்'], ['the throat', 'கழுத்து'], ['the shoulders', 'தோள்கள்'],
  ['the hands', 'கைகள்'], ['the arms', 'புஜங்கள்'], ['the face', 'முகம்'],
  ['the tusks', 'தந்தங்கள்'], ['the eyes', 'கண்கள்'], ['the ears', 'காதுகள்'],
  ['the forehead', 'நெற்றி'], ['the nose', 'மூக்கு'], ['the chin', 'கன்னத்தின் கீழ்ப்பகுதி'],
  ['the lips', 'உதடுகள்'], ['the cheeks', 'கன்னங்கள்'], ['the hair', 'தலைமுடி'],
  ['the head', 'சிரசு'], ['the whole body', 'உடல் முழுவதும்'],
];

// --- the leaves, in the kalpam's order -------------------------------------
// `have` marks the nine Sathya Vadyar lists in his samagri. With amalaki at 13
// every one of his nine now maps onto this list.
const PATRA = [
  ['Machi', 'மாசி (தவனம்)', 'Artemisia pallens'],
  ['Brihati', 'கண்டங்கத்தரி', 'Solanum virginianum'],
  ['Bilva', 'வில்வம்', 'Aegle marmelos', true],
  ['Durva grass', 'அருகம்புல்', 'Cynodon dactylon', true],
  ['Dattura', 'ஊமத்தை', 'Datura metel'],
  ['Badari (jujube)', 'இலந்தை', 'Ziziphus mauritiana'],
  ['Apamarga', 'நாயுருவி', 'Achyranthes aspera'],
  ['Tulasi', 'துளசி', 'Ocimum tenuiflorum', true],
  ['Chuta (mango)', 'மாவிலை', 'Mangifera indica', true],
  ['Karavira (oleander)', 'அரளி', 'Nerium oleander', true],
  ['Vishnukranta', 'விஷ்ணுகிராந்தி', 'Evolvulus alsinoides'],
  ['Dadimi (pomegranate)', 'மாதுளை', 'Punica granatum'],
  ['Amalaki (gooseberry)', 'நெல்லிக்காய் இலை', 'Phyllanthus emblica', true],
  ['Maruvaka (marjoram)', 'மருக்கொழுந்து', 'Origanum majorana', true],
  ['Sindhuvara', 'நொச்சி', 'Vitex negundo'],
  ['Jati (jasmine)', 'ஜாதிமல்லி', 'Jasminum grandiflorum'],
  ['Gandavi', 'வெள்ளை அருகம்புல்', 'Cynodon dactylon, the pale variety'],
  ['Shami', 'வன்னி', 'Prosopis cineraria', true],
  ['Ashvattha (peepal)', 'அரசு', 'Ficus religiosa'],
  ['Arjuna', 'மருதம்', 'Terminalia arjuna'],
  ['Arka (calotropis)', 'எருக்கு', 'Calotropis gigantea', true],
];

// --- the flowers ------------------------------------------------------------
const PUSHPA = [
  ['Punnaga', 'புன்னை', 'Calophyllum inophyllum'],
  ['Mandara', 'முள்முருங்கை', 'Erythrina variegata'],
  ['Dadimi (pomegranate)', 'மாதுளை', 'Punica granatum'],
  ['Vakula', 'மகிழம்பூ', 'Mimusops elengi'],
  ['Amrinala (lotus)', 'தாமரை', 'Nelumbo nucifera'],
  ['Patali', 'பாதிரி', 'Stereospermum chelonoides'],
  ['Drona', 'தும்பை', 'Leucas aspera'],
  ['Dattura', 'ஊமத்தை', 'Datura metel'],
  ['Champaka', 'செண்பகம்', 'Magnolia champaca'],
  ['Rasala (mango blossom)', 'மாம்பூ', 'Mangifera indica'],
  ['Ketaki', 'தாழம்பூ', 'Pandanus odorifer'],
  ['Madhavi', 'குருக்கத்தி', 'Hiptage benghalensis'],
  ['Shamyaka', 'கொன்றை', 'Cassia fistula'],
  ['Arka', 'எருக்கு', 'Calotropis gigantea'],
  ['Kalhara', 'செங்கழுநீர்', 'Nymphaea rubra'],
  ['Sevantika', 'சாமந்தி', 'Chrysanthemum indicum'],
  ['Bilva', 'வில்வம்', 'Aegle marmelos'],
  ['Karavira (oleander)', 'அரளி', 'Nerium oleander'],
  ['Kunda', 'குந்த மல்லி', 'Jasminum multiflorum'],
  ['Parijata', 'பவளமல்லி', 'Nyctanthes arbor-tristis'],
  ['Jati (jasmine)', 'ஜாதிமல்லி', 'Jasminum grandiflorum'],
];

// ---------------------------------------------------------------------------
const problems = [];
const need = { anga_pooja: 29, patra: 21, pushpa: 21, durva: 21 };
for (const [k, n] of Object.entries(need)) {
  if (V[k]?.length !== n) problems.push(`vinayaka.json ${k} has ${V[k]?.length}, expected ${n}`);
}
if (ANGA.length !== 29) problems.push(`ANGA has ${ANGA.length}`);
if (PATRA.length !== 21) problems.push(`PATRA has ${PATRA.length}`);
if (PUSHPA.length !== 21) problems.push(`PUSHPA has ${PUSHPA.length}`);
// The plant tables must be in the same order as the parsed liturgy, or a name
// would be paired with the wrong plant. Comparing spellings directly does not
// work: the tables use everyday romanisation (Shami, Chuta, Dattura, Brihati)
// and the liturgy is IAST (samI, cUta, dhattUra, bRRihatI). Reduce both to a
// consonant skeleton instead -- aspirates collapsed, nasals merged, vowels
// dropped -- which survives every one of those differences and still catches a
// row that is genuinely out of order.
const bones = (s) =>
  s.replace(/\(.*?\)/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z]/g, '')
    .replace(/kh|gh|ch|jh|th|dh|ph|bh|sh/g, (m) => m[0])
    .replace(/[aeiou]/g, '')
    .replace(/m/g, 'n');

// Compare the plant word alone. The English gloss may carry a qualifier
// ("Durva grass", "Badari (jujube)") and the liturgy always carries the
// offering formula, and neither belongs in the comparison.
const plantWord = (s) =>
  s.replace(/\(.*?\)/g, ' ')
    .replace(/patra[ṃm]?|pu[ṣs]pa[ṃm]?|samarpay[āa]mi/gi, ' ')
    .trim().split(/\s+/)[0] ?? '';

const checkOrder = (table, key) =>
  table.forEach(([en], i) => {
    const want = bones(plantWord(en));
    const got = bones(plantWord(V[key][i]?.act_iast ?? ''));
    if (want && got && want !== got) {
      problems.push(`${key} ${i + 1}: table says "${en}" but the liturgy says "${V[key][i].act_iast}"`);
    }
  });
checkOrder(PATRA, 'patra');
checkOrder(PUSHPA, 'pushpa');
if (problems.length) { problems.forEach((p) => console.error('FAIL ' + p)); process.exit(1); }

const haveCount = PATRA.filter((p) => p[3]).length;

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0012_ganesha_archanas.sql
--
-- GENERATED by scripts/build-ganesha-archanas.mjs. Do not hand-edit.
--
-- Replaces the four enumerated Ganesha archanas with the Sri Siddhi Vinayaka
-- Vrata Kalpam's. One coherent published paddhati for this festival, instead of
-- the four-source patchwork 0010 used.
--
--   Anga Pooja    the stored mantra was truncated mid-list with a literal
--                 "..." after three limbs. Now 29 limbs as archana rows.
--   Patra Pooja   0010 could not source the name-to-leaf pairing and offered
--                 every leaf with the deity's own mantra. The kalpam has it.
--                 Leaf 13 becomes amalaki (was devadaru) and 17 gandavi.
--   Pushpa Pooja  was the 16-name Shodashanama verse; the video's chapter is
--                 "21 type Pushpa Archana" and this kalpam has the 21-flower
--                 pooja that chapter refers to. Renamed, 16 rows -> 21.
--   Durva Pooja   swapped to this kalpam's 21 names for consistency. The
--                 previous reading is recorded in source_ref, not discarded.
--
-- With amalaki in the leaf list, all ${haveCount} leaves Sathya Vadyar lists in his
-- samagri now map onto the 21. Under the old list nellikkai elai matched none
-- of them, which was the signal that list was wrong.
--
-- Idempotent.
-- =============================================================================

begin;
`);

const stepRef = (title) =>
  `(select id from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = ${q(title)})`;

// --- Anga Pooja -------------------------------------------------------------
out(`-- --- Anga Pooja: the truncated mantra becomes 29 rows ------------------------
update public.pooja_steps set
  mantra_sanskrit = null, mantra_tamil = null, mantra_translit = null,
  instruction_en = 'Twenty-nine names, each naming a limb, from the feet upward to the head, and a last one for the whole body. Offer a flower or a pinch of akshatai at each, touching the corresponding part of the idol. Almost every name alliterates with the limb it worships, which is how the list was kept in memory.',
  instruction_ta = 'இருபத்தொன்பது நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்தைக் குறிக்கும், பாதத்திலிருந்து சிரசு வரை; கடைசியாக உடல் முழுவதற்கும். ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பித்து, விக்கிரகத்தின் அந்தந்த இடத்தைத் தொடவும். ஏறக்குறைய ஒவ்வொரு நாமமும் அது பூஜிக்கும் அங்கத்துடன் ஒரே எழுத்தில் தொடங்குகிறது; அப்படியே இப்பட்டியல் மனனம் செய்யப்பட்டது.',
  source_ref = ${q(SRC + '. Replaces a stored mantra that was truncated after three limbs with a literal ellipsis.')},
  updated_at = now()
where pooja_id = ${q(POOJA)} and step_title_en = 'Anga Pooja';
`);

function archanaRows(title, rows) {
  out(`-- ${title}: ${rows.length} rows`);
  out(`insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,
   offering_deva, offering_en, offering_ta, botanical, is_substitutable, substitute_with)
values`);
  out(rows.map((r, i) =>
    `  (${stepRef(title)}, ${i + 1}, ${q(r.nd)}, ${q(r.nt)}, ${q(r.ni)},` +
    ` ${q(r.od)}, ${q(r.oe)}, ${q(r.ot)}, ${q(r.bot)}, ${r.sub ? 'true' : 'false'}, ${q(r.subWith)})`,
  ).join(',\n'));
  out(`on conflict (pooja_step_id, seq) do update set
  invoked_name_deva = excluded.invoked_name_deva,
  invoked_name_ta = excluded.invoked_name_ta,
  invoked_name_translit = excluded.invoked_name_translit,
  offering_deva = excluded.offering_deva,
  offering_en = excluded.offering_en,
  offering_ta = excluded.offering_ta,
  botanical = excluded.botanical,
  is_substitutable = excluded.is_substitutable,
  substitute_with = excluded.substitute_with;

delete from public.archana_items
where pooja_step_id = ${stepRef(title)} and seq > ${rows.length};
`);
}

archanaRows('Anga Pooja', V.anga_pooja.map((r, i) => ({
  nd: r.name_deva, nt: r.name_ta, ni: r.name_iast,
  od: r.act_deva, oe: `Worship ${ANGA[i][0]}`, ot: `${ANGA[i][1]} பூஜிக்கவும்`,
  bot: null, sub: false, subWith: null,
})));

archanaRows('Patra Pooja (21 Leaves)', V.patra.map((r, i) => ({
  nd: r.name_deva, nt: r.name_ta, ni: r.name_iast,
  od: r.act_deva, oe: `${PATRA[i][0]} leaf`, ot: PATRA[i][1],
  bot: PATRA[i][2], sub: !PATRA[i][3],
  subWith: PATRA[i][3] ? null : 'Arugampul (durva) or tulasi',
})));

// The step is renamed before its rows are written, so the subselect finds it.
out(`-- --- Pushpa Pooja: the 16-name verse becomes the kalpam's 21 flowers ---------
update public.pooja_steps set
  step_title_en = 'Pushpa Pooja (21 Flowers)',
  step_title_ta = 'புஷ்ப பூஜை (21 புஷ்பங்கள்)',
  instruction_en = 'Twenty-one flowers, one at each name. As with the leaves, few gardens hold all twenty-one; offer what you have and make up the rest from the loose flowers.',
  instruction_ta = 'இருபத்தொரு புஷ்பங்கள், ஒவ்வொரு நாமத்திற்கும் ஒன்று. இலைகளைப் போலவே, இருபத்தொன்றும் ஒரு தோட்டத்தில் கிடைப்பது அரிது; கிடைப்பதைச் சமர்ப்பித்து, மீதியை உதிரிப் புஷ்பங்களால் நிரப்பவும்.',
  philosophy_en = 'Each name here is a different Ganapati: Maha, Rudra, Vidya, Vighna, Brahma, Jnana. The twenty-one flowers are offered to twenty-one ways of meeting the same god, which is what the long form of a pooja is for.',
  source_ref = ${q(SRC + '. Replaces the 16-name Shodashanama verse; the video chapter is "21 type Pushpa Archana".')},
  updated_at = now()
where pooja_id = ${q(POOJA)}
  and step_title_en in ('Pushpa Pooja (Shodasha Nama)', 'Pushpa Pooja (21 Flowers)');
`);

archanaRows('Pushpa Pooja (21 Flowers)', V.pushpa.map((r, i) => ({
  nd: r.name_deva, nt: r.name_ta, ni: r.name_iast,
  od: r.act_deva, oe: `${PUSHPA[i][0]} flower`, ot: PUSHPA[i][1],
  bot: PUSHPA[i][2], sub: true, subWith: 'Any flower from the loose mixed flowers',
})));

archanaRows('Durva Pooja (21 Names)', V.durva.map((r) => ({
  nd: r.name_deva, nt: r.name_ta, ni: r.name_iast,
  od: r.act_deva, oe: 'A pair of arugampul blades', ot: 'ஒரு ஜோடி அருகம்புல்',
  bot: 'Cynodon dactylon', sub: false, subWith: null,
})));

out(`-- --- all four are now lists, not single mantras ------------------------------
-- Patra and Durva carried the deity's mula mantra at step level because their
-- rows had no name of their own. The rows name themselves now, so a step mantra
-- would just be a fifth thing on screen saying nothing the list does not.
update public.pooja_steps set
  mantra_sanskrit = null, mantra_tamil = null, mantra_translit = null, updated_at = now()
where pooja_id = ${q(POOJA)}
  and step_title_en in ('Patra Pooja (21 Leaves)', 'Durva Pooja (21 Names)');

-- --- record where the four now come from ------------------------------------
update public.pooja_steps set source_ref = ${q(SRC)}, updated_at = now()
where pooja_id = ${q(POOJA)}
  and step_title_en in ('Patra Pooja (21 Leaves)', 'Pushpa Pooja (21 Flowers)');

update public.pooja_steps set
  source_ref = ${q(SRC + '. A variant reading, ganadhipataye/aghanashanaya/lambodaraya..., is published in sanskritdocuments gaNeshapUjAvidhi v.35 and StotraNidhi\'s Sankatahara Chaturthi vidhanam; this pooja follows the Chaturthi vrata kalpam throughout.')},
  updated_at = now()
where pooja_id = ${q(POOJA)} and step_title_en = 'Durva Pooja (21 Names)';

-- The leaf list is no longer partly unsourced, so the caveat comes off.
update public.pooja_steps set
  instruction_en = 'Offer the twenty-one leaves one at a time, in this order, saying the name and the offering line for each. Few households have all twenty-one; offer what you have and substitute the rest with arugampul or tulasi, which is what is done in practice. Nine of them are on the samagri list because those are the nine a Tamil household can usually gather.',
  instruction_ta = 'இருபத்தொரு இலைகளையும் இந்த வரிசையில் ஒவ்வொன்றாக, அதற்குரிய நாமத்தையும் சமர்ப்பண வரியையும் சொல்லிச் சமர்ப்பிக்கவும். இருபத்தொன்றும் கிடைப்பது அரிது; கிடைப்பதைச் சமர்ப்பித்து, மற்றவற்றுக்கு அருகம்புல் அல்லது துளசியைப் பயன்படுத்தலாம். இவற்றுள் ஒன்பது சாமக்ரி பட்டியலில் உள்ளன; தமிழ் வீடுகளில் பொதுவாகக் கிடைப்பவை அவையே.',
  updated_at = now()
where pooja_id = ${q(POOJA)} and step_title_en = 'Patra Pooja (21 Leaves)';

commit;

-- Verify:
--   select s.step_title_en, count(*) from archana_items a
--     join pooja_steps s on s.id = a.pooja_step_id
--    where s.pooja_id = 'ganesha_standard' group by 1;   -- 29, 21, 21, 21
--   select count(*) from pooja_steps where mantra_sanskrit like '%...%'
--     and step_title_en = 'Anga Pooja';                  -- 0`);

console.error(`anga ${V.anga_pooja.length}, patra ${V.patra.length}, pushpa ${V.pushpa.length}, durva ${V.durva.length}`);
console.error(`leaves on the vadyar's samagri list: ${haveCount}/9`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
