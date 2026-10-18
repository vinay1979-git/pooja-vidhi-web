#!/usr/bin/env node
/**
 * What the hands do, as the book prints it.
 *
 *   node scripts/build-hand-positions-from-the-book.mjs          # validate
 *   node scripts/build-hand-positions-from-the-book.mjs --emit   # write 0064
 *
 * docs/review/hand-positions.md read the book's rubric and drawing for every
 * physical action in the shared opening and marked each app step AGREES,
 * CONTRADICTS or SILENT. This applies ONLY what the book settles, to Ganesha,
 * Varalakshmi, Saraswati, Nitya and Sandhyavandanam. (Navaratri is rebuilt
 * whole by 0062 and is not touched here.)
 *
 *   Sankalpam   left palm up on the right thigh, right palm crossed over it,
 *               akshatai held, hands washed after (purvanga p.4 block 4, p.12
 *               block 16; sandhya book p.19). Fixed where the step reversed
 *               the palms (ganesha #13, saraswati #6), held water instead of
 *               akshatai (varalakshmi #6), or said nothing of the posture
 *               (nitya #5). Each rite keeps its own purpose and what it does
 *               with the akshatai at the end; Varalakshmi now releases
 *               akshatai, not water. Ganesha #13's Tamil gains the pranayama
 *               and ear-touch sentence its English had.
 *   Pranayamam  index and middle fingers folded; thumb on the right nostril,
 *               ring and little on the left; IN through the seven worlds,
 *               HOLD through the Gayatri, OUT through om aapo; then touch the
 *               right ear (purvanga pp.3-4; sandhya book p.18-19). The four
 *               pooja steps held the breath for the whole mantra. Their
 *               commentary said the same ("a long thing to say on a held
 *               breath") and is corrected with them.
 *   Achamanam   forefinger against the thumb, the other three curled so the
 *               palm holds one spoonful; one sip per name; east OR north
 *               (sandhya book p.16). "Without the lips touching the hand" is
 *               kept: it is a decision for a human (review §3.4).
 *   Anga Vandanam  Padmanabha is the NAVEL (rubric and drawing in both books;
 *               only the sandhya gloss says heart). Fixed in the four pooja
 *               lists, sandhya #21 and #52, and the sandhya commentary that
 *               repeated the gloss. No archana_items row names a body part.
 *   Ghanta      sandal paste on the bell's handle, not akshatai (p.5 block
 *               11). The hand that rings it is unsettled and left as it was.
 *   Namaskaram  men eight limbs, women five (general p.XVI): ganesha #33 said
 *               "full length" for everyone.
 *   Pradakshina three rounds, standing (p.XVI; deity rubrics "as you stand"):
 *               varalakshmi #24 said to turn where you sit; saraswati #22 and
 *               nitya #33 gave no count.
 *   Vighneshwara Dhyanam  tap the temples five times (p.3 block 3).
 *   Kara nyasa  for anguSHTHaabhyaam the INDEX finger rolls along the thumb
 *               (p.20), not the thumb along a finger (ganesha #21).
 *   Cross-references  sandhyavandanam #17 and #28-30 said "Hold the hands as
 *               for the (first) Sankalpam". They now describe the posture.
 *               proofread's CROSS_REF_EN gains "as for the".
 *
 * NOT applied -- the book leaves these open (review §(4) in each section):
 * which hand rings the bell; the neerajanam pattern, posture and bell; flower,
 * water and "north" in the sankalpam; touching the kalasha/image/books at
 * Prana Pratishtha; anjali vs cupped palms; the avahana gestures; the
 * sandhya thumb-contact rule. Nor is Prana Pratishtha in Varalakshmi and
 * Saraswati rebuilt into the full nyasa: that is a rewrite, for later.
 *
 * Every edit replaces an exact clause with replace(), guarded so a re-run is a
 * no-op, and the migration refuses to commit if any old clause survives or any
 * new one is missing. Mantras are never touched.
 */
import { emitMigration } from './_migration.mjs';

const MIGRATION = 'supabase/migrations/0064_hand_positions_from_the_book.sql';

const step = (pooja, n, title) => ({
  table: 'pooja_steps',
  where: `pooja_id = '${pooja}' and step_number = ${n} and step_title_en = '${title.replace(/'/g, "''")}'`,
  label: `${pooja} #${n}`,
});

const POOJAS = ['ganesha_standard', 'varalakshmi_vratham', 'saraswati_pooja', 'nitya_panchayatana'];
/** One edit, in each of the four poojas that share the purvangam text. */
const inAll = (n, title, field, oldC, newC) =>
  POOJAS.map((p) => [step(p, typeof n === 'number' ? n : n[p], title), field, oldC, newC]);

// --- shared wording ------------------------------------------------------------
const SANKALPA_HANDS_EN = 'rest it, palm up, on your right thigh. Cover it with your right palm, crossed over the left, and keep both hands there while you';
const SANKALPA_HANDS_TA = 'அதை மேல்நோக்கியபடி வலது தொடையின் மேல் வைக்கவும். வலது உள்ளங்கையை அதன் மேல் குறுக்காக வைத்து மூடி,';
const SANDHYA_GLOSS_OLD = 'The inside of the hand is God, which is why the last pair goes to the heart and the head.';
const SANDHYA_GLOSS_NEW = 'The inside of the hand is God, which is why the last pair is touched with all the fingers, at the navel and the crown.';

/** [target, field, old clause (exact), new clause] */
const EDITS = [
  // --- Achamanam ---------------------------------------------------------------
  ...inAll(1, 'Achamanam', 'instruction_en',
    'Sit facing East. Take a spoonful of water (Uddharani) from the Panchapatra in your right palm and sip it after chanting each name.',
    'Sit facing east or north. Fold the forefinger of your right hand against the thumb and curl the other three fingers so the palm holds one spoonful of water from the Panchapatra, taken with the uddharani. Sip it once at each of the three names.'),
  ...inAll(1, 'Achamanam', 'instruction_ta',
    'கிழக்கு நோக்கி அமரவும். பஞ்சபாத்திரத்திலிருந்து உத்தரிணியால் சிறிது நீரை வலது உள்ளங்கையில் எடுத்து, ஒவ்வொரு நாமத்தையும் சொல்லிய பின் அருந்தவும்.',
    'கிழக்கு அல்லது வடக்கு நோக்கி அமரவும். வலது கையின் ஆள்காட்டி விரலைக் கட்டைவிரலுடன் சேர்த்து மடக்கி, மற்ற மூன்று விரல்களையும் குவித்து, பஞ்சபாத்திரத்திலிருந்து உத்தரிணியால் எடுத்த ஒரு உத்தரிணி நீர் உள்ளங்கையில் நிற்கும்படி வைக்கவும். மூன்று நாமங்களில் ஒவ்வொன்றுக்கும் ஒரு முறை அந்த நீரை அருந்தவும்.'),

  // --- Anga Vandanam: Padmanabha is the navel ----------------------------------
  ...inAll(2, 'Anga Vandanam', 'instruction_en',
    '11. Padmanabhaya (Chest, all fingers)',
    '11. Padmanabhaya (Navel, all fingers)'),
  ...inAll(2, 'Anga Vandanam', 'instruction_ta',
    '11. பத்மநாபாய (மார்பு, அனைத்து விரல்கள்)',
    '11. பத்மநாபாய (நாபி, அனைத்து விரல்கள்)'),
  [step('sandhyavandanam', 21, 'Anga Vandanam (after tarpanam)'), 'instruction_en',
    'and all the fingers to the heart and the crown.',
    'and all the fingers to the navel and the crown.'],
  [step('sandhyavandanam', 21, 'Anga Vandanam (after tarpanam)'), 'instruction_ta',
    'அனைத்து விரல்களாலும் இதயமும் உச்சந்தலையும்.',
    'அனைத்து விரல்களாலும் நாபியும் உச்சந்தலையும்.'],
  [step('sandhyavandanam', 52, 'Anga Vandanam (before prokshanam)'), 'instruction_en',
    'shoulders, then the heart and the crown.',
    'shoulders, then the navel and the crown.'],
  [step('sandhyavandanam', 52, 'Anga Vandanam (before prokshanam)'), 'instruction_ta',
    'தோள்கள், பின் இதயமும் உச்சந்தலையும்.',
    'தோள்கள், பின் நாபியும் உச்சந்தலையும்.'],
  [step('sandhyavandanam', 2, 'Anga Vandanam'), 'philosophy_en', SANDHYA_GLOSS_OLD, SANDHYA_GLOSS_NEW],
  [step('sandhyavandanam', 21, 'Anga Vandanam (after tarpanam)'), 'philosophy_en', SANDHYA_GLOSS_OLD, SANDHYA_GLOSS_NEW],
  [step('sandhyavandanam', 52, 'Anga Vandanam (before prokshanam)'), 'philosophy_en', SANDHYA_GLOSS_OLD, SANDHYA_GLOSS_NEW],

  // --- Vighneshwara Dhyanam: five taps -----------------------------------------
  ...inAll(3, 'Vighneshwara Dhyanam', 'instruction_en',
    'Tap your temples gently with the knuckles of both hands while reciting.',
    'Make loose fists and gently tap both temples with the knuckles five times while reciting.'),
  ...inAll(3, 'Vighneshwara Dhyanam', 'instruction_ta',
    'இரு கைகளின் நெரிக்கும் விரல் மூட்டுகளால் நெற்றிப் பொட்டுகளில் மெதுவாகத் தட்டியபடி பாராயணம் செய்யவும்.',
    'இரு கைகளையும் லேசாக மடக்கி, விரல் முட்டிகளால் இரு நெற்றிப் பொட்டுகளிலும் மெதுவாக ஐந்து முறை குட்டியபடி சொல்லவும்.'),

  // --- Pranayamam: the fingers, the three parts, the ear -----------------------
  ...inAll(4, 'Pranayamam', 'instruction_en',
    'Close the right nostril with the thumb, inhale through the left. Close both, hold breath and mentally chant the mantra. Exhale through the right.',
    'With the right hand, fold the index and middle fingers into the palm. The mantra has three parts and the breath is assigned to each. Close the right nostril with the thumb and breathe IN through the left nostril, reciting silently from om bhuh to om satyam. Close the left nostril too, with the ring and little fingers, and HOLD the breath through om tat savitur to prachodayat. Open the right nostril and breathe OUT through it, through om aapo jyoti to bhurbhuvassuvarom. Then touch the right ear with the right hand.'),
  ...inAll(4, 'Pranayamam', 'instruction_ta',
    'கட்டைவிரலால் வலது நாசியை மூடி, இடது நாசி வழியாக மூச்சை உள்ளிழுக்கவும். இரு நாசிகளையும் மூடி மூச்சை நிறுத்தி, மனதிற்குள் மந்திரத்தைச் சொல்லவும். பின் வலது நாசி வழியாக மெல்ல வெளியிடவும்.',
    'வலது கையில் ஆள்காட்டி விரலையும் நடுவிரலையும் உள்ளங்கையில் மடக்கவும். மந்திரம் மூன்று பகுதிகள்; ஒவ்வொன்றுக்கும் மூச்சின் ஒரு நிலை. கட்டைவிரலால் வலது நாசியை மூடி, "ஓம் பூ" முதல் "ஓம் ஸத்யம்" வரை மனதிற்குள் சொல்லியபடி இடது நாசி வழியாக மூச்சை இழுக்கவும். மோதிர விரல், சுண்டு விரல்களால் இடது நாசியையும் மூடி, "ஓம் தத் ஸவிது" முதல் "ப்ரசோதயாத்" வரை சொல்லியபடி மூச்சை நிறுத்தவும். பின் வலது நாசியைத் திறந்து, "ஓமாபோ ஜ்யோதீ" முதல் "பூர்புவஸ்ஸுவரோம்" வரை சொல்லியபடி அதன் வழியாக மூச்சை வெளியிடவும். இறுதியில் வலது கையால் வலது காதைத் தொடவும்.'),
  ...inAll(4, 'Pranayamam', 'philosophy_en',
    'it is a long thing to say on a held breath, and the length is the point.',
    'it is said across one slow breath, drawn in, held and let out, and the length is the point.'),

  // --- Sankalpam: left palm up on the right thigh, right palm over it ----------
  [step('ganesha_standard', 13, 'Sankalpam'), 'instruction_en',
    'Then Place a few grains of akshatai and a drop of water in your right palm. Close it with your left hand and place it on your right thigh.',
    `Then put a few grains of akshatai and a drop of water in your left palm and ${SANKALPA_HANDS_EN} recite. At the end, wash your hands.`],
  [step('ganesha_standard', 13, 'Sankalpam'), 'instruction_ta',
    'வலது உள்ளங்கையில் சிறிது அட்சதையும் ஒரு துளி நீரும் வைத்து, இடது கையால் மூடி, வலது தொடையின் மீது வைத்துக் கொள்ளவும்.',
    `இதற்கு முன், சிறிது அக்ஷதையைக் கையில் வைத்துக்கொண்டு மீண்டும் ஒரு முறை ப்ராணாயாமம் செய்து, வலது கையால் வலது காதைத் தொடவும். பின் இடது உள்ளங்கையில் சிறிது அக்ஷதையும் ஒரு துளி நீரும் வைத்து, ${SANKALPA_HANDS_TA} சொல்லி முடியும் வரை அப்படியே வைத்திருக்கவும். முடிவில் கைகளைக் கழுவவும்.`],

  [step('varalakshmi_vratham', 6, 'Sankalpam'), 'instruction_en',
    'Hold water in the right palm.',
    `Put a few grains of akshatai in your left palm and ${SANKALPA_HANDS_EN} recite.`],
  [step('varalakshmi_vratham', 6, 'Sankalpam'), 'instruction_en',
    'Release the water at the end.',
    'At the end, release the akshatai and wash your hands.'],
  [step('varalakshmi_vratham', 6, 'Sankalpam'), 'instruction_ta',
    'வலது உள்ளங்கையில் ஜலம் எடுக்கவும்.',
    `இடது உள்ளங்கையில் சிறிது அக்ஷதை வைத்து, ${SANKALPA_HANDS_TA} சொல்லி முடியும் வரை அப்படியே வைத்திருக்கவும்.`],
  [step('varalakshmi_vratham', 6, 'Sankalpam'), 'instruction_ta',
    'முடிவில் ஜலத்தை விடவும்.',
    'முடிவில் அக்ஷதையை விட்டுக் கைகளைக் கழுவவும்.'],

  [step('saraswati_pooja', 6, 'Sankalpam'), 'instruction_en',
    'Take akshatai and a flower in the right hand, cover it with the left and rest both on the right thigh. Recite the day and place and the resolve to worship Saraswati. Place the akshatai to the north and wash the hand.',
    `Put akshatai and a flower in your left palm and ${SANKALPA_HANDS_EN} recite the day and place and the resolve to worship Saraswati. Place the akshatai to the north and wash your hands.`],
  [step('saraswati_pooja', 6, 'Sankalpam'), 'instruction_ta',
    'வலது கையில் அக்ஷதையும் புஷ்பமும் எடுத்து இடது கையால் மூடி வலது தொடையின் மேல் வைக்கவும். நாள், இடம், ஸரஸ்வதீ பூஜை செய்வதாக ஸங்கல்பம் சொல்லவும். அக்ஷதையை வடக்குப் பக்கம் போட்டுக் கையைக் கழுவவும்.',
    `இடது உள்ளங்கையில் அக்ஷதையும் புஷ்பமும் வைத்து, ${SANKALPA_HANDS_TA} அப்படியே வைத்தபடி நாள், இடம், ஸரஸ்வதீ பூஜை செய்வதாக ஸங்கல்பம் சொல்லவும். அக்ஷதையை வடக்குப் பக்கம் போட்டுக் கைகளைக் கழுவவும்.`],

  [step('nitya_panchayatana', 5, 'Sankalpam'), 'instruction_en',
    'Hold akshatai in the right hand, state where and when you are, and say what this pooja is for. Discard the akshatai to the north afterwards and rinse the hand.',
    `Put a few grains of akshatai in your left palm and ${SANKALPA_HANDS_EN} state where and when you are and say what this pooja is for. Afterwards, discard the akshatai to the north and wash your hands.`],
  [step('nitya_panchayatana', 5, 'Sankalpam'), 'instruction_ta',
    'வலது கையில் அக்ஷதையை வைத்துக்கொண்டு, இடம் காலம் கூறி, இந்தப் பூஜை எதற்காக என்பதைச் சொல்லவும். பின் அக்ஷதையை வடக்கே விட்டு கையைக் கழுவவும்.',
    `இடது உள்ளங்கையில் சிறிது அக்ஷதை வைத்து, ${SANKALPA_HANDS_TA} அப்படியே வைத்தபடி இடம் காலம் கூறி, இந்தப் பூஜை எதற்காக என்பதைச் சொல்லவும். பின் அக்ஷதையை வடக்கே விட்டுக் கைகளைக் கழுவவும்.`],

  // Sandhyavandanam: the posture said in full instead of "as for the Sankalpam".
  [step('sandhyavandanam', 17, 'Prayashchitta Arghyam'), 'instruction_en',
    'Hold the hands as for the Sankalpam and recite.',
    'Clasp the right palm over the left and rest both on the right thigh while reciting.'],
  [step('sandhyavandanam', 17, 'Prayashchitta Arghyam'), 'instruction_ta',
    'ஸங்கல்பத்தில் செய்தது போல கைகளை வைத்துச் சொல்லவும்.',
    'வலது உள்ளங்கையை இடது உள்ளங்கையின் மேல் வைத்து, இரண்டையும் வலது தொடையில் வைத்தபடி சொல்லவும்.'],
  ...[28, 29, 30].flatMap((n) => {
    const t = step('sandhyavandanam', n, `Japa Sankalpam — ${{ 28: 'morning', 29: 'noon', 30: 'evening' }[n]}`);
    return [
      [t, 'instruction_en',
        'Hold the hands as for the first Sankalpam and recite.',
        'Rest the left palm on the right thigh and clasp the right palm over it while you recite the resolve for the japa.'],
      [t, 'instruction_ta',
        'முதல் ஸங்கல்பத்தில் செய்தது போல கைகளை வைத்துச் சொல்லவும்.',
        'இடது உள்ளங்கையை வலது தொடையின் மேல் வைத்து, அதன் மேல் வலது உள்ளங்கையைப் பற்றியபடி ஜபத்திற்கான ஸங்கல்பத்தைச் சொல்லவும்.'],
    ];
  }),

  // --- Ghanta: sandal on the handle --------------------------------------------
  ...inAll({ ganesha_standard: 9, varalakshmi_vratham: 8, saraswati_pooja: 8, nitya_panchayatana: 7 }, 'Ghanta Pooja', 'instruction_en',
    'Worship the bell with akshatai, then ring it with the left hand.',
    'Apply sandal paste to the handle of the bell, then ring it with the left hand to welcome the deity.'),
  ...inAll({ ganesha_standard: 9, varalakshmi_vratham: 8, saraswati_pooja: 8, nitya_panchayatana: 7 }, 'Ghanta Pooja', 'instruction_ta',
    'மணியை அக்ஷதையால் பூஜித்து, பின் இடது கையால் அடிக்கவும்.',
    'மணியின் கைப்பிடியில் சந்தனம் இட்டு, பின் தேவதையை வரவேற்க இடது கையால் மணியை அடிக்கவும்.'),

  // --- Namaskaram and Pradakshina ----------------------------------------------
  [step('ganesha_standard', 33, 'Mantra Pushpam & Namaskaram'), 'instruction_en',
    ', prostrate full length, and finish',
    ', prostrate (men with eight limbs touching the ground, women with five), and finish'],
  [step('ganesha_standard', 33, 'Mantra Pushpam & Namaskaram'), 'instruction_ta',
    'சாஷ்டாங்கமாக நமஸ்கரித்து, பிரார்த்தனையுடன் முடிக்கவும்.',
    'நமஸ்கரித்து (ஆண்கள் எட்டு அங்கங்கள் தரையில் பட ஸாஷ்டாங்கமாக, பெண்கள் ஐந்து அங்கங்களுடன் பஞ்சாங்கமாக), பிரார்த்தனையுடன் முடிக்கவும்.'],
  [step('varalakshmi_vratham', 24, 'Pradakshina'), 'instruction_en',
    'If there is no room to walk, turn in place where you are sitting.',
    'If there is no room to walk, stand and turn clockwise three times where you are.'],
  [step('varalakshmi_vratham', 24, 'Pradakshina'), 'instruction_ta',
    'நடக்க இடமில்லையென்றால், அமர்ந்த இடத்திலேயே சுற்றித் திரும்பவும்.',
    'நடக்க இடமில்லையென்றால், எழுந்து நின்று, நின்ற இடத்திலேயே மூன்று முறை வலமாகச் சுற்றவும்.'],
  [step('saraswati_pooja', 22, 'Mantra Pushpam & Pradakshina'), 'instruction_en',
    'Then go round clockwise with palms joined, or turn in place.',
    'Then go round clockwise three times with palms joined, or stand and turn clockwise three times where you are.'],
  [step('saraswati_pooja', 22, 'Mantra Pushpam & Pradakshina'), 'instruction_ta',
    'பின் கைகூப்பி வலமாகச் சுற்றவும், அல்லது நின்ற இடத்தில் சுற்றவும்.',
    'பின் கைகூப்பி மூன்று முறை வலம் வரவும், அல்லது நின்ற இடத்திலேயே மூன்று முறை வலமாகச் சுற்றவும்.'],
  [step('nitya_panchayatana', 33, 'Pradakshina Namaskaram'), 'instruction_en',
    'Circle the deities with palms together, or turn in place, and prostrate.',
    'Circle the deities three times with palms together, or stand and turn clockwise three times where you are, and prostrate.'],
  [step('nitya_panchayatana', 33, 'Pradakshina Namaskaram'), 'instruction_ta',
    'கைகூப்பி தெய்வங்களை வலம் வரவும், அல்லது நின்ற இடத்திலேயே சுற்றவும்.',
    'கைகூப்பி தெய்வங்களை மூன்று முறை வலம் வரவும், அல்லது நின்ற இடத்திலேயே மூன்று முறை வலமாகச் சுற்றவும்.'],

  // --- Kara nyasa: the index finger rolls along the thumb -----------------------
  [step('ganesha_standard', 21, 'Prana Pratishtha'), 'instruction_en',
    'For the kara nyasa roll the thumb from the base of each finger to its tip in turn, then rub the palms together.',
    'For the kara nyasa roll the index finger from the base of the thumb to its tip, then roll the thumb from the base of the index, middle, ring and little fingers to their tips in turn, then rub the palms together.'],
  [step('ganesha_standard', 21, 'Prana Pratishtha'), 'instruction_ta',
    'கர ந்யாஸத்தில், ஒவ்வொரு விரலின் அடியிலிருந்து நுனி வரை கட்டைவிரலை உருட்டவும்;',
    'கர ந்யாஸத்தில், கட்டைவிரலின் அடியிலிருந்து நுனி வரை ஆள்காட்டி விரலை உருட்டவும்; பின் ஆள்காட்டி, நடு, மோதிர, சுண்டு விரல்கள் ஒவ்வொன்றின் அடியிலிருந்து நுனி வரை கட்டைவிரலை உருட்டவும்;'],
];

// --- validate ---------------------------------------------------------------
// The gates proofread fails on; every NEW clause must pass them.
export const CROSS_REF_EN = /\b(as before|exactly as before|as for the|learnt from a teacher|learned from a teacher|return and continue|stands in its place|already done|see (above|below|page|step)|refer to|described (above|earlier)|page \d+|step \d+)\b/i;
export const CITE_OR_REF_TA = /(நூல்|நூலே|புத்தகமே)[^.]{0,40}(கூறு|சொல்)|என்று நூல்|என நூல்|முன்பு போல|முன்போல|ஆசிரியரிட|செய்தது போல/;
const ALLOWED_FIELDS = new Set(['instruction_en', 'instruction_ta', 'philosophy_en']);
const TOUCHED_RITES = new Set([...POOJAS, 'sandhyavandanam']);

let failed = false;
const seen = new Set();
for (const [t, field, oldC, newC] of EDITS) {
  const re = field.endsWith('_ta') ? CITE_OR_REF_TA : CROSS_REF_EN;
  const bad = (m) => { failed = true; console.error(`FAIL ${t.label}.${field}: ${m}`); };
  if (!oldC || !newC) bad('empty clause');
  if (!ALLOWED_FIELDS.has(field)) bad('not a prose field this migration may touch');
  if (!TOUCHED_RITES.has(t.where.match(/pooja_id = '([^']+)'/)[1])) bad('rite out of scope');
  if (newC.includes(oldC) || oldC.includes(newC)) bad('old and new overlap, so the guard cannot tell them apart');
  if (re.test(newC)) bad('the new text still matches the cross-reference gate');
  if (/\b(the book|this book|the edition)\b/i.test(newC) || /நூல்|புத்தக/.test(newC)) bad('cites the source');
  if (field.endsWith('_ta') && /[A-Za-z]/.test(newC)) bad('Latin letters in Tamil');
  if (field.endsWith('_en') && /[஀-௿]/.test(newC)) bad('Tamil letters in English');
  const key = `${t.label}.${field}.${oldC}`;
  if (seen.has(key)) bad('duplicate edit');
  seen.add(key);
  console.log(`  ${t.label}.${field}: -${oldC.length} +${newC.length}`);
}
console.log(`\n${EDITS.length} edits`);
if (failed) process.exit(1);
if (!process.argv.includes('--emit')) { console.log('\n(no SQL written; pass --emit)'); process.exit(0); }

// --- emit -------------------------------------------------------------------
const q = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = `-- What the hands do, as the book prints it.
-- Generated by scripts/build-hand-positions-from-the-book.mjs; see its header.

begin;

${EDITS.map(([t, field, oldC, newC]) => `-- ${t.label}.${field}
update public.${t.table} set ${field} = replace(${field}, ${q(oldC)}, ${q(newC)}), updated_at = now()
 where ${t.where} and position(${q(oldC)} in ${field}) > 0 and position(${q(newC)} in ${field}) = 0;`).join('\n\n')}

do $$
declare n int;
begin
${EDITS.map(([t, field, oldC, newC]) => `  select count(*) into n from public.${t.table} where ${t.where} and position(${q(oldC)} in ${field}) > 0;
  if n <> 0 then raise exception '${t.label}.${field}: the old clause survived'; end if;
  select count(*) into n from public.${t.table} where ${t.where} and position(${q(newC)} in ${field}) > 0;
  if n <> 1 then raise exception '${t.label}.${field}: the new clause is missing'; end if;`).join('\n')}
end $$;

commit;
`;
emitMigration(MIGRATION, sql);
