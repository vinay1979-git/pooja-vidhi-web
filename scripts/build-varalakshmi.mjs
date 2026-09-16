#!/usr/bin/env node
/**
 * Builds the Varalakshmi Vratham from scratch.
 *
 *   node scripts/build-varalakshmi.mjs --emit > supabase/migrations/0011_varalakshmi.sql
 *
 * SEQUENCE comes from Sathya Vadyar's step-by-step video, whose chapter list is
 * in docs/sources.md and was re-read from YouTube to confirm it. Twenty-nine
 * steps map onto his twenty-one ritual chapters; the extra eight are the
 * purvangam he performs before the recording's first chapter and the pairs he
 * runs together in one chapter (padyam/arghyam/achamaniyam, and so on).
 *
 * MANTRAS come from StotraNidhi's Varalakshmi Vrata Kalpam, extracted and
 * script-converted by scripts/parse-varalakshmi-kalpam.mjs, which proves every
 * line survives Telugu -> Devanagari -> Telugu before it will write anything.
 *
 * THE VRATA KATHA IS DELIBERATELY ABSENT. The kalpam carries it; the video has
 * no katha chapter, and the video is the authority for what a Tamil household
 * performs. Confirmed against the video's own chapter list.
 *
 * SHARED STEPS. Achamanam, Anga Vandanam, Vighneshwara Dhyanam, Pranayamam,
 * Kalasha Pooja and Ghanta Pooja are deity-independent and are copied from the
 * Ganesha pooja rather than retyped, by SQL that reads the existing rows. That
 * is the composition model the schema was built for, and the kalpam states it
 * outright: it opens by telling you to do the purvangam and the turmeric
 * Ganapati pooja first, and links to them instead of reprinting them.
 */

import { readFileSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const K = JSON.parse(readFileSync(DIR + 'kalpam.json', 'utf8'));
const NAMAVALI = JSON.parse(readFileSync(DIR + 'parsed.json', 'utf8'));

const POOJA = 'varalakshmi_vratham';
const GANESHA = 'ganesha_standard';
const KALPAM = 'StotraNidhi Sri Varalakshmi Vrata Kalpam (Telugu), round-trip verified by scripts/parse-varalakshmi-kalpam.mjs';
const VIDEO = 'Sathya Vadyar, Varalakshmi Poojai 2026 step by step';

// ---------------------------------------------------------------------------
const MISPLACED = /([க-ஹ])([ா-்]*)([ரல])([ா-்]*)([²³⁴])/g;
const fixSup = (t) => {
  let prev; let cur = t;
  do { prev = cur; cur = cur.replace(MISPLACED, '$1$2$5$3$4'); } while (cur !== prev);
  return cur;
};
const tidyTa = (t) => t.replace(/[௃௄]/g, '').replace(/ஃ/g, '꞉').replace(/'/g, '');
const PROTECTED = /(\[[A-Z0-9_]+\]|[।॥])/;
const tr = (text, to) =>
  String(text).split(PROTECTED).map((p) => {
    if (p === '' || PROTECTED.test(p)) return p;
    const d = Sanscript.t(p, 'devanagari', to);
    return to === 'tamil' ? tidyTa(fixSup(d)) : d;
  }).join('');
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

/** Pull one or more kalpam sections as a single mantra block. */
const kalpam = (...keys) => keys.map((k) => K[k].deva).join('\n');
/** Drop the trailing "... samarpayami" bookkeeping line from a section. */
const verseOnly = (key) =>
  K[key].deva.split('\n').filter((l) => !/समर्पयामि\s*॥?$|पूजयामि\s*॥?$|ध्यायामि\s*॥?$/.test(l)).join('\n');

// ---------------------------------------------------------------------------
// steps, in the order the video performs them
// ---------------------------------------------------------------------------

// Copied verbatim from the Ganesha pooja at migration time. Nothing in these is
// Ganesha-specific; they are the Smartha purvangam.
const SHARED = [
  ['Achamanam', 1, ['main', 'punar', 'udvasana']],
  ['Anga Vandanam', 2, ['main', 'punar']],
  ['Vighneshwara Dhyanam', 3, ['main', 'punar']],
  ['Pranayamam', 4, ['main', 'punar']],
  ['Kalasha Pooja', 7, ['main', 'punar']],
  ['Ghanta Pooja', 8, ['main', 'punar', 'udvasana']],
];

const STEPS = [
  {
    n: 5,
    title_en: 'Manjal Pillaiyar Pooja',
    title_ta: 'மஞ்சள் பிள்ளையார் பூஜை',
    phase: 'purvangam',
    modes: ['main', 'punar'],
    instruction_en:
      'Roll a small cone of turmeric paste on a betel leaf. That is the Pillaiyar for today. Invoke him, offer akshatai and a flower, and ask him to clear the way before the main pooja begins. He is not immersed or kept; at the end of the vratham he is set aside with the rest of the offerings.',
    instruction_ta:
      'மஞ்சள் மாவை வெற்றிலையின் மேல் சிறு கூம்பாகப் பிடிக்கவும். அதுவே இன்றைய பிள்ளையார். அவரை ஆவாஹனம் செய்து, அக்ஷதையும் புஷ்பமும் சமர்ப்பித்து, பிரதான பூஜை தொடங்கும் முன் விக்கினங்களை நீக்கும்படி வேண்டவும். இவரை கரைப்பதோ வைத்திருப்பதோ இல்லை; விரதம் முடிந்தபின் மற்ற சமர்ப்பணங்களுடன் சேர்த்து எடுத்து வைக்கப்படுகிறார்.',
    deva:
      'हरिद्राभं चतुर्बाहुं हरिद्रावदनं प्रभुम् । ' +
      'पाशांकुशधरं देवं मोदकं दंतमेव च । ' +
      'भक्ताऽभयप्रदातारं वंदे विघ्नविनाशनम् । ' +
      'ॐ हरिद्रा गणपतये नमः । ' +
      'अस्मिन् हरिद्राबिंबे श्रीमहागणपतिं आवाहयामि, स्थापयामि, पूजयामि ॥',
    philosophy_en:
      'Every pooja in this tradition opens by asking Ganesha to move first. Making him out of turmeric rather than fetching a metal idol is the point: the obstacle-remover is made from what is already on the kitchen shelf, in the minute before he is needed.',
    source_ref: `StotraNidhi Sri Haridra Ganapati Puja (Telugu); ${VIDEO}, chapter at 04:02. The full published vidhi also carries Vedic mantras with svara marks, which this app does not yet render and which are omitted here rather than shown unaccented.`,
  },
  {
    n: 6,
    title_en: 'Sankalpam',
    title_ta: 'ஸங்கல்பம்',
    phase: 'purvangam',
    modes: ['main', 'punar', 'udvasana'],
    dynamic: true,
    instruction_en:
      'Hold water in the right palm. State the day by the panchangam, then the intention: this is done for the household, for its wellbeing and for good fortune, addressing Varalakshmi. Release the water at the end.',
    instruction_ta:
      'வலது உள்ளங்கையில் ஜலம் எடுக்கவும். பஞ்சாங்கப்படி இன்றைய நாளைச் சொல்லி, பின் சங்கல்பத்தைச் சொல்லவும் — இது குடும்பத்தின் க்ஷேமத்திற்காகவும் சௌபாக்யத்திற்காகவும், வரலக்ஷ்மியை உத்தேசித்துச் செய்யப்படுகிறது. முடிவில் ஜலத்தை விடவும்.',
    deva:
      'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे वैवस्वत मन्वन्तरे ' +
      'अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे भरत वर्षे भरत खण्डे ' +
      '[DYNAMIC_PANCHANGAM_DATA] ' +
      kalpam('sankalpam'),
    philosophy_en:
      'The sankalpam is the only place the pooja is dated, located and addressed. Everything after it is the same on any Friday; this sentence is what makes it today. Note who it is for: asmakam sahakutumbanam, ourselves together with the household, not the individual reciting it.',
    source_ref: `${KALPAM}; ${VIDEO}, chapters at 14:00 and 17:15`,
  },
  {
    n: 9,
    title_en: 'Peeta Pooja',
    title_ta: 'பீட பூஜை',
    phase: 'pradhana',
    modes: ['main'],
    instruction_en:
      'Before the goddess is invited, the seat is worshipped. Lay the rice, spread the mango or banyan leaves, set the kalasham with the Lakshmi face on it, and offer the seat itself with this verse.',
    instruction_ta:
      'தேவியை எழுந்தருளச் செய்வதற்கு முன் ஆசனத்தைப் பூஜிக்க வேண்டும். அரிசியைப் பரப்பி, மாவிலை அல்லது ஆலிலையை வைத்து, லக்ஷ்மி முகம் பொருந்திய கலசத்தை நிறுத்தி, இந்த ஸ்லோகத்தால் ஆசனத்தைச் சமர்ப்பிக்கவும்.',
    deva: kalpam('simhasanam'),
    philosophy_en:
      'You prepare the chair before the guest arrives, not after. Peeta Pooja is the step most often skipped at home and the one that makes the difference between placing an object and receiving a person.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 24:54`,
  },
  {
    n: 10,
    title_en: 'Dhyanam & Avahanam',
    title_ta: 'த்யானம் & ஆவாஹனம்',
    phase: 'pradhana',
    modes: ['main'],
    instruction_en:
      'Close your eyes and hold the form in mind: seated on the lotus, lotus in hand, dear to Narayana, risen from the ocean of milk. Then invite her, with folded hands, to stay in this house. Done once, on the first day only.',
    instruction_ta:
      'கண்களை மூடி வடிவத்தை மனதில் நிறுத்தவும் — தாமரையில் அமர்ந்து, கையில் தாமரையுடன், நாராயணனுக்குப் பிரியமானவள், பாற்கடலில் தோன்றியவள். பின் கைகூப்பி, இந்த வீட்டில் நிலைத்திருக்கும்படி அழைக்கவும். இது முதல் நாளில் மட்டும் ஒரு முறை.',
    deva: kalpam('dhyanam', 'avahanam'),
    philosophy_en:
      'Susthira bhava me gehe, "be settled in my house". The request is not for a visit. That is why Avahanam is not repeated on the second day: she was not asked to leave.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 25:57`,
  },
  {
    n: 11,
    title_en: 'Prana Pratishtha',
    title_ta: 'ப்ராண ப்ரதிஷ்டை',
    phase: 'pradhana',
    modes: ['main'],
    instruction_en:
      'Touch the kalasham with the fingertips of the right hand and ask the life breath to settle into it. From here the kalasham is treated as present, not as an arrangement of vessels. The feminine form of the verse is used, asyai rather than asya.',
    instruction_ta:
      'வலது கை விரல் நுனிகளால் கலசத்தைத் தொட்டு, உயிர்ப்பு அதில் நிலைபெறும்படி வேண்டவும். இதற்குப் பின் கலசம் பாத்திரங்களின் அமைப்பு அல்ல; எழுந்தருளியிருப்பவளாகவே கருதப்படுகிறது. ஸ்லோகத்தின் ஸ்த்ரீலிங்க வடிவம் — அஸ்ய அல்ல, அஸ்யை.',
    deva:
      'अस्यै प्राणाः प्रतिष्ठन्तु अस्यै प्राणाः क्षरन्तु च । ' +
      'अस्यै देवत्वमर्चायै मामहेति च कश्चन ॥ ' +
      'श्री वरलक्ष्मी देवतायै नमः प्राण प्रतिष्ठापयामि ॥',
    philosophy_en:
      'The same verse as at Ganesha Chaturthi, in the feminine. It is what turns the rest of the morning into hospitality rather than arrangement, and it is why the kalasham is dismantled the next day with a step of its own instead of simply being put away.',
    source_ref: `Standard prana pratishtha verse, feminine form; ${VIDEO}, chapter at 29:26`,
  },
  {
    n: 12,
    title_en: 'Padyam, Arghyam & Achamaniyam',
    title_ta: 'பாத்யம், அர்க்யம் & ஆசமனீயம்',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'The first three courtesies given to any guest who arrives on foot: water for the feet, water for the hands, water to sip. Pour a spoonful into the uddharani at each and empty it into the plate.',
    instruction_ta:
      'நடந்து வரும் விருந்தினருக்குச் செய்யும் முதல் மூன்று உபசாரங்கள் — பாதம் கழுவ ஜலம், கை கழுவ ஜலம், பருக ஜலம். ஒவ்வொன்றிலும் உத்தரிணியில் ஒரு ஸ்பூன் ஜலம் விட்டு தாம்பாளத்தில் ஊற்றவும்.',
    deva: kalpam('arghyam', 'padyam', 'achamaniyam'),
    philosophy_en:
      'These three are older than any temple. They are what a household in a hot country did for anyone who reached the door, and the pooja preserves them unchanged.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 32:25`,
  },
  {
    n: 13,
    title_en: 'Panchamrita & Shuddhodaka Snanam',
    title_ta: 'பஞ்சாம்ருத & ஶுத்தோதக ஸ்நானம்',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'Bathe the Lakshmi face or the coin in the kalasham: first the five nectars, milk, curd, ghee, honey and sugar together, then clean water to finish. If the kalasham is already dressed, offer both symbolically with the uddharani into the plate.',
    instruction_ta:
      'கலசத்தின் லக்ஷ்மி முகத்தையோ நாணயத்தையோ அபிஷேகம் செய்யவும் — முதலில் பஞ்சாம்ருதம் (பால், தயிர், நெய், தேன், சர்க்கரை), பின் ஶுத்தோதகம். கலசம் ஏற்கெனவே அலங்கரிக்கப்பட்டிருந்தால், உத்தரிணியால் தாம்பாளத்தில் விட்டு ஸாங்கேதிகமாகச் சமர்ப்பிக்கவும்.',
    deva: kalpam('panchamrita_snanam', 'shuddhodaka_snanam'),
    philosophy_en:
      'Ganga jalam maya anitam, "I have brought Ganga water". Whatever is actually in the vessel, the sentence says what it is being treated as, and the treating is the rite.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 32:25`,
  },
  {
    n: 14,
    title_en: 'Vastram, Abharanam & Mangalyam',
    title_ta: 'வஸ்த்ரம், ஆபரணம் & மாங்கல்யம்',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'Offer the two cloths, then the ornaments, then the mangalyam. A small new blouse-piece and whatever gold the house has are what is usually used. This is the sequence that makes the kalasham a married woman of the household rather than a vessel.',
    instruction_ta:
      'இரண்டு வஸ்திரங்கள், பின் ஆபரணங்கள், பின் மாங்கல்யம் சமர்ப்பிக்கவும். பொதுவாக ஒரு புதிய ரவிக்கைத் துணியும், வீட்டில் உள்ள தங்க நகைகளும் பயன்படுத்தப்படுகின்றன. இந்த வரிசைதான் கலசத்தை ஒரு பாத்திரமாக அல்லாமல், வீட்டுச் சுமங்கலியாக ஆக்குகிறது.',
    deva: kalpam('vastram', 'abharanani', 'mangalyam'),
    philosophy_en:
      'The mangalyam verse is in none of the male deities\' poojas. It is the step where the vratham stops being worship of a goddess in general and becomes the household\'s women dressing one of their own.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 32:25`,
  },
  {
    n: 15,
    title_en: 'Gandham, Akshatai & Pushpam',
    title_ta: 'கந்தம், அக்ஷதை & புஷ்பம்',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    instruction_en:
      'Sandal paste, then turmeric-and-kumkumam rice, then flowers. The thamarai poo goes here and it is the one flower this vratham does not do without.',
    instruction_ta:
      'சந்தனம், பின் மஞ்சளும் குங்குமமும் கலந்த அக்ஷதை, பின் புஷ்பங்கள். தாமரைப் பூ இங்கே சமர்ப்பிக்கப்படுகிறது; இந்த விரதத்தில் தவிர்க்க முடியாத ஒரே பூ அதுவே.',
    deva: kalpam('gandham', 'akshatan', 'pushpam'),
    philosophy_en:
      'Mallika, jaji, champaka, vakula, shatapatra, kalhara. The verse names six flowers and expects none of them in particular; it is a way of saying "the best that is in the garden".',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 32:25`,
  },
  {
    n: 16,
    title_en: 'Anga Pooja',
    title_ta: 'அங்க பூஜை',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    archana: 'anga_pooja',
    instruction_en:
      'Fourteen names, each naming a limb, from the feet upward to the head, and a fifteenth for the whole body. Offer a flower or a pinch of akshatai at each, touching the corresponding part of the kalasham or the picture.',
    instruction_ta:
      'பதினான்கு நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்தைக் குறிக்கும், பாதத்திலிருந்து சிரசு வரை; பதினைந்தாவது உடல் முழுவதற்கும். ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பித்து, கலசத்தின் அல்லது படத்தின் அந்தந்த இடத்தைத் தொடவும்.',
    deva: null,
    philosophy_en:
      'Worship travels upward, feet first, because that is the direction respect moves in this culture. You touch the feet of an elder; you do not begin at the head.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 38:32`,
  },
  {
    n: 17,
    title_en: 'Lakshmi Ashtottara Shatanamavali',
    title_ta: 'லக்ஷ்மி அஷ்டோத்தர சதநாமாவளி',
    phase: 'pradhana',
    modes: ['main', 'punar'],
    namavali_id: 'lakshmi_ashtottara_108',
    instruction_en:
      'Offer a flower or a pinch of akshatai at each of the hundred and eight names. This is the list that opens prakrityai, vikrityai, vidyayai and closes bhuvaneshvaryai, which is the one recited at this vratham.',
    instruction_ta:
      'நூற்றெட்டு நாமங்களில் ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும். ப்ரக்ருத்யை, விக்ருத்யை, வித்யாயை என்று தொடங்கி புவநேஶ்வர்யை என்று முடியும் பட்டியலே இந்த விரதத்தில் சொல்லப்படுவது.',
    deva: null,
    philosophy_en:
      'There is more than one Lakshmi ashtottaram in print and they are not the same list. This one begins with prakriti and vikriti, nature and its transformation, which sets the frame: what is being asked for is not wealth but the turning of things.',
    source_ref: `StotraNidhi Sri Lakshmi Ashtottara Shatanamavali, Devanagari, Tamil and IAST pages cross-validated; ${VIDEO}, chapter at 40:49`,
  },
  {
    n: 18,
    title_en: 'Dhoopam & Deepam',
    title_ta: 'தூபம் & தீபம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Light the agarbatti and circle it, then show the ghee lamp. Ring the bell through both.',
    instruction_ta:
      'ஊதுபத்தியை ஏற்றிச் சுற்றவும், பின் நெய் தீபத்தைக் காட்டவும். இரண்டின் போதும் மணி அடிக்கவும்.',
    deva: kalpam('dhupam', 'dipam'),
    philosophy_en:
      'Dhoopam is what the room smells of and deepam is what it looks like. Between them they are the only upacharas that reach everyone present rather than only the person doing the pooja.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 47:34`,
  },
  {
    n: 19,
    title_en: 'Naivedyam, Paniyam & Tambulam',
    title_ta: 'நைவேத்யம், பானீயம் & தாம்பூலம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Place the food in front, sprinkle water around it, and offer it with the five breath mantras. Then water to drink, then the betel leaf and areca nut. Cover the food while reciting, and do not taste anything before this step.',
    instruction_ta:
      'நைவேத்யத்தை முன்னே வைத்து, சுற்றி ஜலம் தெளித்து, பஞ்ச ப்ராண மந்திரங்களால் சமர்ப்பிக்கவும். பின் பருக ஜலம், பின் வெற்றிலை பாக்கு. சொல்லும்போது உணவை மூடி வைக்கவும்; இந்தப் படிக்கு முன் எதையும் ருசி பார்க்கக் கூடாது.',
    deva:
      'ॐ प्राणाय स्वाहा । ॐ अपानाय स्वाहा । ॐ व्यानाय स्वाहा । ॐ उदानाय स्वाहा । ॐ समानाय स्वाहा ॥\n' +
      kalpam('naivedyam', 'paniyam', 'tambulam'),
    philosophy_en:
      'Shadrasopetam, "complete in the six tastes". The verse asks for a balanced meal, not a sweet. What the household actually cooks that morning is what is meant.',
    source_ref: `${KALPAM}; the five prana mantras are the standard Smartha naivedyam frame; ${VIDEO}, chapter at 47:34`,
  },
  {
    n: 20,
    title_en: 'Karpura Neerajanam',
    title_ta: 'கர்ப்பூர நீராஜனம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Light the camphor and circle it three times clockwise, at the feet, then the middle, then the face. Ring the bell with the left hand. This is the point the rest of the house is called in.',
    instruction_ta:
      'கற்பூரம் ஏற்றி மூன்று முறை வலஞ்சுழியாகச் சுற்றவும் — பாதம், பின் நடு, பின் முகம். இடது கையால் மணி அடிக்கவும். வீட்டில் உள்ளவர்களை அழைக்க வேண்டிய நேரம் இதுவே.',
    deva: kalpam('nirajanam'),
    philosophy_en:
      'Camphor leaves no residue. It is the one substance in the pooja that is entirely consumed by its own flame, which is the whole of what the deeparadhana is saying.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 51:18`,
  },
  {
    n: 21,
    title_en: 'Pushpanjali & Mantra Pushpam',
    title_ta: 'புஷ்பாஞ்ஜலி & மந்த்ர புஷ்பம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Take flowers in both cupped palms, recite, and offer them at her feet at the end of the verse.',
    instruction_ta:
      'இரு கைகளையும் குவித்துப் புஷ்பங்களை எடுத்து, ஸ்லோகத்தைச் சொல்லி, முடிவில் திருவடிகளில் சமர்ப்பிக்கவும்.',
    deva: kalpam('mantrapushpam'),
    philosophy_en:
      'The same verse as the dhyanam at the start. The pooja ends by saying what it opened with, which is how it marks that nothing in between was transactional.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 53:31`,
  },
  {
    n: 22,
    title_en: 'Pradakshina',
    title_ta: 'ப்ரதக்ஷிணம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Go round three times, clockwise, in the space you have. If there is no room to walk, turn in place where you are sitting.',
    instruction_ta:
      'இடம் இருக்கும் அளவுக்கு மூன்று முறை வலம் வரவும். நடக்க இடமில்லையென்றால், அமர்ந்த இடத்திலேயே சுற்றித் திரும்பவும்.',
    deva: verseOnly('pradakshina').split('\n').slice(0, 6).join('\n') +
      '\nश्री वरलक्ष्मी देवतायै नमः प्रदक्षिणं समर्पयामि ॥',
    philosophy_en:
      'Papo\'ham papakarmaham, "I am the wrong and the wrongdoing". The verse is unusually blunt, and it is recited while walking rather than sitting, which keeps it from becoming a performance of humility.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 54:49`,
  },
  {
    n: 23,
    title_en: 'Namaskaram & Varalakshmi Prarthana',
    title_ta: 'நமஸ்காரம் & வரலக்ஷ்மி ப்ரார்த்தனை',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Prostrate and then ask. Women prostrate with five limbs touching, not eight.',
    instruction_ta:
      'நமஸ்கரித்துப் பின் வேண்டிக்கொள்ளவும். பெண்கள் அஷ்டாங்கமாக அல்ல, பஞ்சாங்கமாக நமஸ்கரிக்க வேண்டும்.',
    deva:
      'नमस्ते लोकजननि नमस्ते विष्णुवल्लभे ।\n' +
      'पाहिमां भक्तवरदे वरलक्ष्मी नमो नमः ॥\n' +
      'श्री वरलक्ष्मी देवतायै नमः नमस्कारान् समर्पयामि ॥',
    philosophy_en:
      'Lokajanani, mother of the world, before Vishnuvallabha, beloved of Vishnu. The order of the two epithets is the whole argument for why this vratham is kept by women for the household rather than for themselves.',
    source_ref: `${KALPAM}; ${VIDEO}, chapter at 55:44`,
  },
  {
    n: 24,
    title_en: 'Nonbu Sharadu Pooja',
    title_ta: 'நோன்பு சரடு பூஜை',
    phase: 'uttara',
    modes: ['main'],
    archana: 'tora_granthi',
    instruction_en:
      'Take the yellow thread of nine strands with nine knots and place it before the kalasham. Worship each knot in turn with its own name of Lakshmi, offering akshatai or a flower at each. The thread is prepared beforehand: turmeric-dyed, nine strands, nine knots.',
    instruction_ta:
      'ஒன்பது இழைகளும் ஒன்பது முடிச்சுகளும் கொண்ட மஞ்சள் சரடை எடுத்து கலசத்தின் முன் வைக்கவும். ஒவ்வொரு முடிச்சையும் அதற்குரிய லக்ஷ்மி நாமத்தால் பூஜித்து, அக்ஷதையோ புஷ்பமோ சமர்ப்பிக்கவும். சரடு முன்பே தயாரிக்கப்பட வேண்டும் — மஞ்சளில் தோய்த்து, ஒன்பது இழை, ஒன்பது முடிச்சு.',
    deva: null,
    philosophy_en:
      'Nine knots, nine names, and the thread stays on the wrist for the year. It is the only part of the whole morning that leaves the pooja room, which is why this step and the tying that follows are the two the vratham is actually named for.',
    source_ref: `${KALPAM} (tora granthi puja); ${VIDEO}, chapter at 57:08`,
  },
  {
    n: 25,
    title_en: 'Sharadu Dharanam',
    title_ta: 'சரடு தாரணம்',
    phase: 'uttara',
    modes: ['main'],
    instruction_en:
      'Tie the thread on the right wrist, reciting. An elder in the house ties it for the younger women; each ties her own if there is no one to. It stays on until it wears through, or until next year\'s vratham.',
    instruction_ta:
      'வலது மணிக்கட்டில் சரட்டைக் கட்டிக்கொள்ளவும், ஸ்லோகம் சொல்லியபடி. வீட்டில் மூத்தவர் இளையவர்களுக்குக் கட்டுவார்; கட்ட ஆள் இல்லையெனில் தானே கட்டிக்கொள்ளலாம். அறுந்து போகும் வரை, அல்லது அடுத்த வருட விரதம் வரை, அது கையிலேயே இருக்கும்.',
    deva: kalpam('tora_bandhanam'),
    philosophy_en:
      'Badhnami dakshine haste, "I tie it on the right hand". The verb is first person: nobody ties it for you in the text, whatever happens in the room.',
    source_ref: `${KALPAM} (tora bandhana mantram); ${VIDEO}, chapter at 59:38`,
  },
  {
    n: 26,
    title_en: 'Vayana Dhanam',
    title_ta: 'வாயன தானம்',
    phase: 'uttara',
    modes: ['main'],
    instruction_en:
      'Give the vayanam: twelve of what was cooked, with betel, areca and dakshinai, to a brahmana or to another sumangali. The giver and receiver both say the verse, which names Lakshmi as both.',
    instruction_ta:
      'வாயனம் கொடுக்கவும் — சமைத்ததில் பன்னிரண்டு, வெற்றிலை பாக்கு தட்சிணையுடன், ஒரு அந்தணருக்கோ அல்லது மற்றொரு சுமங்கலிக்கோ. கொடுப்பவரும் பெறுபவரும் இந்த ஸ்லோகத்தைச் சொல்வார்கள்; அதில் லக்ஷ்மியே இருவருமாகக் குறிக்கப்படுகிறாள்.',
    deva: kalpam('vayana_vidhi', 'vayana_danam'),
    philosophy_en:
      'Indira pratigrihnatu indirayai dadati cha, "Lakshmi receives, and it is to Lakshmi that it is given". The verse refuses to let either party be the superior one, which is the only way a gift between neighbours survives being ritualised.',
    source_ref: `${KALPAM} (vayana vidhi and vayana dana mantram); ${VIDEO}, chapter at 1:02:16`,
  },
  {
    n: 27,
    title_en: 'Ksheera Arghyam',
    title_ta: 'க்ஷீர அர்க்யம்',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Mix a little water into raw milk. Holding the uddharani, offer the arghyam three times. Half a glass of raw milk is kept aside for this at the start, which is why it is on the samagri list.',
    instruction_ta:
      'பச்சைப் பாலில் சிறிது ஜலம் கலக்கவும். உத்தரிணியைப் பிடித்து மூன்று முறை அர்க்யம் விடவும். இதற்காகவே அரை டம்ளர் பச்சைப் பால் தொடக்கத்திலேயே தனியாக வைக்கப்படுகிறது; அதனால்தான் அது சாமக்ரி பட்டியலில் உள்ளது.',
    deva: kalpam('arghyam'),
    philosophy_en:
      'Arghyam is given when a guest arrives and again when they leave. Giving it in milk at the close returns the courtesy the whole morning has been.',
    source_ref: `Arghyam verse from ${KALPAM}; the kalpam gives it once, as an upachara, while the video gives it again in milk at the close. ${VIDEO}, chapter at 1:05:34`,
  },
  {
    n: 28,
    title_en: 'Kshama Prarthana & Conclusion',
    title_ta: 'க்ஷமா ப்ரார்த்தனை & நிறைவு',
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Ask forgiveness for what was short: the mantras mispronounced, the steps done wrongly, the attention that wandered. Then release akshatai and water, and the pooja is complete.',
    instruction_ta:
      'குறைந்தவற்றுக்கு மன்னிப்பு வேண்டவும் — தவறாக உச்சரித்த மந்திரங்கள், பிழையாகச் செய்த படிகள், அலைந்த கவனம். பின் அக்ஷதையையும் ஜலத்தையும் விடவும்; பூஜை நிறைவுற்றது.',
    deva: kalpam('kshama'),
    philosophy_en:
      'Mantraheenam kriyaheenam bhaktiheenam. The verse concedes all three at once, including the devotion, and asks that it be counted complete anyway. It is the reason a household pooja done imperfectly is still a pooja.',
    source_ref: `${KALPAM}; recited at the close in ${VIDEO}`,
  },
  {
    n: 29,
    title_en: 'Udvasanam',
    title_ta: 'உத்வாசனம்',
    phase: 'uttara',
    modes: ['udvasana'],
    instruction_en:
      'The next day, after the Punar Pooja. Move the kalasham slightly from its seat to release what was established at Prana Pratishtha, then take leave. The water is poured at the tulasi or in the garden, the rice is cooked and eaten, and the coconut is broken. The thread stays on the wrist.',
    instruction_ta:
      'மறுநாள், புனர் பூஜைக்குப் பின். ப்ராண ப்ரதிஷ்டையில் நிலைபெறச் செய்ததை விடுவிக்க, கலசத்தை அதன் இடத்திலிருந்து சிறிது நகர்த்தி விடைபெறவும். ஜலத்தைத் துளசியடியிலோ தோட்டத்திலோ ஊற்றவும், அரிசியைச் சமைத்து உண்ணவும், தேங்காயை உடைக்கவும். சரடு மட்டும் கையிலேயே இருக்கும்.',
    deva:
      'यज्ञेन यज्ञमयजन्त देवाः तानि धर्माणि प्रथमान्यासन् । ' +
      'श्री वरलक्ष्मी देवतायै नमः यथास्थानं उद्वासयामि ॥',
    philosophy_en:
      'Prana Pratishtha made the kalasham a presence, so something has to end that. Without Udvasanam the vratham is not closed, and the vessels are simply put away with a guest still in them.',
    source_ref: `Tamil Smartha paddhati; ${VIDEO}, Next Day Punar Pooja chapter at 1:08:43`,
  },
];

// ---------------------------------------------------------------------------
// samagri and naivedyam, from the video description verbatim
// ---------------------------------------------------------------------------
const SAMAGRI = [
  ['Kalasham with a Lakshmi face', 'லக்ஷ்மி முகம் பொருந்திய கலசம்', '1', 'core', true, true, 'A Lakshmi photo, if no faced kalasham is available'],
  ['Pancha pathram and uddharani', 'பஞ்ச பாத்திரம் & உத்தரிணி', '1 set', 'vessel', true, false, null],
  ['Plates (thambalam)', 'தாம்பாளம்', '2 to 3', 'vessel', true, false, null],
  ['Kinnam (small cups), brass or steel', 'கிண்ணம் (பித்தளை அல்லது ஸ்டீல்)', '7 to 8', 'vessel', true, false, null],
  ['Mani (pooja bell)', 'மணி', '1', 'vessel', true, false, null],
  ['Karpoora thattu', 'கற்பூரத் தட்டு', '1', 'vessel', true, false, null],
  ['Eka aarathi and pancha aarathi', 'ஏக ஆரத்தி & பஞ்ச ஆரத்தி', '1 each', 'vessel', false, false, null],
  ['Nonbu sharadu, nine strands with nine knots', 'நோன்பு சரடு (ஒன்பது இழை, ஒன்பது முடிச்சு)', 'one per woman', 'core', true, false, null],
  ['Chandanam', 'சந்தனம்', null, 'offering', true, false, null],
  ['Kumkumam', 'குங்குமம்', null, 'offering', true, false, null],
  ['Akshadai', 'அக்ஷதை', null, 'offering', true, false, null],
  ['Manjal powder', 'மஞ்சள் தூள்', null, 'offering', true, false, null],
  ['Agarbatti and karpooram', 'ஊதுபத்தி & கற்பூரம்', null, 'offering', true, false, null],
  ['Thamarai poo', 'தாமரைப் பூ', 'a few', 'flower', true, false, null],
  ['Udiri pushpam (loose flowers)', 'உதிரி புஷ்பம்', '1.5 to 2 kg', 'flower', true, false, null],
  ['Thazam poo', 'தாழம் பூ', null, 'flower', false, true, 'Any fragrant flower in season'],
  ['Maalai or kadambam', 'மாலை அல்லது கதம்பம்', '5 feet', 'flower', true, false, null],
  ['Doorvai (arugampul) and thulasi', 'அருகம்புல் & துளசி', null, 'leaf', true, false, null],
  ['Bilvam', 'வில்வம்', null, 'leaf', true, true, 'Thulasi'],
  ['Vetrilai and paakku', 'வெற்றிலை & பாக்கு', null, 'offering', true, false, null],
  ['Raw milk for the arghyam', 'அர்க்யத்திற்கு பச்சைப் பால்', 'half a glass', 'core', true, false, null],
];

const NAIVEDYAM = [
  ['primary', 'Payasam', 'பாயசம்', 'Milk and rice or vermicelli, sweetened, the offering Lakshmi is given first.', 'பாலும் அரிசியும் அல்லது சேமியாவும், இனிப்பு சேர்த்தது; லக்ஷ்மிக்கு முதலில் படைக்கப்படுவது.'],
  ['primary', 'Kozhukattai, sweet and salt', 'கொழுக்கட்டை (இனிப்பு & உப்பு)', 'Rice flour dumplings, steamed, both kinds made on this day.', 'அரிசி மாவு கொழுக்கட்டை, ஆவியில் வேகவைத்தது; இந்நாளில் இரண்டு வகையும் செய்யப்படும்.'],
  ['secondary', 'Annam', 'அன்னம்', 'Plain cooked rice, offered with the rest of the meal.', 'வெறும் சாதம், மற்ற உணவுடன் சேர்த்துப் படைக்கப்படுகிறது.'],
  ['secondary', 'Idli', 'இட்லி', null, null],
  ['secondary', 'Vadai', 'வடை', null, null],
  ['secondary', 'Mixed fruits with banana', 'கலவை பழங்கள் & வாழைப்பழம்', 'Banana is not optional; the rest is what the season has.', 'வாழைப்பழம் கட்டாயம்; மற்றவை பருவத்தைப் பொறுத்தது.'],
  ['secondary', 'Thengai (coconut)', 'தேங்காய்', 'Optional in the vadyar\'s list.', 'வாத்யாரின் பட்டியலில் விருப்பத்திற்குரியது.'],
];

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------
const problems = [];
const all = [...SHARED.map(([t, n]) => ({ n, title_en: t })), ...STEPS];
const nums = all.map((s) => s.n).sort((a, b) => a - b);
if (new Set(nums).size !== nums.length) problems.push('duplicate step_number');
nums.forEach((v, i) => { if (v !== i + 1) problems.push(`step numbers are not dense: expected ${i + 1}, got ${v}`); });
if (nums.length !== 29) problems.push(`${nums.length} steps, expected 29`);
if (K.anga_pooja.lines !== 15) problems.push(`anga_pooja has ${K.anga_pooja.lines} lines`);
if (K.tora_granthi.lines !== 9) problems.push(`tora_granthi has ${K.tora_granthi.lines} lines`);
if (NAMAVALI.lakshmi?.length !== 108) problems.push(`lakshmi namavali has ${NAMAVALI.lakshmi?.length}`);
for (const s of STEPS) {
  if (!s.deva && !s.archana && !s.namavali_id) problems.push(`${s.title_en} has no mantra, archana or namavali`);
}
if (problems.length) { problems.forEach((p) => console.error('FAIL ' + p)); process.exit(1); }

// ---------------------------------------------------------------------------
// emit
// ---------------------------------------------------------------------------
const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0011_varalakshmi.sql
--
-- GENERATED by scripts/build-varalakshmi.mjs. Do not hand-edit.
--
-- The Varalakshmi Vratham, 29 steps, built against Sathya Vadyar's video for
-- SEQUENCE and StotraNidhi's Vrata Kalpam for the mantras. Every kalpam line
-- was proved to survive Telugu -> Devanagari -> Telugu before it was written
-- here; see scripts/parse-varalakshmi-kalpam.mjs for why that conversion is
-- acceptable where the namavali script refuses one.
--
-- The Vrata Katha is NOT included. The kalpam has it; the video has no katha
-- chapter, and the video is this project's authority for what is performed.
--
-- Six purvangam steps are COPIED from the Ganesha pooja by reading its rows,
-- not retyped: Achamanam, Anga Vandanam, Vighneshwara Dhyanam, Pranayamam,
-- Kalasha Pooja, Ghanta Pooja. Nothing in them is Ganesha-specific.
--
-- Also fixes pooja_steps for Ganesha step "Gandham, Kumkumam & Pushpam", whose
-- mantra had Bengali characters where Devanagari belongs.
--
-- Idempotent.
-- =============================================================================

begin;

-- --- a pre-existing typo ------------------------------------------------------
-- puShpaiH pUjayAmi was stored as "पुष्पैः পূजयामि": the pU was typed in Bengali.
update public.pooja_steps
   set mantra_sanskrit = replace(mantra_sanskrit, 'পূ', 'पू'),
       mantra_tamil    = 'திவ்ய ஶ்ரீ சந்தநம் ஸமர்பயாமி । குங்குமம் ஸமர்பயாமி । புஷ்பை꞉ பூஜயாமி ॥',
       mantra_translit = 'divya śrī candanaṃ samarpayāmi । kuṅkumaṃ samarpayāmi । puṣpaiḥ pūjayāmi ॥'
 where pooja_id = ${q(GANESHA)}
   and step_title_en = 'Gandham, Kumkumam & Pushpam'
   and mantra_sanskrit like '%পূ%';

-- --- deity --------------------------------------------------------------------
insert into public.deities
  (id, name_en, name_deva, name_ta, name_dative_deva, class, dhyana_sloka_deva, avahana_deva)
values ('varalakshmi', 'Varalakshmi', 'वरलक्ष्मी', 'வரலக்ஷ்மி',
        'श्री वरलक्ष्मी देवतायै', 'goddess',
        ${q(K.dhyanam.deva)},
        ${q(K.avahanam.deva)})
on conflict (id) do update set
  name_dative_deva = excluded.name_dative_deva,
  dhyana_sloka_deva = excluded.dhyana_sloka_deva,
  avahana_deva = excluded.avahana_deva,
  updated_at = now();

-- --- pooja --------------------------------------------------------------------
-- The date rule: the Friday BEFORE the full moon of Sravana. The kalpam states
-- it (shravanamasa shuklapaksha purnimaku munduga vachchedi shukravaramunadu)
-- and so does the katha. That is an ordinal_weekday rule, which is why the enum
-- has one; the schema comment already names Varalakshmi as its example.
insert into public.poojas
  (id, title_en, title_ta, ritual_class, deity_id, description_en, description_ta,
   duration_mins, eligibility, rule_type, rule_month, rule_reckoning, rule_paksha,
   rule_tithi, rule_weekday, rule_ordinal, rule_notes, source_ref)
values (${q(POOJA)}, 'Varalakshmi Vratham', 'வரலக்ஷ்மி விரதம்', 'vratam', 'varalakshmi',
        'The vratham kept by the women of the household on the Friday before the Sravana full moon. A kalasham is dressed as Lakshmi, worshipped through the day, and a nine-knotted turmeric thread is tied on the right wrist to be worn for the year.',
        'ஶ்ராவண பௌர்ணமிக்கு முந்தைய வெள்ளிக்கிழமையன்று வீட்டுப் பெண்களால் அனுஷ்டிக்கப்படும் விரதம். கலசம் லக்ஷ்மியாக அலங்கரிக்கப்பட்டு பூஜிக்கப்படுகிறது; ஒன்பது முடிச்சுள்ள மஞ்சள் சரடு வலது கையில் கட்டப்பட்டு ஆண்டு முழுவதும் அணியப்படுகிறது.',
        150, 'all', 'ordinal_weekday', 'shravana', 'chandra', 'shukla',
        'pournami', 'friday', -1,
        'The last Friday before the Sravana pournami. In the Tamil solar calendar this falls in Aadi or Aavani. Performed in the morning; the kalasham is dismantled the next day after the Punar Pooja.',
        ${q(VIDEO + '; StotraNidhi Sri Varalakshmi Vrata Kalpam')})
on conflict (id) do update set
  title_en = excluded.title_en, title_ta = excluded.title_ta,
  ritual_class = excluded.ritual_class, deity_id = excluded.deity_id,
  description_en = excluded.description_en, description_ta = excluded.description_ta,
  duration_mins = excluded.duration_mins,
  rule_type = excluded.rule_type, rule_month = excluded.rule_month,
  rule_reckoning = excluded.rule_reckoning, rule_paksha = excluded.rule_paksha,
  rule_tithi = excluded.rule_tithi, rule_weekday = excluded.rule_weekday,
  rule_ordinal = excluded.rule_ordinal, rule_notes = excluded.rule_notes,
  source_ref = excluded.source_ref, updated_at = now();

-- --- the 108 names ------------------------------------------------------------
insert into public.namavalis (id, deity_id, recension, name_count, source_ref)
values ('lakshmi_ashtottara_108', 'varalakshmi',
        'Opens prakrityai vikrityai vidyayai, closes bhuvaneshvaryai. NOT the sahasranama-anga recension, which opens brahmajayai and is not the one recited at this vratham.',
        108,
        'StotraNidhi Sri Lakshmi Ashtottara Shatanamavali; Devanagari, Tamil and IAST pages cross-validated by scripts/parse-namavali.mjs')
on conflict (id) do update set
  recension = excluded.recension, source_ref = excluded.source_ref;
`);

out('insert into public.namavali_items (namavali_id, seq, name_deva, name_ta, name_translit) values');
out(NAMAVALI.lakshmi.map((n) =>
  `  ('lakshmi_ashtottara_108', ${n.seq}, ${q(n.deva)}, ${q(n.tamil)}, ${q(n.iast)})`).join(',\n'));
out(`on conflict (namavali_id, seq) do update set
  name_deva = excluded.name_deva, name_ta = excluded.name_ta, name_translit = excluded.name_translit;
`);

// --- shared steps -----------------------------------------------------------
out(`-- --- the shared purvangam ----------------------------------------------------
-- Copied from the Ganesha pooja rather than retyped. If that pooja's wording is
-- corrected later, re-running this migration brings the correction across.`);
for (const [title, n, modes] of SHARED) {
  out(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   meaning_en, philosophy_en, philosophy_ta, gender_rule, variant_mantra_sanskrit,
   variant_note_en, is_dynamic_sankalpam, scripts_generated, source_ref)
select ${q(POOJA)}, ${n}, phase, '{${modes.join(',')}}', step_title_en, step_title_ta,
       instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
       meaning_en, philosophy_en, philosophy_ta, gender_rule, variant_mantra_sanskrit,
       variant_note_en, false, scripts_generated,
       coalesce(source_ref || '; ', '') || 'shared purvangam, copied from ${GANESHA}'
  from public.pooja_steps
 where pooja_id = ${q(GANESHA)} and step_title_en = ${q(title)}
on conflict (pooja_id, step_number) do update set
  step_title_en = excluded.step_title_en, step_title_ta = excluded.step_title_ta,
  instruction_en = excluded.instruction_en, instruction_ta = excluded.instruction_ta,
  mantra_sanskrit = excluded.mantra_sanskrit, mantra_tamil = excluded.mantra_tamil,
  mantra_translit = excluded.mantra_translit, philosophy_en = excluded.philosophy_en,
  philosophy_ta = excluded.philosophy_ta, gender_rule = excluded.gender_rule,
  variant_mantra_sanskrit = excluded.variant_mantra_sanskrit,
  variant_note_en = excluded.variant_note_en,
  modes = excluded.modes, phase = excluded.phase, source_ref = excluded.source_ref;
`);
}

// --- own steps --------------------------------------------------------------
out('-- --- the steps specific to this vratham --------------------------------------');
for (const s of STEPS) {
  out(`-- ${s.n}. ${s.title_en}`);
  out(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   philosophy_en, gender_rule, scripts_generated, is_dynamic_sankalpam,
   namavali_id, source_ref)
values (${q(POOJA)}, ${s.n}, ${q(s.phase)}, '{${s.modes.join(',')}}',
        ${q(s.title_en)}, ${q(s.title_ta)},
        ${q(s.instruction_en)},
        ${q(s.instruction_ta)},
        ${q(s.deva)},
        ${q(s.deva && tr(s.deva, 'tamil'))},
        ${q(s.deva && tr(s.deva, 'iast'))},
        ${q(s.philosophy_en)}, 'all', true, ${s.dynamic ? 'true' : 'false'},
        ${q(s.namavali_id ?? null)}, ${q(s.source_ref)})
on conflict (pooja_id, step_number) do update set
  step_title_en = excluded.step_title_en, step_title_ta = excluded.step_title_ta,
  instruction_en = excluded.instruction_en, instruction_ta = excluded.instruction_ta,
  mantra_sanskrit = excluded.mantra_sanskrit, mantra_tamil = excluded.mantra_tamil,
  mantra_translit = excluded.mantra_translit, philosophy_en = excluded.philosophy_en,
  is_dynamic_sankalpam = excluded.is_dynamic_sankalpam,
  namavali_id = excluded.namavali_id, modes = excluded.modes,
  phase = excluded.phase, source_ref = excluded.source_ref;
`);
}

// --- archana rows -----------------------------------------------------------
const stepRef = (title) =>
  `(select id from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = ${q(title)})`;

/** Split "OM <name> namaH | <limb> pUjayAmi" into the invoked name and the act. */
function splitLine(deva) {
  const parts = deva.replace(/\s*[।॥]\s*$/, '').split('|');
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];
  return [deva.replace(/\s*[।॥]\s*$/, '').trim(), null];
}

for (const s of STEPS.filter((x) => x.archana)) {
  const lines = K[s.archana].deva.split('\n');
  out(`-- ${s.title_en}: ${lines.length} rows`);
  out(`insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,
   offering_deva, offering_en, offering_ta)
values`);
  out(lines.map((line, i) => {
    const [name, act] = splitLine(line);
    return `  (${stepRef(s.title_en)}, ${i + 1}, ${q(name)}, ${q(tr(name, 'tamil'))}, ${q(tr(name, 'iast'))},` +
      ` ${q(act)}, ${q(act ? tr(act, 'iast') : null)}, ${q(act ? tr(act, 'tamil') : null)})`;
  }).join(',\n'));
  out(`on conflict (pooja_step_id, seq) do update set
  invoked_name_deva = excluded.invoked_name_deva,
  invoked_name_ta = excluded.invoked_name_ta,
  invoked_name_translit = excluded.invoked_name_translit,
  offering_deva = excluded.offering_deva,
  offering_en = excluded.offering_en,
  offering_ta = excluded.offering_ta;

delete from public.archana_items
where pooja_step_id = ${stepRef(s.title_en)} and seq > ${lines.length};
`);
}

// --- samagri ----------------------------------------------------------------
out('-- --- samagri, from the video description -------------------------------------');
out(`insert into public.samagri_items
  (pooja_id, seq, item_en, item_ta, quantity, category, is_required, is_substitutable, substitute_with)
values`);
out(SAMAGRI.map(([en, ta, qty, cat, req, sub, subWith], i) =>
  `  (${q(POOJA)}, ${i + 1}, ${q(en)}, ${q(ta)}, ${q(qty)}, ${q(cat)}, ${req}, ${sub}, ${q(subWith)})`,
).join(',\n'));
out(`on conflict (pooja_id, seq) do update set
  item_en = excluded.item_en, item_ta = excluded.item_ta, quantity = excluded.quantity,
  category = excluded.category, is_required = excluded.is_required,
  is_substitutable = excluded.is_substitutable, substitute_with = excluded.substitute_with;

delete from public.samagri_items where pooja_id = ${q(POOJA)} and seq > ${SAMAGRI.length};
`);

// --- naivedyam --------------------------------------------------------------
const tiers = {};
out('-- --- naivedyam ---------------------------------------------------------------');
out(`insert into public.naivedyam_items
  (pooja_id, tier, seq, name_en, name_ta, recipe_note, recipe_note_ta)
values`);
out(NAIVEDYAM.map(([tier, en, ta, note, noteTa]) => {
  tiers[tier] = (tiers[tier] ?? 0) + 1;
  return `  (${q(POOJA)}, ${q(tier)}, ${tiers[tier]}, ${q(en)}, ${q(ta)}, ${q(note)}, ${q(noteTa)})`;
}).join(',\n'));
out(`on conflict (pooja_id, tier, seq) do update set
  name_en = excluded.name_en, name_ta = excluded.name_ta,
  recipe_note = excluded.recipe_note, recipe_note_ta = excluded.recipe_note_ta;
`);

out('commit;');
out(`
-- Verify:
--   select step_number, step_title_en, modes from pooja_steps
--     where pooja_id = 'varalakshmi_vratham' order by step_number;      -- 29 rows
--   select count(*) from namavali_items where namavali_id = 'lakshmi_ashtottara_108';  -- 108
--   select count(*) from samagri_items where pooja_id = 'varalakshmi_vratham';         -- ${SAMAGRI.length}
--   select count(*) from pooja_steps where pooja_id = 'varalakshmi_vratham'
--     and mantra_sanskrit like '%পূ%';                                                 -- 0`);

console.error(`${nums.length} steps (${SHARED.length} shared, ${STEPS.length} own)`);
console.error(`anga ${K.anga_pooja.lines}, granthi ${K.tora_granthi.lines}, namavali ${NAMAVALI.lakshmi.length}`);
console.error(`samagri ${SAMAGRI.length}, naivedyam ${NAIVEDYAM.length}`);
console.error(`sample: ${tr(K.tora_bandhanam.deva, 'tamil').split('\n')[0]}`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
