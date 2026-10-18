#!/usr/bin/env node
/**
 * Samidadhanam, Brahma Yajnam and Bhojana Vidhi, from the book.
 *
 *   node scripts/build-nitya-karmas-from-the-book.mjs          # validate
 *   node scripts/build-nitya-karmas-from-the-book.mjs --emit   # write 0063
 *
 * Yajurveda Trikaala Sandhyaavandanam, Giri Trading Agency, English translation
 * by A. R. Parthasarathi: Samidaadhaanam book pp.49-54, Brahma Yajnam pp.55-60,
 * Bhojana Vidhi pp.60-61. The three rows have been on the shelf as 'planned'
 * since 0043; this writes their steps and publishes them.
 *
 * MANTRAS COME FROM THE TRANSCRIPTS, addressed by book page and block index, and
 * Tamil and IAST are derived with transliterate(). Nothing is retyped. These
 * pages print Devanagari, roman and rubric and NO English gloss, so every
 * meaning_en here is written for this app: a plain, conservative rendering of
 * the mantra shown. The ones a reviewer should check are listed in
 * docs/plans/nitya-karmas-0063.md.
 *
 * ONE ACTION AND ITS WORDS PER STEP (docs/PROJECT-GUIDE.md §2.2). Each homa
 * offering is its own screen, under a "Homa" section label. Lists of short
 * lines said with one repeated gesture -- the tarpanams, the seven raksha
 * marks, the six pranahutis -- are archana_items, so the focus view shows one
 * line at a time, as sandhyavandanam's Navagraha Deva Tarpanam does.
 *
 * NOTHING SENDS THE READER BACK. The book opens Samidaadhaanam and Brahma
 * Yajnam with "aachamanam & angavandanam (twice) -- refer page no. 16, 17",
 * "vighneshvara dhyaanam -- refer page no. 18", "praanaayaamaha -- page 18",
 * "sankalpaha -- page 19 and continue". Every one of those is inlined here, in
 * full, from the page it points at: four steps for the pair done twice, the
 * dhyanam, the pranayama with its breath division and the ear touch (p.19), and
 * the p.19 sankalpa stem joined to the rite's own ending. The closing "perform
 * aachamanam, angavandanam once" is two more real steps. Brahma Yajnam's
 * sankalpa is printed "........... brahmayajnam karishye": the dots stand for
 * the p.19 stem, which is what fills them.
 *
 * HAND POSITIONS follow the 18 Oct 2026 review of the book (Achamanam: the
 * forefinger folded to the thumb, one sip per name; Pranayamam: index and middle
 * folded, in/hold/out split across the mantra, then the right ear; Sankalpam:
 * left palm up on the right thigh, right palm over it; Anga Vandanam: Padmanabha
 * is the NAVEL). Where the book is silent on a gesture, the instruction says
 * only what to recite.
 *
 * REPAIRS, each settled by the book itself and asserted after the fact:
 *
 *   p.50  समिध-माहार्षं -> समिधमाहार्षं. The Devanagari drops the म् that its
 *         own roman beside it carries ("agnaye samidham-aahaarsham"). The
 *         malformed reph on the same word (warning in the transcript) was
 *         already read as र्ष from that roman by the transcriber.
 *   p.57  कृष्णद्वैपायनादयःये -> कृष्णद्वैपायनादयः ये. A lost word space; the
 *         roman reads "kṛṣhṇa-dvaipaayanaadayaha ye".
 *
 * NOT REPAIRS, but recorded:
 *
 *   p.55  the leading "..........." of the Brahma Yajnam sankalpa is the
 *         book's blank for the p.19 stem, and is replaced by that stem.
 *   p.56  "(३)" after namo brahmane is a count, not a word of the mantra; it is
 *         taken out of the mantra and the instruction says "three times".
 *   p.54, p.60, p.61  single quotation marks around 'ओं तत् सत्
 *         ब्रह्मार्पणमस्तु' and 'अमृतोपस्तरणमसि' are typography, removed.
 *   Runs of spaces in a transcript line are collapsed to one.
 *
 * KEPT AS PRINTED, though odd: the third विश्वान् देवान् काण्डर्षीꣳ स्तर्पयामि at
 * the top of p.59 (the page does not settle whether it is meant); the hyphen in
 * शं यो-रभिस्रवन्तु (p.55); मय्यग्निःतेजो (p.52); the comma and full stop in
 * कृष्ण, कृष्ण कृष्ण. (p.52). The transcript's finding that the homa has "eleven
 * svaahaa offerings plus one bare svaahaa" miscounts: pp.50-51 print TWELVE
 * svaahaa mantras, and the bare svaahaa on p.52 makes thirteen samidhs.
 *
 * MODES. Samidaadhaanam is kept "in the mornings and evenings facing east and
 * west respectively" and its sankalpa has a morning and an evening ending: two
 * modes, pratah and sayam, with from_hour like sandhyavandanam. Bhojana Vidhi's
 * parishechanam has a day formula and a night formula: two modes, day and
 * night. Brahma Yajnam prints no time and no variant: one mode.
 *
 * Brahma Yajnam's oorjam vahanteeh is the one conditional step the book prints
 * ("only by those who do not have their fathers"). It stays in the one mode and
 * its instruction says whom it is for; a separate mode is an option for the
 * owner (see the plan doc).
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const S = Sanscript.default ?? Sanscript;
const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/6-sandhya-giri/';
const BOOK = 'Yajurveda Trikaala Sandhyaavandanam (Giri)';
const OUT = 'supabase/migrations/0063_nitya_karmas_from_the_book.sql';
const RITES = ['samidadhanam', 'brahma_yajnam', 'bhojana_vidhi'];

// --- reading the book --------------------------------------------------------

const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  byPage[d.book_page] = d;
}
function block(page, idx, want) {
  const d = byPage[page];
  if (!d) throw new Error(`no transcript for book page ${page}`);
  const b = d.blocks[idx];
  if (!b) throw new Error(`p.${page} has no block ${idx}`);
  if (b.type !== want) throw new Error(`p.${page} block ${idx} is ${b.type}, not ${want}`);
  return b;
}

const FIXES = [
  {
    wrong: 'समिध-माहार्षं', right: 'समिधमाहार्षं', expect: 1,
    why: 'p.50 drops the म् of समिधम्; the roman beside it reads "samidham-aahaarsham".',
  },
  {
    wrong: 'कृष्णद्वैपायनादयःये', right: 'कृष्णद्वैपायनादयः ये', expect: 1,
    why: 'p.57 loses the word space; the roman reads "kṛṣhṇa-dvaipaayanaadayaha ye".',
  },
];
const fixCounts = Object.fromEntries(FIXES.map((f) => [f.wrong, 0]));

/** Typography and whitespace only, then the repairs above. */
function clean(text) {
  let out = text
    .split('\n')
    .map((l) => l.replace(/[‘’']/g, '').replace(/\s{2,}/g, ' ').trim())
    .join('\n');
  for (const f of FIXES) {
    const n = out.split(f.wrong).length - 1;
    if (n) { fixCounts[f.wrong] += n; out = out.split(f.wrong).join(f.right); }
  }
  return out;
}
const lines = (page, idx) => block(page, idx, 'deva').lines.map(clean);
const deva = (page, idx) => lines(page, idx).join('\n');
const rows = (page, idx) => block(page, idx, 'table').rows.map((r) => r.map(clean));

/** A tarpanam block: lines joined until one ends in तर्पयामि. */
function offerings(page, idx) {
  const out = [];
  let cur = [];
  for (const l of lines(page, idx)) {
    cur.push(l);
    if (/तर्पयामि$/.test(l)) { out.push(cur.join(' ')); cur = []; }
  }
  if (cur.length) throw new Error(`p.${page} block ${idx}: "${cur.join(' ')}" never reaches tarpayaami`);
  return out;
}

// --- the shared opening, from book pp.16-19 -----------------------------------

const ACHAMANAM = deva('16', 4);
const ANGA = [...rows('16', 8), ...rows('17', 0)].map((r) => r[1]).join('\n');
const DHYANAM = deva('18', 2);
const PRANAYAMA = deva('18', 9);
const STEM = deva('19', 6);

const T = {
  achamanam: {
    meaning:
      'Salutation to Achyuta, the one who never falls; to Ananta, the endless; to Govinda. ' +
      'One sip of water goes with each name.',
    philosophy:
      'Three names of Vishnu, and water taken into the body as each is said. The mouth that is ' +
      'about to recite is rinsed first, and the rinsing is itself done with names, so the rite ' +
      'has begun before anything has been asked for.',
  },
  anga: {
    meaning:
      'Twelve names of Vishnu in six pairs, each pair placed on the body: Keshava and Narayana, ' +
      'Madhava and Govinda, Vishnu and Madhusudana, Trivikrama and Vamana, Shridhara and ' +
      'Hrishikesha, Padmanabha and Damodara.',
    philosophy:
      'Each finger goes where it does for a reason: thumb and mouth are held to be seats of fire, ' +
      'ring finger and eyes of the sun, forefinger and nose of wind, little finger and ears of ' +
      'Indra, middle finger and shoulders of Prajapati. The body is not blessed part by part so ' +
      'much as recognised, part by part, as already lived in.',
  },
};

const ACH_HAND_EN =
  'Fold the forefinger of your right hand against the thumb and curl the other three fingers ' +
  'so the palm holds one spoonful of water from the uddharani.';
const ACH_HAND_TA =
  'வலது கையின் ஆள்காட்டி விரலைக் கட்டைவிரலுடன் சேர்த்து மடக்கி, மற்ற மூன்று விரல்களையும் ' +
  'குவித்து, உள்ளங்கையில் ஒரு உத்தரிணி நீர் நிற்கும்படி வைக்கவும்.';
const ANGA_EN =
  'thumb to the right and left cheek, ring finger to the right and left eye, forefinger to the ' +
  'right and left nostril, little finger to the right and left ear, middle finger to the right ' +
  'and left shoulder.';
const ANGA_TA =
  'கட்டைவிரலால் வலது, இடது கன்னங்கள்; மோதிர விரலால் வலது, இடது கண்கள்; ஆள்காட்டி விரலால் ' +
  'வலது, இடது நாசிகள்; சுண்டு விரலால் வலது, இடது காதுகள்; நடுவிரலால் வலது, இடது தோள்கள்.';

/**
 * The opening and closing pair, as steps. `facing` adds the book's p.16 seat
 * rule; Samidaadhaanam leaves it out, because its own rubric seats the evening
 * sitting facing west (see the plan doc).
 */
function openingPair(round, { facing, page, closingThread } = {}) {
  const first = round === 1;
  const suffix = { 1: '', 2: ' (second round)', 3: ' (closing)' }[round];
  const suffixTa = { 1: '', 2: ' (இரண்டாம் முறை)', 3: ' (நிறைவு)' }[round];
  const src = `${BOOK}, pp.16-17, photographed page (called for on p.${page})`;
  let achEn;
  let achTa;
  if (round === 1) {
    achEn = `${facing ? 'Sit facing east or north. ' : ''}${ACH_HAND_EN} Sip it once at each of the three names.`;
    achTa = `${facing ? 'கிழக்கு அல்லது வடக்கு நோக்கி அமரவும். ' : ''}${ACH_HAND_TA} ஒவ்வொரு நாமத்திற்கும் ஒரு முறை அந்த நீரை உட்கொள்ளவும்.`;
  } else if (round === 2) {
    achEn = `A second round of the same three sips. ${ACH_HAND_EN} Then sip once at each name.`;
    achTa = `அதே மூன்று முறை நீர் உட்கொள்ளல், இரண்டாம் முறையாக. ${ACH_HAND_TA} பின் ஒவ்வொரு நாமத்திற்கும் ஒரு முறை உட்கொள்ளவும்.`;
  } else if (closingThread) {
    achEn = `Put the sacred thread back as it normally sits, over the left shoulder. ${ACH_HAND_EN} Sip once at each of the three names.`;
    achTa = `பூணூலை வழக்கம்போல இடது தோளின் மேல் மாற்றி அணியவும். ${ACH_HAND_TA} ஒவ்வொரு நாமத்திற்கும் ஒரு முறை உட்கொள்ளவும்.`;
  } else {
    achEn = `${ACH_HAND_EN} Sip once at each of the three names; this round closes the rite.`;
    achTa = `${ACH_HAND_TA} ஒவ்வொரு நாமத்திற்கும் ஒரு முறை உட்கொள்ளவும்; இந்த முறை சடங்கை நிறைவு செய்கிறது.`;
  }
  const angaEn = {
    1: `Using only the right hand, touch each place as you say its name: ${ANGA_EN} Then the whole palm to the navel and to the crown of the head, reaching across with the right hand for the left side.`,
    2: `A second round of the twelve names, two at a time: ${ANGA_EN} Then the whole palm to the navel and to the crown, reaching across with the right hand for the left side.`,
    3: `The twelve names once more, two at a time: ${ANGA_EN} Then the whole palm to the navel and to the crown; this round closes the rite.`,
  }[round];
  const angaTa = {
    1: `வலது கையால் மட்டும், ஒவ்வொரு நாமத்தைச் சொல்லும்போதும் அதற்குரிய இடத்தைத் தொடவும்: ${ANGA_TA} பின் முழு உள்ளங்கையால் நாபியையும் உச்சந்தலையையும் தொடவும்; இடது பக்கத்தைத் தொட வலது கையைக் குறுக்காகக் கொண்டு செல்லவும்.`,
    2: `பன்னிரண்டு நாமங்கள் இரண்டாம் முறையாக, இரண்டிரண்டாக: ${ANGA_TA} பின் முழு உள்ளங்கையால் நாபியையும் உச்சந்தலையையும் தொடவும்; இடது பக்கத்திற்கு வலது கையைக் குறுக்காகக் கொண்டு செல்லவும்.`,
    3: `பன்னிரண்டு நாமங்கள் மீண்டும் ஒரு முறை, இரண்டிரண்டாக: ${ANGA_TA} பின் முழு உள்ளங்கையால் நாபியையும் உச்சந்தலையையும் தொடவும்; இந்த முறை சடங்கை நிறைவு செய்கிறது.`,
  }[round];
  const phase = round === 3 ? 'uttara' : 'purvangam';
  const section = 'achamanam';
  return [
    {
      title: `Achamanam${suffix}`, ta: `ஆசமனம்${suffixTa}`, section, phase, deva: ACHAMANAM,
      instruction: achEn, instruction_ta: achTa, ...T.achamanam, src,
    },
    {
      title: `Anga Vandanam${suffix}`, ta: `அங்க வந்தனம்${suffixTa}`, section, phase, deva: ANGA,
      instruction: angaEn, instruction_ta: angaTa, ...T.anga, src,
    },
  ].map((s) => ({ ...s, first }));
}

const DHYANAM_STEP = (page) => ({
  title: 'Vighneshwara Dhyanam', ta: 'விக்னேஶ்வர த்யானம்', phase: 'purvangam', deva: DHYANAM,
  instruction: 'Make loose fists and gently tap both temples with the knuckles five times while reciting.',
  instruction_ta: 'இரு கைகளையும் லேசாக மடக்கி, விரல் முட்டிகளால் இரு நெற்றிப் பொட்டுகளிலும் மெதுவாக ஐந்து முறை குட்டியபடி சொல்லவும்.',
  meaning:
    'Meditate on him who wears white, who pervades all, the colour of the moon, four-armed, with ' +
    'a gracious face, so that every obstacle is quieted.',
  philosophy:
    'The verse asks for obstacles to be quieted, not for the rite to succeed. It clears the way ' +
    'and leaves the rest to the rite itself, which is why it comes before the resolution is spoken.',
  src: `${BOOK}, p.18, photographed page (called for on p.${page})`,
});

const PRANAYAMA_STEP = (page) => ({
  title: 'Pranayamam', ta: 'ப்ராணாயாமம்', phase: 'purvangam', deva: PRANAYAMA,
  instruction:
    'With the right hand, fold the index and middle fingers; close the right nostril with the ' +
    'thumb and breathe in through the left while saying om bhuh to om satyam. Close the left ' +
    'nostril with the ring and little fingers and hold through the Gayatri; then open the right ' +
    'nostril and breathe out through om aapo to suvarom. Finally touch your right ear with your ' +
    'right hand.',
  instruction_ta:
    'வலது கையில் ஆள்காட்டி விரலையும் நடுவிரலையும் உள்ளங்கையில் மடக்கவும். கட்டைவிரலால் வலது ' +
    'நாசியை மூடி, ஓம் பூ꞉ முதல் ஓம் ஸத்யம் வரை சொல்லியபடி இடது நாசி வழியாக மூச்சை இழுக்கவும். மோதிர ' +
    'விரல், சுண்டு விரல்களால் இடது நாசியையும் மூடி, காயத்ரீ முடியும் வரை மூச்சை நிறுத்தவும். பின் ' +
    'வலது நாசியைத் திறந்து ஓமாபோ முதல் ஸுவரோம் வரை சொல்லியபடி மூச்சை வெளியிடவும். இறுதியில் வலது ' +
    'கையால் வலது காதைத் தொடவும்.',
  meaning:
    'The seven worlds, each named as Om; then the Gayatri, meditation on the brilliance of Savitr ' +
    'who impels our minds; then: the waters, the light, the essence, the immortal, Brahman, ' +
    'earth, atmosphere and heaven are Om.',
  philosophy:
    'The mantra is divided by the breath: drawn in through the worlds, held through the Gayatri, ' +
    'released through the waters and the light. Said without the breath it is a recitation; with ' +
    'it, the body keeps time with the words.',
  src: `${BOOK}, pp.18-19, photographed page (called for on p.${page})`,
});

const SANKALPA_HANDS_EN =
  'Rest the left palm, facing up, on your right thigh and cover it with the right palm crossed ' +
  'over it. Keep both hands there while you recite.';
const SANKALPA_HANDS_TA =
  'இடது உள்ளங்கையை மேல்நோக்கியபடி வலது தொடையின் மேல் வைத்து, வலது உள்ளங்கையை அதன் மேல் ' +
  'குறுக்காக வைத்து மூடவும். சொல்லி முடியும் வரை இரு கைகளையும் அப்படியே வைத்திருக்கவும்.';
const STEM_MEANING =
  'That all the wrong I have accumulated may be destroyed, and for the pleasure of the Supreme ' +
  'Lord,';

// --- Samidaadhaanam, book pp.49-54 --------------------------------------------

const SAMID_ENDINGS = rows('49', 3); // [sitting, deva, translit]
const sam = [];
const SRC = (p) => `${BOOK}, p.${p}, photographed page`;

sam.push(
  {
    title: 'Prepare the Fire — morning', ta: 'அக்னி தயாரித்தல் — காலை', phase: 'purvangam',
    modes: ['pratah'], deva: null, src: SRC(49),
    instruction:
      'Sit facing east. Place the homa kundam in front of you with rice husk, dried cow dung and ' +
      'charcoal in it, and light the fire. Keep the samidha sticks or dry darbha grass within reach.',
    instruction_ta:
      'கிழக்கு நோக்கி அமரவும். ஹோம குண்டத்தை முன்னால் வைத்து, அதில் உமி, காய்ந்த சாணம், கரி ' +
      'ஆகியவற்றை இட்டு அக்னியை மூட்டவும். சமித்துகளையோ காய்ந்த தர்ப்பையையோ கையருகே வைத்துக்கொள்ளவும்.',
    meaning:
      'Nothing is said yet. The fire is lit first because every offering that follows is made into ' +
      'it, and the morning sitting faces the east, where the sun rises.',
    philosophy:
      'Samidadhanam is the student\'s own fire: small, kept twice a day and fed by his own hand. ' +
      'Lighting it before a word is spoken makes the fire the first thing present, and everything ' +
      'else is said to it.',
  },
  {
    title: 'Prepare the Fire — evening', ta: 'அக்னி தயாரித்தல் — மாலை', phase: 'purvangam',
    modes: ['sayam'], deva: null, src: SRC(49),
    instruction:
      'Sit facing west. Place the homa kundam in front of you with rice husk, dried cow dung and ' +
      'charcoal in it, and light the fire. Keep the samidha sticks or dry darbha grass within reach.',
    instruction_ta:
      'மேற்கு நோக்கி அமரவும். ஹோம குண்டத்தை முன்னால் வைத்து, அதில் உமி, காய்ந்த சாணம், கரி ' +
      'ஆகியவற்றை இட்டு அக்னியை மூட்டவும். சமித்துகளையோ காய்ந்த தர்ப்பையையோ கையருகே வைத்துக்கொள்ளவும்.',
    meaning:
      'Nothing is said yet. The fire is lit first because every offering that follows is made into ' +
      'it, and the evening sitting faces the west, where the sun sets.',
    philosophy:
      'The evening fire answers the morning one. The same small fire, the same sticks and the same ' +
      'verses, kept at the other end of the day and facing the other way.',
  },
  ...openingPair(1, { page: 49 }),
  ...openingPair(2, { page: 49 }),
  DHYANAM_STEP(49),
  PRANAYAMA_STEP(49),
);
for (const [sitting, ending] of SAMID_ENDINGS) {
  const mode = { morning: 'pratah', evening: 'sayam' }[sitting];
  if (!mode) throw new Error(`p.49: unknown sitting "${sitting}"`);
  sam.push({
    title: `Sankalpam — ${sitting}`, ta: `ஸங்கல்பம் — ${mode === 'pratah' ? 'காலை' : 'மாலை'}`,
    phase: 'purvangam', modes: [mode], deva: `${STEM}\n${ending}`, src: `${BOOK}, pp.19 and 49, photographed page`,
    instruction: SANKALPA_HANDS_EN, instruction_ta: SANKALPA_HANDS_TA,
    meaning: `${STEM_MEANING} I shall perform the ${sitting} Samidadhanam.`,
    philosophy: mode === 'pratah'
      ? 'A nitya karma names no date and no occasion; the occasion is the hour. The resolution says ' +
        'only what is about to be done and why: to wear away past wrong, for the Lord\'s pleasure.'
      : 'Only the first word changes between the two sittings, pratah or sayam. The fire, the ' +
        'offerings and the words said to it are the same at both ends of the day.',
  });
}
sam.push(
  {
    title: 'Agni Prarthana', ta: 'அக்னி ப்ரார்த்தனை', phase: 'pradhana', deva: deva('49', 5), src: SRC(49),
    instruction: 'Face the fire and recite this prayer to Agni.',
    instruction_ta: 'அக்னியை நோக்கி இந்த ப்ரார்த்தனையைச் சொல்லவும்.',
    meaning:
      'Agni, I tend you all around, with long life and with wealth. May I be rich in offspring ' +
      'through offspring, in brave sons through brave sons, brilliant with brilliance, well ' +
      'nourished with nourishment, well housed with houses, well protected by a protector, wise ' +
      'with wisdom, and rich in sacred learning through students of the Veda.',
    philosophy:
      'Every blessing asked for comes paired with its means: offspring through offspring, wisdom ' +
      'through wisdom. The last pair is the student\'s own, to be rich in sacred learning through ' +
      'those who study it.',
  },
  {
    title: 'Parishechanam — before the homa', ta: 'பரிஷேசனம் — ஹோமத்திற்கு முன்', phase: 'pradhana',
    deva: deva('50', 2), src: SRC(50),
    instruction: 'Take water in the right hand and pour it in a clockwise circle around the homa kundam while reciting.',
    instruction_ta: 'வலது கையில் நீர் எடுத்து, சொல்லியபடி ஹோம குண்டத்தைச் சுற்றி வலமாக நீரை விடவும்.',
    meaning: 'God Savitr, set it going.',
    philosophy:
      'A ring of water around the fire marks off the place of the offering before anything is ' +
      'offered. The verb is a request, prasuva, set it going; it will be answered in the past tense ' +
      'when the homa is over.',
  },
);

/** The twelve svaahaa mantras of pp.50-51, each its own screen. */
const HOMA = [
  { p: '50', i: 6, t: 'Agnaye Samidham', ta: 'அக்னயே ஸமிதம்',
    m: 'I have brought a samidh for Agni, the great knower of all beings. As you, Agni, are ' +
       'kindled by the samidh, so kindle me with long life, brilliance, gain, wisdom, offspring, ' +
       'cattle, the radiance of sacred learning and food to eat. Svaha.',
    ph: 'The first offering states the bargain of the whole rite: as the stick makes the fire ' +
        'blaze, may the rite make the student thrive. Everything after it is a variation on that sentence.' },
  { p: '50', i: 9, t: 'Edhosi', ta: 'ஏதோஸி',
    m: 'You are fuel; may we grow. Svaha.',
    ph: 'Five words. The samidh is named for what it is, fuel, and the wish is that the one who ' +
        'offers it should grow as the fire grows on it.' },
  { p: '50', i: 11, t: 'Samidasi', ta: 'ஸமிதஸி',
    m: 'You are the kindling; may we be kindled. Svaha.',
    ph: 'The same shape again with a different noun: the stick is called kindling, and the reciter ' +
        'asks to be kindled with it. Short lines like these are how a boy learns that the fire and ' +
        'he are being fed together.' },
  { p: '50', i: 13, t: 'Tejosi', ta: 'தேஜோஸி',
    m: 'You are brilliance; place brilliance in me. Svaha.',
    ph: 'Here the request becomes direct. Not "may we grow" but "put it in me": the brilliance seen ' +
        'in the flame is asked for in the person.' },
  { p: '50', i: 15, t: 'Apo Adya', ta: 'அபோ அத்ய',
    m: 'Today I have followed the waters; we have been joined with their essence. Full of ' +
       'strength, Agni, I have come to you: unite me with brilliance. Svaha.',
    ph: 'Water and fire are brought together. The student comes to the fire having bathed, and asks ' +
        'that what the waters gave him be matched by what the fire gives.' },
  { p: '51', i: 0, t: 'Sam Ma Agne', ta: 'ஸம் மாக்னே',
    m: 'Agni, unite me with brilliance, with offspring and with wealth. Svaha.',
    ph: 'The same three goods asked of the fire in its opening prayer return here, as plainly as ' +
        'they can be said: brilliance, offspring, wealth.' },
  { p: '51', i: 2, t: 'Vidyun Me', ta: 'வித்யுன் மே',
    m: 'May the gods know this of mine; may Indra know it, together with the seers. Svaha.',
    ph: 'An offering that asks for nothing but witnesses. The student wants his small rite to be ' +
        'known to the gods, to Indra and to the seers.' },
  { p: '51', i: 4, t: 'Agnaye Brihate Nakaya', ta: 'அக்னயே ப்ருஹதே நாகாய',
    m: 'To Agni, the great, the vault of heaven. Svaha.',
    ph: 'Agni is addressed not only as the fire in front of the student but as the height of the ' +
        'sky, the same fire seen at its largest.' },
  { p: '51', i: 6, t: 'Dyavaprithivibhyam', ta: 'த்யாவாப்ருதிவீப்யாம்',
    m: 'To Heaven and Earth. Svaha.',
    ph: 'One samidh for the pair that holds everything between them. The smallest fire in the house ' +
        'is offered to the largest frame there is.' },
  { p: '51', i: 8, t: 'Esha Te Agne Samit', ta: 'ஏஷா தே அக்னே ஸமித்',
    m: 'This is your samidh, Agni: grow by it and swell. By it may I too grow and swell. Svaha.',
    ph: 'The plainest statement of the whole rite. The fire grows by the stick; the student asks to ' +
        'grow by the same stick, alongside it.' },
  { p: '51', i: 10, t: 'Yo Ma Agne', ta: 'யோ மாக்னே',
    m: 'Agni, whoever seeks to make me shareless when I have a share, make him shareless, Agni, ' +
       'and make me one who has a share. Svaha.',
    ph: 'The only line that has an adversary in it. It asks for what is fairly one\'s own to be ' +
        'kept, and for nothing taken from anyone else.' },
  { p: '51', i: 12, t: 'Samidham Adhaya', ta: 'ஸமிதமாதாய',
    m: 'Having laid the samidh on you, Agni, may I keep every vow. Svaha.',
    ph: 'The series ends with discipline rather than gain. A brahmachari\'s life is a set of vows, ' +
        'and the last offering asks for the strength to keep all of them.' },
];
HOMA.forEach((h, k) => {
  sam.push({
    title: `Homa — ${h.t}`, ta: `ஹோமம் — ${h.ta}`, section: 'homa', phase: 'pradhana',
    deva: deva(h.p, h.i), src: SRC(h.p),
    instruction: 'Offer one samidha into the fire as you say svaha.',
    instruction_ta: 'ஸ்வாஹா என்று சொல்லும்போது ஒரு சமித்தை அக்னியில் இடவும்.',
    meaning: h.m, philosophy: h.ph, homa: k + 1,
  });
});

const UPA = lines('52', 7);
const UPA_SPLIT = UPA.findIndex((l) => l === 'अग्नये नमः।');
if (UPA_SPLIT < 0) throw new Error('p.52: agnaye namah not found in the upasthanam');

sam.push(
  {
    title: 'Parishechanam — after the homa', ta: 'பரிஷேசனம் — ஹோமத்திற்குப் பின்', phase: 'pradhana',
    deva: deva('51', 17), src: SRC(51),
    instruction: 'Take water in the right hand again and pour it in a clockwise circle around the homa kundam while reciting.',
    instruction_ta: 'மீண்டும் வலது கையில் நீர் எடுத்து, சொல்லியபடி ஹோம குண்டத்தைச் சுற்றி வலமாக நீரை விடவும்.',
    meaning: 'God Savitr, you have set it going.',
    philosophy:
      'A second ring of water closes what the first one opened, and one word has changed: the ' +
      'request to set the rite going is now a statement that it has been set going.',
  },
  {
    title: 'The Last Samidh', ta: 'கடைசி சமித்து', phase: 'pradhana', deva: deva('52', 1), src: SRC(52),
    instruction: 'Offer one more samidha into the fire as you say svaha.',
    instruction_ta: 'ஸ்வாஹா என்று சொல்லி இன்னும் ஒரு சமித்தை அக்னியில் இடவும்.',
    meaning: 'Svaha: it is offered.',
    philosophy:
      'After the closing ring of water, one last samidh goes in with only the word of offering. ' +
      'Nothing is asked for with it; it is the offering with no request attached.',
  },
  {
    title: 'Resolve to Worship Agni', ta: 'அக்னி உபஸ்தான ஸங்கல்பம்', section: 'upasthanam', phase: 'pradhana',
    deva: deva('52', 4), src: SRC(52),
    instruction:
      'Interlock the fingers of both hands, right hand over left, and clasp the palms together. ' +
      'Turn the clasped palms over from the inside and release them while you recite.',
    instruction_ta:
      'இரு கைகளின் விரல்களையும் கோத்து, வலது கை இடது கையின் மேல் இருக்கும்படி உள்ளங்கைகளைச் ' +
      'சேர்த்துப் பிடிக்கவும். சொல்லியபடி, கோத்த உள்ளங்கைகளை உள்பக்கமாகத் திருப்பி விடுவிக்கவும்.',
    meaning: 'I shall worship Agni, standing in his presence.',
    philosophy:
      'Upasthanam means standing near and attending. The offerings are over; what follows is said ' +
      'to the fire rather than put into it.',
  },
  {
    title: 'Agni Upasthanam', ta: 'அக்னி உபஸ்தானம்', section: 'upasthanam', phase: 'pradhana',
    deva: UPA.slice(0, UPA_SPLIT + 1).join('\n'), src: SRC(52),
    instruction: 'Stand up and pray to Agni with folded hands.',
    instruction_ta: 'எழுந்து நின்று கைகூப்பி அக்னியை வணங்கிச் சொல்லவும்.',
    meaning:
      'Agni, by your brilliance may I be brilliant; by your radiance may I be radiant; by your ' +
      'fierce heat may I be strong. May Agni place wisdom, offspring and brilliance in me; may ' +
      'Indra place wisdom, offspring and vigour in me; may Surya place wisdom, offspring and ' +
      'splendour in me. Salutation to Agni.',
    philosophy:
      'Three gods are asked for the same three things, wisdom and offspring and a light of their ' +
      'own: Agni his brilliance, Indra his strength, Surya his splendour. The fire is the nearest ' +
      'of the three, and the one through whom the others are reached.',
  },
  {
    title: 'Prayer for Pardon', ta: 'க்ஷமா ப்ரார்த்தனை', section: 'upasthanam', phase: 'pradhana',
    deva: UPA.slice(UPA_SPLIT + 1).join('\n'), src: SRC(52),
    instruction: 'Still standing with folded hands, recite this prayer for pardon.',
    instruction_ta: 'கைகூப்பியபடியே நின்று இந்த க்ஷமா ப்ரார்த்தனையைச் சொல்லவும்.',
    meaning:
      'Eater of oblations, whatever I have offered lacking in mantra, in action or in devotion, ' +
      'O god, let it be made complete. Of all the expiations there are, by austerity or by act, ' +
      'the remembrance of Sri Krishna is the highest. Krishna, Krishna, Krishna.',
    philosophy:
      'Whatever fell short in word, act or devotion is handed to the fire to be made whole, and ' +
      'the last line says that of all expiations the remembrance of Krishna is the greatest. The ' +
      'rite ends its own account by setting the account aside.',
  },
  {
    title: 'Bhasma from the Fire', ta: 'அக்னியிலிருந்து பஸ்மம்', phase: 'uttara', deva: deva('53', 3), src: SRC(53),
    instruction:
      'Take a few pinches of ash from the burnt samidha into the left palm and add a few drops of ' +
      'water. Mix it with the right ring finger while reciting.',
    instruction_ta:
      'எரிந்த சமித்துகளின் சாம்பலில் சில சிட்டிகைகளை இடது உள்ளங்கையில் எடுத்து, சில துளி நீர் ' +
      'சேர்க்கவும். சொல்லியபடி வலது மோதிர விரலால் நன்றாகக் குழைக்கவும்.',
    meaning:
      'Rudra, do not harm our children or our grandchildren, our life, our cattle or our horses. ' +
      'Do not in anger strike down our men. Bringing offerings, we worship you with reverence.',
    philosophy:
      'What is left of the offering is not thrown away. The ash of the fire becomes the mark the ' +
      'student will wear, and it is mixed with a prayer to Rudra for protection rather than for gain.',
  },
);

const RAKSHA_ROWS = [...rows('53', 7), ...rows('54', 1)];
const RAKSHA_PLACES = {
  forehead: ['Forehead', 'நெற்றி'], chest: ['Chest', 'மார்பு'],
  'right shoulder': ['Right shoulder', 'வலது தோள்'], 'left shoulder': ['Left shoulder', 'இடது தோள்'],
  navel: ['Navel', 'நாபி'], neck: ['Neck', 'கழுத்து'], head: ['Head', 'தலை'],
};
sam.push(
  {
    title: 'Raksha Mantra', ta: 'ரக்ஷா மந்திரம்', phase: 'uttara', deva: null, src: `${BOOK}, pp.53-54, photographed page`,
    archana: RAKSHA_ROWS.map(([label, d]) => {
      const m = label.match(/^\(([^)]+)\)\s*(.+)$/);
      if (!m || !RAKSHA_PLACES[m[2]]) throw new Error(`raksha: cannot read the place in "${label}"`);
      const [en, ta] = RAKSHA_PLACES[m[2]];
      return { deva: d, offering_deva: m[1], offering_en: en, offering_ta: ta };
    }),
    instruction:
      'With the right ring finger, apply the ash as a mark to seven places, one with each line: ' +
      'forehead, chest, right shoulder, left shoulder, navel, neck and head.',
    instruction_ta:
      'வலது மோதிர விரலால், ஒவ்வொரு வரிக்கும் ஒன்றாக, ஏழு இடங்களில் பஸ்மத்தை இடவும்: நெற்றி, ' +
      'மார்பு, வலது தோள், இடது தோள், நாபி, கழுத்து, தலை.',
    meaning:
      'May I be wise; may I be brilliant; may I be vigorous; may I shine with sacred learning; may ' +
      'I be long-lived; may I have food to eat; may I be well.',
    philosophy:
      'Seven marks, each with a wish fitted to its place: wisdom on the forehead, long life at the ' +
      'navel, food at the throat, wellbeing on the head. The protection is not asked for from ' +
      'outside; each line says what the wearer will become.',
  },
  {
    title: 'Prarthana', ta: 'ப்ரார்த்தனை', phase: 'uttara', deva: deva('54', 4), src: SRC(54),
    instruction: 'Wash both hands with water, then fold them and recite.',
    instruction_ta: 'இரு கைகளையும் நீரால் சுத்தம் செய்து, கைகூப்பிச் சொல்லவும்.',
    meaning:
      'Bearer of oblations, give me faith, wisdom, fame, insight, learning, understanding, ' +
      'prosperity, strength, long life, brilliance and health. Give me prosperity, bearer of ' +
      'oblations. Om, salutation.',
    philosophy:
      'The requests are now the ordinary goods of a life, faith and memory and health, asked of ' +
      'the fire as the bearer of oblations: the one who has just carried this sitting\'s samidhs ' +
      'to the gods.',
  },
  ...openingPair(3, { page: 54 }),
  {
    title: 'Brahmarpanam', ta: 'ப்ரம்மார்ப்பணம்', phase: 'uttara', deva: deva('54', 9), src: SRC(54),
    instruction: 'Pour water into the plate as an offering while reciting.',
    instruction_ta: 'சொல்லியபடி தாம்பாளத்தில் நீரை அர்ப்பணமாக விடவும்.',
    meaning: 'Om tat sat: let it be an offering to Brahman.',
    philosophy:
      'The fire was fed and asked for long life, wisdom and a share, and the rite still does not ' +
      'keep what it earned. Whatever was done is handed over to Brahman.',
  },
);

// --- Brahma Yajnam, book pp.55-60 ---------------------------------------------

const BY_SANKALPA = lines('55', 2);
const bySankalpaEnding = BY_SANKALPA[0].replace(/^[.\s]+/, '');
if (bySankalpaEnding === BY_SANKALPA[0]) throw new Error('p.55: expected the sankalpa line to open with the blank');
const VIDYUDASI = BY_SANKALPA[1];
const NAMO_BRAHMANE_RAW = deva('56', 10);
const NAMO_BRAHMANE = NAMO_BRAHMANE_RAW.replace(/\s*\(३\)\s*$/, '');
if (NAMO_BRAHMANE === NAMO_BRAHMANE_RAW) throw new Error('p.56: the (३) count was not found');

const DEVA_T = offerings('57', 8);
const RISHI_T = [...offerings('57', 12), ...offerings('58', 1)];
const RISHI_T2 = offerings('59', 1);
const PITR_T = [...offerings('59', 6), ...offerings('59', 8)];

const by = [
  ...openingPair(1, { facing: true, page: 55 }),
  ...openingPair(2, { facing: true, page: 55 }),
  DHYANAM_STEP(55),
  PRANAYAMA_STEP(55),
  {
    title: 'Sankalpam', ta: 'ஸங்கல்பம்', phase: 'purvangam', deva: `${STEM}\n${bySankalpaEnding}`,
    src: `${BOOK}, pp.19 and 55, photographed page`,
    instruction: SANKALPA_HANDS_EN, instruction_ta: SANKALPA_HANDS_TA,
    meaning: `${STEM_MEANING} I shall perform the Brahma Yajnam; through the Brahma Yajnam I shall worship.`,
    philosophy:
      'The sacrifice named here has no fire and no food. Its offering is recitation: the Veda said ' +
      'back, a little each day, to the seers it came through.',
  },
  {
    title: 'Vidyudasi — cleansing the palms', ta: 'வித்யுதஸி — உள்ளங்கை சுத்தி', section: 'japa', phase: 'pradhana',
    deva: VIDYUDASI, src: SRC(55),
    instruction: 'Take a little water and wipe the palms clean with it while reciting.',
    instruction_ta: 'சிறிது நீர் எடுத்து, சொல்லியபடி உள்ளங்கைகளைத் துடைத்துச் சுத்தம் செய்யவும்.',
    meaning: 'You are lightning: split open my wrong. From the right I come to the truth.',
    philosophy:
      'The hands are cleaned before the recitation, and the words ask for more than clean hands: ' +
      'that whatever wrong is in the reciter be split open as lightning splits a cloud.',
  },
  {
    title: 'Gayatri in Three Forms', ta: 'மூன்று வடிவங்களில் காயத்ரீ', section: 'japa', phase: 'pradhana',
    deva: deva('55', 5), src: `${BOOK}, pp.55-56, photographed page`,
    instruction: 'Recite the Gayatri in the three forms given, one after another without a break.',
    instruction_ta: 'கொடுக்கப்பட்டுள்ள மூன்று வடிவங்களிலும் காயத்ரீயை ஒன்றன்பின் ஒன்றாக இடைவிடாமல் சொல்லவும்.',
    meaning:
      'We meditate on the adorable brilliance of god Savitr; may he impel our minds. Said first ' +
      'one line to each of the three worlds, then two lines to each, then whole.',
    philosophy:
      'The japa begins with the Gayatri taken apart and put back together: one world to each line, ' +
      'then to each pair of lines, then the whole verse at once. It is the verse every recitation ' +
      'stands on, said before the Vedas themselves are opened.',
  },
  {
    title: 'Rig Veda — Agnim Ile', ta: 'ரிக் வேதம் — அக்னிமீளே', section: 'japa', phase: 'pradhana',
    deva: deva('55', 6), src: `${BOOK}, pp.55-56, photographed page`,
    instruction: 'Continue with the first verse of the Rig Veda, ending it with hari om.',
    instruction_ta: 'ரிக் வேதத்தின் முதல் மந்திரத்தை, ஹரி ஓம் என்று முடித்துத் தொடர்ந்து சொல்லவும்.',
    meaning:
      'I praise Agni, the household priest, the god of the sacrifice, the officiant, the invoker, ' +
      'the greatest giver of treasure. Hari Om.',
    philosophy:
      'Brahma Yajnam repays the seers by saying back what they saw, and this is where the Rig Veda ' +
      'itself begins. One verse stands for the whole of it.',
  },
  {
    title: 'Yajur Veda — Ishe Tva', ta: 'யஜுர் வேதம் — இஷே த்வா', section: 'japa', phase: 'pradhana',
    deva: deva('55', 7), src: `${BOOK}, pp.55-56, photographed page`,
    instruction: 'Continue with the opening of the Yajur Veda, between hari om and hari om.',
    instruction_ta: 'யஜுர் வேதத்தின் தொடக்கத்தை, ஹரி ஓம் என்று தொடங்கி ஹரி ஓம் என்று முடித்துச் சொல்லவும்.',
    meaning:
      'Hari Om. For food, you; for strength, you. You are the winds, you are the ones that come ' +
      'near. May god Savitr lead you to the most excellent work. Hari Om.',
    philosophy:
      'The opening of the reciter\'s own Veda, which begins with a sacrifice about to be performed: ' +
      'food, strength, and a god asked to lead the offering to the best of works.',
  },
  {
    title: 'Sama Veda — Agna Ayahi', ta: 'ஸாம வேதம் — அக்ன ஆயாஹி', section: 'japa', phase: 'pradhana',
    deva: deva('55', 8), src: `${BOOK}, pp.55-56, photographed page`,
    instruction: 'Continue with the opening of the Sama Veda, between hari om and hari om.',
    instruction_ta: 'ஸாம வேதத்தின் தொடக்கத்தை, ஹரி ஓம் என்று தொடங்கி ஹரி ஓம் என்று முடித்துச் சொல்லவும்.',
    meaning:
      'Hari Om. Come, Agni, to the feast, praised, to the giving of offerings; sit as priest on ' +
      'the sacred grass. Hari Om.',
    philosophy:
      'The Sama Veda also opens with an invitation to Agni. Two Vedas out of four begin by calling ' +
      'the fire, which is fitting for a recitation that is itself called a sacrifice.',
  },
  {
    title: 'Atharva Veda — Shanno Devih', ta: 'அதர்வ வேதம் — ஶந்நோ தேவீ꞉', section: 'japa', phase: 'pradhana',
    deva: deva('55', 9), src: `${BOOK}, pp.55-56, photographed page`,
    instruction: 'Continue with the opening of the Atharva Veda, between hari om and hari om.',
    instruction_ta: 'அதர்வ வேதத்தின் தொடக்கத்தை, ஹரி ஓம் என்று தொடங்கி ஹரி ஓம் என்று முடித்துச் சொல்லவும்.',
    meaning:
      'Hari Om. May the divine waters be a blessing to us, for our help and for drinking; may ' +
      'they flow to us health and wellbeing. Hari Om.',
    philosophy:
      'The fourth Veda opens with the waters rather than the fire, and with a wish for health. ' +
      'With it, something of all four Vedas has been said today.',
  },
  {
    title: 'Satyam Tapah', ta: 'ஸத்யம் தப꞉', section: 'japa', phase: 'pradhana', deva: deva('56', 7), src: SRC(56),
    instruction: 'Take a little water in the right palm and pass it clockwise around the head while reciting.',
    instruction_ta: 'வலது உள்ளங்கையில் சிறிது நீர் எடுத்து, சொல்லியபடி தலையைச் சுற்றி வலமாகச் சுழற்றவும்.',
    meaning: 'Earth, atmosphere, heaven. I offer truth and austerity into faith.',
    philosophy:
      'Here the words say what the whole rite is doing. Nothing is poured into a fire; truth and ' +
      'austerity are the oblation, and faith is the fire they are offered into.',
  },
  {
    title: 'Namo Brahmane', ta: 'நமோ ப்ரம்மணே', section: 'japa', phase: 'pradhana', deva: NAMO_BRAHMANE, src: SRC(56),
    instruction: 'Staying as you are, recite this three times.',
    instruction_ta: 'இருந்தபடியே இதை மூன்று முறை சொல்லவும்.',
    meaning:
      'Salutation to Brahman; salutation to Agni; salutation to the Earth; salutation to the ' +
      'plants; salutation to Speech; salutation to the Lord of Speech. I bow to Vishnu the great.',
    philosophy:
      'The salutations run from Brahman down to the earth and its plants, then to speech and its ' +
      'lord, the faculty this whole rite is made of, and end with Vishnu. Said three times, they ' +
      'close the recitation.',
  },
  {
    title: 'Vrishtirasi — cleansing the palms', ta: 'வ்ருஷ்டிரஸி — உள்ளங்கை சுத்தி', section: 'japa', phase: 'pradhana',
    deva: deva('57', 1), src: SRC(57),
    instruction: 'Take a little water and wipe the palms clean once more while reciting.',
    instruction_ta: 'சிறிது நீர் எடுத்து, சொல்லியபடி மீண்டும் உள்ளங்கைகளைத் துடைத்துச் சுத்தம் செய்யவும்.',
    meaning: 'You are rain: cut away my wrong. From the right I have come to the truth.',
    philosophy:
      'The pair closes as it opened: lightning before the recitation, rain after it, and the verb ' +
      'has moved from "I come" to "I have come". The recitation is what lay between.',
  },
  {
    title: 'Tarpana Sankalpam', ta: 'தர்ப்பண ஸங்கல்பம்', phase: 'pradhana', deva: deva('57', 4), src: SRC(57),
    instruction: 'Recite this before the tarpanam begins.',
    instruction_ta: 'தர்ப்பணம் தொடங்கும் முன் இதைச் சொல்லவும்.',
    meaning: 'I shall offer tarpanam to the devas and the rishis.',
    philosophy:
      'Tarpanam means satisfying, and what satisfies here is water alone. The resolution names the ' +
      'devas and the rishis; the pitrs follow at the end.',
  },
  {
    title: 'Deva Tarpanam', ta: 'தேவ தர்ப்பணம்', section: 'devas', phase: 'pradhana', deva: null, src: SRC(57),
    archana: DEVA_T.map((d) => ({ deva: d })),
    instruction:
      'Wear the sacred thread as usual and hold it under the right thumb. Offer water straight ' +
      'out of the right palm into the plate, once after each line.',
    instruction_ta:
      'பூணூலை வழக்கம்போல அணிந்து, அதை வலது கட்டைவிரலின் கீழ் பிடித்துக்கொள்ளவும். ஒவ்வொரு ' +
      'வரிக்கும் பின் ஒரு முறை, வலது உள்ளங்கையிலிருந்து நேராகத் தாம்பாளத்தில் நீரை விடவும்.',
    meaning:
      'The devas beginning with Brahma: I satisfy those devas. I satisfy all the devas, all the ' +
      'hosts of devas, all the wives of the devas, and all the wives of the hosts of devas.',
    philosophy:
      'Five offerings, widening as they go: the devas headed by Brahma, then all of them, then ' +
      'their hosts, then their wives. One pouring each, the simplest of the three tarpanams.',
  },
  {
    title: 'Rishi Tarpanam', ta: 'ரிஷி தர்ப்பணம்', section: 'rishis', phase: 'pradhana', deva: null,
    src: `${BOOK}, pp.57-58, photographed page`,
    archana: RISHI_T.map((d) => ({ deva: d, offering_en: 'Twice', offering_ta: 'இரு முறை' })),
    instruction:
      'Hang the sacred thread around the neck like a garland and hold its lower end under the ' +
      'right thumb. Take water in the palm and pour it into the plate by turning the palm fully ' +
      'to the left, twice for each line.',
    instruction_ta:
      'பூணூலை மாலைபோலக் கழுத்தில் அணிந்து, அதன் கீழ் முனையை வலது கட்டைவிரலின் கீழ் ' +
      'பிடித்துக்கொள்ளவும். உள்ளங்கையில் நீர் எடுத்து, உள்ளங்கையை முழுவதுமாக இடப்புறம் ' +
      'திருப்பித் தாம்பாளத்தில் விடவும்; ஒவ்வொரு வரிக்கும் இரு முறை.',
    meaning:
      'The rishis beginning with Krishna Dvaipayana; all the rishis, their hosts and their wives; ' +
      'Prajapati, Soma and Agni, the seers of the sections of the Veda; the Vishvedevas as seers of ' +
      'sections; the deities of the Samhita, of the sacrificial texts and of Varuna, with their ' +
      'Upanishads; Agni the bearer of offerings; and the Vishvedevas again.',
    philosophy:
      'Fourteen offerings, each made twice. The debt being repaid is to those who saw and kept the ' +
      'Veda, beginning with Vyasa who arranged it and going on to the seers of each of its sections.',
  },
  {
    title: 'Brahma Svayambhu Tarpanam', ta: 'ப்ரம்மா ஸ்வயம்பூ தர்ப்பணம்', section: 'rishis', phase: 'pradhana',
    deva: deva('58', 4), src: SRC(58),
    instruction: 'Raise the hand and let the water flow down from it into the plate.',
    instruction_ta: 'கையை உயர்த்தி, அதிலிருந்து நீர் தாம்பாளத்தில் வழிந்து விழும்படி விடவும்.',
    meaning: 'I satisfy Brahma, the self-born.',
    philosophy:
      'Among the offerings to the seers, one is made with a different gesture, the hand lifted and ' +
      'the water let fall: the one to Brahma the self-born, who stands at the head of them.',
  },
  {
    title: 'Rishi Tarpanam — the Vedas', ta: 'ரிஷி தர்ப்பணம் — வேதங்கள்', section: 'rishis', phase: 'pradhana',
    deva: null, src: SRC(59),
    archana: RISHI_T2.map((d) => ({ deva: d, offering_en: 'Twice', offering_ta: 'இரு முறை' })),
    instruction:
      'Keep the thread as a garland and the palm turned to the left, and pour water into the plate ' +
      'twice for each line.',
    instruction_ta:
      'பூணூலை மாலைபோலவே வைத்து, உள்ளங்கையை இடப்புறம் திருப்பி, ஒவ்வொரு வரிக்கும் இரு முறை ' +
      'தாம்பாளத்தில் நீரை விடவும்.',
    meaning:
      'The Vishvedevas as seers of sections; the Arunas as seers of sections; Sadasaspati, the lord ' +
      'of the assembly; the Rig, Yajur, Sama and Atharva Vedas; the Itihasas and Puranas; and the Kalpa.',
    philosophy:
      'Nine offerings, and from the fourth on they are given not to persons but to texts: the four ' +
      'Vedas, the epics and Puranas, the Kalpa. What was learnt is itself given water.',
  },
  {
    title: 'Pitru Tarpanam', ta: 'பித்ரு தர்ப்பணம்', section: 'pitrs', phase: 'pradhana', deva: null, src: SRC(59),
    archana: PITR_T.map((d) => ({ deva: d, offering_en: 'Three times', offering_ta: 'மூன்று முறை' })),
    instruction:
      'Shift the sacred thread so that it hangs on the left side. Pour water into the plate through ' +
      'the gap between the thumb and forefinger, three times for each line.',
    instruction_ta:
      'பூணூல் இடப்பக்கமாகத் தொங்கும்படி மாற்றி அணியவும். கட்டைவிரலுக்கும் ஆள்காட்டி விரலுக்கும் ' +
      'இடையிலான இடைவெளி வழியாக, ஒவ்வொரு வரிக்கும் மூன்று முறை தாம்பாளத்தில் நீரை விடவும்.',
    meaning:
      'Soma who has the pitrs, Yama with the Angirases, Agni who carries offerings to the ' +
      'ancestors: the pitrs beginning with these I satisfy. I satisfy all the pitrs, all their ' +
      'hosts, all their wives and all the wives of their hosts.',
    philosophy:
      'Five offerings, three times each, through the side of the hand between thumb and ' +
      'forefinger. Gods once, seers twice, ancestors three times, and the thread worn a different ' +
      'way for each.',
  },
  {
    title: 'Urjam Vahantih', ta: 'ஊர்ஜம் வஹந்தீ꞉', section: 'pitrs', phase: 'pradhana', deva: deva('60', 1), src: SRC(60),
    instruction:
      'Only if your father has passed away: offer water three times while reciting. If your father ' +
      'is living, leave this out and press Next.',
    instruction_ta:
      'தந்தையார் காலமாகியிருந்தால் மட்டும்: சொல்லியபடி மூன்று முறை நீர் விடவும். தந்தையார் ' +
      'இருந்தால் இதைச் சொல்லாமல் அடுத்த படிக்குச் செல்லவும்.',
    meaning:
      'Waters, you who carry strength, nectar, ghee, milk, sweet drink and the overflowing draught: ' +
      'you are svadha; satisfy my fathers. Be satisfied, be satisfied, be satisfied.',
    philosophy:
      'The only offering in the rite that depends on who is reciting it. The waters are asked to ' +
      'carry nourishment to one\'s own fathers, and a son whose father is alive does not yet send it.',
  },
  ...openingPair(3, { facing: true, page: 60, closingThread: true }),
  {
    title: 'Brahmarpanam', ta: 'ப்ரம்மார்ப்பணம்', phase: 'uttara', deva: deva('60', 6), src: SRC(60),
    instruction: 'Pour water into the plate as an offering while reciting.',
    instruction_ta: 'சொல்லியபடி தாம்பாளத்தில் நீரை அர்ப்பணமாக விடவும்.',
    meaning: 'Om tat sat: let it be an offering to Brahman.',
    philosophy:
      'A rite whose offering was recitation ends by giving the recitation away. What was said back ' +
      'to the seers today is handed on to Brahman, with nothing kept.',
  },
];

// --- Bhojana Vidhi, book pp.60-61 ---------------------------------------------

const DAYNIGHT = rows('61', 3); // [when, deva, translit]
const PRANAHUTI = lines('61', 9);
const bh = [
  {
    title: 'Parishechanam — Om Bhur Bhuvah Suvah', ta: 'பரிஷேசனம் — ஓம் பூர்புவ꞉ ஸுவ꞉', section: 'parishechanam',
    phase: 'purvangam', deva: deva('60', 13), src: SRC(60),
    instruction:
      'Keep a tumbler of water by you, and touch the plate with the right ring finger while the ' +
      'food is served. Then touch it with the left ring finger instead and keep it there. Take ' +
      'water in the right hand and pass it around the plate while reciting.',
    instruction_ta:
      'அருகில் ஒரு டம்ளர் நீர் வைத்துக்கொள்ளவும்; உணவு பரிமாறப்படும்போது வலது மோதிர விரலால் ' +
      'இலையை/தட்டைத் தொட்டுக்கொண்டிருக்கவும். பின் இடது மோதிர விரலால் தொட்டு அப்படியே ' +
      'வைத்திருக்கவும். வலது கையில் நீர் எடுத்து, சொல்லியபடி தட்டைச் சுற்றி நீரைச் சுழற்றவும்.',
    meaning: 'Earth, atmosphere, heaven.',
    philosophy:
      'The plate is ringed with water before anything else, the same gesture that marks off a fire ' +
      'before a homa. From here the meal is treated as an offering, and a hand stays on the plate.',
  },
  {
    title: 'Prokshanam — Gayatri', ta: 'ப்ரோக்ஷணம் — காயத்ரீ', section: 'parishechanam', phase: 'purvangam',
    deva: deva('60', 16), src: SRC(60),
    instruction: 'Sprinkle a little water over the food while reciting.',
    instruction_ta: 'சொல்லியபடி உணவின் மேல் சிறிது நீரைத் தெளிக்கவும்.',
    meaning: 'We meditate on the adorable brilliance of god Savitr; may he impel our minds.',
    philosophy:
      'The food is sprinkled with the verse that asks for the mind to be impelled, said over what ' +
      'will feed the body that carries the mind.',
  },
  {
    title: 'Parishechanam — Deva Savitah', ta: 'பரிஷேசனம் — தேவ ஸவித꞉', section: 'parishechanam', phase: 'purvangam',
    deva: deva('61', 1), src: SRC(61),
    instruction: 'Pass water around the plate once more while reciting.',
    instruction_ta: 'சொல்லியபடி மீண்டும் ஒரு முறை தட்டைச் சுற்றி நீரைச் சுழற்றவும்.',
    meaning: 'God Savitr, set it going.',
    philosophy:
      'The meal is set going the way a homa is, with Savitr asked to impel it. Eating is about to ' +
      'begin, and it is begun as a rite rather than simply started.',
  },
];
for (const [when, d] of DAYNIGHT) {
  const day = /day/i.test(when);
  const night = /night/i.test(when);
  if (day === night) throw new Error(`p.61: cannot tell day from night in "${when}"`);
  bh.push({
    title: `Parishechanam — ${day ? 'day' : 'night'}`, ta: `பரிஷேசனம் — ${day ? 'பகல்' : 'இரவு'}`,
    section: 'parishechanam', phase: 'purvangam', modes: [day ? 'day' : 'night'], deva: d, src: SRC(61),
    instruction: 'Pass water around the plate one last time while reciting.',
    instruction_ta: 'சொல்லியபடி கடைசி முறையாகத் தட்டைச் சுற்றி நீரைச் சுழற்றவும்.',
    meaning: day
      ? 'I sprinkle around you, who are truth, with the right.'
      : 'I sprinkle around you, who are the right, with truth.',
    philosophy: day
      ? 'By day the food is called truth and the water right order. Nothing is asked for: the ' +
        'formula names the food and the water and joins them.'
      : 'At night the two words change places: the food is called right order and the water ' +
        'truth. The same two words, joined the other way round.',
  });
}
bh.push(
  {
    title: 'Amritopastaranam', ta: 'அம்ருதோபஸ்தரணம்', phase: 'pradhana', deva: deva('61', 6), src: SRC(61),
    instruction: 'Take one sip of water from the palm, saying the words silently.',
    instruction_ta: 'மனதிற்குள் சொல்லியபடி உள்ளங்கையிலிருந்து ஒரு முறை நீர் உட்கொள்ளவும்.',
    meaning: 'You are the spread beneath the nectar.',
    philosophy:
      'A sip of water before the first mouthful is called the spread beneath the nectar: the food ' +
      'is to be laid on water, as a meal is laid on a leaf.',
  },
  {
    title: 'Pranahuti', ta: 'ப்ராணாஹுதி', phase: 'pradhana', deva: null, src: SRC(61),
    archana: PRANAHUTI.map((d) => ({ deva: d, offering_en: 'One morsel', offering_ta: 'ஒரு கவளம்' })),
    instruction: 'With the thumb, middle and ring fingers take a little food, and swallow it as each line is said.',
    instruction_ta: 'கட்டைவிரல், நடுவிரல், மோதிர விரல்களால் சிறிது உணவு எடுத்து, ஒவ்வொரு வரியையும் சொல்லி விழுங்கவும்.',
    meaning: 'To prana, svaha; to apana, svaha; to vyana, svaha; to udana, svaha; to samana, svaha; to Brahman, svaha.',
    philosophy:
      'Six small offerings, and the fire they go into is the body\'s own: the five breaths that keep ' +
      'it alive, and Brahman after them. The meal begins as a homa in which the eater is the altar.',
  },
  {
    title: 'Brahmani Ma Atma', ta: 'ப்ரம்மணி ம ஆத்மா', phase: 'pradhana', deva: deva('61', 12), src: SRC(61),
    instruction:
      'Let a little water fall on the left side of the plate. Wet the left ring finger and touch the ' +
      'chest over the heart while reciting, then begin the meal.',
    instruction_ta:
      'தட்டின் இடப்பக்கம் சிறிது நீர் விடவும். இடது மோதிர விரலை நீரில் நனைத்து, சொல்லியபடி ' +
      'மார்பில் இதயப் பகுதியைத் தொடவும்; பின் உணவைத் தொடங்கவும்.',
    meaning: 'My self is in Brahman, for immortality.',
    philosophy:
      'Before eating, the eater places himself in Brahman. What follows is an ordinary meal, eaten ' +
      'by someone who has just said where his self belongs.',
  },
  {
    title: 'Amritapidhanam', ta: 'அம்ருதாபிதானம்', phase: 'uttara', deva: deva('61', 15), src: SRC(61),
    instruction: 'When the meal is over, take one sip of water from the palm while reciting.',
    instruction_ta: 'உணவு முடிந்ததும், சொல்லியபடி உள்ளங்கையிலிருந்து ஒரு முறை நீர் உட்கொள்ளவும்.',
    meaning: 'You are the covering over the nectar.',
    philosophy:
      'The meal ends as it began, with a sip of water: a spread beneath before, a covering after, ' +
      'so the food is held in water above and below.',
  },
);

// --- the rites ------------------------------------------------------------------

const SECTIONS = {
  achamanam: ['Achamanam and Anga Vandanam', 'ஆசமனமும் அங்க வந்தனமும்'],
  homa: ['Homa', 'ஹோமம்'],
  upasthanam: ['Agni Upasthanam', 'அக்னி உபஸ்தானம்'],
  japa: ['Veda Japa', 'வேத ஜபம்'],
  devas: ['Tarpanam — Devas', 'தர்ப்பணம் — தேவர்கள்'],
  rishis: ['Tarpanam — Rishis', 'தர்ப்பணம் — ரிஷிகள்'],
  pitrs: ['Tarpanam — Pitrs', 'தர்ப்பணம் — பித்ருக்கள்'],
  parishechanam: ['Parishechanam', 'பரிஷேசனம்'],
};

const POOJAS = {
  samidadhanam: {
    steps: sam, all: ['pratah', 'sayam'], deity: 'agni', duration: 15,
    modes: [
      ['pratah', 1, 'Prātaḥ — morning', 'ப்ராத꞉ — காலை', 'At dawn, facing east.', 'விடியற்காலை, கிழக்கு நோக்கி.', 0],
      ['sayam', 2, 'Sāyam — evening', 'ஸாயம் — மாலை', 'At dusk, facing west.', 'அந்தி வேளை, மேற்கு நோக்கி.', 12],
    ],
    description_en:
      'The offering of samidha sticks into the fire, morning and evening. Kept by a brahmachari ' +
      'for the length of his studentship.',
    description_ta:
      'காலையும் மாலையும் அக்னியில் சமித்துக்களை ஆஹுதி செய்யும் நித்ய கர்மம். ப்ரம்மசாரியால் அனுஷ்டிக்கப்படுவது.',
    why_en:
      'Samidadhanam is the brahmachari\'s fire. A boy who has received the sacred thread and the ' +
      'Gayatri keeps a small fire of his own, morning and evening, and feeds it samidha sticks with ' +
      'Vedic verses that ask for what a student needs: long life, brilliance, wisdom and a fair ' +
      'share. It is the household fire-offering in miniature, kept by someone who does not yet have ' +
      'a household. When the offerings are done he takes the ash of his own fire, mixes it with ' +
      'water and marks seven places on his body, each with a wish fitted to it. And nothing is kept: ' +
      'the rite ends by handing all of it to Brahman.',
    why_ta:
      'ஸமிதாதானம் ப்ரம்மசாரியின் அக்னி. உபநயனம் பெற்று காயத்ரீ உபதேசம் பெற்ற சிறுவன், காலையும் ' +
      'மாலையும் தனக்கென ஒரு சிறிய அக்னியை வளர்த்து, அதில் சமித்துகளை இடுகிறான். அவற்றுடன் ' +
      'சொல்லப்படும் வேத மந்திரங்கள் ஒரு மாணவனுக்குத் தேவையானவற்றையே கேட்கின்றன: நீண்ட ஆயுள், ' +
      'தேஜஸ், அறிவு, தனக்குரிய பங்கு. இது இல்லறத்தானின் அக்னி வழிபாட்டின் சிறிய வடிவம் — இன்னும் ' +
      'இல்லறம் இல்லாதவனால் செய்யப்படுவது. ஹோமம் முடிந்ததும் தன் அக்னியின் சாம்பலை எடுத்து நீருடன் ' +
      'குழைத்து, உடலில் ஏழு இடங்களில் இட்டுக்கொள்கிறான்; ஒவ்வொன்றுக்கும் அதற்கேற்ற ஒரு வேண்டுதல். ' +
      'இறுதியில் எதையும் தனக்கென வைத்துக்கொள்ளாமல், அனைத்தையும் ப்ரம்மத்திற்கு அர்ப்பணிக்கிறான்.',
    samagri: [
      ['Homa kundam (fire pot)', 'ஹோம குண்டம்', '1', 'vessel', true, true, 'a brick-lined pit or any fireproof pot'],
      ['Samidha (dry sacrificial sticks)', 'சமித்து', '13 or more — one for each offering', 'offering', true, true, 'dry darbha grass'],
      ['Rice husk', 'உமி', 'enough to start the fire', 'core', true, false, null],
      ['Dried cow dung cakes', 'வறட்டி (காய்ந்த சாணம்)', 'a few', 'core', true, false, null],
      ['Charcoal', 'கரி', 'a few pieces', 'core', true, false, null],
      ['Panchapatram (the water vessel)', 'பஞ்ச பாத்திரம்', '1', 'vessel', true, true, 'copper, brass or silver'],
      ['Uddharani (the spoon water is sipped from)', 'உத்தரிணி', '1', 'vessel', true, true, 'copper or brass'],
      ['Theertha patram (the broad plate)', 'தீர்த்த பாத்திரம் (தாம்பாளம்)', '1', 'vessel', true, true, 'copper or brass'],
    ],
  },
  brahma_yajnam: {
    steps: by, all: ['main'], deity: 'brahma', duration: 15,
    modes: [
      ['main', 1, 'Daily', 'தினசரி', 'Performed once a day, in a single sitting.', 'தினமும் ஒரு முறை, ஒரே அமர்வில் செய்யப்படுவது.', null],
    ],
    description_en:
      'One of the five great daily sacrifices: the debt to the rishis, repaid by reciting what ' +
      'was learnt and offering tarpanam to the rishis, the devas and the pitrs.',
    description_ta:
      'பஞ்ச மஹா யஜ்ஞங்களுள் ஒன்று. ரிஷிகளுக்குரிய கடனை வேத பாராயணத்தாலும் ரிஷி, தேவ, பித்ரு ' +
      'தர்ப்பணத்தாலும் தீர்ப்பது.',
    why_en:
      'Brahma Yajnam is one of the five great sacrifices a householder owes every day, and it is ' +
      'the one that repays the seers. Its offering is not food or fire but recitation: the Gayatri, ' +
      'then the opening verse of each of the four Vedas, so that something of what was learnt is ' +
      'said again each day and not lost. Then water is offered, once to the gods, twice to the ' +
      'seers and three times to the ancestors, with the sacred thread worn a different way for ' +
      'each. The seers include the texts themselves: the Vedas, the epics and the Kalpa are each ' +
      'given water by name. It ends by giving the whole of it to Brahman.',
    why_ta:
      'ஒரு க்ருஹஸ்தன் தினமும் செய்ய வேண்டிய பஞ்ச மஹா யஜ்ஞங்களுள் ஒன்று ப்ரம்ம யஜ்ஞம்; ' +
      'ரிஷிகளுக்குப் பட்ட கடனைத் தீர்ப்பது இதுவே. இதில் அர்ப்பணம் உணவோ அக்னியோ அல்ல, பாராயணம்: ' +
      'காயத்ரீ, பின் நான்கு வேதங்களின் முதல் மந்திரங்கள் — கற்றது மறந்துபோகாமல் தினமும் ' +
      'சிறிதாவது மீண்டும் சொல்லப்படுவதற்காக. பின் நீர் அர்ப்பணம்: தேவர்களுக்கு ஒரு முறை, ' +
      'ரிஷிகளுக்கு இரு முறை, பித்ருக்களுக்கு மூன்று முறை; ஒவ்வொன்றுக்கும் பூணூல் வேறு விதமாக ' +
      'அணியப்படுகிறது. ரிஷிகளுள் நூல்களும் அடங்கும்: வேதங்கள், இதிஹாஸ புராணங்கள், கல்பம் — ' +
      'ஒவ்வொன்றுக்கும் பெயர் சொல்லி நீர் அளிக்கப்படுகிறது. இறுதியில் அனைத்தும் ப்ரம்மத்திற்கு அர்ப்பணம்.',
    samagri: [
      ['Panchapatram (the water vessel)', 'பஞ்ச பாத்திரம்', '1', 'vessel', true, true, 'copper, brass or silver'],
      ['Uddharani (the spoon water is sipped from)', 'உத்தரிணி', '1', 'vessel', true, true, 'copper or brass'],
      ['Theertha patram (the broad plate)', 'தீர்த்த பாத்திரம் (தாம்பாளம்)', '1', 'vessel', true, true, 'copper or brass'],
      ['Yajnopaveetam (the sacred thread)', 'யஜ்ஞோபவீதம் (பூணூல்)', 'the one you wear', 'core', true, false, null],
    ],
  },
  bhojana_vidhi: {
    steps: bh, all: ['day', 'night'], deity: 'agni', duration: 5,
    modes: [
      ['day', 1, 'By day', 'பகலில்', 'A meal eaten in daylight.', 'பகல் வேளை உணவு.', 0],
      ['night', 2, 'At night', 'இரவில்', 'A meal eaten after dark.', 'இரவு உணவு.', 18],
    ],
    description_en:
      'What is said before and after eating: the plate is ringed with water, the food is ' +
      'sprinkled, the five breaths and Brahman are given the first mouthfuls, and the meal is ' +
      'closed with a sip of water.',
    description_ta:
      'உணவு உண்ணும் முன்னும் பின்னும் சொல்லப்படுவது: பரிஷேசனம், ப்ரோக்ஷணம், ஐந்து ப்ராணன்களுக்கும் ' +
      'ப்ரம்மத்திற்கும் முதல் கவளங்கள், இறுதியில் ஒரு முறை நீர் உட்கொள்ளுதல்.',
    why_en:
      'Eating is the one thing everyone does every day, and this short rite turns it into an ' +
      'offering. The plate is ringed with water and the food sprinkled with the Gayatri; a sip of ' +
      'water is taken as the spread beneath the food; and the first mouthfuls are offered to the ' +
      'five breaths and to Brahman, as if into a fire, which the tradition says the body is. Then ' +
      'the meal is eaten as usual and closed with a last sip of water as its covering. It takes ' +
      'less than a minute, and it is meant for every meal.',
    why_ta:
      'உண்பது எல்லோரும் தினமும் செய்வது; இந்தச் சிறிய விதி அதை ஒரு அர்ப்பணமாக மாற்றுகிறது. ' +
      'தட்டைச் சுற்றி நீர் சுழற்றப்பட்டு, காயத்ரீயால் உணவின் மேல் நீர் தெளிக்கப்படுகிறது; ' +
      'உணவுக்குக் கீழ் விரிப்பாக ஒரு முறை நீர் உட்கொள்ளப்படுகிறது; முதல் கவளங்கள் ஐந்து ' +
      'ப்ராணன்களுக்கும் ப்ரம்மத்திற்கும் அக்னியில் இடுவதுபோல அர்ப்பணிக்கப்படுகின்றன — உடலே அக்னி ' +
      'என்பது மரபு. பின் வழக்கம்போல உண்டு, இறுதியில் மூடியாக ஒரு முறை நீர் உட்கொண்டு ' +
      'முடிக்கப்படுகிறது. ஒரு நிமிடம்கூட ஆகாது; ஒவ்வொரு உணவுக்கும் உரியது.',
    samagri: [
      ['Tumbler of water', 'ஒரு டம்ளர் நீர்', '1', 'vessel', true, false, null],
      ['Plate or leaf for the meal', 'இலை அல்லது தட்டு', '1', 'vessel', true, false, null],
    ],
  },
};

// Every step gets its modes, its section label and its scripts.
for (const [pid, P] of Object.entries(POOJAS)) {
  P.steps = P.steps.map((s) => ({
    ...s,
    modes: s.modes ?? P.all,
    section_en: s.section ? SECTIONS[s.section][0] : null,
    section_ta: s.section ? SECTIONS[s.section][1] : null,
    sc: s.deva
      ? { deva: s.deva, ta: transliterate(S, s.deva, 'tamil'), iast: transliterate(S, s.deva, 'iast') }
      : { deva: null, ta: null, iast: null },
    archana: s.archana?.map((a) => ({
      ...a, ta: transliterate(S, a.deva, 'tamil'), iast: transliterate(S, a.deva, 'iast'),
    })),
    pid,
  }));
}

// --- checks ---------------------------------------------------------------------

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };
const OFFER_VERBS = /\b(offer|pour|sprinkle|sip|swallow)\b/gi;
const CROSS_REF = /\b(as before|exactly as before|learnt from a teacher|learned from a teacher|return and continue|stands in its place|already done|see (above|below|page|step)|refer to|described (above|earlier)|page \d+|step \d+)\b/i;
const CITES = /\b(the book|this book|the edition|this edition|Bhavan|the author|the manual|this volume)\b/i;
const sentences = (t) => (t.match(/[.!?](\s|$)/g) ?? []).length;

const all = Object.values(POOJAS).flatMap((P) => P.steps);
for (const [pid, P] of Object.entries(POOJAS)) {
  console.log(`--- ${pid} ---`);
  const titles = new Set();
  P.steps.forEach((s, i) => {
    const kind = s.archana ? `${s.archana.length} lines` : s.deva ? `${s.deva.split('\n').length} ln` : 'no mantra';
    console.log(`  ${String(i + 1).padStart(2)}  ${(s.section_en ?? '').padEnd(28)} ${s.title.padEnd(38)} ${s.modes.join(',').padEnd(13)} ${kind}`);
    const at = `${pid}/${s.title}`;
    if (titles.has(s.title)) fail(`${at}: title used twice`);
    titles.add(s.title);
    for (const f of ['title', 'ta', 'instruction', 'instruction_ta', 'meaning', 'philosophy', 'src']) {
      if (!s[f] || !String(s[f]).trim()) fail(`${at}: ${f} is empty`);
    }
    for (const f of ['title', 'ta']) {
      if (s[f].length > 60 || /[।॥\n]/.test(s[f])) fail(`${at}: ${f} does not look like a title`);
    }
    for (const f of ['ta', 'instruction_ta']) if (!/[஀-௿]/.test(s[f])) fail(`${at}: ${f} is not Tamil`);
    for (const f of ['instruction', 'meaning', 'philosophy']) {
      if (/[ऀ-ॿ஀-௿꣠-ꣿ]/.test(s[f])) fail(`${at}: ${f} carries Indic script`);
      if (/\bperformers?\b/i.test(s[f])) fail(`${at}: ${f} says performer`);
      if (CROSS_REF.test(s[f])) fail(`${at}: ${f} sends the reader elsewhere: ${s[f].match(CROSS_REF)[0]}`);
      if (CITES.test(s[f])) fail(`${at}: ${f} cites the source`);
      if (/\.\.\.|…|\s{2,}/.test(s[f])) fail(`${at}: ${f} has an ellipsis or a double space`);
    }
    if (/முன்பு போல|முன்போல|நூல்/.test(s.instruction_ta)) fail(`${at}: Tamil instruction refers elsewhere`);
    if (/\.\.\.|…|\s{2,}/.test(s.instruction_ta)) fail(`${at}: Tamil instruction has an ellipsis or a double space`);
    const n = sentences(s.instruction);
    if (n < 1 || n > 3) fail(`${at}: instruction has ${n} sentences, wanted 1-3`);
    const verbs = (s.instruction.match(OFFER_VERBS) ?? []).length;
    if (verbs > 1) fail(`${at}: ${verbs} offering verbs in one instruction`);
    if (!s.deva && !s.archana && !/^Prepare the Fire/.test(s.title)) fail(`${at}: no mantra and no list`);
    if (s.deva && /\.{3,}|…/.test(s.deva)) fail(`${at}: mantra has a blank`);
    if (s.deva && /[A-Za-z:'‘’]/.test(s.deva)) fail(`${at}: mantra carries Latin, a colon or a quote`);
    if (s.sc.ta && /[ऀ-ॣ०-ॿ꣠-ꣿ]/.test(s.sc.ta.replace(/[।॥]/g, ''))) fail(`${at}: Devanagari in the Tamil mantra`);
    for (const a of s.archana ?? []) {
      if (/[ऀ-ॣ०-ॿ꣠-ꣿ]/.test(a.ta.replace(/[।॥]/g, ''))) fail(`${at}: Devanagari in a Tamil list line`);
    }
    for (const m of s.modes) if (!P.modes.some(([mm]) => mm === m)) fail(`${at}: mode ${m} is not declared`);
  });
  for (const [m] of P.modes) {
    const n = P.steps.filter((s) => s.modes.includes(m)).length;
    console.log(`  ${m.padEnd(8)} ${n} steps`);
    if (n < 2) fail(`${pid}: mode ${m} has ${n} steps`);
  }
  if (!P.why_en || !P.why_ta || !/[஀-௿]/.test(P.why_ta)) fail(`${pid}: why is missing`);
  if (CITES.test(P.why_en) || CROSS_REF.test(P.why_en)) fail(`${pid}: why_en cites or refers`);
  for (const r of P.samagri) if (!/[஀-௿]/.test(r[1])) fail(`${pid}: samagri "${r[0]}" has no Tamil`);
}

// Prose shared between two steps reads as a copy-paste unless the steps are the
// same step repeated, are alternatives no sitting shows together, or belong to
// the opening every rite shares. The same rules proofread applies.
const SHARED_BASE = new Set(['Achamanam', 'Anga Vandanam', 'Vighneshwara Dhyanam', 'Pranayamam']);
const base = (t) => t.replace(/\s*\([^()]*\)\s*$/, '').trim();
for (const f of ['instruction', 'meaning', 'philosophy']) {
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) {
      const a = all[i]; const b = all[j];
      if (a[f] !== b[f] || a[f].length < 60) continue;
      if (SHARED_BASE.has(base(a.title)) && SHARED_BASE.has(base(b.title))) continue;
      if (a.pid === b.pid && base(a.title) === base(b.title)) continue;
      if (!a.modes.some((m) => b.modes.includes(m))) continue;
      fail(`identical ${f}: ${a.pid}/${a.title} and ${b.pid}/${b.title}`);
    }
  }
}

// The book's own counts.
const COUNTS = [
  ['homa svaahaa mantras', HOMA.length, 12], ['deva tarpanam', DEVA_T.length, 5],
  ['rishi tarpanam (pp.57-58)', RISHI_T.length, 14], ['rishi tarpanam (p.59)', RISHI_T2.length, 9],
  ['pitru tarpanam', PITR_T.length, 5], ['raksha marks', RAKSHA_ROWS.length, 7],
  ['pranahuti', PRANAHUTI.length, 6], ['samidaadhaanam sittings', SAMID_ENDINGS.length, 2],
  ['bhojana day/night', DAYNIGHT.length, 2],
];
console.log('--- counts ---');
for (const [what, got, want] of COUNTS) {
  console.log(`  ${what.padEnd(28)} ${got}`);
  if (got !== want) fail(`${what}: ${got}, expected ${want}`);
}
console.log('--- repairs ---');
const allDeva = all.flatMap((s) => [s.deva ?? '', ...(s.archana ?? []).map((a) => a.deva)]).join('\n');
for (const f of FIXES) {
  console.log(`  ${f.wrong} -> ${f.right} (${fixCounts[f.wrong]} applied)`);
  if (fixCounts[f.wrong] !== f.expect) fail(`repair ${f.wrong} applied ${fixCounts[f.wrong]} times, expected ${f.expect}`);
  if (allDeva.includes(f.wrong)) fail(`misprint ${f.wrong} survived`);
  if (!allDeva.includes(f.right)) fail(`repair ${f.right} is not in the output`);
}
if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit -------------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`;
const inList = RITES.map(q).join(', ');
const L = [];
const o = (s = '') => L.push(s);

o('-- =============================================================================');
o('-- 0063_nitya_karmas_from_the_book.sql');
o('--');
o('-- GENERATED by scripts/build-nitya-karmas-from-the-book.mjs. Do not hand-edit.');
o('--');
o('-- Publishes the three nitya karmas 0043 put on the shelf as planned, from the');
o('-- Giri Yajurveda Trikaala Sandhyaavandanam: Samidadhanam (book pp.49-54),');
o('-- Brahma Yajnam (pp.55-60) and Bhojana Vidhi (pp.60-61).');
o('--');
o('-- Mantras are read out of the page transcripts by page and block; Tamil and');
o('-- IAST are derived. The book prints no English gloss on these pages, so the');
o('-- meanings are written for this app; the uncertain ones are listed for review');
o('-- in docs/plans/nitya-karmas-0063.md.');
o('--');
o('-- One action and its words per step. The opening the book only points at');
o('-- ("aachamanam & angavandanam (twice) -- refer page no. 16, 17", the dhyanam,');
o('-- the pranayama, "sankalpaha -- page 19 and continue") is inlined in full, and');
o('-- the closing "aachamanam, angavandanam once" is two real steps.');
o('--');
o('-- Modes: Samidadhanam morning/evening (pratah from 0:00, sayam from 12:00),');
o('-- Bhojana Vidhi day/night (day from 0:00, night from 18:00), Brahma Yajnam one.');
o('--');
o('-- Repairs, each settled by the roman on the same page:');
for (const f of FIXES) o(`--   ${f.wrong} -> ${f.right}: ${f.why}`);
o('--');
for (const [pid, P] of Object.entries(POOJAS)) {
  o(`-- ${pid}: ${P.steps.length} steps; ${P.modes.map(([m]) => `${m} ${P.steps.filter((s) => s.modes.includes(m)).length}`).join(', ')}.`);
}
o('-- =============================================================================');
o();
o('begin;');
o();
o('-- Brahma Yajnam names Brahma the self-born among the seers it waters and opens');
o('-- its deva tarpanam with "the devas beginning with Brahma". proofread requires a');
o('-- published rite to name a deity that exists.');
o('insert into public.deities (id, name_en, name_deva, name_ta, name_dative_deva, class)');
o("values ('brahma', 'Brahma', 'ब्रह्मा', 'ப்ரம்மா', 'श्री ब्रह्मणे', 'god')");
o('  on conflict (id) do nothing;');
o();
o('-- Idempotent: re-running replaces the same rows.');
o(`delete from public.archana_items where pooja_step_id in (select id from public.pooja_steps where pooja_id in (${inList}));`);
o(`delete from public.pooja_steps where pooja_id in (${inList});`);
o(`delete from public.samagri_items where pooja_id in (${inList});`);
o(`delete from public.pooja_modes where pooja_id in (${inList});`);
o();

for (const [pid, P] of Object.entries(POOJAS)) {
  o(`-- ===== ${pid} =====`);
  o('update public.poojas set');
  o(`  status = 'published', ritual_class = 'nitya', deity_id = ${q(P.deity)}, duration_mins = ${P.duration},`);
  o(`  description_en = ${q(P.description_en)},`);
  o(`  description_ta = ${q(P.description_ta)},`);
  o(`  why_en = ${q(P.why_en)},`);
  o(`  why_ta = ${q(P.why_ta)},`);
  o(`  source_ref = ${q(`${BOOK}, Giri Trading Agency, English translation by A. R. Parthasarathi; transcribed from photographed pages.`)},`);
  o('  updated_at = now()');
  o(` where id = ${q(pid)};`);
  o();
  for (const [mode, seq, le, lt, he, ht, h] of P.modes) {
    o('insert into public.pooja_modes (pooja_id, mode, seq, label_en, label_ta, hint_en, hint_ta, from_hour)');
    o(`values (${q(pid)}, ${q(mode)}, ${seq}, ${q(le)}, ${q(lt)}, ${q(he)}, ${q(ht)}, ${h === null ? 'null' : h});`);
  }
  o();
  P.samagri.forEach(([en, ta, qty, cat, req, sub, subWith], i) => {
    o('insert into public.samagri_items');
    o('  (pooja_id, seq, item_en, item_ta, quantity, category, is_required, is_substitutable, substitute_with)');
    o(`values (${q(pid)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(qty)}, ${q(cat)}, ${req}, ${sub}, ${q(subWith)});`);
  });
  o();
  P.steps.forEach((s, i) => {
    const n = i + 1;
    o(`-- ${n}. ${s.title}`);
    o('insert into public.pooja_steps');
    o('  (pooja_id, step_number, phase, section_en, section_ta, step_title_en, step_title_ta,');
    o('   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,');
    o('   meaning_en, philosophy_en, modes, gender_rule, scripts_generated, source_ref)');
    o('values');
    o(`  (${q(pid)}, ${n}, ${q(s.phase)}, ${q(s.section_en)}, ${q(s.section_ta)}, ${q(s.title)}, ${q(s.ta)},`);
    o(`   ${q(s.instruction)},`);
    o(`   ${q(s.instruction_ta)},`);
    o(`   ${q(s.sc.deva)},`);
    o(`   ${q(s.sc.ta)},`);
    o(`   ${q(s.sc.iast)},`);
    o(`   ${q(s.meaning)},`);
    o(`   ${q(s.philosophy)},`);
    o(`   ${arr(s.modes)}, 'all', ${s.deva ? 'true' : 'false'}, ${q(s.src)});`);
    (s.archana ?? []).forEach((a, j) => {
      o('insert into public.archana_items');
      o('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit, offering_deva, offering_en, offering_ta)');
      o(`select id, ${j + 1}, ${q(a.deva)}, ${q(a.ta)}, ${q(a.iast)}, ${q(a.offering_deva)}, ${q(a.offering_en)}, ${q(a.offering_ta)}`);
      o(`  from public.pooja_steps where pooja_id = ${q(pid)} and step_number = ${n};`);
    });
    o();
  });
}

o('-- --- assert ------------------------------------------------------------------');
o('do $$');
o('declare n int; t text;');
o('begin');
for (const [pid, P] of Object.entries(POOJAS)) {
  o(`  select count(*) into n from public.poojas where id = ${q(pid)} and status = 'published' and deity_id = ${q(P.deity)}`);
  o("     and coalesce(trim(why_en), '') <> '' and coalesce(trim(why_ta), '') <> '';");
  o(`  if n <> 1 then raise exception '${pid} is not published with a deity and a why'; end if;`);
  o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(pid)};`);
  o(`  if n <> ${P.steps.length} then raise exception '${pid} has % steps, expected ${P.steps.length}', n; end if;`);
  o('  select count(*) into n from (');
  o(`    select step_number, row_number() over (order by step_number) as rn from public.pooja_steps where pooja_id = ${q(pid)}`);
  o('  ) x where x.step_number <> x.rn;');
  o(`  if n > 0 then raise exception '${pid}: % step(s) not numbered 1..n', n; end if;`);
  for (const [m] of P.modes) {
    const c = P.steps.filter((s) => s.modes.includes(m)).length;
    o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(pid)} and ${q(m)} = any(modes);`);
    o(`  if n <> ${c} then raise exception '${pid}/${m} has % steps, expected ${c}', n; end if;`);
  }
  o('  select count(*) into n from public.pooja_steps s');
  o(`   where s.pooja_id = ${q(pid)} and exists (select 1 from unnest(s.modes) m`);
  o(`     where not exists (select 1 from public.pooja_modes pm where pm.pooja_id = ${q(pid)} and pm.mode = m));`);
  o(`  if n > 0 then raise exception '${pid}: % step(s) claim an undeclared mode', n; end if;`);
  o(`  select count(*) into n from public.samagri_items where pooja_id = ${q(pid)};`);
  o(`  if n <> ${P.samagri.length} then raise exception '${pid} has % samagri items, expected ${P.samagri.length}', n; end if;`);
  o();
}
o('  -- Tamil on every step, and no Devanagari leaked into it (dandas excepted).');
o("  select string_agg(pooja_id || '/' || step_title_en, ', ') into t from public.pooja_steps");
o(`   where pooja_id in (${inList})`);
o("     and (coalesce(trim(step_title_ta), '') = '' or coalesce(trim(instruction_ta), '') = ''");
o("          or translate(coalesce(mantra_tamil, ''), '।॥', '') ~ '[ऀ-ॿ꣠-ꣿ]');");
o("  if t is not null then raise exception 'Tamil missing or impure on: %', t; end if;");
o();
o('  -- The repairs landed and the misprints did not.');
for (const f of FIXES) {
  o('  select count(*) into n from public.pooja_steps s left join public.archana_items a on a.pooja_step_id = s.id');
  o(`   where s.pooja_id in (${inList}) and (s.mantra_sanskrit like ${q('%' + f.wrong + '%')} or a.invoked_name_deva like ${q('%' + f.wrong + '%')});`);
  o(`  if n > 0 then raise exception 'misprint ${f.wrong} survived'; end if;`);
}
o();
o('  -- The book\'s counts, on the stored rows.');
const LISTS = [
  ['samidadhanam', 'Raksha Mantra', 7], ['brahma_yajnam', 'Deva Tarpanam', 5],
  ['brahma_yajnam', 'Rishi Tarpanam', 14], ['brahma_yajnam', 'Rishi Tarpanam — the Vedas', 9],
  ['brahma_yajnam', 'Pitru Tarpanam', 5], ['bhojana_vidhi', 'Pranahuti', 6],
];
for (const [pid, title, c] of LISTS) {
  o('  select count(*) into n from public.archana_items a join public.pooja_steps s on s.id = a.pooja_step_id');
  o(`   where s.pooja_id = ${q(pid)} and s.step_title_en = ${q(title)};`);
  o(`  if n <> ${c} then raise exception '${pid}/${title} has % lines, expected ${c}', n; end if;`);
}
o(`  select count(*) into n from public.pooja_steps where pooja_id = 'samidadhanam' and section_en = 'Homa';`);
o(`  if n <> ${HOMA.length} then raise exception 'homa has % steps, expected ${HOMA.length}', n; end if;`);
o();
o('  -- No planned rite is left with steps, and these three are no longer planned.');
o(`  select count(*) into n from public.poojas where id in (${inList}) and status = 'planned';`);
o("  if n > 0 then raise exception '% of the three are still planned', n; end if;");
o('end $$;');
o();
o('commit;');

const sql = L.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration(OUT, sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
