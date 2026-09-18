#!/usr/bin/env node
/**
 * Replaces the placeholder one-liners on the offering steps, and gives the
 * Naivedyam the frame a Smartha naivedyam actually has. Emits 0019.
 *
 *   node scripts/build-upachara-mantras.mjs          # validate only
 *   node scripts/build-upachara-mantras.mjs --emit   # write the migration
 *
 * ---------------------------------------------------------------------------
 * WHAT WAS WRONG
 *
 * Reported as "naivedyam, karpura neeranjanam etc - single mantra is written
 * that is wrong". It is, and it is not two steps. Sixteen of Ganesha's
 * twenty-four steps still carried source_ref 'Tamil draft, pending vaidika
 * review' -- the original app's placeholder content, never replaced, because
 * every migration since has gone after the enumerated archanas and the
 * arghyam and left the plain upacharas alone. The worst of them:
 *
 *   Karpura Neerajanam       'karpūra nīrājanaṃ santataṃ darśayāmi'   38 chars
 *   Mantra Pushpam &         one pradakshina verse standing in for the
 *     Namaskaram             mantrapushpam, the pradakshina, the sashtanga
 *                            namaskaram AND the prarthana
 *   Dhoopam & Deepam         three samarpayami tags, no verse at all
 *   Naivedyam                the five pranas and nothing else
 *
 * The Naivedyam is the one worth spelling out. A Smartha naivedyam is not a
 * verse, it is a sequence: the vyahritis and the Gayatri, then water sprinkled
 * around the food (satyaṃ tvā ṛtena pariṣiñcāmi), then water offered as the
 * bed beneath the nectar (amṛtopastaraṇamasi), then the five breaths fed one
 * by one, THEN the naming of what is offered, then water as the cover over it
 * (amṛtāpidhānamasi) and the hands and mouth rinsed. Ours had step four of
 * eight. Varalakshmi's had four and five, from its kalpam, and none of the
 * frame.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE TEXT COMES FROM, AND THE ONE SEAM IN IT
 *
 * Two published sources, joined at a seam that is real rather than convenient:
 *
 *   the deity's own verses  -> Sri Siddhi Vinayaka Vrata Kalpam (Telugu),
 *                              the same cached page 0012 and 0018 used
 *   the naivedyam frame     -> Sri Maha Ganapathi Shodashopachara Puja
 *                              (IAST), stotranidhi.com
 *
 * The frame is generic: it is the same in the Ganapati vidhanam, in the
 * Purusha Sukta vidhanam, and in every Smartha paddhati, because it belongs to
 * the act of feeding rather than to the deity. So the deity-specific verse
 * comes from the vrata kalpam and the frame from the vidhanam, and BOTH
 * poojas get the same frame. That is the composition model this project
 * already uses for the purvangam, applied to an upachara.
 *
 * THE ORDER IS NOT THE PAGE'S. StotraNidhi prints the verse and its
 * samarpayami first and the frame after it. Practice -- and the report that
 * prompted this -- puts the frame first and names the offering last, which is
 * also the only order in which the water-below / feed / water-above sequence
 * means anything. The order here follows practice; source_ref says so.
 *
 * deva savitaḥ prasuva is in neither published page. It is genuinely part of
 * the Apastamba prayoga and it is what the owner recites, so it is included
 * and flagged in source_ref exactly as the three knots were, rather than
 * silently added or silently dropped.
 *
 * SVARA IS STRIPPED. The vyahritis, the Gayatri and the prana mantras are
 * printed with accent marks. docs/sources.md previously said accented Vedic
 * mantras would be omitted rather than shown unaccented -- that rule was
 * written when the choice was whether to ADD them. It is not a reason to ship
 * a naivedyam with no Gayatri in it. They are shown unaccented, the
 * instruction says they carry svara, and rendering svara stays an open
 * feature.
 */
import { emitMigration } from './_migration.mjs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate as tr } from './_tamil.mjs';
import {
  loadRoman, loadTelugu, section as sectionOf, teluguToDeva, iastToDeva, normalise, checkScripts,
} from './_sources.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const KALPAM = `${DIR}vvk_te.txt`;
const VIDHANAM = process.env.GANAPATI_VIDHANAM || 'C:/Users/vinay/AppData/Local/Temp/claude/mg_en.txt';

const fail = (m) => {
  console.error(`FAIL  ${m}`);
  process.exitCode = 1;
};

// ---------------------------------------------------------------------------
// The two cached pages. The readers, the round-trip proofs and the fault-class
// checks all live in _sources.mjs now: a second generator needed them, and this
// project has already paid for letting one routine exist in several copies.
// ---------------------------------------------------------------------------
const kalpamLines = loadTelugu(KALPAM);
const vidhanamLines = loadRoman(VIDHANAM);

const section = (name) => sectionOf(kalpamLines, name, { script: 'telugu', fail });
const toDeva = (line) => teluguToDeva(Sanscript, line, fail);
const toDevaFromIast = (line) => iastToDeva(Sanscript, line, fail);

const frameAt = vidhanamLines.findIndex((l) => l.startsWith('oṃ bhūrbhuvassuva'));
if (frameAt < 0) fail('the naivedyam frame was not found in the vidhanam');
// Exactly 12 lines. Thirteen swallowed the "tāmbūlam" heading that follows the
// frame on the page, and it rode all the way into the naivedyam mantra as a
// bare word between the rinsing and the betel verse.
const frameRaw = vidhanamLines.slice(frameAt, frameAt + 12);

const want = [
  'oṃ bhūrbhuvassuva',
  'dhiyo yo na',
  'satyaṃ tvā ṛtena',
  '(sāyaṅkāle',
  'amṛtamastu',
  'oṃ prāṇāya',
  'oṃ vyānāya',
  'oṃ samānāya',
  'madhye madhye',
  'amṛtāpidhānamasi',
  'hastau prakṣālayāmi',
  'śuddhācamanīyaṃ',
];
for (const [i, w] of want.entries()) {
  if (!frameRaw[i] || !frameRaw[i].startsWith(w)) {
    fail(`frame line ${i} should start "${w}", got "${frameRaw[i] ?? '(missing)'}"`);
  }
}

// The evening variant is a parenthetical alternative, not something to chant.
// It belongs in the instruction, not in the middle of the mantra.
const frame = frameRaw.filter((l) => !l.startsWith('(sāyaṅkāle'));

// Nothing in the frame may be a section heading from the page around it. This
// is the check that would have caught "tāmbūlam" landing inside the mantra.
const HEADINGS = /^(tāmbūlam|nīrājanam|dhūpam|dīpam|naivedyam|mantrapuṣpam|pradakṣiṇam|namaskāram|sarvopacārāḥ)$/;
for (const l of frame) if (HEADINGS.test(l)) fail(`the page heading "${l}" was captured as part of the frame`);

// ---------------------------------------------------------------------------
// Assemble. `D` marks text already in Devanagari.
// ---------------------------------------------------------------------------
const joinDeva = (lines) => lines.join('\n');
// Was a local copy of exactly this. It is normalise() in _sources.mjs now.
const dandas = normalise;

const kalpamDeva = (name) => section(name).map((l) => dandas(toDeva(l)));
const vidhanamDeva = (lines) => lines.map((l) => dandas(toDevaFromIast(l)));

// deva savitaḥ prasuva -- see the header. Not on either published page.
const OWNER_LINE = dandas(toDevaFromIast('deva savitaḥ prasuva |'));

const FRAME = vidhanamDeva(frame);
// Split the frame at the point the offering is named: everything before goes
// above the deity's verse, everything after goes below it.
const cutAt = FRAME.findIndex((l) => l.includes('मध्ये मध्ये'));
if (cutAt < 0) fail('could not find "madhye madhye" to split the frame');
const FRAME_BEFORE = [...FRAME.slice(0, 2), OWNER_LINE, ...FRAME.slice(2, cutAt)];
const FRAME_AFTER = FRAME.slice(cutAt);

const STEPS = [];

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Dhoopam & Deepam',
  deva: joinDeva([...kalpamDeva('ధూపం'), ...kalpamDeva('దీపం'), 'धूप दीप अनंतरं आचमनीयं समर्पयामि ।']),
  instruction_en:
    'Light the incense and circle it before the deity, ringing the bell, then show the lit lamp the same way. Offer a spoon of water after both.',
  instruction_ta:
    'தூபத்தை ஏற்றி, மணி அடித்தபடி, சுவாமியின் முன் சுழற்றவும்; பின் ஏற்றிய தீபத்தையும் அவ்வாறே காட்டவும். இரண்டுக்குப் பின்னும் ஒரு உத்தரிணி ஜலம் விடவும்.',
  source: 'KALPAM',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Naivedyam',
  newTitle: 'Naivedyam & Tambulam',
  deva: joinDeva([
    ...FRAME_BEFORE,
    ...kalpamDeva('నైవేద్యం'),
    ...FRAME_AFTER,
    ...kalpamDeva('తాంబూలం'),
  ]),
  instruction_en:
    'Place the naivedyam in front of the deity. Say the vyahritis and the Gayatri, then sprinkle water around the plate in a circle. Offer a spoon of water as the bed beneath the food, then feed the five breaths one at a time, moving the right hand towards the deity at each. Only then name what is being offered. Water again as the cover over it, then the hands and the mouth rinsed, then the betel leaf and areca nut. Nothing is tasted before this step. In an evening pooja the sprinkling line is said the other way round: ritaṃ tvā satyena pariṣiñcāmi.',
  instruction_ta:
    'நைவேத்தியத்தை சுவாமியின் முன் வைக்கவும். வ்யாஹ்ருதிகளையும் காயத்ரியையும் சொல்லி, தட்டைச் சுற்றி ஜலம் தெளிக்கவும். உணவின் அடியில் விரிப்பாக ஒரு உத்தரிணி ஜலம் விடவும்; பின் ஐந்து ப்ராணன்களுக்கும் ஒவ்வொன்றாக, ஒவ்வொரு முறையும் வலது கையை சுவாமியை நோக்கி நகர்த்தி, சமர்ப்பிக்கவும். அதன் பிறகுதான் என்ன படைக்கப்படுகிறது என்று சொல்ல வேண்டும். மீண்டும் ஜலம் மூடியாக, பின் கை கழுவுதல், வாய் கொப்பளித்தல், பிறகு தாம்பூலம். இதற்கு முன் எதையும் ருசி பார்க்கக் கூடாது. மாலைப் பூஜையில் தெளிக்கும் வரி மாறி வரும்: ருதம் த்வா ஸத்யேந பரிஷிஞ்சாமி.',
  source: 'BOTH',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Karpura Neerajanam',
  // No achamaniyam appended: the kalpam's nirajanam section already ends with
  // "nirajananantaram achamaniyam samarpayami", and adding one printed it twice.
  deva: joinDeva(kalpamDeva('నీరాజనం')),
  instruction_en:
    'Stand. Light the camphor and circle it clockwise before the deity, at the feet, then the middle, then the face, ringing the bell with the left hand. Offer a spoon of water after. This is the point the rest of the house is called in.',
  instruction_ta:
    'எழுந்து நிற்கவும். கற்பூரத்தை ஏற்றி, இடது கையால் மணி அடித்தபடி, சுவாமியின் முன் வலமாகச் சுழற்றவும் — பாதம், பின் இடை, பின் திருமுகம். பிறகு ஒரு உத்தரிணி ஜலம் விடவும். வீட்டில் உள்ள மற்றவர்களை அழைக்க வேண்டிய இடம் இதுவே.',
  source: 'KALPAM',
});

STEPS.push({
  pooja: 'ganesha_standard',
  title: 'Mantra Pushpam & Namaskaram',
  deva: joinDeva([
    ...kalpamDeva('మంత్రపుష్పం'),
    ...kalpamDeva('ప్రదక్షిణం'),
    ...kalpamDeva('సాష్టాంగ నమస్కారం'),
    ...kalpamDeva('ప్రార్థన'),
  ]),
  instruction_en:
    'Hold flowers in both cupped palms, recite, and offer them at the feet. Then turn clockwise in place three times for the pradakshina, prostrate full length, and finish with the prarthana.',
  instruction_ta:
    'இரு கைகளிலும் புஷ்பங்களை ஏந்தி, ஸ்லோகம் சொல்லி, திருவடிகளில் சமர்ப்பிக்கவும். பின் நின்ற இடத்திலேயே வலமாக மூன்று முறை சுற்றி பிரதக்ஷிணம் செய்து, சாஷ்டாங்கமாக நமஸ்கரித்து, பிரார்த்தனையுடன் முடிக்கவும்.',
  source: 'KALPAM',
});

STEPS.push({
  pooja: 'varalakshmi_vratham',
  title: 'Naivedyam, Paniyam & Tambulam',
  // Varalakshmi's own verses are already right and round-trip; they keep their
  // place and only gain the frame around them.
  vlKeep: true,
  instruction_en:
    'Place the food in front. Say the vyahritis and the Gayatri, then sprinkle water around the plate in a circle. Offer a spoon of water as the bed beneath it, then feed the five breaths one at a time. Only then name what is offered, then the water to drink and the betel leaf. Water again as the cover, then the hands and the mouth rinsed. Cover the food while reciting, and do not taste anything before this step. In an evening pooja the sprinkling line is said the other way round: ritaṃ tvā satyena pariṣiñcāmi.',
  instruction_ta:
    'உணவை முன்னால் வைக்கவும். வ்யாஹ்ருதிகளையும் காயத்ரியையும் சொல்லி, தட்டைச் சுற்றி ஜலம் தெளிக்கவும். அடியில் விரிப்பாக ஒரு உத்தரிணி ஜலம் விட்டு, ஐந்து ப்ராணன்களுக்கும் ஒவ்வொன்றாகச் சமர்ப்பிக்கவும். அதன் பிறகுதான் படைப்பதைச் சொல்ல வேண்டும்; பின் பானீயமும் தாம்பூலமும். மீண்டும் ஜலம் மூடியாக, பின் கை கழுவுதல், வாய் கொப்பளித்தல். ஸ்லோகம் சொல்லும்போது உணவை மூடி வைக்கவும்; இதற்கு முன் எதையும் ருசி பார்க்கக் கூடாது. மாலைப் பூஜையில் தெளிக்கும் வரி மாறி வரும்: ருதம் த்வா ஸத்யேந பரிஷிஞ்சாமி.',
  source: 'BOTH',
});

// ---------------------------------------------------------------------------
// Scripts and checks.
// ---------------------------------------------------------------------------
const scripts = (deva) => ({
  deva,
  ta: tr(Sanscript, deva, 'tamil'),
  iast: tr(Sanscript, deva, 'iast'),
});

for (const s of STEPS) {
  if (s.vlKeep) continue;
  s.s = scripts(s.deva);
}

// The fault-class checks are shared too; see _sources.mjs.
const checkAll = (label, o) => checkScripts(label, o, fail);
for (const s of STEPS) if (s.s) checkAll(`${s.pooja}/${s.title}`, s.s);

// The whole point of the change: these must be real sequences, not one line.
for (const s of STEPS) {
  if (!s.s) continue;
  const lines = s.deva.split('\n').length;
  if (lines < 3) fail(`${s.pooja}/${s.title} is only ${lines} line(s); it is meant to be a sequence`);
}
const naiv = STEPS.find((s) => s.title === 'Naivedyam');
for (const must of ['भूर्भुवस्सुवः', 'प्रचोदयात्', 'परिषिञ्चामि', 'अमृतोपस्तरणमसि', 'प्राणाय स्वाहा', 'समानाय स्वाहा', 'अमृतापिधानमसि', 'उत्तरापोशनं', 'प्रसुव']) {
  if (!naiv.deva.includes(must)) fail(`the Ganesha naivedyam frame is missing "${must}"`);
}
// The naming of the offering must sit BETWEEN the breaths and the covering.
const iPrana = naiv.deva.indexOf('समानाय स्वाहा');
const iName = naiv.deva.indexOf('नैवेद्यं समर्पयामि');
const iCover = naiv.deva.indexOf('अमृतापिधानमसि');
if (!(iPrana < iName && iName < iCover)) fail('the naivedyam is not in the order breaths -> naming -> covering');

if (process.exitCode) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SQL.
// ---------------------------------------------------------------------------
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

const SRC = {
  // Careful with the wording: an earlier draft of this string quoted the old
  // placeholder source_ref verbatim, which made the new source_ref itself match
  // the gate that looks for survivors of it, and three correctly-updated steps
  // failed the migration. Describe the placeholder, do not quote it.
  KALPAM:
    'StotraNidhi Sri Siddhi Vinayaka Vrata Kalpam (Telugu), round-trip verified Telugu->Devanagari by scripts/build-upachara-mantras.mjs. Replaces the one-line placeholder this step carried from the original app, which cited no text at all.',
  BOTH:
    'Deity verses from the vrata kalpam (Telugu, round-trip verified). The naivedyam frame -- vyahritis, Gayatri, satyam tva rtena parishinchami, amritopastaranam, the five pranas, amritapidhanam and the rinsings -- from StotraNidhi Sri Maha Ganapathi Shodashopachara Puja (IAST, round-trip verified), which is generic to any Smartha naivedyam and so is used in both poojas. ORDER FOLLOWS PRACTICE, NOT THE PAGE: StotraNidhi prints the verse and its samarpayami before the frame; here the frame comes first and the offering is named after the five breaths, as reported by this project\u2019s owner. "deva savitah prasuva" is in NEITHER published page; it is Apastamba prayoga and the owner\u2019s practice, included on that basis and flagged for practitioner review. Svara marks are stripped: the vyahritis, the Gayatri and the prana mantras carry accents in print and this app does not render them yet.',
};

const at = (p, t) => `pooja_id = '${p}' and step_title_en = '${t}'`;
/** Matches before OR after a rename, so the migration can be replayed. */
const atEither = (p, t, t2) =>
  t2 ? `pooja_id = '${p}' and step_title_en in ('${t}', '${t2}')` : at(p, t);

const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0019_upachara_mantras.sql');
out('--');
out('-- GENERATED by scripts/build-upachara-mantras.mjs. Do not hand-edit.');
out('--');
out('-- The offering steps carried placeholder one-liners from the original app,');
out('-- still tagged "Tamil draft, pending vaidika review". Karpura Neerajanam was');
out('-- 38 characters. Mantra Pushpam & Namaskaram was a single pradakshina verse');
out('-- standing in for four sections. Dhoopam & Deepam had no verse at all.');
out('--');
out('-- The Naivedyam is the substantive one. A Smartha naivedyam is a sequence --');
out('-- vyahritis and Gayatri, water sprinkled around, water as the bed beneath,');
out('-- the five breaths fed one by one, THEN the naming of what is offered, then');
out('-- water as the cover and the hands and mouth rinsed. Ganesha had the five');
out('-- breaths and nothing else; Varalakshmi had its verses and none of the frame.');
out('-- Both get the full frame here, from the published Ganapati vidhanam, because');
out('-- the frame belongs to the act of feeding rather than to the deity.');
out('--');
out('-- Ganesha gains a tambulam, which it did not have anywhere; the step is');
out('-- renamed Naivedyam & Tambulam to match, as Varalakshmi\'s already is.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const s of STEPS) {
  out(`-- --- ${s.pooja} / ${s.newTitle ?? s.title} ${'-'.repeat(Math.max(2, 50 - s.title.length))}`);
  out('update public.pooja_steps set');
  if (s.newTitle) out(`  step_title_en = ${q(s.newTitle)},`);
  if (s.newTitle === 'Naivedyam & Tambulam') out(`  step_title_ta = ${q('நைவேத்யம் & தாம்பூலம்')},`);
  out(`  instruction_en = ${q(s.instruction_en)},`);
  out(`  instruction_ta = ${q(s.instruction_ta)},`);
  if (s.vlKeep) {
    // Wrap what is already there rather than restating it: the verses came out
    // of the Varalakshmi kalpam and are correct. Guarded so a re-run does not
    // wrap twice.
    out(`  mantra_sanskrit = case when mantra_sanskrit like ${q('%भूर्भुवस्सुवः%')} then mantra_sanskrit`);
    out(`    else ${q(FRAME_BEFORE.join('\n') + '\n')} || mantra_sanskrit || ${q('\n' + FRAME_AFTER.join('\n'))} end,`);
    out(`  mantra_tamil = case when mantra_tamil like ${q('%பூர்புவஸ்ஸுவ%')} then mantra_tamil`);
    out(`    else ${q(tr(Sanscript, FRAME_BEFORE.join('\n'), 'tamil') + '\n')} || mantra_tamil || ${q('\n' + tr(Sanscript, FRAME_AFTER.join('\n'), 'tamil'))} end,`);
    out(`  mantra_translit = case when mantra_translit like ${q('%bhūrbhuvassuvaḥ%')} then mantra_translit`);
    out(`    else ${q(tr(Sanscript, FRAME_BEFORE.join('\n'), 'iast') + '\n')} || mantra_translit || ${q('\n' + tr(Sanscript, FRAME_AFTER.join('\n'), 'iast'))} end,`);
  } else {
    out(`  mantra_sanskrit = ${q(s.s.deva)},`);
    out(`  mantra_tamil = ${q(s.s.ta)},`);
    out(`  mantra_translit = ${q(s.s.iast)},`);
  }
  out(`  source_ref = ${q(SRC[s.source])},`);
  out('  verified_by = null,');
  out('  verified_at = null,');
  out('  updated_at = now()');
  out(`where ${atEither(s.pooja, s.title, s.newTitle)};`);
  out();
}

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- Nothing here may still be a one-liner. Counting LINES, not characters:');
out('  -- the first draft asserted 200 characters and the neerajanam is a legitimate');
out('  -- 154, so the gate failed on correct content. What actually distinguishes');
out('  -- these from what they replaced is that each is a sequence.');
out('  select count(*) into n from public.pooja_steps');
out(`   where (${STEPS.map((s) => `(${atEither(s.pooja, s.title, s.newTitle)})`).join(' or ')})`);
out('     and (mantra_sanskrit is null');
out("          or (length(mantra_sanskrit) - length(replace(mantra_sanskrit, chr(10), ''))) < 3);");
out("  if n > 0 then raise exception '% offering steps are still a single line', n; end if;");
out('  -- Both naivedyams must carry the whole frame, in the practised order.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en in ('Naivedyam & Tambulam', 'Naivedyam, Paniyam & Tambulam')");
out("     and (mantra_sanskrit not like '%भूर्भुवस्सुवः%'");
out("          or mantra_sanskrit not like '%अमृतोपस्तरणमसि%'");
out("          or mantra_sanskrit not like '%समानाय स्वाहा%'");
out("          or mantra_sanskrit not like '%अमृतापिधानमसि%'");
out("          or mantra_sanskrit not like '%उत्तरापोशनं%'");
out("          or position('समानाय स्वाहा' in mantra_sanskrit) > position('अमृतापिधानमसि' in mantra_sanskrit));");
out("  if n > 0 then raise exception '% naivedyam steps are missing part of the frame', n; end if;");
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en in ('Naivedyam & Tambulam', 'Naivedyam, Paniyam & Tambulam');");
out("  if n <> 2 then raise exception 'expected 2 naivedyam steps, found %', n; end if;");
out('  -- No placeholder source_ref may survive on a step this migration touched.');
out('  select count(*) into n from public.pooja_steps');
out(`   where (${STEPS.map((s) => `(${atEither(s.pooja, s.title, s.newTitle)})`).join(' or ')})`);
out("     and source_ref like '%pending vaidika review%';");
out("  if n > 0 then raise exception '% touched steps still carry the draft source_ref', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select step_title_en, length(mantra_sanskrit) from pooja_steps where source_ref not like '%pending%' order by 2;");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0019_upachara_mantras.sql', sql);
} else {
  console.log('--- validated, not written (pass --emit) ---\n');
  for (const s of STEPS) {
    console.log(`##### ${s.pooja} / ${s.newTitle ?? s.title}`);
    if (s.vlKeep) {
      console.log('  [frame wrapped around the existing kalpam verses]');
      console.log(FRAME_BEFORE.map((l) => '  + ' + l).join('\n'));
      console.log('  ... existing verses ...');
      console.log(FRAME_AFTER.map((l) => '  + ' + l).join('\n'));
    } else {
      console.log(s.s.deva.split('\n').map((l) => '  ' + l).join('\n'));
    }
    console.log();
  }
}
