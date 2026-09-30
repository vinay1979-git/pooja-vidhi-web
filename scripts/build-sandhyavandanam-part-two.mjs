#!/usr/bin/env node
/**
 * Sandhyavandanam, the japa half: book pages 28 to 48. And two repairs.
 *
 *   node scripts/build-sandhyavandanam-part-two.mjs          # validate
 *   node scripts/build-sandhyavandanam-part-two.mjs --emit   # write it
 *
 * Twenty-five steps, from the Namaskara mantras to the sprinkling of the place
 * of japa, ending at the book's own colophon: iti trikaala
 * sandhyaagaayatreejapavidhih.
 *
 * IT ALSO REPAIRS SOMETHING 0048 SHIPPED WITHOUT. All eighteen of part one's
 * steps went in with instruction_ta empty. Every other pooja in this app has
 * Tamil on every step, and proofread said so the moment 0048 was run. The
 * lesson was already written down -- 0033's header says to diff a new step's
 * column set against an existing step of the SAME pooja rather than against the
 * schema -- and it was there to be read. Part one's Tamil is backfilled here
 * rather than in a migration of its own, because the rite should be whole in
 * one place and a fourth file would be bookkeeping about my own omission.
 *
 * THE GENERATOR NOW REFUSES TO EMIT a step without Tamil, which is the only
 * change that stops this recurring.
 *
 * TWO MORE MISPRINTS ARE CORRECTED, both with their evidence, and both asserted
 * on the stored rows afterwards.
 *
 * ABHIVADANAM IS PRINTED AS THE BOOK PRINTS IT -- with the blanks. It is not a
 * form the app fills in. The book sets आपस्तम्ब सूत्रः and यजुः शाखाऽध्यायी in
 * type and leaves dotted rules for the pravaras, the gotra and the name,
 * because the person reciting knows their own. So does the app.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const S = Sanscript.default ?? Sanscript;
const POOJA = 'sandhyavandanam';
const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/6-sandhya-giri/';
const SRC = 'Yajurveda Trikaala Sandhyaavandanam (Giri), pp.28-48, photographed page';
const ALL = ['pratah', 'madhyahnika', 'sayam'];
const FIRST = 18; // part one's step count; part two continues from 19

const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  byPage[d.book_page] = d;
}

const FIXES = [
  {
    wrong: 'सायं मन्ध्या गायत्री',
    right: 'सायं सन्ध्या गायत्री',
    why:
      'Book page 31 sets मन्ध्या in the evening row of the japa sankalpa -- a स as म. The ' +
      'morning row spells सन्ध्या correctly, the roman beside the evening row reads ' +
      '"saayam sandhyaa-gaayatree", and page 37 sets the same word correctly.',
    expect: 1,
  },
  {
    wrong: 'भूरादिससव्याहृतीनाम्',
    right: 'भूरादिसप्तव्याहृतीनाम्',
    why:
      'Book page 32 has सस where it needs सप्त. The roman beside it reads ' +
      '"bhooraadi saptavyaahrteenaam" and the English gloss on the same page says ' +
      '"The seven vyahrutis beginning with Bhu".',
    expect: 1,
  },
];
const fixCounts = Object.fromEntries(FIXES.map((f) => [f.wrong, 0]));
function corrected(text) {
  let out = text;
  for (const f of FIXES) {
    const before = out;
    out = out.split(f.wrong).join(f.right);
    if (out !== before) fixCounts[f.wrong] += before.split(f.wrong).length - 1;
  }
  return out;
}

function block(page, idx, want) {
  const d = byPage[page];
  if (!d) throw new Error(`no transcript for book page ${page}`);
  const b = d.blocks[idx];
  if (!b) throw new Error(`p.${page} has no block ${idx}`);
  if (b.type !== want) throw new Error(`p.${page} block ${idx} is ${b.type}, not ${want}`);
  return b;
}
// Corrected as it is read; see the note in the part-one generator for why this
// cannot wait until emit.
const deva = (page, ...idx) =>
  corrected(idx.map((i) => block(page, i, 'deva').lines.join('\n')).join('\n'));
const rows = (page, idx, want = 'table') =>
  block(page, idx, want).rows.map((r) => r.map((c) => corrected(c)));
const scripts = (d) => ({
  deva: d, ta: transliterate(S, d, 'tamil'), iast: transliterate(S, d, 'iast'),
});

// --- part one's missing Tamil instructions -----------------------------------
//
// Keyed on step_title_en, which is stable, rather than on step_number.
const PART_ONE_TA = {
  'Achamanam':
    'கிழக்கு அல்லது வடக்கு நோக்கி அமரவும். வலது கையின் ஆட்காட்டி விரலை கட்டைவிரலுடன் சேர்த்து, மற்ற மூன்று விரல்களையும் மடக்கி உள்ளங்கையில் ஒரு உத்தரிணி நீர் நிற்குமாறு வைக்கவும். மூன்று நாமங்களிலும் ஒவ்வொரு முறை நீரை உள்கொள்ளவும். ஆசமனமும் அங்கவந்தனமும் தொடக்கத்தில் மும்முறை செய்யப்படும்.',
  'Anga Vandanam':
    'ஆறு ஜோடி நாமங்கள்; ஒவ்வொன்றுக்கும் குறிக்கப்பட்ட விரலால் உடலின் அந்தந்த இடத்தைத் தொடவும் — கட்டைவிரலால் கன்னங்கள், மோதிர விரலால் கண்கள், ஆட்காட்டி விரலால் நாசிகள், சுண்டு விரலால் காதுகள், நடுவிரலால் தோள்கள், அனைத்து விரல்களாலும் நாபியும் தலையும்.',
  'Vighneshwara Dhyanam':
    'நெற்றியின் இரு பக்கங்களையும் முஷ்டிகளால் மெல்ல ஐந்து முறை தட்டியபடி சொல்லவும்.',
  'Pranayamam':
    'ஆட்காட்டி, நடுவிரல்களை மடக்கவும். வலது நாசியைக் கட்டைவிரலாலும், இடது நாசியை மோதிர, சுண்டு விரல்களாலும் அடைக்கவும். மந்திரம் மூன்று பகுதிகள்: இடது நாசி வழியாக மூச்சை இழுத்தபடி "ஓம் பூஃ" முதல் "ஓகும் ஸத்யம்" வரை; மூச்சை நிறுத்தி "ஓம் தத் ஸவிதுஃ" முதல் "ப்ரசோதயாத்" வரை; வலது நாசி வழியாக வெளியிட்டபடி "ஓம் ஆபோ ஜ்யோதி" முதல் "பூர்புவஸ்ஸுவரோம்" வரை. இதுவே ஒரு ப்ராணாயாமம்.',
  'Sankalpam — morning':
    'வலது உள்ளங்கையை இடது உள்ளங்கையின் மேல் வைத்து, இரண்டையும் வலது தொடையில் வைத்தபடி சொல்லவும்.',
  'Sankalpam — noon':
    'வலது உள்ளங்கையை இடது உள்ளங்கையின் மேல் வைத்து, இரண்டையும் வலது தொடையில் வைத்தபடி சொல்லவும்.',
  'Sankalpam — evening':
    'வலது உள்ளங்கையை இடது உள்ளங்கையின் மேல் வைத்து, இரண்டையும் வலது தொடையில் வைத்தபடி சொல்லவும்.',
  'Jala Prarthana':
    'உத்தரிணியில் நீர் எடுத்து, வலது மோதிர விரலை அதில் வைத்திருக்கவும். மந்திரம் முடியும்போது நீரின் மேல் ஓம் எழுதி, அதை நெற்றியில் இடவும்.',
  'Marjanam':
    'முதல் ஏழு வரிகளிலும் மோதிர விரலால் தலையில் நீர் தெளிக்கவும். எட்டாவது வரியில் வலது, இடது தொடைகளைத் தொடவும். ஒன்பதாவது வரியில் மீண்டும் தெளிக்கவும். பின் வலது உள்ளங்கையில் நீர் எடுத்து தலையைச் சுற்றி வலமாகச் சுழற்றவும்.',
  'Apaam Prashanam — morning':
    'உள்ளங்கையில் ஒரு உத்தரிணி நீர் எடுத்து, மந்திரம் முடிந்ததும் அந்த நீரைப் பருகவும்.',
  'Apaam Prashanam — noon':
    'உள்ளங்கையில் ஒரு உத்தரிணி நீர் எடுத்து, மந்திரம் முடிந்ததும் அந்த நீரைப் பருகவும்.',
  'Apaam Prashanam — evening':
    'உள்ளங்கையில் ஒரு உத்தரிணி நீர் எடுத்து, மந்திரம் முடிந்ததும் அந்த நீரைப் பருகவும்.',
  'Punar Marjanam':
    'மார்ஜனத்தில் செய்த அதே தெளித்தல்; முன்னால் நான்கு வரிகள் சேர்க்கப்படுகின்றன, அவையும் அதே வரிசையில் அடங்கும்.',
  'Arghya Pradanam':
    'இரு உள்ளங்கைகளிலும் நீர் ஏந்தி, மந்திரம் முடியும்போது விரல் நுனிகள் வழியே கீழே விடவும். காலையிலும் மாலையிலும் மூன்று முறை; உச்சிப்போதில் இரண்டு முறை. பின் ஒரு ப்ராணாயாமம்.',
  'Prayashchitta Arghyam':
    'ஸங்கல்பத்தில் செய்தது போல கைகளை வைத்துச் சொல்லவும். பின் மீண்டும் ஒரு முறை அர்க்யம் கொடுத்து, இறுதி வரியைச் சொல்லியபடி தலையைச் சுற்றி நீர் சுழற்றவும்.',
  'Aikyanusandhanam':
    'ஆதித்யனை மௌனமாக த்யானித்தபடி சொல்லவும்.',
  'Navagraha Deva Tarpanam':
    'கையில் நீர் எடுத்து, ஒவ்வொரு நாமத்திற்குப் பின்னும் விரல் நுனிகள் வழியே ஒரு முறை விடவும். இறுதியில் ஆசமனமும் அங்கவந்தனமும் ஒரு முறை செய்யவும்.',
  'Conclusion of the First Part':
    'கையில் நீர் எடுத்து, சொல்லியபடி தாம்பாளத்தில் அர்ப்பணமாக விடவும்.',
};

// --- part two ----------------------------------------------------------------

const NAMASKARA = deva('28', 4);
const PRARTHANA = deva('29', 4);
const ASANA_NYASA = rows('30', 3);
const ASANA = deva('30', 5);
const DHYANAM2 = deva('30', 8);
const PRANAYAMA2 = deva('31', 2);
const JAPA_SANKALPA_STEM = deva('31', 5);
const JAPA_SANKALPA_ENDS = rows('31', 7);
const PRANAVA_NYASA = [...rows('32', 1), ...rows('32', 2)];
const GAYATRI_AVAHANA_NYASA = rows('33', 2);
const GAYATRI_AVAHANA = deva('33', 4);
const GAYATRI_NYASA = rows('34', 2);
const DHYANA_VERSE = deva('34', 5, /* continues */ ) + '\n' + deva('35', 0);
const GAYATRI = deva('36', 4);
const JAPA_COUNTS = rows('36', 1);
const UPASTHANA_ENDS = rows('37', 2);
const UPASTHANA_VERSE = deva('37', 4);
const SURYA_MORNING = deva('38', 2);
const SURYA_NOON = deva('39', 1);
const VARUNA = deva('41', 2);
const SAMASHTI = rows('42', 3, 'archana');
const KAAMO = deva('42', 5);
const ABHIVADANAM = deva('43', 3);
const DIG = [...rows('43', 7, 'archana'), ...rows('44', 0, 'archana')];
const YAMA = deva('44', 4);
const HARIHARA = deva('45', 2);
const SURYANARAYANA = deva('45', 7);
const SAMARPANAM = deva('47', 2);
const JAPASTHANAM = deva('48', 4, 7);

const T = (en, ta) => ({ en, ta });

const STEPS = [
  {
    t: 'Namaskara Mantras', ta: 'நமஸ்கார மந்திரங்கள்', deva: NAMASKARA, modes: ALL,
    i: T(
      'Stand facing east with folded hands and prostrate at the end of each of the two verses. ' +
      'The book asks for the ten postures of Surya Namaskara here, breathing in at the start of ' +
      'each and out at the end: stand erect, elbows at chest height; raise the folded hands over ' +
      'the head with the elbows straight; bend forward and place both palms flat on the floor ' +
      'with the knees straight; stretch both legs back onto the toes with the knees raised; ' +
      'straighten above the waist and lift the head, arms straight on the palms; lie flat, ' +
      'folding the elbows; stretch both hands forward on the floor, clasped. Then return through ' +
      'postures three, two and one to complete one namaskara. The book says to learn these from ' +
      'a teacher.',
      'கிழக்கு நோக்கி நின்று, கைகூப்பி, இரு ஸ்லோகங்களின் இறுதியிலும் நமஸ்காரம் செய்யவும். நூல் இங்கு சூர்ய நமஸ்காரத்தின் பத்து நிலைகளைக் கூறுகிறது; ஒவ்வொரு நிலையின் தொடக்கத்தில் மூச்சை இழுத்து, முடிவில் வெளியிடவும். இவற்றை யோகாசிரியரிடம் கற்பது நல்லது என்று நூலே கூறுகிறது.',
    ),
    m: 'Salutation to the god who is the good of the brahmins and the cattle, to Krishna, to ' +
       'Govinda, again and again. From the world of Brahma to the last of things, as far as the ' +
       'Lokaloka mountain — to the twice-born and the gods who dwell there, salutation always.',
    p: 'Part one was done sitting, with water. Part two begins by standing up. The book does not ' +
       'merely say prostrate: it gives the ten postures with the breath assigned to each, and ' +
       'then admits they are properly learnt from a teacher. The two verses widen as they go — ' +
       'the first salutes one deity by name, the second everything that exists.',
  },
  {
    t: 'Prarthana', ta: 'ப்ரார்த்தனை', deva: PRARTHANA, modes: ALL,
    i: T(
      'Two verses asking the spirits of the place for room before the japa begins.',
      'ஜபம் தொடங்கும் முன், அவ்விடத்தின் பூதங்களிடம் இடம் கேட்கும் இரு ஸ்லோகங்கள்.',
    ),
    m: 'May those beings settled on the earth who make obstruction depart, by Shiva\'s order. ' +
       'And the fierce spirits and pishachas who hold the earth up — without their opposition, ' +
       'may I begin the brahma karma.',
    p: 'The second verse is the interesting half. The first tells obstructing spirits to leave. ' +
       'The second names the fierce ones who SUSTAIN the earth and asks only to proceed without ' +
       'their opposition. They are not driven off; they hold the ground up, and the reciter is ' +
       'asking to work on ground that is theirs.',
  },
  {
    t: 'Asana Mantra', ta: 'ஆஸன மந்திரம்', modes: ALL,
    deva: `${ASANA_NYASA.map(([, d]) => d).join('\n')}\n${ASANA}`,
    i: T(
      'Sit down for the japa. Touch the head, the nostrils and the chest as the rishi, the metre ' +
      'and the deity are named, then pray with folded hands. With the ring finger touch the floor ' +
      'and then the point between the eyebrows while reciting the verse.',
      'ஜபத்திற்காக அமரவும். ரிஷி, சந்தஸ், தேவதை சொல்லும்போது முறையே தலை, நாசி, மார்பைத் தொடவும்; பின் கைகூப்பி வேண்டவும். மோதிர விரலால் முதலில் தரையையும் பின் புருவ மத்தியையும் தொட்டபடி ஸ்லோகத்தைச் சொல்லவும்.',
    ),
    m: 'Earth, by you the worlds are borne, and you are borne by Vishnu. Bear me too, goddess, ' +
       'and make this seat pure.',
    p: 'The same verse the app already carries as Asana Pooja elsewhere, with a fuller frame ' +
       'around it here: the mantra is given a rishi, a metre and a deity of its own, each touched ' +
       'to a different part of the body as it is named. You consecrate the seat while still ' +
       'outside it, and only then take your place.',
  },
  {
    t: 'Vighneshwara Dhyanam (japa)', ta: 'விக்னேஶ்வர த்யானம் (ஜபம்)', deva: DHYANAM2, modes: ALL,
    i: T(
      'Tap both temples gently with the knuckles five times while reciting.',
      'நெற்றியின் இரு பக்கங்களையும் முஷ்டிகளால் மெல்ல ஐந்து முறை தட்டியபடி சொல்லவும்.',
    ),
    m: 'He who wears white, who pervades all, moon-coloured and four-armed, with a face at ease ' +
       '— meditate on him, for the quieting of every obstacle.',
    p: 'The same verse that opened part one, said again. Both halves of the rite begin by tapping ' +
       'the temples for Ganesha, which is why the app carries it twice rather than once: it is ' +
       'two moments, not one repeated for emphasis.',
  },
  {
    t: 'Pranayamam (japa)', ta: 'ப்ராணாயாமம் (ஜபம்)', deva: PRANAYAMA2, modes: ALL,
    i: T(
      'The same breathing as before — in through the left through the seven worlds, held through ' +
      'the Gayatri, out through the right through om aapo jyoti.',
      'முன்பு போலவே மூச்சுப்பயிற்சி — இடது நாசி வழியே ஏழு லோகங்கள், மூச்சை நிறுத்தி காயத்ரி, வலது நாசி வழியே ஓம் ஆபோ ஜ்யோதி.',
    ),
    m: 'The seven worlds are Om; we meditate on the brilliance of the Creator; the waters, the ' +
       'light, the essence and the deathless are Brahman, bhuh bhuvah suvah, Om.',
    p: 'The book gives the mantra again and refers back to page 18 for the action rather than ' +
       'reprinting it. It cross-references itself the same way the Giri Nitya Pooja book does for ' +
       'its purvangam, and for the same reason: one description, corrected in one place.',
  },
];

// The japa sankalpa: three rows, and unlike the first sankalpa all three take
// karishye, because japa is a thing DONE at every sitting.
const SIT_EN = { pratah: 'morning', madhyahnika: 'noon', sayam: 'evening' };
const SIT_TA = { pratah: 'காலை', madhyahnika: 'உச்சி', sayam: 'மாலை' };
JAPA_SANKALPA_ENDS.forEach(([sitting, ending]) => {
  const mode = { morning: 'pratah', noon: 'madhyahnika', evening: 'sayam' }[sitting];
  if (!mode) throw new Error(`unknown sitting "${sitting}" in the japa sankalpa table`);
  STEPS.push({
    t: `Japa Sankalpam — ${SIT_EN[mode]}`, ta: `ஜப ஸங்கல்பம் — ${SIT_TA[mode]}`,
    modes: [mode], deva: `${JAPA_SANKALPA_STEM}\n${ending}`,
    i: T(
      'Hold the hands as for the first Sankalpam and recite.',
      'முதல் ஸங்கல்பத்தில் செய்தது போல கைகளை வைத்துச் சொல்லவும்.',
    ),
    m: 'That all the wrong accumulated in me may be destroyed, and so that the Supreme may be ' +
       `pleased: I shall perform the japa of the great Gayatri mantra of the ${SIT_EN[mode]}.`,
    p: 'The rite\'s second resolution, and it differs from the first in its object: there the ' +
       'goddess Sandhya was worshipped, here the japa is performed. All three sittings take ' +
       'karishye this time, where the first sankalpa gave upasishye to the morning and evening ' +
       'and karishye only to noon — because japa is a thing done at every hour.',
  });
});

STEPS.push(
  {
    t: 'Pranava Japa', ta: 'ப்ரணவ ஜபம்', modes: ALL,
    deva: PRANAVA_NYASA.map(([, d]) => d).join('\n'),
    i: T(
      'Touch the head, the nostrils and the chest at each of the two sets, as the rishi, the ' +
      'metre and the deity are named. Then do ten pranayamas.',
      'இரு தொகுதிகளிலும் ரிஷி, சந்தஸ், தேவதை சொல்லும்போது முறையே தலை, நாசி, மார்பைத் தொடவும். பின் பத்து ப்ராணாயாமம் செய்யவும்.',
    ),
    m: 'For the Pranava: Brahma is the rishi, Devi Gayatri the metre, Paramatman the deity. For ' +
       'the seven vyahritis beginning with bhuh: the rishis are Atri, Bhrigu, Kutsa, Vasishtha, ' +
       'Gautama, Kashyapa and Angirasa; the metres Gayatri, Ushnik, Anushtup, Brihati, Pankti, ' +
       'Trishtup and Jagati; the deities Agni, Vayu, Arka, Vagisha, Varuna, Indra and the ' +
       'Vishvedevas.',
    p: 'Four lists of seven, given in parallel and left for the reader to line up: each world has ' +
       'its own seer, its own metre and its own god, and the pranayama walks up through all ' +
       'seven. Ten repetitions here where the earlier pranayama asked for one — the second place ' +
       'in the rite where a number rather than a text distinguishes one performance from another.',
  },
  {
    t: 'Gayatri Avahanam', ta: 'காயத்ரி ஆவாஹனம்', modes: ALL,
    deva: `${GAYATRI_AVAHANA_NYASA.map(([, d]) => d).join('\n')}\n${GAYATRI_AVAHANA}`,
    i: T(
      'Touch head, nostrils and chest again for the rishi, metre and deity. Then hold both palms ' +
      'together in front of the face as though looking into them, and turn them inwards at the ' +
      'end of each of the three invocations — Gayatri, Savitri, Sarasvati.',
      'ரிஷி, சந்தஸ், தேவதைக்காக மீண்டும் தலை, நாசி, மார்பைத் தொடவும். பின் இரு உள்ளங்கைகளையும் முகத்திற்கு முன் சேர்த்து, அவற்றுள் பார்ப்பது போல வைத்து, காயத்ரி, ஸாவித்ரி, ஸரஸ்வதி என்ற மூன்று ஆவாஹனங்களின் இறுதியிலும் உள்நோக்கித் திருப்பவும்.',
    ),
    m: 'Come, boon-giving goddess, syllable equal to Brahman. Gayatri, mother of the metres, be ' +
       'pleased with this Brahman of ours. You are vigour, you are strength, you are might, you ' +
       'are splendour, you are the dwelling and the name of the gods. You are all, you are all ' +
       'life. I invoke Gayatri. I invoke Savitri. I invoke Sarasvati.',
    p: 'One goddess called in three aspects, and the invocation is finished by a movement of the ' +
       'hands rather than by an offering. Elsewhere in this app a deity is invoked into an image ' +
       'or a kalasham; here she is invoked into the reciter\'s own cupped palms.',
  },
  {
    t: 'Gayatri Nyasa', ta: 'காயத்ரி ந்யாஸம்', modes: ALL,
    deva: GAYATRI_NYASA.map(([, d]) => d).join('\n'),
    i: T(
      'Touch the head, the nostrils and the chest as each is named.',
      'ஒவ்வொன்றையும் சொல்லும்போது முறையே தலை, நாசி, மார்பைத் தொடவும்.',
    ),
    m: 'For the Savitri: Vishvamitra is the rishi, Nichrit-Gayatri the metre, Savitr the deity.',
    p: 'The fourth nyasa in five pages, identical in shape to the asana, the pranava and the ' +
       'avahanam and different in content each time. This one names the credentials of the mantra ' +
       'about to be repeated a hundred and eight times.',
  },
  {
    t: 'Dhyanam', ta: 'த்யானம்', deva: DHYANA_VERSE, modes: ALL,
    i: T(
      'Contemplate a single form of the goddess, whichever is most cherished, while reciting.',
      'மிகவும் விருப்பமான ஒரு வடிவத்தை மனத்தில் நிறுத்தி த்யானித்தபடி சொல்லவும்.',
    ),
    m: 'Gayatri of five faces coloured like pearl, coral, gold, sapphire and white, each ' +
       'three-eyed, crowned with a jewelled crown bound with the crescent; bearing in her hands ' +
       'the boon and the fear-not, the goad and the whip, the bright skull and the mace, the ' +
       'conch, the discus and a pair of lotuses. And: her whose hands hold the rosary and the ' +
       'water pot, clear as pure crystal, made of all knowledge — Gayatri, mother of the Vedas. ' +
       'That god Savitr who impels our thoughts towards dharma: his brilliance is what we worship.',
    p: 'Three movements: her form in ornament, her form in simplicity, and her function. The ' +
       'book prints the ornate and the plain images one after the other without comment, because ' +
       'the japa may be done contemplating either. The third verse restates the Gayatri\'s own ' +
       'sense and hands the reciter straight into the mantra.',
  },
  {
    t: 'Gayatri Japa', ta: 'காயத்ரி ஜபம்', deva: GAYATRI, modes: ALL,
    i: T(
      'Count on the joints of the fingers: hold both palms together sideways before the face and ' +
      'begin with the right thumb on the middle line of the ring finger, moving down, across and ' +
      'up in a clockwise circuit of ten, then anticlockwise back for the next ten. ' +
      'MORNING 108 times facing east. NOON 32 times facing east. EVENING 64 times, facing west ' +
      'before sunset and east after it. Then do one pranayama.',
      'விரல் கணுக்களில் எண்ணவும்: இரு உள்ளங்கைகளையும் முகத்திற்கு முன் பக்கவாட்டில் சேர்த்து, வலது கட்டைவிரலை மோதிர விரலின் நடுக்கோட்டில் வைத்துத் தொடங்கி, வலமாகச் சுற்றி பத்து; பின் இடமாகத் திரும்பி அடுத்த பத்து. காலை 108 முறை, கிழக்கு நோக்கி. உச்சி 32 முறை, கிழக்கு நோக்கி. மாலை 64 முறை; சூரியன் மறைவதற்கு முன் மேற்கு, மறைந்த பின் கிழக்கு. பின் ஒரு ப்ராணாயாமம்.',
    ),
    m: 'The three worlds are Om. We meditate on the brilliance of that god who impels our ' +
       'thoughts.',
    p: 'The most mode-dependent step in the rite, and none of it is the mantra. The Gayatri is ' +
       'identical at all three sittings; the count changes and so does the direction faced. The ' +
       'evening rule is conditional on the actual sun rather than the clock — west before it ' +
       'sets, east afterwards — so the app prints both halves and leaves the sky to settle it.',
  },
);

// Gayatri Upasthanam: a three-way resolution followed by one shared verse.
UPASTHANA_ENDS.forEach(([sitting, ending]) => {
  const mode = { morning: 'pratah', noon: 'madhyahnika', evening: 'sayam' }[sitting];
  if (!mode) throw new Error(`unknown sitting "${sitting}" in the upasthana table`);
  STEPS.push({
    t: `Gayatri Upasthanam — ${SIT_EN[mode]}`, ta: `காயத்ரி உபஸ்தானம் — ${SIT_TA[mode]}`,
    modes: [mode], deva: `${ending}\n${UPASTHANA_VERSE}`,
    i: T(
      'Lock both hands one into the other, right over left, clasp the palms, rotate them from ' +
      'inside and release. Then touch the floor with the ring finger and the point between the ' +
      'eyebrows while reciting the verse.',
      'இரு கைகளையும் ஒன்றோடொன்று கோத்து, வலது கை இடது மேல் இருக்கும்படி உள்ளங்கைகளைச் சேர்த்து, உள்ளிருந்து சுழற்றி விடுவிக்கவும். பின் மோதிர விரலால் தரையையும் புருவ மத்தியையும் தொட்டபடி ஸ்லோகத்தைச் சொல்லவும்.',
    ),
    m: `I shall perform the upasthanam of the Gayatri of the ${SIT_EN[mode]}. On the highest ` +
       'summit, goddess, on the earth, on the head of the mountain — with the leave of the ' +
       'brahmins, go, goddess, happily.',
    p: 'The udvasanam of the Gayatri, and it mirrors the avahanam exactly: invoked with the ' +
       'palms turned inwards, dismissed with them locked, turned from inside and opened. She is ' +
       'not dissolved and not taken into the heart — she is returned to a place. The app now ' +
       'holds three different ways of ending an invocation, and this is the third.',
  });
});

STEPS.push(
  {
    t: 'Surya Prarthana — morning', ta: 'ஸூர்ய ப்ரார்த்தனை — காலை', modes: ['pratah'],
    deva: SURYA_MORNING,
    i: T('Pray with folded hands.', 'கைகூப்பி வேண்டவும்.'),
    m: 'The glory of Mitra, sustainer of people, is worth winning and most brilliantly true. ' +
       'Mitra marshals people, knowing them; Mitra holds earth and sky; Mitra watches the ' +
       'settlements without blinking. Let us offer to the true one an oblation rich in ghee. That ' +
       'mortal is foremost who, Aditya, serves you by your law: he is neither slain nor overcome, ' +
       'and no evil reaches him from near or far.',
    p: 'The morning sun is addressed as Mitra, the friend, and the epithet does the work: three ' +
       'clauses each beginning with the name. It ends in the only outright guarantee in the rite ' +
       '— one whom you protect is neither slain nor overcome.',
  },
  {
    t: 'Surya Prarthana — noon', ta: 'ஸூர்ய ப்ரார்த்தனை — உச்சி', modes: ['madhyahnika'],
    deva: SURYA_NOON,
    i: T(
      'The mantra has two parts. At the end of the first, at jyok cha sooryam drushe, look at the ' +
      'sun through the gap made by locking both hands together above the eyes. The book says to ' +
      'learn this from a teacher. Then return and continue.',
      'மந்திரம் இரு பகுதிகள். முதல் பகுதி "ஜ்யோக் ச ஸூர்யம் த்ருஶே" என்பதில் முடியும்; அப்போது இரு கைகளையும் கண்களுக்கு மேல் கோத்து, அதன் இடைவெளி வழியே சூரியனைப் பார்க்கவும். இதை ஆசிரியரிடம் கற்க வேண்டும் என நூல் கூறுகிறது. பின் தொடரவும்.',
    ),
    m: 'Moving with truth through the atmosphere, settling the immortal and the mortal, Savitr ' +
       'comes in his golden chariot, beholding the worlds. Seeing the higher light beyond the ' +
       'darkness, we have reached the sun, god among gods, the highest light. May we see a ' +
       'hundred autumns, live a hundred, rejoice a hundred, delight a hundred, be a hundred, hear ' +
       'a hundred, speak a hundred, be unconquered a hundred — and long may we see the sun.',
    p: 'The longest mantra in the rite and the only one with an action inside it rather than ' +
       'before or after. Eight verbs on one frame ask not for release but for another century of ' +
       'looking at the sun: to see, live, rejoice, delight, be, hear, speak and remain ' +
       'unconquered, each for a hundred autumns.',
  },
  {
    t: 'Varuna Prarthana — evening', ta: 'வருண ப்ரார்த்தனை — மாலை', modes: ['sayam'],
    deva: VARUNA,
    i: T('Pray with folded hands.', 'கைகூப்பி வேண்டவும்.'),
    m: 'Hear this call of mine, Varuna, and be gracious today; longing for help I come to you. I ' +
       'entreat you with prayer; the sacrificer asks the same with his oblations. Be here, ' +
       'Varuna, without anger, widely famed; do not take away our life. Whatever offence we men ' +
       'commit against the divine folk, whatever of your law we have disturbed unknowing — do not ' +
       'destroy us for that wrong, god. Whatever we have cheated at, like gamblers, or truly ' +
       'know or do not know: loosen all of it like loosened bonds, and may we be dear to you.',
    p: 'The three sittings now have three deities — Mitra at dawn, Surya at noon, Varuna at dusk ' +
       '— and the tone changes with them. The morning promised protection; this one confesses. ' +
       'Three admissions and then the request: do not destroy us for it. The rite ends its day by ' +
       'owning what it got wrong, having begun by asking to be kept from it.',
  },
  {
    t: 'Samashti Abhivadanam', ta: 'ஸமஷ்ட்ய அபிவாதனம்', modes: ALL,
    deva: KAAMO, archana: SAMASHTI.map(([dir, d]) => ({ deva: d, dir })),
    i: T(
      'Turn clockwise, pausing to face each quarter as it is named: Sandhya east, Savitri south, ' +
      'Gayatri west, Sarasvati north, and all the deities facing east again. Then pray with ' +
      'folded hands.',
      'வலமாகத் திரும்பி, ஒவ்வொரு திசையையும் நோக்கி நிற்கவும்: ஸந்த்யா கிழக்கு, ஸாவித்ரி தெற்கு, காயத்ரி மேற்கு, ஸரஸ்வதி வடக்கு, பின் அனைத்து தேவதைகளுக்கும் மீண்டும் கிழக்கு நோக்கி. பின் கைகூப்பி வேண்டவும்.',
    ),
    m: 'Salutation to Sandhya, to Savitri, to Gayatri, to Sarasvati, and to all the deities. ' +
       'Desire did it; anger did it. Salutation, salutation.',
    p: 'A circuit rather than a list: five salutations, each said facing a different quarter, ' +
       'ending where it began. The closing line is the third and shortest of the rite\'s ' +
       'confessions — after the Prashanam\'s list of organs and the Varuna prayer\'s list of ' +
       'offences, two verbs and a bow.',
  },
  {
    t: 'Abhivadanam', ta: 'அபிவாதனம்', deva: ABHIVADANAM, modes: ALL,
    i: T(
      'Cover both ears with the hands and touch the floor at the end. Say your own pravara ' +
      'rishis, gotra and name in the blanks — the book leaves them blank because the reciter ' +
      'knows them. Three rishis take tryarsheya, five take panchaarsheya.',
      'இரு காதுகளையும் கைகளால் மூடி, இறுதியில் தரையைத் தொடவும். இடைவெளிகளில் உங்கள் ப்ரவர ரிஷிகள், கோத்ரம், பெயர் ஆகியவற்றைச் சொல்லவும் — சொல்பவருக்குத் தெரியும் என்பதால் நூலும் அவற்றை வெறுமையாகவே விட்டிருக்கிறது. மூன்று ரிஷிகளானால் த்ர்யார்ஷேய, ஐந்தானால் பஞ்சார்ஷேய.',
    ),
    m: 'I salute — of the pravara of three (or five) rishis, of such a gotra, of the Apastamba ' +
       'sutra, a student of the Yajus recension: I am so-and-so sharma by name, sir.',
    p: 'Printed with its blanks, as the book prints it. The book fills in two of the five slots ' +
       'in type — Apastamba sutra and the Yajus recension, because it is a Yajurveda Apastamba ' +
       'manual — and leaves the rest dotted. The ears are covered because the reciter is about ' +
       'to say his own name and lineage aloud.',
  },
  {
    t: 'Dig Devata Vandanam', ta: 'திக் தேவதா வந்தனம்', modes: ALL,
    deva: null, archana: DIG.map(([dir, d]) => ({ deva: d, dir })),
    i: T(
      'Salute each quarter as it is named. The last three — above, below and the mid-space — are ' +
      'said facing east without turning.',
      'ஒவ்வொரு திசையையும் சொல்லும்போது வணங்கவும். இறுதி மூன்று — மேல், கீழ், அந்தரிக்ஷம் — திரும்பாமல் கிழக்கு நோக்கியே சொல்லப்படும்.',
    ),
    m: 'Salutation to the eastern quarter, the southern, the western, the northern; to what is ' +
       'above, what is below, and the space between; to Earth, to Brahma, to Vishnu, to Death.',
    p: 'The Samashti Abhivadanam turned through four quarters; this salutes the quarters as ' +
       'deities in their own right and then adds the vertical — up, down, and the space between ' +
       '— without turning. Eleven salutations, four horizontal, three vertical and four by name.',
  },
  {
    t: 'Yama Vandanam', ta: 'யம வந்தனம்', deva: YAMA, modes: ALL,
    i: T('Face south while reciting.', 'தெற்கு நோக்கிச் சொல்லவும்.'),
    m: 'Salutation to Yama, to the king of dharma, to Death and to the Ender; to the son of ' +
       'Vivasvat, to Time, to the destroyer of all beings; to the one of the udumbara, to Dadhna, ' +
       'to the dark one, to the highest; to the wide-bellied, to Chitra, and to Chitragupta.',
    p: 'Twelve datives, and the rite that began by asking Mitra for protection ends by naming ' +
       'death in every aspect it has. The last name is Chitragupta, said again on its own — the ' +
       'one who writes down what each person did. After three confessions, the rite bows to the ' +
       'clerk who keeps the account.',
  },
  {
    t: 'Harihara Vandanam', ta: 'ஹரிஹர வந்தனம்', deva: HARIHARA, modes: ALL,
    i: T('Face north while reciting.', 'வடக்கு நோக்கிச் சொல்லவும்.'),
    m: 'Order and truth, the supreme Brahman, the person dark and tawny, whose seed is drawn ' +
       'upward, of strange eyes — salutation, salutation to him whose form is the universe.',
    p: 'One figure, not two. Dark and tawny is the whole point: the grey body of Vishnu blended ' +
       'with the red of Shiva in a single form. It makes the same case in one word that the ' +
       'panchayatana arrangement makes with five deities and a diagram.',
  },
  {
    t: 'Suryanarayana Vandanam', ta: 'ஸூர்யநாராயண வந்தனம்', deva: SURYANARAYANA, modes: ALL,
    i: T('Face east while reciting.', 'கிழக்கு நோக்கிச் சொல்லவும்.'),
    m: 'Salutation to Savitr, the one eye of the world, cause of its birth, its standing and its ' +
       'end; made of the three Vedas, bearing the three qualities, whose self is Brahma, Vishnu ' +
       'and Shankara. Narayana seated always in the middle of the solar orbit, on the lotus, with ' +
       'armlets and makara earrings, crowned and garlanded, golden-bodied, holding conch and ' +
       'discus, is ever worthy of meditation. Holder of conch, discus and mace, dweller in ' +
       'Dvaraka, Achyuta, Govinda, lotus-eyed — protect me, who have come for refuge. As water ' +
       'fallen from the sky makes its way to the sea, salutation to any god makes its way to ' +
       'Keshava.',
    p: 'The closing verse is the rite\'s own justification. After Mitra, Varuna, nine planets, ' +
       'twelve months, four quarters, three verticals and the lord of death, it says all of it ' +
       'arrives at one place. It also answers the question a reader is most likely to have by ' +
       'now — why so many names — and it answers it with water finding the sea.',
  },
  {
    t: 'Samarpanam', ta: 'ஸமர்ப்பணம்', deva: SAMARPANAM, modes: ALL,
    i: T(
      'Cover both ears with the hands again, say the Abhivadanam once more, and touch the floor ' +
      'and prostrate at the end.',
      'மீண்டும் இரு காதுகளையும் கைகளால் மூடி, அபிவாதனத்தை ஒரு முறை சொல்லி, இறுதியில் தரையைத் தொட்டு நமஸ்கரிக்கவும்.',
    ),
    m: 'Whatever I do by body, speech, mind, senses, intellect, self or by the force of nature, ' +
       'all of it I offer to the supreme Narayana. Short of mantra, short of rite, short of ' +
       'devotion, Janardana — whatever I have done, let it stand complete for you. Of all ' +
       'expiations whatsoever, made of austerity and action, the remembrance of Krishna is the ' +
       'highest.',
    p: 'The app already holds two of these three verses: kaayena vaachaa, and the mantra-heenam ' +
       'that closes the Ganesha pooja. Completion is asked for as something the deity grants, not ' +
       'something the karta achieved. The third verse is new and it outranks everything before ' +
       'it: of all the expiations in a rite full of them, remembering a name is the highest.',
  },
  {
    t: 'Japasthanam Prokshanam', ta: 'ஜபஸ்தான ப்ரோக்ஷணம்', deva: JAPASTHANAM, modes: ALL,
    i: T(
      'Do Achamanam and Anga Vandanam once. Then take water in the hand, pour it down at the end ' +
      'of the mantra, and make a tilak with it. Finally pour water onto the plate as an offering ' +
      'while saying the closing line.',
      'ஆசமனமும் அங்கவந்தனமும் ஒரு முறை செய்யவும். பின் கையில் நீர் எடுத்து, மந்திரம் முடியும்போது கீழே விட்டு, அந்த நீரால் திலகம் இடவும். இறுதியாக, இறுதி வரியைச் சொல்லியபடி தாம்பாளத்தில் நீரை அர்ப்பணமாக விடவும்.',
    ),
    m: 'Today, god Savitr, send us prosperity with children. Drive away the bad dream. God ' +
       'Savitr, drive away all our wrongs, and send us what is good. Om tat sat — let it be an ' +
       'offering to Brahman.',
    p: 'The rite ends by sealing the PLACE rather than the person: water is poured where the ' +
       'reciter has been sitting. And the last request is for sleep — drive away the bad dream. ' +
       'After the planets, the months, the directions, death and the keeper of the record, the ' +
       'closing mantra asks for children, for nightmares to stop, and for whatever is good. It is ' +
       'the plainest sentence in the rite.',
  },
);

// --- checks ------------------------------------------------------------------

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- sandhyavandanam, part two ---');
const titles = new Set();
STEPS.forEach((s, i) => {
  const n = FIRST + i + 1;
  const kind = s.archana ? `${s.archana.length} salutations` : `${(s.deva || '').split('\n').length} lines`;
  console.log(`  ${String(n).padStart(2)}  ${s.t.padEnd(32)} ${s.modes.join(',').padEnd(30)} ${kind}`);
  if (titles.has(s.t)) fail(`${s.t}: two steps share a title`);
  titles.add(s.t);
  for (const [k, v] of [['title', s.t], ['title_ta', s.ta], ['meaning', s.m], ['philosophy', s.p],
                        ['instruction_en', s.i.en], ['instruction_ta', s.i.ta]]) {
    if (!v || !String(v).trim()) fail(`${s.t}: ${k} is empty`);
  }
  // THE GATE THAT STOPS 0048 HAPPENING AGAIN.
  if (!/[஀-௿]/.test(s.i.ta)) fail(`${s.t}: instruction_ta is not Tamil`);
  if (!/[஀-௿]/.test(s.ta)) fail(`${s.t}: step_title_ta is not Tamil`);
  if (!s.deva && !s.archana) fail(`${s.t}: has neither a mantra nor an archana list`);
  for (const [k, v] of [['meaning', s.m], ['philosophy', s.p], ['instruction_en', s.i.en]]) {
    if (/[ऀ-ॿ஀-௿]/.test(v)) fail(`${s.t}: ${k} carries Indic script`);
    if (/\bperformer\b/i.test(v)) fail(`${s.t}: ${k} says "performer"; this project says karta`);
  }
});

for (const mode of ALL) {
  const n = STEPS.filter((s) => s.modes.includes(mode)).length;
  console.log(`  ${mode.padEnd(13)} ${n} of ${STEPS.length} part-two steps`);
  if (n !== STEPS.length - 6) fail(`${mode}: ${n} steps, expected ${STEPS.length - 6}`);
}

console.log('--- part one Tamil backfill ---');
console.log(`  ${Object.keys(PART_ONE_TA).length} instructions`);
if (Object.keys(PART_ONE_TA).length !== FIRST) {
  fail(`part one has ${FIRST} steps but ${Object.keys(PART_ONE_TA).length} Tamil instructions`);
}
for (const [k, v] of Object.entries(PART_ONE_TA)) {
  if (!/[஀-௿]/.test(v)) fail(`part one "${k}": instruction_ta is not Tamil`);
}

console.log('--- corrections ---');
for (const f of FIXES) {
  console.log(`  ${f.wrong}  ->  ${f.right}   (${fixCounts[f.wrong]} applied)`);
  if (fixCounts[f.wrong] !== f.expect) {
    fail(`correction "${f.wrong}" applied ${fixCounts[f.wrong]} times, expected ${f.expect}`);
  }
}
if (JAPA_COUNTS.length !== 3) fail('the japa count table should have three rows');
if (SAMASHTI.length !== 5) fail(`samashti abhivadanam has ${SAMASHTI.length} salutations, expected 5`);
if (DIG.length !== 11) fail(`dig devata vandanam has ${DIG.length} salutations, expected 11`);
if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit --------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0049_sandhyavandanam_part_two.sql');
out('--');
out('-- GENERATED by scripts/build-sandhyavandanam-part-two.mjs. Do not hand-edit.');
out('--');
out(`-- The japa half, book pages 28 to 48: ${STEPS.length} steps from the Namaskara mantras`);
out('-- to the sprinkling of the place of japa, ending at the book\'s own colophon,');
out('-- iti trikaala sandhyaagaayatreejapavidhih. The rite is published here.');
out('--');
out('-- IT ALSO REPAIRS SOMETHING 0048 SHIPPED WITHOUT. All eighteen of part one\'s');
out('-- steps went in with instruction_ta empty. Every other pooja in this app has');
out('-- Tamil on every step, and proofread said so the moment 0048 was run. The');
out('-- lesson was already recorded in 0033 -- diff a new step\'s column set against');
out('-- an existing step of the SAME pooja, not against the schema -- and was there');
out('-- to be read. Backfilled here rather than in a file of its own, so the rite is');
out('-- whole in one place. The generator now refuses to emit a step without Tamil,');
out('-- which is the only change that stops it recurring.');
out('--');
out('-- TWO MORE MISPRINTS CORRECTED:');
for (const f of FIXES) {
  out('--');
  out(`--   ${f.wrong}  ->  ${f.right}`);
  for (const line of f.why.match(/.{1,72}(\s|$)/g)) out(`--   ${line.trim()}`);
}
out('--');
out('-- ABHIVADANAM IS PRINTED AS THE BOOK PRINTS IT, blanks and all. It is not a');
out('-- form the app fills in: the book sets the Apastamba sutra and the Yajus');
out('-- recension in type and leaves dotted rules for the pravaras, the gotra and');
out('-- the name, because whoever is reciting knows their own.');
out('-- =============================================================================');
out();
out('begin;');
out();
out('-- Part one\'s missing Tamil instructions. Keyed on the title, which is stable.');
for (const [title, ta] of Object.entries(PART_ONE_TA)) {
  out(`update public.pooja_steps set instruction_ta = ${q(ta)}, updated_at = now()`);
  out(` where pooja_id = ${q(POOJA)} and step_title_en = ${q(title)};`);
}
out();
out('-- Part two. Idempotent: these step numbers are replaced, part one is untouched.');
out(`delete from public.archana_items where pooja_step_id in (`);
out(`  select id from public.pooja_steps where pooja_id = ${q(POOJA)} and step_number > ${FIRST});`);
out(`delete from public.pooja_steps where pooja_id = ${q(POOJA)} and step_number > ${FIRST};`);
out();

STEPS.forEach((s, i) => {
  const n = FIRST + i + 1;
  const sc = s.deva ? scripts(s.deva) : { deva: null, ta: null, iast: null };
  out(`-- ${n}. ${s.t}`);
  out('insert into public.pooja_steps');
  out('  (pooja_id, step_number, phase, step_title_en, step_title_ta,');
  out('   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,');
  out('   meaning_en, philosophy_en, modes, gender_rule, scripts_generated, source_ref)');
  out('values');
  out(`  (${q(POOJA)}, ${n}, 'pradhana', ${q(s.t)}, ${q(s.ta)},`);
  out(`   ${q(s.i.en)},`);
  out(`   ${q(s.i.ta)},`);
  out(`   ${q(sc.deva)},`);
  out(`   ${q(sc.ta)},`);
  out(`   ${q(sc.iast)},`);
  out(`   ${q(s.m)},`);
  out(`   ${q(s.p)},`);
  out(`   ${arr(s.modes)}, 'all', true, ${q(SRC)});`);
  out();
  if (s.archana) {
    s.archana.forEach((a, j) => {
      out('insert into public.archana_items');
      out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit, offering_en)');
      out(`select id, ${j + 1}, ${q(a.deva)}, ${q(transliterate(S, a.deva, 'tamil'))}, ${q(transliterate(S, a.deva, 'iast'))}, ${q(a.dir)}`);
      out(`  from public.pooja_steps where pooja_id = ${q(POOJA)} and step_number = ${n};`);
    });
    out();
  }
});

out('-- The rite is whole. Publish it.');
out(`update public.poojas set status = 'published', updated_at = now() where id = ${q(POOJA)};`);
out();
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)};`);
out(`  if n <> ${FIRST + STEPS.length} then raise exception 'expected ${FIRST + STEPS.length} steps, found %', n; end if;`);
out();
out('  select count(*) into n from (');
out('    select step_number, row_number() over (order by step_number) as rn');
out(`      from public.pooja_steps where pooja_id = ${q(POOJA)}`);
out('  ) t where t.step_number <> t.rn;');
out("  if n > 0 then raise exception '% step(s) are not numbered 1..n', n; end if;");
out();
out('  -- EVERY step has Tamil now, part one included. This is the assertion 0048');
out('  -- should have carried.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and coalesce(trim(instruction_ta), '') = '';`);
out("  if n > 0 then raise exception '% step(s) still have no Tamil instruction', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and instruction_ta !~ '[஀-௿]';`);
out("  if n > 0 then raise exception '% Tamil instruction(s) carry no Tamil', n; end if;");
out();
out('  -- Every sitting walks the whole rite.');
for (const mode of ALL) {
  const cnt = 14 + STEPS.filter((s) => s.modes.includes(mode)).length;
  out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and ${q(mode)} = any(modes);`);
  out(`  if n <> ${cnt} then raise exception '${mode} has % steps, expected ${cnt}', n; end if;`);
}
out();
for (const f of FIXES) {
  out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and mantra_sanskrit like ${q('%' + f.wrong + '%')};`);
  out(`  if n > 0 then raise exception '% step(s) still carry the misprint ${f.wrong}', n; end if;`);
  out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and mantra_sanskrit like ${q('%' + f.right + '%')};`);
  out(`  if n < 1 then raise exception 'the correction ${f.right} is not present'; end if;`);
}
out();
out('  -- Dandas stripped: they belong in Tamil mantras. See 0048.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out(`     and translate(coalesce(mantra_tamil, ''), '।॥', '') ~ '[ऀ-ॿ\uA8E0-\uA8FF]';`);
out("  if n > 0 then raise exception '% Tamil mantra(s) carry Devanagari', n; end if;");
out();
out('  -- Published, and the planned-with-steps gate is satisfied.');
out(`  select count(*) into n from public.poojas where id = ${q(POOJA)} and status = 'published';`);
out("  if n <> 1 then raise exception 'sandhyavandanam was not published'; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0049_sandhyavandanam_part_two.sql', sql);
  console.log('\nwrote supabase/migrations/0049_sandhyavandanam_part_two.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
