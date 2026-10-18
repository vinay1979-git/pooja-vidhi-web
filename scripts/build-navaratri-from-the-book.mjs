#!/usr/bin/env node
/**
 * Navaratri Pooja, rebuilt from the book: the full Purvanga inlined, and one
 * action and its words per screen.
 *
 *   node scripts/build-navaratri-from-the-book.mjs          # validate
 *   node scripts/build-navaratri-from-the-book.mjs --show   # print every step's mantra
 *   node scripts/build-navaratri-from-the-book.mjs --emit   # write 0062
 *
 * docs/PROJECT-GUIDE.md §2.1 and §2.2; docs/plans/ux-seamless-flow.md §2.6,
 * §3.1 and §3.6. The owner's notes for this rebuild are in
 * docs/plans/navaratri-rebuild-0062.md.
 *
 * SOURCE. *Sampradaya Vratha Pooja Vidhi* (Giri):
 *   - the Purvanga, book pp.1-26, transcribed in
 *     G:\My Drive\Pooja Vidhi\extracted\transcripts\1-common (pNN = book page);
 *   - Navaratri Puja, book pp.286-304, in ...\transcripts\7-navaratri, read by
 *     book page and block exactly as scripts/build-navaratri-saraswati.mjs does.
 *
 * WHAT THE BOOK SAYS TO DO, AND WHAT THE APP DOES WITH IT. Every Navaratri page
 * sends the reader away: "after performing Purvanga steps 1 to 10 (see pages 1
 * to 12) continue the main sankalpa given here", "proceed with steps 11 to 16
 * (see pages 14 to 19), then the dhyana and aavaahana as given here", "then
 * perform Pranapratishtha (step 18, see page 19)", "see page 123 for the Lakshmi
 * ashtottaram". The app inlines every one of these where the book says it
 * belongs, so the reader only ever presses Next:
 *
 *   Purvanga 1-9 (pp.1-12) · Pranayama (step 9) · the Navaratri sankalpa
 *   (p.12-13 frame, p.286 clause) · Purvanga 11-16 (pp.14-19) · the Navaratri
 *   dhyana and avahana (pp.286-287) · Prana Pratishtha (pp.19-26, the devi
 *   column) · the Navaratri pradhana pooja (pp.288-304).
 *
 * ONE ACTION PER SCREEN. Every verse in the book is followed by its rubric,
 * "(Offer water)". A step is cut at those rubrics, so each screen is one
 * upachara and its words. Four steps keep two offering verbs because the book
 * puts both under ONE rubric: the Vighneshwara gandham ("anoint with sandal
 * paste and kunkum"), the Vighneshwara pushpam and the Navaratri pushpam
 * ("offer floral garland, flowers"), and the kalasha gandham. They are listed
 * in TWO_VERBS_ONE_RUBRIC below and in the 0062 test.
 *
 * NOTHING IS RETYPED. Every mantra is read from the transcripts by book page and
 * block index. Lines are re-broken (the sankalpa) or cut at a comma (the
 * dhoopa/deepa line of the Vighneshwara pooja, which the app shows as two
 * screens) but no letter is typed by hand except where listed here.
 *
 * REPAIRS, each settled by the book itself (the roman on the same page):
 *
 *   p.3   ओँ (candrabindu) for the vedic Ogum, twice in the pranayama. The roman
 *         reads Ogum suvaha, Ogum satyam; the project writes that sound ꣳ
 *         (scripts/_tamil.mjs), and ओँ cannot be carried into Tamil at all.
 *   p.13  दुरितोप / शान्त्यर्थं is one word broken across a line; the roman reads
 *         duritOpashaantyartham.
 *   p.15  आयान्तु देव(देवी)पूजार्थ: the book gives the feminine as a bracketed
 *         alternative and the Goddess takes it; पूजार्थ gains its anusvara from
 *         the roman, poojaartham.
 *   p.24  पुनररस्मासु doubles a syllable; the roman reads punarasmaasu.
 *   p.286 लक्ष्मि short in the sankalpa; the roman has lakSHmee (as 0055).
 *   p.294 पुष्पानि with a dental न; the roman (p.296) reads puSHpaaNi.
 *
 * WHAT IS NOT REPAIRED. मृलया on p.24 is the Vedic ळ/ल spelling the book prints
 * in both scripts (mRlayaa), so it stays, though the 0057 row had मृडया.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const ROOT = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';
const NAV = 'navaratri_pooja';
const MIGRATION = 'supabase/migrations/0062_navaratri_from_the_book.sql';

// --- read the transcripts ---------------------------------------------------
function load(slug) {
  const byPage = {};
  for (const f of readdirSync(ROOT + slug).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(`${ROOT}${slug}/${f}`, 'utf8'));
    byPage[d.book_page] = d;
  }
  return byPage;
}
const COMMON = load('1-common');
const NAVR = load('7-navaratri');

/** As build-navaratri-saraswati.mjs: one deva line made fit to recite. */
function clean(line) {
  return line
    .replace(/\s*\((?:[A-Za-z][^)]*)\)\s*/g, ' ')    // (Morning), (Offer water)
    .replace(/\s*[–-]\s*[A-Za-z].*$/, '')           // – roman tail
    .replace(/\s+[A-Za-z][A-Za-z\s.,'|()]*$/, '')   // bare roman tail
    .replace(/[–-]\s*$/, '')
    .replace(/(\S)\s{2,}(\S)/g, '$1 $2')
    .replace(/ओं(?=\s|$)/g, 'ॐ')
    .replace(/ओँ/g, 'ओꣳ')                          // p.3, see the header
    .trim();
}

const block = (book, page, i) => {
  const d = book[page];
  if (!d) throw new Error(`no transcript for book page ${page}`);
  const b = d.blocks[i];
  if (!b) throw new Error(`p.${page} has no block ${i}`);
  return b;
};
/** Devanagari lines of deva blocks on one page. */
function deva(book, page, ...idx) {
  return idx.flatMap((i) => {
    const b = block(book, page, i);
    if (b.type !== 'deva') throw new Error(`p.${page} block ${i} is ${b.type}, not deva`);
    return b.lines.map(clean).filter(Boolean);
  });
}
const C = (page, ...idx) => deva(COMMON, page, ...idx);
const N = (page, ...idx) => deva(NAVR, page, ...idx);
/** The Devanagari of mudra blocks; `col` picks a side of a "svami / devi" pair. */
function mudra(page, idx, col = null) {
  return idx.map((i) => {
    const b = block(COMMON, page, i);
    if (b.type !== 'mudra') throw new Error(`p.${page} block ${i} is ${b.type}, not mudra`);
    let s = b.name_deva;
    if (col != null) s = s.split('/')[col];
    return clean(s.replace(/\s+/g, ' '));
  });
}
const lines = (...parts) => parts.flat();

const tr = (d, to) => transliterate(Sanscript, d, to);
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

/** Pack clauses into recitable lines, breaking after commas. */
function pack(text, width = 56) {
  const bits = text.split(/(?<=,)\s+/);
  const out = [];
  let cur = '';
  for (const b of bits) {
    if (cur && (cur + ' ' + b).length > width) { out.push(cur); cur = b; } else cur = cur ? `${cur} ${b}` : b;
  }
  if (cur) out.push(cur);
  return out;
}

// --- mantras built from more than a block -------------------------------------

/**
 * Pranayama, pp.3-4. The book marks the three breaths inside the mantra --
 * (Puraka - Inhale), (Kumbhaka - Hold), (Rechaka - Exhale) -- and the screen
 * sets one line per breath, cut at those marks.
 */
const PRANAYAMA = (() => {
  const raw = [...block(COMMON, '3', 10).lines, ...block(COMMON, '4', 0).lines].join(' ');
  const parts = raw.split(/\((?:Puraka|Kumbhaka|Rechaka)[^)]*\)/);
  if (parts.length !== 4) throw new Error('pranayama: expected three breath marks');
  const seg = parts.slice(0, 3).map((p) => clean(p.replace(/^\s*।\s*/, '')));
  return [`${seg[0]} ।`, `${seg[1]} ।`, `${seg[2]} ॥`];
})();

/**
 * The pradhana sankalpa. The frame is the common one (pp.12-13), up to the
 * almanac slots, which the app fills ([DYNAMIC_PANCHANGAM_DATA] renders from
 * the samvatsara to "asyam shubhatithau"); then the household's purposes
 * (p.13); then Navaratri's own clause (p.286). The book's menu of further
 * purposes (satsantaana praaptyartham ...) is "use appropriate sankalpa for the
 * main puja", and the Navaratri page gives none, so none is added.
 */
const SANKALPA = (() => {
  const frame = [...block(COMMON, '12', 18).lines, ...block(COMMON, '13', 0).lines]
    .join(' ')
    .replace(/\s*–\s*/g, '-')
    .replace(/\s+/g, ' ')
    .replace('दुरितोप शान्त्यर्थं', 'दुरितोपशान्त्यर्थं');  // see the header
  const slot = frame.indexOf('*');
  const before = frame.slice(0, slot).trim();
  if (!before.endsWith('संवत्सराणां मध्ये')) throw new Error(`sankalpa frame ends "${before.slice(-30)}"`);
  const fromHere = frame.indexOf('अस्माकं');
  const after = frame.slice(fromHere).replace(/\.+$/, '').trim();
  if (!after.endsWith('शान्त्यर्थं,')) throw new Error(`sankalpa purposes end "${after.slice(-30)}"`);
  const own = block(NAVR, '286', 4).lines.join(' ')
    .replace(/^\.+/, '')
    .replace('लक्ष्मि', 'लक्ष्मी')                      // see the header
    .replace(/,(?=\S)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [...pack(before), '[DYNAMIC_PANCHANGAM_DATA]', ...pack(`${after} ${own}`)];
})();

/** Kalasha, p.15: the devi side of the bracket, and the anusvara from the roman. */
const KALASHA_VERSE = C('15', 5).map((l) => l.replace('देव(देवी)पूजार्थ', 'देवीपूजार्थं'));

/** The Vighneshwara pooja's dhoopa and deepa share one printed line, p.10. */
const [V_DHOOPA, V_DEEPA] = (() => {
  const [l] = C('10', 3);
  const [a, b] = l.split(/,\s*/);
  if (!b) throw new Error('p.10: dhoopa/deepa line has no comma');
  return [`${a} ।`, b];
})();

/** Prana Pratishtha, pp.19-26. */
const PP_VINIYOGA = lines(C('19', 9), mudra('20', [1, 2, 3, 4, 5, 6, 7]));
const PP_KARA = lines(mudra('20', [8]), mudra('21', [1, 2, 3, 4]), C('21', 5));
const PP_ANGA = lines(mudra('21', [9]), mudra('22', [1, 2, 3, 4, 5, 6]));
const PP_DHYANA = C('23', 2);
const PP_BIJA = lines(C('23', 4).flatMap((l) => l.split(/(?<=।)\s+/)), C('23', 6));
const PP_ASUNITE = C('24', 2).map((l) => l.replace('पुनररस्मासु', 'पुनरस्मासु'));
// The devi column of p.24-25, the right-hand side of each pair.
const PP_BHAVA = lines(
  mudra('24', [6, 7, 8], 1), mudra('25', [0, 1, 2, 3, 4, 5], 1),
  block(COMMON, '25', 6).lines.map((l) => clean(l.split('/')[1])),
  C('25', 8),
);
const PP_KSHEERA = C('26', 1);

// --- the lists ------------------------------------------------------------------
const normName = (n) => {
  let s = n.replace(/^ओं\s*/, 'ॐ ').replace(/\s+/g, ' ').trim();
  if (!/नमः$/.test(s)) s += ' नमः';
  return s;
};
const namavaliOf = (book, type, ...pages) =>
  pages.flatMap((p) => book[p].blocks.filter((b) => b.type === type).flatMap((b) => b.names));

const VIGHNESHWARA_16 = namavaliOf(COMMON, 'namavali', '9').map(normName);
const PEETHA = namavaliOf(COMMON, 'namavali', '18').map(normName);

const table = (page, idx) => {
  const b = block(NAVR, page, idx);
  if (b.type !== 'table') throw new Error(`p.${page} block ${idx} is ${b.type}, not table`);
  return b.rows;
};
const NAV_ANGA = [...table('291', 9), ...table('292', 1)].map(([name, limb, en]) => ({
  name: normName(name.replace(/नमः$/, '').trim()),
  act: `${limb.trim()} पूजयामि`,
  en: `Worship the ${en.replace(/^\((.*)\)$/, '$1').trim()}`,
}));
// Two-column lists, read as build-navaratri-saraswati.mjs reads them.
const twoCol = (page, idx) => N(page, idx).map((l) => l.split(/(?<=नमः)\s+(?=ॐ)/));
const navadurgaRows = twoCol('300', 5);
const NAVADURGA = [
  ...navadurgaRows.slice(0, 4).map((r) => r[0]),
  ...navadurgaRows.slice(0, 4).map((r) => r[1]),
  navadurgaRows[4][0],
];
const NAVAKANYA = twoCol('302', 20).flat();

// The kanya upacharas are printed once under the maiden's name, p.302 block 0,
// and each line is said to her.
const KANYA = (page, i) => lines(N('302', 0), N(page, i));

// --- sections -------------------------------------------------------------------
const S = {
  purva: ['Purvangam', 'பூர்வாங்கம்'],
  vigh: ['Purvangam — Vighneshwara Pooja', 'பூர்வாங்கம் — விக்னேஸ்வர பூஜை'],
  dhyana: ['Dhyanam & Avahanam', 'த்யானம் & ஆவாஹனம்'],
  prana: ['Prana Pratishtha', 'ப்ராண ப்ரதிஷ்டை'],
  shodasha: ['Shodashopachara', 'ஷோடசோபசாரம்'],
  archana: ['Archana', 'அர்ச்சனை'],
  uttara: ['Uttaranga Pooja', 'உத்தராங்க பூஜை'],
  kanya: ['Navakanya Pooja', 'நவகன்யா பூஜை'],
};

const ALL = ['main', 'punar', 'udvasana'];
const PRE = ['main', 'punar'];
const MAIN = ['main'];
const UDV = ['udvasana'];

const pg = (page) => (String(page).includes('-') ? `pp.${page}` : `p.${page}`);
const P = (page, what) => `${BOOK}, Purvanga ${pg(page)}, ${what}`;
const NR = (page, what) => `${BOOK}, Navaratri Puja ${pg(page)}, ${what}`;

// Prose reused from the Ganesha rite's book-sourced rows where the mantra is the
// same (live ganesha_standard, read 18 Oct 2026). Steps that keep the shared
// title carry the shared text, which proofread's SHARED_OK expects.
const G = {
  achamanam_phil: 'Three sips, three names, and the names are Vishnu\'s: Achyuta, Ananta, Govinda. They are the same three whoever the pooja is for, because in Smartha practice every rite opens through Vishnu before it turns to its own deity. What the step does is mark a boundary. You were doing something else a minute ago; from here you are not.',
  anga_phil: 'Twelve names of Vishnu touched to twelve places, and again they are the same twelve in any Smartha pooja whichever god it is for. The body is being named part by part before it is asked to do anything. Nothing has been offered yet and no deity has been invited; this is still the karta getting ready.',
  dhyana_phil: 'The verse never says Ganesha. Shuklambaradharam vishnum shashivarnam chaturbhujam describes a white-robed, four-armed figure the colour of the moon, and different traditions read it as Ganesha or as Vishnu. What it asks for is unambiguous: sarva-vighna-upashantaye, the quieting of every obstacle, said before anything is attempted rather than after something has gone wrong.',
  pranayama_phil: 'The only step in the whole pooja that is about breathing rather than offering. The seven worlds, the Gayatri, then the line about water and light: it is a long thing to say on a held breath, and the length is the point. In this tradition women do not perform it, which is why the app removes the step for them rather than showing it greyed out.',
  vsankalpa_meaning: 'For the pleasure of Parameshvara, through the destruction of all the sin I have accumulated, and so that the rite I am about to perform reaches its end without obstruction, I shall first worship Vighneshwara.',
  vsankalpa_phil: 'The pooja resolves twice, and this is the first. It is worth noticing that the two resolves are not the same sentence: this one asks only that the rite about to begin reach its end without obstruction, and the one later asks for everything the household actually wants. Splitting them is a kind of honesty about sequence. You do not ask for prosperity while the road is still blocked; you clear the road, and then you ask.',
  sakala_ins: 'Join the palms and salute every deity, from the world of Brahma down to the Lokaloka mountain at the edge of the worlds. Nothing is offered here; it is a salutation made before the household rite begins.',
  sakala_ins_ta: 'கைகளைக் கூப்பி, ப்ரம்மலோகம் முதல் உலகங்களின் எல்லையிலுள்ள லோகாலோக பர்வதம் வரை வாழும் அனைத்து தேவர்களையும் வணங்கவும். இங்கு எதுவும் சமர்ப்பிக்கப்படுவதில்லை; வீட்டுப் பூஜை தொடங்கும் முன் செய்யும் வணக்கம்.',
  sakala_meaning: 'To the twice-born and the gods who dwell everywhere, from the world of Brahma to the Lokaloka mountain, salutation again and again, always.',
  sakala_phil: 'Before the rite narrows to one deity it widens, once, to all of them — everything from the world of Brahma to the mountain at the edge of the worlds. It takes about four seconds and it is easy to treat as throat-clearing. It is not. A household pooja is a small, particular thing done in one room for one family, and this line places it inside something that is neither small nor particular before it begins.',
  deepa_ins: 'Light the lamps facing east while reciting this. Then apply kumkumam to the base and the rim of the lamp and offer flowers and akshatai to it.',
  deepa_ins_ta: 'கிழக்கு நோக்கி விளக்குகளை ஏற்றி இதைச் சொல்லவும். பிறகு விளக்கின் அடியிலும் விளிம்பிலும் குங்குமம் இட்டு, பூவும் அட்சதையும் சமர்ப்பிக்கவும்.',
  deepa_meaning: 'The light of the lamp is the supreme Brahman; the light of the lamp is Janardana. May the lamp take away my sin. Salutation to you, light of the lamp.',
  deepa_phil: 'The lamp is lit first and then worshipped in its own right, which is the tell. It is not illumination for the deity to be seen by; the verse calls the flame Brahman and Janardana outright. Light is the first guest, not the lighting.',
  asana_ins: 'Sprinkle a little water on your seat while reciting this, sitting OUTSIDE the seat. Then take your place on it. The seat is consecrated before the karta occupies it, not after.',
  asana_ins_ta: 'ஆஸனத்திற்கு வெளியே அமர்ந்து, இதைச் சொல்லிக்கொண்டே ஆஸனத்தின் மீது சிறிது நீரைத் தெளிக்கவும். பிறகு அதில் அமரவும். பூஜை செய்பவர் அமருவதற்கு முன்பே ஆஸனம் சுத்தி செய்யப்படுகிறது.',
  asana_meaning: 'Earth, by you the worlds are borne, and you yourself are borne by Vishnu. Bear me too, O Devi, and make this seat pure.',
  asana_phil: 'You consecrate the seat while sitting outside it, and only then take your place. Every other upachara in the pooja is offered to someone else. This one is offered to the ground under yourself, and it is asked of the earth rather than of a god — bear me, and make this seat pure. The karta is prepared like an object in the rite, because that is what they are about to become.',
  ghanta_phil: 'One sound doing two opposite jobs: agamartham tu devanam, gamanartham tu rakshasam, for the coming of the gods and the going of what should not be here. It is also the only part of the pooja the rest of the house can hear from another room, which is how everyone knows it has begun.',
  shodasha_ins: 'Offer a flower, or a blade of arugampul, at each of the sixteen names. Durva is preferred to any flower for Ganesha.',
  shodasha_ins_ta: 'பதினாறு நாமங்கள் ஒவ்வொன்றிலும் ஒரு பூ அல்லது ஒரு அருகம்புல் இதழ் சமர்ப்பிக்கவும். விநாயகருக்குப் பூவை விட அருகம்புல்லே உகந்தது.',
  shodasha_meaning: 'The sixteen names of Ganesha recited at the preliminary pooja: fair-faced, single-tusked, tawny, elephant-eared, pot-bellied, formidable, king over obstacles, the remover, the comet-bannered, chief of the ganas, moon-browed, elephant-faced, curve-trunked, winnow-eared, Heramba, and elder brother of Skanda.',
  shodasha_phil: 'Sixteen names and not one of them is a title. Fair-faced, single-tusked, tawny, elephant-eared, pot-bellied, formidable, curve-trunked, winnow-eared — every one describes a body. The archana does not tell the deity who he outranks; it tells him you have looked at him.',
  shankha_meaning: 'The conch has the sun and moon for its deity, Varuna at its middle, Prajapati at its back, and Ganga and Sarasvati at its mouth. You rose long ago from the ocean and were held in Vishnu’s hand, worshipped by all the gods: salutation to you, Panchajanya. By Vasudeva’s command, every sacred water in the three worlds abides in the conch; therefore let the conch be worshipped.',
  shankha_phil: 'The conch is worshipped, not blown. Its water is what sanctifies everything else set out for the pooja, so it is treated as a vessel that holds the sacred waters of the three worlds rather than as an instrument. The step may be skipped if there is no conch in the house, which is worth reading twice: a household vidhi that expects to be performed by real households says plainly which parts require an object you may not own.',
  atma_ins: 'Turn the mind inward for a few seconds, holding that the self dwelling within pervades the world and is one in essence with the supreme Self. Then place a little akshatai on your own head, as an act of worshipping yourself.',
  atma_ins_ta: 'சில வினாடிகள் மனதை உள்நோக்கித் திருப்பி, உள்ளே உறையும் ஆத்மா உலகெங்கும் நிறைந்தது என்றும், பரமாத்மாவுடன் ஒன்றே என்றும் நினைக்கவும். பிறகு உங்கள் தலையிலேயே சிறிது அட்சதை இட்டுக்கொள்ளவும் — அது தன்னைத் தானே பூஜிக்கும் செயல்.',
  atma_meaning: 'The body is called a temple; the living self is the eternal deity. Cast away the withered flowers of ignorance, and worship with the thought "I am That."',
  atma_phil: 'The one step in which the worshipper is the worshipped. You hold, for a few seconds, that the self inside you is the same as the one you are about to invoke into clay, and then you put akshatai on your own head. The verse is blunt about it: the body is the temple, the living self is the deity, and what you discard is not flowers but ignorance. Every other step points outward. This one turns around.',
  peetha_ins: 'Worship the seat on which the deity will be enshrined, offering a flower and akshatai at each name. The fourteen names build the seat upward from the power that holds everything, through the tortoise and the boar and the earth, to the jewelled pavilion, the golden pillar, the white parasol, the wish-giving tree, the ocean of milk, the two white whisks, and last the yoga seat itself.',
  peetha_ins_ta: 'தெய்வம் எழுந்தருளப் போகும் பீடத்தைப் பூஜிக்கவும்; ஒவ்வொரு நாமத்திலும் ஒரு பூவும் அட்சதையும் சமர்ப்பிக்கவும். இந்தப் பதினான்கு நாமங்கள் அனைத்தையும் தாங்கும் ஆதாரசக்தியிலிருந்து தொடங்கி, கூர்மம், வராகம், பூமி வழியாக, ரத்ன மண்டபம், ஸ்வர்ண ஸ்தம்பம், வெண்குடை, கற்பக விருக்ஷம், க்ஷீர ஸமுத்திரம், வெண் சாமரங்கள், இறுதியாக யோக பீடாஸனம் வரை பீடத்தைக் கட்டுகின்றன.',
  peetha_meaning: 'Salutation to the supporting power, to primordial nature, to the first tortoise, to the first boar, to Ananta, to the earth, to the jewelled pavilion, to the jewelled altar, to the golden pillar, to the white parasol, to the wish-giving tree, to the ocean of milk, to the two white whisks, and to the seat of yoga.',
  peetha_phil: 'The seat is built before the guest arrives, and built from the bottom of the cosmos upward — the power that holds everything, primordial nature, the first tortoise, the first boar, the earth, and only then the jewelled pavilion, the golden pillar, the white parasol, the wish-giving tree. Fourteen names to furnish a spot the size of a plate. The scale is the message.',
  guru_ins: 'Contemplate your own teacher, as your family tradition holds. This is the last step before the deity is meditated upon and invoked.',
  guru_ins_ta: 'உங்கள் குடும்ப மரபின்படி உங்கள் குருவை த்யானிக்கவும். தெய்வத்தை த்யானித்து ஆவாஹனம் செய்வதற்கு முந்தைய கடைசிப் படி இது.',
  guru_meaning: 'The guru is Brahma, the guru is Vishnu, the guru is the god Maheshwara; the guru is verily the supreme Brahman. To that guru, salutation.',
  guru_phil: 'The last human link before the divine one. It comes immediately before the deity is meditated on and invoked, and the placement is the argument: whatever is about to happen reaches you through someone who taught it to you, and through whoever taught them. The verse does not say the guru is like Brahma, Vishnu and Maheshwara. It says the guru is them.',
};

// Shared between the two Pranayamam screens and the two Vighneshwara Dhyanam
// screens of this rite. Written for this rite, not copied, so that a repeat here
// is never mistaken by proofread for a copy of another rite's text.
const PRANAYAMA_MEANING = 'Om, earth; Om, sky; Om, heaven; Om, the great world; Om, the world of beings; Om, the world of austerity; Om, the true. Om, we meditate on the adorable radiance of the divine Savitr; may he set our minds in motion. Om, the waters, the light, the essence, the immortal, Brahman: earth, sky and heaven, Om.';
const DHYANA_MEANING = 'One should meditate on him who wears white, who pervades all, bright as the moon, four-armed, with a gracious face, so that every obstacle is quieted.';
const ASHTOTTARA_CLOSE = 'I offer fragrant leaves and flowers of many kinds.';

// --- the steps --------------------------------------------------------------------
const STEPS = [
  // ===== Purvanga 1-7 (pp.1-6) =====
  {
    title_en: 'Achamanam', title_ta: 'ஆசமனம்', sec: 'purva', phase: 'purvangam', modes: ALL,
    deva: C('1', 4).map((l) => `${l} ।`),
    instruction_en: 'Sit facing east or north. Fold the forefinger of the right hand against the thumb and curl the other three fingers so the palm holds one spoonful of water from the uddharani. Sip it once at each of the three names.',
    instruction_ta: 'கிழக்கு அல்லது வடக்கு நோக்கி அமரவும். வலது கையின் ஆள்காட்டி விரலைக் கட்டைவிரலுடன் சேர்த்து மடக்கி, மற்ற மூன்று விரல்களையும் குவித்து, உள்ளங்கையில் ஒரு உத்தரிணி ஜலம் நிற்கும்படி வைக்கவும். ஒவ்வொரு நாமத்திற்கும் ஒரு முறை அந்த ஜலத்தை அருந்தவும்.',
    meaning_en: 'Salutations to Achyuta, who never falls away; to Ananta, who has no end; to Govinda, who recovers what is lost.',
    philosophy_en: G.achamanam_phil,
    src: P(1, 'step 1, aachamanam'),
  },
  {
    title_en: 'Anga Vandanam', title_ta: 'அங்க வந்தனம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: lines(mudra('1', [10, 11, 12, 13]), mudra('2', [0, 1, 2, 3, 4, 5]), mudra('3', [0, 1])),
    instruction_en: 'With the right hand only, touch each place as you say its name: the thumb to the right and left cheek, the ring finger to the right and left eye, the index finger to the right and left nostril, the little finger to the right and left ear, the middle finger to the right and left shoulder. Then lay the whole palm on the navel and on the crown of the head. Reach across with the right hand for the left side.',
    instruction_ta: 'வலது கையால் மட்டும், ஒவ்வொரு நாமத்தைச் சொல்லும்போதும் அதற்குரிய இடத்தைத் தொடவும்: கட்டைவிரலால் வலது, இடது கன்னங்கள்; மோதிர விரலால் வலது, இடது கண்கள்; ஆள்காட்டி விரலால் வலது, இடது நாசிகள்; சுண்டு விரலால் வலது, இடது காதுகள்; நடுவிரலால் வலது, இடது தோள்கள். பின் முழு உள்ளங்கையால் நாபியையும் உச்சந்தலையையும் தொடவும். இடது பக்கத்தைத் தொட வலது கையைக் குறுக்காகக் கொண்டு செல்லவும்.',
    meaning_en: 'Keshava, Narayana, Madhava, Govinda, Vishnu, Madhusudana, Trivikrama, Vamana, Shridhara, Hrishikesha, Padmanabha, Damodara: twelve names of Vishnu, said bare, one at each place the hand touches.',
    philosophy_en: G.anga_phil,
    src: P('1-3', 'step 1, angavandanam; bare names as printed, each with its limb and finger'),
  },
  {
    title_en: 'Vighneshwara Dhyanam', title_ta: 'விக்னேஸ்வர த்யானம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('3', 4),
    instruction_en: 'Make loose fists and gently tap both temples with the knuckles five times while reciting.',
    instruction_ta: 'இரு கைகளையும் லேசாக மடக்கி, விரல் முட்டிகளால் இரு நெற்றிப் பொட்டுகளிலும் மெதுவாக ஐந்து முறை குட்டியபடி சொல்லவும்.',
    meaning_en: DHYANA_MEANING,
    philosophy_en: G.dhyana_phil,
    src: P(3, 'step 2, vighnEshvara dhyaanam'),
  },
  {
    title_en: 'Pranayamam', title_ta: 'ப்ராணாயாமம்', sec: 'purva', phase: 'purvangam', modes: PRE, gender: 'filter_male_only',
    deva: PRANAYAMA,
    instruction_en: 'With the right hand, fold the index and middle fingers into the palm. Close the right nostril with the thumb and breathe in through the left on the first line; close the left nostril too with the ring and little fingers and hold through the second; open the right nostril and breathe out on the third. Then touch the right ear with the right hand.',
    instruction_ta: 'வலது கையில் ஆள்காட்டி விரலையும் நடுவிரலையும் உள்ளங்கையில் மடக்கவும். கட்டைவிரலால் வலது நாசியை மூடி, முதல் வரியைச் சொல்லியபடி இடது நாசி வழியாக மூச்சை இழுக்கவும்; மோதிர விரல், சுண்டு விரல்களால் இடது நாசியையும் மூடி, இரண்டாம் வரி முடியும் வரை மூச்சை நிறுத்தவும்; பின் வலது நாசியைத் திறந்து மூன்றாம் வரியைச் சொல்லியபடி மூச்சை வெளியிடவும். இறுதியில் வலது கையால் வலது காதைத் தொடவும்.',
    meaning_en: PRANAYAMA_MEANING,
    philosophy_en: G.pranayama_phil,
    src: P('3-4', 'step 3, praaNaayaamaha; lines cut at the book\'s Puraka, Kumbhaka and Rechaka marks'),
  },
  {
    title_en: 'Vighneshwara Sankalpam', title_ta: 'விக்னேஸ்வர ஸங்கல்பம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('4', 6),
    instruction_en: 'Rest the left palm, facing up, on the right thigh and cross the right palm over it. Resolve to worship Vighneshwara first, so that the Navaratri pooja that follows reaches its end without obstacle. Wash the hands afterwards.',
    instruction_ta: 'இடது உள்ளங்கையை மேல்நோக்கியபடி வலது தொடையின் மேல் வைத்து, வலது உள்ளங்கையை அதன் மேல் குறுக்காக வைக்கவும். பின்வரும் நவராத்திரி பூஜை தடையின்றி நிறைவேற, முதலில் விக்னேஸ்வர பூஜை செய்வதாக ஸங்கல்பம் செய்யவும். பிறகு கைகளைக் கழுவவும்.',
    meaning_en: G.vsankalpa_meaning,
    philosophy_en: G.vsankalpa_phil,
    src: P(4, 'step 4, sankalpaha'),
  },
  {
    title_en: 'Sakala Devata Vandanam', title_ta: 'ஸகல தேவதா வந்தனம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('4', 10),
    instruction_en: G.sakala_ins, instruction_ta: G.sakala_ins_ta,
    meaning_en: G.sakala_meaning, philosophy_en: G.sakala_phil,
    src: P(4, 'step 5, sakala dEvataa vandanam'),
  },
  {
    title_en: 'Deepa Pooja', title_ta: 'தீப பூஜை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('5', 3),
    instruction_en: G.deepa_ins, instruction_ta: G.deepa_ins_ta,
    meaning_en: G.deepa_meaning, philosophy_en: G.deepa_phil,
    src: P(5, 'step 5, deepa mantraha'),
  },
  {
    title_en: 'Asana Pooja', title_ta: 'ஆஸன பூஜை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('5', 8),
    instruction_en: G.asana_ins, instruction_ta: G.asana_ins_ta,
    meaning_en: G.asana_meaning, philosophy_en: G.asana_phil,
    src: P(5, 'step 6, aasana poojaa'),
  },
  {
    title_en: 'Ghanta Pooja', title_ta: 'கண்டா பூஜை (மணி)', sec: 'purva', phase: 'purvangam', modes: ALL,
    deva: C('5', 13),
    instruction_en: 'Apply sandal paste to the handle of the bell, then ring it to welcome the deity.',
    instruction_ta: 'மணியின் கைப்பிடியில் சந்தனம் இட்டு, பின் தேவதையை வரவேற்க மணியை அடிக்கவும்.',
    meaning_en: 'I first make the sound of the bell, for the coming of the gods and the going of the rakshasas: it is the sign by which the deities are called.',
    philosophy_en: G.ghanta_phil,
    src: P(5, 'step 7, ghaNTaa poojaa'),
  },

  // ===== Purvanga 8: the Vighneshwara pooja (pp.6-12) =====
  {
    title_en: 'Vighneshwara Dhyanam (again)', title_ta: 'விக்னேஸ்வர த்யானம் (மீண்டும்)', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('6', 6),
    instruction_en: 'The small Ganesha pooja begins with the same verse. Tap both temples five times with loose fists while reciting it.',
    instruction_ta: 'சிறிய விநாயகர் பூஜை இதே ஸ்லோகத்துடன் தொடங்குகிறது. லேசாக மடக்கிய கைகளால் இரு நெற்றிப் பொட்டுகளிலும் ஐந்து முறை குட்டியபடி சொல்லவும்.',
    meaning_en: DHYANA_MEANING,
    philosophy_en: 'The verse that opened the morning is said again because a new rite starts here, inside the larger one. The Vighneshwara pooja has its own beginning, and every beginning in the rite is marked the same way.',
    src: P(6, 'step 8, vighnEshvara dhyaanam'),
  },
  {
    title_en: 'Vighneshwara Avahanam', title_ta: 'விக்னேஸ்வர ஆவாஹனம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: lines(C('6', 10), C('7', 2)),
    instruction_en: 'Shape a small cone of turmeric mixed with water and set it before you. If you have learnt the Vedic intonation, say the first verse; otherwise begin at agajanana. Invite Vighneshwara into the turmeric and offer akshatai.',
    instruction_ta: 'மஞ்சளை ஜலத்தில் பிசைந்து சிறு கூம்பாகச் செய்து முன்னே வைக்கவும். வேத ஸ்வரத்துடன் கற்றவர்கள் முதல் மந்த்ரத்தைச் சொல்லவும்; மற்றவர்கள் "அகஜானன" என்பதிலிருந்து தொடங்கவும். மஞ்சளில் விக்னேஸ்வரரை ஆவாஹனம் செய்து அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'We call on you, lord of the ganas, poet among poets, most renowned, eldest king of prayers, lord of sacred speech: hear us and take your seat with your protection. We worship day and night the single-tusked, elephant-faced one, sun to the lotus of Parvati\'s face, who gives many gifts to his devotees. In this turmeric image I meditate on Vighneshwara and invoke him.',
    philosophy_en: 'Two invocations are printed and the karta takes the one they can say properly. The Vedic verse needs its accents right; the simpler verse needs only sincerity, and both bring the same Ganesha into the same pinch of turmeric.',
    src: P('6-7', 'step 8, praarthanaa: the Vedic verse for those who know its intonation, and the verse for everyone else'),
  },
  {
    title_en: 'Vighneshwara Asanam', title_ta: 'விக்னேஸ்வர ஆஸனம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('7', 6),
    instruction_en: 'Offer a few grains of akshatai at the turmeric Ganesha as his seat.',
    instruction_ta: 'மஞ்சள் பிள்ளையாருக்கு ஆஸனமாகச் சில அக்ஷதைகளைச் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer a seat.',
    philosophy_en: 'The first courtesy to any guest is a place to sit. Akshatai stands in for the seat, as it will for anything the household does not have to hand.',
    src: P(7, 'step 8, aasanam'),
  },
  {
    title_en: 'Vighneshwara Padyam', title_ta: 'விக்னேஸ்வர பாத்யம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('7', 9),
    instruction_en: 'Pour one uddharani of water into a cup, for washing his feet.',
    instruction_ta: 'பாதம் கழுவுவதற்காக ஒரு உத்தரிணி ஜலத்தை ஒரு கிண்ணத்தில் விடவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer water for the feet.',
    philosophy_en: 'Water for the feet is what a traveller is given at the door. Ganesha is received into his cone of turmeric like someone who has walked a long way to come.',
    src: P(7, 'step 8, paadyam'),
  },
  {
    title_en: 'Vighneshwara Arghyam', title_ta: 'விக்னேஸ்வர அர்க்யம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('7', 13),
    instruction_en: 'Pour one uddharani of water, with a little sandal, akshatai and a flower in it, into the cup as a welcome.',
    instruction_ta: 'சிறிது சந்தனம், அக்ஷதை, புஷ்பம் கலந்த ஒரு உத்தரிணி ஜலத்தை வரவேற்பாகக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer arghyam, the water of welcome.',
    philosophy_en: 'Arghyam is the honoured guest\'s water, set apart by what is added to it. The sandal and the flower are what turn plain water into a welcome.',
    src: P(7, 'step 8, arghyam'),
  },
  {
    title_en: 'Vighneshwara Achamaniyam', title_ta: 'விக்னேஸ்வர ஆசமனீயம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 0),
    instruction_en: 'Pour one uddharani of water into the cup, for him to sip.',
    instruction_ta: 'அவர் அருந்துவதற்காக ஒரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer water to sip.',
    philosophy_en: 'The guest who has washed is given water to sip, as the karta sipped at the very start. The deity receives the same purifications the worshipper used on themselves.',
    src: P(8, 'step 8, aachamaneeyam'),
  },
  {
    title_en: 'Vighneshwara Snanam', title_ta: 'விக்னேஸ்வர ஸ்நானம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 3),
    instruction_en: 'Dip a flower in water and sprinkle a little over the turmeric Ganesha, as his bath.',
    instruction_ta: 'ஒரு புஷ்பத்தை ஜலத்தில் நனைத்து, மஞ்சள் பிள்ளையாரின் மேல் ஸ்நானமாகச் சிறிது தெளிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer a bath.',
    philosophy_en: 'A cone of turmeric would dissolve under a real bath, so it is bathed with a flower dipped in water. The gesture is fitted to the image rather than dropped.',
    src: P(8, 'step 8, snaanam'),
  },
  {
    title_en: 'Vighneshwara Achamaniyam after Snanam', title_ta: 'விக்னேஸ்வர ஸ்நானாநந்தர ஆசமனீயம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 6),
    instruction_en: 'Pour one more uddharani of water into the cup, for sipping after the bath.',
    instruction_ta: 'ஸ்நானத்திற்குப் பின் அருந்துவதற்காக இன்னொரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'Salutations to Vighneshwara: after the bath, I offer water to sip.',
    philosophy_en: 'Sipping water after bathing is ordinary good practice for anyone, and the rite keeps even this small courtesy in its place.',
    src: P(8, 'step 8, snaanaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Vighneshwara Vastram', title_ta: 'விக்னேஸ்வர வஸ்த்ரம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 9),
    instruction_en: 'Offer a set of new clothes.',
    instruction_ta: 'புதிய வஸ்திரங்களைச் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer a pair of garments.',
    philosophy_en: 'Vastrayugmam, a pair of cloths, upper and lower, as any guest would be given. Dressing the deity is the moment a visit becomes a stay.',
    src: P(8, 'step 8, vastrayugmam'),
  },
  {
    title_en: 'Vighneshwara Upaveetam', title_ta: 'விக்னேஸ்வர உபவீதம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 12),
    instruction_en: 'Offer a new sacred thread.',
    instruction_ta: 'புதிய யஜ்ஞோபவீதம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer the sacred thread.',
    philosophy_en: 'Ganesha is given the yajnopavitam as one who keeps the Vedic rites, the same thread a boy receives at his upanayanam.',
    src: P(8, 'step 8, yajnyOpaveetam'),
  },
  {
    title_en: 'Vighneshwara Gandham', title_ta: 'விக்னேஸ்வர கந்தம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('8', 15),
    instruction_en: 'Anoint the turmeric Ganesha with sandal paste, then put turmeric and kumkumam over the sandal.',
    instruction_ta: 'மஞ்சள் பிள்ளையாருக்குச் சந்தனம் இட்டு, அதன் மேல் மஞ்சளும் குங்குமமும் இடவும்.',
    meaning_en: 'Salutations to Vighneshwara: I apply sandal paste, and over the sandal I offer turmeric and kumkumam.',
    philosophy_en: 'Sandal first and colour on top of it, the order in which a forehead is dressed. One rubric covers both because it is one anointing.',
    src: P(8, 'step 8, gandhaan dhaarayaami; one rubric for sandal and kunkum'),
  },
  {
    title_en: 'Vighneshwara Abharanam', title_ta: 'விக்னேஸ்வர ஆபரணம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('9', 0),
    instruction_en: 'Offer any ornament.',
    instruction_ta: 'ஏதேனும் ஒரு ஆபரணத்தைச் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer an ornament.',
    philosophy_en: 'Any ornament will do. What matters is not its worth but that nothing which honours a guest is left out.',
    src: P(9, 'step 8, aabharaNam'),
  },
  {
    title_en: 'Vighneshwara Akshatai', title_ta: 'விக்னேஸ்வர அக்ஷதை', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('9', 4),
    instruction_en: 'Offer akshatai.',
    instruction_ta: 'அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer unbroken rice.',
    philosophy_en: 'Akshata means unbroken. Grain that has not been split is the simplest whole thing a household has, offered as a sign that the worship is meant whole.',
    src: P(9, 'step 8, akSHataan'),
  },
  {
    title_en: 'Vighneshwara Pushpam', title_ta: 'விக்னேஸ்வர புஷ்பம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('9', 8),
    instruction_en: 'Offer a garland, then begin to worship with flowers, or with durva grass if you have it.',
    instruction_ta: 'மாலை சமர்ப்பித்து, புஷ்பங்களால், கிடைத்தால் அருகம்புல்லால், பூஜிக்கத் தொடங்கவும்.',
    meaning_en: 'Salutations to Vighneshwara: I offer a garland of flowers; I worship with flowers.',
    philosophy_en: 'The garland is the last of the upacharas and the flowers that follow it open the archana. Durva is preferred because Ganesha is said to love the plain grass more than any bloom.',
    src: P(9, 'step 8, puSHpamaalaam; one rubric for garland and flowers'),
  },
  {
    title_en: 'Vighneshwara Shodasha Nama Archana', title_ta: 'விக்னேஸ்வர ஷோடஶ நாம அர்ச்சனை', sec: 'vigh', phase: 'purvangam', modes: PRE,
    archana: { rows: VIGHNESHWARA_16.map((n) => ({ name: n, act: null, en: 'Offer a flower or a blade of durva', ta: 'புஷ்பம் அல்லது அருகம்புல் சமர்ப்பிக்கவும்' })), expect: 16 },
    instruction_en: G.shodasha_ins, instruction_ta: G.shodasha_ins_ta,
    meaning_en: G.shodasha_meaning, philosophy_en: G.shodasha_phil,
    src: P('9-10', 'step 8, archanaa, sixteen names'),
  },
  {
    title_en: 'Vighneshwara Patra Pushpa Samarpanam', title_ta: 'விக்னேஸ்வர பத்ர புஷ்ப ஸமர்ப்பணம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('9', 14),
    instruction_en: 'When the sixteen names are done, offer all the remaining leaves and flowers together.',
    instruction_ta: 'பதினாறு நாமங்கள் முடிந்ததும், மீதமுள்ள இலைகளையும் புஷ்பங்களையும் ஒன்றாகச் சமர்ப்பிக்கவும்.',
    meaning_en: `Salutations to Mahaganapati: ${ASHTOTTARA_CLOSE}`,
    philosophy_en: 'The archana ends with whatever is left in the plate offered at once. Nothing gathered for the deity is kept back.',
    src: P(9, 'step 8, the close of the archana'),
  },
  {
    title_en: 'Vighneshwara Dhoopam', title_ta: 'விக்னேஸ்வர தூபம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: [V_DHOOPA],
    instruction_en: 'Light the incense and wave it before the turmeric Ganesha.',
    instruction_ta: 'ஊதுபத்தியை ஏற்றி மஞ்சள் பிள்ளையாரின் முன் காட்டவும்.',
    meaning_en: 'I offer incense for him to smell.',
    philosophy_en: 'Incense is offered to the sense of smell, which is why the verb is aghrapayami, "I cause to smell". Each upachara speaks to one sense of the guest.',
    src: P(10, 'step 8, dhoopam; the printed line holds dhoopa and deepa, cut at its comma'),
  },
  {
    title_en: 'Vighneshwara Deepam', title_ta: 'விக்னேஸ்வர தீபம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: [V_DEEPA],
    instruction_en: 'Wave a lamp with a wick dipped in ghee before him.',
    instruction_ta: 'நெய்யில் நனைத்த திரியுடன் ஏற்றிய தீபத்தை அவர் முன் காட்டவும்.',
    meaning_en: 'I show the lamp.',
    philosophy_en: 'The lamp is shown, darshayami, not given. The guest is meant to see by it, and to be seen.',
    src: P(10, 'step 8, deepam'),
  },
  {
    title_en: 'Vighneshwara Dhoopa Deepa Achamaniyam', title_ta: 'விக்னேஸ்வர தூப தீபாநந்தர ஆசமனீயம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('10', 6),
    instruction_en: 'Pour a spoon of water into the cup.',
    instruction_ta: 'ஒரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'After the incense and the lamp, I offer water to sip.',
    philosophy_en: 'Water closes each group of offerings. It is the rite\'s punctuation, a pause between one kind of service and the next.',
    src: P(10, 'step 8, dhoopa deepaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Vighneshwara Naivedya Prokshanam', title_ta: 'விக்னேஸ்வர நைவேத்ய ப்ரோக்ஷணம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: lines(C('11', 3), C('11', 6)),
    instruction_en: 'Clean the floor in front with a little water and set the naivedyam there on a plate or a plantain leaf; a fruit or a piece of jaggery is enough. Sprinkle water on it with the first line, then circle the plate clockwise three times with water from the uddharani as you say the Gayatri.',
    instruction_ta: 'முன்னே தரையைச் சிறிது ஜலத்தால் சுத்தம் செய்து, தட்டிலோ வாழையிலையிலோ நைவேத்யத்தை வைக்கவும்; ஒரு பழமோ சிறிது வெல்லமோ போதும். முதல் வரியுடன் அதன் மேல் ஜலம் தெளித்து, காயத்ரீ சொல்லும்போது உத்தரிணி ஜலத்தால் தட்டை மூன்று முறை வலமாகச் சுற்றவும்.',
    meaning_en: 'Om, earth, sky and heaven. We meditate on the adorable radiance of the divine Savitr; may he set our minds in motion.',
    philosophy_en: 'Before Ganesha eats, the food is made fit to be offered, with the oldest words the household knows. Even a single banana is purified as a feast would be.',
    src: P(11, 'step 8, naivEdyamantraaha: the sprinkling and the threefold circling'),
  },
  {
    title_en: 'Vighneshwara Parishechanam', title_ta: 'விக்னேஸ்வர பரிஷேசனம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: lines(C('11', 10), C('11', 12)),
    instruction_en: 'Take water in the uddharani again and circle the plate clockwise as you say this. Say the first line in the morning and the second in the evening.',
    instruction_ta: 'மீண்டும் உத்தரிணியில் ஜலம் எடுத்து, இதைச் சொல்லியபடி தட்டை வலமாகச் சுற்றவும். காலையில் முதல் வரியையும், மாலையில் இரண்டாம் வரியையும் சொல்லவும்.',
    meaning_en: 'Divine Savitr, impel us. In the morning: I sprinkle you, truth, with order. In the evening: I sprinkle you, order, with truth.',
    philosophy_en: 'The two lines differ only in which word comes first, satya or rita. Morning and evening are kept apart even in a ring of water, because the rite is always placed in time.',
    src: P(11, 'step 8, the morning and evening parishechana lines'),
  },
  {
    title_en: 'Vighneshwara Amritopastaranam', title_ta: 'விக்னேஸ்வர அம்ருதோபஸ்தரணம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('11', 16),
    instruction_en: 'Pour a spoon of water into the cup, as the bed for the food.',
    instruction_ta: 'உணவுக்கு அடியாக ஒரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'You are the immortal bed.',
    philosophy_en: 'The water poured before the food is called its bed, upastarana, and the water after it its covering. The meal is wrapped in water on both sides, as it is for anyone who eats with this rite.',
    src: P(11, 'step 8, amRtOpastaraNamasi'),
  },
  {
    title_en: 'Vighneshwara Pranahuti', title_ta: 'விக்னேஸ்வர ப்ராணாஹுதி', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('11', 21),
    instruction_en: 'At each svaha, gesture with the right hand from the food towards Ganesha, as if feeding him.',
    instruction_ta: 'ஒவ்வொரு ஸ்வாஹாவிற்கும், உணவிலிருந்து பிள்ளையாரை நோக்கி ஊட்டுவது போல் வலது கையால் காட்டவும்.',
    meaning_en: 'Om, to prana, svaha; to apana, svaha; to vyana, svaha; to udana, svaha; to samana, svaha; to Brahman, svaha.',
    philosophy_en: 'The food goes first to the five breaths and then to Brahman: the deity is fed the way a body is fed, through the breaths that take food in and turn it into life.',
    src: P('11-12', 'step 8, the six praaNaahutis'),
  },
  {
    title_en: 'Vighneshwara Amritapaniyam', title_ta: 'விக்னேஸ்வர அம்ருதபானீயம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('12', 1),
    instruction_en: 'Pour a spoon of water into the cup, as water to drink with the meal.',
    instruction_ta: 'உணவின் நடுவே அருந்துவதற்காக ஒரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'Now and again during the meal, I offer the nectar of water to drink.',
    philosophy_en: 'Madhye madhye, now and again: a good host keeps the guest\'s cup filled while they eat, and the rite remembers to.',
    src: P(12, 'step 8, madhyE madhyE amRtapaaneeyam'),
  },
  {
    title_en: 'Vighneshwara Amritapidhanam', title_ta: 'விக்னேஸ்வர அம்ருதாபிதானம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('12', 4),
    instruction_en: 'Pour a spoon of water into the cup, to close the meal.',
    instruction_ta: 'உணவை நிறைவு செய்ய ஒரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'You are the immortal covering. I offer water to sip.',
    philosophy_en: 'Apidhana is a lid. The water that ends the meal is named its cover, closing what the water before it opened.',
    src: P(12, 'step 8, amRtaapidhaanamasi'),
  },
  {
    title_en: 'Vighneshwara Uttaraposhanam', title_ta: 'விக்னேஸ்வர உத்தராபோஶனம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('12', 7),
    instruction_en: 'Pour one more spoon of water into the cup.',
    instruction_ta: 'இன்னொரு உத்தரிணி ஜலத்தைக் கிண்ணத்தில் விடவும்.',
    meaning_en: 'I offer the last sip of water after the meal.',
    philosophy_en: 'Uttaraposhana is the sip taken at the very end of a meal. Ganesha is given the whole order of eating, nothing skipped because the meal is small.',
    src: P(12, 'step 8, uttaraapOshanam'),
  },
  {
    title_en: 'Vighneshwara Karpura Neerajanam', title_ta: 'விக்னேஸ்வர கற்பூர நீராஜனம்', sec: 'vigh', phase: 'purvangam', modes: PRE,
    deva: C('12', 10),
    instruction_en: 'Light camphor and wave it clockwise in front of the turmeric Ganesha.',
    instruction_ta: 'கற்பூரம் ஏற்றி, மஞ்சள் பிள்ளையாரின் முன் வலமாகச் சுற்றிக் காட்டவும்.',
    meaning_en: 'I show the camphor light.',
    philosophy_en: 'The small pooja ends in camphor, as the large one will. Camphor burns away completely and leaves nothing, which is why it closes a rite.',
    src: P(12, 'step 8, karpoora neeraajanam'),
  },

  // ===== Purvanga 9-10: pranayama, and the Navaratri sankalpa =====
  {
    title_en: 'Pranayamam (again)', title_ta: 'ப்ராணாயாமம் (மீண்டும்)', sec: 'purva', phase: 'purvangam', modes: PRE, gender: 'filter_male_only',
    deva: PRANAYAMA,
    instruction_en: 'Take a few grains of akshatai in the hand and do the pranayamam once more, in full: fold the index and middle fingers, breathe in through the left nostril on the first line, hold with both nostrils closed through the second, breathe out through the right on the third. Then touch the right ear with the right hand.',
    instruction_ta: 'கையில் சில அக்ஷதைகளை எடுத்துக்கொண்டு, ப்ராணாயாமத்தை மீண்டும் முழுமையாகச் செய்யவும்: ஆள்காட்டி, நடு விரல்களை மடக்கி, முதல் வரியில் இடது நாசி வழியாக மூச்சை இழுத்து, இரண்டாம் வரியில் இரு நாசிகளையும் மூடி நிறுத்தி, மூன்றாம் வரியில் வலது நாசி வழியாக வெளியிடவும். பின் வலது கையால் வலது காதைத் தொடவும்.',
    meaning_en: PRANAYAMA_MEANING,
    philosophy_en: 'The breath is steadied a second time because what comes next is the resolve for the Navaratri pooja itself. The first pranayamam readied the karta to begin; this one readies them to promise.',
    src: P(12, 'step 9, praaNaayaamaha, printed in short as the full pranayama of step 3 (pp.3-4), shown here in full'),
  },
  {
    title_en: 'Sankalpam', title_ta: 'ஸங்கல்பம்', sec: 'purva', phase: 'purvangam', modes: ALL, dynamic: true,
    deva: SANKALPA,
    instruction_en: 'Keep the akshatai in the left palm and rest it, palm up, on the right thigh, with the right palm crossed over it. Recite the day and place, and the resolve to worship Durga, Lakshmi and Saraswati. At the end, drop the akshatai to the north and wash the hand.',
    instruction_ta: 'அக்ஷதையை இடது உள்ளங்கையில் வைத்து, அதை மேல்நோக்கியபடி வலது தொடையின் மேல் வைத்து, வலது உள்ளங்கையை அதன் மேல் குறுக்காக மூடவும். நாள், இடம் இவற்றைச் சொல்லி, துர்கா லக்ஷ்மீ ஸரஸ்வதீ பூஜை செய்வதாக ஸங்கல்பம் செய்யவும். முடிவில் அக்ஷதையை வடக்குப் பக்கம் போட்டுக் கையைக் கழுவவும்.',
    meaning_en: 'For the removal of all my wrongs and for the pleasure of the Supreme Lord: at this auspicious moment, in the second half of Brahma\'s life, in the Shveta Varaha kalpa, in the age of Vaivasvata Manu, in the first quarter of the Kali age of the twenty-eighth cycle, on the continent of Jambu, in the land of Bharata, south of Meru, in the Shaka era, in this year among the sixty that begin with Prabhava, on this day so described: for the welfare, steadiness, strength, victory, long life, health and prosperity of ourselves and our household, for every auspicious thing and the quieting of every ill, and to win the grace of Sri Durga, Lakshmi and Saraswati, I shall perform the worship of Sri Durga, Lakshmi and Saraswati, and as part of it the worship of the kalasham.',
    philosophy_en: 'One resolve, three goddesses. Navaratri is often told as three nights each of Durga, Lakshmi and Saraswati, but the sankalpam names all three together every day: what is being asked for is protection, prosperity and understanding at once, because a household needs all three at once.',
    src: `${BOOK}, Purvanga pp.12-13 step 10, pradhaana poojaa sankalpaha (frame and purposes), with the Navaratri clause and its rubric from p.286`,
  },

  // ===== Purvanga 11-16 (pp.14-19) =====
  {
    title_en: 'Vighneshwara Udyapanam', title_ta: 'விக்னேஸ்வர உத்யாபனம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: lines(C('14', 1), C('14', 4)),
    instruction_en: 'Move the turmeric Ganesha a little towards the north. Take back the flowers offered to him, touch them to your eyes and place them on your head, or give them to the women of the house. Then wash the hands with a spoon of water.',
    instruction_ta: 'மஞ்சள் பிள்ளையாரைச் சிறிது வடக்குப் பக்கம் நகர்த்தவும். அவருக்குச் சமர்ப்பித்த புஷ்பங்களைப் பக்தியுடன் எடுத்து, கண்களில் ஒற்றித் தலையில் வைக்கவும், அல்லது வீட்டுப் பெண்களுக்குக் கொடுக்கவும். பின் ஒரு உத்தரிணி ஜலத்தால் கைகளைக் கழுவவும்.',
    meaning_en: 'Curve-trunked, mighty-bodied, bright as a crore of suns: make all my undertakings free of obstacles, always, O God. I establish Sri Vighneshwara back in his own place, for what is good, for well-being, and so that he may come again. I receive Vighneshwara\'s grace upon my head. Touching water, I wash.',
    philosophy_en: 'The small pooja is closed before the large one opens. Ganesha is thanked, moved a little north and asked to come again, so that nothing invoked is left standing when the Goddess is invited.',
    src: P(14, 'step 11, vighnEshvara udyaapanam, with apa upaspRshya'),
  },
  {
    title_en: 'Kalasha Gandham', title_ta: 'கலச கந்தம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('14', 9),
    instruction_en: 'Apply sandal paste to the water vessel, the panchapatram, then turmeric and kumkumam over the sandal.',
    instruction_ta: 'ஜலபாத்திரமான பஞ்சபாத்திரத்திற்குச் சந்தனம் இட்டு, அதன் மேல் மஞ்சளும் குங்குமமும் இடவும்.',
    meaning_en: 'On the vessel I place divine, fragrant sandal; over the sandal I offer turmeric and kumkumam.',
    philosophy_en: 'The vessel that has been handing out water all morning is now itself worshipped. What serves the rite is honoured by it, and the water it holds is about to be made holy.',
    src: P(14, 'step 12, kalasha poojaa; one rubric for sandal and vermilion'),
  },
  {
    title_en: 'Kalasha Tirtha Avahanam', title_ta: 'கலச தீர்த்த ஆவாஹனம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('15', 1),
    instruction_en: 'Place a few tulasi leaves or flowers in the water of the vessel as you name the seven rivers.',
    instruction_ta: 'ஏழு நதிகளின் பெயர்களைச் சொல்லியபடி, பாத்திரத்தின் ஜலத்தில் சில துளசி இலைகளையோ புஷ்பங்களையோ இடவும்.',
    meaning_en: 'Salutations to Ganga, to Yamuna, to Godavari, to Saraswati, to Narmada, to Sindhu, to Kaveri. I invoke the seven crore great sacred waters.',
    philosophy_en: 'Seven rivers are named over a vessel in a home. The water is not claimed to be the Ganga; the rivers are asked to come into it, which is a different kind of sentence.',
    src: P(15, 'step 12, the seven rivers'),
  },
  {
    title_en: 'Kalasha Abhimantranam', title_ta: 'கலச அபிமந்த்ரணம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: KALASHA_VERSE,
    instruction_en: 'Cover the mouth of the vessel with the right palm and recite.',
    instruction_ta: 'வலது உள்ளங்கையால் பாத்திரத்தின் வாயை மூடியபடி சொல்லவும்.',
    meaning_en: 'At the mouth of the vessel dwells Vishnu, at its neck Rudra, at its base Brahma, and in its middle the hosts of mothers. In its belly are all the oceans and the earth with its seven continents; the Rig, Yajur, Sama and Atharva Vedas with all their limbs dwell in the water of the vessel. Ganga, Yamuna, Godavari, Saraswati, Narmada, Sindhu and Kaveri: be present in this water. May all the seas, rivers, sacred fords, streams and lakes, destroyers of sin, come for the worship of the Goddess.',
    philosophy_en: 'The palm over the vessel holds in what the verse has called into it. The whole cosmos is placed inside a pot of water so that the water can then make everything else fit for worship.',
    src: P('15-16', 'step 12, kalashasya mukhE; the feminine of the book\'s dEva(dEvee) alternative'),
  },
  {
    title_en: 'Shankha Pooja', title_ta: 'ஶங்க பூஜை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('16', 3),
    instruction_en: 'If there is no conch in the house, skip this screen and the next. Set the conch on a firm stand, anoint it with sandal paste and kumkumam, and fill it with water from the panchapatram while saying the Gayatri or Om three times.',
    instruction_ta: 'வீட்டில் ஶங்கு இல்லையென்றால் இதையும் அடுத்ததையும் தவிர்க்கவும். ஶங்கை உறுதியான பீடத்தில் வைத்து, சந்தனமும் குங்குமமும் இட்டு, காயத்ரீ அல்லது ஓம் மூன்று முறை சொல்லிப் பஞ்சபாத்திரத்திலிருந்து ஜலம் நிரப்பவும்.',
    meaning_en: G.shankha_meaning,
    philosophy_en: G.shankha_phil,
    src: P('16-17', 'step 13, shankha poojaa; may be skipped if there is no conch'),
  },
  {
    title_en: 'Shankha Archana', title_ta: 'ஶங்க அர்ச்சனை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('17', 2),
    instruction_en: 'If there is no conch, skip this. Offer flowers and akshatai to the conch at each name, then sprinkle its water over everything set out for the pooja and refill it from the panchapatram.',
    instruction_ta: 'ஶங்கு இல்லையென்றால் இதைத் தவிர்க்கவும். ஒவ்வொரு நாமத்திலும் ஶங்கிற்குப் புஷ்பமும் அக்ஷதையும் சமர்ப்பித்து, பின் அதன் ஜலத்தைப் பூஜைக்கு வைத்துள்ள எல்லாப் பொருட்களின் மேலும் தெளித்து, பஞ்சபாத்திரத்திலிருந்து மீண்டும் நிரப்பவும்.',
    meaning_en: 'Salutations to the conch, to Parjanya, to Panchajanya; am, to the orb of the sun; ram, to the orb of fire; sam, to the orb of the moon; to the seven crore great sacred waters; to the king of conches. I offer all the upacharas.',
    philosophy_en: 'Sun, fire and moon are named with their seed syllables because the conch is held to contain all three lights. Its water then goes over everything laid out for the pooja, which is what the conch is worshipped for.',
    src: P(17, 'step 13, the names, and the sprinkling'),
  },
  {
    title_en: 'Atma Pooja', title_ta: 'ஆத்ம பூஜை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('18', 3),
    instruction_en: G.atma_ins, instruction_ta: G.atma_ins_ta,
    meaning_en: G.atma_meaning, philosophy_en: G.atma_phil,
    src: P(18, 'step 14, aatma poojaa'),
  },
  {
    title_en: 'Peetha Pooja', title_ta: 'பீட பூஜை', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: PEETHA,
    instruction_en: G.peetha_ins, instruction_ta: G.peetha_ins_ta,
    meaning_en: G.peetha_meaning, philosophy_en: G.peetha_phil,
    src: P('18-19', 'step 15, peeTHa poojaa, fourteen names'),
  },
  {
    title_en: 'Guru Dhyanam', title_ta: 'குரு த்யானம்', sec: 'purva', phase: 'purvangam', modes: PRE,
    deva: C('19', 3),
    instruction_en: G.guru_ins, instruction_ta: G.guru_ins_ta,
    meaning_en: G.guru_meaning, philosophy_en: G.guru_phil,
    src: P(19, 'step 16, guru dhyaanam'),
  },

  // ===== Purvanga 17: the Navaratri dhyana and avahana (pp.286-287) =====
  {
    title_en: 'Dhyanam', title_ta: 'த்யானம்', sec: 'dhyana', phase: 'pradhana', modes: MAIN,
    deva: N('286', 9),
    instruction_en: 'With akshatai and flowers in the hand, close the eyes and hold the form of the Goddess in mind: the slayer of Mahisha, riding the lion. Then offer the flowers and akshatai at the kalasham or image. Say kalashe if she is in the kalasham, bimbe if in an image.',
    instruction_ta: 'கையில் அக்ஷதையும் புஷ்பமும் வைத்துக்கொண்டு, கண்களை மூடி தேவியின் வடிவத்தை மனதில் நிறுத்தவும் — மஹிஷனை வதைத்தவள், ஸிம்ஹ வாஹினி. பின் கலசத்திலோ விக்ரஹத்திலோ புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும். கலசத்தில் எனில் "கலசே", விக்ரஹத்தில் எனில் "பிம்பே" என்று சொல்லவும்.',
    meaning_en: 'Slayer of Mahisha, great Goddess, maiden riding the lion, who threatens the demons, auspicious one who yields every wish: I meditate on Durga, dwelling at the centre of my being. Come, giver of boons, who throws down the pride of demons; accept this worship, gracious one, beloved of Shankara. This water holds every sacred river and every god: come into this vessel and stay with the hosts of gods, Goddess Durga, and make yourself present here. In this kalasham (this image) I meditate on Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Nabhimadhye vyavasthitam, "dwelling at the centre". The Goddess is first found within and only then asked into the pot. The kalasham does not bring her; it gives the worship somewhere to face.',
    src: NR(286, 'dhyaanam (Purvanga step 17)'),
  },
  {
    title_en: 'Avahanam', title_ta: 'ஆவாஹனம்', sec: 'dhyana', phase: 'pradhana', modes: MAIN,
    deva: N('287', 3),
    instruction_en: 'Invite the Goddess with folded hands and offer flowers and akshatai at the kalasham or image.',
    instruction_ta: 'கைகூப்பி தேவியை எழுந்தருளச் செய்து, கலசத்திலோ விக்ரஹத்திலோ புஷ்பம் அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'Come, Durga, most blessed, to protect me always. I invoke you, Goddess, for the accomplishment of every aim. I invoke Sri Durga, Lakshmi and Saraswati.',
    philosophy_en: 'Raksharthm mama sarvada, "to protect me always". Durga is invited first as a protector. The other two are named after her, in the same breath, because nothing grows in a house that is not safe.',
    src: NR(287, 'aavaahanam (Purvanga step 17)'),
  },

  // ===== Purvanga 18: Prana Pratishtha (pp.19-26), the devi column =====
  {
    title_en: 'Prana Pratishtha Viniyoga', title_ta: 'ப்ராண ப்ரதிஷ்டா விநியோகம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_VINIYOGA,
    instruction_en: 'Place the right palm on the head, the nostrils and the chest for the three lines after the first; on the right chest, the left chest and the middle of the chest for aam, hreem and krom. Join the palms for the last line.',
    instruction_ta: 'முதல் வரிக்குப் பின்வரும் மூன்று வரிகளுக்கு வலது உள்ளங்கையைத் தலை, நாசி, மார்பு மீது வைக்கவும்; ஆம், ஹ்ரீம், க்ரோம் என்பதற்கு வலது மார்பு, இடது மார்பு, மார்பின் நடு. கடைசி வரிக்குக் கைகூப்பவும்.',
    meaning_en: 'Of this great mantra for establishing life: Brahma, Vishnu and Maheshvara are the seers; the Rig, Yajur, Sama and Atharva Vedas are the metres; the supreme Goddess Prana Shakti, who creates, sustains and withdraws the whole world, is the deity. Aam is the seed, hreem the power, krom the pin. It is used in recitation to establish life.',
    philosophy_en: 'Before life is asked into the kalasham, the mantra is introduced like a person, by its seers, its metre and its deity, and each is laid on the karta\'s own body. The installation begins in the one doing it.',
    src: P('19-20', 'step 18, praaNapratiSHTHaa: rishi, chandas, devata, bija, shakti, kilaka, viniyoga, with the rubric for each'),
  },
  {
    title_en: 'Kara Nyasa', title_ta: 'கர ந்யாஸம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_KARA,
    instruction_en: 'Roll the index finger along the thumb from base to tip, then the thumb along the index, middle, ring and little fingers in turn, one line each. On the last line rub the palms together, front and back.',
    instruction_ta: 'கட்டைவிரலின் அடியிலிருந்து நுனி வரை ஆள்காட்டி விரலை உருட்டவும்; பின் ஆள்காட்டி, நடு, மோதிர, சுண்டு விரல்கள் ஒவ்வொன்றின் அடியிலிருந்து நுனி வரை கட்டைவிரலை உருட்டவும், ஒரு வரிக்கு ஒன்று. கடைசி வரியில் இரு உள்ளங்கைகளையும் முன்னும் பின்னும் தேய்க்கவும்.',
    meaning_en: 'Aam, to the thumbs; hreem, to the forefingers; krom, to the middle fingers; aam, to the ring fingers; hreem, to the little fingers; krom, to the palms and the backs of the hands: salutation.',
    philosophy_en: 'Kara nyasa places the syllables in the hands that will do the worship. The fingers are named one by one, so that nothing offered afterwards passes through an unprepared hand.',
    src: P('20-21', 'step 18, kara nyaasa, with the rubric for each finger'),
  },
  {
    title_en: 'Anga Nyasa & Digbandha', title_ta: 'அங்க ந்யாஸம் & திக்பந்தம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_ANGA,
    instruction_en: 'Touch the chest and then the forehead with the right palm, the tuft at the back of the head with the right thumb, and the shoulders with the arms crossed. Touch the left eye, the point between the brows and the right eye with the index, middle and ring fingers, and strike the left palm with the right index and middle fingers. On the last line circle the right hand clockwise around the head.',
    instruction_ta: 'வலது உள்ளங்கையால் மார்பையும் நெற்றியையும், வலது கட்டைவிரலால் பின்தலையில் குடுமியையும், கைகளைக் குறுக்காக்கி இரு தோள்களையும் தொடவும். ஆள்காட்டி, நடு, மோதிர விரல்களால் இடது கண், புருவ மத்தி, வலது கண் ஆகியவற்றைத் தொட்டு, வலது ஆள்காட்டி, நடு விரல்களால் இடது உள்ளங்கையில் தட்டவும். கடைசி வரியில் வலது கையைத் தலையைச் சுற்றி வலமாகச் சுழற்றவும்.',
    meaning_en: 'Aam, to the heart, namah; hreem, to the head, svaha; krom, to the tuft, vashat; aam, to the armour, hum; hreem, to the three eyes, vaushat; krom, to the weapon, phat. With bhur bhuvah suvar om the directions are bound.',
    philosophy_en: 'The body is sealed limb by limb, and then the directions around it are closed with one circle of the hand. Breath is asked into the image only from inside a protected space.',
    src: P('21-22', 'step 18, anga nyaasa and digbandha, with the rubric for each line'),
  },
  {
    title_en: 'Prana Shakti Dhyanam', title_ta: 'ப்ராணஶக்தி த்யானம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_DHYANA,
    instruction_en: 'Hold in mind the supreme power of life, as the verse describes her, and recite.',
    instruction_ta: 'ஸ்லோகம் வர்ணிப்பது போல் உயிர்ச்சக்தியான பராசக்தியை மனதில் நிறுத்திச் சொல்லவும்.',
    meaning_en: 'May the supreme Prana Shakti be the giver of happiness to us: the Goddess the colour of the rising sun, mounted on a red lotus on a shining boat in a sea of red, holding in her lotus hands the noose, the bow of sugarcane with its string of bees, the goad, the five arrows and a skull of blood, three-eyed and full-breasted.',
    philosophy_en: 'The power about to be asked into the kalasham is itself a goddess, and she is seen before she is called. In a Navaratri pooja the life breathed into the Goddess\'s seat is a Goddess too.',
    src: P(23, 'step 18, dhyaanam of the Prana Shakti'),
  },
  {
    title_en: 'Prana Pratishtha', title_ta: 'ப்ராண ப்ரதிஷ்டை', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_BIJA,
    instruction_en: 'Keep the mind on the kalasham or image and recite, asking breath, life and every sense to come and stay in it.',
    instruction_ta: 'மனதைக் கலசத்தின் மேலோ விக்ரஹத்தின் மேலோ நிறுத்தி, உயிர்ப்பும் ஜீவனும் எல்லா இந்திரியங்களும் அதில் வந்து நிலைக்கும்படி வேண்டிச் சொல்லவும்.',
    meaning_en: 'Om aam hreem krom, krom hreem aam; am, yam, ram, lam, vam, sham, sham, sam, ham; hamsah so\'ham, so\'ham hamsah. In this form let the breath stay and the life stay; in this form let all the senses, speech, mind, skin, eye, ear, tongue, smell, hands, feet and the lower organs, and the five breaths, come here and remain long in well-being and happiness, svaha. Be present here, svaha.',
    philosophy_en: 'Hamsah so\'ham, "I am that", is the sound of the breath read both ways. The life asked into the image is not fetched from elsewhere; it is the same life that breathes in the one asking.',
    src: P('23-24', 'step 18, the bija and the praaNastiSHTHatu'),
  },
  {
    title_en: 'Asunite Mantra', title_ta: 'அஸுநீதே மந்த்ரம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_ASUNITE,
    instruction_en: 'First say Om fifteen times, for the fifteen sacraments of the deity from birth onwards. Then recite the verse.',
    instruction_ta: 'முதலில், ஜாதகர்மம் முதலான பதினைந்து ஸம்ஸ்காரங்களுக்காக "ஓம்" பதினைந்து முறை சொல்லவும். பின் இந்த மந்த்ரத்தைச் சொல்லவும்.',
    meaning_en: 'Asuniti, giver of breath: give us back sight, and breath, and the enjoyment of life here, so that we may long see the sun rising; Anumati, be gracious and keep us well. I establish the breaths.',
    philosophy_en: 'The fifteen Oms give the image, in a few seconds, every rite of passage a life receives from birth. The Vedic verse then asks for sight and breath for us, not for the image: life is invoked by people asking to stay alive.',
    src: P(24, 'step 18, asuneetE, with the rubric to chant Om fifteen times first'),
  },
  {
    title_en: 'Avahita Bhava', title_ta: 'ஆவாஹிதா பவ', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_BHAVA,
    instruction_en: 'Recite each line to the Goddess in its feminine form. At the end, say kalashe\'smin if she is in the kalasham, or pratimayam if in an image.',
    instruction_ta: 'ஒவ்வொரு வரியையும் அதன் ஸ்த்ரீலிங்க ரூபத்தில் தேவியை நோக்கிச் சொல்லவும். முடிவில், கலசத்தில் எனில் "கலசே(அ)ஸ்மின்", விக்ரஹத்தில் எனில் "ப்ரதிமாயாம்" என்று சொல்லவும்.',
    meaning_en: 'Be invoked, be installed, be near, be held here, be veiled, be well pleased, be gracious, be fair of face, be the giver of boons. Goddess, mistress of all the world: until the pooja ends, stay with love in this image (in this kalasham, in this form).',
    philosophy_en: 'The endings are feminine because the guest is the Goddess; only the words change with the deity, not the welcome. She is asked to stay until the pooja ends, which over Navaratri means until Vijayadashami.',
    src: P('24-25', 'step 18, the dEvee column (the feminine forms), and dEvi sarvajagannaayikE'),
  },
  {
    title_en: 'Ksheera Naivedyam', title_ta: 'க்ஷீர நைவேத்யம்', sec: 'prana', phase: 'pradhana', modes: MAIN,
    deva: PP_KSHEERA,
    instruction_en: 'Offer a little milk to the Goddess as the first food, reciting the Gayatri over it.',
    instruction_ta: 'காயத்ரீ சொல்லி, முதல் உணவாகச் சிறிது பாலைத் தேவிக்கு நிவேதனம் செய்யவும்.',
    meaning_en: 'Om, earth, sky and heaven; we meditate on the adorable radiance of the divine Savitr; may he set our minds in motion. At the time of establishing life, I offer milk.',
    philosophy_en: 'The first thing given to a newly installed presence is milk, as it is to a newborn. The rite follows the life it has just invoked from its very first moment.',
    src: P(26, 'after praaNapratiSHTHaa, kSHeeram nivEdayaami'),
  },

  // ===== Navaratri pradhana pooja: the upacharas (pp.288-291) =====
  {
    title_en: 'Asanam', title_ta: 'ஆஸனம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('288', 1),
    instruction_en: 'Offer flowers and akshatai at the kalasham or image, as the Goddess\'s seat.',
    instruction_ta: 'தேவிக்கு ஆஸனமாகக் கலசத்திலோ விக்ரஹத்திலோ புஷ்பமும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    meaning_en: 'Receive this divine golden seat, set with many jewels and clusters of gems. Salutations to Sri Durga, Lakshmi and Saraswati: I offer a seat.',
    philosophy_en: 'Kartasvaramayam, "made of gold". The seat is described as the finest the speaker can imagine, and a handful of flowers carries the description.',
    src: NR(288, 'aasanam'),
  },
  {
    title_en: 'Padyam', title_ta: 'பாத்யம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('288', 4),
    instruction_en: 'Offer an uddharani of water into the plate, for her feet.',
    instruction_ta: 'அவள் பாதங்களுக்காக ஒரு உத்தரிணி ஜலத்தைத் தாம்பாளத்தில் விடவும்.',
    meaning_en: 'Water brought at my request from the Ganga and every sacred river, pleasant to the touch: receive it for your feet. Salutations to Sri Durga, Lakshmi and Saraswati: I offer water for the feet.',
    philosophy_en: 'Gangadi sarva tirthebhyah: the water for her feet is asked to be every holy river at once. The humblest service to her is offered at the highest grade.',
    src: NR(288, 'paadyam'),
  },
  {
    title_en: 'Arghyam', title_ta: 'அர்க்யம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('288', 7),
    instruction_en: 'Offer an uddharani of water with akshatai, sandal and a flower in it.',
    instruction_ta: 'அக்ஷதை, சந்தனம், புஷ்பம் கலந்த ஒரு உத்தரிணி ஜலத்தைச் சமர்ப்பிக்கவும்.',
    meaning_en: 'Among all treasures and jewels you are beyond price; Goddess seated on the lion, receive this arghyam: salutations to you. Salutations to Sri Durga, Lakshmi and Saraswati: I offer arghyam.',
    philosophy_en: 'Simhoparisthite, "seated on the lion". Even the water of welcome is offered to the Goddess on her mount, never to an abstract presence.',
    src: NR(288, 'arghyam'),
  },
  {
    title_en: 'Achamaniyam', title_ta: 'ஆசமனீயம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: lines(N('288', 10), N('289', 0)),
    instruction_en: 'Offer an uddharani of scented water for her to sip.',
    instruction_ta: 'அவள் அருந்துவதற்காக ஒரு உத்தரிணி வாசனை ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Cool, sweet, fragrant water, scented with camphor: receive it to sip, Goddess. Salutations to Sri Durga, Lakshmi and Saraswati: I offer water to sip.',
    philosophy_en: 'Camphor in the water for sipping is a refinement, not a necessity. The verse dwells on coolness and fragrance because a guest is given water at its best.',
    src: NR('288-289', 'aachamaneeyam'),
  },
  {
    title_en: 'Snanam', title_ta: 'ஸ்நானம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('289', 3),
    instruction_en: 'Sprinkle water over the kalasham or image with a flower.',
    instruction_ta: 'புஷ்பத்தால் கலசத்தின் மேலோ விக்ரஹத்தின் மேலோ ஜலம் தெளிக்கவும்.',
    meaning_en: 'Bathe, Queen of the gods, in fragrant water brought from the Mandakini and scented with golden lotuses. Salutations to Sri Durga, Lakshmi and Saraswati: I offer a bath.',
    philosophy_en: 'Mandakini is the Ganga as it flows in heaven. The water in the uddharani is whatever the tap gave this morning; the verse says what it is being treated as, and the treating is the rite.',
    src: NR(289, 'snaanam'),
  },
  {
    title_en: 'Vastram', title_ta: 'வஸ்த்ரம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('289', 6),
    instruction_en: 'Offer new clothes: a pair of cloths with a blouse piece, or a cloth draped on the kalasham.',
    instruction_ta: 'புதிய வஸ்திரம் சமர்ப்பிக்கவும்: ரவிக்கைத் துணியுடன் இரண்டு துணிகள், அல்லது கலசத்திற்குச் சாற்றும் ஒரு துணி.',
    meaning_en: 'A pair of silk cloths with a bodice: put them on, Goddess, out of kindness, Durga who destroys misfortune. Salutations to Sri Durga, Lakshmi and Saraswati: I offer a pair of garments.',
    philosophy_en: 'Durgatinashini, "destroyer of misfortune", is a play on her name: Durga is the one who carries you across what is durga, hard to cross. The epithet turns up at the moment she is being dressed, as a guest is, for the days she is staying.',
    src: NR(289, 'vastrayugmam'),
  },
  {
    title_en: 'Upaveetam', title_ta: 'உபவீதம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('289', 9),
    instruction_en: 'Offer the sacred thread.',
    instruction_ta: 'உபவீதம் சமர்ப்பிக்கவும்.',
    meaning_en: 'This divine thread of golden strands, made by Brahma long ago: accept the sacred thread I give, Supreme Goddess. Salutations to Sri Durga, Lakshmi and Saraswati: I offer the sacred thread.',
    philosophy_en: 'The verse calls the thread Brahma\'s own making. Offered to the Goddess it is a gift of the order of the world, given to her who sustains it.',
    src: NR('289-290', 'upaveetam'),
  },
  {
    title_en: 'Gandham', title_ta: 'கந்தம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('290', 2),
    instruction_en: 'Offer sandal paste.',
    instruction_ta: 'சந்தனம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Divine sandal paste of the sandal tree, rich in fragrance and lovely: receive it as an ointment, Queen of the gods. Salutations to Sri Durga, Lakshmi and Saraswati: I apply sandal paste.',
    philosophy_en: 'Sandal cools. It comes first among the adornments because it soothes, before anything is added for beauty.',
    src: NR(290, 'gandham'),
  },
  {
    title_en: 'Manjal (Saubhagya Dravyam)', title_ta: 'மஞ்சள் (ஸௌபாக்ய த்ரவ்யம்)', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('290', 5),
    instruction_en: 'Offer turmeric.',
    instruction_ta: 'மஞ்சள் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Sri Durga, Lakshmi and Saraswati: I offer the articles of good fortune.',
    philosophy_en: 'Turmeric, kumkumam and kajal are saubhagya dravyas, the marks of a woman whose household is whole. They are offered to the Goddess for the same reason the sumangalis who visit during these nine days are given them on the way out.',
    src: NR(290, 'saubhaagyadravyaaNi, rubric: offer turmeric paste'),
  },
  {
    title_en: 'Kumkumam', title_ta: 'குங்குமம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('290', 8),
    instruction_en: 'Offer kumkumam.',
    instruction_ta: 'குங்குமம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Sri Durga, Lakshmi and Saraswati: I offer kumkumam.',
    philosophy_en: 'Kumkumam is the red of auspiciousness worn on the forehead and in the parting of the hair. It is offered to her as the sign of a household that is whole.',
    src: NR(290, 'kunkumam'),
  },
  {
    title_en: 'Kanmai (Kajjalam)', title_ta: 'கண்மை (கஜ்ஜலம்)', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('290', 11),
    instruction_en: 'Offer kanmai, the kajal for the eyes.',
    instruction_ta: 'கண்மை சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Sri Durga, Lakshmi and Saraswati: I offer kajal.',
    philosophy_en: 'Kajal is the most intimate of the adornments, put on the eyes. The Goddess is dressed as a daughter of the house is dressed for a festival, down to her eyes.',
    src: NR(290, 'kajjalam'),
  },
  {
    title_en: 'Abharanam', title_ta: 'ஆபரணம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('290', 14),
    instruction_en: 'Offer ornaments: a bangle, a chain, whatever the house sets aside for her.',
    instruction_ta: 'ஆபரணங்கள் சமர்ப்பிக்கவும் — வளையல், சங்கிலி, அவளுக்கென்று வைத்திருப்பது எதுவோ அது.',
    meaning_en: 'Salutations to Sri Durga, Lakshmi and Saraswati: I offer ornaments.',
    philosophy_en: 'Abharanani is plural. Vighneshwara was offered an ornament; the Goddess is offered ornaments, as befits a guest who stays for nine nights.',
    src: NR(290, 'aabharaNaani'),
  },
  {
    title_en: 'Akshatai', title_ta: 'அக்ஷதை', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('291', 0),
    instruction_en: 'Offer akshatai.',
    instruction_ta: 'அக்ஷதை சமர்ப்பிக்கவும்.',
    meaning_en: 'Unbroken grains, spotless and pure, set with pearls and gems: receive them, great Goddess, and give me a spotless mind. Salutations to Sri Durga, Lakshmi and Saraswati: I offer unbroken rice.',
    philosophy_en: 'Dehi me nirmalam dhiyam, "give me a spotless mind". The one request tucked into the upacharas is not for wealth or safety but for clear thinking, which is Saraswati being asked for in the middle of a Durga verse.',
    src: NR(291, 'akSHataan'),
  },
  {
    title_en: 'Pushpam', title_ta: 'புஷ்பம்', sec: 'shodasha', phase: 'pradhana', modes: PRE,
    deva: N('291', 3),
    instruction_en: 'Offer a garland, then loose flowers.',
    instruction_ta: 'மாலை சமர்ப்பித்து, பின் உதிரிப் புஷ்பங்களைச் சமர்ப்பிக்கவும்.',
    meaning_en: 'A garland made with lotus flowers and others of a hundred petals: I offer it; receive it, Queen of the gods. Salutations to Sri Durga, Lakshmi and Saraswati: I offer a garland of flowers; I worship with flowers.',
    philosophy_en: 'Shatapatra, "of a hundred petals". The garland closes the upacharas, and the loose flowers that follow lead straight into the names, where every flower carries one.',
    src: NR(291, 'puSHpamaalaam; one rubric for garland and flowers'),
  },

  // ===== Archana (pp.291-296) =====
  {
    title_en: 'Anga Pooja', title_ta: 'அங்க பூஜை', sec: 'archana', phase: 'pradhana', modes: PRE,
    archana: { rows: NAV_ANGA, expect: 18 },
    instruction_en: 'Eighteen names, each with a limb, from the feet up to the head and then the whole body. Offer a flower or a pinch of akshatai at each.',
    instruction_ta: 'பதினெட்டு நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்துடன், பாதம் முதல் சிரசு வரை, கடைசியில் முழு உடல். ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும்.',
    meaning_en: 'Eighteen names of the Goddess, each offered to a limb from the feet upward: Durga at the feet, Mahakali at the ankles, Kamalavasini at the navel, Maheshvari at the head, and Katyayani for the whole body.',
    philosophy_en: 'The names move between her fierce and gentle forms as they climb, Kali at the ankles and Kamalavasini, the lotus-dweller, at the navel. The anga pooja does not pick one aspect of the Goddess; it covers her from foot to head with all of them.',
    src: NR('291-292', 'angapoojaa'),
  },
  {
    title_en: 'Durga Ashtottara Shatanamavali', title_ta: 'துர்கா அஷ்டோத்தர ஶதநாமாவளி', sec: 'archana', phase: 'pradhana', modes: ALL, namavali_id: 'durga_ashtottara_108',
    instruction_en: 'Offer a flower or a pinch of akshatai at each of the hundred and eight names of Durga. On Vijayadashami these names are recited again before the Goddess is released.',
    instruction_ta: 'துர்கையின் நூற்றெட்டு நாமங்களில் ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பிக்கவும். விஜயதசமியன்று தேவியை யதாஸ்தானம் செய்வதற்கு முன் இந்த நாமங்கள் மீண்டும் சொல்லப்படுகின்றன.',
    meaning_en: 'One hundred and eight names of Durga, opening with Shri, Uma and Bharati and closing with Durgaparameshvari, the supreme Durga. Many are names of Lakshmi and Saraswati as well, which is the point of saying them at Navaratri.',
    philosophy_en: 'The list begins with shriyai, the name of Lakshmi, and keeps returning to names of learning and speech. A hundred and eight names of Durga turn out to hold all three goddesses of the sankalpam.',
    src: NR('293-296', 'durgaaSHTOttarashatanaamaavalihi, count markers verified in both scripts'),
  },
  {
    title_en: 'Lakshmi Ashtottara Shatanamavali', title_ta: 'லக்ஷ்மி அஷ்டோத்தர ஶதநாமாவளி', sec: 'archana', phase: 'pradhana', modes: PRE, namavali_id: 'lakshmi_ashtottara_108',
    instruction_en: 'The hundred and eight names of Lakshmi follow the names of Durga. Offer a flower or akshatai at each. On a short day this and the next list may be left for the middle three days, when Lakshmi is especially worshipped.',
    instruction_ta: 'துர்கா நாமங்களைத் தொடர்ந்து லக்ஷ்மியின் நூற்றெட்டு நாமங்கள். ஒவ்வொன்றிலும் புஷ்பமோ அக்ஷதையோ சமர்ப்பிக்கவும். நேரம் குறைவான நாளில், லக்ஷ்மிக்கு உரிய நடு மூன்று நாட்களுக்கு இதை விட்டு வைக்கலாம்.',
    meaning_en: 'One hundred and eight names of Lakshmi, beginning with Prakriti and Vikriti, nature and its transformation, and closing with Bhuvaneshvari, mistress of the worlds.',
    philosophy_en: 'The Durga list is followed by the lists of the other two goddesses the sankalpam named, so that each of the three is addressed by her own names as well as together.',
    src: NR(296, 'rubric: the Lakshmi ashtottaram (book p.123), as carried for Varalakshmi'),
  },
  {
    title_en: 'Saraswati Ashtottara Shatanamavali', title_ta: 'ஸரஸ்வதீ அஷ்டோத்தர ஶதநாமாவளி', sec: 'archana', phase: 'pradhana', modes: PRE, namavali_id: 'saraswati_ashtottara_108',
    instruction_en: 'Then the hundred and eight names of Saraswati, with a flower or akshatai at each. They are the same names said over the books on Saraswati Pooja.',
    instruction_ta: 'பின் ஸரஸ்வதியின் நூற்றெட்டு நாமங்கள், ஒவ்வொன்றிலும் புஷ்பமோ அக்ஷதையோ. ஸரஸ்வதீ பூஜையன்று புத்தகங்களின் மேல் சொல்லப்படும் அதே நாமங்கள் இவை.',
    meaning_en: 'One hundred and eight names of Saraswati, opening with Saraswati and Mahabhadra and closing with Brahmavishnushivatmika, she who is the self of Brahma, Vishnu and Shiva.',
    philosophy_en: 'The last of the three lists ends by naming her as the self of the whole trinity, which is a fitting place for a Navaratri archana to stop.',
    src: NR(296, 'rubric: the Saraswati ashtottaram, pp.315-318'),
  },
  {
    title_en: 'Patra Pushpa Samarpanam', title_ta: 'பத்ர புஷ்ப ஸமர்ப்பணம்', sec: 'archana', phase: 'pradhana', modes: ALL,
    deva: N('294', 2).map((l) => l.replace('पुष्पानि', 'पुष्पाणि')),
    instruction_en: 'After the last of the names, offer the rest of the flowers and leaves to the Goddess in one handful.',
    instruction_ta: 'நாமங்கள் முடிந்ததும், மீதமுள்ள புஷ்பங்களையும் இலைகளையும் ஒரே கைப்பிடியாகத் தேவிக்குச் சமர்ப்பிக்கவும்.',
    meaning_en: ASHTOTTARA_CLOSE,
    philosophy_en: 'The lists end as the Vighneshwara archana ended, with everything left offered at once: three goddesses\' names, closed by a single handful.',
    src: NR(294, 'the close of the archana; the roman (p.296) reads puSHpaaNi'),
  },

  // ===== Uttaranga pooja (pp.297-300) =====
  {
    title_en: 'Dhoopam', title_ta: 'தூபம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('297', 1),
    instruction_en: 'Light the incense and wave it before the Goddess.',
    instruction_ta: 'ஊதுபத்தியை ஏற்றி தேவியின் முன் காட்டவும்.',
    meaning_en: 'Incense of ten ingredients with guggulu, sandal and aloe wood, offered by me with devotion: receive it, great Goddess. Salutations to Sri Durga, Lakshmi and Saraswati: I offer incense.',
    philosophy_en: 'Dashanga, "of ten parts". Incense in the old recipes is a compound of many fragrances, and the verse names them as a host would describe a dish made specially.',
    src: NR(297, 'uttaraanga poojaa, dhoopam'),
  },
  {
    title_en: 'Deepam', title_ta: 'தீபம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('297', 4),
    instruction_en: 'Wave the ghee lamp before her.',
    instruction_ta: 'நெய் தீபத்தை அவள் முன் காட்டவும்.',
    meaning_en: 'A lamp with ghee and three wicks, of great brilliance and blaze: I give it to you, Queen of the gods; be pleased always. Salutations to Sri Durga, Lakshmi and Saraswati: I show the lamp.',
    philosophy_en: 'Trivarti, "three wicks". The lamp offered to the three goddesses has a wick for each of them, which is why a Navaratri lamp is so often a three-wick one.',
    src: NR(297, 'deepam'),
  },
  {
    title_en: 'Dhoopa Deepa Achamaniyam', title_ta: 'தூப தீபாநந்தர ஆசமனீயம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('297', 7),
    instruction_en: 'Offer an uddharani of water.',
    instruction_ta: 'ஒரு உத்தரிணி ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'After the incense and the lamp, I offer water to sip.',
    philosophy_en: 'The same water that closed the incense and lamp for Vighneshwara closes them for the Goddess. The grammar of the rite does not change with the size of the guest.',
    src: NR(297, 'dhoopa deepaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Naivedya Prokshanam', title_ta: 'நைவேத்ய ப்ரோக்ஷணம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: lines(N('298', 2), N('298', 4)),
    instruction_en: 'Set the food on a plate or a plantain leaf on a spot cleaned with a little water, in front of the Goddess. Sprinkle water over it with the first line; as you recite the Gayatri, take water in the uddharani and circle the plate clockwise three times.',
    instruction_ta: 'தேவியின் முன், சிறிது ஜலத்தால் சுத்தம் செய்த இடத்தில், தட்டிலோ வாழையிலையிலோ நைவேத்யத்தை வைக்கவும். முதல் வரியுடன் அதன் மேல் ஜலம் தெளிக்கவும்; காயத்ரீ சொல்லும்போது உத்தரிணியில் ஜலம் எடுத்து, தட்டை மூன்று முறை வலமாகச் சுற்றவும்.',
    meaning_en: 'Om, earth, sky, heaven. We meditate on the glorious light of the divine Savitr; may it inspire our minds.',
    philosophy_en: 'The Goddess\'s meal is purified with the Gayatri, the same verse the karta held their breath through at the start. The words that steadied the worshipper now make the food fit for her.',
    src: NR(298, 'naivEdyamantraaha: the sprinkling and the threefold circling'),
  },
  {
    title_en: 'Parishechanam', title_ta: 'பரிஷேசனம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: lines(N('298', 7), N('298', 9)),
    instruction_en: 'Take a little water again and circle the plate clockwise while saying this: the first line in the morning, the second in the evening.',
    instruction_ta: 'மீண்டும் சிறிது ஜலம் எடுத்து, இதைச் சொல்லியபடி தட்டை வலமாகச் சுற்றவும்: காலையில் முதல் வரி, மாலையில் இரண்டாம் வரி.',
    meaning_en: 'Divine Savitr, impel us. Morning: I sprinkle you, truth, with order. Evening: I sprinkle you, order, with truth.',
    philosophy_en: 'Navaratri pooja may be done in the morning or at dusk, and the ring of water around the food knows which. Satya and rita, truth and order, simply change places.',
    src: NR(298, 'the morning and evening parishechana lines'),
  },
  {
    title_en: 'Amritopastaranam', title_ta: 'அம்ருதோபஸ்தரணம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('298', 12),
    instruction_en: 'Offer a spoon of water into the plate.',
    instruction_ta: 'ஒரு உத்தரிணி ஜலத்தைத் தாம்பாளத்தில் விடவும்.',
    meaning_en: 'You are the immortal bed for the food.',
    philosophy_en: 'A spoon of water laid down before the meal as its bed. However grand the naivedyam, it rests on the same simple water as a single fruit would.',
    src: NR(298, 'amRtOpastaraNamasi'),
  },
  {
    title_en: 'Pranahuti', title_ta: 'ப்ராணாஹுதி', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('298', 14),
    instruction_en: 'After each svaha, gesture with the right hand as if feeding the Goddess from the plate.',
    instruction_ta: 'ஒவ்வொரு ஸ்வாஹாவிற்குப் பின்னும், தட்டிலிருந்து தேவிக்கு ஊட்டுவது போல் வலது கையால் காட்டவும்.',
    meaning_en: 'Om, to prana, svaha; to apana, vyana, udana and samana, svaha; to Brahman, svaha.',
    philosophy_en: 'Six mouthfuls, offered to the breaths of life and to Brahman, before the food is named. The Goddess is fed as one feeds the life in a body, not as one leaves a plate at a shrine.',
    src: NR(298, 'the six praaNaahutis'),
  },
  {
    title_en: 'Mahanaivedyam', title_ta: 'மஹாநைவேத்யம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('298', 16),
    instruction_en: 'Offer the food to the Goddess.',
    instruction_ta: 'நைவேத்யத்தைத் தேவிக்கு நிவேதனம் செய்யவும்.',
    meaning_en: 'Food of four kinds, sweet and rich in the six tastes: receive this offering, Goddess, and make my devotion unshakeable. Salutations to Sri Durga, Lakshmi and Saraswati: I offer the great food offering.',
    philosophy_en: 'Bhaktim me hyachalam kuru, "make my devotion unshakeable". The one thing asked in return for the meal is not a favour but steadiness, which over nine days of the same pooja is the thing most likely to run out.',
    src: NR('298-299', 'mahaanaivEdyam'),
  },
  {
    title_en: 'Amritapaniyam', title_ta: 'அம்ருதபானீயம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('299', 2),
    instruction_en: 'Offer a spoon of water, as water to drink with the meal.',
    instruction_ta: 'உணவுடன் அருந்தும் ஜலமாக ஒரு உத்தரிணி ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Now and again during the meal, I offer water, sweet as nectar, to drink.',
    philosophy_en: 'The Goddess is not left to eat in silence with an empty cup. Water is offered in the middle of the meal, as a host would pour it for a guest at the table.',
    src: NR(299, 'madhyE madhyE amRtapaaneeyam'),
  },
  {
    title_en: 'Achamaniyam after Naivedyam', title_ta: 'நிவேதனாநந்தர ஆசமனீயம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('299', 5),
    instruction_en: 'Offer a spoon of water, to rinse after the meal.',
    instruction_ta: 'உணவுக்குப் பின் வாய் கழுவ ஒரு உத்தரிணி ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'After the offering of food, I offer water to sip.',
    philosophy_en: 'The meal ends where every meal in the house ends, with water to rinse. Nothing in the order of eating is skipped because the guest is divine.',
    src: NR(299, 'nivEdanaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Tambulam', title_ta: 'தாம்பூலம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('299', 8),
    instruction_en: 'Sprinkle a little water on the betel leaves and areca nut, and offer them.',
    instruction_ta: 'வெற்றிலை பாக்கின் மேல் சிறிது ஜலம் தெளித்துச் சமர்ப்பிக்கவும்.',
    meaning_en: 'A betel roll made fragrant with cardamom, clove, musk and camphor, to sweeten the mouth: I offer it, Queen of the gods. Salutations to Sri Durga, Lakshmi and Saraswati: I offer betel with camphor.',
    philosophy_en: 'Tambulam ends a meal in a South Indian house, and it ends the Goddess\'s meal too. It is the host\'s sign that the guest has been fed fully.',
    src: NR(299, 'karpoorataamboolam'),
  },
  {
    // Vijayadashami only. The p.304 rubric for the dashami punah pooja says
    // "wave camphor", and the Navaratri section prints no neerajanam verse of
    // its own; the verse is the same book's, from its Saraswati section
    // (pp.321-322), which addresses the same three goddesses (as 0057).
    title_en: 'Karpura Neerajanam', title_ta: 'கற்பூர நீராஜனம்', sec: 'uttara', phase: 'uttara', modes: UDV,
    deva: N('321', 15),
    instruction_en: 'Before the Goddess is sent home, light camphor and wave it clockwise in front of the kalasham or image.',
    instruction_ta: 'தேவிக்கு விடை கொடுப்பதற்கு முன், கற்பூரம் ஏற்றி கலசத்தின் அல்லது விக்ரஹத்தின் முன் வலமாகச் சுற்றிக் காட்டவும்.',
    meaning_en: 'Lit with a thousand wicks and pieces of camphor, this waving of light is offered by me: receive it and be a giver of boons. Salutations to Sri Durga, Lakshmi and Saraswati: I show the camphor flame.',
    philosophy_en: 'On the last morning the camphor is the final light the Goddess is shown in this house. It burns out completely and leaves nothing behind, which is the right thing to wave just before asking her to go and to come again.',
    src: `${BOOK}, Navaratri Puja p.304 rubric for dashami (wave camphor); verse from p.321, addressed to the same three goddesses`,
  },
  {
    title_en: 'Achamaniyam after Neerajanam', title_ta: 'நீராஜனாநந்தர ஆசமனீயம்', sec: 'uttara', phase: 'uttara', modes: UDV,
    deva: N('322', 2),
    instruction_en: 'Offer an uddharani of water after the camphor.',
    instruction_ta: 'கற்பூரத்திற்குப் பின் ஒரு உத்தரிணி ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'After the waving of light, I offer water to sip.',
    philosophy_en: 'Even on the last morning the order of service is kept to the end: light, then water, as on every other day.',
    src: `${BOOK}, Saraswati Puja p.322, neeraajanaanantaram aachamaneeyam, with the camphor above`,
  },
  {
    title_en: 'Pushpanjali', title_ta: 'புஷ்பாஞ்ஜலி', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('299', 11),
    instruction_en: 'Take flowers and akshatai in both cupped hands, recite, and offer them at her feet. Everyone present may offer flowers.',
    instruction_ta: 'இரு கைகளையும் குவித்து புஷ்பமும் அக்ஷதையும் எடுத்து, ஸ்லோகம் சொல்லி அவள் பாதத்தில் சமர்ப்பிக்கவும். அங்கிருக்கும் அனைவரும் புஷ்பம் சமர்ப்பிக்கலாம்.',
    meaning_en: 'Mandara, parijata, patali and ketaki, jasmine and champaka: receive these flowers, radiant one. Salutations to Sri Durga, Lakshmi and Saraswati: I offer a handful of flowers.',
    philosophy_en: 'The only step of the pooja that is handed to everyone in the room. Navaratri is a household festival with guests coming and going, and the flowers are how the visitors take part in the worship rather than watching it.',
    src: NR(299, 'puSHpaanjali'),
  },
  {
    title_en: 'Pradakshina & Namaskaram', title_ta: 'ப்ரதக்ஷிணம் & நமஸ்காரம்', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('300', 0),
    instruction_en: 'With palms joined, go round the Goddess clockwise three times, or stand and turn clockwise three times where you are. Then prostrate: men with eight limbs touching the ground, women with five.',
    instruction_ta: 'கைகூப்பியபடி தேவியை மூன்று முறை வலம் வரவும்; இடமில்லையெனில் நின்ற இடத்திலேயே மூன்று முறை வலமாகச் சுற்றவும். பின் நமஸ்கரிக்கவும் — ஆண்கள் ஸாஷ்டாங்கமாக (எட்டு அங்கங்கள் தரையில் பட), பெண்கள் பஞ்சாங்கமாக (ஐந்து அங்கங்கள்).',
    meaning_en: 'Durga, remembered, you take away the fear of every creature; remembered by those at ease, you give them a mind more blessed still. Remover of poverty, sorrow and fear, who but you has a heart always soft with the wish to help everyone? Salutations to Sri Durga, Lakshmi and Saraswati: I offer circumambulation and prostrations.',
    philosophy_en: 'This verse is from the Devi Mahatmyam, the text recited through Navaratri. Smrta, "remembered", carries it: she does not need to be summoned with ceremony, only remembered, and the circling is a way of keeping her at the centre while doing it.',
    src: NR(300, 'pradakSHiNa namaskaaraan; three rounds and the eight- and five-limbed prostration from the general instructions, p.XVI'),
  },
  {
    title_en: 'Navadurga Pooja', title_ta: 'நவதுர்கா பூஜை', sec: 'uttara', phase: 'uttara', modes: PRE,
    archana: { rows: NAVADURGA.map((n) => ({ name: n, act: null, en: 'Offer a flower', ta: 'புஷ்பம் சமர்ப்பிக்கவும்' })), expect: 9 },
    instruction_en: 'Offer a flower at each of the nine forms of Durga, from Shailaputri to Siddhidatri. On each day of Navaratri the form for that day may be honoured with an extra flower: Shailaputri on the first, Siddhidatri on the ninth.',
    instruction_ta: 'துர்கையின் ஒன்பது வடிவங்களுக்கும், ஶைலபுத்ரீ முதல் ஸித்திதாத்ரீ வரை, ஒவ்வொன்றிற்கும் ஒரு புஷ்பம் சமர்ப்பிக்கவும். நவராத்திரியின் ஒவ்வொரு நாளும் அந்நாளுக்கு உரிய வடிவத்திற்கு கூடுதலாக ஒரு புஷ்பம் சமர்ப்பிக்கலாம் — முதல் நாள் ஶைலபுத்ரீ, ஒன்பதாம் நாள் ஸித்திதாத்ரீ.',
    meaning_en: 'Salutations to the nine Durgas: Shailaputri, daughter of the mountain; Brahmacharini, the ascetic; Chandraghanta, crowned with the crescent; Kushmanda, who laughed the universe into being; Skandamata, mother of Skanda; Katyayani; Kalaratri, the night of time; Mahagauri, the radiant; and Siddhidatri, giver of attainment.',
    philosophy_en: 'The nine forms run in a line from a girl, the mountain\'s daughter, through the ascetic, the warrior and the mother, to the one who grants completion. Read in order they are a life, which is why there is one for each night.',
    src: NR(300, 'navadurgaa poojaa; two-column list read in the canonical order of the nine forms'),
  },
  {
    title_en: 'Jyoti Pooja', title_ta: 'ஜ்யோதி பூஜை', sec: 'uttara', phase: 'uttara', modes: PRE,
    deva: N('300', 10),
    instruction_en: 'Offer flowers and akshatai to the lamp itself. The lamp lit on the first day is kept burning, or lit afresh at each pooja, through all nine days.',
    instruction_ta: 'தீபத்திற்கே புஷ்பமும் அக்ஷதையும் சமர்ப்பிக்கவும். முதல் நாள் ஏற்றிய தீபம் ஒன்பது நாட்களும் அணையாமல் வைக்கப்படுகிறது, அல்லது ஒவ்வொரு பூஜையிலும் புதிதாக ஏற்றப்படுகிறது.',
    meaning_en: 'She who, by her own nature, is the reality behind the three worlds, their ground and all their variety; the Maya made manifest here by knowledge: may that supreme light protect the worlds always. Salutations to Sri Durga, Lakshmi and Saraswati, whose form is radiance.',
    philosophy_en: 'Tejassvarupa, "whose form is radiance". The lamp is not a light shown to the Goddess here; it is worshipped as her. That is why it is kept burning through the nine nights rather than lit and put out with each pooja.',
    src: NR('300-301', 'jyOti poojaa'),
  },
  {
    title_en: 'Prarthana', title_ta: 'ப்ரார்த்தனை', sec: 'uttara', phase: 'uttara', modes: ALL,
    deva: N('301', 3),
    instruction_en: 'With joined hands, pray to the Goddess.',
    instruction_ta: 'கைகூப்பி தேவியைப் ப்ரார்த்திக்கவும்.',
    meaning_en: 'Auspiciousness of all that is auspicious, Shiva, fulfiller of every aim, refuge, three-eyed Gauri, Narayani: salutations to you. Give me beauty, give me fame, give me good fortune, Goddess; give me children, give me wealth, give me all that I desire.',
    philosophy_en: 'Sarvamangala mangalye is the best known verse of the Devi Mahatmyam and the plainest. After nine days of upacharas it simply asks, out loud, for what a household wants. There is no embarrassment in the asking.',
    src: NR(301, 'praarthanaa'),
  },

  // ===== Navakanya pooja (pp.301-303) =====
  {
    title_en: 'Kanya Avahanam', title_ta: 'கன்யா ஆவாஹனம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: N('301', 7),
    instruction_en: 'Seat a girl younger than twelve before you and invoke the Goddess in her with this verse. Usually one girl is honoured each day, or nine together on one day.',
    instruction_ta: 'பன்னிரண்டு வயதிற்குட்பட்ட ஒரு சிறுமியை முன்னே அமர வைத்து, இந்த ஸ்லோகத்தால் அவளிடம் தேவியை ஆவாஹனம் செய்யவும். பொதுவாக ஒவ்வொரு நாளும் ஒரு சிறுமி, அல்லது ஒரு நாளில் ஒன்பது பேர் சேர்ந்து.',
    meaning_en: 'Om klim, salutations to the maiden of the family. I invoke the maiden who is Lakshmi made of the letters of the mantra, who bears the form of the mothers, the nine Durgas in person.',
    philosophy_en: 'Every other step of the pooja treats an image as the Goddess. This one treats a child as the Goddess, and gives her exactly the upacharas the kalasham received. It is the clearest statement in the whole festival of where the divine is supposed to be looked for.',
    src: NR(301, 'navakanyaa poojaa, the invocation'),
  },
  {
    title_en: 'Kanya Padyam', title_ta: 'கன்யா பாத்யம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 2),
    instruction_en: 'Offer water for the girl\'s feet.',
    instruction_ta: 'சிறுமியின் பாதங்களுக்கு ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer water for the feet.',
    philosophy_en: 'The child\'s feet are washed as the Goddess\'s were. In most houses it is the elders who wash the young; here the order is reversed.',
    src: NR(302, 'paadyam, said to kulakumaarikaa'),
  },
  {
    title_en: 'Kanya Arghyam', title_ta: 'கன்யா அர்க்யம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 4),
    instruction_en: 'Offer water for her hands.',
    instruction_ta: 'அவள் கைகளுக்கு ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer arghyam.',
    philosophy_en: 'Arghyam is the water of honour. Given to a girl of eight, it says plainly that honour here does not wait on age.',
    src: NR(302, 'arghyam'),
  },
  {
    title_en: 'Kanya Achamaniyam', title_ta: 'கன்யா ஆசமனீயம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 6),
    instruction_en: 'Offer her water to sip.',
    instruction_ta: 'அவள் அருந்துவதற்கு ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer water to sip.',
    philosophy_en: 'Water to drink, offered with a mantra. The plainest act of hospitality is lifted to worship simply by being said.',
    src: NR(302, 'aachamaneeyam'),
  },
  {
    title_en: 'Kanya Vastram', title_ta: 'கன்யா வஸ்த்ரம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 8),
    instruction_en: 'Give her new clothes.',
    instruction_ta: 'அவளுக்குப் புதிய வஸ்திரம் கொடுக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer clothes.',
    philosophy_en: 'Unlike the cloth draped on a kalasham, this one is worn home. The Goddess\'s gift goes with the child and is used.',
    src: NR(302, 'vastram'),
  },
  {
    title_en: 'Kanya Gandham', title_ta: 'கன்யா கந்தம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 10),
    instruction_en: 'Offer her sandal paste.',
    instruction_ta: 'அவளுக்குச் சந்தனம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer sandal paste.',
    philosophy_en: 'A dab of sandal on a child\'s wrist or neck is the same upachara the Goddess received in the kalasham, scaled to a small guest.',
    src: NR(302, 'gandham'),
  },
  {
    title_en: 'Kanya Haridra Kumkumam', title_ta: 'கன்யா ஹரித்ரா குங்குமம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 12),
    instruction_en: 'Offer her turmeric and kumkumam.',
    instruction_ta: 'அவளுக்கு மஞ்சளும் குங்குமமும் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer turmeric and kumkumam.',
    philosophy_en: 'Turmeric and kumkumam are the marks of auspiciousness every girl and woman who visits at Navaratri goes home with. Here they are given as worship, not only as courtesy.',
    src: NR(302, 'haridraakunkumam'),
  },
  {
    title_en: 'Kanya Abharanam', title_ta: 'கன்யா ஆபரணம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 14),
    instruction_en: 'Offer her ornaments.',
    instruction_ta: 'அவளுக்கு ஆபரணங்கள் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer ornaments.',
    philosophy_en: 'Bangles or a small chain for the girl, as the Goddess was given hers. The child is adorned the way the deity was.',
    src: NR(302, 'bhooSHaNaani'),
  },
  {
    title_en: 'Kanya Pushpam', title_ta: 'கன்யா புஷ்பம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: KANYA('302', 16),
    instruction_en: 'Offer her flowers.',
    instruction_ta: 'அவளுக்குப் புஷ்பம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer flowers.',
    philosophy_en: 'Flowers in a child\'s hair are an ordinary festival sight. Offered with the mantra, they become the flowers of a pooja.',
    src: NR(302, 'puSHpaaNi'),
  },
  {
    title_en: 'Navakanya Pooja', title_ta: 'நவகன்யா பூஜை', sec: 'kanya', phase: 'uttara', modes: PRE,
    archana: { rows: NAVAKANYA.map((n) => ({ name: n, act: null, en: 'Offer a flower', ta: 'புஷ்பம் சமர்ப்பிக்கவும்' })), expect: 9 },
    instruction_en: 'Offer a flower at each of the nine names of the maiden, from Kumari to Subhadra.',
    instruction_ta: 'கன்னிகையின் ஒன்பது நாமங்களுக்கும், குமாரீ முதல் ஸுபத்ரா வரை, ஒவ்வொன்றிற்கும் ஒரு புஷ்பம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Salutations to Kaumari, Tripura, Kalyani, Rohini, Kamini, Chandika, Shankari, Durga and Subhadra: the nine maidens, named by age.',
    philosophy_en: 'The nine names are the ages of girlhood, each a form of the Goddess. The one girl before you is honoured as all nine at once.',
    src: NR('302-303', 'archanaa; the nine names read in the order of the maidens\' ages, Kumari to Subhadra'),
  },
  {
    title_en: 'Kanya Dhoopam', title_ta: 'கன்யா தூபம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 2)),
    instruction_en: 'Show her incense.',
    instruction_ta: 'அவளுக்குத் தூபம் காட்டவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer incense.',
    philosophy_en: 'Incense is waved for a child exactly as for the deity. Nothing in the pooja marks her as a lesser guest.',
    src: NR(303, 'dhoopam'),
  },
  {
    title_en: 'Kanya Deepam', title_ta: 'கன்யா தீபம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 4)),
    instruction_en: 'Show her a lamp with a wick dipped in ghee.',
    instruction_ta: 'நெய்யில் நனைத்த திரியுடன் ஏற்றிய தீபத்தை அவளுக்குக் காட்டவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I show the lamp.',
    philosophy_en: 'The lamp is shown to her face. It is the moment the household looks at the child and sees the Goddess there.',
    src: NR(303, 'deepam'),
  },
  {
    title_en: 'Kanya Naivedyam', title_ta: 'கன்யா நைவேத்யம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 6)),
    instruction_en: 'Offer her food.',
    instruction_ta: 'அவளுக்கு உணவு அளிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer food.',
    philosophy_en: 'The naivedyam set before the kalasham is a gesture; the food set before the girl is eaten. In this step the offering really is received.',
    src: NR(303, 'naivEdyam'),
  },
  {
    title_en: 'Kanya Achamaniyam after Naivedyam', title_ta: 'கன்யா நிவேதனாநந்தர ஆசமனீயம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 8)),
    instruction_en: 'Offer her water after the food.',
    instruction_ta: 'உணவுக்குப் பின் அவளுக்கு ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: after the food, I offer water to sip.',
    philosophy_en: 'She is given water after eating, as any guest at the table is. The rite and ordinary good manners are the same thing here.',
    src: NR(303, 'nivEdanaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Kanya Neerajanam', title_ta: 'கன்யா நீராஜனம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 11)),
    instruction_en: 'Wave lit camphor before her, clockwise.',
    instruction_ta: 'கற்பூரம் ஏற்றி அவள் முன் வலமாகச் சுற்றிக் காட்டவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: I offer the camphor light.',
    philosophy_en: 'Aarti for a child is common enough on a birthday. Here it is done in earnest, to the Goddess in her.',
    src: NR(303, 'karpoora neeraajanam, rubric: offer camphor light'),
  },
  {
    title_en: 'Kanya Achamaniyam after Neerajanam', title_ta: 'கன்யா நீராஜனாநந்தர ஆசமனீயம்', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: lines(N('302', 0), N('303', 14)),
    instruction_en: 'Offer her water after the camphor.',
    instruction_ta: 'கற்பூரத்திற்குப் பின் அவளுக்கு ஜலம் சமர்ப்பிக்கவும்.',
    meaning_en: 'Om klim, salutations to the maiden of the family: after the light, I offer water to sip.',
    philosophy_en: 'Light and then water, the same close the Goddess received. The kanya pooja keeps the full order of service to its last step.',
    src: NR(303, 'neeraajanaanantaram aachamaneeyam'),
  },
  {
    title_en: 'Kanya Prarthana', title_ta: 'கன்யா ப்ரார்த்தனை', sec: 'kanya', phase: 'uttara', modes: PRE,
    deva: N('303', 17),
    instruction_en: 'With joined hands, pray to the Goddess in the girl. Then send her home with a gift.',
    instruction_ta: 'கைகூப்பி, சிறுமியிடம் உள்ள தேவியைப் ப்ரார்த்திக்கவும். பின் ஒரு பரிசு கொடுத்து அவளை அனுப்பவும்.',
    meaning_en: 'Give me beauty, give me victory, give me fame, destroy my enemies, slayer of Mahisha, great Maya, Chamunda garlanded with skulls; give me long life, health and prosperity, Goddess: salutations to you. I offer my prayer.',
    philosophy_en: 'Rupam dehi jayam dehi yasho dehi dvisho jahi is the refrain of the Argala Stotram, said before the Devi Mahatmyam is read. It is said here to a child, which keeps the asking honest.',
    src: NR(303, 'praarthanaam samarpayaami'),
  },

  // ===== Vijayadashami: punah pooja (p.304) =====
  {
    title_en: 'Punah Pooja & Yathasthanam', title_ta: 'புனர் பூஜை & யதாஸ்தானம்', sec: 'uttara', phase: 'uttara', modes: UDV,
    deva: N('304', 2).map((l) => l.replace(/\s*नमस्कारान् समर्पयामि$/, '')).concat(['नमस्कारान् समर्पयामि']),
    instruction_en: 'Pray to the Goddess with this verse and prostrate. Then move the kalasham or image a little towards the north: she is sent home with an invitation to come back next year.',
    instruction_ta: 'இந்த ஸ்லோகத்தால் தேவியைப் ப்ரார்த்தித்து நமஸ்கரிக்கவும். பின் கலசத்தையோ விக்ரஹத்தையோ வடக்குப் பக்கம் சிறிது நகர்த்தவும்: அடுத்த ஆண்டு மீண்டும் வர அழைத்து தேவிக்கு விடை கொடுக்கப்படுகிறது.',
    meaning_en: 'Rise, Goddess, Chandeshi, having received this auspicious worship, and do me good together with your eight powers. Durga, Lakshmi and Vagdevi, worshipped, go to your own place, to return again when the year has passed. Take this worship I have offered as I was able, Goddess, for my protection, and go to your highest place. I return Sri Durga, Lakshmi and Saraswati to their places, for what is good, for well-being, and for coming again. I offer my prostrations.',
    philosophy_en: 'Samvatsare vyatite tu punaragamanaya, "to return when the year has passed". The release is worded as a farewell between people who will see each other again, which is why Vijayadashami is a day for beginning things rather than an ending.',
    src: NR(304, 'punah poojaa - yathaasthaanam'),
  },
];

/** Steps the 0062 test lets carry two offering verbs: one rubric in the book. */
export const TWO_VERBS_ONE_RUBRIC = [
  'Vighneshwara Gandham', 'Vighneshwara Pushpam', 'Kalasha Gandham', 'Pushpam',
];
const VERBS = /(समर्पयामि|दर्शयामि|आघ्रापयामि|निवेदयामि|धारयामि|पूजयामि)/g;

// --- validate -------------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };
const DEVA = /[\u0900-\u097F\uA8E0-\uA8FF]/;

for (const s of STEPS) if (Array.isArray(s.deva)) s.deva = s.deva.join('\n');

console.log('--- lists ---');
for (const [label, rows, n] of [['Vighneshwara 16', VIGHNESHWARA_16, 16], ['Peetha', PEETHA, 14],
  ['Navaratri anga', NAV_ANGA, 18], ['Navadurga', NAVADURGA, 9], ['Navakanya', NAVAKANYA, 9]]) {
  if (rows.length !== n) fail(`${label}: ${rows.length} rows, expected ${n}`);
  console.log(`  ${label}: ${rows.length}`);
}
if (!/शैलपुत्र/.test(NAVADURGA[0]) || !/सिद्धिदा/.test(NAVADURGA[8])) fail('Navadurga order');
if (!/कौमार्यै/.test(NAVAKANYA[0]) || !/सुभद्रायै/.test(NAVAKANYA[8])) fail('Navakanya order');
if (PP_BHAVA.some((l) => /तो भव|स्वामिन्/.test(l))) fail('Prana Pratishtha: a svami-column form leaked into the devi column');
if (PP_BHAVA.filter((l) => / भव ।$/.test(l)).length !== 9) fail(`Prana Pratishtha: ${PP_BHAVA.filter((l) => / भव ।$/.test(l)).length} bhava lines, expected 9`);

console.log('\n--- steps ---');
const titles = new Set();
const counts = { main: 0, punar: 0, udvasana: 0 };
for (const [i, s] of STEPS.entries()) {
  const at = `#${i + 1} ${s.title_en}`;
  if (titles.has(s.title_en)) fail(`${at}: title repeats`);
  titles.add(s.title_en);
  for (const f of ['title_en', 'title_ta', 'instruction_en', 'instruction_ta', 'meaning_en', 'philosophy_en', 'src', 'sec', 'phase']) {
    if (!s[f] || !String(s[f]).trim()) fail(`${at}: ${f} is empty`);
  }
  if (!S[s.sec]) fail(`${at}: unknown section ${s.sec}`);
  if (s.title_en.length > 60 || s.title_ta.length > 60) fail(`${at}: title too long`);
  const prose = `${s.instruction_en} ${s.meaning_en} ${s.philosophy_en}`;
  if (/\b(the book|this book|the edition|as before|see (above|below|page|step)|step \d+|page \d+|already done)\b/i.test(prose)) fail(`${at}: prose cites the source or sends the reader elsewhere`);
  if (/\bperformers?\b/i.test(prose)) fail(`${at}: says performer`);
  if (/\.\.\.|…|  /.test(prose + s.instruction_ta)) fail(`${at}: ellipsis or double space in prose`);
  for (const m of s.modes) counts[m]++;
  if (s.deva != null) {
    if (!DEVA.test(s.deva)) fail(`${at}: mantra is not Devanagari`);
    if (/[A-Za-z]/.test(s.deva.replace('[DYNAMIC_PANCHANGAM_DATA]', ''))) fail(`${at}: Latin left in the mantra: ${s.deva.match(/.*[A-Za-z].*/)[0]}`);
    if (/\.\.\.|…|\*|:/.test(s.deva)) fail(`${at}: ellipsis, asterisk or colon in the mantra`);
    if (/[ँ]/.test(s.deva)) fail(`${at}: candrabindu in the mantra`);
    const strip = (x) => x.replace(/[।॥–,()]/g, '');
    if (DEVA.test(strip(tr(s.deva, 'tamil')))) fail(`${at}: Devanagari leaked into Tamil`);
    if (DEVA.test(strip(tr(s.deva, 'iast')))) fail(`${at}: Devanagari leaked into IAST`);
    const verbs = (s.deva.match(VERBS) ?? []).length;
    if (verbs > 1 && !TWO_VERBS_ONE_RUBRIC.includes(s.title_en)) fail(`${at}: ${verbs} offering verbs on one screen`);
  } else if (!s.archana && !s.namavali_id) {
    fail(`${at}: has no mantra, archana or namavali`);
  }
  if (s.archana && s.archana.rows.length !== s.archana.expect) fail(`${at}: archana ${s.archana.rows.length}, expected ${s.archana.expect}`);
}
// Distinct prose within the rite, as proofread demands (>= 60 chars), except a
// step and its "(again)".
for (const f of ['instruction_en', 'meaning_en', 'philosophy_en']) {
  const seen = new Map();
  for (const s of STEPS) {
    const v = s[f];
    if (v.length < 60) continue;
    const base = (t) => t.replace(/\s*\([^()]*\)\s*$/, '');
    const prev = seen.get(v);
    if (prev && base(prev) !== base(s.title_en)) fail(`${f}: "${prev}" and "${s.title_en}" share text`);
    seen.set(v, s.title_en);
  }
}
const dyn = STEPS.filter((s) => s.dynamic);
if (dyn.length !== 1 || (dyn[0].deva.match(/\[DYNAMIC_PANCHANGAM_DATA\]/g) ?? []).length !== 1) fail('exactly one dynamic sankalpam with one slot');
console.log(`  ${STEPS.length} steps; main ${counts.main}, punar ${counts.punar}, udvasana ${counts.udvasana}`);

if (process.argv.includes('--show')) {
  for (const [i, s] of STEPS.entries()) {
    console.log(`\n### ${i + 1}. ${s.title_en}  [${S[s.sec][0]}] ${s.modes.join(',')}`);
    if (s.deva) console.log(s.deva);
    if (s.archana) for (const r of s.archana.rows) console.log(`  ${r.name} | ${r.act ?? ''}`);
    if (s.namavali_id) console.log(`  (namavali ${s.namavali_id})`);
  }
}
if (process.argv.includes('--table')) {
  for (const [i, s] of STEPS.entries()) {
    console.log(`| ${i + 1} | ${S[s.sec][0]} | ${s.title_en} | ${s.modes.join(', ')} | ${s.src.replace(`${BOOK}, `, '')} |`);
  }
}

if (failed) { console.error('\nvalidation FAILED; nothing written'); process.exit(1); }
console.log('\nvalidation passed');
if (!process.argv.includes('--emit')) { console.log('(no SQL written; pass --emit)'); process.exit(0); }

// --- emit -----------------------------------------------------------------------
const out = [];
const o = (s) => out.push(s);
o(`-- Navaratri Pooja, rebuilt from the book: the full Purvanga inlined, one
-- action and its words per screen. Generated by
-- scripts/build-navaratri-from-the-book.mjs; do not edit by hand.
--
-- Source: ${BOOK}, Purvanga pp.1-26 and Navaratri Puja pp.286-304, read from
-- the page transcripts by book page and block. ${STEPS.length} steps replace 31:
-- First Day ${counts.main}, Days 2 to 9 ${counts.punar}, Vijayadashami ${counts.udvasana}.
-- The pooja, its modes, its namavalis, samagri and naivedyam are untouched.
-- See docs/plans/navaratri-rebuild-0062.md.

begin;

-- Re-runnable: the rite's steps are replaced wholesale. Archana rows go with
-- them by cascade.
delete from public.pooja_steps where pooja_id = ${q(NAV)};
`);

STEPS.forEach((s, i) => {
  const n = i + 1;
  const [se, st] = S[s.sec];
  o(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, section_en, section_ta, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   meaning_en, philosophy_en, gender_rule, scripts_generated, is_dynamic_sankalpam,
   namavali_id, source_ref)
values (${q(NAV)}, ${n}, ${q(s.phase)}, '{${s.modes.join(',')}}', ${q(se)}, ${q(st)}, ${q(s.title_en)}, ${q(s.title_ta)},
        ${q(s.instruction_en)},
        ${q(s.instruction_ta)},
        ${q(s.deva ?? null)},
        ${q(s.deva ? tr(s.deva, 'tamil') : null)},
        ${q(s.deva ? tr(s.deva, 'iast') : null)},
        ${q(s.meaning_en)},
        ${q(s.philosophy_en)}, ${q(s.gender ?? 'all')}, true, ${s.dynamic ? 'true' : 'false'},
        ${q(s.namavali_id ?? null)}, ${q(s.src)});
`);
  if (s.archana) {
    const ref = `(select id from public.pooja_steps where pooja_id = ${q(NAV)} and step_number = ${n})`;
    o(`insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,
   offering_deva, offering_en, offering_ta)
values`);
    o(s.archana.rows.map((a, j) => `  (${ref}, ${j + 1}, ${q(a.name)}, ${q(tr(a.name, 'tamil'))}, ${q(tr(a.name, 'iast'))}, ` +
      `${q(a.act)}, ${q(a.en)}, ${q(a.act ? tr(a.act, 'tamil') : a.ta)})`).join(',\n') + ';\n');
  }
});

o('commit;');
o(`
-- Verify:
--   select count(*) filter (where 'main' = any(modes)), count(*) filter (where 'punar' = any(modes)),
--          count(*) filter (where 'udvasana' = any(modes)) from pooja_steps where pooja_id = '${NAV}';
--   -- ${counts.main}, ${counts.punar}, ${counts.udvasana}`);
emitMigration(MIGRATION, out.join('\n'));
