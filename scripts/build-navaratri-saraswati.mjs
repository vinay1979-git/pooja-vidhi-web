#!/usr/bin/env node
/**
 * Navaratri Pooja and Saraswati Pooja, from the book.
 *
 *   node scripts/build-navaratri-saraswati.mjs          # validate
 *   node scripts/build-navaratri-saraswati.mjs --emit   # write the migration
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), section 10 "Navaratri Puja"
 * (pp.283-304) and section 11 "Sri Saraswati Puja" (pp.305-324), transcribed
 * page by page into G:\My Drive\Pooja Vidhi\extracted\transcripts\7-navaratri.
 *
 * TWO RITES, NOT ONE. Saraswati Pooja falls on the ninth day of Navaratri and
 * the Navaratri upacharas already name Saraswati, so it is tempting to fold it
 * in as a step. The book does not: it gives Saraswati her own section with its
 * own dhyanam, avahanam, upachara verses, anga pooja and 108 names, performed
 * over books and instruments on Navami and released on Vijayadashami. So the
 * app carries two rites as well.
 *
 * NOTHING HERE IS RETYPED. Every mantra is read out of the transcripts by book
 * page and block index, exactly as build-varalakshmi-follow-the-book.mjs does,
 * because a hundred lines retyped to move them thirty feet is how a
 * transcription that was checked against the page becomes one that was not.
 * The only Devanagari typed here is the shared purvangam the book itself sends
 * the reader back to (Manjal Pillaiyar, the sankalpam frame, Prana Pratishtha),
 * taken from the rows the app already carries for Varalakshmi.
 *
 * WHAT IS READ AS PRINTED, AND WHERE THE PRINT IS REPAIRED. The transcripts
 * copy misprints faithfully and flag them. Three are repaired on the way into
 * the app, each because the other script on the same page settles it:
 *
 *   Durga name 91 prints a broken font glyph, ओं प्राY यै. The roman on p.296
 *   reads praajnyai, so it is प्राज्ञ्यै.
 *   The Navaratri sankalpa prints लक्ष्मि short; the roman has lakSHmee and so
 *   does every other line in the section.
 *   The Saraswati avahana prints अवाहयामि short; its own heading and closing
 *   line have आवाहयामि.
 *
 * WHAT IS NOT REPAIRED. The Saraswati section addresses every upachara to
 * श्रीदुर्गा लक्ष्मी सरस्वती देव्यै, all three goddesses, though its verses and
 * its anga pooja speak to Saraswati alone. Both scripts agree on every page, so
 * it is the recension, not a slip, and it is kept.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/7-navaratri/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';
const NAV = 'navaratri_pooja';
const SAR = 'saraswati_pooja';
const GANESHA = 'ganesha_standard';
const MIGRATION = 'supabase/migrations/0055_navaratri_and_saraswati.sql';

// --- read the transcripts ---------------------------------------------------
const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  byPage[d.book_page] = d;
}

/**
 * One deva line, made fit to recite.
 *
 * The book sometimes sets the roman inline after a dash ("ओं भूर्भुवस्सुवः–Om
 * bhoorbhuvassuvaha"), tags a line (Morning) or (Offer water), and runs the
 * two columns of a list on one line. None of that is the mantra.
 */
function clean(line) {
  return line
    .replace(/\s*\((?:[A-Za-z][^)]*)\)\s*/g, ' ')    // (Morning), (Offer water)
    .replace(/\s*[–-]\s*[A-Za-z].*$/, '')           // – roman tail
    .replace(/\s+[A-Za-z][A-Za-z\s.,'|()]*$/, '')   // bare roman tail
    .replace(/[–-]\s*$/, '')
    .replace(/(\S)\s{2,}(\S)/g, '$1 $2')
    .replace(/ओं(?=\s|$)/g, 'ॐ')
    .trim();
}

/** The Devanagari of blocks on one page, cleaned, as lines. */
function D(page, ...idx) {
  const d = byPage[page];
  if (!d) throw new Error(`no transcript for book page ${page}`);
  return idx.flatMap((i) => {
    const b = d.blocks[i];
    if (!b) throw new Error(`p.${page} has no block ${i}`);
    if (b.type !== 'deva') throw new Error(`p.${page} block ${i} is ${b.type}, not deva`);
    return b.lines.map(clean).filter(Boolean);
  });
}
const join = (...parts) => parts.flat().join('\n');

function table(page, idx) {
  const b = byPage[page].blocks[idx];
  if (b.type !== 'table') throw new Error(`p.${page} block ${idx} is ${b.type}, not table`);
  return b.rows;
}
function namavali(type, ...pages) {
  return pages.flatMap((p) => byPage[p].blocks.filter((b) => b.type === type).flatMap((b) => b.names));
}

const tr = (deva, to) => transliterate(Sanscript, deva, to);
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

// --- shared purvangam -------------------------------------------------------

/** The book sends the reader back to its common section for these. */
const SHARED = [
  ['Achamanam', 'all'],
  ['Anga Vandanam', 'pre'],
  ['Vighneshwara Dhyanam', 'pre'],
  ['Pranayamam', 'pre'],
  ['Kalasha Pooja', 'pre'],
  ['Ghanta Pooja', 'all'],
];

const MANJAL_PILLAIYAR = join(
  'हरिद्राभं चतुर्बाहुं हरिद्रावदनं प्रभुम् ।',
  'पाशांकुशधरं देवं मोदकं दंतमेव च ।',
  'भक्ताऽभयप्रदातारं वंदे विघ्नविनाशनम् ।',
  'ॐ हरिद्रा गणपतये नमः ।',
  'अस्मिन् हरिद्राबिंबे श्रीमहागणपतिं आवाहयामि, स्थापयामि, पूजयामि ॥',
);

/**
 * The sankalpam, in the order the common section prints it: the resolve first,
 * then the cosmological frame, then the day (the app's panchangam slot), then
 * the household's purposes, then this rite's own clause from its first page.
 */
const SANKALPA_FRAME = join(
  'मम उपात्त समस्त दुरितक्षय द्वारा श्री परमेश्वर प्रीत्यर्थं',
  'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे',
  'वैवस्वत मन्वन्तरे अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे',
  'भरतवर्षे भरतखण्डे मेरोः दक्षिणे पार्श्वे अस्मिन् वर्तमाने व्यावहारिके',
  '[DYNAMIC_PANCHANGAM_DATA]',
  'अस्माकं सहकुटुम्बानां क्षेमस्थैर्यवीर्य-विजय-आयुरारोग्य ऐश्वर्याणां',
  'अभिवृद्ध्यर्थं, समस्त मङ्गलावाप्त्यर्थं, समस्त दुरितोपशान्त्यर्थं,',
);

/** The Vedic verse is shared; the closing names the deity being installed. */
const pranaPratishtha = (dative) => join(
  'ॐ असुनीते पुनरस्मासु चक्षुः',
  'पुनः प्राणमिह नो धेहि भोगम् ।',
  'ज्योक्पश्येम सूर्यमुच्चरन्त',
  'मनुमते मृडया नः स्वस्ति ।',
  'अमृतं वै प्राणा अमृतमापः',
  'प्राणानेव यथास्थानमुपह्वयते ॥',
  `${dative} नमः ।`,
  'आवाहिता भव स्थापिता भव ।',
  'सुप्रसन्ना भव वरदा भव ।',
  'स्थिरासनं कुरु प्रसीद प्रसीद ।',
);

// --- the 108 names -------------------------------------------------------------
const normName = (n) => {
  let s = n.replace(/^ओं\s*/, 'ॐ ').replace(/\s+/g, ' ').trim();
  if (!/नमः$/.test(s)) s += ' नमः';
  return s;
};

const DURGA_108 = namavali('namavali', '293', '294').map((n) =>
  // p.294 #91: a font glyph that did not render. The roman (p.296) reads it.
  n.includes('Y') ? 'ओं प्राज्ञ्यै' : n,
).map(normName);
const SARASWATI_108 = namavali('namavali', '315', '316').map(normName);
const DURGA_ROMAN = namavali('namavali_translit', '295', '296');
const SARASWATI_ROMAN = namavali('namavali_translit', '317', '318');

// --- archana lists -----------------------------------------------------------
const anga = (rows) => rows.map(([name, limb, en]) => ({
  name: normName(name.replace(/नमः$/, '').trim()),
  act: `${limb.trim()} पूजयामि`,
  en: `Worship the ${en.replace(/^\((.*)\)$/, '$1').trim()}`,
}));
const NAV_ANGA = anga([...table('291', 9), ...table('292', 1)]);
const SAR_ANGA = anga([...table('313', 5), ...table('314', 1)]);

/**
 * A two-column list, set row by row on the page. Which way it is read is not
 * printed, so it is decided by what the names are.
 *
 * The Navadurga are the nine forms in their fixed order, Shailaputri to
 * Siddhidatri, and the page holds that order down the left column and then
 * the right, with Siddhida alone on the last row. The nine kanyas are the
 * maidens of two to ten years, Kumari to Subhadra, and the page holds THAT
 * order across each row. Same layout, two reading orders: the content decides.
 */
const twoCol = (page, idx) => D(page, idx).map((l) => l.split(/(?<=नमः)\s+(?=ॐ)/));
const navadurgaRows = twoCol('300', 5);
const NAVADURGA = [
  ...navadurgaRows.slice(0, 4).map((r) => r[0]),
  ...navadurgaRows.slice(0, 4).map((r) => r[1]),
  navadurgaRows[4][0],
];
const NAVAKANYA = twoCol('302', 20).flat();

// --- steps --------------------------------------------------------------------
// modes: 'all' = every mode the rite has; 'pre' = the modes that open the full
// pooja (not the closing-day release).

const NAV_STEPS = [
  {
    title_en: 'Manjal Pillaiyar Pooja', title_ta: 'மஞ்சள் பிள்ளையார் பூஜை',
    phase: 'purvangam', modes: ['main', 'punar'],
    deva: MANJAL_PILLAIYAR,
    instruction_en: 'Shape a small cone of turmeric paste on a betel leaf and set it before the kalasham. Invoke Pillaiyar in it, offer akshatai and a flower, and ask that the nine days go without obstacle. On each of the following days the same turmeric Pillaiyar is worshipped again before the pooja begins.',
    instruction_ta: 'மஞ்சள் மாவை வெற்றிலையின் மேல் சிறு கூம்பாகப் பிடித்து கலசத்தின் முன் வைக்கவும். அதில் பிள்ளையாரை ஆவாஹனம் செய்து, அக்ஷதையும் புஷ்பமும் சமர்ப்பித்து, ஒன்பது நாட்களும் விக்கினமின்றி நடக்கும்படி வேண்டவும். அடுத்த நாட்களிலும் பூஜை தொடங்கும் முன் இதே மஞ்சள் பிள்ளையாரைப் பூஜிக்கவும்.',
    meaning_en: 'I salute the remover of obstacles: turmeric-coloured and turmeric-faced, four-armed, holding the noose, the goad, the modaka and his tusk, who gives fearlessness to his devotees. Salutations to Haridra Ganapati. I invoke, install and worship Sri Mahaganapati in this turmeric image.',
    philosophy_en: 'Nine nights is a long undertaking for a household, and it begins the way every undertaking here begins: with Ganesha asked to go first. He is made from a pinch of turmeric because the point is not the image but the asking.',
    src: 'Haridra Ganapati invocation, as carried by the app for Varalakshmi',
  },
  {
    title_en: 'Sankalpam', title_ta: 'ஸங்கல்பம்',
    phase: 'purvangam', modes: 'all', dynamic: true,
    deva: join(SANKALPA_FRAME,
      // p.286. The book prints लक्ष्मि short here only; its roman and every
      // other line in the section have लक्ष्मी.
      D('286', 4).map((l) => l.replace(/^\.+/, '').replace('लक्ष्मि', 'लक्ष्मी').replace(/,(?=\S)/g, ' '))),
    instruction_en: 'Take akshatai and a flower in the right hand and cover it with the left, resting both on the right thigh. Recite the day and place, then the resolve to worship Durga, Lakshmi and Saraswati. At the end, place the akshatai to the north and wash the hand. Say it again on every day of the nine.',
    instruction_ta: 'வலது கையில் அக்ஷதையும் புஷ்பமும் எடுத்து, இடது கையால் மூடி, வலது தொடையின் மேல் வைக்கவும். நாள், இடம் இவற்றைச் சொல்லி, துர்கா லக்ஷ்மீ ஸரஸ்வதீ பூஜை செய்வதாக ஸங்கல்பம் செய்யவும். முடிவில் அக்ஷதையை வடக்குப் பக்கம் போட்டுக் கையைக் கழுவவும். ஒன்பது நாட்களிலும் ஒவ்வொரு நாளும் இதைச் சொல்லவும்.',
    meaning_en: 'For the removal of all my wrongs and for the pleasure of the Supreme Lord: at this auspicious moment, in the present age, on this day so described, for the welfare, steadiness, strength, victory, long life, health and prosperity of ourselves and our household, for every auspicious thing and the quieting of every ill, and to win the grace of Sri Durga, Lakshmi and Saraswati, I shall perform the worship of Sri Durga, Lakshmi and Saraswati, and as part of it the worship of the kalasham.',
    philosophy_en: 'One resolve, three goddesses. Navaratri is often told as three nights each of Durga, Lakshmi and Saraswati, but the sankalpam names all three together every day: what is being asked for is protection, prosperity and understanding at once, because a household needs all three at once.',
    src: 'p.286 pradhana sankalpa; frame and purposes from the common purvanga, p.13',
  },
  {
    title_en: 'Dhyanam', title_ta: 'த்யானம்',
    phase: 'pradhana', modes: ['main'],
    deva: D('286', 9),
    instruction_en: 'With akshatai and flowers in the hand, close the eyes and hold the form of the Goddess in mind: the slayer of Mahisha, riding the lion, threatening the demons. Then ask her into the kalasham or the image, and offer the flowers and akshatai. This is done on the first day.',
    instruction_ta: 'கையில் அக்ஷதையும் புஷ்பமும் வைத்துக்கொண்டு, கண்களை மூடி தேவியின் வடிவத்தை மனதில் நிறுத்தவும் — மஹிஷனை வதைத்தவள், ஸிம்ஹ வாஹினி, அஸுரர்களை அதட்டுபவள். பின் கலசத்திலோ விக்ரஹத்திலோ எழுந்தருளும்படி அழைத்து புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும். இது முதல் நாளில் செய்யப்படுகிறது.',
    meaning_en: 'Slayer of Mahisha, great Goddess, maiden riding the lion, who threatens the demons, auspicious one who yields every wish: I meditate on Durga, dwelling at the centre of my being. Come, giver of boons, who throws down the pride of demons; accept this worship, gracious one, beloved of Shankara. This water holds every sacred river and every god: come into this vessel and stay with the hosts of gods, Goddess Durga, and make yourself present here. In this kalasham I meditate on Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Nabhimadhye vyavasthitam, "dwelling at the centre". The Goddess is first found within and only then asked into the pot. The kalasham does not bring her; it gives the worship somewhere to face.',
    src: 'p.286 dhyanam',
  },
  {
    title_en: 'Avahanam', title_ta: 'ஆவாஹனம்',
    phase: 'pradhana', modes: ['main'],
    deva: D('287', 3),
    instruction_en: 'Invite the Goddess with folded hands and offer flowers and akshatai at the kalasham or image.',
    instruction_ta: 'கைகூப்பி தேவியை எழுந்தருளச் செய்து, கலசத்திலோ விக்ரஹத்திலோ புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'Come, Durga, most blessed, to protect me always. I invoke you, Goddess, for the accomplishment of every aim. I invoke Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Raksharthm mama sarvada, "to protect me always". Durga is invited first as a protector. The other two are named after her, in the same breath, because nothing grows in a house that is not safe.',
    src: 'p.287 aavaahanam',
  },
  {
    title_en: 'Prana Pratishtha', title_ta: 'ப்ராண ப்ரதிஷ்டை',
    phase: 'pradhana', modes: ['main'],
    deva: pranaPratishtha('श्रीदुर्गा लक्ष्मी सरस्वती देव्यै'),
    instruction_en: 'Touch the kalasham or the image with the fingertips of the right hand and ask the life breath to settle in it. From now until Vijayadashami it is treated as present.',
    instruction_ta: 'வலது கை விரல் நுனிகளால் கலசத்தையோ விக்ரஹத்தையோ தொட்டு, உயிர்ப்பு அதில் நிலைபெறும்படி வேண்டவும். இனி விஜயதசமி வரை அது எழுந்தருளியிருப்பதாகவே கருதப்படுகிறது.',
    meaning_en: 'Asuniti, giver of breath: give us back sight and breath and the enjoyment of life, so that we may long see the sun rise; Anumati, be kind and keep us well. Breath and water are both immortal, and so the breaths are called each to its place. Salutations to Sri Durga, Lakshmi and Saraswati: be invoked, be installed, be pleased, grant boons, take a steady seat, be gracious.',
    philosophy_en: 'For nine days the kalasham is a guest who does not leave in the evening. Prana Pratishtha is what makes the daily pooja on the days that follow a visit to someone already in the house, rather than an invitation repeated each morning.',
    src: 'Prana pratishtha as the common section prescribes (step 18), feminine forms as carried for Varalakshmi',
  },
  {
    title_en: 'Asanam, Padyam, Arghyam & Achamaniyam', title_ta: 'ஆஸனம், பாத்யம், அர்க்யம் & ஆசமனீயம்',
    phase: 'pradhana', modes: ['main', 'punar'],
    deva: join(D('288', 1, 4, 7, 10), D('289', 0)),
    instruction_en: 'A seat first: offer flowers and akshatai. Then water for the feet, water for the hands with akshatai, sandal and a flower in it, and scented water to sip. Pour each from the uddharani into the plate.',
    instruction_ta: 'முதலில் ஆஸனம் — புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும். பின் பாதம் கழுவ ஜலம், அக்ஷதை சந்தனம் புஷ்பம் கலந்த அர்க்ய ஜலம், பருக வாசனை ஜலம். ஒவ்வொன்றையும் உத்தரிணியால் தாம்பாளத்தில் விடவும்.',
    meaning_en: 'Receive this divine golden seat, set with many jewels and gems. Water brought at my request from the Ganga and every holy river, pleasant to the touch: receive it for your feet. Among all treasures and jewels you are beyond price, Goddess seated on the lion: receive this arghyam, salutations to you. Cool, sweet water, fragrant with camphor: receive it to sip.',
    philosophy_en: 'Simhoparisthite, "seated on the lion". The verses never lose sight of who is being received: even the water for the hands is offered to the Goddess on her mount, not to an abstract presence.',
    src: 'pp.288-289',
  },
  {
    title_en: 'Snanam', title_ta: 'ஸ்நானம்',
    phase: 'pradhana', modes: ['main', 'punar'],
    deva: D('289', 3),
    instruction_en: 'Sprinkle water over the kalasham or image with a flower. If the image can be bathed, bathe it; a dressed kalasham is only sprinkled.',
    instruction_ta: 'புஷ்பத்தால் கலசத்தின் மேல் அல்லது விக்ரஹத்தின் மேல் ஜலம் தெளிக்கவும். விக்ரஹத்தை அபிஷேகம் செய்ய முடிந்தால் செய்யவும்; அலங்கரித்த கலசத்திற்கு ப்ரோக்ஷணம் மட்டும்.',
    meaning_en: 'Bathe, Queen of the gods, in fragrant water brought from the Mandakini and scented with golden lotuses.',
    philosophy_en: 'Mandakini is the Ganga as it flows in heaven. The water in the uddharani is whatever the tap gave this morning; the verse says what it is being treated as, and the treating is the rite.',
    src: 'p.289',
  },
  {
    title_en: 'Vastram & Upaveetam', title_ta: 'வஸ்த்ரம் & உபவீதம்',
    phase: 'pradhana', modes: ['main', 'punar'],
    deva: D('289', 6, 9),
    instruction_en: 'Offer a pair of new cloths with a blouse piece, or drape a cloth on the kalasham. Then offer the sacred thread, or akshatai in its place.',
    instruction_ta: 'ரவிக்கைத் துணியுடன் இரண்டு புதிய வஸ்திரங்களைச் சமர்ப்பிக்கவும், அல்லது கலசத்திற்கு ஒரு துணி சாற்றவும். பின் உபவீதம் — இல்லையெனில் அதற்குப் பதில் அக்ஷதை.',
    meaning_en: 'A pair of silk cloths with a bodice: put them on, Goddess, out of kindness, Durga who destroys misfortune. This divine thread of golden strands, made by Brahma long ago: accept the sacred thread I give, Supreme Goddess.',
    philosophy_en: 'Durgatinashini, "destroyer of misfortune", is a play on her name: Durga is the one who carries you across what is durga, hard to cross. The epithet turns up at the moment she is being dressed, as a guest is, for the days she is staying.',
    src: 'pp.289-290',
  },
  {
    title_en: 'Gandham, Mangala Dravyam & Abharanam', title_ta: 'கந்தம், மங்கள த்ரவ்யம் & ஆபரணம்',
    phase: 'pradhana', modes: ['main', 'punar'],
    deva: D('290', 2, 5, 8, 11, 14),
    instruction_en: 'Offer sandal paste, then turmeric, kumkumam and kanmai (kajal) one by one, then ornaments: a bangle, a chain, whatever the house sets aside for her.',
    instruction_ta: 'சந்தனம் சமர்ப்பித்து, பின் ஒவ்வொன்றாக மஞ்சள், குங்குமம், கண்மை சமர்ப்பிக்கவும்; பின் ஆபரணங்கள் — வளையல், சங்கிலி, அவளுக்கென்று வைத்திருப்பது எதுவோ அது.',
    meaning_en: 'Divine sandal paste, rich in fragrance and lovely: receive it as an ointment, Queen of the gods. Salutations to Sri Durga, Lakshmi and Saraswati: I offer the auspicious articles of a married woman, kumkumam, kajal and ornaments.',
    philosophy_en: 'Turmeric, kumkumam and kajal are saubhagya dravyas, the marks of a woman whose household is whole. They are offered to the Goddess for the same reason the sumangalis who visit during these nine days are given them on the way out.',
    src: 'p.290',
  },
  {
    title_en: 'Akshatai & Pushpam', title_ta: 'அக்ஷதை & புஷ்பம்',
    phase: 'pradhana', modes: ['main', 'punar'],
    deva: D('291', 0, 3),
    instruction_en: 'Offer akshatai, then a garland, then loose flowers.',
    instruction_ta: 'அக்ஷதை சமர்ப்பித்து, பின் மாலையும் உதிரிப் புஷ்பமும் சமர்ப்பிக்கவும்.',
    meaning_en: 'Unbroken grains, spotless and pure, set with pearls and gems: receive them, great Goddess, and give me a spotless mind. A garland made with lotus and other flowers of a hundred petals: I offer it, receive it, Queen of the gods.',
    philosophy_en: 'Dehi me nirmalam dhiyam, "give me a spotless mind". The one request tucked into the upacharas is not for wealth or safety but for clear thinking, which is Saraswati being asked for in the middle of a Durga verse.',
    src: 'p.291',
  },
  {
    title_en: 'Anga Pooja', title_ta: 'அங்க பூஜை',
    phase: 'pradhana', modes: ['main', 'punar'],
    archana: { rows: NAV_ANGA, expect: 18 },
    instruction_en: 'Eighteen names, each with a limb, from the feet up to the head and then the whole body. Offer a flower or a pinch of akshatai at each.',
    instruction_ta: 'பதினெட்டு நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்துடன், பாதம் முதல் சிரசு வரை, கடைசியில் முழு உடல். ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும்.',
    meaning_en: 'Eighteen names of the Goddess, each offered to a limb from the feet upward: Durga at the feet, Mahakali at the ankles, Kamalavasini at the navel, Maheshvari at the head, and Katyayani for the whole body.',
    philosophy_en: 'The names move between her fierce and gentle forms as they climb, Kali at the ankles and Kamalavasini, the lotus-dweller, at the navel. The anga pooja does not pick one aspect of the Goddess; it covers her from foot to head with all of them.',
    src: 'pp.291-292',
  },
  {
    title_en: 'Durga Ashtottara Shatanamavali', title_ta: 'துர்கா அஷ்டோத்தர ஶதநாமாவளி',
    phase: 'pradhana', modes: 'all', namavali_id: 'durga_ashtottara_108',
    instruction_en: 'Offer a flower or a pinch of akshatai at each of the hundred and eight names of Durga. On Vijayadashami these names are recited again before the Goddess is released.',
    instruction_ta: 'துர்கையின் நூற்றெட்டு நாமங்களில் ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும். விஜயதசமியன்று தேவியை யதாஸ்தானம் செய்வதற்கு முன் இந்த நாமங்கள் மீண்டும் சொல்லப்படுகின்றன.',
    meaning_en: 'One hundred and eight names of Durga, opening with Shri, Uma and Bharati and closing with Durgaparameshvari, the supreme Durga. Many are names of Lakshmi and Saraswati as well, which is the point of saying them at Navaratri.',
    philosophy_en: 'The list begins with shriyai, the name of Lakshmi, and keeps returning to names of learning and speech. A hundred and eight names of Durga turn out to hold all three goddesses of the sankalpam.',
    src: 'pp.293-296, count markers verified in both scripts',
  },
  {
    title_en: 'Lakshmi Ashtottara Shatanamavali', title_ta: 'லக்ஷ்மி அஷ்டோத்தர ஶதநாமாவளி',
    phase: 'pradhana', modes: ['main', 'punar'], namavali_id: 'lakshmi_ashtottara_108',
    instruction_en: 'The hundred and eight names of Lakshmi follow the names of Durga. Offer a flower or akshatai at each. On a short day this and the next list may be left for the middle three days, when Lakshmi is especially worshipped.',
    instruction_ta: 'துர்கா நாமங்களைத் தொடர்ந்து லக்ஷ்மியின் நூற்றெட்டு நாமங்கள். ஒவ்வொன்றிலும் புஷ்பமோ அக்ஷதையோ சமர்ப்பிக்கவும். நேரம் குறைவான நாளில், லக்ஷ்மிக்கு உரிய நடு மூன்று நாட்களுக்கு இதை விட்டு வைக்கலாம்.',
    meaning_en: 'One hundred and eight names of Lakshmi, beginning with Prakriti and Vikriti, nature and its transformation, and closing with Bhuvaneshvari, mistress of the worlds.',
    philosophy_en: 'The Durga list is followed by the lists of the other two goddesses the sankalpam named, so that each of the three is addressed by her own names as well as together.',
    src: 'p.296 rubric: Lakshmi ashtottaram, as carried for Varalakshmi',
  },
  {
    title_en: 'Saraswati Ashtottara Shatanamavali', title_ta: 'ஸரஸ்வதீ அஷ்டோத்தர ஶதநாமாவளி',
    phase: 'pradhana', modes: ['main', 'punar'], namavali_id: 'saraswati_ashtottara_108',
    instruction_en: 'Then the hundred and eight names of Saraswati, with a flower or akshatai at each. They are the same names said over the books on Saraswati Pooja.',
    instruction_ta: 'பின் ஸரஸ்வதியின் நூற்றெட்டு நாமங்கள், ஒவ்வொன்றிலும் புஷ்பமோ அக்ஷதையோ. ஸரஸ்வதீ பூஜையன்று புத்தகங்களின் மேல் சொல்லப்படும் அதே நாமங்கள் இவை.',
    meaning_en: 'One hundred and eight names of Saraswati, opening with Saraswati and Mahabhadra and closing with Brahmavishnushivatmika, she who is the self of Brahma, Vishnu and Shiva.',
    philosophy_en: 'The last of the three lists ends by naming her as the self of the whole trinity, which is a fitting place for a Navaratri archana to stop.',
    src: 'p.296 rubric: Saraswati ashtottaram, pp.315-318',
  },
  {
    title_en: 'Dhoopam & Deepam', title_ta: 'தூபம் & தீபம்',
    phase: 'uttara', modes: 'all',
    deva: D('297', 1, 4, 7),
    instruction_en: 'Light the incense and wave it before the Goddess, then wave the ghee lamp. Ring the bell through both, then offer a spoon of water.',
    instruction_ta: 'ஊதுபத்தியை ஏற்றி தேவியின் முன் காட்டவும், பின் நெய் தீபம் காட்டவும். இரண்டின் போதும் மணி அடிக்கவும்; பின் ஒரு ஸ்பூன் ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Incense of ten ingredients with guggulu, sandal and aloe, offered with devotion: receive it, great Goddess. A lamp with ghee and three wicks, of great brilliance and blaze: I give it to you, Queen of the gods; be pleased always. After incense and lamp, I offer water to sip.',
    philosophy_en: 'Trivarti, "three wicks". The lamp offered to the three goddesses has a wick for each of them, which is why a Navaratri lamp is so often a three-wick one.',
    src: 'p.297',
  },
  {
    title_en: 'Naivedyam & Tambulam', title_ta: 'நைவேத்யம் & தாம்பூலம்',
    phase: 'uttara', modes: 'all',
    deva: join(D('298', 2, 4, 7, 12, 14, 16), D('299', 2, 5, 8)),
    instruction_en: 'Set the food on a plate or a plantain leaf on a cleaned spot in front. Sprinkle water on it with the vyahritis, say the Gayatri, and circle water around it three times. Offer water as its bed, then gesture as if feeding at each svaha. Name the offering, water between, water to rinse, and finally betel leaves and areca nut sprinkled with water. In the evening the sprinkling line is said the other way round: ritam tva satyena parishinchami.',
    instruction_ta: 'சுத்தம் செய்த இடத்தில் தட்டிலோ வாழையிலையிலோ நைவேத்யத்தை வைக்கவும். வ்யாஹ்ருதிகளுடன் ஜலம் தெளித்து, காயத்ரீ சொல்லி, மூன்று முறை ஜலத்தால் சுற்றவும். அம்ருதோபஸ்தரணமாக ஜலம் விட்டு, ஒவ்வொரு ஸ்வாஹாவிற்கும் ஊட்டுவது போல் கை காட்டவும். நைவேத்யத்தைச் சொல்லி, நடுவில் ஜலம், பின் ஆசமனம், கடைசியில் ஜலம் தெளித்த வெற்றிலை பாக்கு. மாலையில் தெளிக்கும் வரி மாற்றிச் சொல்லப்படும்: ருதம் த்வா ஸத்யேன பரிஷிஞ்சாமி.',
    meaning_en: 'Om bhur bhuvah suvah. We meditate on the glorious light of the divine Savitr; may it inspire our minds. Divine Savitr, impel: I sprinkle you, truth, with order. You are the immortal bed. To the five breaths and to Brahman, hail. Food of four kinds, sweet and full of the six tastes: receive this offering, Goddess, and make my devotion unshakeable. Water between mouthfuls; water to rinse after the meal. A betel roll scented with cardamom, clove, musk and camphor, to sweeten the mouth: I offer it, Queen of the gods.',
    philosophy_en: 'Bhaktim me hyachalam kuru, "make my devotion unshakeable". The one thing asked in return for the meal is not a favour but steadiness, which over nine days of the same pooja is the thing most likely to run out.',
    src: 'pp.298-299',
  },
  {
    title_en: 'Pushpanjali', title_ta: 'புஷ்பாஞ்ஜலி',
    phase: 'uttara', modes: 'all',
    deva: D('299', 11),
    instruction_en: 'Take flowers and akshatai in both cupped hands, recite, and offer them at her feet. Everyone present may offer flowers.',
    instruction_ta: 'இரு கைகளையும் குவித்து புஷ்பமும் அக்ஷதையும் எடுத்து, ஸ்லோகம் சொல்லி அவள் பாதத்தில் சமர்ப்பிக்கவும். அங்கிருக்கும் அனைவரும் புஷ்பம் சமர்ப்பிக்கலாம்.',
    meaning_en: 'Mandara, parijata, patali and ketaki, jasmine and champaka: receive these flowers, radiant one.',
    philosophy_en: 'The only step of the pooja that is handed to everyone in the room. Navaratri is a household festival with guests coming and going, and the flowers are how the visitors take part in the worship rather than watching it.',
    src: 'p.299',
  },
  {
    title_en: 'Pradakshina & Namaskaram', title_ta: 'ப்ரதக்ஷிணம் & நமஸ்காரம்',
    phase: 'uttara', modes: 'all',
    deva: D('300', 0),
    instruction_en: 'Go round the Goddess clockwise with palms joined, or turn in place where you stand, then prostrate.',
    instruction_ta: 'கைகூப்பி தேவியை வலமாகச் சுற்றவும், அல்லது நின்ற இடத்திலேயே சுற்றவும்; பின் நமஸ்காரம் செய்யவும்.',
    meaning_en: 'Durga, remembered, you take away the fear of every creature; remembered by those at ease, you give them a mind more blessed still. Remover of poverty, sorrow and fear, who but you has a heart always soft with the wish to help everyone?',
    philosophy_en: 'This verse is from the Devi Mahatmyam, the text recited through Navaratri. Smrta, "remembered", carries it: she does not need to be summoned with ceremony, only remembered, and the circling is a way of keeping her at the centre while doing it.',
    src: 'p.300',
  },
  {
    title_en: 'Navadurga Pooja', title_ta: 'நவதுர்கா பூஜை',
    phase: 'uttara', modes: ['main', 'punar'],
    archana: { rows: NAVADURGA.map((n) => ({ name: n, act: null, en: 'Offer a flower' })), expect: 9, flowerTa: true },
    instruction_en: 'Offer a flower at each of the nine forms of Durga, from Shailaputri to Siddhidatri. On each day of Navaratri the form for that day may be honoured with an extra flower: Shailaputri on the first, Siddhidatri on the ninth.',
    instruction_ta: 'துர்கையின் ஒன்பது வடிவங்களுக்கும், ஶைலபுத்ரீ முதல் ஸித்திதாத்ரீ வரை, ஒவ்வொன்றிற்கும் ஒரு புஷ்பம் சமர்ப்பிக்கவும். நவராத்திரியின் ஒவ்வொரு நாளும் அந்நாளுக்கு உரிய வடிவத்திற்கு கூடுதலாக ஒரு புஷ்பம் சமர்ப்பிக்கலாம் — முதல் நாள் ஶைலபுத்ரீ, ஒன்பதாம் நாள் ஸித்திதாத்ரீ.',
    meaning_en: 'Salutations to the nine Durgas: Shailaputri, daughter of the mountain; Brahmacharini, the ascetic; Chandraghanta, crowned with the crescent; Kushmanda, who laughed the universe into being; Skandamata, mother of Skanda; Katyayani; Kalaratri, the night of time; Mahagauri, the radiant; and Siddhidatri, giver of attainment.',
    philosophy_en: 'The nine forms run in a line from a girl, the mountain\'s daughter, through the ascetic, the warrior and the mother, to the one who grants completion. Read in order they are a life, which is why there is one for each night.',
    src: 'p.300; two-column list read in the canonical order of the nine forms',
  },
  {
    title_en: 'Jyoti Pooja', title_ta: 'ஜ்யோதி பூஜை',
    phase: 'uttara', modes: ['main', 'punar'],
    deva: D('300', 10),
    instruction_en: 'Offer flowers and akshatai to the lamp itself. The lamp lit on the first day is kept burning, or lit afresh at each pooja, through all nine days.',
    instruction_ta: 'தீபத்திற்கே புஷ்பமும் அக்ஷதையும் சமர்ப்பிக்கவும். முதல் நாள் ஏற்றிய தீபம் ஒன்பது நாட்களும் அணையாமல் வைக்கப்படுகிறது, அல்லது ஒவ்வொரு பூஜையிலும் புதிதாக ஏற்றப்படுகிறது.',
    meaning_en: 'She who, by her own nature, is the reality behind the three worlds, their ground and all their variety; the Maya made manifest here by knowledge: may that supreme light protect the worlds always. Salutations to Sri Durga, Lakshmi and Saraswati, whose form is radiance.',
    philosophy_en: 'Tejassvarupa, "whose form is radiance". The lamp is not a light shown to the Goddess here; it is worshipped as her. That is why it is kept burning through the nine nights rather than lit and put out with each pooja.',
    src: 'pp.300-301',
  },
  {
    title_en: 'Prarthana', title_ta: 'ப்ரார்த்தனை',
    phase: 'uttara', modes: 'all',
    deva: D('301', 3),
    instruction_en: 'With joined hands, pray to the Goddess.',
    instruction_ta: 'கைகூப்பி தேவியைப் ப்ரார்த்திக்கவும்.',
    meaning_en: 'Auspiciousness of all that is auspicious, Shiva, fulfiller of every aim, refuge, three-eyed Gauri, Narayani: salutations to you. Give me beauty, give me fame, give me good fortune, Goddess; give me children, give me wealth, give me all that I desire.',
    philosophy_en: 'Sarvamangala mangalye is the best known verse of the Devi Mahatmyam and the plainest. After nine days of upacharas it simply asks, out loud, for what a household wants. There is no embarrassment in the asking.',
    src: 'p.301',
  },
  {
    title_en: 'Navakanya Pooja', title_ta: 'நவகன்யா பூஜை',
    phase: 'uttara', modes: ['main', 'punar'],
    deva: join(D('301', 7), D('302', 2, 4, 6, 8, 10, 12, 14, 16)),
    archana: { rows: NAVAKANYA.map((n) => ({ name: n, act: null, en: 'Offer a flower' })), expect: 9, flowerTa: true },
    instruction_en: 'Seat a girl under twelve, invoke the Goddess in her, and worship her with water for the feet and hands, a new cloth, sandal, turmeric and kumkumam, ornaments and flowers. Then offer a flower at each of the nine names. Usually one girl is honoured each day, or nine together on one day.',
    instruction_ta: 'பன்னிரண்டு வயதிற்குட்பட்ட ஒரு சிறுமியை அமர வைத்து, அவளிடம் தேவியை ஆவாஹனம் செய்து, பாத்யம், அர்க்யம், புது வஸ்திரம், சந்தனம், மஞ்சள் குங்குமம், ஆபரணம், புஷ்பம் சமர்ப்பித்துப் பூஜிக்கவும். பின் ஒன்பது நாமங்களுக்கும் ஒவ்வொரு புஷ்பம். பொதுவாக ஒவ்வொரு நாளும் ஒரு சிறுமி, அல்லது ஒரு நாளில் ஒன்பது பேர் சேர்ந்து.',
    meaning_en: 'Om klim, salutations to the maiden of the family. I invoke the maiden who is Lakshmi made of the letters of the mantra, who takes the form of the mothers, the nine Durgas in person. I offer water for the feet, water for the hands, water to sip, a cloth, sandal, turmeric and kumkumam, ornaments and flowers. Salutations to Kaumari, Tripura, Kalyani, Rohini, Kamini, Chandika, Shankari, Durga and Subhadra.',
    philosophy_en: 'Every other step of the pooja treats an image as the Goddess. This one treats a child as the Goddess, and gives her exactly the upacharas the kalasham received. It is the clearest statement in the whole festival of where the divine is supposed to be looked for.',
    src: 'pp.301-302; the nine names read in the order of the maidens\' ages, Kumari to Subhadra',
  },
  {
    title_en: 'Kanya Neerajanam & Prarthana', title_ta: 'கன்யா நீராஜனம் & ப்ரார்த்தனை',
    phase: 'uttara', modes: ['main', 'punar'],
    deva: D('303', 2, 4, 6, 8, 11, 14, 17),
    instruction_en: 'Show incense and a lamp to the girl, offer her food, then wave camphor, and pray. Send her home with tambulam, a blouse piece or a small gift.',
    instruction_ta: 'சிறுமிக்கு தூபம், தீபம் காட்டி, உணவு அளித்து, கற்பூர ஆரத்தி செய்து, ப்ரார்த்திக்கவும். தாம்பூலம், ரவிக்கைத் துணி அல்லது சிறு பரிசு கொடுத்து அனுப்பவும்.',
    meaning_en: 'I offer incense, I show the lamp, I offer food and water to rinse, I offer the camphor flame and water after it. Give me beauty, give me victory, give me fame, destroy my enemies, slayer of Mahisha, great Maya, Chamunda garlanded with skulls; give me long life, health and prosperity, Goddess: salutations to you. I offer my prayer.',
    philosophy_en: 'Rupam dehi jayam dehi yasho dehi dvisho jahi is the refrain of the Argala Stotram, said before the Devi Mahatmyam is read. It is said here to a child, which keeps the asking honest.',
    src: 'p.303',
  },
  {
    title_en: 'Punah Pooja & Yathasthanam', title_ta: 'புனர் பூஜை & யதாஸ்தானம்',
    phase: 'uttara', modes: ['udvasana'],
    deva: D('304', 2).map((l) => l.replace(/\s*नमस्कारान् समर्पयामि$/, '')).concat(['नमस्कारान् समर्पयामि']),
    instruction_en: 'On Vijayadashami, after reciting the hundred and eight names and offering incense, lamp, fruit and milk and camphor, pray, prostrate, and move the kalasham or image a little towards the north. The Goddess is sent home with an invitation to come back next year.',
    instruction_ta: 'விஜயதசமியன்று, அஷ்டோத்தரம் சொல்லி, தூபம், தீபம், பழம், பால், கற்பூரம் சமர்ப்பித்த பின், ப்ரார்த்தித்து நமஸ்கரித்து, கலசத்தையோ விக்ரஹத்தையோ வடக்குப் பக்கம் சிறிது நகர்த்தவும். அடுத்த ஆண்டு மீண்டும் வர அழைத்து தேவிக்கு விடை கொடுக்கப்படுகிறது.',
    meaning_en: 'Rise, Goddess, Chandeshi, having received this auspicious worship, and do me good together with your eight powers. Durga, Lakshmi and Vagdevi, worshipped, go to your own place, to return again when the year has passed. Take this worship I have offered as I was able, Goddess, for my protection, and go to your highest place. I return Sri Durga, Lakshmi and Saraswati to their places, for what is good, for well-being, and for coming again. I offer my prostrations.',
    philosophy_en: 'Samvatsare vyatite tu punaragamanaya, "to return when the year has passed". The release is worded as a farewell between people who will see each other again, which is why Vijayadashami is a day for beginning things rather than an ending.',
    src: 'p.304 punah pooja - yathaasthaanam',
  },
];

const SAR_STEPS = [
  {
    title_en: 'Manjal Pillaiyar Pooja', title_ta: 'மஞ்சள் பிள்ளையார் பூஜை',
    phase: 'purvangam', modes: ['main'],
    deva: MANJAL_PILLAIYAR,
    instruction_en: 'Shape a small cone of turmeric paste on a betel leaf and set it beside the books. Invoke Pillaiyar in it, offer akshatai and a flower, and ask him to clear the way before Saraswati is worshipped.',
    instruction_ta: 'மஞ்சள் மாவை வெற்றிலையின் மேல் சிறு கூம்பாகப் பிடித்து புத்தகங்களின் அருகில் வைக்கவும். அதில் பிள்ளையாரை ஆவாஹனம் செய்து, அக்ஷதையும் புஷ்பமும் சமர்ப்பித்து, ஸரஸ்வதீ பூஜைக்கு முன் வழி திறக்கும்படி வேண்டவும்.',
    meaning_en: 'I bow to the destroyer of obstacles, the four-armed lord with a turmeric face and turmeric hue, bearing noose, goad, modaka and tusk, who grants his devotees freedom from fear. Salutations to Haridra Ganapati; I invoke, install and worship Mahaganapati in this image of turmeric.',
    philosophy_en: 'Ganesha is the patron of letters too: he is the scribe who wrote down the Mahabharata. Asking him first before the books are worshipped is not only custom but fitting.',
    src: 'Haridra Ganapati invocation, as carried by the app for Varalakshmi',
  },
  {
    title_en: 'Sankalpam', title_ta: 'ஸங்கல்பம்',
    phase: 'purvangam', modes: 'all', dynamic: true,
    deva: join(SANKALPA_FRAME, D('307', 4).map((l) => l.replace(/^\.+/, ''))),
    instruction_en: 'Take akshatai and a flower in the right hand, cover it with the left and rest both on the right thigh. Recite the day and place and the resolve to worship Saraswati. Place the akshatai to the north and wash the hand.',
    instruction_ta: 'வலது கையில் அக்ஷதையும் புஷ்பமும் எடுத்து இடது கையால் மூடி வலது தொடையின் மேல் வைக்கவும். நாள், இடம், ஸரஸ்வதீ பூஜை செய்வதாக ஸங்கல்பம் சொல்லவும். அக்ஷதையை வடக்குப் பக்கம் போட்டுக் கையைக் கழுவவும்.',
    meaning_en: 'For the removal of all my wrongs and for the pleasure of the Supreme Lord: at this auspicious moment, on this day so described, for the welfare, strength, victory, long life, health and prosperity of ourselves and our household, for every auspicious thing and the quieting of every ill, and to win the gracious glance of Sri Saraswati, I shall perform, as prescribed and as far as I am able, the sixteen-fold worship of Saraswati beginning with meditation and invocation, and as part of it the worship of the kalasham.',
    philosophy_en: 'Kataksha siddhyartham, "to win her glance". The resolve does not ask Saraswati for knowledge outright. It asks to be looked at, on the understanding that learning follows from her attention the way a student\'s follows from a teacher\'s.',
    src: 'p.307 pradhana sankalpa; frame and purposes from the common purvanga, p.13',
  },
  {
    title_en: 'Dhyanam', title_ta: 'த்யானம்',
    phase: 'pradhana', modes: ['main'],
    deva: D('307', 9),
    instruction_en: 'Arrange the books, a picture of Saraswati and any musical instruments on a clean cloth. With flowers and akshatai in hand, hold her form in mind, then offer them at the books, the picture or the instruments.',
    instruction_ta: 'புத்தகங்கள், ஸரஸ்வதியின் படம், இசைக் கருவிகள் இவற்றை சுத்தமான துணியின் மேல் வைக்கவும். கையில் புஷ்பமும் அக்ஷதையும் வைத்து அவள் வடிவத்தை மனதில் நிறுத்தி, புத்தகங்களிலோ படத்திலோ கருவிகளிலோ சமர்ப்பிக்கவும்.',
    meaning_en: 'Saraswati, true in her garments, her body like the moon, holding in four hands a crystal rosary, a lotus, a book and a parrot; her face like the full moon, dear to all that has meaning, fond of playing the vina. In this circle of books, this picture, this circle of instruments, I meditate on Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Asmin pustaka mandale, chitrapate, vadyamandale: in the books, or the picture, or the instruments. The verse leaves the choice open because the Goddess of learning is worshipped in the tools of learning, whatever those are in a given house.',
    src: 'p.307 dhyanam',
  },
  {
    title_en: 'Avahanam', title_ta: 'ஆவாஹனம்',
    phase: 'pradhana', modes: ['main'],
    // p.308 prints अवाहयामि short; its heading and closing line have आवाहयामि.
    deva: D('308', 3).map((l) => l.replace(/^अवाहयामि/, 'आवाहयामि')),
    instruction_en: 'Invite the Goddess into the books, picture or instruments with folded hands, and offer flowers and akshatai.',
    instruction_ta: 'கைகூப்பி தேவியைப் புத்தகங்களிலோ படத்திலோ கருவிகளிலோ எழுந்தருளச் செய்து, புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'I hold in my heart Bharati, presiding goddess of all speech, held in the hearts of the good, consort of the Supreme Being; four-armed, moon-coloured, beloved of the four-faced Brahma. I invoke you, Vani, who destroy the distress of those who come to you. In this circle of books, picture or instruments, I invoke Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Bhashanam adhidevata, "presiding goddess of languages". She is invoked not over one sacred tongue but over speech itself, which makes a child\'s school notebook as fit a seat for her as a palm-leaf manuscript.',
    src: 'p.308 aavaahanam',
  },
  {
    title_en: 'Prana Pratishtha', title_ta: 'ப்ராண ப்ரதிஷ்டை',
    phase: 'pradhana', modes: ['main'],
    deva: pranaPratishtha('श्री सरस्वती देव्यै'),
    instruction_en: 'Touch the books or the picture with the fingertips of the right hand and ask the life breath to settle there. From now until Vijayadashami the books are not opened or read; they are the Goddess.',
    instruction_ta: 'வலது கை விரல் நுனிகளால் புத்தகங்களையோ படத்தையோ தொட்டு உயிர்ப்பு நிலைபெறும்படி வேண்டவும். இனி விஜயதசமி வரை புத்தகங்கள் திறக்கப்படுவதோ படிக்கப்படுவதோ இல்லை; அவை தேவியே.',
    meaning_en: 'Asuniti, restore to us our eyes, our breath and the joys of life, and let us look upon the rising sun for long; be gracious, Anumati, and bless us. The breaths are immortal, the waters are immortal; so the breaths are summoned each to its own place. Salutations to Sri Saraswati: be present, be established, be pleased, be bountiful, sit firm, be gracious.',
    philosophy_en: 'Once the books hold the Goddess they are not used, and that one day without study is the whole lesson: what is learnt is not a possession to be picked up at will, and on Vijayadashami it is received back as a gift.',
    src: 'Prana pratishtha as the common section prescribes (step 18), feminine forms as carried for Varalakshmi',
  },
  {
    title_en: 'Asanam, Padyam, Arghyam & Achamaniyam', title_ta: 'ஆஸனம், பாத்யம், அர்க்யம் & ஆசமனீயம்',
    phase: 'pradhana', modes: ['main'],
    deva: join(D('309', 1, 4, 7), D('310', 0)),
    instruction_en: 'Offer flowers and akshatai as the seat, then water for the feet, water for the hands with akshatai, sandal and a flower, and scented water to sip, each poured from the uddharani into the plate.',
    instruction_ta: 'ஆஸனமாக புஷ்பம் அக்ஷதை சமர்ப்பித்து, பின் பாத்யம், அக்ஷதை சந்தனம் புஷ்பம் கலந்த அர்க்யம், வாசனை ஆசமனீயம் — ஒவ்வொன்றையும் உத்தரிணியால் தாம்பாளத்தில் விடவும்.',
    meaning_en: 'Accept this seat, brought by all the sages, you who are measureless to the gods and the scourge of their enemies. I give water for the feet, Vani, giver of boons, worshipped by Indra, to her who has neither beginning nor end and is known by those who speak the Veda. Destroyer of sin, lovely one on the lotus seat, mother of all the worlds: accept this arghyam of eight ingredients. Take this water to sip, you who grant what is sought, who dwell in the face of the self-born Brahma and take away distress: salutations.',
    philosophy_en: 'Adyanta shunya, "without beginning or end". The verse for washing her feet stops to say that she has no beginning; the courtesy of a host and the philosophy of the Veda sit in the same line.',
    src: 'pp.309-310',
  },
  {
    title_en: 'Madhuparkam & Snanam', title_ta: 'மதுபர்க்கம் & ஸ்நானம்',
    phase: 'pradhana', modes: ['main'],
    deva: join(D('310', 3, 6, 9), D('311', 2)),
    instruction_en: 'Sprinkle three drops of milk, ghee, honey and curd mixed together, with a flower, as madhuparkam. Then offer panchamritam and clean water the same way, sprinkled rather than poured over the books, and a spoon of water to sip.',
    instruction_ta: 'பால், நெய், தேன், தயிர் கலந்த கலவையை புஷ்பத்தால் மூன்று துளி தெளித்து மதுபர்க்கம் சமர்ப்பிக்கவும். பின் பஞ்சாம்ருதமும் ஶுத்தோதகமும் அதே போல் — புத்தகங்களின் மேல் ஊற்றாமல் தெளித்து; பின் ஒரு ஸ்பூன் ஆசமனீயம்.',
    meaning_en: 'Accept this madhuparkam, you who are praised by Madhusudana, gently smiling great Goddess worshipped by Mahadeva. Accept this panchamritam of milk, curd and ghee, you who are worshipped by the five-faced Shiva and destroy the five great sins. Counted first among the virtuous, honoured by the assembly of the good: salutations to you, Saraswati; take your bath now. After the bath I offer water to sip.',
    philosophy_en: 'Madhuparkam is honey and curd given to an honoured guest, a teacher or a bridegroom. Offering it to the books treats them as both at once.',
    src: 'pp.310-311',
  },
  {
    title_en: 'Vastram & Upaveetam', title_ta: 'வஸ்த்ரம் & உபவீதம்',
    phase: 'pradhana', modes: ['main'],
    deva: D('311', 5, 8),
    instruction_en: 'Drape a new cloth over the books or offer a pair of cloths, then the sacred thread or akshatai in its place.',
    instruction_ta: 'புத்தகங்களின் மேல் புதுத் துணி போர்த்தவும் அல்லது இரண்டு வஸ்திரங்களைச் சமர்ப்பிக்கவும்; பின் உபவீதம் அல்லது அதற்குப் பதில் அக்ஷதை.',
    meaning_en: 'Accept this pair of fine cloths, Goddess whose splendour removes sin, dear to Brahma, auspicious one, like the ocean of nectar. Accept this sacred thread made of golden strands, queen of Hiranyagarbha, whose glory has no equal.',
    philosophy_en: 'Covering the books with a new cloth is how many houses close them for the day. The upachara and the household habit are the same act.',
    src: 'p.311',
  },
  {
    title_en: 'Gandham, Mangala Dravyam & Abharanam', title_ta: 'கந்தம், மங்கள த்ரவ்யம் & ஆபரணம்',
    phase: 'pradhana', modes: ['main'],
    deva: join(D('311', 11), D('312', 2, 5)),
    instruction_en: 'Apply sandal paste to the books, then a dot of turmeric and kumkumam and a touch of kajal, then offer ornaments.',
    instruction_ta: 'புத்தகங்களுக்கு சந்தனம் இட்டு, பின் மஞ்சள், குங்குமம், சிறிது கண்மை, பின் ஆபரணங்கள் சமர்ப்பிக்கவும்.',
    meaning_en: 'Accept this sandal of the finest fragrance, Vani, giver of boons, worshipped by the gandharvas, adored by the enemy of Andhaka. Kumkumam, kajal, sindoor, a bodice and all the auspicious things: accept them from me, Ambika, praised by the gods. Accept these ornaments for the ears and the rest, worked in gold and rich with gems from the ocean, you whose form is the letters.',
    philosophy_en: 'Varnarupe, "whose form is the letters". She is decorated as a goddess and addressed as the alphabet in the same verse, which is the most direct statement in the pooja of what is actually lying on the cloth.',
    src: 'pp.311-312',
  },
  {
    title_en: 'Akshatai & Pushpam', title_ta: 'அக்ஷதை & புஷ்பம்',
    phase: 'pradhana', modes: ['main'],
    deva: join(D('312', 8), D('313', 0)),
    instruction_en: 'Offer akshatai, then a garland and loose flowers. White flowers are preferred for Saraswati.',
    instruction_ta: 'அக்ஷதை சமர்ப்பித்து, பின் மாலையும் உதிரிப் புஷ்பமும். ஸரஸ்வதிக்கு வெண்மையான புஷ்பங்கள் சிறப்பு.',
    meaning_en: 'Accept these unbroken grains, you who are worshipped by the immortals, imperishable one rich in wondrous form, honoured by the king of the yakshas. Accept these punnaga, jasmine and other flowers, supreme one who grants the aims of life, whose lotus hand holds a book.',
    philosophy_en: 'Akshate, "imperishable one", over akshata, the unbroken grain. The pun is the point: learning is the one wealth that is not used up by being given away.',
    src: 'pp.312-313',
  },
  {
    title_en: 'Anga Pooja', title_ta: 'அங்க பூஜை',
    phase: 'pradhana', modes: ['main'],
    archana: { rows: SAR_ANGA, expect: 20 },
    instruction_en: 'Twenty names, each with a limb, from the feet up to the head and then the whole body. Offer a flower or a pinch of akshatai at each.',
    instruction_ta: 'இருபது நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்துடன், பாதம் முதல் சிரசு வரை, கடைசியில் முழு உடல். ஒவ்வொன்றிலும் புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும்.',
    meaning_en: 'Twenty names of Saraswati, each offered to a limb from the feet upward: Pavana at the feet, Jalajasana at the knees, Vagdevi at the face, Kala at the forehead, and Mahasaraswati for the whole body.',
    philosophy_en: 'Every name in this list belongs to Saraswati alone, unlike the upachara lines, which address all three goddesses. Here, touching the image limb by limb, the worship narrows to her.',
    src: 'pp.313-314',
  },
  {
    title_en: 'Saraswati Ashtottara Shatanamavali', title_ta: 'ஸரஸ்வதீ அஷ்டோத்தர ஶதநாமாவளி',
    phase: 'pradhana', modes: 'all', namavali_id: 'saraswati_ashtottara_108',
    instruction_en: 'Offer a flower or a pinch of akshatai at each of the hundred and eight names. On Vijayadashami the names are said again before the books are taken up.',
    instruction_ta: 'நூற்றெட்டு நாமங்களில் ஒவ்வொன்றிலும் புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும். விஜயதசமியன்று புத்தகங்களை எடுப்பதற்கு முன் இந்த நாமங்கள் மீண்டும் சொல்லப்படுகின்றன.',
    meaning_en: 'One hundred and eight names of Saraswati, from Saraswati, Mahabhadra and Mahamaya to Brahmavishnushivatmika. Three names, Mahabhadra, Vaishnavi and Vagdevi, occur twice in the list, as is usual for this ashtottaram.',
    philosophy_en: 'Many of the names are warrior names, Chandika and the slayer of Dhumralochana, alongside the names of speech and learning. Saraswati is not only the gentle figure with the vina; understanding is also what defeats what is false.',
    src: 'pp.315-318, count markers verified in both scripts',
  },
  {
    title_en: 'Dhoopam & Deepam', title_ta: 'தூபம் & தீபம்',
    phase: 'uttara', modes: 'all',
    deva: D('319', 1, 4, 7),
    instruction_en: 'Wave incense before the books and the picture, then the ghee lamp, ringing the bell, and offer a spoon of water.',
    instruction_ta: 'புத்தகங்களுக்கும் படத்திற்கும் ஊதுபத்தி காட்டி, பின் நெய் தீபம் காட்டவும், மணி அடித்தபடி; பின் ஒரு ஸ்பூன் ஜலம்.',
    meaning_en: 'Accept this incense with guggulu and aloe, offered with devotion, Queen of the gods, slayer of Dhumralochana, dear to Brahma. Accept the lamp lit with three wicks, Ambika, Vani, giver of boons, beloved of the lotus-seated one. After incense and lamp, I offer water to sip.',
    philosophy_en: 'Dhumralochana is the demon whose name means "smoke-eyed". He is slain in the verse offering incense smoke, which is the kind of joke these verses like to make.',
    src: 'p.319',
  },
  {
    title_en: 'Naivedyam & Tambulam', title_ta: 'நைவேத்யம் & தாம்பூலம்',
    phase: 'uttara', modes: 'all',
    deva: join(D('319', 12), D('320', 0, 3, 10, 14, 16), D('321', 3, 6, 9, 12)),
    instruction_en: 'Set the food on a plate or plantain leaf on a cleaned spot. Sprinkle it with the vyahritis, say the Gayatri, circle water around it, offer water beneath it, and gesture as if feeding at each svaha. Name the dishes, offer water between and after, then betel and areca nut. In the evening the sprinkling line is said the other way round: ritam tva satyena parishinchami.',
    instruction_ta: 'சுத்தம் செய்த இடத்தில் தட்டிலோ வாழையிலையிலோ நைவேத்யத்தை வைக்கவும். வ்யாஹ்ருதிகளுடன் தெளித்து, காயத்ரீ சொல்லி, ஜலத்தால் சுற்றி, அடியில் ஜலம் விட்டு, ஒவ்வொரு ஸ்வாஹாவிற்கும் ஊட்டுவது போல் கை காட்டவும். உணவுகளைச் சொல்லி, நடுவிலும் முடிவிலும் ஜலம், பின் வெற்றிலை பாக்கு. மாலையில் தெளிக்கும் வரி மாற்றிச் சொல்லப்படும்: ருதம் த்வா ஸத்யேன பரிஷிஞ்சாமி.',
    meaning_en: 'Om bhur bhuvah suvah; we meditate on the radiance of Savitr; may it inspire our minds. I sprinkle you with truth and order. To the five breaths and to Brahman, hail. Food of the six tastes with many dishes, and rice cooked in milk, I give with love: accept it. I offer cooked rice, payasam with ghee and jaggery, urad and jaggery cakes, laddu, two halves of a coconut and banana as the great offering. Water between and water to close. Betel leaves with areca nut and powdered camphor: accept this tambulam.',
    philosophy_en: 'The menu is named in the mantra itself: rice, payasam, two kinds of appam, laddu, coconut and banana. It is a festival meal, and the Goddess is fed it before anyone else in the house.',
    src: 'pp.319-321',
  },
  {
    title_en: 'Karpura Neerajanam', title_ta: 'கற்பூர நீராஜனம்',
    phase: 'uttara', modes: 'all',
    deva: join(D('321', 15), D('322', 2)),
    instruction_en: 'Light camphor and wave it three times clockwise before the books and the picture, ringing the bell, then offer a spoon of water.',
    instruction_ta: 'கற்பூரம் ஏற்றி புத்தகங்களுக்கும் படத்திற்கும் மூன்று முறை வலமாகச் சுற்றிக் காட்டவும், மணி அடித்தபடி; பின் ஒரு ஸ்பூன் ஜலம்.',
    meaning_en: 'With a thousand wicks and pieces of camphor I offer you this waving of light: accept it and grant boons. After the neerajanam I offer water to sip.',
    philosophy_en: 'Camphor burns away entirely and leaves nothing behind. Waved before the books, it is a picture of the hope that what is learnt is taken in completely.',
    src: 'pp.321-322',
  },
  {
    title_en: 'Mantra Pushpam & Pradakshina', title_ta: 'மந்த்ர புஷ்பம் & ப்ரதக்ஷிணம்',
    phase: 'uttara', modes: ['main'],
    deva: D('322', 5, 9),
    instruction_en: 'Offer flowers and akshatai with both hands; everyone present may offer. Then go round clockwise with palms joined, or turn in place.',
    instruction_ta: 'இரு கைகளாலும் புஷ்பமும் அக்ஷதையும் சமர்ப்பிக்கவும்; அனைவரும் சமர்ப்பிக்கலாம். பின் கைகூப்பி வலமாகச் சுற்றவும், அல்லது நின்ற இடத்தில் சுற்றவும்.',
    meaning_en: 'Salutations to Sri Durga, Lakshmi and Saraswati: I offer the mantra-flower. Whatever wrongs were done in past births, they are destroyed at every step of the circumambulation.',
    philosophy_en: 'Pade pade, "at every step". The going round is not a gesture made once at the end but a walk, and each step counts.',
    src: 'p.322',
  },
  {
    title_en: 'Rajopachara & Prarthana', title_ta: 'ராஜோபசாரம் & ப்ரார்த்தனை',
    phase: 'uttara', modes: 'all',
    deva: D('322', 12, 15),
    instruction_en: 'Offer akshatai in place of the royal honours, then pray with joined hands.',
    instruction_ta: 'ராஜோபசாரங்களுக்குப் பதிலாக அக்ஷதை சமர்ப்பித்து, கைகூப்பி ப்ரார்த்திக்கவும்.',
    meaning_en: 'In place of the parasol, the fan, dance, song and music and all the royal honours, I offer akshatai. She who is white as the jasmine, the moon, frost and a pearl necklace, robed in white, whose hands are graced by the vina and the staff of boons, seated on the white lotus, ever worshipped by Brahma, Vishnu, Shiva and the gods: may that Goddess Saraswati, who removes all dullness, protect me.',
    philosophy_en: 'Nihshesha jadyapaha, "who removes dullness without remainder". The best known Saraswati verse asks for one thing only, to be rid of jadya, the heaviness of a mind that does not move. Every student in the house knows it by heart for that reason.',
    src: 'p.322',
  },
  {
    title_en: 'Kshama Prarthana', title_ta: 'க்ஷமா ப்ரார்த்தனை',
    phase: 'uttara', modes: 'all',
    deva: D('323', 0, 5),
    instruction_en: 'Ask the Goddess to forgive whatever was lacking in the pooja, and offer the act itself.',
    instruction_ta: 'பூஜையில் ஏற்பட்ட குறைகளை மன்னிக்கும்படி தேவியை வேண்டி, செய்த கர்மத்தை அர்ப்பணிக்கவும்.',
    meaning_en: 'Lacking in mantra, lacking in rite, lacking in devotion, Saraswati: whatever I have worshipped, Goddess, let it be complete for you. By this worship may Sri Durga, Lakshmi and Saraswati be pleased. Om tat sat, let it be offered to Brahman.',
    philosophy_en: 'A student asks forgiveness of a teacher for mistakes not yet noticed. The verse makes the same request of the Goddess of learning, on the reasonable assumption that the pooja, like any recitation, was imperfect.',
    src: 'p.323',
  },
  {
    title_en: 'Upayana Danam', title_ta: 'உபாயன தானம்',
    phase: 'uttara', modes: ['main'],
    deva: join(D('323', 9), D('324', 0)),
    instruction_en: 'Prostrate before the priest or an elder of the house, seek their blessing, and give them fruit, tambulam and some money with these words, after offering a seat, sandal and akshatai.',
    instruction_ta: 'புரோஹிதரையோ வீட்டுப் பெரியவரையோ நமஸ்கரித்து ஆசி பெற்று, ஆஸனம், சந்தனம், அக்ஷதை அளித்து, பழம், தாம்பூலம், தக்ஷிணை இவற்றை இந்த வாக்கியத்துடன் கொடுக்கவும்.',
    meaning_en: 'This seat, this sandal, and all worship are for the brahmana who is Saraswati in person. The golden seed within the womb of fire yields endless merit: so grant me peace. This gift with dakshina and tambulam, for the full fruit of the Saraswati pooja, I give to you, the brahmana who is Saraswati in person; it is no longer mine.',
    philosophy_en: 'Saraswati svarupa, "who is Saraswati in person". The gift goes to the teacher, the elder, the one who knows, as the Goddess of learning standing in the room. Na mama, "not mine", is how it is let go.',
    src: 'pp.323-324',
  },
  {
    title_en: 'Punah Pooja & Yathasthanam', title_ta: 'புனர் பூஜை & யதாஸ்தானம்',
    phase: 'uttara', modes: ['udvasana'],
    deva: D('324', 5),
    instruction_en: 'On Vijayadashami, after the names, incense, lamp, fruit and milk and camphor, offer flowers and akshatai and move the books a little towards the north. Then take them up and read a little from each: this is the day learning begins again, and new learning is begun.',
    instruction_ta: 'விஜயதசமியன்று, நாமாவளி, தூபம், தீபம், பழம், பால், கற்பூரம் இவற்றிற்குப் பின், புஷ்பம் அக்ஷதை சமர்ப்பித்து புத்தகங்களை வடக்குப் பக்கம் சிறிது நகர்த்தவும். பின் அவற்றை எடுத்து ஒவ்வொன்றிலும் சிறிது படிக்கவும் — இன்று படிப்பு மீண்டும் தொடங்கும் நாள், புதிய கல்வி ஆரம்பிக்கும் நாள்.',
    meaning_en: 'I return Sri Durga, Lakshmi and Saraswati to their places, for what is good, for well-being, and for coming again.',
    philosophy_en: 'The books go back into use the moment the Goddess is released from them. Vidyarambham, the first letters written by a child, is done on this same morning for that reason: learning that starts on Vijayadashami starts with her blessing still in the books.',
    src: 'p.324 punah pooja - yathaasthaanam',
  },
];

// --- samagri and naivedyam ----------------------------------------------------
const NAV_SAMAGRI = [
  ['Kalasham (pot) with water, mango leaves and a coconut, or an image or picture of Devi', 'கலசம் (மாவிலை, தேங்காய்) அல்லது தேவியின் விக்ரஹம் அல்லது படம்', '1', 'core'],
  ['Golu: a set of dolls on stepped shelves, if the house keeps a golu', 'கொலு படிகளும் பொம்மைகளும் (வழக்கம் இருந்தால்)', null, 'core'],
  ['Pancha pathram and uddharani (water vessel and spoon)', 'பஞ்ச பாத்திரம் & உத்தரிணி', '1 set', 'vessel'],
  ['Plates (thambalam)', 'தாம்பாளம்', '2 to 3', 'vessel'],
  ['Mani (pooja bell)', 'மணி', '1', 'vessel'],
  ['Kuthuvilakku (oil lamp) with ghee or oil and cotton wicks', 'குத்துவிளக்கு, நெய் அல்லது எண்ணெய், திரி', '1', 'vessel'],
  ['Akshatai (rice with turmeric)', 'அக்ஷதை', null, 'offering'],
  ['Manjal (turmeric) powder and kumkumam (vermilion)', 'மஞ்சள் தூள் & குங்குமம்', null, 'offering'],
  ['Chandanam (sandalwood paste)', 'சந்தனம்', null, 'offering'],
  ['Kanmai (kajal, black eye paste)', 'கண்மை', null, 'offering'],
  ['New cloth or blouse piece for the Goddess', 'தேவிக்கு புது வஸ்திரம் அல்லது ரவிக்கைத் துணி', '1', 'offering'],
  ['Udiri pushpam (loose flowers) and a garland', 'உதிரி புஷ்பம் & மாலை', null, 'flower'],
  ['Agarbatti and karpooram (incense sticks and camphor)', 'ஊதுபத்தி & கற்பூரம்', null, 'offering'],
  ['Vetrilai and paakku (betel leaves and areca nut)', 'வெற்றிலை & பாக்கு', null, 'offering'],
  ['Fruits and banana', 'பழங்கள் & வாழைப்பழம்', null, 'offering'],
  ['Tambulam for visiting sumangalis: betel, turmeric, kumkumam, a blouse piece, mirror, comb and bangles, one set each', 'சுமங்கலிகளுக்குத் தாம்பூலம்: வெற்றிலை, மஞ்சள், குங்குமம், ரவிக்கைத் துணி, கண்ணாடி, சீப்பு, வளையல்', 'one set per guest', 'offering'],
];
const SAR_SAMAGRI = [
  ['Books, notebooks and pens to be worshipped, on a clean cloth', 'பூஜைக்கான புத்தகங்கள், நோட்டுப் புத்தகங்கள், பேனாக்கள் — சுத்தமான துணியின் மேல்', null, 'core'],
  ['Picture or image of Saraswati', 'ஸரஸ்வதியின் படம் அல்லது விக்ரஹம்', '1', 'core'],
  ['Musical instruments, tools of work, if any (veena, set of tools)', 'இசைக் கருவிகள், தொழில் கருவிகள் (இருந்தால்)', null, 'core'],
  ['Kalasham (pot) with water and mango leaves', 'கலசம் (மாவிலையுடன்)', '1', 'core'],
  ['Pancha pathram and uddharani (water vessel and spoon)', 'பஞ்ச பாத்திரம் & உத்தரிணி', '1 set', 'vessel'],
  ['Plates (thambalam)', 'தாம்பாளம்', '2 to 3', 'vessel'],
  ['Mani (pooja bell)', 'மணி', '1', 'vessel'],
  ['Kuthuvilakku (oil lamp) with ghee and cotton wicks', 'குத்துவிளக்கு, நெய், திரி', '1', 'vessel'],
  ['Milk, curd, ghee and honey for madhuparkam and panchamritam', 'மதுபர்க்கம் & பஞ்சாம்ருதத்திற்கு பால், தயிர், நெய், தேன்', 'a little of each', 'offering'],
  ['Akshatai (rice with turmeric)', 'அக்ஷதை', null, 'offering'],
  ['Manjal (turmeric) powder, kumkumam (vermilion) and kanmai (kajal paste)', 'மஞ்சள் தூள், குங்குமம், கண்மை', null, 'offering'],
  ['Chandanam (sandalwood paste)', 'சந்தனம்', null, 'offering'],
  ['New cloth to cover the books', 'புத்தகங்களுக்குப் போர்த்த புதுத் துணி', '1', 'offering'],
  ['White flowers, loose and a garland (jasmine, white lotus)', 'வெண்மையான புஷ்பங்கள் & மாலை (மல்லிகை, வெண்தாமரை)', null, 'flower'],
  ['Agarbatti and karpooram (incense sticks and camphor)', 'ஊதுபத்தி & கற்பூரம்', null, 'offering'],
  ['Vetrilai and paakku (betel leaves and areca nut)', 'வெற்றிலை & பாக்கு', null, 'offering'],
  ['Fruit, tambulam and dakshina for the upayana danam', 'உபாயன தானத்திற்கு பழம், தாம்பூலம், தக்ஷிணை', null, 'offering'],
];

const NAV_NAIVEDYAM = [
  ['primary', 'Sundal', 'சுண்டல்', 'Boiled pulses tempered with mustard, curry leaves and grated coconut. A different pulse each day: chickpea, green gram, peanut, black-eyed pea and so on.', 'கடுகு, கறிவேப்பிலை, தேங்காய்த் துருவலுடன் தாளித்த வேகவைத்த பயறு. நாள்தோறும் வேறு பயறு: கொண்டைக்கடலை, பாசிப்பயறு, வேர்க்கடலை, காராமணி முதலியன.'],
  ['primary', 'Payasam', 'பாயசம்', 'Rice or vermicelli cooked in milk and sweetened.', 'பாலில் வேகவைத்து இனிப்பு சேர்த்த அரிசி அல்லது சேமியா.'],
  ['secondary', 'Annam', 'அன்னம்', 'Plain cooked rice, with the day\'s meal.', null],
  ['secondary', 'Fruits with banana', 'பழங்கள் & வாழைப்பழம்', null, null],
  ['secondary', 'Milk', 'பால்', 'Offered with fruit on Vijayadashami.', 'விஜயதசமியன்று பழத்துடன் சமர்ப்பிக்கப்படுகிறது.'],
];
const SAR_NAIVEDYAM = [
  ['primary', 'Payasam with ghee and jaggery', 'நெய், வெல்லம் சேர்த்த பாயசம்', 'Rice cooked in milk, sweetened with jaggery and finished with ghee.', 'பாலில் வேகவைத்த அரிசி, வெல்லம் சேர்த்து நெய் விட்டது.'],
  ['primary', 'Annam', 'அன்னம்', 'Plain cooked rice.', 'வெறும் சாதம்.'],
  ['secondary', 'Vadai', 'வடை', 'Fried urad dal cakes.', 'உளுந்து வடை.'],
  ['secondary', 'Appam or adhirasam', 'அப்பம் அல்லது அதிரசம்', 'Rice flour and jaggery cakes.', 'அரிசி மாவும் வெல்லமும் சேர்த்த பணியாரம்.'],
  ['secondary', 'Laddu', 'லட்டு', null, null],
  ['secondary', 'Coconut, two halves', 'தேங்காய் (இரண்டு மூடி)', null, null],
  ['secondary', 'Banana', 'வாழைப்பழம்', null, null],
];

// --- the rites ------------------------------------------------------------------
const RITES = [
  {
    id: NAV, steps: NAV_STEPS, samagri: NAV_SAMAGRI, naivedyam: NAV_NAIVEDYAM,
    title_en: 'Navaratri Pooja', title_ta: 'நவராத்திரி பூஜை',
    ritual_class: 'deity_pooja', deity_id: 'navaratri_devi',
    duration: 75, karta: null,
    description_en: 'The nine nights of the Goddess in Purattasi, from the new moon to Navami, worshipped as Durga, Lakshmi and Saraswati together. The kalasham is installed on the first day, worshipped each day with the hundred and eight names, the nine Durgas and a kanya pooja, and released on Vijayadashami.',
    description_ta: 'புரட்டாசி அமாவாசைக்குப் பின் பிரதமை முதல் நவமி வரை தேவியின் ஒன்பது இரவுகள் — துர்கா, லக்ஷ்மீ, ஸரஸ்வதீ மூவரையும் சேர்த்து வழிபடுவது. முதல் நாள் கலசம் ப்ரதிஷ்டை செய்யப்பட்டு, நாள்தோறும் அஷ்டோத்தரம், நவதுர்கா, கன்யா பூஜையுடன் வழிபட்டு, விஜயதசமியன்று யதாஸ்தானம் செய்யப்படுகிறது.',
    rule: { type: 'tithi_in_month', month: 'ashvina', reckoning: 'chandra', paksha: 'shukla', tithi: 'prathama', notes: 'Begins on Ashvina shukla prathama, the day after the Mahalaya new moon, in Purattasi or Aippasi of the solar year, and runs nine nights to Navami. Vijayadashami, the tenth day, is the release. If all nine days are not possible, keep at least the last three: Saptami, Ashtami and Navami.' },
    modes: [
      ['main', 'First Day', 'முதல் நாள்', 'Prathama. Full vidhi: the kalasham is invoked and installed.', 'பிரதமை. முழு விதி: கலசம் ஆவாஹனம் செய்து ப்ரதிஷ்டை செய்யப்படுகிறது.'],
      ['punar', 'Days 2 to 9', 'இரண்டு முதல் ஒன்பதாம் நாள் வரை', 'The daily pooja. The Goddess is already installed.', 'தினசரி பூஜை. தேவி ஏற்கனவே ப்ரதிஷ்டை செய்யப்பட்டுள்ளாள்.'],
      ['udvasana', 'Vijayadashami', 'விஜயதசமி', 'The tenth day. Names, offerings and the release.', 'பத்தாம் நாள். நாமாவளி, உபசாரம், யதாஸ்தானம்.'],
    ],
    why_en: 'The Goddess is worshipped for nine nights because the story behind them takes nine nights: in the Devi Mahatmyam, the gods could not defeat Mahishasura, and the Goddess who arose from their combined power fought him until she won on the tenth day, Vijayadashami, the day of victory. The household keeps those nights by worshipping her as three: Durga, who protects; Lakshmi, who provides; and Saraswati, who gives understanding, often three nights each. It is a festival of welcome as much as of worship. A golu of dolls is set up, sumangalis and young girls are invited, fed and sent home with turmeric, kumkumam and a gift, because the Goddess is honoured in them too. On the tenth day she is asked to return next year, and new things are begun.',
    why_ta: 'தேவி ஒன்பது இரவுகள் வழிபடப்படுவதற்குக் காரணம், அதன் பின்னுள்ள கதை ஒன்பது இரவுகள் நீடிப்பதே: தேவீ மாஹாத்மியத்தில், தேவர்களால் வெல்ல முடியாத மஹிஷாஸுரனை, அவர்களின் சக்திகள் ஒன்றுசேர்ந்து தோன்றிய தேவி எதிர்த்துப் போரிட்டு, பத்தாம் நாளான விஜயதசமியன்று வென்றாள். வீட்டில் அந்த இரவுகளை தேவியை மூவராக வழிபட்டு அனுஷ்டிக்கிறோம் — காக்கும் துர்கை, அருளும் லக்ஷ்மி, அறிவு தரும் ஸரஸ்வதி — பெரும்பாலும் ஒவ்வொருவருக்கும் மூன்று இரவுகள். இது வழிபாட்டுத் திருவிழா மட்டுமல்ல, வரவேற்புத் திருவிழாவும் கூட. கொலு வைக்கப்படுகிறது; சுமங்கலிகளும் சிறுமிகளும் அழைக்கப்பட்டு, உணவளிக்கப்பட்டு, மஞ்சள், குங்குமம், பரிசுடன் அனுப்பப்படுகிறார்கள் — அவர்களிடமும் தேவி வழிபடப்படுகிறாள். பத்தாம் நாள் அடுத்த ஆண்டு மீண்டும் வரும்படி அவளை வேண்டி, புதிய காரியங்கள் தொடங்கப்படுகின்றன.',
  },
  {
    id: SAR, steps: SAR_STEPS, samagri: SAR_SAMAGRI, naivedyam: SAR_NAIVEDYAM,
    title_en: 'Saraswati Pooja', title_ta: 'ஸரஸ்வதீ பூஜை',
    ritual_class: 'deity_pooja', deity_id: 'saraswati',
    duration: 60, karta: null,
    description_en: 'The worship of Saraswati on Mahanavami, the ninth day of Navaratri, performed over books, musical instruments and the tools of one\'s work. They are left untouched for the day and taken up again on Vijayadashami, when new learning is begun.',
    description_ta: 'நவராத்திரியின் ஒன்பதாம் நாளான மஹாநவமியன்று புத்தகங்கள், இசைக் கருவிகள், தொழில் கருவிகள் இவற்றின் மேல் ஸரஸ்வதியை வழிபடுவது. அன்று அவை தொடப்படுவதில்லை; விஜயதசமியன்று மீண்டும் எடுக்கப்பட்டு புதிய கல்வி தொடங்கப்படுகிறது.',
    rule: { type: 'tithi_in_month', month: 'ashvina', reckoning: 'chandra', paksha: 'shukla', tithi: 'navami', notes: 'Mahanavami, Ashvina shukla navami, the ninth day of Navaratri. The books are released and taken up on Vijayadashami, the next morning.' },
    modes: [
      ['main', 'Navami Pooja', 'நவமி பூஜை', 'Mahanavami. Full vidhi over the books and instruments.', 'மஹாநவமி. புத்தகங்கள், கருவிகளின் மேல் முழு விதி.'],
      ['udvasana', 'Vijayadashami', 'விஜயதசமி', 'The next morning. Names, offerings, and the books taken up again.', 'மறுநாள் காலை. நாமாவளி, உபசாரம், புத்தகங்களை மீண்டும் எடுத்தல்.'],
    ],
    why_en: 'Knowledge is what makes a person more than their circumstances, and the tradition gives that knowledge a face: Saraswati, the goddess of speech, learning and the arts. The story told for this day is of King Suketu, driven from his kingdom, whose queen was told by the sage Angiras to worship Saraswati on Navami; their son Suryaprabha grew up mastering every art and won the kingdom back. So on the ninth day of Navaratri the books, instruments and tools of the house are laid down and worshipped as the Goddess, and for one day nobody studies or works with them. The next morning, Vijayadashami, they are taken up again, children write their first letters, and whatever is begun is begun with her blessing.',
    why_ta: 'ஒருவரை அவர் சூழ்நிலைக்கு மேல் உயர்த்துவது அறிவு; அந்த அறிவுக்கு மரபு ஒரு வடிவம் தருகிறது — வாக்கு, கல்வி, கலைகளின் தேவியான ஸரஸ்வதி. இந்நாளுக்குச் சொல்லப்படும் கதை, ராஜ்யத்தை இழந்த ஸுகேது மன்னனுடையது: அங்கிரஸ முனிவர் சொன்னபடி அவன் நவமியன்று ஸரஸ்வதியை வழிபட, அவர்களின் மகன் ஸூர்யப்ரபன் எல்லாக் கலைகளிலும் தேர்ந்து ராஜ்யத்தை மீட்டான். எனவே நவராத்திரியின் ஒன்பதாம் நாள் வீட்டின் புத்தகங்கள், கருவிகள், தொழில் சாதனங்கள் அனைத்தும் தேவியாக வைத்து வழிபடப்படுகின்றன; அன்று யாரும் அவற்றைக் கொண்டு படிப்பதோ வேலை செய்வதோ இல்லை. மறுநாள் விஜயதசமியன்று அவை மீண்டும் எடுக்கப்படுகின்றன, குழந்தைகள் முதல் எழுத்துகளை எழுதுகிறார்கள், தொடங்குவது எதுவும் அவள் ஆசியுடன் தொடங்குகிறது.',
  },
];

// D() hands back lines; a step stores one string with a newline per line.
for (const s of [...NAV_STEPS, ...SAR_STEPS]) if (Array.isArray(s.deva)) s.deva = s.deva.join('\n');

// --- validate -------------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };
const DEVA = /[\u0900-\u097F]/;

console.log('--- the 108 names, both lists against their roman witnesses ---');
for (const [label, list, roman] of [['Durga', DURGA_108, DURGA_ROMAN], ['Saraswati', SARASWATI_108, SARASWATI_ROMAN]]) {
  if (list.length !== 108) fail(`${label}: ${list.length} Devanagari names, expected 108`);
  if (roman.length !== 108) fail(`${label}: ${roman.length} roman names, expected 108`);
  for (const [i, n] of list.entries()) {
    if (/[A-Za-z]/.test(n)) fail(`${label} ${i + 1}: Latin in ${n}`);
    if (!/^ॐ \S/.test(n)) fail(`${label} ${i + 1}: does not open with ॐ: ${n}`);
  }
  const dupes = list.filter((n, i) => list.indexOf(n) !== i);
  console.log(`  ${label}: ${list.length} names, ${dupes.length} repeated (${dupes.join(', ') || 'none'}); #1 ${list[0]}, #108 ${list[107]}`);
}

console.log('\n--- archana lists ---');
for (const [label, rows, n] of [['Navaratri anga', NAV_ANGA, 18], ['Saraswati anga', SAR_ANGA, 20], ['Navadurga', NAVADURGA, 9], ['Navakanya', NAVAKANYA, 9]]) {
  if (rows.length !== n) fail(`${label}: ${rows.length} rows, expected ${n}`);
  console.log(`  ${label}: ${rows.length}`);
}
if (!/शैलपुत्र/.test(NAVADURGA[0]) || !/सिद्धिदा/.test(NAVADURGA[8])) fail('Navadurga order is not Shailaputri .. Siddhidatri');
if (!/कौमार्यै/.test(NAVAKANYA[0]) || !/सुभद्रायै/.test(NAVAKANYA[8])) fail('Navakanya order is not Kaumari .. Subhadra');

console.log('\n--- steps ---');
for (const rite of RITES) {
  const titles = new Set();
  for (const s of rite.steps) {
    const at = `${rite.id}/${s.title_en}`;
    if (titles.has(s.title_en)) fail(`${at}: title repeats`);
    titles.add(s.title_en);
    for (const f of ['title_en', 'title_ta', 'instruction_en', 'instruction_ta', 'meaning_en', 'philosophy_en', 'src']) {
      if (!s[f] || !String(s[f]).trim()) fail(`${at}: ${f} is empty`);
    }
    if (s.title_en.length > 60 || s.title_ta.length > 60) fail(`${at}: title too long`);
    if (/\b(the book|this book|the edition)\b/i.test(`${s.instruction_en} ${s.meaning_en} ${s.philosophy_en}`)) fail(`${at}: cites the source`);
    if (s.deva != null) {
      if (!DEVA.test(s.deva)) fail(`${at}: mantra is not Devanagari`);
      if (/[A-Za-z]/.test(s.deva.replace('[DYNAMIC_PANCHANGAM_DATA]', ''))) fail(`${at}: Latin left in the mantra: ${s.deva.match(/.*[A-Za-z].*/)[0]}`);
      if (/\.\.\.|…/.test(s.deva)) fail(`${at}: ellipsis in the mantra`);
      const ta = tr(s.deva, 'tamil');
      const strip = (x) => x.replace(/[।॥–,()]/g, '');
      if (DEVA.test(strip(ta).replace('[DYNAMIC_PANCHANGAM_DATA]', ''))) fail(`${at}: Devanagari leaked into Tamil`);
      if (DEVA.test(strip(tr(s.deva, 'iast')))) fail(`${at}: Devanagari leaked into IAST`);
    } else if (!s.archana && !s.namavali_id) {
      fail(`${at}: has no mantra, archana or namavali`);
    }
  }
  const modeSet = new Set(rite.modes.map((m) => m[0]));
  console.log(`  ${rite.id}: ${rite.steps.length + SHARED.length} steps (${SHARED.length} shared), modes ${[...modeSet].join('/')}`);
}

if (process.argv.includes('--show')) {
  for (const rite of RITES) for (const s of rite.steps) {
    console.log(`\n### ${rite.id} / ${s.title_en}`);
    if (s.deva) console.log(s.deva);
    if (s.archana) for (const r of s.archana.rows) console.log(`  ${r.name} | ${r.act ?? ''}`);
  }
}

if (failed) { console.error('\nvalidation FAILED; nothing written'); process.exit(1); }
console.log('\nvalidation passed');
if (!process.argv.includes('--emit')) { console.log('(no SQL written; pass --emit)'); process.exit(0); }

// --- emit -----------------------------------------------------------------------
const out = [];
const o = (s) => out.push(s);

o(`-- Navaratri Pooja and Saraswati Pooja, from the book.
-- Generated by scripts/build-navaratri-saraswati.mjs; do not edit by hand.
--
-- Source: ${BOOK}, sections 10 and 11, pp.283-324, transcribed page by page.
-- Two rites, as the source has them. Every mantra is read from the page
-- transcripts by book page and block; see the script header for the three
-- print repairs and the one feature of the source deliberately kept.

begin;

-- --- deities --------------------------------------------------------------------
insert into public.deities (id, name_en, name_deva, name_ta, name_dative_deva, class, dhyana_sloka_deva, avahana_deva)
values
  ('navaratri_devi', 'Durga, Lakshmi and Saraswati', 'श्रीदुर्गा लक्ष्मी सरस्वती', ${q(tr('श्रीदुर्गा लक्ष्मी सरस्वती', 'tamil'))},
   'श्रीदुर्गा लक्ष्मी सरस्वती देव्यै', 'goddess', ${q(join(D('286', 9)))}, ${q(join(D('287', 3)))}),
  ('saraswati', 'Saraswati', 'सरस्वती', ${q(tr('सरस्वती', 'tamil'))},
   'श्री सरस्वती देव्यै', 'goddess', ${q(join(D('307', 9)))}, ${q(join(D('308', 3)))})
on conflict (id) do update set
  name_en = excluded.name_en, name_deva = excluded.name_deva, name_ta = excluded.name_ta,
  name_dative_deva = excluded.name_dative_deva,
  dhyana_sloka_deva = excluded.dhyana_sloka_deva, avahana_deva = excluded.avahana_deva,
  updated_at = now();
`);

for (const r of RITES) {
  o(`-- --- ${r.title_en} ------------------------------------------------------------
insert into public.poojas
  (id, title_en, title_ta, ritual_class, deity_id, description_en, description_ta,
   duration_mins, eligibility, rule_type, rule_month, rule_reckoning, rule_paksha,
   rule_tithi, rule_notes, source_ref, karta_recommended, status, why_en, why_ta)
values (${q(r.id)}, ${q(r.title_en)}, ${q(r.title_ta)}, ${q(r.ritual_class)}, ${q(r.deity_id)},
        ${q(r.description_en)},
        ${q(r.description_ta)},
        ${r.duration}, 'all', ${q(r.rule.type)}, ${q(r.rule.month)}, ${q(r.rule.reckoning)}, ${q(r.rule.paksha)},
        ${q(r.rule.tithi)}, ${q(r.rule.notes)}, ${q(`${BOOK}, ${r.id === NAV ? 'pp.283-304' : 'pp.305-324'}`)},
        ${q(r.karta)}, 'published',
        ${q(r.why_en)},
        ${q(r.why_ta)})
on conflict (id) do update set
  title_en = excluded.title_en, title_ta = excluded.title_ta,
  ritual_class = excluded.ritual_class, deity_id = excluded.deity_id,
  description_en = excluded.description_en, description_ta = excluded.description_ta,
  duration_mins = excluded.duration_mins, eligibility = excluded.eligibility,
  rule_type = excluded.rule_type, rule_month = excluded.rule_month,
  rule_reckoning = excluded.rule_reckoning, rule_paksha = excluded.rule_paksha,
  rule_tithi = excluded.rule_tithi, rule_notes = excluded.rule_notes,
  source_ref = excluded.source_ref, karta_recommended = excluded.karta_recommended,
  status = excluded.status, why_en = excluded.why_en, why_ta = excluded.why_ta,
  updated_at = now();
`);
  o('insert into public.pooja_modes (pooja_id, mode, seq, label_en, label_ta, hint_en, hint_ta) values');
  o(r.modes.map(([m, le, lt, he, ht], i) => `  (${q(r.id)}, ${q(m)}, ${i + 1}, ${q(le)}, ${q(lt)}, ${q(he)}, ${q(ht)})`).join(',\n'));
  o(`on conflict (pooja_id, mode) do update set
  seq = excluded.seq, label_en = excluded.label_en, label_ta = excluded.label_ta,
  hint_en = excluded.hint_en, hint_ta = excluded.hint_ta, updated_at = now();
delete from public.pooja_modes where pooja_id = ${q(r.id)} and mode not in (${r.modes.map((m) => q(m[0])).join(', ')});
`);
}

// --- namavalis
for (const [id, deity, list, recension, src] of [
  ['durga_ashtottara_108', 'navaratri_devi', DURGA_108, 'Opens shriyai, umayai, bharatyai; closes durgaparameshvaryai.', `${BOOK}, pp.293-296; count markers verified in both scripts; name 91 read from the roman, the Devanagari glyph being unprinted`],
  ['saraswati_ashtottara_108', 'saraswati', SARASWATI_108, 'Opens sarasvatyai, mahabhadrayai, mahamayayai; closes brahmavishnushivatmikayai. Mahabhadra, Vaishnavi and Vagdevi each occur twice.', `${BOOK}, pp.315-318; count markers verified in both scripts`],
]) {
  o(`insert into public.namavalis (id, deity_id, recension, name_count, source_ref)
values (${q(id)}, ${q(deity)}, ${q(recension)}, 108, ${q(src)})
on conflict (id) do update set deity_id = excluded.deity_id, recension = excluded.recension, source_ref = excluded.source_ref;
insert into public.namavali_items (namavali_id, seq, name_deva, name_ta, name_translit) values`);
  o(list.map((n, i) => `  (${q(id)}, ${i + 1}, ${q(n)}, ${q(tr(n, 'tamil'))}, ${q(tr(n, 'iast'))})`).join(',\n'));
  o(`on conflict (namavali_id, seq) do update set
  name_deva = excluded.name_deva, name_ta = excluded.name_ta, name_translit = excluded.name_translit;
delete from public.namavali_items where namavali_id = ${q(id)} and seq > 108;
`);
}

// --- steps
for (const r of RITES) {
  const allModes = r.modes.map((m) => m[0]);
  const preModes = allModes.filter((m) => m !== 'udvasana');
  const resolve = (m) => (m === 'all' ? allModes : m === 'pre' ? preModes : m);
  const pg = (m) => `'{${resolve(m).join(',')}}'`;

  // Order: Achamanam .. Pranayamam (shared), Manjal Pillaiyar, Sankalpam,
  // Kalasha, Ghanta (shared), then the rite's own from Dhyanam on.
  const own = r.steps;
  const order = [
    { shared: 'Achamanam' }, { shared: 'Anga Vandanam' }, { shared: 'Vighneshwara Dhyanam' }, { shared: 'Pranayamam' },
    own[0], own[1],
    { shared: 'Kalasha Pooja' }, { shared: 'Ghanta Pooja' },
    ...own.slice(2),
  ];

  o(`-- --- ${r.title_en}: ${order.length} steps --------------------------------------
-- Re-runnable: the rite's steps are replaced wholesale. Archana rows go with
-- them by cascade.
delete from public.pooja_steps where pooja_id = ${q(r.id)};
`);
  order.forEach((s, i) => {
    const n = i + 1;
    if (s.shared) {
      const modes = SHARED.find(([t]) => t === s.shared)[1];
      o(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   meaning_en, philosophy_en, philosophy_ta, gender_rule, variant_mantra_sanskrit,
   variant_note_en, is_dynamic_sankalpam, scripts_generated, source_ref)
select ${q(r.id)}, ${n}, phase, ${pg(modes)}, step_title_en, step_title_ta,
       instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
       meaning_en, philosophy_en, philosophy_ta, gender_rule, variant_mantra_sanskrit,
       variant_note_en, false, scripts_generated,
       coalesce(source_ref || '; ', '') || 'shared purvangam, copied from ${GANESHA}'
  from public.pooja_steps
 where pooja_id = ${q(GANESHA)} and step_title_en = ${q(s.shared)};
`);
      return;
    }
    o(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   meaning_en, philosophy_en, gender_rule, scripts_generated, is_dynamic_sankalpam,
   namavali_id, source_ref)
values (${q(r.id)}, ${n}, ${q(s.phase)}, ${pg(s.modes)}, ${q(s.title_en)}, ${q(s.title_ta)},
        ${q(s.instruction_en)},
        ${q(s.instruction_ta)},
        ${q(s.deva ?? null)},
        ${q(s.deva ? tr(s.deva, 'tamil') : null)},
        ${q(s.deva ? tr(s.deva, 'iast') : null)},
        ${q(s.meaning_en)},
        ${q(s.philosophy_en)}, 'all', true, ${s.dynamic ? 'true' : 'false'},
        ${q(s.namavali_id ?? null)}, ${q(`${BOOK}, ${s.src}`)});
`);
    if (s.archana) {
      const ref = `(select id from public.pooja_steps where pooja_id = ${q(r.id)} and step_number = ${n})`;
      o(`insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,
   offering_deva, offering_en, offering_ta)
values`);
      o(s.archana.rows.map((a, j) => `  (${ref}, ${j + 1}, ${q(a.name)}, ${q(tr(a.name, 'tamil'))}, ${q(tr(a.name, 'iast'))}, ` +
        `${q(a.act)}, ${q(a.en)}, ${q(a.act ? tr(a.act, 'tamil') : 'புஷ்பம் சமர்ப்பிக்கவும்')})`).join(',\n') + ';\n');
    }
  });

  // samagri and naivedyam
  o(`delete from public.samagri_items where pooja_id = ${q(r.id)};
insert into public.samagri_items (pooja_id, seq, item_en, item_ta, quantity, category, is_required, is_substitutable, substitute_with) values`);
  o(r.samagri.map(([en, ta, qty, cat], i) => `  (${q(r.id)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(qty)}, ${q(cat)}, ${cat === 'core' && !/if /.test(en)}, false, null)`).join(',\n') + ';\n');
  const tiers = {};
  o(`delete from public.naivedyam_items where pooja_id = ${q(r.id)};
insert into public.naivedyam_items (pooja_id, tier, seq, name_en, name_ta, recipe_note, recipe_note_ta) values`);
  o(r.naivedyam.map(([tier, en, ta, note, noteTa]) => {
    tiers[tier] = (tiers[tier] ?? 0) + 1;
    return `  (${q(r.id)}, ${q(tier)}, ${tiers[tier]}, ${q(en)}, ${q(ta)}, ${q(note)}, ${q(noteTa)})`;
  }).join(',\n') + ';\n');
}

o('commit;');
o(`
-- Verify:
--   select pooja_id, count(*) from pooja_steps where pooja_id in ('${NAV}', '${SAR}') group by 1;
--   select namavali_id, count(*) from namavali_items where namavali_id in ('durga_ashtottara_108', 'saraswati_ashtottara_108') group by 1;  -- 108 each`);

emitMigration(MIGRATION, out.join('\n'));
