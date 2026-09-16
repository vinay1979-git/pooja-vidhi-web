#!/usr/bin/env node
/**
 * philosophy_en for the eleven steps that had none.
 *
 *   node scripts/build-philosophy.mjs --emit > supabase/migrations/0014_philosophy.sql
 *
 * Ten are the plain upacharas of the Ganesha pooja -- the bell, the water, the
 * bath, the incense, the food -- which the original content skipped, probably
 * because they look like housekeeping next to the dhyana and the namavali. The
 * eleventh is the Varalakshmi Ghanta Pooja, which is null only because 0011
 * copied it from the Ganesha row while that row was still empty.
 *
 * REGISTER. These say what the rite is doing and why anyone would do it, in
 * terms a reader can check against the mantra on the same screen. They avoid
 * claims about what a step does to the body, because nothing here can support
 * one. Some of the original entries do make such claims -- Anga Vandanam
 * "invoking cosmic energies into specific nerve centres", Vighneshwara Dhyanam
 * "stimulates the nadis associated with memory and focus" -- and those are left
 * alone rather than quietly rewritten; changing existing content is the user's
 * call, not this script's.
 *
 * Each entry also avoids repeating the one written for the same upachara in the
 * other pooja. A reader doing both poojas should not meet the same paragraph.
 */

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const G = 'ganesha_standard';
const V = 'varalakshmi_vratham';

const BELL =
  'One sound doing two opposite jobs: agamartham tu devanam, gamanartham tu rakshasam, for the coming of the gods and the going of what should not be here. It is also the only part of the pooja the rest of the house can hear from another room, which is how everyone knows it has begun.';

const PHILOSOPHY = [
  [G, 'Sankalpam',
    'The sentence starts at the age of Brahma and narrows, kalpa by continent by country, until it arrives at this room on this morning. Nothing about the pooja changes because of it; what changes is that it has been placed. Note what is actually asked for: not gain, but that the wrong already gathered should fall away.'],

  [G, 'Ghanta Pooja', BELL],
  [V, 'Ghanta Pooja', BELL],

  [G, 'Avahanam & Asanam',
    'The turmeric was shaped a minute ago and it is not being made into a god. It is being asked to hold one, and the asking is the rite. The seat comes in the same breath as the invitation, because inviting someone to stand is not an invitation.'],

  [G, 'Padyam & Arghyam',
    'Feet, then hands, then mouth. That is the order you would actually use for someone who had walked to your door in the heat, and the pooja keeps it unchanged. Three spoonfuls of water is the whole of it.'],

  [G, 'Snanam & Vastram',
    'Akshatan samarpayami, "I offer rice in place of cloth". The rite names what it cannot supply and offers rice instead, and that is accepted. This is the substitution rule that makes the whole pooja possible in a flat with no silk and no river; it is stated here, at the least important step, and holds everywhere after.'],

  [G, 'Gandham, Kumkumam & Pushpam',
    'The first three upacharas that meet no need. Water, seat and bath are what a guest requires; sandal, kumkumam and flowers are only for the pleasure of it. A guest given only what they need has not been welcomed.'],

  [G, 'Dhoopam & Deepam',
    'Both are spent in the giving. Smoke cannot be gathered back and a flame cannot be re-offered, which sets them apart from the rice and the fruit, still there afterwards to be eaten. The line that follows is the tell: even after smoke, water is offered to rinse the mouth. The courtesy does not lapse because the offering was intangible.'],

  [G, 'Naivedyam',
    'The food is offered to the five breaths, not to a mouth: pranaya svaha, apanaya svaha, and so on. What is being fed is the life in the guest. The same five breaths are in the person holding the plate, which is why nothing is tasted until this step is done.'],

  [G, 'Karpura Neerajanam',
    'The one upachara that is shown rather than given, and then taken back. It is also where the household arrives: the bell goes, and people who were not in the room come to stand in it. Up to here the pooja belonged to whoever was reciting.'],

  [G, 'Mantra Pushpam & Namaskaram',
    'Pradakshina pade pade, "at every step of the going round". The verse does not say the wrong is forgiven for saying the verse; it is undone by the walking, step by step. The body is asked to do the work, which is why this is not performed sitting.'],
];

// ---------------------------------------------------------------------------
const problems = [];
const seen = new Set();
for (const [p, t, text] of PHILOSOPHY) {
  const k = `${p}|${t}`;
  if (seen.has(k)) problems.push(`duplicate: ${k}`);
  seen.add(k);
  if (!text || text.length < 80) problems.push(`${k}: too short to be worth showing`);
}
if (PHILOSOPHY.length !== 11) problems.push(`${PHILOSOPHY.length} entries, expected 11`);
// Two steps of the same name in different poojas may share text only when the
// step really is the shared one; everything else must read differently.
const byTitle = new Map();
for (const [, t, text] of PHILOSOPHY) {
  if (byTitle.has(t) && byTitle.get(t) !== text && t !== 'Ghanta Pooja') {
    problems.push(`${t}: two different texts for the same title`);
  }
  byTitle.set(t, text);
}
if (problems.length) { problems.forEach((x) => console.error('FAIL ' + x)); process.exit(1); }

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0014_philosophy.sql
--
-- GENERATED by scripts/build-philosophy.mjs. Do not hand-edit.
--
-- philosophy_en for the eleven steps that had none: the plain upacharas of the
-- Ganesha pooja, which the original content skipped, plus the Varalakshmi
-- Ghanta Pooja, which was null only because 0011 copied it from the Ganesha row
-- while that row was still empty.
--
-- After this, no step in either pooja is missing instruction, mantra where one
-- applies, meaning or philosophy.
--
-- Like the meanings, this is the project's own English and carries no
-- source_ref. Existing philosophy entries are NOT touched.
--
-- Idempotent.
-- =============================================================================

begin;
`);

for (const [p, t, text] of PHILOSOPHY) {
  out(`update public.pooja_steps set philosophy_en = ${q(text)}, updated_at = now()
where pooja_id = ${q(p)} and step_title_en = ${q(t)} and philosophy_en is null;`);
}

out(`
do $$
declare missing text;
begin
  select string_agg(pooja_id || ' / ' || step_title_en, ', ')
    into missing
    from public.pooja_steps
   where pooja_id in (${q(G)}, ${q(V)}) and philosophy_en is null;
  if missing is not null then
    raise exception 'steps left without philosophy_en: %', missing;
  end if;
end $$;

commit;

-- Verify:
--   select count(*) from pooja_steps where philosophy_en is null;   -- 0`);

console.error(`${PHILOSOPHY.length} entries: ${PHILOSOPHY.filter(([x]) => x === G).length} Ganesha, ${PHILOSOPHY.filter(([x]) => x === V).length} Varalakshmi`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
