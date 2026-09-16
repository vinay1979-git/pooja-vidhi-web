#!/usr/bin/env node
/**
 * Fills the gaps Sathya Vadyar's Ganesha Chaturthi video showed the database
 * had: Prana Pratishtha, the 21 patra, the 21 durva and the 108 names, plus a
 * correction to the 16 pushpa names already stored.
 *
 *   node scripts/build-ganesha-content.mjs --emit > supabase/migrations/0010_ganesha_content.sql
 *
 * SOURCING. docs/sources.md draws the line: the video gives the sequence, not
 * the wording. So every mantra below comes from a published text, and where the
 * published texts disagree the disagreement is recorded rather than resolved.
 *
 *   108 names   StotraNidhi, three separately proofed pages (Devanagari, Tamil,
 *               IAST), cross-validated by scripts/parse-namavali.mjs.
 *   21 durva    sanskritdocuments gaNeshapUjAvidhi.itx, the numbered
 *               "ekaviMshatidUrvA~NkurumarpaN" list, corroborated by
 *               StotraNidhi's Sankatahara Chaturthi puja vidhanam. Four names
 *               differ between the two; both readings are carried.
 *   16 pushpa   the Shodashanama verse. Already in the database, with one name
 *               wrong and four surplus, both fixed here.
 *   21 patra    the leaf list is the South Indian recension, published by
 *               telugupanchangamdaily's Vinayaka Vratha Kalpam and noted as the
 *               South variation by drikpanchang. The NAMES paired with those
 *               leaves are NOT seeded: the printed paddhatis disagree on the
 *               pairing and no source consulted agrees with another. The leaves
 *               are offered with the deity's own mantra instead, and the step
 *               says so.
 *   pratishtha  the standard asya prANAH pratiShThantu verse.
 */

import { readFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';

const NAMAVALI = JSON.parse(
  readFileSync((process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/') + 'parsed.json', 'utf8'),
);

const POOJA = 'ganesha_standard';

// ---------------------------------------------------------------------------
// transliteration, same rules as scripts/generate-scripts.mjs
// ---------------------------------------------------------------------------
const MISPLACED = /([க-ஹ])([ா-்]*)([ரல])([ா-்]*)([²³⁴])/g;
const fixSup = (t) => {
  let prev;
  let cur = t;
  do { prev = cur; cur = cur.replace(MISPLACED, '$1$2$5$3$4'); } while (cur !== prev);
  return cur;
};
const tidy = (t) => t.replace(/[௃௄]/g, '').replace(/ஃ/g, '꞉').replace(/ௐ/g, 'ஓம்').replace(/'/g, '');
const PROTECTED = /(\[[A-Z0-9_]+\]|[।॥])/;
const tr = (text, to) =>
  String(text)
    .split(PROTECTED)
    .map((part) => {
      if (part === '' || PROTECTED.test(part)) return part;
      const done = Sanscript.t(part, 'devanagari', to);
      return to.startsWith('tamil') ? tidy(fixSup(done)) : done;
    })
    .join('');

const deva = (itrans) => Sanscript.t(itrans, 'itrans', 'devanagari');
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const skel = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// ---------------------------------------------------------------------------
// content
// ---------------------------------------------------------------------------

// The Shodashanama verse, which is the authority for the order:
//   sumukhashchaikadantashcha kapilo gajakarNakaH |
//   lambodarashcha vikaTo vighnarAjo vinAyakaH ||
//   dhUmraketurgaNAdhyakSho bhAlachandro gajAnanaH |
//   vakratuNDaH shUrpakarNo herambaH skandapUrvajaH ||
// The database had gaNAdhipAya at 8 where the verse has vinAyaka, and four
// surplus names appended at 17-20. Both are corrected.
const PUSHPA_16 = [
  'sumukhAya', 'ekadantAya', 'kapilAya', 'gajakarNakAya',
  'lambodarAya', 'vikaTAya', 'vighnarAjAya', 'vinAyakAya',
  'dhUmraketave', 'gaNAdhyakShAya', 'bhAlachandrAya', 'gajAnanAya',
  'vakratuNDAya', 'shUrpakarNAya', 'herambAya', 'skandapUrvajAya',
];

// sanskritdocuments gaNeshapUjAvidhi.itx verse 35, numbered 1..21 in the
// source. `alt` is StotraNidhi's reading where it differs.
const DURVA_21 = [
  ['gaNAdhipataye', 'gaṇādhipāya'],
  ['umAputrAya'],
  ['aghanAshanAya'],
  ['ekadantAya'],
  ['ibhavaktrAya'],
  ['mUShakavAhanAya', 'mūṣikavāhanāya'],
  ['vinAyakAya'],
  ['IshaputrAya'],
  ['sarvasiddhipradAya'],
  ['lambodarAya'],
  ['vakratuNDAya'],
  ['modakapriyAya'],
  ['vighnavidhvaMsakartre'],
  ['vishvavandyAya'],
  ['amareshAya'],
  ['gajakarNAya', 'gajakarṇakāya'],
  ['nAgayaj~nopavItine'],
  ['bhAlachandrAya', 'phālacandrāya'],
  ['parashudhAriNe'],
  ['vighnAdhipAya'],
  ['vidyApradAya'],
];

// South Indian recension. `ta` is the Tamil name of the leaf as a household
// would ask for it; `have` marks the eight Sathya Vadyar actually lists in his
// samagri, so the rest can be flagged substitutable.
const PATRA_21 = [
  ['machI', 'மாசிப்பத்திரம்', 'Machi (davanam)', 'Artemisia pallens'],
  ['bRRihatI', 'கண்டங்கத்தரி', 'Brihati (Indian nightshade)', 'Solanum virginianum'],
  ['bilva', 'வில்வம்', 'Bilva', 'Aegle marmelos', true],
  ['dUrvA', 'அருகம்புல்', 'Durva grass', 'Cynodon dactylon', true],
  ['dattUra', 'ஊமத்தை', 'Dattura', 'Datura metel'],
  ['badarI', 'இலந்தை', 'Badari (jujube)', 'Ziziphus mauritiana'],
  ['apAmArga', 'நாயுருவி', 'Apamarga', 'Achyranthes aspera'],
  ['tulasI', 'துளசி', 'Tulasi', 'Ocimum tenuiflorum', true],
  ['chUta', 'மாவிலை', 'Chuta (mango)', 'Mangifera indica', true],
  ['karavIra', 'அரளி', 'Karavira (oleander)', 'Nerium oleander', true],
  ['viShNukrAnta', 'விஷ்ணுகிராந்தி', 'Vishnukranta', 'Evolvulus alsinoides'],
  ['dADimI', 'மாதுளை', 'Dadimi (pomegranate)', 'Punica granatum'],
  ['devadAru', 'தேவதாரு', 'Devadaru', 'Cedrus deodara'],
  ['maruvaka', 'மருக்கொழுந்து', 'Maruvaka (marjoram)', 'Origanum majorana', true],
  ['sindhuvAra', 'நொச்சி', 'Sindhuvara', 'Vitex negundo'],
  ['jAtI', 'ஜாதிமல்லி', 'Jati (jasmine)', 'Jasminum grandiflorum'],
  ['gaNDakI', 'மந்தாரை', 'Gandaki', 'Bauhinia variegata'],
  ['shamI', 'வன்னி', 'Shami', 'Prosopis cineraria', true],
  ['ashvattha', 'அரசு', 'Ashvattha (peepal)', 'Ficus religiosa'],
  ['arjuna', 'மருதம்', 'Arjuna', 'Terminalia arjuna'],
  ['arka', 'எருக்கு', 'Arka (calotropis)', 'Calotropis gigantea', true],
];

// ---------------------------------------------------------------------------
// the step list, in the order the video performs them
// ---------------------------------------------------------------------------
const ORDER = [
  'Achamanam', 'Anga Vandanam', 'Vighneshwara Dhyanam', 'Pranayamam', 'Sankalpam',
  'Kalasha Pooja', 'Ghanta Pooja', 'Avahanam & Asanam',
  'Prana Pratishtha',
  'Padyam & Arghyam', 'Snanam & Vastram', 'Gandham, Kumkumam & Pushpam', 'Anga Pooja',
  'Patra Pooja (21 Leaves)',
  'Pushpa Pooja (Shodasha Nama)',
  'Durva Pooja (21 Names)',
  'Ganapathi Ashtottara Shatanamavali',
  'Dhoopam & Deepam', 'Naivedyam', 'Karpura Neerajanam', 'Mantra Pushpam & Namaskaram',
  'Ksheera Arghyam', 'Kshama Prarthana & Conclusion', 'Udvasanam',
];
const numberOf = (title) => ORDER.indexOf(title) + 1;

// The existing step 13 is renamed, so the renumber has to know its old title.
const RENAMES = [['Pushpa Pooja (Archana)', 'Pushpa Pooja (Shodasha Nama)']];

const NEW_STEPS = [
  {
    title_en: 'Prana Pratishtha',
    title_ta: 'ப்ராண ப்ரதிஷ்டை',
    phase: 'pradhana',
    modes: ['main'],
    instruction_en:
      'Touch the idol with the fingertips of the right hand and recite, asking the life breath to settle into it. After this the image is no longer clay: it is treated as a guest who is present. This is why the final day needs Udvasanam to formally release what is established here, and why a later day\'s Punar Pooja does not repeat this step.',
    instruction_ta:
      'வலது கையின் விரல் நுனிகளால் விக்கிரகத்தைத் தொட்டு, உயிர்ப்பு அதில் நிலைபெறும்படி வேண்டிப் பாராயணம் செய்யவும். இதன் பின் அந்த உருவம் களிமண் அல்ல; எழுந்தருளியிருக்கும் விருந்தினராகவே கருதப்படுகிறது. இதனாலேயே இறுதி நாளில் உத்வாசனம் தேவைப்படுகிறது; அடுத்த நாட்களின் புனர் பூஜையில் இந்தப் படி மீண்டும் செய்யப்படுவதில்லை.',
    deva:
      'अस्य प्राणाः प्रतिष्ठन्तु अस्य प्राणाः क्षरन्तु च । ' +
      'अस्य देवत्वमर्चायै मामहेति च कश्चन ॥ ' +
      'श्री महागणपतये नमः प्राण प्रतिष्ठापयामि ॥',
    philosophy_en:
      'Everything before this point prepares a seat. This is the step that makes the rest of the pooja hospitality rather than decoration. A goddess takes the feminine form of the same verse, asyai in place of asya.',
    source_ref:
      'Standard prana pratishtha verse; Sathya Vadyar, Ganesha Chaturthi 2026, chapter at 34:36',
  },
  {
    title_en: 'Patra Pooja (21 Leaves)',
    title_ta: 'பத்ர பூஜை (21 இலைகள்)',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'Offer the twenty-one leaves one at a time, in this order, saying the offering line for each. Few households have all twenty-one; offer what you have and substitute the rest with arugampul or tulasi, which is what is done in practice. The printed paddhatis pair a different Ganesha name with each leaf but disagree with one another on which name goes with which, so this follows the deity\'s own mantra for every leaf instead of picking one pairing.',
    instruction_ta:
      'இருபத்தொரு இலைகளையும் இந்த வரிசையில் ஒவ்வொன்றாக, அதற்குரிய வரியைச் சொல்லிச் சமர்ப்பிக்கவும். இருபத்தொன்றும் கிடைப்பது அரிது; கிடைப்பதைச் சமர்ப்பித்து, மற்றவற்றுக்கு அருகம்புல் அல்லது துளசியைப் பயன்படுத்தலாம் — நடைமுறையில் அதுவே செய்யப்படுகிறது. அச்சிடப்பட்ட பத்ததிகள் ஒவ்வொரு இலைக்கும் ஒரு விநாயகர் நாமத்தைக் கூறுகின்றன; ஆனால் எந்த நாமம் எந்த இலைக்கு என்பதில் அவை ஒன்றுக்கொன்று முரண்படுகின்றன. எனவே இங்கு ஒவ்வொரு இலைக்கும் மூல மந்திரமே சொல்லப்படுகிறது.',
    deva: 'ॐ श्री महागणपतये नमः',
    philosophy_en:
      'The leaves are not decoration and not incense. Each is a plant that grows where people live, and gathering twenty-one of them is a morning\'s walk. The rite is built so that the offering costs attention rather than money.',
    source_ref:
      'Leaf list: South Indian recension, Vinayaka Vratha Kalpam (telugupanchangamdaily), corroborated as the South variation by drikpanchang. Name pairing deliberately not seeded, paddhatis disagree. Sequence: Sathya Vadyar, chapter at 45:36',
  },
  {
    title_en: 'Durva Pooja (21 Names)',
    title_ta: 'தூர்வா பூஜை (21 நாமங்கள்)',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'Take arugampul in pairs of blades. Offer one pair at each of the twenty-one names. Durva is the offering Ganesha is said to prefer above every other, and this is the only upachara in the whole pooja given twenty-one times.',
    instruction_ta:
      'அருகம்புல்லை இரண்டிரண்டாக எடுக்கவும். இருபத்தொரு நாமங்களில் ஒவ்வொன்றுக்கும் ஒரு ஜோடி சமர்ப்பிக்கவும். எல்லா த்ரவ்யங்களிலும் விநாயகருக்கு மிகவும் உகந்தது அருகம்புல்; பூஜையில் இருபத்தொரு முறை செய்யப்படும் ஒரே உபசாரம் இதுவே.',
    deva: 'ॐ श्री महागणपतये नमः दूर्वायुग्मं समर्पयामि',
    philosophy_en:
      'Durva is a weed that survives being walked on and cut and still spreads. Offering the most persistent thing in the garden to the remover of obstacles is not an accident of botany.',
    source_ref:
      'sanskritdocuments gaNeshapUjAvidhi.itx v.35 ekaviMshatidUrvA~NkurumarpaN, corroborated by StotraNidhi Sankatahara Chaturthi puja vidhanam; Sathya Vadyar, chapter at 52:03',
  },
  {
    title_en: 'Ganapathi Ashtottara Shatanamavali',
    title_ta: 'கணபதி அஷ்டோத்தர சதநாமாவளி',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    namavali_id: 'ganesha_ashtottara_108',
    instruction_en:
      'Offer a flower, a pinch of akshatai or a blade of arugampul at each of the hundred and eight names. If time is short the sixteen-name Pushpa Pooja already done stands in its place, but on Chaturthi itself the full hundred and eight is the practice.',
    instruction_ta:
      'நூற்றெட்டு நாமங்களில் ஒவ்வொன்றிலும் ஒரு புஷ்பமோ, சிறிது அக்ஷதையோ, அருகம்புல்லோ சமர்ப்பிக்கவும். நேரம் குறைவாக இருந்தால் ஏற்கெனவே செய்த பதினாறு நாம புஷ்ப பூஜை போதுமானது; ஆனால் சதுர்த்தி அன்று நூற்றெட்டும் சொல்வதே வழக்கம்.',
    deva: null,
    philosophy_en:
      'The list closes on Varasiddhi Vinayaka, which is the form worshipped on Chaturthi itself. The hundred and eight names are not a hundred and eight gods; they are one guest described until the description runs out.',
    source_ref:
      'StotraNidhi Sri Ganesha Ashtottara Shatanamavali, Devanagari, Tamil and IAST pages cross-validated; Sathya Vadyar, chapter at 54:58',
  },
];

// ---------------------------------------------------------------------------
// validation before anything is emitted
// ---------------------------------------------------------------------------
const problems = [];
if (ORDER.length !== 24) problems.push(`ORDER has ${ORDER.length} steps, expected 24`);
if (new Set(ORDER).size !== ORDER.length) problems.push('ORDER has a duplicate title');
if (PUSHPA_16.length !== 16) problems.push(`PUSHPA_16 has ${PUSHPA_16.length}`);
if (DURVA_21.length !== 21) problems.push(`DURVA_21 has ${DURVA_21.length}`);
if (PATRA_21.length !== 21) problems.push(`PATRA_21 has ${PATRA_21.length}`);
if (!NAMAVALI.ganesha || NAMAVALI.ganesha.length !== 108) {
  problems.push(`parsed.json ganesha has ${NAMAVALI.ganesha?.length}, expected 108`);
}
for (const s of NEW_STEPS) {
  if (!numberOf(s.title_en)) problems.push(`${s.title_en} is not in ORDER`);
}
// The durva variants must be spelling variants of the same name, not different
// names. A prefix test is no good here: bhalachandra and phalachandra differ at
// the first letter and are the same name, while mushaka and mushika differ in
// the middle. Edit distance is the right shape.
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length];
}
for (const [itrans, alt] of DURVA_21) {
  if (!alt) continue;
  const a = skel(Sanscript.t(itrans, 'itrans', 'iast'));
  const b = skel(alt);
  if (distance(a, b) > Math.max(2, Math.round(Math.max(a.length, b.length) * 0.2))) {
    problems.push(`durva variant looks like a different name: ${itrans} vs ${alt}`);
  }
}
if (problems.length) {
  problems.forEach((p) => console.error('FAIL ' + p));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// emit
// ---------------------------------------------------------------------------
const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0010_ganesha_content.sql
--
-- GENERATED by scripts/build-ganesha-content.mjs. Do not hand-edit.
--
-- Completes the Ganesha Chaturthi pooja against Sathya Vadyar's step-by-step
-- video, which docs/sources.md records as the primary reference for SEQUENCE.
-- Every mantra here comes from a published text; where published texts
-- disagree, the disagreement is recorded rather than silently resolved.
--
-- Adds    Prana Pratishtha, Patra Pooja (21), Durva Pooja (21),
--         Ganapathi Ashtottara Shatanamavali (108)
-- Fixes   Pushpa Pooja: vinayakaya restored at 8 per the Shodashanama verse,
--         four surplus names removed
-- Fixes   deities.ganesha forbade tulasi; the vadyar uses it
--
-- Steps go from 20 to 24 and are renumbered. Idempotent.
-- =============================================================================

begin;
`);

out(`-- --- tulasi ------------------------------------------------------------------
-- The original content carried the Brahma Vaivarta prohibition. Sathya Vadyar
-- lists thulasi among the leaves he uses, and it sits at position 8 of the
-- patra list below, so the prohibition does not describe this practice.
update public.deities set
  forbidden_offerings = '{}'::jsonb,
  permitted_offerings = ${q(JSON.stringify({
    leaves: PATRA_21.map(([itrans]) => Sanscript.t(itrans, 'itrans', 'iast')),
    note: 'Tulasi is used. Sathya Vadyar lists it among the leaves for Ganesha Chaturthi.',
  }))}::jsonb,
  updated_at = now()
where id = 'ganesha';
`);

// --- namavali ---------------------------------------------------------------
out(`-- --- the 108 names -----------------------------------------------------------
insert into public.namavalis (id, deity_id, recension, name_count, source_ref)
values ('ganesha_ashtottara_108', 'ganesha', 'South Indian, opening gajananaya and closing varasiddhivinayakaya', 108,
        'StotraNidhi Sri Ganesha Ashtottara Shatanamavali; Devanagari, Tamil and IAST pages cross-validated by scripts/parse-namavali.mjs')
on conflict (id) do update set
  recension = excluded.recension, source_ref = excluded.source_ref;
`);
out('insert into public.namavali_items (namavali_id, seq, name_deva, name_ta, name_translit) values');
out(
  NAMAVALI.ganesha
    .map((n) => `  ('ganesha_ashtottara_108', ${n.seq}, ${q(n.deva)}, ${q(n.tamil)}, ${q(n.iast)})`)
    .join(',\n'),
);
out(`on conflict (namavali_id, seq) do update set
  name_deva = excluded.name_deva, name_ta = excluded.name_ta, name_translit = excluded.name_translit;
`);

// --- renumber ---------------------------------------------------------------
out(`-- --- renumber ----------------------------------------------------------------
-- Four steps are inserted in the middle, so everything from the old step 9
-- onward moves. Negate first: (pooja_id, step_number) is unique, and a direct
-- renumber would collide mid-update.`);
for (const [from, to] of RENAMES) {
  out(`update public.pooja_steps set step_title_en = ${q(to)}
where pooja_id = ${q(POOJA)} and step_title_en = ${q(from)};`);
}
out(`
update public.pooja_steps set step_number = -step_number
where pooja_id = ${q(POOJA)} and step_number > 0;
`);
for (const title of ORDER) {
  out(`update public.pooja_steps set step_number = ${numberOf(title)}
where pooja_id = ${q(POOJA)} and step_title_en = ${q(title)};`);
}
out('');

// --- new steps --------------------------------------------------------------
out('-- --- the four new steps ------------------------------------------------------');
for (const s of NEW_STEPS) {
  const n = numberOf(s.title_en);
  out(`-- ${n}. ${s.title_en}`);
  out(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   philosophy_en, gender_rule, scripts_generated, namavali_id, source_ref)
values (${q(POOJA)}, ${n}, ${q(s.phase)}, '{${s.modes.join(',')}}',
        ${q(s.title_en)}, ${q(s.title_ta)},
        ${q(s.instruction_en)},
        ${q(s.instruction_ta)},
        ${q(s.deva)},
        ${q(s.deva && tr(s.deva, 'tamil'))},
        ${q(s.deva && tr(s.deva, 'iast'))},
        ${q(s.philosophy_en)}, 'all', true, ${q(s.namavali_id ?? null)}, ${q(s.source_ref)})
on conflict (pooja_id, step_number) do update set
  step_title_en = excluded.step_title_en,
  step_title_ta = excluded.step_title_ta,
  instruction_en = excluded.instruction_en,
  instruction_ta = excluded.instruction_ta,
  mantra_sanskrit = excluded.mantra_sanskrit,
  mantra_tamil = excluded.mantra_tamil,
  mantra_translit = excluded.mantra_translit,
  philosophy_en = excluded.philosophy_en,
  namavali_id = excluded.namavali_id,
  modes = excluded.modes,
  phase = excluded.phase,
  source_ref = excluded.source_ref;
`);
}

// --- archana rows -----------------------------------------------------------
const step = (title) =>
  `(select id from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = ${q(title)})`;

function archana(title, rows) {
  out(`-- ${title}: ${rows.length} rows`);
  out(`insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,
   offering_deva, offering_en, offering_ta, botanical, is_substitutable, substitute_with)
values`);
  out(
    rows
      .map(
        (r, i) =>
          `  (${step(title)}, ${i + 1}, ${q(r.deva)}, ${q(tr(r.deva, 'tamil'))}, ${q(tr(r.deva, 'iast'))},` +
          ` ${q(r.offDeva)}, ${q(r.offEn)}, ${q(r.offTa)}, ${q(r.botanical)}, ${r.sub ? 'true' : 'false'}, ${q(r.subWith)})`,
      )
      .join(',\n'),
  );
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
`);
  out(`delete from public.archana_items
where pooja_step_id = ${step(title)} and seq > ${rows.length};
`);
}

out('-- --- archana rows -----------------------------------------------------------');

archana(
  'Patra Pooja (21 Leaves)',
  PATRA_21.map(([itrans, ta, en, botanical, have]) => ({
    deva: 'ॐ श्री महागणपतये नमः',
    offDeva: deva(itrans + 'patraM samarpayAmi'),
    offEn: en + ' leaf',
    offTa: ta,
    botanical,
    sub: !have,
    subWith: have ? null : 'Arugampul (durva) or tulasi',
  })),
);

archana(
  'Pushpa Pooja (Shodasha Nama)',
  PUSHPA_16.map((itrans) => ({
    deva: deva('OM ' + itrans + ' namaH'),
    offDeva: deva('puShpaM samarpayAmi'),
    offEn: 'A flower or a pinch of akshatai',
    offTa: 'ஒரு புஷ்பம் அல்லது சிறிது அக்ஷதை',
    botanical: null,
    sub: false,
    subWith: null,
  })),
);

archana(
  'Durva Pooja (21 Names)',
  DURVA_21.map(([itrans, alt]) => ({
    deva: deva('OM ' + itrans + ' namaH'),
    offDeva: deva('dUrvAyugmaM samarpayAmi'),
    offEn: 'A pair of arugampul blades' + (alt ? ` (StotraNidhi reads this name ${alt})` : ''),
    offTa: 'ஒரு ஜோடி அருகம்புல்',
    botanical: 'Cynodon dactylon',
    sub: false,
    subWith: null,
  })),
);

out('commit;');
out(`
-- Verify:
--   select step_number, step_title_en, namavali_id, modes
--     from pooja_steps where pooja_id = 'ganesha_standard' order by step_number;  -- 24 rows
--   select count(*) from namavali_items where namavali_id = 'ganesha_ashtottara_108';  -- 108
--   select s.step_title_en, count(*) from archana_items a
--     join pooja_steps s on s.id = a.pooja_step_id group by 1;  -- 21, 16, 21`);

console.error(`${ORDER.length} steps, ${NEW_STEPS.length} new`);
console.error(`patra ${PATRA_21.length}, pushpa ${PUSHPA_16.length}, durva ${DURVA_21.length}, namavali ${NAMAVALI.ganesha.length}`);
console.error(`sample tamil: ${tr(NEW_STEPS[0].deva, 'tamil').slice(0, 70)}...`);
console.error(`sample patra: ${deva('machIpatraM samarpayAmi')} / ${tr(deva('machIpatraM samarpayAmi'), 'tamil')}`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
