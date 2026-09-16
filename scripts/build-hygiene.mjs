#!/usr/bin/env node
/**
 * Pre-beta cleanup, found by scripts/proofread.mjs reading the live database.
 *
 *   node scripts/build-hygiene.mjs --emit > supabase/migrations/0015_hygiene.sql
 *
 * TEXT FAULTS, all in rows written by migrations 0005-0009, before the Tamil
 * rules were consolidated into scripts/_tamil.mjs:
 *
 *   avagraha   Devanagari marks an elided initial a with ऽ, IAST with an
 *              apostrophe, and Tamil does not mark it at all. Sanscript passes
 *              ऽ straight through, so Devanagari was sitting inside Tamil text
 *              on seven steps: jale'smin, maya'nitam, raso'mritam.
 *   om sign    three steps generated ௐ where the published Tamil sources and
 *              every later migration write ஓம். Two spellings on one screen.
 *   spacing    double spaces and a space before a danda, from joining kalpam
 *              lines.
 *
 * PROSE. Seven philosophy entries are rewritten. Three of them made claims
 * about physiology that nothing in this project supports -- Anga Vandanam
 * "invoking cosmic energies into specific nerve centers (chakras and nadis)",
 * Vighneshwara Dhyanam "stimulates the nadis (subtle nerves) associated with
 * memory and focus", Pranayamam "purifying the inner channels". The other four
 * are sound but in a different voice from everything written since. Replacing
 * them was asked for explicitly.
 *
 * Nothing here touches a mantra's WORDING. Removing a character Tamil does not
 * use is orthography; the words are untouched.
 */

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const G = 'ganesha_standard';
const V = 'varalakshmi_vratham';

// Shared across both poojas: the purvangam steps are copies of one another, so
// each of these five is written once and applied to both.
const SHARED_PHILOSOPHY = [
  ['Achamanam',
    'Three sips, three names, and the names are Vishnu\'s: Achyuta, Ananta, Govinda. They are the same three whoever the pooja is for, because in Smartha practice every rite opens through Vishnu before it turns to its own deity. What the step does is mark a boundary. You were doing something else a minute ago; from here you are not.'],

  ['Anga Vandanam',
    'Twelve names of Vishnu touched to twelve places, and again they are the same twelve in any Smartha pooja whichever god it is for. The body is being named part by part before it is asked to do anything. Nothing has been offered yet and no deity has been invited; this is still the performer getting ready.'],

  ['Vighneshwara Dhyanam',
    'The verse never says Ganesha. Shuklambaradharam vishnum shashivarnam chaturbhujam describes a white-robed, four-armed figure the colour of the moon, and different traditions read it as Ganesha or as Vishnu. What it asks for is unambiguous: sarva-vighna-upashantaye, the quieting of every obstacle, said before anything is attempted rather than after something has gone wrong.'],

  ['Pranayamam',
    'The only step in the whole pooja that is about breathing rather than offering. The seven worlds, the Gayatri, then the line about water and light: it is a long thing to say on a held breath, and the length is the point. In this tradition women do not perform it, which is why the app removes the step for them rather than showing it greyed out.'],

  ['Kalasha Pooja',
    'Seven rivers named over a steel tumbler on a kitchen floor. Note what the verse actually asks: sannidhim kuru, be present in this water. Not a claim that the tumbler holds the Ganga, but a request that it should, which is a different kind of sentence and the one this whole pooja is built out of.'],
];

const OWN_PHILOSOPHY = [
  [G, 'Anga Pooja',
    'Twenty-nine names, and almost every one begins with the same sound as the limb it worships: Parvatinandana at the feet, Guhagraja at the groin, Natha at the navel, Phalachandra at the forehead. That is a mnemonic, and it is how the list survived without being written down. Note also that it does not stop politely at the waist. The body is worshipped entire.'],

  [G, 'Kshama Prarthana & Conclusion',
    'Yat pujitam maya deva paripurnam tad astu te: whatever I have worshipped, let it stand complete FOR YOU. Not "forgive me" and not "I did my best". Completion is asked for as something the deity grants, not something the performer achieved, which is why the verse can concede mantra, rite and devotion all at once and still end the pooja properly.'],
];

const PHILOSOPHY = [
  ...SHARED_PHILOSOPHY.flatMap(([t, text]) => [[G, t, text], [V, t, text]]),
  ...OWN_PHILOSOPHY,
];

// Prose that went stale when 0012 replaced the Ganesha archanas, plus one
// sentence that contradicted another step. Found by reading, not by a script:
// every one of these is well-formed text that says something untrue.
//
// Two OTHER matches for "sixteen upachara" are correct and left alone: the
// Varalakshmi Sankalpam and Kshama Prarthana meanings render the kalpam's own
// shodashopachara, which really is sixteen.
const PROSE_FIXES = [
  [G, 'Durva Pooja (21 Names)', 'instruction_en',
    'Take arugampul in pairs of blades. Offer one pair at each of the twenty-one names. Durva is the offering Ganesha is said to prefer above every other, which is why it is given in its own right here as well as being one of the twenty-one leaves.',
    /only upachara in the whole pooja given twenty-one times/,
    'said it was the only upachara given twenty-one times, which stopped being true when 0012 made the patra and pushpa poojas twenty-one each'],

  [G, 'Ganapathi Ashtottara Shatanamavali', 'instruction_en',
    'Offer a flower, a pinch of akshatai or a blade of arugampul at each of the hundred and eight names. If time is short the twenty-one-name Pushpa Pooja already done stands in its place, but on Chaturthi itself the full hundred and eight is the practice.',
    /sixteen-name Pushpa Pooja/,
    'still called the Pushpa Pooja a sixteen-name step; 0012 replaced it with the kalpam\'s twenty-one flowers'],

  [V, 'Dhoopam & Deepam', 'philosophy_en',
    'Dhoopam is what the room smells of and deepam is what it looks like. They are the first offerings of the morning that reach anyone standing nearby rather than only the person reciting, which is why the bell is rung through both.',
    /the only upacharas that reach everyone present/,
    'claimed these were the ONLY upacharas that reach everyone, while the Karpura Neerajanam two steps later says it is the point the rest of the house is called in'],

  [G, 'Gandham, Kumkumam & Pushpam', 'instruction_en',
    'Apply Chandanam (Sandalwood) and Kumkumam to the deity. Decorate with arugampul (grass) and flowers.',
    /Arukampul/,
    'spelled arugampul as "Arukampul", the only place in either pooja that does'],
];

const DESCRIPTIONS = [
  [G,
    'The household Ganesha pooja, kept on Vinayaka Chaturthi in the month of Aavani and on any day a new undertaking needs a clear road. A clay or turmeric Pillaiyar is invoked, worshipped through the sixteen upacharas with twenty-one leaves, twenty-one flowers, twenty-one blades of arugampul and the hundred and eight names, and released at the end of the observance.',
    'வீட்டில் செய்யப்படும் விநாயகர் பூஜை. ஆவணி மாதத்து விநாயக சதுர்த்தியிலும், புதிய முயற்சி தொடங்கும் எந்த நாளிலும் செய்யலாம். களிமண் அல்லது மஞ்சள் பிள்ளையாரை ஆவாஹனம் செய்து, ஷோடச உபசாரங்களுடன், இருபத்தொரு இலை, இருபத்தொரு புஷ்பம், இருபத்தொரு அருகம்புல், நூற்றெட்டு நாமங்களால் பூஜித்து, விரத முடிவில் உத்வாசனம் செய்யப்படுகிறது.'],
];

// ---------------------------------------------------------------------------
const problems = [];
if (PHILOSOPHY.length !== 12) problems.push(`${PHILOSOPHY.length} philosophy rows, expected 12 (5 shared x 2 + 2)`);
const titles = new Set(PHILOSOPHY.map(([, t]) => t));
if (titles.size !== 7) problems.push(`${titles.size} distinct titles, expected 7`);
for (const [p, t, text] of PHILOSOPHY) {
  if (!text || text.length < 120) problems.push(`${p}/${t}: too short`);
  if (/nadi|chakra|nerve cent|cosmic energ|inner channel/i.test(text)) {
    problems.push(`${p}/${t}: still makes a physiological claim`);
  }
}
// Each prose fix must actually remove the phrase it was written to remove.
for (const [p2, t, field, text, stale] of PROSE_FIXES) {
  if (stale.test(text)) problems.push(`${p2}/${t}.${field}: the replacement still contains the phrase it was meant to fix`);
  if (!text || text.length < 60) problems.push(`${p2}/${t}.${field}: replacement too short`);
}
if (problems.length) { problems.forEach((x) => console.error('FAIL ' + x)); process.exit(1); }

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0015_hygiene.sql
--
-- GENERATED by scripts/build-hygiene.mjs. Do not hand-edit.
--
-- Pre-beta cleanup, found by scripts/proofread.mjs reading the live database.
--
-- ORTHOGRAPHY. Rows written by migrations 0005-0009 carry two faults the later
-- generators do not, because the Tamil rules then lived in seven copies that
-- had drifted apart. They now live in scripts/_tamil.mjs.
--
--   the avagraha ऽ, which marks an elided vowel in Devanagari and an
--   apostrophe in IAST, was passing straight through into TAMIL text, where
--   the elision is not marked at all. Devanagari inside Tamil on seven steps.
--
--   the om sign ௐ on three steps, where the published Tamil sources and every
--   later migration write ஓம்.
--
-- No mantra's WORDING changes. Removing a character Tamil does not use is
-- orthography.
--
-- PROSE. Seven philosophy entries rewritten, three of which asserted things
-- about nadis, chakras and nerve centres that nothing here supports.
--
-- Idempotent.
-- =============================================================================

begin;

-- --- orthography -------------------------------------------------------------
update public.pooja_steps set
  mantra_tamil = replace(replace(mantra_tamil, 'ऽ', ''), 'ௐ', 'ஓம்'),
  updated_at = now()
where mantra_tamil is not null
  and (mantra_tamil like '%ऽ%' or mantra_tamil like '%ௐ%');

update public.archana_items set
  invoked_name_ta = replace(replace(invoked_name_ta, 'ऽ', ''), 'ௐ', 'ஓம்'),
  offering_ta = replace(replace(offering_ta, 'ऽ', ''), 'ௐ', 'ஓம்')
where invoked_name_ta like '%ऽ%' or invoked_name_ta like '%ௐ%'
   or offering_ta like '%ऽ%' or offering_ta like '%ௐ%';

update public.namavali_items set
  name_ta = replace(replace(name_ta, 'ऽ', ''), 'ௐ', 'ஓம்')
where name_ta like '%ऽ%' or name_ta like '%ௐ%';

-- --- spacing -----------------------------------------------------------------
-- Runs of spaces left by joining kalpam lines. Newlines are deliberate line
-- breaks inside a mantra and are not touched, so this collapses spaces and tabs
-- only.
update public.pooja_steps set
  mantra_sanskrit = regexp_replace(mantra_sanskrit, '[ \\t]{2,}', ' ', 'g'),
  mantra_tamil    = regexp_replace(mantra_tamil,    '[ \\t]{2,}', ' ', 'g'),
  mantra_translit = regexp_replace(mantra_translit, '[ \\t]{2,}', ' ', 'g'),
  updated_at = now()
where mantra_sanskrit ~ '[ \\t]{2,}' or mantra_tamil ~ '[ \\t]{2,}' or mantra_translit ~ '[ \\t]{2,}';
`);

out(`-- --- prose that went stale, or contradicted another step ---------------------
-- Each is guarded on the old text still being there, so a re-run after someone
-- edits the field by hand is a no-op rather than a silent revert.`);
for (const [p, t, field, text, , why] of PROSE_FIXES) {
  out(`-- ${t}: ${why}`);
  out(`update public.pooja_steps set ${field} = ${q(text)}, updated_at = now()
where pooja_id = ${q(p)} and step_title_en = ${q(t)} and ${field} <> ${q(text)};`);
  out('');
}

out('-- --- descriptions ------------------------------------------------------------');
for (const [id, en, ta] of DESCRIPTIONS) {
  out(`update public.poojas set description_en = ${q(en)}, description_ta = ${q(ta)}, updated_at = now()
where id = ${q(id)};`);
}
out('');

out(`-- --- philosophy, rewritten ---------------------------------------------------
-- These are unconditional: they replace named existing text, unlike 0014 which
-- only filled nulls.`);
for (const [p, t, text] of PHILOSOPHY) {
  out(`update public.pooja_steps set philosophy_en = ${q(text)}, updated_at = now()
where pooja_id = ${q(p)} and step_title_en = ${q(t)};`);
}

out(`
do $$
declare bad text;
begin
  select string_agg(pooja_id || ' / ' || step_title_en, ', ') into bad
    from public.pooja_steps
   where philosophy_en is null or meaning_en is null
      or mantra_tamil like '%ऽ%' or mantra_tamil like '%ௐ%';
  if bad is not null then
    raise exception 'still wrong after 0015: %', bad;
  end if;
end $$;

commit;

-- Verify:
--   select count(*) from pooja_steps where mantra_tamil like '%ऽ%' or mantra_tamil like '%ௐ%';  -- 0
--   select count(*) from poojas where description_en is null;                                    -- 0`);

console.error(`${PHILOSOPHY.length} philosophy updates across ${titles.size} titles, ${DESCRIPTIONS.length} description`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
