#!/usr/bin/env node
/**
 * Prana Pratishtha and Udvasanam, from published text. Emits 0021.
 *
 *   node scripts/build-prana-pratishtha.mjs          # validate only
 *   node scripts/build-prana-pratishtha.mjs --emit   # write it
 *
 * ---------------------------------------------------------------------------
 * THE REPORT, AND WHY IT IS RIGHT
 *
 * "all main mantras are so truncated that research needs to be done again.
 * Prana prathishta one example - just says I will perform pran prathishta - it
 * has lot of mantras that need to be uttered."
 *
 * Correct. Prana Pratishtha held one verse and a samarpayami tag:
 *
 *   asya prāṇāḥ pratiṣṭhantu asya prāṇāḥ kṣarantu ca |
 *   asya devatvamarcāyai māmaheti ca kaścana ||
 *   śrī mahāgaṇapataye namaḥ prāṇa pratiṣṭhāpayāmi ||
 *
 * That is a real verse, but it is the END of the rite, not the rite. And it was
 * written under source_ref "Standard prana pratishtha verse" -- which names no
 * text. Searching every cached page for it finds nothing: it was typed from
 * memory, mine, in migration 0010.
 *
 * Udvasanam has the same shape of fault and is worse as a truncation: it holds
 * the FIRST HALF of yajñena yajñamayajanta and stops mid-verse. "te ha nākaṃ
 * mahimānassacante | yatra pūrve sādhyāssanti devāḥ" is simply missing, and so
 * is the closing śobhanārthe kṣemāya punarāgamanāya ca | oṃ śāntiḥ śāntiḥ
 * śāntiḥ, which is the last thing said in the whole pooja.
 *
 * ---------------------------------------------------------------------------
 * WHAT REPLACES THEM, AND THE GENDER
 *
 * Both genders are now published text rather than mine:
 *
 *   masculine (Ganesha)   Sri Haridra Ganapati Puja (Telugu, with svara),
 *                         already cached -- the page 0011 used for the
 *                         Manjal Pillaiyar step
 *   feminine (Lakshmi)    Sri Lalitha Shodasopachara Puja Vidhanam (IAST)
 *
 * They share the Vedic core -- asunīte punarasmāsu cakṣuḥ (Rigveda 10.59.6) and
 * amṛtaṃ vai prāṇāḥ -- and differ exactly where Sanskrit gender makes them
 * differ: sthiro bhava varado bhava against āvāhitā bhava sthāpitā bhava,
 * varadā bhava. The old text handled gender by swapping asya for asyai, which
 * was right in principle; this keeps that care and sources it.
 *
 * The asya/asyai verse is NOT carried over. Keeping unsourced text beside
 * sourced text in one mantra is the thing migration 0018 had to undo on the
 * arghyam, and the published sequences are complete without it.
 *
 * Svara is stripped, as in 0019 and 0020. These pages print the Vedic accents;
 * the Telugu one writes them with the DEVANAGARI udatta and anudatta marks plus
 * a right double quote for the dheergha svarita, which is why loadTelugu needed
 * a vedic option -- Sanscript carries all three straight through otherwise.
 */
import { emitMigration } from './_migration.mjs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate as tr } from './_tamil.mjs';
import {
  loadRoman, loadTelugu, section, teluguToDeva, iastToDeva, normalise, checkScripts,
} from './_sources.mjs';

const DIR = process.env.NAMAVALI_DIR || 'C:/tmp-pv/namavali/';
const CACHE = process.env.PV_CACHE || 'C:/Users/vinay/AppData/Local/Temp/claude/';
const HARIDRA = `${DIR}pasupu_te.txt`;
const LALITHA = `${CACHE}sri-lalitha-shodasopachara-puja-vidhanam-in-english.txt`;

const fail = (m) => {
  console.error(`FAIL  ${m}`);
  process.exitCode = 1;
};

const haridra = loadTelugu(HARIDRA, { vedic: true });
const lalitha = loadRoman(LALITHA);

// udvasanam is followed by a parenthetical cross-reference to the vrata kalpam,
// which carries Telugu letters and so is not filtered as markup. Stop on the
// santi, which is the last thing said.
const fromHaridra = (name, stopAt) =>
  section(haridra, name, { script: 'telugu', stopAt, fail })
    .map((l) => normalise(teluguToDeva(Sanscript, l, fail)));
const fromLalitha = (name) =>
  section(lalitha, name, { script: 'roman', fail }).map((l) => iastToDeva(Sanscript, l, fail));

const MASC = fromHaridra('ప్రాణప్రతిష్ఠ');
const FEM = fromLalitha('prāṇapratiṣṭha');
const UDVASANA = fromHaridra('ఉద్వాసనం', /^ఓం శాంతిః/);

// The two recensions must share the Vedic core and differ only in the gendered
// tail. If they ever stop sharing it, one of the pages has changed under us.
for (const [who, lines] of [['masculine', MASC], ['feminine', FEM]]) {
  const t = lines.join(' ');
  for (const must of ['असुनीते', 'प्राणमिह', 'अमृतं वै प्राणा', 'यथास्थानमुपह्वयते', 'स्थिरासनं कुरु']) {
    if (!t.includes(must)) fail(`the ${who} prana pratishtha is missing "${must}"`);
  }
}
if (!MASC.join(' ').includes('स्थिरो भव')) fail('the masculine form does not say sthiro bhava');
if (!FEM.join(' ').includes('वरदा भव')) fail('the feminine form does not say varadā bhava');
if (FEM.join(' ').includes('वरदो भव')) fail('the feminine form carries a masculine varado bhava');

/**
 * The namaskara goes AFTER the Vedic core, not into the middle of it.
 *
 * The first attempt pulled the Haridra page's own namaskara out and spliced one
 * back in at a fixed index, which landed it between "jyokpaśyema
 * sūryamuccarantam" and "manumate mṛḍayā naḥ svasti" -- inside the shloka,
 * splitting a single verse in half. The masculine page already has it in the
 * right place, so it is left alone; the Lalitha page names nobody, so the line
 * is inserted after the last line of the core, found by its text rather than by
 * counting.
 */
const CORE_END = 'यथास्थानमुपह्वयते';
if (!MASC.some((l) => l.includes('महागणपतये नमः'))) {
  fail('expected the haridra page to name the deity in the sequence');
}
function withNamaskara(lines, namaskara) {
  const i = lines.findIndex((l) => l.includes(CORE_END));
  if (i < 0) { fail('could not find the end of the Vedic core'); return lines; }
  return [...lines.slice(0, i + 1), namaskara, ...lines.slice(i + 1)];
}

const STEPS = [
  {
    pooja: 'ganesha_standard',
    title: 'Prana Pratishtha',
    deva: MASC, // the page already names him, in the right place
    source:
      'StotraNidhi Sri Haridra Ganapati Puja (Telugu, with svara), prāṇapratiṣṭha section, round-trip verified Telugu->Devanagari by scripts/build-prana-pratishtha.mjs. Replaces the single verse written in migration 0010, whose source_ref named a video chapter and a tradition but no text, and which appears in none of this project\u2019s cached sources. (Deliberately paraphrased: quoting the old source_ref verbatim here would make this one match the gate that hunts for survivors of it, which is exactly what happened in 0019.) Svara marks are stripped.',
    meaning_en:
      'Asunite, giver of life: give us back our sight, give us back our breath and our enjoyment here. May we long see the sun rising; be gracious to us, Anumati, and grant us well-being. The breaths are the deathless, the waters are the deathless: the breaths are called back, each to its own place. To Sri Mahaganapati, salutations. Be steady; be the giver of boons; be gracious of face; be well pleased; take a firm seat.',
    philosophy_en:
      'Everything before this prepares a seat. This is the step that makes the rest of the pooja hospitality rather than arrangement. The verse is Rigveda 10.59.6, and it is not addressed to the idol at all \u2014 it asks that breath, sight and gladness be given back, and only then does the invocation turn to the deity and ask him to sit. A goddess takes the feminine form, which the Varalakshmi step carries.',
  },
  {
    pooja: 'varalakshmi_vratham',
    title: 'Prana Pratishtha',
    deva: withNamaskara(FEM, 'श्री वरलक्ष्मी देवतायै नमः ।'),
    source:
      'StotraNidhi Sri Lalitha Shodasopachara Puja Vidhanam (IAST), prāṇapratiṣṭha section, round-trip verified IAST->Devanagari by scripts/build-prana-pratishtha.mjs. The feminine recension: āvāhitā bhava, sthāpitā bhava, varadā bhava where the masculine has sthiro bhava, varado bhava. The Varalakshmi Vrata Kalpam carries no prana pratishtha of its own, and the namaskara naming the goddess is supplied. Svara marks are stripped.',
    meaning_en:
      'Asunite, giver of life: give us back our sight, give us back our breath and our enjoyment here. May we long see the sun rising; be gracious to us, Anumati, and grant us well-being. The breaths are the deathless, the waters are the deathless: the breaths are called back, each to its own place. To Sri Varalakshmi, salutations. Be invoked; be established; be well pleased; be the giver of boons; take a firm seat; be gracious, be gracious.',
    philosophy_en:
      'The same Vedic verse as at Ganesha Chaturthi, and the same turn: it asks that breath and sight be given back before it asks anything of the goddess. The feminine forms are not cosmetic \u2014 āvāhitā, sthāpitā, varadā are how the published Lalitha vidhanam writes them, and it is why the kalasham is dismantled the next day with a step of its own rather than simply being put away.',
  },
  {
    pooja: 'ganesha_standard',
    title: 'Udvasanam',
    deva: UDVASANA.map((l) => l.replace('श्री महागणपति नमः', 'श्री महागणपतये नमः')),
    source:
      'StotraNidhi Sri Haridra Ganapati Puja (Telugu, with svara), udvāsanam section, round-trip verified Telugu->Devanagari by scripts/build-prana-pratishtha.mjs. The earlier text held only the first half of yajñena yajñamayajanta and stopped mid-verse, and had none of the closing śobhanārthe kṣemāya punarāgamanāya ca. Svara marks are stripped.',
    meaning_en:
      'By sacrifice the gods sacrificed to sacrifice; these were the first observances. They reached the height where the ancient Sadhyas, the gods, abide. To Sri Mahaganapati, salutations: I take leave of you to your own place \u2014 for what is good, for well-being, and for your coming again. Peace, peace, peace.',
    philosophy_en:
      'Prana Pratishtha made the clay a living presence, so something has to formally end that, and the half-verse this step used to carry ended nothing. Punarāgamanāya ca, "and for your coming again", is the line that makes the leave-taking an invitation rather than a dismissal. It is the step the diaspora most often does not know exists.',
  },
  {
    pooja: 'varalakshmi_vratham',
    title: 'Udvasanam',
    deva: UDVASANA.map((l) => l.replace('श्री महागणपति नमः', 'श्री वरलक्ष्मी देवतायै नमः')),
    source:
      'StotraNidhi Sri Haridra Ganapati Puja (Telugu, with svara), udvāsanam section, round-trip verified Telugu->Devanagari, with the namaskara changed to name the goddess. yathāsthānaṃ udvāsayāmi is the performer\u2019s verb and does not inflect for the deity\u2019s gender, so only the namaskara differs. The earlier text held only the first half of the verse.',
    meaning_en:
      'By sacrifice the gods sacrificed to sacrifice; these were the first observances. They reached the height where the ancient Sadhyas, the gods, abide. To Sri Varalakshmi, salutations: I take leave of you to your own place \u2014 for what is good, for well-being, and for your coming again. Peace, peace, peace.',
    philosophy_en:
      'Prana Pratishtha made the kalasham a presence, so something has to end that; without it the vessels are put away with a guest still in them. Punarāgamanāya ca, "and for your coming again", is why the thread comes off next year rather than never, and why the vratham is annual.',
  },
];

for (const s of STEPS) {
  const deva = s.deva.join('\n');
  s.s = { deva, ta: tr(Sanscript, deva, 'tamil'), iast: tr(Sanscript, deva, 'iast') };
  checkScripts(`${s.pooja}/${s.title}`, s.s, fail);
  if (s.deva.length < 5) fail(`${s.pooja}/${s.title} is only ${s.deva.length} lines`);
  if (/_{2,}/.test(deva)) fail(`${s.pooja}/${s.title} has a template blank`);
  // An ASCII colon where the visarga belongs. Both source pages write one.
  if (deva.includes(':')) fail(`${s.pooja}/${s.title} has an ASCII colon, not a visarga`);
  // The namaskara must not split the Vedic verse it follows.
  const ni = s.deva.findIndex((l) => /नमः\s*।?$/.test(l.trim()));
  if (ni >= 0 && ni < 5) fail(`${s.pooja}/${s.title}: the namaskara is inside the verse, at line ${ni + 1}`);
}
// The truncation that was reported: the udvasanam verse must be whole.
for (const s of STEPS.filter((x) => x.title === 'Udvasanam')) {
  for (const must of ['यज्ञेन यज्ञम', 'ते ह नाकं', 'यत्र पूर्वे', 'पुनरागमनाय', 'शांतिः']) {
    if (!s.s.deva.includes(must)) fail(`${s.pooja} udvasanam is missing "${must}"`);
  }
}
// And nothing may still carry the verse that traced to no text.
for (const s of STEPS) {
  if (s.s.deva.includes('प्रतिष्ठन्तु')) fail(`${s.pooja}/${s.title} still carries the unsourced verse`);
}

if (process.exitCode) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const at = (p, t) => `pooja_id = '${p}' and step_title_en = '${t}'`;

const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0021_prana_pratishtha_and_udvasanam.sql');
out('--');
out('-- GENERATED by scripts/build-prana-pratishtha.mjs. Do not hand-edit.');
out('--');
out('-- Prana Pratishtha held one verse and a samarpayami tag, under a source_ref');
out('-- that named no text -- "Standard prana pratishtha verse". It appears in none');
out('-- of this project\'s cached sources: it was typed from memory in 0010.');
out('--');
out('-- Udvasanam was worse as a truncation: it held the FIRST HALF of yajñena');
out('-- yajñamayajanta and stopped mid-verse, and had none of the closing');
out('-- śobhanārthe kṣemāya punarāgamanāya ca, which is the last thing said in the');
out('-- whole pooja.');
out('--');
out('-- Both genders are published text now. The masculine comes from the Haridra');
out('-- Ganapati puja and the feminine from the Lalitha shodashopachara vidhanam;');
out('-- they share the Vedic core, asunīte punarasmāsu cakṣuḥ and amṛtaṃ vai');
out('-- prāṇāḥ, and differ where Sanskrit gender makes them differ.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const s of STEPS) {
  out(`-- --- ${s.pooja} / ${s.title}`);
  out('update public.pooja_steps set');
  out(`  mantra_sanskrit = ${q(s.s.deva)},`);
  out(`  mantra_tamil = ${q(s.s.ta)},`);
  out(`  mantra_translit = ${q(s.s.iast)},`);
  out(`  meaning_en = ${q(s.meaning_en)},`);
  out(`  philosophy_en = ${q(s.philosophy_en)},`);
  out(`  source_ref = ${q(s.source)},`);
  out('  verified_by = null,');
  out('  verified_at = null,');
  out('  updated_at = now()');
  out(`where ${at(s.pooja, s.title)};`);
  out();
}

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en in ('Prana Pratishtha', 'Udvasanam')");
out("     and (mantra_sanskrit is null");
out("          or (length(mantra_sanskrit) - length(replace(mantra_sanskrit, chr(10), ''))) < 4);");
out("  if n > 0 then raise exception '% of these steps are still short', n; end if;");
out('  -- The verse that traced to no text must be gone from both poojas.');
out('  select count(*) into n from public.pooja_steps');
out("   where mantra_sanskrit like '%प्राणाः प्रतिष्ठन्तु%';");
out("  if n > 0 then raise exception '% steps still carry the unsourced pratishthantu verse', n; end if;");
out('  -- Gender must be right in each: masculine for Ganesha, feminine for the goddess.');
out('  select count(*) into n from public.pooja_steps');
out(`   where ${at('ganesha_standard', 'Prana Pratishtha')} and mantra_sanskrit like '%स्थिरो भव%';`);
out("  if n <> 1 then raise exception 'the Ganesha prana pratishtha is not in the masculine'; end if;");
out('  select count(*) into n from public.pooja_steps');
out(`   where ${at('varalakshmi_vratham', 'Prana Pratishtha')}`);
out("     and mantra_sanskrit like '%वरदा भव%' and mantra_sanskrit not like '%वरदो भव%';");
out("  if n <> 1 then raise exception 'the Varalakshmi prana pratishtha is not in the feminine'; end if;");
out('  -- The udvasanam verse must be whole, and must end the pooja properly.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Udvasanam'");
out("     and mantra_sanskrit like '%ते ह नाकं%' and mantra_sanskrit like '%पुनरागमनाय%'");
out("     and mantra_sanskrit like '%शांतिः शांतिः शांतिः%';");
out("  if n <> 2 then raise exception 'expected both udvasanams whole, found %', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select pooja_id, length(mantra_sanskrit) from pooja_steps where step_title_en = 'Prana Pratishtha';");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0021_prana_pratishtha_and_udvasanam.sql', sql);
} else {
  console.log('--- validated, not written (pass --emit) ---\n');
  for (const s of STEPS) {
    console.log(`##### ${s.pooja} / ${s.title}  (${s.s.deva.length} chars, was much less)`);
    console.log(s.s.deva.split('\n').map((l) => '  ' + l).join('\n'));
    console.log();
  }
}
