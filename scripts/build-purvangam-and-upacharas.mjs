#!/usr/bin/env node
/**
 * The last of the placeholder steps. Emits 0020.
 *
 *   node scripts/build-purvangam-and-upacharas.mjs          # validate only
 *   node scripts/build-purvangam-and-upacharas.mjs --emit   # write it
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LEFT, AFTER 0019
 *
 * Eighteen steps still carried source_ref 'Tamil draft, pending vaidika
 * review'. They are not all equally wrong, and saying so matters:
 *
 *   ALREADY CORRECT, just unsourced and short
 *     Achamanam, Anga Vandanam, Pranayamam. The mantras are right. What they
 *     lacked was a citation and, for the dhyanam, a second verse.
 *
 *   MATERIALLY INCOMPLETE
 *     Kalasha Pooja had one verse where the paddhati has six sections, missing
 *     the entire kalaśasya mukhe invocation, the āpo vā idaṃ sarvaṃ, the pancha
 *     ganga and the samprokshana that is the point of the step -- the water is
 *     charged so it can be sprinkled on the materials, the deity and yourself,
 *     and none of that was there.
 *     Ganesha's Padyam & Arghyam, Snanam & Vastram and Gandham/Kumkumam/Pushpam
 *     were bare samarpayami tags with no verse at all, three or four upacharas
 *     compressed into a line each.
 *     Avahanam & Asanam had no dhyana verse and no avahana verse.
 *
 *   WRONG
 *     Ghanta Pooja spells देवताव्हान. The word is आह्वान, invocation --
 *     devatāhvāna. "vhāna" is not a word in Sanskrit. It also writes घन्टा for
 *     घण्टा, dental n where the retroflex ṇ belongs. Both in both poojas,
 *     in production since the first migration.
 *     Avahanam & Asanam invoked Ganesha अस्मिन् हरिद्रा बिम्बे, "into this
 *     turmeric image". That is the Haridra Ganapati rite. On Ganesha Chaturthi
 *     the deity is invoked into the clay idol, and the turmeric Pillaiyar is a
 *     separate step which Varalakshmi has and this pooja does not.
 *
 * ---------------------------------------------------------------------------
 * ONE RECENSION CALL, MADE DELIBERATELY
 *
 * StotraNidhi's Smartha purvangam gives the achamanam as keśavāya svāhā,
 * nārāyaṇāya svāhā, mādhavāya svāhā and then twenty-one more names. Ours is
 * acyutāya namaḥ, anantāya namaḥ, govindāya namaḥ.
 *
 * Ours is NOT replaced. That page is Telugu Smartha; this app is for Tamil
 * Smartha (Iyer) households, where the achamanam is the acyuta-ananta-govinda
 * form and the keshava names are said afterwards touching the limbs, which is
 * exactly what our Anga Vandanam does. Taking the "better sourced" text here
 * would have swapped a correct Tamil achamanam for a correct Telugu one. The
 * source_ref records the difference rather than hiding it.
 *
 * The Sankalpam is also left alone. It carries the [DYNAMIC_PANCHANGAM_DATA]
 * slot the panchangam engine renders into, the published one is a form with
 * blanks, and swapping the text under a live template is how you break a
 * sankalpam silently. Flagged, not touched.
 */
import { emitMigration } from './_migration.mjs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate as tr } from './_tamil.mjs';
import {
  loadRoman, loadTelugu, section, teluguToDeva, iastToDeva, normalise, checkScripts,
} from './_sources.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';

const fail = (m) => {
  console.error(`FAIL  ${m}`);
  process.exitCode = 1;
};

const kalpam = loadTelugu(`${DIR}vvk_te.txt`);
const purvangam = loadRoman(`${DIR}pv_en.txt`);

// samarpanam is the kalpam's last section: after it the page carries "see the
// vrata katha", "see the dandakam" and a Click-here-to-buy, none of which is
// liturgy and one of which is English.
const KALPAM_END = { 'సమర్పణం': /^అనయా/ };
const fromKalpam = (name) =>
  section(kalpam, name, { script: 'telugu', stopAt: KALPAM_END[name], fail })
    .map((l) => normalise(teluguToDeva(Sanscript, l, fail)));
// ghaṇṭānādam is the last section on the purvangam page, so it needs an
// explicit end or it runs into the site footer.
const PURVANGAM_END = { 'ghaṇṭānādam': /^iti ghaṇṭānādaṃ/ };
const fromPurvangam = (name) =>
  section(purvangam, name, { script: 'roman', stopAt: PURVANGAM_END[name], fail })
    .map((l) => iastToDeva(Sanscript, l, fail));

// ---------------------------------------------------------------------------
// The steps.
// ---------------------------------------------------------------------------
const PURVANGAM_SRC =
  'StotraNidhi, Puja Vidhanam (Poorvangam \u2013 Smartha Paddhati), stotranidhi.com/en/puja-vidhanam-poorvangam-in-english/, round-trip verified IAST->Devanagari by scripts/build-purvangam-and-upacharas.mjs. Svara marks are stripped; the app does not render them yet.';
const KALPAM_SRC =
  'StotraNidhi Sri Siddhi Vinayaka Vrata Kalpam (Telugu), round-trip verified Telugu->Devanagari by scripts/build-purvangam-and-upacharas.mjs. Replaces a bare samarpayami tag that carried no verse.';

const STEPS = [];
const both = (o) => {
  STEPS.push({ ...o, pooja: 'ganesha_standard' });
  STEPS.push({ ...o, pooja: 'varalakshmi_vratham' });
};

// --- shared purvangam --------------------------------------------------------

both({
  title: 'Achamanam',
  // Text unchanged on purpose. See the recension note in the header.
  keep: true,
  source:
    'Tamil Smartha (Iyer) achamanam, acyuta-ananta-govinda. DELIBERATELY NOT the form in StotraNidhi\u2019s Smartha Paddhati purvangam, which is the Telugu recension (keśavāya svāhā, nārāyaṇāya svāhā, mādhavāya svāhā and twenty-one further names); in Tamil practice those names are said at the Anga Vandanam that follows, touching the limbs, not at the achamanam. Text is unchanged from the original content and still wants vaidika confirmation of the wording, but the recension is the right one for this audience.',
});

both({
  title: 'Anga Vandanam',
  keep: true,
  source:
    'The twelve names said touching the limbs, Tamil Smartha practice. StotraNidhi\u2019s Smartha Paddhati prints twenty-four in its achamanam (through śrīkṛṣṇāya namaḥ); the twelve here are what an Iyer says at this step, and the instruction names the limb for each. Text unchanged from the original content.',
});

both({
  title: 'Vighneshwara Dhyanam',
  // The paddhati's prarthana opens with the verse we had and follows it with
  // agajānana, which is the Ganesha verse proper -- ours stopped at the first.
  deva: () => fromPurvangam('prārthanā').slice(0, 4),
  source: PURVANGAM_SRC,
  instruction_en:
    'Tap your temples gently with the knuckles of both hands while reciting. The first verse is the general invocation said before any undertaking; the second is to Ganesha himself.',
  instruction_ta:
    'இரு கைகளின் நெரிக்கும் விரல் மூட்டுகளால் நெற்றிப் பொட்டுகளில் மெதுவாகத் தட்டியபடி பாராயணம் செய்யவும். முதல் ஸ்லோகம் எந்தக் காரியத்தின் தொடக்கத்திலும் சொல்லப்படும் பொது வணக்கம்; இரண்டாவது விநாயகருக்கே உரியது.',
});

both({
  title: 'Pranayamam',
  deva: () => fromPurvangam('prāṇāyāmam'),
  source: PURVANGAM_SRC,
});

// The published kalashārādhanam is a form: "āyāntu śrī ____ pūjārthaṃ" has a
// blank where the deity goes. Filled per pooja -- shipping a literal ____ on
// screen would be worse than the one-verse version it replaces.
const DEITY_IN_KALASHA = {
  ganesha_standard: 'श्री महागणपति',
  varalakshmi_vratham: 'श्री वरलक्ष्मी',
};

both({
  title: 'Kalasha Pooja',
  deva: (pooja) =>
    fromPurvangam('kalaśārādhanam').map((l) =>
      l.replace(/श्री _+/, DEITY_IN_KALASHA[pooja]),
    ),
  source: PURVANGAM_SRC,
  instruction_en:
    'Put sandal, kumkumam and akshatai on the vessel, fill it with water, and rest your right hand over its mouth while reciting. The verses seat Vishnu at the mouth, Rudra at the neck and Brahma at the base, then call the seven rivers into the water. At the end sprinkle that water on the pooja materials, on the deity and on yourself \u2014 that sprinkling is what the whole step is for.',
  instruction_ta:
    'கலசத்தில் சந்தனம், குங்குமம், அக்ஷதை இட்டு, ஜலம் நிரப்பி, வலது கையை அதன் வாயின் மேல் வைத்தபடி பாராயணம் செய்யவும். ஸ்லோகங்கள் வாயில் விஷ்ணுவையும், கழுத்தில் ருத்திரனையும், அடியில் பிரம்மனையும் நிலைபெறச் செய்து, பின் ஏழு நதிகளையும் அந்த ஜலத்தில் ஆவாஹனம் செய்கின்றன. இறுதியில் அந்த ஜலத்தை பூஜைப் பொருட்கள் மீதும், சுவாமியின் மீதும், உங்கள் மீதும் தெளிக்கவும் \u2014 இந்தப் ப்ரோக்ஷணமே இந்தப் படியின் நோக்கம்.',
});

both({
  title: 'Ghanta Pooja',
  deva: () => [...fromPurvangam('ghaṇṭapūjā'), ...fromPurvangam('ghaṇṭānādam')],
  source:
    PURVANGAM_SRC +
    ' Corrects two spellings that were in production in both poojas: देवताव्हान for देवताह्वान (āhvāna, invocation \u2014 vhāna is not a word), and घन्टा for घण्टा. The paddhati also reads ghaṇṭāravaṃ karomyādau where the earlier text had kuru ghaṇṭāravaṃ tatra; both readings circulate and the published one is used.',
  instruction_en:
    'Worship the bell with akshatai, then ring it with the left hand. The verse says plainly what the sound is for: to call the devas and to send away what should not be here.',
  instruction_ta:
    'மணியை அக்ஷதையால் பூஜித்து, பின் இடது கையால் அடிக்கவும். அந்த ஒலி எதற்கு என்பதை ஸ்லோகமே சொல்கிறது: தேவர்களை அழைக்கவும், இருக்கக் கூடாதவற்றை விலக்கவும்.',
});

// --- Ganesha's upacharas -----------------------------------------------------

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Avahanam & Asanam',
  deva: () => [...fromKalpam('ధ్యానం'), ...fromKalpam('ఆవాహనం'), ...fromKalpam('ఆసనం')],
  source:
    KALPAM_SRC +
    ' Also replaces "asmin haridrā bimbe", which invoked Ganesha into a turmeric cone: that is the Haridra Ganapati rite, and on Ganesha Chaturthi the deity is invoked into the idol.',
  instruction_en:
    'Meditate on the form first, then invite him with akshatai and flowers, then offer the seat. He is invoked into the idol you have installed, not into a turmeric cone \u2014 the turmeric Pillaiyar is a separate pooja.',
  instruction_ta:
    'முதலில் திருவுருவத்தை த்யானிக்கவும்; பின் அக்ஷதையும் புஷ்பமும் கொண்டு ஆவாஹனம் செய்து, ஆசனம் சமர்ப்பிக்கவும். நீங்கள் பிரதிஷ்டை செய்த விக்கிரகத்திலேயே ஆவாஹனம் \u2014 மஞ்சள் பிள்ளையாரில் அல்ல; அது தனிப் பூஜை.',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Padyam & Arghyam',
  deva: () => [
    ...fromKalpam('అర్ఘ్యం'), ...fromKalpam('పాద్యం'),
    ...fromKalpam('ఆచమనీయం'), ...fromKalpam('మధుపర్కం'),
  ],
  source: KALPAM_SRC,
  instruction_en:
    'Four offerings of water, each into a separate empty bowl, never back into the panchapatra: arghyam for the hands, padyam for the feet, achamaniyam for sipping, and the madhuparkam of curd, milk, honey and ghee for a guest of honour.',
  instruction_ta:
    'நான்கு ஜல சமர்ப்பணங்கள் \u2014 ஒவ்வொன்றையும் தனி வெறும் பாத்திரத்தில் விடவும், பஞ்சபாத்திரத்திற்குள் மீண்டும் விடக் கூடாது: கைகளுக்கு அர்க்யம், திருவடிகளுக்கு பாத்யம், ஆசமனத்திற்கு ஆசமனீயம், சிறந்த விருந்தினருக்குரிய தயிர், பால், தேன், நெய் கலந்த மதுபர்க்கம்.',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Snanam & Vastram',
  deva: () => [
    ...fromKalpam('పంచామృత స్నానం'), ...fromKalpam('శుద్ధోదక స్నానం'),
    ...fromKalpam('వస్త్రం'), ...fromKalpam('యజ్ఞోపవీతం'),
  ],
  source: KALPAM_SRC,
  instruction_en:
    'Bathe the idol in panchamritam, then in clean water, and offer achamaniyam after. Then the vastram, and the single poonal that is on the samagri list for this pooja. Akshatai or a flower stands in for cloth if you have none.',
  instruction_ta:
    'விக்கிரகத்திற்கு பஞ்சாமிர்தத்தால் அபிஷேகம் செய்து, பின் சுத்த ஜலத்தால் ஸ்நானம் செய்வித்து, பிறகு ஆசமனீயம் சமர்ப்பிக்கவும். பின் வஸ்திரமும், இந்தப் பூஜைக்கான சாமக்ரி பட்டியலில் உள்ள ஒற்றைப் பூணூலும். துணி இல்லையெனில் அக்ஷதையோ புஷ்பமோ அதற்குப் பதிலாகும்.',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Gandham, Kumkumam & Pushpam',
  deva: () => [...fromKalpam('గంధం'), ...fromKalpam('అక్షతాన్'), ...fromKalpam('పుష్పాణి')],
  source: KALPAM_SRC,
  instruction_en:
    'Sandal paste first, then kumkumam and akshatai, then the flowers. The pushpam verse asks for the twenty-one leaves by name, which is what the Patra Pooja a few steps later offers one at a time.',
  instruction_ta:
    'முதலில் சந்தனம், பின் குங்குமமும் அக்ஷதையும், பிறகு புஷ்பங்கள். புஷ்ப ஸ்லோகம் இருபத்தொரு பத்திரங்களையும் பெயர் சொல்லிக் கேட்கிறது \u2014 அவற்றையே சில படிகளுக்குப் பின் வரும் பத்ர பூஜையில் ஒவ்வொன்றாகச் சமர்ப்பிக்கிறோம்.',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Kshama Prarthana & Conclusion',
  deva: () => fromKalpam('సమర్పణం'),
  source: KALPAM_SRC,
  instruction_en:
    'Ask forgiveness for whatever was short in the mantras, in the procedure or in the attention, and dedicate the whole pooja. Release akshatai and water at the end.',
  instruction_ta:
    'மந்திரத்திலோ, கிரியையிலோ, பக்தியிலோ குறைந்தது எதுவானாலும் மன்னிக்கும்படி வேண்டி, பூஜை முழுவதையும் சமர்ப்பிக்கவும். இறுதியில் அக்ஷதையும் ஜலமும் விடவும்.',
});

// ---------------------------------------------------------------------------
// Build and check.
// ---------------------------------------------------------------------------
for (const s of STEPS) {
  if (s.keep) continue;
  const deva = s.deva(s.pooja).join('\n');
  s.s = { deva, ta: tr(Sanscript, deva, 'tamil'), iast: tr(Sanscript, deva, 'iast') };
  checkScripts(`${s.pooja}/${s.title}`, s.s, fail);
}

// The Ghanta correction is the whole reason that step is in here.
const ghanta = STEPS.find((s) => s.title === 'Ghanta Pooja');
if (ghanta.s) {
  if (!ghanta.s.deva.includes('देवताह्वान')) fail('the ghanta mantra does not say देवताह्वान');
  if (ghanta.s.deva.includes('व्हान')) fail('the ghanta mantra still says व्हान');
  if (ghanta.s.deva.includes('घन्ट')) fail('the ghanta mantra still writes घन्ट for घण्ट');
}
// Kalasha must actually carry the sprinkling, which is what it was missing.
const kalasha = STEPS.find((s) => s.title === 'Kalasha Pooja');
for (const must of ['कलशस्य मुखे', 'गङ्गे च यमुने', 'सम्प्रोक्ष्य']) {
  if (kalasha.s && !kalasha.s.deva.includes(must)) fail(`kalasha pooja is missing "${must}"`);
}
// Nothing may still invoke Ganesha into a turmeric cone.
const avahanam = STEPS.find((s) => s.title === 'Avahanam & Asanam');
if (avahanam.s && avahanam.s.deva.includes('हरिद्रा')) fail('avahanam still invokes into the turmeric image');
// A template blank must never reach a mantra. The kalashārādhanam is a form
// with "śrī ____ pūjārthaṃ" in it, and that underscore run would have been on
// screen in Devanagari.
for (const s of STEPS) {
  if (!s.s) continue;
  for (const [k, v] of Object.entries(s.s)) {
    if (/_{2,}/.test(v)) fail(`${s.pooja}/${s.title}.${k} still has a template blank in it`);
  }
}
// Every replaced step must be a sequence.
for (const s of STEPS) {
  if (!s.s) continue;
  const n = s.s.deva.split('\n').length;
  if (n < 3) fail(`${s.pooja}/${s.title} is only ${n} line(s)`);
}

if (process.exitCode) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SQL.
// ---------------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const at = (p, t) => `pooja_id = '${p}' and step_title_en = '${t}'`;

const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0020_purvangam_and_upacharas.sql');
out('--');
out('-- GENERATED by scripts/build-purvangam-and-upacharas.mjs. Do not hand-edit.');
out('--');
out('-- The last of the steps carrying "Tamil draft, pending vaidika review".');
out('--');
out('-- Two spelling errors are corrected, both in production in BOTH poojas since');
out('-- the first migration: देवताव्हान for देवताह्वान -- आह्वान is invocation and');
out('-- "vhāna" is not a Sanskrit word -- and घन्टा for घण्टा.');
out('--');
out('-- Kalasha Pooja gains the five sections it was missing, including the');
out('-- samprokshana: the water is charged so it can be sprinkled on the materials,');
out('-- the deity and the performer, and none of that was in the step.');
out('--');
out('-- Ganesha stops being invoked "asmin haridrā bimbe", into a turmeric cone.');
out('-- That is the Haridra Ganapati rite; on Chaturthi he is invoked into the idol.');
out('--');
out('-- Achamanam and Anga Vandanam keep their text. StotraNidhi is Telugu Smartha');
out('-- and gives the keśavāya svāhā achamanam; the acyuta-ananta-govinda form here');
out('-- is the Tamil one, and the keshava names belong at the Anga Vandanam that');
out('-- follows. Only their source_ref changes, to say which recension and why.');
out('--');
out('-- The Sankalpam is deliberately untouched: it carries the dynamic panchangam');
out('-- slot, and the published version is a form with blanks.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const s of STEPS) {
  out(`-- --- ${s.pooja} / ${s.title}`);
  out('update public.pooja_steps set');
  if (s.instruction_en) out(`  instruction_en = ${q(s.instruction_en)},`);
  if (s.instruction_ta) out(`  instruction_ta = ${q(s.instruction_ta)},`);
  if (s.s) {
    out(`  mantra_sanskrit = ${q(s.s.deva)},`);
    out(`  mantra_tamil = ${q(s.s.ta)},`);
    out(`  mantra_translit = ${q(s.s.iast)},`);
  }
  out(`  source_ref = ${q(s.source)},`);
  out('  verified_by = null,');
  out('  verified_at = null,');
  out('  updated_at = now()');
  out(`where ${at(s.pooja, s.title)};`);
  out();
}

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- The misspellings must be gone everywhere, not just where this migration looked.');
out('  select count(*) into n from public.pooja_steps');
out("   where mantra_sanskrit like '%व्हान%' or mantra_sanskrit like '%घन्ट%'");
out("      or mantra_translit like '%vhāna%' or mantra_translit like '%ghanṭ%';");
out("  if n > 0 then raise exception '% steps still carry the ghanta misspellings', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Ghanta Pooja' and mantra_sanskrit like '%देवताह्वान%';");
out("  if n <> 2 then raise exception 'expected both ghanta steps corrected, found %', n; end if;");
out('  -- Kalasha without the samprokshana is the step with its point removed.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Kalasha Pooja'");
out("     and mantra_sanskrit like '%कलशस्य मुखे%' and mantra_sanskrit like '%सम्प्रोक्ष्य%';");
out("  if n <> 2 then raise exception 'expected both kalasha steps filled out, found %', n; end if;");
out('  -- No turmeric cone in the Chaturthi avahanam.');
out('  select count(*) into n from public.pooja_steps');
out(`   where ${at('ganesha_standard', 'Avahanam & Asanam')} and mantra_sanskrit like '%हरिद्रा%';`);
out("  if n > 0 then raise exception 'Ganesha is still invoked into a turmeric image'; end if;");
out('  -- Only the Sankalpam may still be an unreviewed draft.');
out('  select count(*) into n from public.pooja_steps');
out("   where source_ref like '%Tamil draft, pending vaidika review%'");
out("     and step_title_en <> 'Sankalpam';");
out("  if n > 0 then raise exception '% steps other than Sankalpam are still drafts', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select pooja_id, step_title_en from pooja_steps where source_ref like '%pending vaidika review%';");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0020_purvangam_and_upacharas.sql', sql);
} else {
  console.log('--- validated, not written (pass --emit) ---\n');
  const seen = new Set();
  for (const s of STEPS) {
    if (seen.has(s.title)) continue;
    seen.add(s.title);
    console.log(`##### ${s.title}${s.keep ? '   [text unchanged, re-sourced]' : ''}`);
    if (s.s) console.log(s.s.deva.split('\n').map((l) => '  ' + l).join('\n'));
    console.log();
  }
}
