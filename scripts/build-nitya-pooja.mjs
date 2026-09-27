#!/usr/bin/env node
/**
 * The Nitya Panchayatana Pooja -- the daily rite.
 *
 *   node scripts/build-nitya-pooja.mjs          # validate
 *   node scripts/build-nitya-pooja.mjs --emit   # write 0036 and 0037
 *
 * WHAT 0037 GOT WRONG, AND WHERE IT IS FIXED. As emitted and applied, 0037 has
 * four faults that proofread caught and this script's own checks did not --
 * because those checks COUNTED rows and the faults were inside them. The
 * tarpanam stored row numbers as deity names, "(Morning)" leaked into a mantra,
 * the sankalpam kept the book's almanac blanks instead of the app's dynamic
 * slot, and no samagri or naivedyam were written at all.
 * 0039_nitya_repair.sql fixes all four in the database. The code below is
 * corrected so that re-emitting produces right SQL and the next pooja built from
 * this template does not inherit the bug -- but 0037 AS APPLIED is the broken
 * one, which is why there is a repair migration rather than a quiet regeneration
 * of a migration that has already run.
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), pp.27-51, transcribed page by
 * page into G:\My Drive\Pooja Vidhi\extracted\transcripts\2-nitya.
 *
 * WHY THIS IS SHAPED DIFFERENTLY FROM THE OTHER TWO POOJAS.
 *
 * Ganesha and Varalakshmi are one deity with one sequence. This is not. The
 * daily rite is PANCHAYATANA: five deities in a fixed spatial arrangement --
 * Shiva in the centre, Vishnu north-east, Surya south-east, Vinayaka south-west,
 * Devi north-west -- each invoked with its own VEDIC verse rather than a puranic
 * dhyana shloka, and each given its own archana with its own flower.
 *
 * So the pooja carries five avahanams and five archanas where the others carry
 * one of each, and its deity_id names the centre rather than the whole.
 *
 * TWO MIGRATIONS, NOT ONE, AND THE REASON IS POSTGRES.
 *
 * ritual_class is an enum and has no value for a daily rite -- 0001 enumerates
 * deity_pooja, vratam, tarpanam, homam, domestic and temple, and a nitya pooja
 * is none of them. Adding the value is right. But Postgres will not let a new
 * enum value be USED in the same transaction that adds it, so the ALTER TYPE
 * has to land and commit before the insert that names it. 0036 adds the value;
 * 0037 uses it.
 *
 * THE PURVANGAM IS COPIED, NOT RE-DERIVED.
 *
 * The book itself does not reprint the shared opening: page 29 lists aasana,
 * ghanta, kalasha, shankha, aatma, peetha and guru dhyanam as PAGE REFERENCES
 * into the Purvanga section. This migration does the same thing, inserting them
 * with `insert ... select` from the Ganesha pooja, which has already been
 * reviewed against those pages. Re-deriving them from the transcripts would
 * produce a second copy that could drift from the first, and would not inherit
 * a correction made to one and not the other.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/2-nitya/';
const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri), pp.27-51';
const POOJA = 'nitya_panchayatana';

const byPage = {};
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(DIR + f, 'utf8'));
  if (d.quality !== 'duplicate') byPage[d.book_page] = d;
}
const block = (p, i) => {
  const b = byPage[p] && byPage[p].blocks[i];
  if (!b) throw new Error(`p.${p} has no block ${i}`);
  return b;
};
/**
 * The transcripts keep the book's own English labels inside the Devanagari --
 * "(Morning)", "(Evening)" -- which is right for a transcription and wrong for a
 * field that gets transliterated, since Sanscript would render the English. The
 * label belongs in variant_note_en. 0037 shipped without this strip, and
 * proofread caught "Morning" sitting in a mantra.
 */
const clean = (t) => t.replace(/\s*\((Morning|Evening)\)\s*/g, '').replace(/[ \t]+$/gm, '').trim();
function deva(p, ...idx) {
  return idx.map((i) => {
    const b = block(p, i);
    if (b.type !== 'deva') throw new Error(`p.${p}[${i}] is ${b.type}, not deva`);
    return clean(b.lines.join('\n'));
  }).join('\n');
}
function names(p, i) {
  const b = block(p, i);
  if (b.type !== 'namavali') throw new Error(`p.${p}[${i}] is ${b.type}, not namavali`);
  return b.names;
}
function rows(p, i) {
  const b = block(p, i);
  if (b.type !== 'table') throw new Error(`p.${p}[${i}] is ${b.type}, not table`);
  return b.rows;
}
const scripts = (d) => ({
  deva: d,
  ta: transliterate(Sanscript, d, 'tamil'),
  iast: transliterate(Sanscript, d, 'iast'),
});

// --- the five deities, in the book's own spatial order (p.27) ---------------
const DEITIES = [
  { id: 'shiva',   en: 'Shiva',    deva: 'शिव',     ta: 'சிவன்',      dative: 'श्री सांब परमेश्वराय', cls: 'god',     place: 'the centre' },
  { id: 'vishnu',  en: 'Vishnu',   deva: 'विष्णु',   ta: 'விஷ்ணு',    dative: 'श्री महाविष्णवे',      cls: 'god',     place: 'the north-east' },
  { id: 'surya',   en: 'Surya',    deva: 'सूर्य',    ta: 'சூரியன்',   dative: 'श्री सूर्यनारायणाय',   cls: 'god',     place: 'the south-east' },
  { id: 'ambika',  en: 'Ambika',   deva: 'अम्बिका',  ta: 'அம்பிகை',   dative: 'श्री अम्बिकायै',       cls: 'goddess', place: 'the north-west' },
];

// --- purvangam steps taken from the Ganesha pooja ----------------------------
const COPIED = [
  ['Achamanam', 1], ['Anga Vandanam', 2], ['Vighneshwara Dhyanam', 3], ['Pranayamam', 4],
  ['Asana Pooja', 6], ['Ghanta Pooja', 7], ['Kalasha Pooja', 8], ['Shankha Pooja', 9],
  ['Atma Pooja', 10], ['Peetha Pooja', 11], ['Guru Dhyanam', 12],
];

// --- steps written from the book ---------------------------------------------
const S = (n, phase, en, ta, deva_, instruction_en, instruction_ta, meaning_en, philosophy_en, extra = {}) =>
  ({ n, phase, en, ta, deva: deva_, instruction_en, instruction_ta, meaning_en, philosophy_en, ...extra });

const STEPS = [
  S(5, 'purvangam', 'Sankalpam', 'ஸங்கல்பம்', deva('28', 4),
    'Hold akshatai in the right hand, state where and when you are, and say what this pooja is for. Discard the akshatai to the north afterwards and rinse the hand.',
    'வலது கையில் அக்ஷதையை வைத்துக்கொண்டு, இடம் காலம் கூறி, இந்தப் பூஜை எதற்காக என்பதைச் சொல்லவும். பின் அக்ஷதையை வடக்கே விட்டு கையைக் கழுவவும்.',
    'The same cosmological frame as every other sankalpam, ending in a purpose that belongs to this rite alone: achanchala niSHkapaTa bhakti siddhyartham, for the attainment of unwavering and guileless devotion, and for the worship of the five panchayatana deities.',
    'Every sankalpam in this book shares its opening and differs only in its last clause. The daily rite does not ask for a son, a cure or a marriage. It asks for steadiness -- which is the only thing a rite repeated every morning could honestly be for.',
    { dynamic: true }),

  S(13, 'pradhana', 'Opening the Panchayatana', 'பஞ்சாயதனம் திறத்தல்', deva('30', 2),
    'Before anything else, ask that the box or cupboard holding the deities be opened, addressing Nandikeshvara who keeps the threshold.',
    'எல்லாவற்றிற்கும் முன், தெய்வங்கள் வைக்கப்பட்டுள்ள பெட்டியையோ பூஜை அறையையோ திறக்க, வாயிற்காவலரான நந்திகேஸ்வரரை வேண்டவும்.',
    'Knowable through the end of the Vedas, whose form is the whole world: unbolt the door, O Kalakala. Nandikeshvara, all-knowing, intent on the meditation of Shiva, you ought to grant permission for the worship of Maheshvara.',
    'The rite begins by asking permission to begin. The cupboard is not furniture here but a threshold, and the one who keeps it is asked rather than brushed past. It is the same courtesy the pooja will extend to the deity a moment later, practised first on the door.'),

  S(14, 'pradhana', 'Avahanam — Vinayaka', 'ஆவாஹனம் — விநாயகர்', deva('30', 7),
    'Invoke Vinayaka in the red Shonabhadra stone, in the south-west. Offer flowers and akshatai.',
    'தென்மேற்கில் உள்ள சிவப்பு ஶோணபத்ரக் கல்லில் விநாயகரை ஆவாஹனம் செய்யவும். மலர்களும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    'We invoke you, Ganapati of the hosts, poet of poets, most renowned; eldest lord of prayers, lord of the sacred word, come and sit at our seat, hearing us, with your protections.',
    'The daily rite invokes each deity with a VEDIC verse, not a puranic dhyana shloka. This is gaNaanaam tvaa from the Rigveda, the same verse the Purvanga gates on knowing the intonation.'),

  S(15, 'pradhana', 'Avahanam — Surya', 'ஆவாஹனம் — சூரியன்', deva('31', 3),
    'Invoke Surya with Chhaya and Sanjna in the crystal, in the south-east. Offer flowers and akshatai.',
    'தென்கிழக்கில் உள்ள ஸ்படிகத்தில் சாயா ஸம்ஜ்ஞா ஸமேத சூரியனை ஆவாஹனம் செய்யவும். மலர்களும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    'Moving with the true light, settling the immortal and the mortal, Savita comes on his golden chariot, beholding the worlds.',
    'Surya is invoked in a piece of crystal, the one deity of the five given a transparent stone. Light is worshipped in the thing that lets light through.'),

  S(16, 'pradhana', 'Avahanam — Vishnu', 'ஆவாஹனம் — விஷ்ணு', deva('31', 7),
    'Invoke Mahavishnu with Bhumi and Nila in the shalagrama, in the north-east. Offer flowers and akshatai.',
    'வடகிழக்கில் உள்ள ஶாலக்ராமத்தில் பூமி நீளா ஸமேத மஹாவிஷ்ணுவை ஆவாஹனம் செய்யவும். மலர்களும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    'The Purusha of a thousand heads, a thousand eyes, a thousand feet; having covered the earth on every side, he stood beyond it by ten fingers\u2019 breadth.',
    'The opening of the Purusha Sukta, used here as an invocation. The verse does not describe a form to picture but a scale that will not fit in the room, and the shalagrama it is said over is the size of a thumb.'),

  S(17, 'pradhana', 'Avahanam — Shiva', 'ஆவாஹனம் — சிவன்', deva('32', 3),
    'Invoke Samba Parameshvara in the linga, at the centre. Offer flowers and akshatai.',
    'நடுவில் உள்ள லிங்கத்தில் ஸாம்ப பரமேஸ்வரரை ஆவாஹனம் செய்யவும். மலர்களும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    'We worship the three-eyed one, fragrant, increaser of nourishment; as a cucumber is freed from its stalk, may I be freed from death, not from immortality.',
    'The Mrityunjaya verse, said at the centre of the arrangement. The other four are invoked where they stand; this one is invoked where everything else is arranged around.'),

  S(18, 'pradhana', 'Avahanam — Devi', 'ஆவாஹனம் — தேவி', deva('32', 7),
    'Invoke Ambika in her image, in the north-west. Offer flowers and akshatai.',
    'வடமேற்கில் உள்ள பிம்பத்தில் அம்பிகையை ஆவாஹனம் செய்யவும். மலர்களும் அக்ஷதையும் சமர்ப்பிக்கவும்.',
    'Gauri fashioned the waters, she of one foot, two feet, four feet, eight feet, nine feet, become the thousand-syllabled in the highest heaven.',
    'A verse about speech counted in feet of metre, said to the goddess. The five invocations are five different Vedas speaking, and this is the one that is about language itself.'),

  S(19, 'pradhana', 'Samasta Upachara', 'ஸமஸ்த உபசாரம்', deva('33', 1, 4, 7, 10, 13),
    'Offer the seat, water for the feet, the welcome water, water to sip, and the madhuparkam of milk, ghee, honey and curd — three drops sprinkled with a flower.',
    'ஆசனம், பாத்யம், அர்க்யம், ஆசமனீயம், பின் பால் நெய் தேன் தயிர் கலந்த மதுபர்க்கம் — மலரால் மூன்று துளிகள் தெளிக்கவும்.',
    'To Samba Parameshvara with his retinue: I offer the seat, the water for the feet, the welcome water, the water for sipping, and the madhuparkam.',
    'The five deities are addressed together from here on, as saparivaara — with the retinue. Having been invoked one by one in their places, they are served as one household.'),

  S(20, 'pradhana', 'Shuddhodaka Snanam', 'ஶுத்தோதக ஸ்நானம்', deva('33', 17) + '\n' + deva('34', 2),
    'Bathe the deities with water while reciting the aapo hi shtha verses, or Purusha Sukta, Rudram and Chamakam if you know them. Then offer water to sip.',
    'ஆபோ ஹிஷ்டா மந்திரம் சொல்லி தெய்வங்களை நீரால் அபிஷேகம் செய்யவும்; புருஷ ஸூக்தம், ருத்ரம், சமகம் தெரிந்திருந்தால் அவற்றைச் சொல்லலாம். பின் ஆசமனீயம் சமர்ப்பிக்கவும்.',
    'Waters, you are the bringers of joy; grant us nourishment, and the sight of great delight. Give us here a share of that most auspicious essence of yours, like mothers who long to give.',
    'The book allows the bath to be as long as the reciter is able: the aapo hi shtha for anyone, the Rudram for one who has learnt it, Gayatri alone for one who has not. The rite scales to the person rather than the person to the rite.'),

  S(21, 'pradhana', 'Vastram, Upaveetam & Gandham', 'வஸ்த்ரம், உபவீதம் & கந்தம்', deva('34', 5, 8, 11),
    'Offer new cloth, the sacred thread, and sandalwood paste — with turmeric and vermillion over the sandal.',
    'புதிய வஸ்த்ரம், யஜ்ஞோபவீதம், சந்தனம் சமர்ப்பிக்கவும்; சந்தனத்தின் மேல் மஞ்சளும் குங்குமமும் சேர்க்கவும்.',
    'I offer the cloth. I offer the sacred thread. I place the sandal paste, and over the sandal, turmeric and vermillion.',
    'Where a real cloth or thread is not to hand, the book\u2019s own substitution rule applies: flowers or akshatai stand in for vastra, abharana and yajnopavita, and akshatai for any upachara whose object one does not have.'),

  S(22, 'pradhana', 'Abharanam, Akshatai & Pushpam', 'ஆபரணம், அக்ஷதை & புஷ்பம்', deva('34', 14, 16, 18),
    'Offer an ornament, akshatai, and then the garland and loose flowers.',
    'ஆபரணம், அக்ஷதை, பின் மாலையும் உதிரி மலர்களும் சமர்ப்பிக்கவும்.',
    'I offer the ornament. I offer the akshatai. I offer the garland, and worship with flowers.',
    'The last of the sixteen honours before the names begin. From here the pooja stops giving things and starts saying who is being given to.'),

  S(28, 'uttara', 'Dhoopam & Deepam', 'தூபம் & தீபம்',
    deva('39', 7) + '\n' + deva('40', 2) + '\n' + deva('41', 2),
    'Offer incense, then wave the ghee lamp, then offer water.',
    'தூபம் காட்டி, பின் நெய் தீபம் காட்டி, பின் ஆசமனீயம் சமர்ப்பிக்கவும்.',
    'Ten-fold guggulu incense, fragrant and pleasing, fit to be smelled by all the gods: accept this incense. Blaze up, Jatavedas, driving away misfortune; bring me cattle and life from every direction.',
    'Both offerings are preceded by a Vedic verse and followed by a puranic one. The book gives the older and the newer side by side without remarking on it, which is how a living tradition usually carries its own history.'),

  S(29, 'uttara', 'Naivedyam', 'நைவேத்யம்',
    deva('41', 7, 10, 13, 18) + '\n' + deva('42', 1, 3, 4, 7),
    'Clean a patch of floor with water, set the offerings there on a plate or plantain leaf, and sprinkle water over them. Circle the plate with water three times, then again. Make the feeding gesture with the right hand after each svaahaa.',
    'தரையை நீரால் சுத்தம் செய்து, தட்டிலோ வாழையிலையிலோ நைவேத்யத்தை வைத்து, நீர் தெளிக்கவும். உத்தரிணியால் நீர் எடுத்து மூன்று முறை வலம் சுற்றி, மீண்டும் ஒரு முறை சுற்றவும். ஒவ்வொரு ஸ்வாஹாவுக்குப் பின்னும் வலது கையால் ஊட்டும் சைகை செய்யவும்.',
    'Honey the winds pour forth for the righteous, honey the rivers run; may the herbs be honey for us. Honey by night and at dawn, honey the earthly realm, honey be heaven our father. — then the offering of cooked rice, ghee-and-jaggery payasam, urad vada, appam, chitrannam, laddu, modaka, two halves of coconut, plantain and milk.',
    'The madhuvata verses stand between the six prana offerings and the food itself, and neither of the other two poojas in this app has them. They do not describe the food; they describe the world the food came out of.',
    { variant: deva('41', 15),
      variantNote: 'Recited in place of the morning line when the pooja is performed in the evening. The book prints the two forms side by side, labelled (Morning) and (Evening).' }),

  S(30, 'uttara', 'Tambulam', 'தாம்பூலம்', deva('43', 0, 2, 4),
    'Offer water after the food, then betel leaves and areca nut with a little camphor, sprinkled with water.',
    'நைவேத்யத்திற்குப் பின் நீர் சமர்ப்பித்து, பின் வெற்றிலை பாக்குடன் சிறிது கற்பூரம் சேர்த்து, நீர் தெளித்துச் சமர்ப்பிக்கவும்.',
    'You are the covering of immortality. I offer the after-water. — Together with areca nut and betel leaves, mixed with camphor powder: accept this tambulam.',
    'The meal is closed the way a meal is closed in the house: water, then betel. The rite keeps borrowing the manners of hospitality because that is what an upachara is.'),

  S(31, 'uttara', 'Karpura Neerajanam', 'கர்ப்பூர நீராஜனம்',
    deva('43', 8, 9) + '\n' + deva('44', 0, 4, 7, 10),
    'Wave the camphor flame. Then hold your hands to it and bring them to your eyes. Then offer water.',
    'கற்பூர தீபம் காட்டவும். பின் கைகளை அந்த ஜ்வாலையில் காட்டி கண்களில் ஒற்றிக்கொள்ளவும். பின் ஆசமனீயம் சமர்ப்பிக்கவும்.',
    'Soma takes his kingship — the king who sacrifices with Soma becomes the god-impelled king. He who knows this city of Brahman, wrapped in immortality, to him Brahma and Brahman grant life, fame and offspring. This auspicious lamp made with camphor, like moon and sun and fire: accept it, Parameshvara.',
    'rakSHaam dhaarayaami -- the hands are held to the flame and brought to the eyes. It is the part of the pooja everyone in the room actually does, and the only line here addressed to the people rather than the deity.'),

  S(32, 'uttara', 'Mantra Pushpam', 'மந்த்ர புஷ்பம்', deva('45', 1),
    'Offer flowers held in cupped palms.',
    'கைகளைக் கூப்பி மலர்களைச் சமர்ப்பிக்கவும்.',
    'He who knows the flower of the waters becomes possessed of flowers, offspring and cattle. The moon is the flower of the waters. He who knows the abode of the waters becomes possessed of an abode. Salutation to Kubera Vaishravana, the great king.',
    'The real mantra pushpam, from the Taittiriya Aranyaka, ending in a salutation to Kubera. It is a riddle about water and the moon rather than a praise of the deity, and it is what is said while the flowers are actually in the hands.'),

  S(33, 'uttara', 'Pradakshina Namaskaram', 'ப்ரதக்ஷிண நமஸ்காரம்',
    deva('45', 5) + '\n' + deva('46', 2),
    'Circle the deities with palms together, or turn in place, and prostrate. Men with eight limbs touching, women with five.',
    'கைகூப்பி தெய்வங்களை வலம் வரவும், அல்லது நின்ற இடத்திலேயே சுற்றவும். பின் நமஸ்கரிக்கவும் — ஆண்கள் சாஷ்டாங்கமாகவும், பெண்கள் பஞ்சாங்கமாகவும்.',
    'Whatever sins were committed in other births, those are destroyed at every step of the circumambulation. — Aditya, Ambika, Vishnu, Gananatha and Maheshvara: remembering these five deities daily destroys great sin.',
    'The second verse is the whole rite in one line: the five are named together, and the merit claimed is for remembering them DAILY. It is the closest the book comes to saying why a panchayatana pooja is the one that is done every morning.'),

  S(34, 'uttara', 'Prarthana', 'ப்ரார்த்தனை', deva('46', 5),
    'Ask, and prostrate.',
    'வேண்டிக்கொண்டு நமஸ்கரிக்கவும்.',
    'A death without struggle, a life without indignity: grant me these, Shambhu, and unwavering devotion to you. I do not know how to invoke, nor how to take leave; I do not know the manner of worship. Forgive me, Parameshvara. There is no other refuge; you alone are my refuge. Therefore, out of compassion, protect me, Maheshvara.',
    'One of the best known household prayers in this tradition, and neither of the other two poojas in this app carries it. It asks for two things only, and neither of them is prosperity.'),

  S(35, 'uttara', 'Rajopachara', 'ராஜோபசாரம்', deva('47', 3),
    'Offer akshatai in place of the parasol, fan, dance, song and instrument.',
    'குடை, சாமரம், நடனம், கீதம், வாத்யம் ஆகிய அனைத்திற்கும் பதிலாக அக்ஷதை சமர்ப்பிக்கவும்.',
    'For the parasol, the fan, dance, song, instrument and every royal honour: I offer akshatai.',
    'The honours due to a king, offered by a household that has none of them. The book ends this line akSHataan samarpayaami -- akshatai IN PLACE OF the things -- which is its own substitution rule applied to the grandest upachara in the rite.'),

  S(37, 'uttara', 'Nandikeshvara Pooja', 'நந்திகேஸ்வர பூஜை',
    deva('49', 2, 5, 8, 10, 12),
    'If there is a separate Nandi, worship it; otherwise the Nandi on the bell. Offer sandal and vermillion, place on it a flower already offered to Shiva, then a little of the naivedyam in a copper plate with water poured into it.',
    'தனியாக நந்தி இருந்தால் அதற்கும், இல்லையேல் மணியின் மேல் உள்ள நந்திக்கும் பூஜை செய்யவும். சந்தனம் குங்குமம் சமர்ப்பித்து, சிவனுக்கு சமர்ப்பித்த மலரை நந்தியின் மேல் வைக்கவும். பின் செம்புத் தட்டில் சிறிது நைவேத்யம் வைத்து நீர் விட்டுச் சமர்ப்பிக்கவும்.',
    'To Nandikeshvara: worshipped with sandal, flowers, incense and lamp, and with every service. Banaravana, Chandesha, Nandi, Bhringi, Rita and the rest: may all the followers of Shambhu receive this leaving of Mahadeva. To Nandikeshvara: I offer the nirmalya bali.',
    'nirmaalya bali -- an offering made FROM a previous offering. What was given to the five is given on to their attendants, and the app has no other step of this shape. The flower placed on Nandi has already been on Shiva.'),

  S(38, 'uttara', 'Teertham', 'தீர்த்தம்', deva('50', 3, 6),
    'Lift the conch in the right hand and circle it three times over the deities. Shift it to the left hand, pour water into the right, sprinkle it on everyone present including yourself, and wipe the eyes. Then sip the bathing water as teertham and give it to everyone else.',
    'சங்கை வலது கையில் எடுத்து தெய்வங்களின் மேல் மூன்று முறை சுற்றவும். பின் இடது கைக்கு மாற்றி, வலது கையில் நீர் விட்டு, அங்குள்ள அனைவர் மேலும் தன் மேலும் தெளித்து, கண்களில் ஒற்றிக்கொள்ளவும். பின் அபிஷேக நீரைத் தீர்த்தமாக உட்கொண்டு, மற்ற அனைவருக்கும் கொடுக்கவும்.',
    'The water held in the conch, circled above Shankara, burns away even the killing of a brahmin clinging to the limbs of men. — Remover of untimely death, averter of every disease, destroyer of all sin: the water from the feet of the panchayatana deities is auspicious, auspicious.',
    'Both rubrics here are about everyone else in the room: the conch water is sprinkled on all present INCLUDING oneself, and the teertham is given to all the other members of the household. The rest of this app is written for a single performer; this step is not.'),

  S(39, 'uttara', 'Visarjanam', 'விஸர்ஜனம்',
    deva('51', 0, 3, 5),
    'Spread both arms, then bring them crossed to your chest as if embracing, holding that the Lord with all his retinue has entered your heart again. Offer a spoonful of water. Then put the images back in the box and close it.',
    'இரு கைகளையும் விரித்து, பின் அணைப்பது போல் மார்பில் குறுக்காகக் கொண்டுவரவும் — இறைவன் தன் பரிவாரத்துடன் மீண்டும் இதயத்தில் புகுந்ததாக எண்ணவும். ஒரு உத்தரிணி நீர் சமர்ப்பிக்கவும். பின் தெய்வங்களை மீண்டும் பெட்டியில் வைத்து மூடவும்.',
    'Into the pericarp of the lotus of the heart, O Shankara with Uma: enter, Mahadeva, together with all your attendants. — Whatever I do with body, speech, mind, senses, intellect or by nature, I offer all of it to Narayana. Om, that is the truth; let it be an offering to Brahman.',
    'The rite closes by taking the deity back IN, which is the mirror of the invocation and is the opposite of what the other two poojas do -- they move the deity north and stop. The cupboard that was asked to unbolt at the start is closed again here.'),
];

// --- archanas ----------------------------------------------------------------
const ARCHANA = [
  { n: 23, en: 'Archana — Vinayaka', ta: 'அர்ச்சனை — விநாயகர்', flower: 'durva grass', flowerTa: 'அருகம்புல்',
    names: names('35', 3), close: deva('35', 4), count: 'sixteen' },
  { n: 24, en: 'Archana — Surya', ta: 'அர்ச்சனை — சூரியன்', flower: 'lotus', flowerTa: 'தாமரை',
    names: names('36', 2), close: deva('36', 3), count: 'twelve' },
  { n: 25, en: 'Archana — Vishnu', ta: 'அர்ச்சனை — விஷ்ணு', flower: 'tulsi leaves', flowerTa: 'துளசி',
    names: [...names('36', 7), ...names('37', 0), ...names('37', 2)], close: deva('37', 3), count: 'twenty-four' },
  { n: 26, en: 'Archana — Shiva', ta: 'அர்ச்சனை — சிவன்', flower: 'vilva leaves', flowerTa: 'வில்வம்',
    names: names('38', 5), close: deva('38', 6), count: 'eight' },
  { n: 27, en: 'Archana — Devi', ta: 'அர்ச்சனை — தேவி', flower: 'red aparajita', flowerTa: 'சிவப்பு அபராஜிதா',
    names: names('39', 2), close: deva('39', 3), count: 'eight' },
];

// The table columns are ['No.', 'Name', 'Verb'] -- the FIRST cell is the printed
// row number. Reading this as [name, verb] stored "1" as the deity's name in all
// seventeen rows, and 0037 shipped exactly that. 0039 repairs the data; this
// stops the next pooja inheriting the mistake.
const TARPANA = [...rows('47', 7), ...rows('48', 1)].map(([, name, verb]) => [name, verb]);

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- steps written from the book ---');
for (const s of STEPS) {
  const sc = scripts(s.deva);
  const strip = (x) => x.replace(/[।॥–,()]/g, '');
  if (!/[\u0900-\u097F]/.test(s.deva)) fail(`#${s.n} ${s.en}: not Devanagari`);
  if (/[\u0900-\u097F]/.test(strip(sc.ta))) fail(`#${s.n} ${s.en}: Devanagari leaked into Tamil`);
  if (/:/.test(sc.deva + sc.ta + sc.iast)) fail(`#${s.n} ${s.en}: an ASCII colon survived`);
  for (const f of ['instruction_en', 'instruction_ta', 'meaning_en', 'philosophy_en']) {
    if (!s[f.replace('_en', '_en').replace('instruction_ta', 'instruction_ta')] && !s[f]) fail(`#${s.n} ${s.en}: ${f} is empty`);
  }
  console.log(`  ${String(s.n).padStart(2)} ${s.phase.padEnd(9)} ${s.en}`);
}

console.log('\n--- the five archanas ---');
for (const a of ARCHANA) {
  if (!a.names.length) fail(`${a.en}: no names`);
  if (/:/.test(a.names.join(''))) fail(`${a.en}: an ASCII colon in the names`);
  console.log(`  ${String(a.n).padStart(2)} ${a.en.padEnd(22)} ${String(a.names.length).padStart(2)} names (${a.count}), with ${a.flower}`);
}
const EXPECT = { 23: 16, 24: 12, 25: 24, 26: 8, 27: 8 };
for (const a of ARCHANA) if (a.names.length !== EXPECT[a.n]) fail(`${a.en}: ${a.names.length} names, expected ${EXPECT[a.n]}`);

console.log('\n--- deva tarpanam ---');
if (TARPANA.length !== 17) fail(`tarpanam has ${TARPANA.length} rows, expected 17`);
console.log(`  ${TARPANA.length} offerings: 8 deities, their 8 consorts, and a closing catch-all`);

console.log('\n--- purvangam copied from Ganesha ---');
console.log(`  ${COPIED.length} steps: ${COPIED.map((c) => c[0]).join(', ')}`);

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit ---------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

const enumSql = [
  '-- =============================================================================',
  '-- 0036_ritual_class_nitya.sql',
  '--',
  '-- GENERATED by scripts/build-nitya-pooja.mjs. Do not hand-edit.',
  '--',
  '-- ritual_class enumerates deity_pooja, vratam, tarpanam, homam, domestic and',
  '-- temple. A daily panchayatana pooja is none of them, so the taxonomy gets a',
  '-- sixth value rather than the pooja getting a label that is not true.',
  '--',
  '-- THIS IS ITS OWN MIGRATION FOR A POSTGRES REASON. A new enum value cannot be',
  '-- USED in the same transaction that adds it. 0037 inserts a row naming nitya,',
  '-- so the value has to be committed first.',
  '-- =============================================================================',
  '',
  'begin;',
  '',
  "alter type ritual_class add value if not exists 'nitya';",
  '',
  'commit;',
].join('\n') + '\n';

const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0037_nitya_panchayatana_pooja.sql');
out('--');
out('-- GENERATED by scripts/build-nitya-pooja.mjs. Do not hand-edit.');
out('--');
out('-- The daily rite, from Sampradaya Vratha Pooja Vidhi (Giri), pp.27-51.');
out('--');
out('-- It is shaped differently from the other two poojas. Ganesha and Varalakshmi');
out('-- are one deity with one sequence; this is FIVE deities in a fixed spatial');
out('-- arrangement -- Shiva centre, Vishnu north-east, Surya south-east, Vinayaka');
out('-- south-west, Devi north-west -- each invoked with its own VEDIC verse rather');
out('-- than a puranic dhyana shloka, and each given its own archana with its own');
out('-- flower. So there are five avahanams and five archanas, and deity_id names');
out('-- the centre rather than the whole.');
out('--');
out('-- The purvangam is COPIED from the Ganesha pooja rather than re-derived. The');
out('-- book does the same thing: page 29 lists the shared opening steps as page');
out('-- references into the Purvanga section instead of reprinting them. A second');
out('-- derivation would be a second copy that could drift from the first.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 1. the four deities the app did not have --------------------------------');
for (const d of DEITIES) {
  out(`insert into public.deities (id, name_en, name_deva, name_ta, name_dative_deva, class)`);
  out(`values (${q(d.id)}, ${q(d.en)}, ${q(d.deva)}, ${q(d.ta)}, ${q(d.dative)}, ${q(d.cls)})`);
  out('on conflict (id) do nothing;');
}
out();

out('-- --- 2. the pooja -------------------------------------------------------------');
out('-- rule_type is null on purpose: 0002 says it is nullable because "a pooja can');
out('-- be performed on any day", and a daily rite is exactly that. None of the eight');
out('-- calendar rules expresses "every morning", and inventing one to say so would');
out('-- put a false rule in the scheduler.');
out('insert into public.poojas');
out('  (id, title_en, title_ta, ritual_class, deity_id, description_en, description_ta,');
out('   duration_mins, eligibility, rule_type, rule_notes, source_ref)');
out('values');
out(`  (${q(POOJA)}, 'Nitya Panchayatana Pooja', 'நித்ய பஞ்சாயதன பூஜை',`);
out(`   'nitya', 'shiva',`);
out(`   ${q('The daily household rite, in which five deities are worshipped together in a fixed arrangement: Shiva at the centre, Vishnu to the north-east, Surya to the south-east, Vinayaka to the south-west and Devi to the north-west. Each is invoked with a Vedic verse and given its own archana with its own flower. The rite opens by asking the cupboard that holds them to be unbolted, and closes by taking them back into the heart.')},`);
out(`   ${q('ஐந்து தெய்வங்களையும் ஒரு நிர்ணயிக்கப்பட்ட அமைப்பில் வைத்து வழிபடும் நித்ய பூஜை: நடுவில் சிவன், வடகிழக்கில் விஷ்ணு, தென்கிழக்கில் சூரியன், தென்மேற்கில் விநாயகர், வடமேற்கில் தேவி. ஒவ்வொருவரும் வேத மந்திரத்தால் ஆவாஹனம் செய்யப்பட்டு, தனித்தனி மலருடன் அர்ச்சனை பெறுகிறார்கள்.')},`);
out(`   45, 'all', null,`);
out(`   ${q('Performed every day, usually in the morning. The book gives no calendar rule because there is none: the rite is nitya, daily.')},`);
out(`   ${q(BOOK)})`);
out('on conflict (id) do nothing;');
out();

out('-- --- 3. the shared opening, taken from the Ganesha pooja ---------------------');
for (const [title, n] of COPIED) {
  out(`insert into public.pooja_steps`);
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
  out('   mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out('   phase, modes, gender_rule, source_ref, scripts_generated)');
  out(`select ${q(POOJA)}, ${n}, step_title_en, step_title_ta, instruction_en, instruction_ta,`);
  out('       mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out(`       phase, array['main']::text[], gender_rule, source_ref, scripts_generated`);
  out(`  from public.pooja_steps`);
  out(` where pooja_id = 'ganesha_standard' and step_title_en = ${q(title)}`);
  out('on conflict (pooja_id, step_title_en) do nothing;');
}
out();

out('-- --- 4. the steps written from the book --------------------------------------');
for (const s of STEPS) {
  const sc = scripts(s.deva);
  out(`insert into public.pooja_steps`);
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
  out('   mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out('   phase, modes, gender_rule, source_ref, scripts_generated, is_dynamic_sankalpam');
  if (s.variant) out('   , variant_mantra_sanskrit, variant_note_en');
  out('  )');
  out('values');
  out(`  (${q(POOJA)}, ${s.n}, ${q(s.en)}, ${q(s.ta)},`);
  out(`   ${q(s.instruction_en)},`);
  out(`   ${q(s.instruction_ta)},`);
  out(`   ${q(sc.deva)},`);
  out(`   ${q(sc.ta)},`);
  out(`   ${q(sc.iast)},`);
  out(`   ${q(s.meaning_en)},`);
  out(`   ${q(s.philosophy_en)},`);
  out(`   ${q(s.phase)}, array['main']::text[], 'all', ${q(BOOK)}, true, ${s.dynamic ? 'true' : 'false'}`);
  if (s.variant) {
    out(`   , ${q(scripts(s.variant).deva)}`);
    out(`   , ${q(s.variantNote)}`);
  }
  out('  )');
  out('on conflict (pooja_id, step_title_en) do nothing;');
  out();
}

out('-- --- 5. the five archanas ------------------------------------------------------');
for (const a of ARCHANA) {
  const close = scripts(a.close);
  out(`insert into public.pooja_steps`);
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
  out('   mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, philosophy_en,');
  out("   phase, modes, gender_rule, source_ref, scripts_generated)");
  out('values');
  out(`  (${q(POOJA)}, ${a.n}, ${q(a.en)}, ${q(a.ta)},`);
  out(`   ${q(`Offer ${a.flower} if you have it, or any flower, at each of the ${a.count} names.`)},`);
  out(`   ${q(`${a.flowerTa} இருந்தால் அதையும், இல்லையேல் ஏதேனும் மலரையும், ஒவ்வொரு நாமத்திற்கும் சமர்ப்பிக்கவும்.`)},`);
  out(`   ${q(close.deva)},`);
  out(`   ${q(close.ta)},`);
  out(`   ${q(close.iast)},`);
  out(`   ${q(`The ${a.count} names, each closed with namaha, and then the offering of flowers and fragrant leaves of many kinds.`)},`);
  out(`   ${q(`Each of the five deities gets its own flower, and the book qualifies every one of them "if available". The prescription and the permission are printed in the same line.`)},`);
  out(`   'pradhana', array['main']::text[], 'all', ${q(BOOK)}, true)`);
  out('on conflict (pooja_id, step_title_en) do nothing;');
  a.names.forEach((nm, i) => {
    const n = scripts(nm.replace(/^ओं\s*/, 'ॐ ') + ' नमः');
    out('insert into public.archana_items');
    out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit, offering_en)');
    out(`select id, ${i + 1}, ${q(n.deva)}, ${q(n.ta)}, ${q(n.iast)}, ${q('Offer a flower')}`);
    out(`  from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = ${q(a.en)}`);
    out('on conflict (pooja_step_id, seq) do nothing;');
  });
  out();
}

out('-- --- 6. the deva tarpanam -------------------------------------------------------');
{
  out(`insert into public.pooja_steps`);
  out('  (pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
  out('   meaning_en, philosophy_en, phase, modes, gender_rule, source_ref, scripts_generated)');
  out('values');
  out(`  (${q(POOJA)}, 36, 'Deva Tarpanam', 'தேவ தர்ப்பணம்',`);
  out(`   ${q('After each tarpayaami, pour an uddharani of water from the right palm into a cup. Eight names, then the same eight as consorts, then one that sweeps up everyone invoked.')},`);
  out(`   ${q('ஒவ்வொரு தர்ப்பயாமிக்குப் பின்னும், வலது உள்ளங்கையிலிருந்து ஒரு உத்தரிணி நீரை கிண்ணத்தில் விடவும். எட்டு நாமங்கள், பின் அவர்களின் பத்தினியர் எட்டு, பின் ஆவாஹனம் செய்யப்பட்ட அனைவருக்கும் ஒன்று.')},`);
  out(`   ${q('Bhava, Sharva, Ishana, Pashupati, Rudra, Ugra, Bhima and Mahat; then the consorts of the same eight; and finally all the deities invoked.')},`);
  out(`   ${q('Seventeen offerings, not sixteen. The closing catch-all -- aavaahita sarva dEvataah tarpayaami -- is the part a hand-built list would most easily drop, and it is the one that makes sure nobody invoked goes without.')},`);
  out(`   'uttara', array['main']::text[], 'all', ${q(BOOK + ', pp.47-48')}, true)`);
  out('on conflict (pooja_id, step_title_en) do nothing;');
  TARPANA.forEach(([name, verb], i) => {
    const n = scripts(name.replace(/^ओं\s*/, 'ॐ '));
    const v = scripts(verb);
    out('insert into public.archana_items');
    out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,');
    out('   offering_deva, offering_ta, offering_en)');
    out(`select id, ${i + 1}, ${q(n.deva)}, ${q(n.ta)}, ${q(n.iast)}, ${q(v.deva)}, ${q(v.ta)}, ${q('Pour an uddharani of water')}`);
    out(`  from public.pooja_steps where pooja_id = ${q(POOJA)} and step_title_en = 'Deva Tarpanam'`);
    out('on conflict (pooja_step_id, seq) do nothing;');
  });
}
out();

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)};`);
out(`  if n <> 39 then raise exception 'nitya has % steps, expected 39', n; end if;`);
out();
out('  select count(distinct step_number) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)};`);
out("  if n <> 39 then raise exception 'step numbers are not distinct'; end if;");
out();
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and (step_number < 1 or step_number > 39);`);
out("  if n > 0 then raise exception '% steps outside 1..39', n; end if;");
out();
out('  -- Five avahanams and five archanas, which is what makes this pooja different.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en like 'Avahanam%';`);
out("  if n <> 5 then raise exception '% avahanam steps, expected 5', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and step_title_en like 'Archana%';`);
out("  if n <> 5 then raise exception '% archana steps, expected 5', n; end if;");
out();
for (const a of ARCHANA) {
  out('  select count(*) into n from public.archana_items a');
  out('    join public.pooja_steps s on s.id = a.pooja_step_id');
  out(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = ${q(a.en)};`);
  out(`  if n <> ${a.names.length} then raise exception ${q(a.en + ' has % rows, expected ' + a.names.length)}, n; end if;`);
}
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = 'Deva Tarpanam';`);
out("  if n <> 17 then raise exception 'tarpanam has % rows, expected 17', n; end if;");
out();
out('  -- Every step has both instruction languages and all three scripts where it');
out('  -- has any Devanagari at all.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and (coalesce(trim(instruction_en), '') = '' or coalesce(trim(instruction_ta), '') = '');");
out("  if n > 0 then raise exception '% nitya steps are missing an instruction', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and coalesce(trim(mantra_sanskrit), '') <> ''");
out('     and (mantra_tamil is null or mantra_translit is null);');
out("  if n > 0 then raise exception '% nitya steps are missing a script', n; end if;");
out();
out('  -- No ASCII colon, no mantra-shaped title.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and (mantra_sanskrit like '%:%' or mantra_tamil like '%:%' or mantra_translit like '%:%');");
out("  if n > 0 then raise exception '% nitya steps carry an ASCII colon', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and (length(coalesce(step_title_en, '')) > 60 or length(coalesce(step_title_ta, '')) > 60);");
out("  if n > 0 then raise exception '% nitya titles look like mantra text', n; end if;");
out();
out('  -- The purvangam really was copied, not left empty.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)} and phase = 'purvangam'`);
out("     and coalesce(trim(mantra_sanskrit), '') = '';");
out("  if n > 0 then raise exception '% copied purvangam steps came across empty', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0036_ritual_class_nitya.sql', enumSql);
  emitMigration('supabase/migrations/0037_nitya_panchayatana_pooja.sql', sql);
  console.log('\nwrote 0036_ritual_class_nitya.sql and 0037_nitya_panchayatana_pooja.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
