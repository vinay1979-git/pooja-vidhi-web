#!/usr/bin/env node
/**
 * Prana Pratishtha, whole.
 *
 *   node scripts/build-prana-pratishtha-nyasa.mjs          # validate + diff
 *   node scripts/build-prana-pratishtha-nyasa.mjs --emit   # write it
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), purvanga pooja pp.19-25,
 * step 18. Photograph discipline as in 0024 and 0025.
 *
 * THIS STEP HAS BEEN WRONG TWICE, IN TWO DIFFERENT WAYS.
 *
 * First it was invented: it said, in effect, "I shall now perform prana
 * pratishtha", with no mantra behind it. Migration 0021 replaced that with the
 * genuine Vedic core -- asunītē punarasmāsu cakṣuḥ, and amṛtaṃ vai prāṇāḥ --
 * which was right as far as it went. It went about a fifth of the way. The rite
 * the book prints runs six pages, and what 0021 restored is the passage in the
 * middle of it.
 *
 * What was missing, in order:
 *
 *   - the viniyoga: rishi, chhandas, devata, and the bija, shakti and kilaka
 *   - the kara nyasa, six syllables placed on the fingers and the palms
 *   - the anga nyasa, six more placed on the body, and the digbandha
 *   - the dhyanam of Prana Shakti herself, the red-hued goddess on the lotus
 *   - the bija string and the haṃsaḥ so'ham
 *   - "asyāṃ mūrtau prāṇastiṣṭhatu": the sentence that actually asks the breath,
 *     the life, and every sense and faculty to come and stay
 *   - the nine "bhava" lines, where the app had three
 *   - the address and the request to remain until the pooja ends
 *
 * AND A DEFECT THE BOOK EXPOSED. Pages 24-25 print the bhava lines in two
 * parallel columns, masculine for a god and feminine for a goddess --
 * āvāhito/āvāhitā, supreeto/supreetā, sumukho/sumukhī, varado/varadā. The
 * Varalakshmi step mixed them: feminine āvāhitā, sthāpitā and varadā, and then
 * MASCULINE suprasanno in the middle of them. That is fixed here, and only that,
 * because Varalakshmi is on hold until its own section of the book is
 * photographed; its full nyasa waits for that pass.
 */
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { checkScripts } from './_sources.mjs';
import { emitMigration } from './_migration.mjs';

let failed = false;
const fail = (m) => {
  failed = true;
  console.error(`  FAIL ${m}`);
};

const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';
const PHOTO =
  'Transcribed from a photograph of the printed page, so unlike the round-tripped sources in this project it carries no reversibility proof.';

// -----------------------------------------------------------------------------
// The rite, in the book's order.
// -----------------------------------------------------------------------------

/** pp.19-20: who the mantra belongs to, and what it is for. */
const VINIYOGA = [
  'ॐ अस्य श्री प्राणप्रतिष्ठा महामन्त्रस्य ।',
  'ब्रह्म विष्णु महेश्वराः ऋषयः ।',
  'ऋग्यजुस्सामाथर्वाणि छन्दांसि ।',
  'सकल जगत्सृष्टिस्थिति संहारकारिणी प्राणशक्तिः परादेवता ।',
  'आं बीजम् । ह्रीं शक्तिः । क्रों कीलकम् ।',
  'प्राण प्रतिष्ठार्थे जपे विनियोगः ॥',
];

/** pp.20-21: six syllables on the fingers, then the palms. */
const KARA_NYASA = [
  'आं अंगुष्ठाभ्यां नमः ।',
  'ह्रीं तर्जनीभ्यां नमः ।',
  'क्रों मध्यमाभ्यां नमः ।',
  'आं अनामिकाभ्यां नमः ।',
  'ह्रीं कनिष्ठिकाभ्यां नमः ।',
  'क्रों करतलकरपृष्ठाभ्यां नमः ॥',
];

/** p.22: six more on the body, then the sealing of the directions. */
const ANGA_NYASA = [
  'आं हृदयाय नमः ।',
  'ह्रीं शिरसे स्वाहा ।',
  'क्रों शिखायै वषट् ।',
  'आं कवचाय हुं ।',
  'ह्रीं नेत्रत्रयाय वौषट् ।',
  'क्रों अस्त्राय फट् ।',
  'भूर्भुवस्सुवरोमिति दिग्बन्धः ॥',
];

/** p.23: Prana Shakti, and the seed syllables. */
const DHYANAM = [
  'रक्तांबोधिस्थ पोतोल्लसदरुण सरोजाधिरूढा कराब्जैः ।',
  'पाशं कोदण्डमिक्षूद्भवमलिगुणमप्यंकुशं पञ्चबाणान् ॥',
  'बिभ्राणासृक्कपालं त्रिनयनलसिताऽऽपीन वक्षोरुहाढ्या ।',
  'देवी बालार्कवर्णा भवतु सुखकरी प्राणशक्तिः परा नः ॥',
  'ॐ आं ह्रीं क्रों । क्रों ह्रीं आं ।',
  'अं यं रं लं वं शं षं सं हं ।',
  'हंसः सोऽहं, सोऽहं हंसः ॥',
];

/**
 * pp.23-24: the sentence that does the work.
 *
 * Everything before this places and prepares. This is the request itself, and
 * it is specific in a way the app's previous text never was -- not "let there
 * be life" but let the breath and the life stay in this image, and the speech,
 * the mind, the skin, the eye, the ear, the tongue, the nose, the hands, the
 * feet, and the organs of elimination and generation, and the five breaths;
 * let them come here and remain, well and happy, for a long time.
 */
const ASYAM_MURTAU = [
  'अस्यां मूर्तौ प्राणस्तिष्ठतु जीवस्तिष्ठतु ।',
  'अस्यां मूर्तौ सर्वेन्द्रियाणि',
  'वाङ् मनस् त्वक् चक्षुः श्रोत्र जिह्वा घ्राण पाणि पाद पायूपस्थानि,',
  'प्राणापान व्यानोदान समानाः इहागत्य',
  'स्वस्ति सुखं चिरं तिष्ठन्तु स्वाहा ॥',
  'सान्निध्यं कुरु स्वाहा ।',
];

/** p.24, the Vedic core that 0021 restored, with the book's closing line. */
const VEDIC_CORE = [
  'ॐ असुनीते पुनरस्मासु चक्षुः',
  'पुनः प्राणमिह नो धेहि भोगम् ।',
  'ज्योक्पश्येम सूर्यमुच्चरन्त',
  'मनुमते मृडया नः स्वस्ति ॥',
  'प्राणान् प्रतिष्ठापयामि ।',
  // Kept from the previous text although the book does not print it here: a
  // shorter printed recension is not evidence against a longer recitation, and
  // this passage is what 0021 sourced from the Telugu kalpam.
  'अमृतं वै प्राणा अमृतमापः',
  'प्राणानेव यथास्थानमुपह्वयते ॥',
];

/**
 * pp.24-25. The book prints these in two columns and says which to use: the
 * left for a god, the right for a goddess. The app had three of the nine, and
 * Varalakshmi's were a mixture of both genders.
 */
const BHAVA = {
  male: [
    'आवाहितो भव । स्थापितो भव ।',
    'सन्निहितो भव । सन्निरुद्धो भव ।',
    'अवकुण्ठितो भव । सुप्रीतो भव ।',
    'सुप्रसन्नो भव । सुमुखो भव । वरदो भव ॥',
    // Not in the book's nine, and kept anyway: these two came from the Telugu
    // kalpam by way of 0021, they are widely recited, and the rule this project
    // follows with the book is that a shorter printed recension is not evidence
    // against a longer recitation. The diff is what caught the near-removal.
    'स्थिरो भव । स्थिरासनं कुरु ।',
    'स्वामिन् सर्वजगन्नाथ',
  ],
  female: [
    'आवाहिता भव । स्थापिता भव ।',
    'सन्निहिता भव । सन्निरुद्धा भव ।',
    'अवकुण्ठिता भव । सुप्रीता भव ।',
    'सुप्रसन्ना भव । सुमुखी भव । वरदा भव ॥',
    'देवि सर्वजगन्नायिके',
  ],
};

/**
 * p.25. The book offers three words for what the deity is asked to remain in --
 * bimbe'smin, kalashe'smin, pratimayam -- and expects one to be chosen. Ganesha
 * is invoked into a clay image, so bimbe'smin; Varalakshmi into a dressed
 * kalasham, so kalashe'smin. The app already knows which, and picking the right
 * one is the whole reason the book prints all three.
 */
const REMAIN = (vessel) => [
  'यावत्पूजावसानकाले तावत् त्वं प्रीतिभावेन',
  `${vessel} सन्निधिं कुरु ॥`,
];

const GANESHA = [
  ...VINIYOGA,
  ...KARA_NYASA,
  ...ANGA_NYASA,
  ...DHYANAM,
  ...ASYAM_MURTAU,
  ...VEDIC_CORE,
  'ॐ श्री सिद्धिविनायक स्वामिने नमः ।',
  ...BHAVA.male,
  ...REMAIN('बिंबेऽस्मिन्'),
];

const GANESHA_INSTR =
  'Place the right palm on the head, the nostrils and the chest for the three lines of the viniyoga, then on the right chest, the left chest and the middle of the chest for the bija, shakti and kilaka. For the kara nyasa roll the thumb from the base of each finger to its tip in turn, then rub the palms together. For the anga nyasa touch chest, forehead, tuft, shoulders crossed, the three eyes, and strike the left palm with the right index and middle fingers. Seal the directions by rolling the right hand clockwise around the head. Then meditate on Prana Shakti and chant. BEFORE the asunite verse, chant "Om" fifteen times, for the fifteen sacraments of the deity from jatakarma onwards. Finish with the nine "bhava" lines, asking the deity to remain until the pooja ends.';

const GANESHA_INSTR_TA =
  'விநியோகத்தின் மூன்று வரிகளுக்கு வலது உள்ளங்கையைத் தலையிலும், நாசியிலும், மார்பிலும் வைக்கவும்; பீஜம், சக்தி, கீலகம் ஆகியவற்றுக்கு வலது மார்பு, இடது மார்பு, மார்பின் நடு ஆகியவற்றில் வைக்கவும். கர ந்யாஸத்தில், ஒவ்வொரு விரலின் அடியிலிருந்து நுனி வரை கட்டைவிரலை உருட்டவும்; பிறகு இரு உள்ளங்கைகளையும் தேய்க்கவும். அங்க ந்யாஸத்தில் மார்பு, நெற்றி, குடுமி, கை குறுக்காகத் தோள்கள், மூன்று கண்கள் ஆகியவற்றைத் தொட்டு, வலது ஆள்காட்டி நடுவிரல்களால் இடது உள்ளங்கையில் தட்டவும். வலது கையைத் தலையைச் சுற்றி வலமாகச் சுழற்றி திக்பந்தம் செய்யவும். பிறகு ப்ராணசக்தியை த்யானித்துச் சொல்லவும். "அஸுநீதே" மந்திரத்திற்கு முன், ஜாதகர்மம் முதலான பதினைந்து சம்ஸ்காரங்களுக்காக "ஓம்" பதினைந்து முறை சொல்லவும். இறுதியாக ஒன்பது "பவ" வரிகளைச் சொல்லி, பூஜை முடியும் வரை எழுந்தருளியிருக்கும்படி வேண்டவும்.';

const GANESHA_MEANING =
  'The mantra of prana pratishtha: its rishis are Brahma, Vishnu and Maheshwara; its metres are the Rig, Yajus, Saman and Atharvan; its deity is the supreme Prana Shakti who makes, sustains and withdraws the whole world. Aam is the seed, hreem the power, krom the pin; it is used in recitation for the establishing of life. May the goddess of the colour of the young sun, seated on the lotus, bearing noose and bow and goad and five arrows, become the giver of happiness to us. In this image let the breath abide and the life abide; in this image let all the senses — speech, mind, skin, eye, ear, tongue, nose, hands, feet, and the organs below — and the five breaths come and remain, well and happy, for a long time. Giver of breath, place sight in us again, and breath again, and enjoyment here; long may we see the sun rise. Be invoked, be established, be present, be held here, be veiled, be well pleased, be gracious, be fair of face, be the giver of boons. Lord of all the world, until the pooja ends remain with love in this image.';

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------

const scripts = (deva) => ({
  deva,
  ta: transliterate(Sanscript, deva, 'tamil'),
  iast: transliterate(Sanscript, deva, 'iast'),
});

console.log('--- building ---\n');

const ganesha = scripts(GANESHA.join('\n'));
checkScripts('ganesha Prana Pratishtha', ganesha, fail);
console.log(`  ganesha_standard/Prana Pratishtha: ${GANESHA.length} lines`);

// The nyasa syllables are the point of the rite and are easy to lose in
// transliteration; assert the six kara-nyasa bijas survived into all three.
for (const bija of ['आं', 'ह्रीं', 'क्रों']) {
  const t = transliterate(Sanscript, bija, 'tamil');
  const i = transliterate(Sanscript, bija, 'iast');
  if (!ganesha.ta.includes(t)) fail(`the Tamil lost the bija ${bija} (expected ${t})`);
  if (!ganesha.iast.includes(i)) fail(`the transliteration lost the bija ${bija} (expected ${i})`);
}

// Every masculine bhava line must be masculine, and no feminine one may be
// left in it. This is the defect the book exposed, checked in the direction it
// occurred.
for (const f of ['आवाहिता भव', 'स्थापिता भव', 'सुप्रसन्ना भव', 'वरदा भव', 'सुमुखी भव']) {
  if (ganesha.deva.includes(f)) fail(`a feminine bhava line reached the Ganesha step: ${f}`);
}
/**
 * Count the nine PHRASES, not the substring "bhava".
 *
 * Counting the substring found eleven: the dhyanam of Prana Shakti says
 * "bhavatu sukhakaree" and the request says "preetibhaavena". A check that
 * counts a fragment of a word counts other words.
 */
const MALE_BHAVA = [
  'आवाहितो भव', 'स्थापितो भव', 'सन्निहितो भव', 'सन्निरुद्धो भव', 'अवकुण्ठितो भव',
  'सुप्रीतो भव', 'सुप्रसन्नो भव', 'सुमुखो भव', 'वरदो भव',
];
for (const b of MALE_BHAVA) {
  const n = ganesha.deva.split(b).length - 1;
  if (n !== 1) fail(`expected "${b}" exactly once, found ${n}`);
}

// Varalakshmi: one word, and nothing else.
const VL_FIX = { from: 'सुप्रसन्नो भव', to: 'सुप्रसन्ना भव' };
const vlFix = {
  from: scripts(VL_FIX.from),
  to: scripts(VL_FIX.to),
};
checkScripts('varalakshmi bhava fix', vlFix.to, fail);
console.log(`  varalakshmi_vratham/Prana Pratishtha: ${VL_FIX.from} -> ${VL_FIX.to}`);

if (failed) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Diff against live
// -----------------------------------------------------------------------------

async function printDiff() {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
  const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!U || !K) return console.log('\n(no .env.local; skipping the diff)');
  const rows = await (
    await fetch(
      `${U}/rest/v1/pooja_steps?select=pooja_id,step_title_en,mantra_sanskrit&step_title_en=eq.Prana%20Pratishtha`,
      { headers: { apikey: K, Authorization: `Bearer ${K}` } },
    )
  ).json();
  for (const r of rows) {
    const before = (r.mantra_sanskrit || '').split('\n');
    const after =
      r.pooja_id === 'ganesha_standard'
        ? GANESHA
        : before.map((l) => l.replace(VL_FIX.from, VL_FIX.to));
    const keep = new Set(before);
    const had = new Set(after);
    console.log(`\n  ${r.pooja_id} (${before.length} -> ${after.length} lines)`);
    for (const l of before.filter((l) => l && !had.has(l))) console.log(`    - ${l}`);
    for (const l of after.filter((l) => l && !keep.has(l))) console.log(`    + ${l}`);
  }
}

if (!process.argv.includes('--no-diff')) {
  console.log('\n--- diff against live ---');
  await printDiff();
}

// -----------------------------------------------------------------------------
// SQL
// -----------------------------------------------------------------------------

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0026_prana_pratishtha_nyasa.sql');
out('--');
out('-- GENERATED by scripts/build-prana-pratishtha-nyasa.mjs. Do not hand-edit.');
out('--');
out('-- Prana Pratishtha has been wrong twice. First it was invented -- "I shall now');
out('-- perform prana pratishtha", with no mantra behind it. 0021 replaced that with');
out('-- the genuine Vedic core, which was right as far as it went, and it went about');
out('-- a fifth of the way: the rite the book prints runs six pages and what 0021');
out('-- restored sits in the middle of it.');
out('--');
out('-- Added: the viniyoga (rishi, chhandas, devata, bija, shakti, kilaka); the kara');
out('-- nyasa; the anga nyasa and the digbandha; the dhyanam of Prana Shakti; the');
out('-- bija string and hamsah so-ham; "asyam murtau pranastishthatu", the sentence');
out('-- that actually asks the breath and every sense to come and stay; six more');
out('-- bhava lines; and the request to remain until the pooja ends.');
out('--');
out('-- AND a defect the book exposed. Pages 24-25 print the bhava lines in parallel');
out('-- masculine and feminine columns. Varalakshmi mixed them: feminine aavaahitaa,');
out('-- sthaapitaa and varadaa, with MASCULINE suprasanno among them. One word is');
out('-- corrected here and nothing else, because Varalakshmi is on hold until its own');
out('-- section of the book is photographed.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- ganesha_standard / Prana Pratishtha -------------------------------------');
out('update public.pooja_steps set');
out(`  mantra_sanskrit = ${q(ganesha.deva)},`);
out(`  mantra_tamil = ${q(ganesha.ta)},`);
out(`  mantra_translit = ${q(ganesha.iast)},`);
out(`  instruction_en = ${q(GANESHA_INSTR)},`);
out(`  instruction_ta = ${q(GANESHA_INSTR_TA)},`);
out(`  meaning_en = ${q(GANESHA_MEANING)},`);
out(
  `  source_ref = ${q(
    `${BOOK}, purvanga pooja pp.19-25, step 18, praaNapratiSHTHaa, in full: viniyoga, kara nyaasa, anga nyaasa, digbandha, the dhyaanam of Praana Shakti, the bija string, "asyaam moortau praaNastiSHTHatu", and the nine bhava lines from the masculine column on p.24-25. "bimbe'smin" is chosen from the book's three alternatives (bimbe'smin / kalashe'smin / pratimaayaam) because this deity is invoked into a clay image. "amRtaM vai praaNaa", and "sthiro bhava / sthiraasanam kuru", are retained from the previous StotraNidhi-sourced text although the book does not print them here. One phrase is replaced rather than kept: the deity address "shree mahaagaNapataye namaha" becomes "OM shree siddhivinaayaka svaamine namaha", which is the address every other step in this pooja uses. ${PHOTO} Tamil instruction prose is this project’s own drafting.`,
  )},`,
);
out('  verified_by = null,');
out('  verified_at = null,');
out('  updated_at = now()');
out(" where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha';");
out();

out('-- --- varalakshmi_vratham: the gender agreement only --------------------------');
out('-- A masculine bhava line standing in a feminine set. Scoped to a replace of');
out('-- that one phrase so nothing else in the step moves.');
for (const [col, v] of [
  ['mantra_sanskrit', vlFix],
  ['mantra_tamil', vlFix],
  ['mantra_translit', vlFix],
]) {
  const key = col === 'mantra_sanskrit' ? 'deva' : col === 'mantra_tamil' ? 'ta' : 'iast';
  out(`update public.pooja_steps set ${col} = replace(${col}, ${q(v.from[key])}, ${q(v.to[key])}),`);
  out('  updated_at = now()');
  out(" where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Prana Pratishtha';");
}
out();

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- The rite is no longer a fragment.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha'");
out("     and mantra_sanskrit like '%प्राण प्रतिष्ठार्थे जपे विनियोगः%'");
out("     and mantra_sanskrit like '%करतलकरपृष्ठाभ्यां%'");
out("     and mantra_sanskrit like '%दिग्बन्धः%'");
out("     and mantra_sanskrit like '%अस्यां मूर्तौ प्राणस्तिष्ठतु%'");
out("     and mantra_sanskrit like '%यावत्पूजावसानकाले%';");
out("  if n <> 1 then raise exception 'the prana pratishtha is still missing a section'; end if;");
out('  -- All nine bhava lines, as PHRASES. Counting the substring "bhava" finds');
out('  -- eleven, because the dhyanam says "bhavatu sukhakaree".');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha'");
for (const b of MALE_BHAVA) out(`     and mantra_sanskrit like '%' || ${q(b)} || '%'`);
out('  ;');
out("  if n <> 1 then raise exception 'a masculine bhava line is missing from the Ganesha step'; end if;");
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha'");
out("     and (mantra_sanskrit like '%आवाहिता भव%' or mantra_sanskrit like '%सुप्रसन्ना भव%'");
out("          or mantra_sanskrit like '%वरदा भव%' or mantra_sanskrit like '%सुमुखी भव%');");
out("  if n > 0 then raise exception 'a feminine bhava line is in the Ganesha step'; end if;");
out('  -- and no masculine one left in the feminine set.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Prana Pratishtha'");
out("     and (mantra_sanskrit like '%सुप्रसन्नो भव%' or mantra_tamil like '%ஸுப்ரஸந்நோ ப⁴வ%');");
out("  if n > 0 then raise exception 'a masculine bhava line is still in the Varalakshmi step'; end if;");
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Prana Pratishtha'");
out("     and mantra_sanskrit like '%सुप्रसन्ना भव%';");
out("  if n <> 1 then raise exception 'the Varalakshmi bhava line was not corrected'; end if;");
out('  -- The nyasa syllables survived into every script.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha'");
out(`     and mantra_tamil like '%' || ${q(transliterate(Sanscript, 'क्रों', 'tamil'))} || '%'`);
out(`     and mantra_translit like '%' || ${q(transliterate(Sanscript, 'क्रों', 'iast'))} || '%';`);
out("  if n <> 1 then raise exception 'the bija syllables did not survive transliteration'; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select length(mantra_sanskrit) from pooja_steps");
out("--    where pooja_id = 'ganesha_standard' and step_title_en = 'Prana Pratishtha';");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0026_prana_pratishtha_nyasa.sql', sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
