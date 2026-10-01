#!/usr/bin/env node
/**
 * Two faults in the sandhyavandanam, both of which make the reader do work the
 * app exists to do for them.
 *
 *   node scripts/build-sandhya-selfcontained.mjs          # validate
 *   node scripts/build-sandhya-selfcontained.mjs --emit   # write it
 *
 * ONE: STEPS THAT RECITE ALL THREE SITTINGS AT ONCE. Arghya Pradanam says
 * "THREE times in the morning and in the evening; TWICE at noon" and Gayatri
 * Japa says "MORNING 108 ... NOON 32 ... EVENING 64". The reader has already
 * told us which sitting they are keeping, on the first screen, and is then
 * handed all three and asked to pick their own line out of it -- at the one
 * moment in the rite when they are counting on their fingers and not reading
 * carefully. Both become three mode-tagged steps.
 *
 * This is not a new convention. The rite ALREADY splits this way five times
 * over: Sankalpam, Apaam Prashanam, Japa Sankalpam, Gayatri Upasthanam and the
 * Surya/Varuna Prarthana are each three steps, one per sitting. These two are
 * simply the ones that were left as prose, and they are the two where the thing
 * that differs is the COUNT rather than the words -- which is exactly why they
 * were written as prose, and exactly why that fails: a count buried in a
 * sentence is easier to misread than a mantra that is plainly not yours.
 *
 * TWO: STEPS THAT NAME ANOTHER STEP INSTEAD OF BEING ONE. Japasthanam
 * Prokshanam opens "Do Achamanam and Anga Vandanam once", and the Navagraha
 * tarpanam closes the same way. Someone who knows the rite reads that as an
 * instruction; someone learning it reads it as a homework assignment and has to
 * leave the step they are on, find step one, and come back. The book itself
 * says no more than "(do aachamanam & angavandanam once)" -- it is a reference
 * card for someone who already knows, and this app is not.
 *
 * So the pair is inserted as real steps at both places the book calls for them,
 * with the mantras in full. Also not a new convention: Vighneshwara Dhyanam and
 * Pranayamam are ALREADY repeated in full as "(japa)" variants rather than
 * back-referenced, because the japa half needs them again.
 *
 * THE CLONES ARE INSERT...SELECT, NOT RETYPED. Every repeated step copies its
 * mantra_sanskrit, mantra_tamil, mantra_translit, meaning and philosophy from
 * the row it repeats. Retyping Devanagari to say the same thing twice is how a
 * transcription error gets into exactly one of two places and then has to be
 * found by eye; copying makes the two identical by construction.
 *
 * WHAT IS DELIBERATELY NOT CHANGED. Samarpanam still says "say the Abhivadanam
 * once more" rather than repeating it, because the Abhivadanam is the one text
 * in the rite that was ruled to need no scaffolding -- it is built as the book
 * has it, is not dynamic, and people know their own. And step one still says
 * the pair is done three times over at the start, because that is the book's
 * own instruction (p.16, "Perform aachamanam and angavandanam thrice in a
 * row"), not a cross-reference.
 */
import { emitMigration } from './_migration.mjs';

const P = 'sandhyavandanam';

/** The three sittings, with the words each convention uses for them. */
const SITTINGS = [
  { mode: 'pratah', en: 'morning', ta: 'காலை' },
  { mode: 'madhyahnika', en: 'noon', ta: 'உச்சி' },
  { mode: 'sayam', en: 'evening', ta: 'மாலை' },
];

/**
 * A step that enumerated all three sittings, and what each sitting gets instead.
 * `from` is the existing title; the morning variant REPLACES that row (keeping
 * its id and anything hanging off it) and the other two are cloned from it.
 */
const SPLITS = [
  {
    from: 'Arghya Pradanam',
    ta: 'அர்க்ய ப்ரதானம்',
    // The gesture is identical at all three; only the number of times changes.
    base_en: 'Take water in both cupped hands and let it fall from the fingertips at the end of the mantra.',
    base_ta: 'இரு உள்ளங்கைகளிலும் நீர் ஏந்தி, மந்திரம் முடியும்போது விரல் நுனிகள் வழியே கீழே விடவும்.',
    per: {
      pratah: {
        en: 'Do this THREE times. Then do one pranayama.',
        ta: 'இதை மூன்று முறை செய்யவும். பின் ஒரு ப்ராணாயாமம்.',
      },
      madhyahnika: {
        en: 'Do this TWICE. Then do one pranayama.',
        ta: 'இதை இரண்டு முறை செய்யவும். பின் ஒரு ப்ராணாயாமம்.',
      },
      sayam: {
        en: 'Do this THREE times. Then do one pranayama.',
        ta: 'இதை மூன்று முறை செய்யவும். பின் ஒரு ப்ராணாயாமம்.',
      },
    },
  },
  {
    from: 'Gayatri Japa',
    ta: 'காயத்ரி ஜபம்',
    base_en: 'Count on the joints of the fingers: hold both palms together sideways before the face and begin with the right thumb on the middle line of the ring finger, moving down, across and up in a clockwise circuit of ten, then anticlockwise back for the next ten.',
    base_ta: 'விரல் கணுக்களில் எண்ணவும்: இரு உள்ளங்கைகளையும் முகத்திற்கு முன் பக்கவாட்டில் சேர்த்து, வலது கட்டைவிரலை மோதிர விரலின் நடுக்கோட்டில் வைத்துத் தொடங்கி, வலமாகச் சுற்றி பத்து; பின் இடமாகத் திரும்பி அடுத்த பத்து.',
    per: {
      pratah: {
        en: 'Recite the Gayatri 108 times, facing east. Then do one pranayama.',
        ta: 'காயத்ரியை 108 முறை, கிழக்கு நோக்கிச் சொல்லவும். பின் ஒரு ப்ராணாயாமம்.',
      },
      madhyahnika: {
        en: 'Recite the Gayatri 32 times, facing east. Then do one pranayama.',
        ta: 'காயத்ரியை 32 முறை, கிழக்கு நோக்கிச் சொல்லவும். பின் ஒரு ப்ராணாயாமம்.',
      },
      sayam: {
        // The one instruction in the rite that no clock can settle, so it stays
        // a sentence for the reader to judge -- the book does the same.
        en: 'Recite the Gayatri 64 times, facing west if the sun has not yet set and east once it has. Then do one pranayama.',
        ta: 'காயத்ரியை 64 முறை சொல்லவும்; சூரியன் மறையும் முன் மேற்கு நோக்கியும், மறைந்த பின் கிழக்கு நோக்கியும். பின் ஒரு ப்ராணாயாமம்.',
      },
    },
  },
];

/**
 * The pair the book asks for twice more, inserted where it asks. `after` is the
 * step it follows; `clone_of` is the row whose mantra it carries.
 */
const REPEATS = [
  {
    clone_of: 'Achamanam', title_en: 'Achamanam (after tarpanam)', title_ta: 'ஆசமனம் (தர்ப்பணத்திற்குப் பின்)',
    instruction_en: 'The same three sips again, closing the tarpanam. Fold the forefinger of the right hand against the thumb, hold a spoonful of water in the palm, and sip once at each of the three names.',
    instruction_ta: 'தர்ப்பணத்தை நிறைவு செய்ய மீண்டும் அதே மூன்று முறை நீர் உள்கொள்ளல். வலது கையின் ஆட்காட்டி விரலை கட்டைவிரலுடன் சேர்த்து, உள்ளங்கையில் ஒரு உத்தரிணி நீர் வைத்து, மூன்று நாமங்களிலும் ஒவ்வொரு முறை உள்கொள்ளவும்.',
  },
  {
    clone_of: 'Anga Vandanam', title_en: 'Anga Vandanam (after tarpanam)', title_ta: 'அங்க வந்தனம் (தர்ப்பணத்திற்குப் பின்)',
    instruction_en: 'And the twelve names again, two at a time: thumb to the cheeks, ring finger to the eyes, forefinger to the nostrils, little finger to the ears, middle finger to the shoulders, and all the fingers to the heart and the crown.',
    instruction_ta: 'பின் மீண்டும் பன்னிரண்டு நாமங்கள், இரண்டிரண்டாக — கட்டைவிரலால் கன்னங்கள், மோதிர விரலால் கண்கள், ஆட்காட்டி விரலால் நாசிகள், சுண்டு விரலால் காதுகள், நடுவிரலால் தோள்கள், அனைத்து விரல்களாலும் இதயமும் உச்சந்தலையும்.',
  },
  {
    clone_of: 'Achamanam', title_en: 'Achamanam (before prokshanam)', title_ta: 'ஆசமனம் (ப்ரோக்ஷணத்திற்கு முன்)',
    instruction_en: 'The three sips once more, before the place of japa is sprinkled. Hold a spoonful of water in the palm as before and sip once at each of the three names.',
    instruction_ta: 'ஜபஸ்தானம் ப்ரோக்ஷணத்திற்கு முன் மீண்டும் மூன்று முறை நீர் உள்கொள்ளல். முன்பு போலவே உள்ளங்கையில் ஒரு உத்தரிணி நீர் வைத்து, மூன்று நாமங்களிலும் ஒவ்வொரு முறை உள்கொள்ளவும்.',
  },
  {
    clone_of: 'Anga Vandanam', title_en: 'Anga Vandanam (before prokshanam)', title_ta: 'அங்க வந்தனம் (ப்ரோக்ஷணத்திற்கு முன்)',
    instruction_en: 'And the twelve names once more, touching each pair to its place: cheeks, eyes, nostrils, ears, shoulders, then the heart and the crown.',
    instruction_ta: 'பின் மீண்டும் பன்னிரண்டு நாமங்கள், ஒவ்வொரு ஜோடியையும் அதன் இடத்தில் தொட்டு — கன்னங்கள், கண்கள், நாசிகள், காதுகள், தோள்கள், பின் இதயமும் உச்சந்தலையும்.',
  },
];

/**
 * Instructions that pointed at another step instead of saying the thing. The
 * mantras on these steps are already right; only the prose changes.
 */
const REWRITES = [
  {
    title: 'Navagraha Deva Tarpanam',
    // Was: "... Do Achamanam and Anga Vandanam once at the end."
    en: 'Take water in the hand and let it fall from the fingertips once after each name. Achamanam and Anga Vandanam follow, once each, as the next two steps.',
    ta: 'கையில் நீர் எடுத்து, ஒவ்வொரு நாமத்திற்குப் பின்னும் விரல் நுனிகள் வழியே ஒரு முறை விடவும். அடுத்த இரு படிகளாக ஆசமனமும் அங்கவந்தனமும் ஒரு முறை வரும்.',
  },
  {
    title: 'Prayashchitta Arghyam',
    // Was: "... Then offer arghyam once more, ..." -- the gesture spelled out.
    en: 'Hold the hands as for the Sankalpam and recite. Then take water in both cupped hands and let it fall from the fingertips once more, and pass water around the head reciting the closing line.',
    ta: 'ஸங்கல்பத்தில் செய்தது போல கைகளை வைத்துச் சொல்லவும். பின் இரு உள்ளங்கைகளிலும் நீர் ஏந்தி, விரல் நுனிகள் வழியே மீண்டும் ஒரு முறை விடவும்; இறுதி வரியைச் சொல்லியபடி தலையைச் சுற்றி நீர் சுழற்றவும்.',
  },
  {
    title: 'Japasthanam Prokshanam',
    // The step the whole complaint was about. Its first sentence was "Do
    // Achamanam and Anga Vandanam once"; that pair is now the two steps before
    // it, so the sentence goes and the step says only what it is itself for.
    en: 'Take water in the hand, pour it down at the end of the mantra, and make a tilak with it. Finally pour water onto the plate as an offering while saying the closing line.',
    ta: 'கையில் நீர் எடுத்து, மந்திரம் முடியும்போது கீழே விட்டு, அந்த நீரால் திலகம் இடவும். இறுதியாக, இறுதி வரியைச் சொல்லியபடி தாம்பாளத்தில் நீரை அர்ப்பணமாக விடவும்.',
  },
  {
    title: 'Pranayamam (japa)',
    // Was: "The same breathing as before -- ..."
    en: 'Fold the index and middle fingers. Close the right nostril with the thumb and the left with the ring and little fingers. Breathe IN through the left through the seven worlds, HOLD through the Gayatri, and breathe OUT through the right through om aapo jyoti.',
    ta: 'ஆட்காட்டி, நடுவிரல்களை மடக்கவும். வலது நாசியைக் கட்டைவிரலாலும், இடது நாசியை மோதிர, சுண்டு விரல்களாலும் அடைக்கவும். இடது நாசி வழியே ஏழு லோகங்களுடன் மூச்சை இழுக்கவும்; காயத்ரியுடன் நிறுத்தவும்; வலது நாசி வழியே "ஓம் ஆபோ ஜ்யோதி" உடன் வெளியிடவும்.',
  },
];

/** The rite, in order, after all of the above. The one source of step_number. */
const ORDER = [
  'Achamanam',
  'Anga Vandanam',
  'Vighneshwara Dhyanam',
  'Pranayamam',
  'Sankalpam — morning', 'Sankalpam — noon', 'Sankalpam — evening',
  'Jala Prarthana',
  'Marjanam',
  'Apaam Prashanam — morning', 'Apaam Prashanam — noon', 'Apaam Prashanam — evening',
  'Punar Marjanam',
  'Arghya Pradanam — morning', 'Arghya Pradanam — noon', 'Arghya Pradanam — evening',
  'Prayashchitta Arghyam',
  'Aikyanusandhanam',
  'Navagraha Deva Tarpanam',
  'Achamanam (after tarpanam)', 'Anga Vandanam (after tarpanam)',
  'Conclusion of the First Part',
  'Namaskara Mantras',
  'Prarthana',
  'Asana Mantra',
  'Vighneshwara Dhyanam (japa)',
  'Pranayamam (japa)',
  'Japa Sankalpam — morning', 'Japa Sankalpam — noon', 'Japa Sankalpam — evening',
  'Pranava Japa',
  'Gayatri Avahanam',
  'Gayatri Nyasa',
  'Dhyanam',
  'Gayatri Japa — morning', 'Gayatri Japa — noon', 'Gayatri Japa — evening',
  'Gayatri Upasthanam — morning', 'Gayatri Upasthanam — noon', 'Gayatri Upasthanam — evening',
  'Surya Prarthana — morning', 'Surya Prarthana — noon', 'Varuna Prarthana — evening',
  'Samashti Abhivadanam',
  'Abhivadanam',
  'Dig Devata Vandanam',
  'Yama Vandanam',
  'Harihara Vandanam',
  'Suryanarayana Vandanam',
  'Samarpanam',
  'Achamanam (before prokshanam)', 'Anga Vandanam (before prokshanam)',
  'Japasthanam Prokshanam',
];

/** Which modes each title ends up with. Everything not named here is all three. */
const SINGLE_MODE = {};
for (const s of SITTINGS) {
  for (const stem of ['Sankalpam', 'Apaam Prashanam', 'Arghya Pradanam', 'Japa Sankalpam',
                      'Gayatri Japa', 'Gayatri Upasthanam']) {
    SINGLE_MODE[`${stem} — ${s.en}`] = s.mode;
  }
}
SINGLE_MODE['Surya Prarthana — morning'] = 'pratah';
SINGLE_MODE['Surya Prarthana — noon'] = 'madhyahnika';
SINGLE_MODE['Varuna Prarthana — evening'] = 'sayam';

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

if (new Set(ORDER).size !== ORDER.length) fail('ORDER repeats a title');

// Every new step must carry Tamil. This is the 0048 lesson written down: that
// migration shipped eighteen steps with instruction_ta empty when every other
// pooja had Tamil on every row, and a count of steps did not notice.
for (const sp of SPLITS) {
  for (const s of SITTINGS) {
    const p = sp.per[s.mode];
    if (!p?.en?.trim()) fail(`${sp.from} — ${s.en}: no English`);
    if (!p?.ta?.trim()) fail(`${sp.from} — ${s.en}: no Tamil`);
    if (!ORDER.includes(`${sp.from} — ${s.en}`)) fail(`${sp.from} — ${s.en} is missing from ORDER`);
  }
  if (!sp.base_ta?.trim()) fail(`${sp.from}: no Tamil base`);
  if (ORDER.includes(sp.from)) fail(`${sp.from} is still in ORDER unsplit`);
}
for (const r of REPEATS) {
  if (!r.instruction_ta?.trim()) fail(`${r.title_en}: no Tamil`);
  if (!r.title_ta?.trim()) fail(`${r.title_en}: no Tamil title`);
  if (!ORDER.includes(r.title_en)) fail(`${r.title_en} is missing from ORDER`);
  if (!ORDER.includes(r.clone_of)) fail(`${r.title_en} clones ${r.clone_of}, which is not in ORDER`);
}
for (const r of REWRITES) {
  if (!r.ta?.trim()) fail(`${r.title}: rewrite has no Tamil`);
  if (!ORDER.includes(r.title)) fail(`${r.title} is missing from ORDER`);
}

// The whole point of the exercise: no surviving instruction may name more than
// one sitting, and none may tell the reader to go and do another step.
const SITTING_WORDS = /\b(morning|noon|midday|evening|dawn|dusk)\b/gi;
for (const sp of SPLITS) {
  for (const s of SITTINGS) {
    const text = `${sp.base_en} ${sp.per[s.mode].en}`;
    const hits = new Set((text.match(SITTING_WORDS) ?? []).map((w) => w.toLowerCase()));
    if (hits.size > 1) fail(`${sp.from} — ${s.en} still names ${[...hits].join(' and ')}`);
  }
}
for (const r of [...REPEATS.map((x) => ({ t: x.title_en, en: x.instruction_en })),
                 ...REWRITES.map((x) => ({ t: x.title, en: x.en }))]) {
  if (/\bdo achamanam\b|\bdo anga vandanam\b/i.test(r.en)) {
    fail(`${r.t} still tells the reader to go and do another step`);
  }
}

/**
 * How many steps one sitting actually shows: everything common, plus its own
 * variant of each split. Counted by the same rule the app filters by rather
 * than from a formula -- the formula I wrote first added one per SITTING where
 * it needed one per SPLIT, which are different numbers the moment a step is
 * split into three for the seventh time.
 */
const stepsIn = (mode) => ORDER.filter((t) => !SINGLE_MODE[t] || SINGLE_MODE[t] === mode).length;
const perSitting = stepsIn(SITTINGS[0].mode);
console.log('--- the rite after this ---');
console.log(`  ${ORDER.length} steps in all, ${perSitting} in any one sitting`);
console.log(`  ${Object.keys(SINGLE_MODE).length} steps belong to a single sitting`);
console.log(`  ${SPLITS.length} step(s) split, ${REPEATS.length} inserted, ${REWRITES.length} reworded`);
for (const s of SITTINGS) {
  const n = stepsIn(s.mode);
  console.log(`    ${s.en.padEnd(8)} ${n} steps`);
  if (n !== perSitting) fail(`${s.en} has ${n} steps, the others have ${perSitting}`);
}
if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit --------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const L = [];
const o = (s = '') => L.push(s);

o('-- =============================================================================');
o('-- 0052_sandhyavandanam_self_contained.sql');
o('--');
o('-- GENERATED by scripts/build-sandhya-selfcontained.mjs. Do not hand-edit.');
o('--');
o('-- Two faults, both of which make the reader do work the app exists to do.');
o('--');
o('-- STEPS THAT RECITE ALL THREE SITTINGS AT ONCE. Arghya Pradanam said "THREE');
o('-- times in the morning and in the evening; TWICE at noon"; Gayatri Japa said');
o('-- "MORNING 108 ... NOON 32 ... EVENING 64". The reader has already said which');
o('-- sitting they are keeping and is then handed all three to pick from -- at the');
o('-- one moment in the rite when they are counting on their fingers rather than');
o('-- reading. Each becomes three mode-tagged steps.');
o('--');
o('-- Not a new convention: Sankalpam, Apaam Prashanam, Japa Sankalpam, Gayatri');
o('-- Upasthanam and the Surya/Varuna Prarthana already split exactly this way.');
o('-- These two were left as prose because what differs is the COUNT and not the');
o('-- words -- which is precisely why prose fails here. A count buried in a');
o('-- sentence is easier to misread than a mantra that is plainly not yours.');
o('--');
o('-- STEPS THAT NAME ANOTHER STEP INSTEAD OF BEING ONE. Japasthanam Prokshanam');
o('-- opened "Do Achamanam and Anga Vandanam once", and the Navagraha tarpanam');
o('-- closed the same way. Someone who knows the rite reads that as an');
o('-- instruction; someone learning it has to leave the step, find step one, and');
o('-- come back. The book says only "(do aachamanam & angavandanam once)" because');
o('-- it is a reference card for someone who already knows. This app is not.');
o('--');
o('-- So the pair is inserted as real steps at both places the book asks for them.');
o('-- Also not new: Vighneshwara Dhyanam and Pranayamam are already repeated in');
o('-- full as "(japa)" variants rather than back-referenced.');
o('--');
o('-- THE CLONES ARE INSERT...SELECT. Each repeated step copies its mantra and');
o('-- meaning from the row it repeats rather than retyping Devanagari to say the');
o('-- same thing twice, which is how an error gets into one of two places and then');
o('-- has to be found by eye.');
o('--');
o(`-- ${ORDER.length} steps in all, ${perSitting} in any one sitting (was 45 and 35).`);
o('-- =============================================================================');
o();
o('begin;');
o();
o('-- Park every step clear of the numbers about to be assigned. Renumbering in');
o('-- place would collide the moment a step moves onto a number still occupied,');
o('-- and the order of the updates would silently decide the outcome.');
o(`update public.pooja_steps set step_number = step_number + 1000 where pooja_id = ${q(P)};`);
o();

let splitSeq = 0;
o('-- --- the two steps that recited all three sittings ---------------------------');
for (const sp of SPLITS) {
  const first = SITTINGS[0];
  o(`-- ${sp.from}: the existing row becomes the ${first.en} variant, keeping its id`);
  o('-- and anything that hangs off it; the other two are cloned from it.');
  o('update public.pooja_steps set');
  o(`  step_title_en = ${q(`${sp.from} — ${first.en}`)},`);
  o(`  step_title_ta = ${q(`${sp.ta} — ${first.ta}`)},`);
  o(`  instruction_en = ${q(`${sp.base_en} ${sp.per[first.mode].en}`)},`);
  o(`  instruction_ta = ${q(`${sp.base_ta} ${sp.per[first.mode].ta}`)},`);
  o(`  modes = array[${q(first.mode)}]::text[],`);
  o('  updated_at = now()');
  o(` where pooja_id = ${q(P)} and step_title_en = ${q(sp.from)};`);
  o();
  for (const s of SITTINGS.slice(1)) {
    o('insert into public.pooja_steps (');
    o('  pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
    o('  mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, is_dynamic_sankalpam,');
    o('  philosophy_en, philosophy_ta, phase, scripts_generated, gender_rule, source_ref, modes)');
    // A parking number of its own. Numbering these as morning+1 would land on
    // the number another step is parked at -- harmless only if nothing enforces
    // uniqueness, which is not a thing to assume when the fix is a counter.
    o(`select pooja_id, ${3000 + (splitSeq += 1)}, ${q(`${sp.from} — ${s.en}`)}, ${q(`${sp.ta} — ${s.ta}`)},`);
    o(`       ${q(`${sp.base_en} ${sp.per[s.mode].en}`)},`);
    o(`       ${q(`${sp.base_ta} ${sp.per[s.mode].ta}`)},`);
    o('       mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, is_dynamic_sankalpam,');
    o('       philosophy_en, philosophy_ta, phase, scripts_generated, gender_rule, source_ref,');
    o(`       array[${q(s.mode)}]::text[]`);
    o('  from public.pooja_steps');
    o(` where pooja_id = ${q(P)} and step_title_en = ${q(`${sp.from} — ${SITTINGS[0].en}`)};`);
    o();
  }
}

o('-- --- the pair the book asks for twice more ------------------------------------');
REPEATS.forEach((r, i) => {
  o(`-- ${r.title_en}, carrying ${r.clone_of}'s mantra by copy rather than by retyping.`);
  o('insert into public.pooja_steps (');
  o('  pooja_id, step_number, step_title_en, step_title_ta, instruction_en, instruction_ta,');
  o('  mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, is_dynamic_sankalpam,');
  o('  philosophy_en, philosophy_ta, phase, scripts_generated, gender_rule, source_ref, modes)');
  o(`select pooja_id, ${2000 + i}, ${q(r.title_en)}, ${q(r.title_ta)},`);
  o(`       ${q(r.instruction_en)},`);
  o(`       ${q(r.instruction_ta)},`);
  o('       mantra_sanskrit, mantra_tamil, mantra_translit, meaning_en, is_dynamic_sankalpam,');
  o('       philosophy_en, philosophy_ta, phase, scripts_generated, gender_rule, source_ref, modes');
  o('  from public.pooja_steps');
  o(` where pooja_id = ${q(P)} and step_title_en = ${q(r.clone_of)};`);
  o();
});

o('-- --- instructions that pointed at another step --------------------------------');
for (const r of REWRITES) {
  o('update public.pooja_steps set');
  o(`  instruction_en = ${q(r.en)},`);
  o(`  instruction_ta = ${q(r.ta)},`);
  o('  updated_at = now()');
  o(` where pooja_id = ${q(P)} and step_title_en = ${q(r.title)};`);
  o();
}

o('-- --- the rite, in order -------------------------------------------------------');
ORDER.forEach((title, i) => {
  o(`update public.pooja_steps set step_number = ${i + 1}, updated_at = now()`);
  o(` where pooja_id = ${q(P)} and step_title_en = ${q(title)};`);
});
o();

o('-- --- assert ------------------------------------------------------------------');
o('do $$');
o('declare n int; t text;');
o('begin');
o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(P)};`);
o(`  if n <> ${ORDER.length} then raise exception 'rite has % steps, expected ${ORDER.length}', n; end if;`);
o();
o('  -- Nothing was left parked. A step still above 1000 is one ORDER does not');
o('  -- name, which means it would sort to the end of the rite rather than vanish');
o('  -- -- the kind of fault that shows up as a stray step at the bottom and not');
o('  -- as an error.');
o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(P)} and step_number > 1000;`);
o("  if n > 0 then raise exception '% step(s) were never renumbered', n; end if;");
o();
o('  -- Dense 1..n, so the step sheet has no gaps and no two steps collide.');
o('  select count(*) into n from (');
o(`    select step_number from public.pooja_steps where pooja_id = ${q(P)}`);
o('     group by step_number having count(*) > 1) d;');
o("  if n > 0 then raise exception '% duplicated step_number(s)', n; end if;");
o(`  select count(*) into n from generate_series(1, ${ORDER.length}) g`);
o(`   where not exists (select 1 from public.pooja_steps where pooja_id = ${q(P)} and step_number = g);`);
o("  if n > 0 then raise exception '% gap(s) in step_number', n; end if;");
o();
for (const s of SITTINGS) {
  o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(P)} and ${q(s.mode)} = any(modes);`);
  o(`  if n <> ${perSitting} then raise exception '${s.en} has % steps, expected ${perSitting}', n; end if;`);
}
o();
o('  -- THE ACTUAL POINT OF THE MIGRATION, and neither half of it is a count.');
o('  --');
o('  -- No surviving instruction may name two different sittings. Checked against');
o('  -- the stored rows rather than the generator: the generator validates its own');
o('  -- strings, which proves nothing about what a renumber or a clone put in the');
o('  -- table.');
o('  select string_agg(step_title_en, likeN) into t from (');
o('    select step_title_en, chr(10) || \'    \' as likeN from public.pooja_steps');
o(`     where pooja_id = ${q(P)}`);
o('       and (case when instruction_en ~* \'\\mmorning\\M\' then 1 else 0 end');
o('          + case when instruction_en ~* \'\\m(noon|midday)\\M\' then 1 else 0 end');
o('          + case when instruction_en ~* \'\\mevening\\M\' then 1 else 0 end) > 1) x;');
o("  if t is not null then raise exception 'step(s) still recite more than one sitting: %', t; end if;");
o();
o('  -- And none may hand the reader a homework assignment.');
o('  select string_agg(step_title_en, \', \') into t from public.pooja_steps');
o(`   where pooja_id = ${q(P)} and instruction_en ~* 'do achamanam|do anga vandanam';`);
o("  if t is not null then raise exception 'step(s) still refer the reader elsewhere: %', t; end if;");
o();
o('  -- Each repeated step carries the SAME mantra as the step it repeats. The');
o('  -- clone is an INSERT...SELECT so this holds by construction -- which is');
o('  -- exactly why it is worth asserting: if someone later edits one of the two by');
o('  -- hand, the construction no longer holds and nothing else would notice.');
for (const r of REPEATS) {
  o('  select count(*) into n from public.pooja_steps a, public.pooja_steps b');
  o(`   where a.pooja_id = ${q(P)} and a.step_title_en = ${q(r.title_en)}`);
  o(`     and b.pooja_id = ${q(P)} and b.step_title_en = ${q(r.clone_of)}`);
  o('     and a.mantra_sanskrit is not distinct from b.mantra_sanskrit');
  o('     and a.mantra_tamil is not distinct from b.mantra_tamil');
  o('     and a.mantra_translit is not distinct from b.mantra_translit;');
  o(`  if n <> 1 then raise exception '${r.title_en} does not carry ${r.clone_of}''s mantra'; end if;`);
}
o();
o('  -- Every step has Tamil, which is the 0048 lesson: that migration shipped');
o('  -- eighteen steps with instruction_ta empty while every other pooja had Tamil');
o('  -- on every row, and the step count did not notice.');
o('  select string_agg(step_title_en, \', \') into t from public.pooja_steps');
o(`   where pooja_id = ${q(P)}`);
o("     and (coalesce(trim(step_title_ta), '') = '' or coalesce(trim(instruction_ta), '') = '');");
o("  if t is not null then raise exception 'step(s) have no Tamil: %', t; end if;");
o('end $$;');
o();
o('commit;');

const sql = L.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0052_sandhyavandanam_self_contained.sql', sql);
  console.log('\nwrote supabase/migrations/0052_sandhyavandanam_self_contained.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
