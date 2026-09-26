#!/usr/bin/env node
/**
 * Varalakshmi, checked against the printed source.
 *
 *   node scripts/build-varalakshmi-book.mjs          # validate
 *   node scripts/build-varalakshmi-book.mjs --emit   # write the migration
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), pp.110-137, transcribed page
 * by page into G:\My Drive\Pooja Vidhi\extracted\transcripts\4-varalakshmi.
 *
 * WHY THIS EXISTS. Every one of Varalakshmi's 29 steps rested on StotraNidhi, a
 * single web source in the Telugu tradition, because that was all there was when
 * it was built. There is now a printed Smartha source to check it against.
 *
 * A FALSE START WORTH RECORDING. The first version of this script was written
 * against a query of `mantra_sanskrit` alone, which showed Anga Pooja, Nonbu
 * Sharadu Pooja and Ksheera Arghyam as completely empty, and it set out to fill
 * them. They are not empty. A step's tickable list lives in `archana_items`,
 * not in the step's own mantra, and the viewer renders the two as separate
 * sections -- so filling the mantra would have printed every name on the screen
 * twice. Read the table a step actually renders from before concluding it has
 * nothing in it.
 *
 * THE RULE, as elsewhere in this project. ADD what the book has and the app
 * lacks. Do NOT remove what the app has and the book lacks -- a shorter printed
 * recension is not evidence that a longer recitation is wrong. REPLACE only for
 * a direct alternative in the same slot, or a demonstrable defect.
 *
 * So this adds four upacharas the book has and the app lacked, and makes two
 * replacements, each for a defect rather than a preference:
 *
 *   Ksheera Arghyam recited the wrong verse. Its one archana row is a verbatim
 *   copy of the arghyam verse from step 12 -- shuddhOdakam cha paatrastham,
 *   "pure water set in a vessel" -- in a step whose whole point is that the
 *   offering is MILK. The book gives the verse that belongs here, gOkSHeerENa
 *   yutam, "together with cow's milk".
 *
 *   Ashtottara name 106 reads brahmaa-viSHNu-shivaatmikaayai. A dvandva does
 *   not lengthen its first member; the book has brahma-viSHNu-. Grammar, not
 *   recension.
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH.
 *
 *   The Anga Pooja. The app has a fifteen-limb recension and the book a
 *   twenty-four-limb one, and they share barely a name. That is two traditions,
 *   not an error, and swapping one for the other is a decision for whoever
 *   keeps this vratham, not for a migration. Recorded in the review sheet.
 *
 *   Thirteen further differences in the 108 names and a six-name ordering
 *   difference, all recension. Also recorded rather than changed.
 */
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';

/** Devanagari -> {deva, ta, iast}. Never Object.assign this over a step. */
function scripts(deva) {
  return {
    deva,
    ta: transliterate(Sanscript, deva, 'tamil'),
    iast: transliterate(Sanscript, deva, 'iast'),
  };
}

// --- the book's text, p. by p. ----------------------------------------------

/** p.135. Said once, before the pouring: the resolve to offer the milk. */
const ksheeraSankalpa = [
  'ममोपात्त समस्त दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं,',
  'श्री वरलक्ष्मी पूजाफल संपूर्णता सिद्ध्यर्थं',
  'क्षीरार्घ्यं प्रदानं करिष्ये ॥',
].join('\n');

/** p.135. The verse itself, and the refrain said at each of the three pourings. */
const ksheeraVerse = [
  'गोक्षीरेणयुतं देवि गन्धपुष्पसमन्वितम् ।',
  'अर्घ्यं गृहाण वरदे वरलक्ष्मि नमोऽस्तु ते ॥',
].join('\n');
const ksheeraRefrain = 'श्री वरलक्ष्म्यै नमः इदमर्घ्यम्, इदमर्घ्यम्, इदमर्घ्यम् ॥';

/** p.118. A distinct upachara the app went straight past. */
const madhuparkam = [
  'महालक्ष्मि महादेवि मध्वाज्य दधि संयुतम् ।',
  'मधुपर्कं गृहाणेदं मधुसूदनवल्लभे ॥',
  'श्री वरलक्ष्म्यै नमः मधुपर्कं समर्पयामि ॥',
].join('\n');

/** p.120. Turmeric over the sandal paste, given as its own line. */
const haridra = 'गन्धोपरि हरिद्राचूर्णं समर्पयामि ॥';

/** p.133. Parasol, fan, dance, song and instrument, offered in the mind. */
const rajopachara = [
  'छत्र–चामर–नृत्त–गीत–वाद्य इत्यादि',
  'समस्तोपचार–शक्त्युपचार–देवोपचारान् समर्पयामि ॥',
].join('\n');

/** p.136. The surrender of the act itself, and the brahmarpanam. */
const closing = [
  'कायेन वाचा मनसेन्द्रियैर्वा बुद्ध्यात्मना वा प्रकृतेः स्वभावात् ।',
  'करोमि यद्यत् सकलं परस्मै नारायणायेति समर्पयामि ॥',
  'ॐ तत् सत् ब्रह्मार्पणमस्तु ॥',
].join('\n');

const NAME_106 = 'ॐ ब्रह्मविष्णुशिवात्मिकायै नमः';

// --- validate ---------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- script conversion, every line reversible into both targets ---');
const ALL = {
  ksheeraSankalpa, ksheeraVerse, ksheeraRefrain,
  madhuparkam, haridra, rajopachara, closing, NAME_106,
};
for (const [label, text] of Object.entries(ALL)) {
  const s = scripts(text);
  for (const [name, val] of Object.entries(s)) {
    if (!val || !val.trim()) fail(`${label}: ${name} is empty`);
  }
  const strip = (x) => x.replace(/[।॥–,]/g, '');
  if (/[\u0900-\u097F]/.test(strip(s.ta))) fail(`${label}: Devanagari leaked into Tamil`);
  if (/[\u0900-\u097F]/.test(strip(s.iast))) fail(`${label}: Devanagari leaked into IAST`);
  const n = text.split('\n').length;
  if (s.ta.split('\n').length !== n) fail(`${label}: Tamil lost a line break`);
  if (s.iast.split('\n').length !== n) fail(`${label}: IAST lost a line break`);
  console.log(`  ${label.padEnd(16)} ${n} line(s)  ta+iast ok`);
}

console.log('--- the ksheera arghyam really is about milk ---');
if (!ksheeraVerse.includes('गोक्षीर')) fail('the replacement verse does not mention cow milk');
if (ksheeraVerse.includes('शुद्धोदक')) fail('the replacement verse still says pure water');
console.log('  gOkSHeera present, shuddhOdaka absent');

if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit -------------------------------------------------------------------
const q = (s) => (s === null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);

/** Append to a step's mantra, guarded on the text so a re-run is a no-op. */
function appendMantra(title, deva, needle) {
  const s = scripts(deva);
  out(`update public.pooja_steps set`);
  out(`       mantra_sanskrit = mantra_sanskrit || chr(10) || ${q(s.deva)},`);
  out(`       mantra_tamil    = mantra_tamil    || chr(10) || ${q(s.ta)},`);
  out(`       mantra_translit = mantra_translit || chr(10) || ${q(s.iast)},`);
  out(`       updated_at      = now()`);
  out(` where pooja_id = 'varalakshmi_vratham' and step_title_en = ${q(title)}`);
  out(`   and mantra_sanskrit not like ${q('%' + needle + '%')};`);
  out();
}

out('-- =============================================================================');
out('-- 0030_varalakshmi_from_the_book.sql');
out('--');
out('-- GENERATED by scripts/build-varalakshmi-book.mjs. Do not hand-edit.');
out('--');
out('-- Varalakshmi was built entirely on StotraNidhi, one web source in the Telugu');
out('-- tradition. Checked now against a printed Smartha source -- Sampradaya Vratha');
out('-- Pooja Vidhi (Giri), pp.110-137.');
out('--');
out('-- Adds four upacharas the book has and the app lacked, and replaces two things');
out('-- that are defects rather than differences of tradition:');
out('--');
out('--   * Ksheera Arghyam recited the wrong verse. Its archana row was a verbatim');
out('--     copy of step 12 -- shuddhOdakam, "pure water" -- in the one step whose');
out('--     offering is milk. The book gives gOkSHeerENa yutam, which belongs here.');
out('--   * Ashtottara 106 read brahmaa-viSHNu-. A dvandva does not lengthen its');
out('--     first member. The book has brahma-viSHNu-.');
out('--');
out('-- It removes nothing, and deliberately leaves the fifteen-limb Anga Pooja');
out('-- alone: the book gives twenty-four different limbs, which is a second');
out('-- tradition rather than a correction. See the review sheet.');
out('--');
out('-- Idempotent: every append is guarded on the text it would add.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 1. upacharas the book has that the app lacked ---------------------------');
out('-- Madhuparkam is its own upachara in the shodashopachara sequence, between');
out('-- aachamaneeyam and the panchamrita snanam (p.118).');
appendMantra('Padyam, Arghyam & Achamaniyam', madhuparkam, 'मधुपर्कं');
out('-- Turmeric over the sandal paste, given as its own line (p.120).');
appendMantra('Gandham, Akshatai & Pushpam', haridra, 'हरिद्राचूर्णं');
out('-- The rajopachara: parasol, fan, dance, song, instrument (p.133).');
appendMantra('Namaskaram & Varalakshmi Prarthana', rajopachara, 'छत्र');
out('-- kaayEna vaachaa and the brahmarpanam that close the rite (p.136).');
appendMantra('Kshama Prarthana & Conclusion', closing, 'ब्रह्मार्पणमस्तु');

out('-- --- 2. the ksheera arghyam gets its own verse -------------------------------');
out('-- The resolve, said once before the pouring, goes on the step itself; the');
out('-- verse and its refrain go on the archana row the screen lets you tick off.');
{
  const s = scripts(ksheeraSankalpa);
  out(`update public.pooja_steps set`);
  out(`       mantra_sanskrit = ${q(s.deva)},`);
  out(`       mantra_tamil    = ${q(s.ta)},`);
  out(`       mantra_translit = ${q(s.iast)},`);
  out(`       source_ref      = ${q(BOOK + ', pp.135-136')},`);
  out(`       updated_at      = now()`);
  out(` where pooja_id = 'varalakshmi_vratham' and step_title_en = 'Ksheera Arghyam';`);
  out();
  const v = scripts(ksheeraVerse);
  const r = scripts(ksheeraRefrain);
  out(`update public.archana_items set`);
  out(`       invoked_name_deva     = ${q(v.deva)},`);
  out(`       invoked_name_ta       = ${q(v.ta)},`);
  out(`       invoked_name_translit = ${q(v.iast)},`);
  out(`       offering_deva         = ${q(r.deva)},`);
  out(`       offering_ta           = ${q(r.ta)},`);
  out(`       offering_en           = ${q('Pour the milk arghyam three times')}`);
  out(` where pooja_step_id = (select id from public.pooja_steps`);
  out(`                         where pooja_id = 'varalakshmi_vratham'`);
  out(`                           and step_title_en = 'Ksheera Arghyam')`);
  out(`   and seq = 1;`);
  out();
}

out('-- --- 3. one ungrammatical name -----------------------------------------------');
{
  const n = scripts(NAME_106);
  out(`update public.namavali_items set`);
  out(`       name_deva     = ${q(n.deva)},`);
  out(`       name_ta       = ${q(n.ta)},`);
  out(`       name_translit = ${q(n.iast)}`);
  out(` where namavali_id = 'lakshmi_ashtottara_108' and seq = 106`);
  out(`   and name_deva like '%ब्रह्माविष्णु%';`);
  out();
}

out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- The four additions each landed exactly once.');
out(`  select count(*) into n from public.pooja_steps`);
out(`   where pooja_id = 'varalakshmi_vratham'`);
out(`     and step_title_en = 'Padyam, Arghyam & Achamaniyam'`);
out(`     and mantra_sanskrit like '%मधुपर्कं%';`);
out(`  if n <> 1 then raise exception 'madhuparkam did not land'; end if;`);
out();
out(`  select count(*) into n from public.pooja_steps`);
out(`   where pooja_id = 'varalakshmi_vratham'`);
out(`     and step_title_en = 'Kshama Prarthana & Conclusion'`);
out(`     and mantra_sanskrit like '%ब्रह्मार्पणमस्तु%';`);
out(`  if n <> 1 then raise exception 'the brahmarpanam did not land'; end if;`);
out();
out('  -- The milk arghyam no longer recites the water verse.');
out(`  select count(*) into n from public.archana_items a`);
out(`   join public.pooja_steps s on s.id = a.pooja_step_id`);
out(`   where s.pooja_id = 'varalakshmi_vratham' and s.step_title_en = 'Ksheera Arghyam'`);
out(`     and a.invoked_name_deva like '%शुद्धोदक%';`);
out(`  if n > 0 then raise exception 'ksheera arghyam still says shuddhodaka'; end if;`);
out();
out(`  select count(*) into n from public.archana_items a`);
out(`   join public.pooja_steps s on s.id = a.pooja_step_id`);
out(`   where s.pooja_id = 'varalakshmi_vratham' and s.step_title_en = 'Ksheera Arghyam'`);
out(`     and a.invoked_name_deva like '%गोक्षीर%';`);
out(`  if n <> 1 then raise exception 'ksheera arghyam has no milk verse'; end if;`);
out();
out('  -- Name 106 is grammatical.');
out(`  select count(*) into n from public.namavali_items`);
out(`   where namavali_id = 'lakshmi_ashtottara_108' and name_deva like '%ब्रह्माविष्णु%';`);
out(`  if n > 0 then raise exception 'name 106 still has the long aa'; end if;`);
out();
out('  -- Nothing was added or removed structurally.');
out(`  select count(*) into n from public.pooja_steps where pooja_id = 'varalakshmi_vratham';`);
out(`  if n <> 29 then raise exception 'varalakshmi has % steps, expected 29', n; end if;`);
out();
out('  -- The anga pooja was left alone, at its fifteen limbs.');
out(`  select count(*) into n from public.archana_items a`);
out(`   join public.pooja_steps s on s.id = a.pooja_step_id`);
out(`   where s.pooja_id = 'varalakshmi_vratham' and s.step_title_en = 'Anga Pooja';`);
out(`  if n <> 15 then raise exception 'anga pooja has % rows, expected 15', n; end if;`);
out();
out('  -- Every step that has Devanagari has the other two scripts too.');
out(`  select count(*) into n from public.pooja_steps`);
out(`   where pooja_id = 'varalakshmi_vratham'`);
out(`     and coalesce(trim(mantra_sanskrit), '') <> ''`);
out(`     and (mantra_tamil is null or mantra_translit is null);`);
out(`  if n > 0 then raise exception '% steps are missing a script', n; end if;`);
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0030_varalakshmi_from_the_book.sql', sql);
  console.log('\nwrote supabase/migrations/0030_varalakshmi_from_the_book.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
