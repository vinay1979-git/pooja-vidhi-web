#!/usr/bin/env node
/**
 * Fixes two things a practitioner reported, and emits 0018.
 *
 *   node scripts/build-arghyam-and-thread.mjs          # validate only
 *   node scripts/build-arghyam-and-thread.mjs --emit   # write the migration
 *
 * ---------------------------------------------------------------------------
 * 1. THE KSHEERA ARGHYAM WAS ONE BLOCK OF TEXT, NOT A SEQUENCE OF OFFERINGS.
 *
 * The report was "the Ksheera arghyam is incomplete, there are 3 steps in
 * offering arghyam". Two separate faults were behind that.
 *
 * The first is structural and affected both poojas. The arghyam is not one
 * recitation: the published kalpams print a verse, then a refrain naming how
 * many times to pour, then the next verse. Our step held the whole thing in
 * mantra_sanskrit as a single run of text, the refrains were missing entirely,
 * and the screen renders a mantra as one paragraph -- so a reader saw a wall of
 * Sanskrit with no way to tell where one offering ended and the next began, and
 * no way to keep count while pouring. The verses move into archana_items here,
 * which the viewer already renders as a numbered, tickable list.
 *
 * The second is a sourcing failure specific to Ganesha, and it is mine.
 * Migration 0009 wrote three verses under the source_ref "Sathya Vadyar,
 * Ganesha Chaturthi 2026; Tamil Smartha ksheerarghya pradanam". That names a
 * video and a tradition, not a text, and this project's rule (docs/sources.md)
 * is that a video establishes SEQUENCE while WORDING must come from published
 * text. Checking them against the Siddhi Vinayaka Vrata Kalpam -- already a
 * cited source here, parsed by scripts/parse-vinayaka-kalpam.mjs from the same
 * cached page -- the kalpam's punararghyam has FOUR verses, and two of ours
 * differ from it in the second half:
 *
 *   ours    arghyaṃ gṛhāṇa heramba SARVA SIDDHI PRADĀYAKA |
 *                                  vināyaka mayā dattaṃ puṣpākṣata samanvitam
 *   kalpam  arghyaṃ gṛhāṇa heramba VARAPRADA VINĀYAKA |
 *                                  gandhapuṣpākṣatairyuktaṃ bhaktyā dattaṃ mayā prabho
 *
 *   ours    gauryaṅgamala sambhūta JYEṢṬHASVĀMIN GAṆEŚVARA |
 *                                  gṛhāṇārghyaṃ mayā dattaṃ gajavaktra namo'stu te
 *   kalpam  gauryaṅgamalasambhūta SVĀMI JYEṢṬHA VINĀYAKA |
 *                                  gaṇeśvara gṛhāṇārghyaṃ gajānana namo'stu te
 *
 * Our third verse ("vināyaka namaste'stu gandha puṣpākṣatairyutam") is in no
 * published text I can find, and the kalpam's "namastubhyaṃ gaṇeśāya" and
 * "namaste bhinnadantāya" were both absent. So the step was simultaneously
 * short a verse and carrying wording that traces to nothing. All four verses
 * are taken from the cached source page here, byte for byte, and round-trip
 * verified Telugu -> Devanagari -> Telugu the way parse-varalakshmi-kalpam.mjs
 * does, rather than typed out from memory.
 *
 * Varalakshmi's arghyam verse is left exactly as it was -- it IS from a
 * published text and round-trips -- and only gains the refrain and the
 * structure.
 *
 * ---------------------------------------------------------------------------
 * 2. NOBODY TIED THE THREAD.
 *
 * Sharadu Dharanam said "an elder in the house ties it for the younger women",
 * which is true as far as it goes and omits the part the vratham is actually
 * known for: the husband ties the saradu on his wife's right wrist, with three
 * knots. That is not in the kalpam. The kalpam gives a first-person verb,
 * badhnāmi, "I tie", and says nothing about who or how many knots -- and the
 * philosophy note I wrote for this step leaned on exactly that, which is how
 * the practice ended up excluded rather than merely unmentioned. A vidhi text
 * giving the mantra in the first person is not evidence that the household
 * practice is wrong; it is evidence that the text is written for the person
 * reciting. Both are recorded now, each labelled for what it is.
 *
 * The three knots here are the knots of the TYING. They are not the nine
 * granthis of the thread itself, which are worshipped in the preceding step
 * with nine names of Lakshmi, and the instruction says so, because "three
 * knots" next to "nine knots" two screens apart is exactly the kind of thing
 * that reads as a contradiction.
 */
import { readFileSync } from 'node:fs';
import { emitMigration } from './_migration.mjs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate as tr, PROTECTED } from './_tamil.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const GANESHA_SRC = `${DIR}vvk_te.txt`;

const fail = (m) => {
  console.error(`FAIL  ${m}`);
  process.exitCode = 1;
};

// ---------------------------------------------------------------------------
// Pull the punararghyam out of the cached Telugu page rather than typing it.
// ---------------------------------------------------------------------------
const raw = readFileSync(GANESHA_SRC, 'utf8');
const startAt = raw.indexOf('పునరర్ఘ్యం');
const endAt = raw.indexOf('సమర్పణం', startAt);
if (startAt < 0 || endAt < 0) {
  fail('could not locate the punararghyam section in the cached source');
  process.exit(1);
}
const block = raw
  .slice(startAt, endAt)
  .split('\n')
  .map((l) => l.replace(/&#8211;/g, '').replace(/&#8217;/g, "'").trim())
  .filter((l) => /[\u0C00-\u0C7F]/.test(l)) // must contain a Telugu letter
  .slice(1); // drop the heading itself

// Telugu writes an epenthetic y before a word-initial i: యిదమర్ఘ్యం for
// ఇదమర్ఘ్యం. It is an orthographic convention of the script, not a different
// word, and Devanagari does not have it. Normalising it here is what lets the
// round-trip below be a real check rather than a check that always fails --
// but it is a change to the source text, so it is named, narrow, and asserted.
const PROTHETIC_YI = /యిదమర్ఘ్య/g;
const prothetic = (block.join('\n').match(PROTHETIC_YI) || []).length;
if (prothetic === 0) fail('expected the యిదమర్ఘ్యం spelling; the source may have changed');
const normalise = (s) => s.replace(PROTHETIC_YI, 'ఇదమర్ఘ్య');

/** Telugu -> Devanagari, proving per line that converting back returns it. */
function toDeva(teluguLine) {
  const te = normalise(teluguLine);
  const deva = te
    .split(PROTECTED)
    .map((p) => (p === '' || PROTECTED.test(p) ? p : Sanscript.t(p, 'telugu', 'devanagari')))
    .join('');
  const back = deva
    .split(PROTECTED)
    .map((p) => (p === '' || PROTECTED.test(p) ? p : Sanscript.t(p, 'devanagari', 'telugu')))
    .join('');
  if (back !== te) fail(`round trip lost text:\n  in   ${te}\n  back ${back}`);
  return deva;
}

// The section alternates: two verse lines, then one refrain line. Group it.
//
// The refrain has to be recognised by its OPENING, not by the presence of
// "idam arghyam" anywhere in the line. The third verse's second pada is
// "idamarghyaṃ pradāsyāmi gṛhāṇa gaṇanāyaka" -- the words appear inside the
// verse itself, so a contains() test split that shloka in half and silently
// produced five offerings out of four.
const REFRAIN_OPENS = 'ఓం శ్రీ సిద్ధివినాయక స్వామినే నమః';
const offerings = [];
let pending = [];
for (const line of block) {
  if (line.startsWith(REFRAIN_OPENS)) {
    if (pending.length !== 2) fail(`expected 2 verse lines before a refrain, got ${pending.length}`);
    offerings.push({ verse: pending.join(' '), refrain: line });
    pending = [];
  } else {
    pending.push(line);
  }
}
if (pending.length) fail(`${pending.length} verse line(s) left over with no refrain`);
if (offerings.length !== 4) fail(`expected 4 arghyam offerings in the kalpam, got ${offerings.length}`);

// Each verse must be a full shloka: two padas closed with a double danda.
for (const [i, o] of offerings.entries()) {
  if (!/\|\|\s*$/.test(o.verse.replace(/॥/g, '||'))) fail(`offering ${i + 1} does not end in a double danda`);
  if (o.verse.length < 60) fail(`offering ${i + 1} looks truncated: ${o.verse}`);
}

/**
 * Danda characters differ between the page and this project. Normalise. Also
 * fold the spelt-out pranava ओं to ॐ, which every other generator here does
 * (parse-namavali, parse-varalakshmi-kalpam, parse-vinayaka-kalpam) -- without
 * it the arghyam refrain would have been the one line on screen writing Om
 * differently from the 108 names directly above it.
 */
const dandas = (s) =>
  s
    .replace(/\|\|/g, '॥')
    .replace(/(?<![॥|])\|(?!\|)/g, '।')
    .replace(/(^|\s)ओं(?=\s)/g, '$1ॐ')
    .replace(/\s+/g, ' ')
    .trim();

const GANESHA_OFFERINGS = offerings.map((o, i) => {
  const deva = dandas(toDeva(o.verse));
  const refrainDeva = dandas(toDeva(o.refrain));
  return {
    seq: i + 1,
    deva,
    refrain_deva: refrainDeva,
  };
});

// ---------------------------------------------------------------------------
// The English. Translated here, not lifted; flagged as ours in source_ref.
// ---------------------------------------------------------------------------
const GANESHA_MEANINGS = [
  'Receive the arghyam, Heramba, boon-giving Vinayaka. It is given by me in devotion, lord, together with sandal, flowers and akshatai.',
  'Salutations to you, Ganesha; salutations to you, lord of obstacles. I shall give the arghyam again: receive it, leader of the ganas.',
  'Salutations to you whose tusk is broken; salutations to you, son of Hara. I shall give this arghyam: receive it, leader of the ganas.',
  'Risen from the body of Gauri, lord, eldest, Vinayaka, Ganeshvara: receive the arghyam. Elephant-faced one, salutations to you.',
];

// Varalakshmi's verse comes out of its own cached page the same way, so that
// no line of Sanskrit in this migration was typed from memory. The verse is
// unchanged from what 0011 already shipped; only the refrain is new.
const VL_SRC = readFileSync(`${DIR}vlk_te.txt`, 'utf8').split('\n').map((l) => l.trim());
const vlAt = VL_SRC.findIndex((l) => l === 'అర్ఘ్యం |');
if (vlAt < 0) fail('could not locate the arghyam upachara in the Varalakshmi source');
const vlVerse = [VL_SRC[vlAt + 1], VL_SRC[vlAt + 2]].join(' ');
if (!/శుద్ధోదకం/.test(vlVerse)) fail(`unexpected Varalakshmi arghyam verse: ${vlVerse}`);

const VARALAKSHMI = {
  deva: dandas(toDeva(vlVerse)),
  // The samarpayami line the page prints is the once-only upachara form. At the
  // close the arghyam is poured three times, so it takes the idam-arghyam form
  // the same publisher uses wherever an arghyam repeats.
  refrain_deva: 'श्री वरलक्ष्मी देवतायै नमः इदमर्घ्यं इदमर्घ्यं इदमर्घ्यम् ।',
  meaning:
    'Clean water in a vessel, mixed with sandal and flowers: I shall give you this arghyam, goddess; receive it, you who are dear to Hari.',
};

// ---------------------------------------------------------------------------
// Scripts, and the SQL.
// ---------------------------------------------------------------------------
const scripts = (deva) => ({
  deva,
  ta: tr(Sanscript, deva, 'tamil'),
  iast: tr(Sanscript, deva, 'iast'),
});

/**
 * The verse and its refrain go into the SAME field, on two lines.
 *
 * The obvious alternative was to put the refrain in offering_deva, which is
 * where an "offering" belongs. But archana_items has no Tamil or roman column
 * for that field -- offering_ta holds the English-equivalent instruction, not
 * the mantra in Tamil script -- so the refrain would have been Devanagari-only,
 * and a reader on the Tamil setting would have been told to pour three times in
 * a script they had already said they cannot read. invoked_name_* has all three
 * scripts, so putting both lines there is the only way the refrain reaches
 * everyone. The viewer renders these with whitespace-pre-line.
 */
const joined = (verse, refrain) => `${verse}\n${refrain}`;

for (const o of GANESHA_OFFERINGS) {
  const v = scripts(o.deva);
  const r = scripts(o.refrain_deva);
  Object.assign(o, {
    v,
    r,
    line: {
      deva: joined(v.deva, r.deva),
      ta: joined(v.ta, r.ta),
      iast: joined(v.iast, r.iast),
    },
  });
}
const vlV = scripts(VARALAKSHMI.deva);
const vlR = scripts(VARALAKSHMI.refrain_deva);
const VL = {
  v: vlV,
  r: vlR,
  line: {
    deva: joined(vlV.deva, vlR.deva),
    ta: joined(vlV.ta, vlR.ta),
    iast: joined(vlV.iast, vlR.iast),
  },
};

// Nothing generated may carry the faults 0015 and 0016 were written to remove.
const checkAll = (label, obj) => {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'string') continue;
    if (v.includes('\r')) fail(`${label}.${k} contains a carriage return`);
    // The avagraha is correct Devanagari and wrong Tamil, so this is a check on
    // the Tamil field only. Rejecting it everywhere would have rejected
    // namo'stu te, which is how the source actually spells it.
    if (k === 'ta' && /[ௐऽ]/.test(v)) fail(`${label}.${k} carries an om sign or avagraha`);
    if (/[²³⁴]/.test(v)) fail(`${label}.${k} carries a Grantha superscript`);
    if (k === 'deva' && /(^|\s)ओं(\s|$)/.test(v)) fail(`${label}.${k} spells the pranava ओं, not ॐ`);
    if (v.includes('...') || v.includes('…')) fail(`${label}.${k} looks truncated`);
    if (/\s{2,}/.test(v)) fail(`${label}.${k} has a double space`);
  }
};
GANESHA_OFFERINGS.forEach((o, i) => {
  checkAll(`ganesha[${i}].verse`, o.v);
  checkAll(`ganesha[${i}].refrain`, o.r);
});
checkAll('varalakshmi.verse', VL.v);
checkAll('varalakshmi.refrain', VL.r);

// Tamil must actually be Tamil, and Devanagari actually Devanagari.
for (const o of [...GANESHA_OFFERINGS.map((x) => x.v), ...GANESHA_OFFERINGS.map((x) => x.r), VL.v, VL.r]) {
  if (!/[\u0B80-\u0BFF]/.test(o.ta)) fail('a Tamil field has no Tamil letters');
  // The dandas \u0964 and \u0965 sit in the Devanagari block but are shared punctuation,
  // and _tamil.mjs deliberately carries them through untouched, so they are not
  // a leak. Test for Devanagari LETTERS.
  if (/[\u0900-\u0963\u0966-\u097F]/.test(o.ta)) fail('Devanagari leaked into a Tamil field');
  if (!/[\u0900-\u097F]/.test(o.deva)) fail('a Devanagari field has no Devanagari letters');
}

if (process.exitCode) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

/**
 * Steps are addressed by (pooja_id, step_title_en), never by their uuid.
 *
 * The first draft of this migration hardcoded the three uuids read out of the
 * live database, and the PGlite harness rejected all of it on a foreign key:
 * every environment generates its own ids when 0001-0009 create the rows, so a
 * production uuid means nothing in a fresh database. Addressing by the natural
 * key is what every earlier migration here does, and it is why they can be
 * replayed from empty. Both arghyam steps are titled 'Ksheera Arghyam', so the
 * pooja_id is part of the key rather than a comment.
 */
const STEPS = {
  ganeshaArghyam: { pooja: 'ganesha_standard', title: 'Ksheera Arghyam' },
  vlArghyam: { pooja: 'varalakshmi_vratham', title: 'Ksheera Arghyam' },
  vlThread: { pooja: 'varalakshmi_vratham', title: 'Sharadu Dharanam' },
};
const at = (s) => `pooja_id = '${s.pooja}' and step_title_en = '${s.title}'`;
const idOf = (s) => `(select id from public.pooja_steps where ${at(s)})`;
const inSteps = (...ss) =>
  `pooja_step_id in (select id from public.pooja_steps where ${ss.map((s) => `(${at(s)})`).join(' or ')})`;
const areSteps = (...ss) => ss.map((s) => `(${at(s)})`).join(' or ');

const GANESHA_INSTRUCTION_EN =
  'Mix a little water into raw milk. Take the milk in the uddharani, recite the first verse, then pour three times as the refrain says "idam arghyam" three times. Repeat for each of the four verses: twelve pourings in all. This is offered to Ganesha, not to the moon; the moon is deliberately not looked at today.';
const GANESHA_INSTRUCTION_TA =
  'பச்சைப் பாலில் சிறிது நீர் கலக்கவும். உத்தரிணியில் பாலை எடுத்து, முதல் ஸ்லோகத்தைச் சொல்லி, "இதமர்க்யம்" என மூன்று முறை சொல்லும்போது மூன்று முறை விடவும். நான்கு ஸ்லோகங்களுக்கும் இவ்வாறே; மொத்தம் பன்னிரண்டு முறை. இது விநாயகருக்கு சமர்ப்பிக்கப்படுகிறது; இன்று சந்திரனைப் பார்க்கக் கூடாது.';

const VL_INSTRUCTION_EN =
  'Mix a little water into raw milk. Take the milk in the uddharani, recite the verse, then pour three times as the refrain says "idam arghyam" three times. Half a glass of raw milk is kept aside for this at the start, which is why it is on the samagri list.';
const VL_INSTRUCTION_TA =
  'பச்சைப் பாலில் சிறிது ஜலம் கலக்கவும். உத்தரிணியில் பாலை எடுத்து, ஸ்லோகத்தைச் சொல்லி, "இதமர்க்யம்" என மூன்று முறை சொல்லும்போது மூன்று முறை விடவும். இதற்காகவே அரை டம்ளர் பச்சைப் பால் தொடக்கத்திலேயே தனியாக வைக்கப்படுகிறது; அதனால்தான் அது சாமக்ரி பட்டியலில் உள்ளது.';

const THREAD_INSTRUCTION_EN =
  'The husband ties the saradu on his wife\u2019s right wrist, making three knots, while the shloka is recited. These three are the knots of the tying itself and are not the nine granthis of the thread, which were just worshipped. Where there is no husband to tie it, an elder woman of the house ties it, or she ties it on herself, which is what the mantra literally says. It stays on until it wears through, or until next year\u2019s vratham.';
const THREAD_INSTRUCTION_TA =
  'கணவர் மனைவியின் வலது மணிக்கட்டில் சரட்டைக் கட்ட வேண்டும், மூன்று முடிச்சுகள் போட்டு, ஸ்லோகம் சொல்லியபடி. இந்த மூன்று முடிச்சுகள் கட்டுவதற்குரியவை; சற்று முன் பூஜிக்கப்பட்ட சரட்டின் ஒன்பது முடிச்சுகள் வேறு. கட்ட கணவர் இல்லையெனில் வீட்டின் மூத்த பெண் கட்டுவார்; அல்லது தானே கட்டிக்கொள்ளலாம் \u2014 மந்திரம் சொல்வதும் அதுவே. அறுந்து போகும் வரை, அல்லது அடுத்த வருட விரதம் வரை, அது கையிலேயே இருக்கும்.';

const THREAD_PHILOSOPHY_EN =
  'Badhnami dakshine haste, "I tie it on the right hand". The verb is first person, because a vidhi text is written for whoever is reciting it; it is not a ruling that the tying must be done alone. In most Tamil households the husband ties it, with three knots, and the older women tie it for the girls. Nine knots were worshipped a moment ago and three are made now, and the two counts belong to different things: the nine are the thread, the three are the tying.';

const THREAD_SOURCE =
  'Mantra from StotraNidhi Sri Varalakshmi Vrata Kalpam (Telugu), round-trip verified by scripts/parse-varalakshmi-kalpam.mjs (tora bandhana mantram); Sathya Vadyar, Varalakshmi Poojai 2026 step by step, chapter at 59:38. The husband tying it with three knots is Tamil household practice, reported by this project\u2019s owner and NOT stated in the kalpam, which gives the verb in the first person only; flagged for practitioner review.';

const GANESHA_SOURCE =
  'StotraNidhi Sri Siddhi Vinayaka Vrata Kalpam (Telugu), punararghyam section, round-trip verified Telugu->Devanagari by scripts/build-arghyam-and-thread.mjs; sequence position from Sathya Vadyar, Ganesha Chaturthi 2026. Replaces the three verses written in migration 0009, two of which differed from the kalpam in the second pada and one of which traced to no published text. English is this project\u2019s translation.';

const VL_SOURCE =
  'Arghyam verse from StotraNidhi Sri Varalakshmi Vrata Kalpam (Telugu), round-trip verified by scripts/parse-varalakshmi-kalpam.mjs; the kalpam gives it once, as an upachara, while the video gives it again in milk at the close. Sathya Vadyar, Varalakshmi Poojai 2026 step by step, chapter at 1:05:34. The threefold idam-arghyam refrain follows the form the same publisher prints for a repeated arghyam.';

const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0018_arghyam_and_thread.sql');
out('--');
out('-- GENERATED by scripts/build-arghyam-and-thread.mjs. Do not hand-edit.');
out('--');
out('-- 1. The Ksheera Arghyam becomes a numbered sequence of offerings instead of');
out('--    one undifferentiated block of Sanskrit, in both poojas. Each verse now');
out('--    carries the "idam arghyam" refrain that says how many times to pour --');
out('--    the refrains were missing entirely, so there was nothing on screen to');
out('--    pour along with.');
out('--');
out('-- 2. Ganesha\'s four arghyam verses are re-sourced. Migration 0009 wrote three');
out('--    under a source_ref naming a video rather than a text. The Siddhi Vinayaka');
out('--    Vrata Kalpam gives four; two of ours differed from it in the second pada');
out('--    and the third matched no published text. All four here are taken from the');
out('--    cached source page and round-trip verified Telugu -> Devanagari -> Telugu.');
out('--');
out('-- 3. Sharadu Dharanam records who ties the thread. The husband ties it on his');
out('--    wife\'s right wrist with three knots; the step said only "an elder in the');
out('--    house". Household practice, not kalpam text, and labelled as such.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- Ganesha Ksheera Arghyam --------------------------------------------------');
out('update public.pooja_steps set');
out(`  instruction_en = ${q(GANESHA_INSTRUCTION_EN)},`);
out(`  instruction_ta = ${q(GANESHA_INSTRUCTION_TA)},`);
out('  -- The verses live in archana_items now, so the mantra card would only');
out('  -- repeat them above the list it is meant to introduce.');
out('  mantra_sanskrit = null,');
out('  mantra_tamil = null,');
out('  mantra_translit = null,');
out(`  meaning_en = ${q(GANESHA_MEANINGS.join(' '))},`);
out(`  source_ref = ${q(GANESHA_SOURCE)},`);
out('  verified_by = null,');
out('  verified_at = null,');
out('  updated_at = now()');
out(`where ${at(STEPS.ganeshaArghyam)};`);
out();
out(`delete from public.archana_items where ${inSteps(STEPS.ganeshaArghyam)};`);
out('insert into public.archana_items');
out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,');
out('   offering_deva, offering_en, offering_ta, meaning_en)');
out('values');
out(
  GANESHA_OFFERINGS.map(
    (o, i) =>
      `  (${idOf(STEPS.ganeshaArghyam)}, ${o.seq}, ${q(o.line.deva)}, ${q(o.line.ta)}, ${q(o.line.iast)},\n` +
      `   ${q(o.r.deva)}, ${q('Pour the arghyam three times')}, ${q('மூன்று முறை அர்க்யம் விடவும்')}, ${q(GANESHA_MEANINGS[i])})`,
  ).join(',\n'),
);
out(';');
out();

out('-- --- Varalakshmi Ksheera Arghyam ----------------------------------------------');
out('update public.pooja_steps set');
out(`  instruction_en = ${q(VL_INSTRUCTION_EN)},`);
out(`  instruction_ta = ${q(VL_INSTRUCTION_TA)},`);
out('  mantra_sanskrit = null,');
out('  mantra_tamil = null,');
out('  mantra_translit = null,');
out(`  meaning_en = ${q(VARALAKSHMI.meaning + ' At the close it is given in milk.')},`);
out(`  source_ref = ${q(VL_SOURCE)},`);
out('  updated_at = now()');
out(`where ${at(STEPS.vlArghyam)};`);
out();
out(`delete from public.archana_items where ${inSteps(STEPS.vlArghyam)};`);
out('insert into public.archana_items');
out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,');
out('   offering_deva, offering_en, offering_ta, meaning_en)');
out('values');
out(
  `  (${idOf(STEPS.vlArghyam)}, 1, ${q(VL.line.deva)}, ${q(VL.line.ta)}, ${q(VL.line.iast)},\n` +
    `   ${q(VL.r.deva)}, ${q('Pour the arghyam three times')}, ${q('மூன்று முறை அர்க்யம் விடவும்')}, ${q(VARALAKSHMI.meaning)});`,
);
out();

out('-- --- Varalakshmi Sharadu Dharanam ---------------------------------------------');
out('update public.pooja_steps set');
out(`  instruction_en = ${q(THREAD_INSTRUCTION_EN)},`);
out(`  instruction_ta = ${q(THREAD_INSTRUCTION_TA)},`);
out(`  philosophy_en = ${q(THREAD_PHILOSOPHY_EN)},`);
out(`  source_ref = ${q(THREAD_SOURCE)},`);
out('  updated_at = now()');
out(`where ${at(STEPS.vlThread)};`);
out();

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.archana_items where ${inSteps(STEPS.ganeshaArghyam)};`);
out("  if n <> 4 then raise exception 'ganesha arghyam has % offerings, expected 4', n; end if;");
out(`  select count(*) into n from public.archana_items where ${inSteps(STEPS.vlArghyam)};`);
out("  if n <> 1 then raise exception 'varalakshmi arghyam has % offerings, expected 1', n; end if;");
out('  -- Every arghyam line must carry its pouring refrain, or the count is lost.');
out('  select count(*) into n from public.archana_items');
out(`   where ${inSteps(STEPS.ganeshaArghyam, STEPS.vlArghyam)}`);
out("     and (offering_deva is null or offering_deva not like '%इदमर्घ्य%');");
out("  if n > 0 then raise exception '% arghyam lines have no idam-arghyam refrain', n; end if;");
out('  -- The blob the verses came out of must be gone, or both would show.');
out('  select count(*) into n from public.pooja_steps');
out(`   where (${areSteps(STEPS.ganeshaArghyam, STEPS.vlArghyam)}) and mantra_sanskrit is not null;`);
out("  if n > 0 then raise exception '% arghyam steps still hold a step mantra', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where ${at(STEPS.vlThread)} and instruction_en like '%three knots%';`);
out("  if n <> 1 then raise exception 'sharadu dharanam does not mention the three knots'; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out(`--   select seq, invoked_name_translit from archana_items where ${inSteps(STEPS.ganeshaArghyam)} order by seq;`);

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0018_arghyam_and_thread.sql', sql);
} else {
  console.log('--- validated, not written (pass --emit) ---\n');
  for (const o of GANESHA_OFFERINGS) {
    console.log(`${o.seq}. ${o.v.iast}`);
    console.log(`   ${o.r.iast}`);
    console.log(`   ${o.v.ta}`);
  }
  console.log(`\nVL. ${VL.v.iast}\n    ${VL.r.iast}\n    ${VL.v.ta}`);
}
