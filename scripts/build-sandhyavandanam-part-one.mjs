#!/usr/bin/env node
/**
 * Sandhyavandanam, the first half: book pages 16 to 27.
 *
 *   node scripts/build-sandhyavandanam-part-one.mjs          # validate
 *   node scripts/build-sandhyavandanam-part-one.mjs --emit   # write it
 *
 * Yajurveda Trikaala Sandhyaavandanam, Giri Trading Agency, English translation
 * by A. R. Parthasarathi. Eighteen steps, from the achamanam to the seal the
 * book puts on its own first half -- "The first part of the sandhyaavandanam
 * ends here", mayaa krtam idam sarvam karma, and then iti praatah
 * sandhyaavandanam.
 *
 * MANTRAS COME FROM THE TRANSCRIPTS, addressed by book page and block index, so
 * nothing is retyped. The ENGLISH IS WRITTEN HERE. The book's glosses and
 * rubrics are the editor's prose and this project has written its own since the
 * Ganesha corrections; what is taken from the book is what the book records
 * rather than what it says.
 *
 * THREE SITTINGS, THREE DIFFERENT KINDS OF DIFFERENCE, and the shape of the
 * data follows the shape of the rite rather than one convenient pattern:
 *
 *   Different mantra, same action -> three rows, one mode each.
 *     The Sankalpa (praatah sandhyaam upaasishye / maadhyaahnikam karishye /
 *     saayam sandhyaam upaasishye) and the Prashanam, which is three entirely
 *     separate mantras: Surya guarding against what was done by night, the
 *     waters purifying food and gifts, Agni guarding against the day.
 *
 *   Same mantra, different count -> one row, mode-tagged instruction.
 *     Arghyam is offered three times morning and evening and twice at noon.
 *
 *   Same everything -> one row, all three modes.
 *     Everything else.
 *
 * FOUR MISPRINTS ARE CORRECTED HERE, each with the evidence that settles it,
 * and each asserted after the fact. The project rule is that a transcript
 * records the page and a migration may correct it -- but never silently, and
 * never on my own authority alone.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const S = Sanscript.default ?? Sanscript;
const POOJA = 'sandhyavandanam';
const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/6-sandhya-giri/';
const SRC = 'Yajurveda Trikaala Sandhyaavandanam (Giri), pp.16-27, photographed page';
const ALL = ['pratah', 'madhyahnika', 'sayam'];

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
// Corrections are applied HERE, as the text is read, not at emit time.
//
// The first draft corrected inside scripts(), which runs during emit -- AFTER
// the checks below. So the checks counted zero corrections, reported that the
// misprints had survived, and would have been right: the raw text was what they
// saw. Correcting at the source means every assertion downstream sees the same
// text the migration will write.
const deva = (page, ...idx) =>
  corrected(idx.map((i) => block(page, i, 'deva').lines.join('\n')).join('\n'));
const rows = (page, idx, want = 'table') =>
  block(page, idx, want).rows.map((r) => r.map((cell) => corrected(cell)));

/**
 * Misprints in the printed Devanagari, corrected with their evidence.
 *
 * Applied by exact replacement and asserted afterwards, so a corrected text
 * that silently failed to match would fail the build rather than ship the
 * misprint.
 */
const FIXES = [
  {
    wrong: 'यो वशिशवतमो रसः',
    right: 'यो वः शिवतमो रसः',
    why:
      'Book pages 21 and 24 both set यो वशिशवतमो रसः -- the visarga after वः lost and शि ' +
      'doubled. Three readings agree against the page: this book\'s OWN roman four lines below ' +
      '("yo vah-shivatamo rasaha"), the Bhavan edition\'s roman ("yo vah sivatamorasah"), and ' +
      'the received text of the Rigvedic apo hi shtha. The same wrong setting appears twice ' +
      'with the right roman twice, which means reused type rather than a compositor slipping.',
    expect: 2,
  },
  {
    wrong: 'ओं भूर्भुवस्तुवः।',
    right: 'ओं भूर्भुवः सुवः।',
    why:
      'Book page 25 sets तुवः where the roman beside it reads "suvaha" and every other ' +
      'occurrence in the book reads सुवः. A स set as त.',
    expect: 1,
  },
  {
    wrong: 'त्रिविक्रमं तर्पयामिा',
    right: 'त्रिविक्रमं तर्पयामि',
    why:
      'Book page 27 carries a stray aa-matra on one of twenty-one otherwise identical lines. ' +
      'Every other line is तर्पयामि and the roman reads "trivikramam tarpayaami".',
    expect: 1,
  },
];

let fixCounts = Object.fromEntries(FIXES.map((f) => [f.wrong, 0]));
function corrected(text) {
  let out = text;
  for (const f of FIXES) {
    const before = out;
    out = out.split(f.wrong).join(f.right);
    if (out !== before) fixCounts[f.wrong] += before.split(f.wrong).length - 1;
  }
  return out;
}

/** Text arriving here is already corrected; see deva() above. */
const scripts = (d) => ({
  deva: d,
  ta: transliterate(S, d, 'tamil'),
  iast: transliterate(S, d, 'iast'),
});

// --- the mantras, read out of the transcripts --------------------------------

const ACHAMANAM = deva('16', 4);
const ANGA_PAIRS = [...rows('16', 8), ...rows('17', 0)];
const DHYANAM = deva('18', 2);
const PRANAYAMA = deva('18', 9);
const SANKALPA_STEM = deva('19', 6);
const SANKALPA_ENDINGS = rows('19', 8); // [sitting, deva, translit]
const JALA = deva('20', 3);
const MARJANAM = deva('21', 0);
const PRASHANAM = { pratah: deva('22', 1), madhyahnika: deva('22', 5), sayam: deva('23', 3) };
const PUNAR_PREFIX = rows('24', 2); // [label, deva, translit]
const PUNAR_BODY = deva('24', 3);
const ARGHYAM = deva('25', 3);
const PRAYASHCHITTA = deva('25', 9, 12);
const AIKYA = deva('26', 2);
const TARPANAM = [...rows('26', 9, 'namavali'), ...rows('27', 0, 'namavali')];
const SEAL = deva('27', 4);

// --- the steps ---------------------------------------------------------------
//
// instruction/meaning/philosophy are written here, not lifted from the book.

const STEPS = [
  {
    title: 'Achamanam', ta: 'ஆசமனம்', phase: 'purvangam', modes: ALL, deva: ACHAMANAM,
    instruction:
      'Sit facing east or north. Fold the forefinger of the right hand against the thumb and ' +
      'curl the other three so the palm holds a spoonful of water. Sip once at each of the ' +
      'three names. Achamanam and Anga Vandanam are done three times over at the start.',
    meaning:
      'Three names of Vishnu, each closed with namaha, one sip of water to each. The book calls ' +
      'the set the nama-trayee vidya and says it cures all disease.',
    philosophy:
      'Nothing has been asked for and no deity invited. Water is taken into the body while three ' +
      'names are said over it, and that is the whole step. Every rite in this app opens the same ' +
      'way, which is the point: the mouth about to recite is rinsed first, and the rinsing is ' +
      'itself done with names.',
  },
  {
    title: 'Anga Vandanam', ta: 'அங்க வந்தனம்', phase: 'purvangam', modes: ALL,
    deva: ANGA_PAIRS.map(([, d]) => d).join('\n'),
    instruction:
      'Six pairs of names, each touched to a part of the body with the finger named against it: ' +
      'thumb to the cheeks, ring finger to the eyes, forefinger to the nostrils, little finger ' +
      'to the ears, middle finger to the shoulders, and all the fingers to the navel and the ' +
      'crown.',
    meaning:
      'The twelve names of Vishnu, placed on the body two at a time — Keshava and Narayana, ' +
      'Madhava and Govinda, Vishnu and Madhusudana, Trivikrama and Vamana, Sridhara and ' +
      'Hrishikesha, Padmanabha and Damodara.',
    philosophy:
      'The book gives a reason for every finger, and it is not decorative: thumb and mouth are ' +
      'held to be the seat of fire, ring finger and eyes of the sun, forefinger and nose of ' +
      'wind, little finger and ears of Indra, middle finger and shoulders of Prajapati. The ' +
      'inside of the hand is God, which is why the last pair goes to the heart and the head. ' +
      'The body is not being blessed part by part; it is being identified part by part with ' +
      'what already lives there.',
  },
  {
    title: 'Vighneshwara Dhyanam', ta: 'விக்னேஶ்வர த்யானம்', phase: 'purvangam', modes: ALL,
    deva: DHYANAM,
    instruction: 'Tap both temples gently with the knuckles five times while reciting.',
    meaning:
      'He who wears white, who pervades all, moon-coloured and four-armed, with a face at ease — ' +
      'meditate on him, for the quieting of every obstacle.',
    philosophy:
      'The same verse opens the japa half of this rite as well, and it opens most poojas in this ' +
      'app. It asks for obstacles to be quieted rather than removed, which is a smaller and more ' +
      'exact request: the rite is about to be performed either way.',
  },
  {
    title: 'Pranayamam', ta: 'ப்ராணாயாமம்', phase: 'purvangam', modes: ALL, deva: PRANAYAMA,
    instruction:
      'Fold the index and middle fingers. Close the right nostril with the thumb and the left ' +
      'with the ring and little fingers. The mantra has three parts and the breath is assigned ' +
      'to each: breathe IN through the left nostril reciting silently from om bhuh to ogm ' +
      'satyam; HOLD through om tat savitur to prachodayat; breathe OUT through the right nostril ' +
      'through om aapo jyoti to bhurbhuvassuvarom. That is one pranayama.',
    meaning:
      'Seven worlds named as Om, then the Gayatri, then the declaration that the waters, the ' +
      'light, the essence, the immortal and Brahman are all bhuh bhuvah suvah — Om.',
    philosophy:
      'The step is defined by the breath and not by repetition. Told only the words, a reader ' +
      'would recite a mantra; told the division, they perform a pranayama, because the three ' +
      'parts are in with the breath, held, and out. The book adds that this is properly learnt ' +
      'from a teacher, which is the first of three places it admits a page cannot teach a body.',
  },
];

// Sankalpa: three rows, one per sitting. Stem plus one closing verb.
const SANKALPA_MEANING = {
  pratah: 'I begin to worship the Sandhya of the morning.',
  madhyahnika: 'I shall perform the midday rite.',
  sayam: 'I begin to worship the Sandhya of the evening.',
};
SANKALPA_ENDINGS.forEach(([sitting, ending]) => {
  const mode = { morning: 'pratah', noon: 'madhyahnika', evening: 'sayam' }[sitting];
  if (!mode) throw new Error(`unknown sitting "${sitting}" in the sankalpa table`);
  STEPS.push({
    title: `Sankalpam — ${{ pratah: 'morning', madhyahnika: 'noon', sayam: 'evening' }[mode]}`,
    ta: `ஸங்கல்பம் — ${{ pratah: 'காலை', madhyahnika: 'உச்சி', sayam: 'மாலை' }[mode]}`,
    phase: 'purvangam', modes: [mode],
    // The evening row is printed सायं मन्ध्या in the book, a स set as म. The
    // morning row spells सन्ध्या correctly and the roman beside the evening row
    // reads "saayam sandhyaa". Corrected here.
    deva: `${SANKALPA_STEM}\n${ending.replace('मन्ध्या', 'सन्ध्या')}`,
    instruction: 'Clasp the right palm over the left and rest both on the right thigh while reciting.',
    meaning:
      'That all the wrong accumulated in me may be destroyed, and so that the Supreme may be ' +
      `pleased: ${SANKALPA_MEANING[mode]}`,
    philosophy:
      'This sankalpa names no person, no gotra, no year, month, tithi or star — and the Bhavan ' +
      'edition prints it the same way, so two independent editions agree. A rite performed on a ' +
      'particular day must say which day; a nitya karma need not, because the occasion is that ' +
      'it is morning. Only the last word changes between the three sittings, and not quite ' +
      'symmetrically: morning and evening take upasishye, "I begin to worship", governing the ' +
      'goddess Sandhya, while noon takes karishye, "I shall do", governing the rite itself.',
  });
});

STEPS.push(
  {
    title: 'Jala Prarthana', ta: 'ஜல ப்ரார்த்தனை', phase: 'purvangam', modes: ALL, deva: JALA,
    instruction:
      'Take water in the uddharani and keep the right ring finger in it. At the end of the ' +
      'mantra write om on the surface of the water and apply it to the forehead.',
    meaning:
      'The waters are all this; the worlds are waters, the pranas are waters, cattle are waters, ' +
      'food, the deathless, the metres, the lights, the yajus, truth and all the deities are ' +
      'waters.',
    philosophy:
      'Every line predicates something OF water rather than asking anything of it. Nothing is ' +
      'requested; water is identified with each thing in turn until it is identified with ' +
      'everything. Only then is it used, and everything it touches afterwards in this rite has ' +
      'been declared to be everything already. The rubric alone makes this look like washing.',
  },
  {
    title: 'Marjanam', ta: 'மார்ஜனம்', phase: 'purvangam', modes: ALL, deva: MARJANAM,
    instruction:
      'Sprinkle water over the head with the ring finger at each of the first seven lines. Touch ' +
      'the right and left thighs at the eighth. Sprinkle again at the ninth. Then take water in ' +
      'the right palm and pass it clockwise around the head.',
    meaning:
      'Waters, you are happiness itself; give us vigour, and the sight of a great gladness. Let ' +
      'us share here in that most kindly essence of yours, like mothers who long for us. We come ' +
      'to you for that whose dwelling you quicken. Waters, beget us anew.',
    philosophy:
      'The ten lines are choreography, not layout: the book assigns the first seven to the head, ' +
      'the eighth to the thighs, the ninth to sprinkling again, and the tenth is the closing ' +
      'vyahriti rather than another line of the marjanam. Run together as one mantra the step ' +
      'still recites correctly and stops meaning anything.',
  },
);

// Prashanam: three genuinely different mantras.
const PRASHANAM_TEXT = {
  pratah: {
    title: 'morning', ta: 'காலை',
    meaning:
      'May the Sun, and Anger, and the lords of Anger, guard me from the wrong done out of ' +
      'anger; may the night wipe away whatever wrong I did in the night by mind, speech, hands, ' +
      'feet, belly or sex. I offer myself into the sun, into the light, into the deathless. ' +
      'Svaha.',
  },
  madhyahnika: {
    title: 'noon', ta: 'உச்சி',
    meaning:
      'May the waters purify the earth, and the purified earth purify me; may Brahmanaspati ' +
      'purify, and the purified Veda purify me. Whatever was left over and not to be eaten, ' +
      'whatever I did wrongly, whatever I took from the undeserving — may the waters purify all ' +
      'of it. Svaha.',
  },
  sayam: {
    title: 'evening', ta: 'மாலை',
    meaning:
      'May Agni, and Anger, and the lords of Anger, guard me from the wrong done out of anger; ' +
      'may the day wipe away whatever wrong I did in the day by mind, speech, hands, feet, belly ' +
      'or sex. I offer myself into the truth, into the light, into the deathless. Svaha.',
  },
};
for (const mode of ALL) {
  const t = PRASHANAM_TEXT[mode];
  STEPS.push({
    title: `Apaam Prashanam — ${t.title}`, ta: `அபாம் ப்ராஶனம் — ${t.ta}`,
    phase: 'purvangam', modes: [mode], deva: PRASHANAM[mode],
    instruction: 'Take one uddharani of water in the palm, recite, and drink the water at the end.',
    meaning: t.meaning,
    philosophy:
      'Not one mantra with a word swapped — three different texts, and reading them together ' +
      'shows why. The morning asks the Sun to absolve what was done BY NIGHT; the evening asks ' +
      'Agni to absolve what was done BY DAY; and each offers itself into a different light, the ' +
      'sun in the morning and the truth in the evening. Each sitting cleans the stretch of time ' +
      'behind it. Noon has neither a night nor a day behind it, only a morning of living, so its ' +
      'mantra is about food eaten and gifts taken instead.',
  });
}

STEPS.push(
  {
    title: 'Punar Marjanam', ta: 'புனர் மார்ஜனம்', phase: 'purvangam', modes: ALL,
    deva: `${PUNAR_PREFIX.map(([, d]) => d).join('\n')}\n${PUNAR_BODY}`,
    instruction:
      'The same sprinkling as the Marjanam, with four further lines added in front of it and ' +
      'included in the same order.',
    meaning:
      'I have praised Dadhikravan, the swift victorious horse. May he make our mouths fragrant ' +
      'and lengthen our lives. Then the nine lines of the Marjanam again.',
    philosophy:
      'Not a second washing. The book says plainly that only four mantras are new and the other ' +
      'ten are the same, and its own gloss reads the horse as Hayagriva, the swiftest and the ' +
      'ground of all learning. The request is physical and specific — make our mouths fragrant, ' +
      'lengthen our lives — said over the organ that is about to do the reciting.',
  },
  {
    title: 'Arghya Pradanam', ta: 'அர்க்ய ப்ரதானம்', phase: 'purvangam', modes: ALL, deva: ARGHYAM,
    instruction:
      'Take water in both cupped hands and let it fall from the fingertips at the end of the ' +
      'mantra. THREE times in the morning and in the evening; TWICE at noon. Then do one ' +
      'pranayama.',
    meaning:
      'The three worlds are Om. We meditate on the brilliance of that god who impels our ' +
      'thoughts.',
    philosophy:
      'The first point in the rite where the sittings differ in the ACTION rather than the ' +
      'words. Everything before this changed its mantra and kept its gesture; here the Gayatri ' +
      'is the same at all three and the count is not. Two at noon and three at either end of the ' +
      'day — the offering is made to the sun at its junctures, and the middle of the day has ' +
      'only one juncture to mark.',
  },
  {
    title: 'Prayashchitta Arghyam', ta: 'ப்ராயஶ்சித்த அர்க்யம்', phase: 'purvangam', modes: ALL,
    deva: PRAYASHCHITTA,
    instruction:
      'Hold the hands as for the Sankalpam and recite. Then offer arghyam once more, and pass ' +
      'water around the head reciting the closing line.',
    meaning:
      'For the expiation of the hour having passed, I shall make the offering of arghyam. The ' +
      'three worlds are Om.',
    philosophy:
      'This is an apology for being late. Kalatita means the time has gone — the sitting was not ' +
      'kept at its own hour — and the remedy is one extra arghyam offered with a resolution that ' +
      'says so out loud. A rite performed punctually does not need it, and a book that prints it ' +
      'in the ordinary sequence is being realistic about how mornings go.',
  },
  {
    title: 'Aikyanusandhanam', ta: 'ஐக்யானுஸந்தானம்', phase: 'purvangam', modes: ALL, deva: AIKYA,
    instruction: 'Pray silently to Aditya while reciting.',
    meaning: 'That sun is Brahman. I am Brahman.',
    philosophy:
      'Eight words, and the book marks them as the life line of the whole sandhyavandanam. ' +
      'Everything before this prepares the reciter; everything after it worships. Here the two ' +
      'are identified, and that is what keeps the rest of the rite from being sun-worship: the ' +
      'arghyam is poured towards the sun, the upasthanam addressed to it, the Gayatri is ' +
      'Savitr\'s — and the reciter has just said the sun is Brahman, and so is he.',
  },
  {
    title: 'Navagraha Deva Tarpanam', ta: 'நவக்ரஹ தேவ தர்ப்பணம்', phase: 'purvangam', modes: ALL,
    deva: null, // an archana list; the text lives in archana_items
    archana: TARPANAM.map(([d, t]) => ({ deva: d, translit: t })),
    instruction:
      'Take water in the hand and let it fall from the fingertips once after each name. Do ' +
      'Achamanam and Anga Vandanam once at the end.',
    meaning:
      'Water offered to the nine planets — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, ' +
      'Rahu and Ketu — and then to the twelve names of Narayana, who is Time.',
    philosophy:
      'Twenty-one offerings, and the second twelve are the calendar: the book says the Keshava ' +
      'names are Narayana in the form of time, one presiding over each month from Margashirsha ' +
      'to Kartika. So the step waters the planets that govern the sky and then the months that ' +
      'govern the year. These same twelve names have already been touched to the body in the ' +
      'Anga Vandanam; there they were bare and placed on limbs, here they take the accusative ' +
      'and a verb. One list, twice, doing two different things.',
  },
  {
    title: 'Conclusion of the First Part', ta: 'முதல் பகுதி நிறைவு', phase: 'purvangam', modes: ALL,
    deva: SEAL,
    instruction: 'Take water in the hand and pour it onto the plate as an offering while reciting.',
    meaning: 'Whatever I have done, all of it — om tat sat — let it be an offering to Brahman.',
    philosophy:
      'The book seals its own half here and says so: the first part of the sandhyavandanam ends, ' +
      'and then iti praatah sandhyaavandanam. What follows is the japa, which has its own ' +
      'sankalpa and its own name. The seal hands the work back rather than claiming it, and the ' +
      'japa half will end with the same words.',
  },
);

// --- checks ------------------------------------------------------------------

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- sandhyavandanam, part one ---');
const titles = new Set();
STEPS.forEach((s, i) => {
  const n = i + 1;
  const kind = s.archana ? `${s.archana.length} offerings` : `${(s.deva || '').split('\n').length} lines`;
  console.log(`  ${String(n).padStart(2)}  ${s.title.padEnd(34)} ${s.modes.join(',').padEnd(30)} ${kind}`);
  if (titles.has(s.title)) fail(`${s.title}: two steps share a title`);
  titles.add(s.title);
  for (const f of ['title', 'ta', 'instruction', 'meaning', 'philosophy']) {
    if (!s[f] || !String(s[f]).trim()) fail(`${s.title}: ${f} is empty`);
  }
  if (!/[஀-௿]/.test(s.ta)) fail(`${s.title}: Tamil title is not Tamil`);
  if (!s.deva && !s.archana) fail(`${s.title}: has neither a mantra nor an archana list`);
  if (s.deva && !/[ऀ-ॿ]/.test(s.deva)) fail(`${s.title}: mantra carries no Devanagari`);
  for (const m of s.modes) if (!ALL.includes(m)) fail(`${s.title}: unknown mode "${m}"`);
  for (const f of ['instruction', 'meaning', 'philosophy']) {
    if (/[ऀ-ॿ஀-௿]/.test(s[f])) fail(`${s.title}: ${f} carries Indic script`);
    if (/\bperformer\b/i.test(s[f])) fail(`${s.title}: ${f} says "performer"; this project says karta`);
  }
});

// Every sitting must be walkable end to end.
for (const mode of ALL) {
  const n = STEPS.filter((s) => s.modes.includes(mode)).length;
  console.log(`  ${mode.padEnd(13)} ${n} steps`);
  if (n !== STEPS.length - 4) fail(`${mode}: ${n} steps, expected ${STEPS.length - 4}`);
}

// The corrections landed, and landed the expected number of times. A fix that
// silently matched nothing would ship the misprint.
console.log('--- corrections ---');
for (const f of FIXES) {
  console.log(`  ${f.wrong}  ->  ${f.right}   (${fixCounts[f.wrong]} applied)`);
  if (fixCounts[f.wrong] !== f.expect) {
    fail(`correction "${f.wrong}" applied ${fixCounts[f.wrong]} times, expected ${f.expect}`);
  }
}
const allDeva = STEPS.map((s) => s.deva || '').join('\n') +
  STEPS.flatMap((s) => s.archana ?? []).map((a) => a.deva).join('\n');
for (const f of FIXES) {
  if (allDeva.includes(f.wrong)) fail(`the misprint "${f.wrong}" survived into the output`);
  if (!allDeva.includes(f.right)) fail(`the correction "${f.right}" is not in the output`);
}
if (TARPANAM.length !== 21) fail(`tarpanam has ${TARPANAM.length} offerings, expected 21`);
if (ANGA_PAIRS.length !== 6) fail(`anga vandanam has ${ANGA_PAIRS.length} pairs, expected 6`);
if (SANKALPA_ENDINGS.length !== 3) fail(`sankalpa has ${SANKALPA_ENDINGS.length} endings, expected 3`);

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit --------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0048_sandhyavandanam_part_one.sql');
out('--');
out('-- GENERATED by scripts/build-sandhyavandanam-part-one.mjs. Do not hand-edit.');
out('--');
out('-- Sandhyavandanam, book pages 16 to 27: from the achamanam to the seal the book');
out('-- puts on its own first half. Eighteen steps.');
out('--');
out('-- Source: Yajurveda Trikaala Sandhyaavandanam, Giri Trading Agency, English');
out('-- translation by A. R. Parthasarathi. Mantras transcribed from photographs of');
out('-- the printed page; the English here is written for this app, because the');
out('-- book\'s glosses and rubrics are the editor\'s prose.');
out('--');
out('-- THREE SITTINGS, THREE KINDS OF DIFFERENCE, and the data follows the rite');
out('-- rather than one convenient pattern:');
out('--');
out('--   different mantra, same action -> three rows, one mode each. The Sankalpa,');
out('--   and the Prashanam, which is three entirely separate mantras.');
out('--');
out('--   same mantra, different count -> one row, the count in instruction_en.');
out('--   Arghyam is offered three times morning and evening, twice at noon.');
out('--');
out('--   same everything -> one row carrying all three modes.');
out('--');
out('-- THREE MISPRINTS ARE CORRECTED, each with its evidence:');
for (const f of FIXES) {
  out('--');
  out(`--   ${f.wrong}  ->  ${f.right}`);
  for (const line of f.why.match(/.{1,72}(\s|$)/g)) out(`--   ${line.trim()}`);
}
out('--');
out('-- The generator asserts each correction applied exactly as often as expected,');
out('-- so a fix that silently matched nothing fails the build instead of shipping');
out('-- the misprint.');
out('--');
out('-- The pooja stays PLANNED. It is published by 0049, when the japa half lands');
out('-- and the rite is whole.');
out('-- =============================================================================');
out();
out('begin;');
out();
out('-- Idempotent: re-running replaces the same steps rather than renumbering.');
out(`delete from public.archana_items where pooja_step_id in (select id from public.pooja_steps where pooja_id = ${q(POOJA)});`);
out(`delete from public.pooja_steps where pooja_id = ${q(POOJA)};`);
out();

STEPS.forEach((s, i) => {
  const n = i + 1;
  const sc = s.deva ? scripts(s.deva) : { deva: null, ta: null, iast: null };
  out(`-- ${n}. ${s.title}`);
  out('insert into public.pooja_steps');
  out('  (pooja_id, step_number, phase, step_title_en, step_title_ta,');
  out('   instruction_en, mantra_sanskrit, mantra_tamil, mantra_translit,');
  out('   meaning_en, philosophy_en, modes, gender_rule, scripts_generated, source_ref)');
  out('values');
  out(`  (${q(POOJA)}, ${n}, ${q(s.phase)}, ${q(s.title)}, ${q(s.ta)},`);
  out(`   ${q(s.instruction)},`);
  out(`   ${q(sc.deva)},`);
  out(`   ${q(sc.ta)},`);
  out(`   ${q(sc.iast)},`);
  out(`   ${q(s.meaning)},`);
  out(`   ${q(s.philosophy)},`);
  out(`   ${arr(s.modes)}, 'all', true, ${q(SRC)});`);
  out();
  if (s.archana) {
    s.archana.forEach((a, j) => {
      const ta = transliterate(S, a.deva, 'tamil');
      const iast = transliterate(S, a.deva, 'iast');
      out('insert into public.archana_items');
      out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit)');
      out('select id, ' + (j + 1) + `, ${q(a.deva)}, ${q(ta)}, ${q(iast)}`);
      out(`  from public.pooja_steps where pooja_id = ${q(POOJA)} and step_number = ${n};`);
    });
    out();
  }
});

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)};`);
out(`  if n <> ${STEPS.length} then raise exception 'expected ${STEPS.length} steps, found %', n; end if;`);
out();
out('  -- Step numbers dense from 1, which the app relies on for the jump list.');
out('  select count(*) into n from (');
out(`    select step_number, row_number() over (order by step_number) as rn`);
out(`      from public.pooja_steps where pooja_id = ${q(POOJA)}`);
out('  ) t where t.step_number <> t.rn;');
out("  if n > 0 then raise exception '% step(s) are not numbered 1..n', n; end if;");
out();
out('  -- Every sitting is walkable end to end.');
for (const mode of ALL) {
  const cnt = STEPS.filter((s) => s.modes.includes(mode)).length;
  out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and ${q(mode)} = any(modes);`);
  out(`  if n <> ${cnt} then raise exception '${mode} has % steps, expected ${cnt}', n; end if;`);
}
out();
out('  -- The misprints are gone and the corrections are present. Asserted on the');
out('  -- stored rows, not on the generator\'s own variables.');
for (const f of FIXES) {
  out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and mantra_sanskrit like ${q('%' + f.wrong + '%')};`);
  out(`  if n > 0 then raise exception '% step(s) still carry the misprint ${f.wrong}', n; end if;`);
}
out(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)} and mantra_sanskrit like '%यो वः शिवतमो रसः%';`);
out("  if n <> 2 then raise exception 'expected 2 steps with the corrected apo hi shtha line, found %', n; end if;");
out();
out('  -- The tarpanam is twenty-one offerings, and none of them is a bare number');
out('  -- the way the nitya tarpanam shipped in 0037.');
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = 'Navagraha Deva Tarpanam';`);
out("  if n <> 21 then raise exception 'tarpanam has % offerings, expected 21', n; end if;");
out('  select count(*) into n from public.archana_items a');
out('    join public.pooja_steps s on s.id = a.pooja_step_id');
out(`   where s.pooja_id = ${q(POOJA)} and a.invoked_name_deva !~ '[ऀ-ॿ]';`);
out("  if n > 0 then raise exception '% offering(s) carry no Devanagari', n; end if;");
out();
out('  -- No Devanagari leaked into the Tamil, which is the check that caught the');
out('  -- gm nasal. Devanagari Extended included, which the original range missed.');
out('  --');
out('  -- THE DANDAS ARE STRIPPED FIRST. U+0964 and U+0965 sit inside the Devanagari');
out('  -- block, but _tamil.mjs protects them deliberately: they are shared');
out('  -- punctuation rather than letters, and every Tamil mantra in this app');
out('  -- already carries them. The first draft of this assertion did not strip');
out('  -- them and failed nine of eighteen steps over punctuation that belongs');
out('  -- there. proofread has excluded them since the visarga gate was added.');
out('  select count(*) into n from public.pooja_steps');
out(`   where pooja_id = ${q(POOJA)}`);
out("     and translate(coalesce(mantra_tamil, ''), '।॥', '') ~ '[ऀ-ॿ꣠-ꣿ]';");
out("  if n > 0 then raise exception '% Tamil mantra(s) carry Devanagari', n; end if;");
out();
out('  -- Still planned. 0049 publishes it.');
out(`  select count(*) into n from public.poojas where id = ${q(POOJA)} and status = 'planned';`);
out("  if n <> 1 then raise exception 'sandhyavandanam should still be planned until 0049'; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0048_sandhyavandanam_part_one.sql', sql);
  console.log('\nwrote supabase/migrations/0048_sandhyavandanam_part_one.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
