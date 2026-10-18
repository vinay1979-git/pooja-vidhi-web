#!/usr/bin/env node
/**
 * Nothing in the app sends the reader somewhere else.
 *
 *   node scripts/build-no-cross-references.mjs          # validate
 *   node scripts/build-no-cross-references.mjs --emit   # write 0060
 *
 * Phase 2 of docs/plans/ux-seamless-flow.md, under the rule in
 * docs/PROJECT-GUIDE.md §2.2: the book sends its reader back and forth, the
 * app must not, not even once. An audit of every reader-facing field found
 * text that does exactly that:
 *
 *   "as before", "exactly as before" -- the reader has to go and find before.
 *   "This is properly learnt from a teacher" -- three places, pointing at a
 *     person who is not in the room. The action is described in full instead
 *     (the step visuals plan will show it).
 *   "Then return and continue", and a Ganesha ashtottaram line saying a list
 *     "already done stands in its place".
 *
 * And the Tamil had kept six sentences that cite the source ("the book itself
 * says so"), which 0054 removed from the English only: the Shankha Pooja
 * twice, two Sandhyavandanam steps, and the Ganesha and Varalakshmi "why".
 *
 * Every edit is a replacement of the exact offending clause, applied with
 * replace() so nothing else in the field moves, and guarded so a re-run is a
 * no-op. The migration refuses to commit if any old clause survives or any new
 * one is missing. proofread gains the gates that keep this from coming back.
 */
import { emitMigration } from './_migration.mjs';

const MIGRATION = 'supabase/migrations/0060_no_cross_references.sql';

const step = (pooja, n) => ({ table: 'pooja_steps', where: `pooja_id = '${pooja}' and step_number = ${n}`, label: `${pooja} #${n}` });
const rite = (id) => ({ table: 'poojas', where: `id = '${id}'`, label: id });

/** [target, field, old clause (exact), new clause] */
const EDITS = [
  // Ganesha ashtottaram: a shorter list "already done stands in its place".
  [step('ganesha_standard', 29), 'instruction_en',
    ' If time is short the twenty-one-name Pushpa Pooja already done stands in its place, but on Chaturthi itself the full hundred and eight is the practice.',
    ''],
  [step('ganesha_standard', 29), 'instruction_ta',
    ' நேரம் குறைவாக இருந்தால் ஏற்கெனவே செய்த பதினாறு நாம புஷ்ப பூஜை போதுமானது; ஆனால் சதுர்த்தி அன்று நூற்றெட்டும் சொல்வதே வழக்கம்.',
    ''],

  // Sandhyavandanam pranayamam: the teacher, in the commentary.
  [step('sandhyavandanam', 4), 'philosophy_en',
    ' This is properly learnt from a teacher — the first of three places where the rite says plainly that a page cannot teach a body.',
    ''],

  // Namaskara mantras: the teacher twice, and the Tamil cited the book and
  // left out the postures the English spells out. The Tamil now carries them.
  [step('sandhyavandanam', 23), 'instruction_en',
    ' These are properly learnt from a teacher.',
    ''],
  [step('sandhyavandanam', 23), 'philosophy_en',
    ', and they are properly learnt from a teacher.',
    '.'],
  [step('sandhyavandanam', 23), 'instruction_ta',
    'நூல் இங்கு சூர்ய நமஸ்காரத்தின் பத்து நிலைகளைக் கூறுகிறது; ஒவ்வொரு நிலையின் தொடக்கத்தில் மூச்சை இழுத்து, முடிவில் வெளியிடவும். இவற்றை யோகாசிரியரிடம் கற்பது நல்லது என்று நூலே கூறுகிறது.',
    'இங்கு சூர்ய நமஸ்காரத்தின் பத்து நிலைகளைச் செய்யவும்; ஒவ்வொரு நிலையின் தொடக்கத்தில் மூச்சை இழுத்து, முடிவில் வெளியிடவும்: நிமிர்ந்து நின்று, முழங்கைகள் மார்பு உயரத்தில்; கூப்பிய கைகளை முழங்கை நேராகத் தலைக்கு மேல் உயர்த்தவும்; முழங்கால் வளையாமல் முன்குனிந்து இரு உள்ளங்கைகளையும் தரையில் வைக்கவும்; இரு கால்களையும் பின்னால் நீட்டி, முழங்கால்களை உயர்த்தி, கால்விரல்களில் நிற்கவும்; இடுப்புக்கு மேல் நிமிர்ந்து தலையை உயர்த்தவும், கைகள் உள்ளங்கைகளில் நேராக; முழங்கைகளை மடக்கித் தரையில் படுக்கவும்; இரு கைகளையும் கோத்துத் தரையில் முன்னே நீட்டவும். பின் மூன்றாம், இரண்டாம், முதல் நிலைகள் வழியாகத் திரும்பினால் ஒரு நமஸ்காரம் நிறைவு.'],

  // Pranayamam (japa): the whole commentary was "exactly as before".
  [step('sandhyavandanam', 27), 'philosophy_en',
    'The mantra and the action are both exactly as before.',
    'The same pranayama that opened the rite, done again in full before the japa: in with the seven worlds, held through the Gayatri, out with om aapo jyoti. The breath is settled once more because the Gayatri is about to be repeated many times.'],

  // Noon Surya prarthana: the teacher, then "return and continue".
  [step('sandhyavandanam', 42), 'instruction_en',
    ' This is properly learnt from a teacher. Then return and continue.',
    ' Then lower the hands and recite the second part.'],
  [step('sandhyavandanam', 42), 'instruction_ta',
    'இதை ஆசிரியரிடம் கற்க வேண்டும் என நூல் கூறுகிறது. பின் தொடரவும்.',
    'பின் கைகளை இறக்கி இரண்டாம் பகுதியைச் சொல்லவும்.'],

  // Achamanam before prokshanam: "as before". Said in full, as step 1 has it.
  [step('sandhyavandanam', 51), 'instruction_en',
    'Hold a spoonful of water in the palm as before and sip once at each of the three names.',
    'Fold the forefinger of the right hand against the thumb and curl the other three so the palm holds a spoonful of water, and sip once at each of the three names.'],
  [step('sandhyavandanam', 51), 'instruction_ta',
    'முன்பு போலவே உள்ளங்கையில் ஒரு உத்தரிணி நீர் வைத்து, மூன்று நாமங்களிலும் ஒவ்வொரு முறை உள்கொள்ளவும்.',
    'வலது கையின் ஆட்காட்டி விரலை கட்டைவிரலுடன் சேர்த்து, மற்ற மூன்று விரல்களையும் மடக்கி உள்ளங்கையில் ஒரு உத்தரிணி நீர் நிற்குமாறு வைத்து, மூன்று நாமங்களிலும் ஒவ்வொரு முறை உள்கொள்ளவும்.'],

  // Shankha Pooja, in both rites that have it: "the book itself says so".
  [step('ganesha_standard', 16), 'instruction_ta',
    'தவிர்க்கலாம் — புத்தகமே இதைத் தெளிவாகச் சொல்கிறது. ஆயினும்',
    'தவிர்க்கலாம். ஆயினும்'],
  [step('nitya_panchayatana', 9), 'instruction_ta',
    'தவிர்க்கலாம் — புத்தகமே இதைத் தெளிவாகச் சொல்கிறது. ஆயினும்',
    'தவிர்க்கலாம். ஆயினும்'],

  // The two "why" texts that still cite the book in Tamil.
  [rite('ganesha_standard'), 'why_ta',
    'மற்ற தேவர்களே ஒருமித்து அளித்தனர் என்பதை நூல் தெளிவாகச் சொல்கிறது.',
    'மற்ற தேவர்களே ஒருமித்து அளித்தனர்.'],
  [rite('varalakshmi_vratham'), 'why_ta',
    'அவர்களே லக்ஷ்மியின் வடிவம் என்று நூல் கூறுகிறது.',
    'அவர்களே லக்ஷ்மியின் வடிவமாகக் கருதப்படுகிறார்கள்.'],
];

// --- validate ---------------------------------------------------------------
// The same patterns proofread now fails on; every NEW clause must pass them.
export const CROSS_REF_EN = /\b(as before|exactly as before|learnt from a teacher|learned from a teacher|return and continue|stands in its place|already done|see (above|below|page|step)|refer to|described (above|earlier)|page \d+|step \d+)\b/i;
export const CITE_OR_REF_TA = /(நூல்|நூலே|புத்தகமே)[^.]{0,40}(கூறு|சொல்)|என்று நூல்|என நூல்|முன்பு போல|முன்போல|ஆசிரியரிட/;

let failed = false;
for (const [t, field, oldC, newC] of EDITS) {
  const re = field.endsWith('_ta') ? CITE_OR_REF_TA : CROSS_REF_EN;
  if (!oldC) { failed = true; console.error(`FAIL ${t.label}.${field}: empty old clause`); }
  if (newC && re.test(newC)) { failed = true; console.error(`FAIL ${t.label}.${field}: the new text still matches the gate`); }
  if (/\b(the book|this book|the edition)\b/i.test(newC)) { failed = true; console.error(`FAIL ${t.label}.${field}: cites the source`); }
  console.log(`  ${t.label}.${field}: -${oldC.length} +${newC.length}`);
}
if (failed) process.exit(1);
if (!process.argv.includes('--emit')) { console.log('\n(no SQL written; pass --emit)'); process.exit(0); }

// --- emit -------------------------------------------------------------------
const q = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = `-- Nothing in the app sends the reader somewhere else.
-- Generated by scripts/build-no-cross-references.mjs; see its header.

begin;

${EDITS.map(([t, field, oldC, newC]) => `-- ${t.label}.${field}
update public.${t.table} set ${field} = replace(${field}, ${q(oldC)}, ${q(newC)})${t.table === 'pooja_steps' || t.table === 'poojas' ? ', updated_at = now()' : ''}
 where ${t.where} and position(${q(oldC)} in ${field}) > 0;`).join('\n\n')}

do $$
declare n int;
begin
${EDITS.map(([t, field, oldC, newC]) => `  select count(*) into n from public.${t.table} where ${t.where} and position(${q(oldC)} in ${field}) > 0;
  if n <> 0 then raise exception '${t.label}.${field}: the old clause survived'; end if;${newC ? `
  select count(*) into n from public.${t.table} where ${t.where} and position(${q(newC)} in ${field}) > 0;
  if n <> 1 then raise exception '${t.label}.${field}: the new clause is missing'; end if;` : ''}`).join('\n')}
end $$;

commit;
`;
emitMigration(MIGRATION, sql);
