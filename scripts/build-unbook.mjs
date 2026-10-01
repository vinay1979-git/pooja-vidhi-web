#!/usr/bin/env node
/**
 * Stop the app talking about the book it was made from.
 *
 *   node scripts/build-unbook.mjs          # validate
 *   node scripts/build-unbook.mjs --emit   # write it
 *
 * Fifty sentences across the content said things like "the book is careful to
 * say the position was given to him", "the book says to learn these from a
 * teacher", "the book asks for the ten postures of Surya Namaskara here". The
 * reader is performing a rite, not reading a review of an edition. They did not
 * buy the book, do not have it open, and cannot check it -- so a sentence that
 * attributes an instruction to it adds a party to the conversation who is not
 * in the room, and in instruction_en it is worse than noise: an instruction
 * that reports what somebody else asks for is not an instruction.
 *
 * SO THE VOICE CHANGES, NOT THE CONTENT. "The book says to learn these from a
 * teacher" becomes "These are properly learnt from a teacher" -- same fact,
 * same authority, stated rather than cited. Nothing is softened and no claim is
 * dropped, because the claims were never the book's opinion: they are the
 * tradition's, and the book was reporting them too.
 *
 * WHERE PROVENANCE GOES. It was already going somewhere: source_ref carries the
 * edition and page on every row and is not shown to the reader. That is the
 * right home for it, so the few sentences that were pure provenance -- "the
 * Bhavan edition prints it the same way, so two independent editions agree",
 * "it cross-references itself the same way the Giri Nitya Pooja book does" --
 * are dropped from the prose rather than reworded. They were telling the reader
 * how confident the transcription is, which is a question about this app and
 * not about their rite.
 *
 * MATCHED AS WHOLE SENTENCES, replaced globally. Several of these appear on
 * three or four rows -- the Anga Vandanam philosophy is on all three copies of
 * the step, the morning/evening variant note is on four poojas -- so one
 * replacement fixes every copy and they cannot drift apart afterwards. Each one
 * is asserted PRESENT before the replace runs: a fragment that no longer
 * matches, because a character is wrong or an earlier migration changed it,
 * fails loudly instead of replacing nothing and reporting success.
 */
import { emitMigration } from './_migration.mjs';

/**
 * [table, column, exact sentence now, what it should say].
 *
 * An empty replacement deletes the sentence and the space before it; those are
 * the ones that were provenance rather than content.
 */
const EDITS = [
  // ---- things that were pure book-mechanics ---------------------------------
  ['pooja_steps', 'philosophy_en',
    'This sankalpa names no person, no gotra, no year, month, tithi or star — and the Bhavan edition prints it the same way, so two independent editions agree.',
    'This sankalpa names no person, no gotra, no year, month, tithi or star.'],
  ['pooja_steps', 'philosophy_en',
    'The book gives the mantra again and refers back to page 18 for the action rather than reprinting it. It cross-references itself the same way the Giri Nitya Pooja book does for its purvangam, and for the same reason: one description, corrected in one place.',
    'The mantra and the action are both exactly as before.'],

  // ---- instructions, which must instruct ------------------------------------
  ['pooja_steps', 'instruction_en',
    'SKIP THIS STEP IF THERE IS NO CONCH IN THE HOUSE — the book says so plainly, while adding that it is worth keeping at least a small one, since the conch stands for the pranava and is a dwelling of Lakshmi.',
    'SKIP THIS STEP IF THERE IS NO CONCH IN THE HOUSE. It is worth keeping at least a small one, since the conch stands for the pranava and is a dwelling of Lakshmi.'],
  ['pooja_steps', 'instruction_en',
    'The book asks for the ten postures of Surya Namaskara here, breathing in at the start of each and out at the end:',
    'Perform the ten postures of Surya Namaskara here, breathing in at the start of each and out at the end:'],
  ['pooja_steps', 'instruction_en',
    'The book says to learn these from a teacher.',
    'These are properly learnt from a teacher.'],
  ['pooja_steps', 'instruction_en',
    'The book says to learn this from a teacher.',
    'This is properly learnt from a teacher.'],
  ['pooja_steps', 'instruction_en',
    'anyone who has not begins at "agajanana padmarkam" instead, which the book gives in its place.',
    'anyone who has not begins at "agajanana padmarkam" instead.'],
  ['pooja_steps', 'instruction_en',
    'Say your own pravara rishis, gotra and name in the blanks — the book leaves them blank because the reciter knows them.',
    'Say your own pravara rishis, gotra and name in the blanks; they are left open because the reciter knows them.'],

  // ---- variant notes --------------------------------------------------------
  ['pooja_steps', 'variant_note_en',
    'The book prints the two forms side by side, labelled (Morning) and (Evening).',
    'There are two forms, one for the morning and one for the evening.'],

  // ---- meaning --------------------------------------------------------------
  ['pooja_steps', 'meaning_en',
    'The book calls the set the nama-trayee vidya and says it cures all disease.',
    'The set is called the nama-trayee vidya, and is said to cure all disease.'],

  // ---- philosophy -----------------------------------------------------------
  ['pooja_steps', 'philosophy_en',
    'The book gives a reason for every finger, and it is not decorative:',
    'There is a reason for every finger, and it is not decorative:'],
  ['pooja_steps', 'philosophy_en',
    'The book allows the step to be skipped if there is no conch in the house, which is worth reading twice:',
    'The step may be skipped if there is no conch in the house, which is worth reading twice:'],
  ['pooja_steps', 'philosophy_en',
    'Every sankalpam in this book shares its opening and differs only in its last clause.',
    'Every sankalpam shares this opening and differs only in its last clause.'],
  ['pooja_steps', 'philosophy_en',
    'The book also prints a twenty-fifth, hayagreevaaya, in brackets and does not count it -- the same convention it uses for two of the Lakshmi hundred and eight.',
    'A twenty-fifth, hayagreevaaya, is given in brackets and not counted -- the same convention used for two of the Lakshmi hundred and eight.'],
  ['pooja_steps', 'philosophy_en',
    'and the book does not answer it.',
    'and the tradition does not answer it.'],
  ['pooja_steps', 'philosophy_en',
    'These are the same sixteen names the book gives in the Purvanga section and again in the Siddhivinayaka pooja.',
    'These are the same sixteen names used in the Purvanga and again in the Siddhivinayaka pooja.'],
  ['pooja_steps', 'philosophy_en',
    'The book keeps them apart because something happens in between',
    'They are kept apart because something happens in between'],
  ['pooja_steps', 'philosophy_en',
    'The book brings the saradu into the rite at the very beginning rather than producing it at the close.',
    'The saradu comes into the rite at the very beginning rather than being produced at the close.'],
  ['pooja_steps', 'philosophy_en',
    'The book gives the older and the newer side by side without remarking on it, which is how a living tradition usually carries its own history.',
    'The older and the newer stand side by side without remark, which is how a living tradition usually carries its own history.'],
  ['pooja_steps', 'philosophy_en',
    'The book adds that this is properly learnt from a teacher, which is the first of three places it admits a page cannot teach a body.',
    'This is properly learnt from a teacher — the first of three places where the rite says plainly that a page cannot teach a body.'],
  ['pooja_steps', 'philosophy_en',
    'The book allows the bath to be as long as the reciter is able:',
    'The bath may be as long as the reciter is able:'],
  ['pooja_steps', 'philosophy_en',
    'Where a real cloth or thread is not to hand, the book’s own substitution rule applies:',
    'Where a real cloth or thread is not to hand, the substitution rule applies:'],
  ['pooja_steps', 'philosophy_en',
    'The ten lines are choreography, not layout: the book assigns the first seven to the head, the eighth to the thighs, the ninth to sprinkling again,',
    'The ten lines are choreography, not layout: the first seven go to the head, the eighth to the thighs, the ninth to sprinkling again,'],
  ['pooja_steps', 'philosophy_en',
    'It is the closest the book comes to saying why a panchayatana pooja is the one that is done every morning.',
    'It is the closest the tradition comes to saying why a panchayatana pooja is the one that is done every morning.'],
  ['pooja_steps', 'philosophy_en',
    'The book ends this line akSHataan samarpayaami -- akshatai IN PLACE OF the things -- which is its own substitution rule applied to the grandest upachara in the rite.',
    'This line ends akSHataan samarpayaami -- akshatai IN PLACE OF the things -- the substitution rule applied to the grandest upachara in the rite.'],
  ['pooja_steps', 'philosophy_en',
    'The book says plainly that only four mantras are new and the other ten are the same, and its own gloss reads the horse as Hayagriva,',
    'Only four mantras are new and the other ten are the same, and the horse is read as Hayagriva,'],
  ['pooja_steps', 'philosophy_en',
    'Eight words, and the book marks them as the life line of the whole sandhyavandanam.',
    'Eight words, and they are the life line of the whole sandhyavandanam.'],
  ['pooja_steps', 'philosophy_en',
    'the second twelve are the calendar: the book says the Keshava names are Narayana in the form of time,',
    'the second twelve are the calendar: the Keshava names are Narayana in the form of time,'],
  ['pooja_steps', 'philosophy_en',
    'The book seals its own half here and says so: the first part of the sandhyavandanam ends,',
    'The first half is sealed here: the first part of the sandhyavandanam ends,'],
  ['pooja_steps', 'philosophy_en',
    'The book does not merely say prostrate: it gives the ten postures with the breath assigned to each, and then admits they are properly learnt from a teacher.',
    'This is not merely prostration: there are ten postures with the breath assigned to each, and they are properly learnt from a teacher.'],
  ['pooja_steps', 'philosophy_en',
    'The book prints the ornate and the plain images one after the other without comment, because the japa may be done contemplating either.',
    'The ornate and the plain images stand one after the other without comment, because the japa may be done contemplating either.'],
  ['pooja_steps', 'philosophy_en',
    'Printed with its blanks, as the book prints it.',
    'It is given with its blanks left open.'],
  ['pooja_steps', 'philosophy_en',
    'The book fills in two of the five slots in type — Apastamba sutra and the Yajus recension, because it is a Yajurveda Apastamba manual — and leaves the rest dotted.',
    'Two of the five slots are fixed — Apastamba sutra and the Yajus recension, this being a Yajurveda Apastamba rite — and the rest are left dotted.'],

  // ---- why we do it ---------------------------------------------------------
  ['poojas', 'why_en',
    'and the book is careful to say the position was given to him by the other deities rather than taken.',
    'and the position was given to him by the other deities rather than taken.'],
  ['poojas', 'why_en',
    'by the women of the house, who the book says are looked upon as Lakshmi already.',
    'by the women of the house, who are looked upon as Lakshmi already.'],
  ['poojas', 'why_en',
    'The stories the book tells to explain it',
    'The stories told to explain it'],
  ['poojas', 'why_en',
    'The centre of it is eight words, and the book says so plainly: that sun is Brahman, I am Brahman.',
    'The centre of it is eight words: that sun is Brahman, I am Brahman.'],

  // ---- naivedyam ------------------------------------------------------------
  ['naivedyam_items', 'recipe_note',
    'Plain cooked white rice, the first of the book’s list.',
    'Plain cooked white rice, the first of the list.'],
];

/** Words that mean the app is talking about its source rather than instructing. */
const TELL = /\b(the book|this book|the edition|this edition|Giri|Bhavan|the author|the manual)\b/i;

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

const seenFrom = new Set();
for (const [t, c, from, to] of EDITS) {
  const k = `${t}.${c}|${from}`;
  if (seenFrom.has(k)) fail(`duplicate rule for "${from.slice(0, 50)}..."`);
  seenFrom.add(k);
  if (from === to) fail(`no-op rule: "${from.slice(0, 50)}..."`);
  if (!TELL.test(from)) fail(`rule does not target a source mention: "${from.slice(0, 60)}..."`);
  // The replacement must not reintroduce what it is removing. Obvious, and
  // exactly the sort of thing that slips through a 39-row table edited by hand.
  if (TELL.test(to)) fail(`replacement still mentions the source: "${to.slice(0, 60)}..."`);
  if (to && /\s\s/.test(to)) fail(`replacement has a double space: "${to.slice(0, 60)}..."`);
}

console.log('--- what this rewords ---');
const byField = {};
for (const [t, c] of EDITS) byField[`${t}.${c}`] = (byField[`${t}.${c}`] ?? 0) + 1;
for (const [f, n] of Object.entries(byField)) console.log(`  ${f.padEnd(34)} ${n} rule(s)`);
console.log(`  ${EDITS.length} rules in all, covering 50 sentences across the content`);
if (failed) { console.error('\nnot emitting'); process.exit(1); }

// --- emit --------------------------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const L = [];
const o = (s = '') => L.push(s);

o('-- =============================================================================');
o('-- 0054_say_it_dont_cite_it.sql');
o('--');
o('-- GENERATED by scripts/build-unbook.mjs. Do not hand-edit.');
o('--');
o('-- Fifty sentences said things like "the book is careful to say the position was');
o('-- given to him", "the book says to learn these from a teacher", "the book asks');
o('-- for the ten postures of Surya Namaskara here". The reader is performing a');
o('-- rite, not reading a review of an edition. They did not buy the book, do not');
o('-- have it open and cannot check it, so citing it adds a party to the');
o('-- conversation who is not in the room -- and in instruction_en it is worse than');
o('-- noise, because an instruction that reports what somebody else asks for is not');
o('-- an instruction.');
o('--');
o('-- THE VOICE CHANGES, NOT THE CONTENT. "The book says to learn these from a');
o('-- teacher" becomes "These are properly learnt from a teacher": same fact, same');
o('-- authority, stated rather than cited. Nothing is softened and no claim is');
o('-- dropped, because none of these claims were the book\'s opinion -- they are the');
o('-- tradition\'s, and the book was reporting them too.');
o('--');
o('-- WHERE PROVENANCE GOES. It already had a home: source_ref carries the edition');
o('-- and page on every row and is never shown to the reader. So the handful of');
o('-- sentences that were pure provenance -- "the Bhavan edition prints it the same');
o('-- way, so two independent editions agree" -- are dropped rather than reworded.');
o('-- They told the reader how confident the transcription is, which is a question');
o('-- about this app and not about their rite.');
o('--');
o('-- Matched as whole sentences and replaced globally, so the copies cannot drift:');
o('-- the Anga Vandanam philosophy is on all three copies of that step and the');
o('-- morning/evening variant note is on four poojas.');
o('-- =============================================================================');
o();
o('begin;');
o();
o('-- Every fragment must still be there. A replace() whose needle is absent is a');
o('-- no-op that reports success -- the quietest failure there is -- and with 38');
o('-- fragments carrying em dashes, curly apostrophes and double hyphens, one of');
o('-- them being a character out is the likeliest thing to go wrong here.');
o('do $$');
o('declare n int;');
o('begin');
for (const [t, c, from] of EDITS) {
  o(`  select count(*) into n from public.${t} where position(${q(from)} in coalesce(${c}, '')) > 0;`);
  o(`  if n = 0 then raise exception 'no row of ${t}.${c} contains %', ${q(from.slice(0, 60) + '...')}; end if;`);
}
o('end $$;');
o();

// pooja_steps and poojas carry updated_at; naivedyam_items does NOT. Emitting
// it for every table would have failed at run time on the one row in that
// table -- the same shape as the note_en column this project once invented on
// samagri_items. Checked against the live schema before emitting rather than
// assumed from the two tables that happen to have it.
const HAS_UPDATED_AT = new Set(['pooja_steps', 'poojas']);

o('-- --- say it, do not cite it ---------------------------------------------------');
for (const [t, c, from, to] of EDITS) {
  const touch = HAS_UPDATED_AT.has(t) ? ', updated_at = now()' : '';
  o(`update public.${t} set ${c} = replace(${c}, ${q(from)}, ${q(to)})${touch}`);
  o(` where position(${q(from)} in coalesce(${c}, '')) > 0;`);
}
o();

o('-- --- assert ------------------------------------------------------------------');
o('do $$');
o('declare t text;');
o('begin');
o('  -- THE POINT, asked of the stored rows rather than of the rule list: nothing a');
o('  -- reader can see still mentions the book, the edition or an editor by name.');
o('  -- A count of rules applied would not answer this -- it would only say the');
o('  -- rules ran, not that they were the whole set.');
for (const [t, cols] of [['pooja_steps', ['instruction_en', 'meaning_en', 'philosophy_en', 'variant_note_en']],
                         ['poojas', ['why_en', 'description_en', 'eligibility']],
                         ['naivedyam_items', ['recipe_note', 'reason_en']]]) {
  for (const c of cols) {
    o(`  select string_agg(distinct left(${c}, 60), ' | ') into t from public.${t}`);
    o(`   where ${c} ~* '\\m(the book|this book|the edition|this edition|Bhavan|the author|the manual)\\M';`);
    o(`  if t is not null then raise exception '${t}.${c} still cites the source: %', t; end if;`);
  }
}
o();
o('  -- No sentence lost its spacing to a deletion.');
o("  select string_agg(distinct left(philosophy_en, 60), ' | ') into t from public.pooja_steps");
o("   where philosophy_en like '%  %' or philosophy_en like ' .%';");
o("  if t is not null then raise exception 'double spacing left behind: %', t; end if;");
o('end $$;');
o();
o('commit;');

const sql = L.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0054_say_it_dont_cite_it.sql', sql);
  console.log('\nwrote supabase/migrations/0054_say_it_dont_cite_it.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
