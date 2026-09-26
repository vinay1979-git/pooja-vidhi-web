#!/usr/bin/env node
/**
 * The "why we do this" for the thirteen steps 0025 added.
 *
 *   node scripts/build-new-step-philosophy.mjs          # validate
 *   node scripts/build-new-step-philosophy.mjs --emit   # write it
 *
 * proofread.mjs blocked on these: every other step in both poojas carries a
 * philosophy_en and these thirteen did not. The viewer guards the block, so
 * nothing rendered broken -- the steps simply had no answer to "why am I doing
 * this", which on a screen that gives one everywhere else reads as an omission
 * rather than a silence.
 *
 * THIS IS THIS PROJECT'S OWN PROSE, not the book's. The book explains almost
 * nothing: it gives the mantra, the mudra and the substance, and assumes a
 * teacher for the rest. These are written from what the rite does, and they are
 * the least reviewed text in the app after the Tamil instructions. source_ref
 * says so.
 *
 * The register is set by the ones already there -- concrete, unsentimental,
 * explaining the act rather than praising it, and ending on the turn the step
 * makes. No step gets a paragraph of devotion it has not earned.
 */
import { emitMigration } from './_migration.mjs';

const PHILOSOPHY = {
  'Vighneshwara Sankalpam':
    'The pooja resolves twice, and this is the first. It is worth noticing that the two resolves are not the same sentence: this one asks only that the rite about to begin reach its end without obstruction, and the one later asks for everything the household actually wants. Splitting them is a kind of honesty about sequence. You do not ask for prosperity while the road is still blocked; you clear the road, and then you ask.',
  'Sakala Devata Vandanam':
    'Before the rite narrows to one deity it widens, once, to all of them — everything from the world of Brahma to the mountain at the edge of the worlds. It takes about four seconds and it is easy to treat as throat-clearing. It is not. A household pooja is a small, particular thing done in one room for one family, and this line places it inside something that is neither small nor particular before it begins.',
  'Deepa Pooja':
    'The lamp is lit first and then worshipped in its own right, which is the tell. It is not illumination for the deity to be seen by; the verse calls the flame Brahman and Janardana outright. Light is the first guest, not the lighting.',
  'Asana Pooja':
    'You consecrate the seat while sitting outside it, and only then take your place. Every other upachara in the pooja is offered to someone else. This one is offered to the ground under yourself, and it is asked of the earth rather than of a god — bear me, and make this seat pure. The performer is prepared like an object in the rite, because that is what he is about to become.',
  'Vighneshwara Pooja':
    'A complete pooja inside a pooja: invocation, sixteen upacharas, an archana, food and a light, done in miniature before the real one starts. The deity is a cone of turmeric and water, made in a minute and dissolved at the end, and the rite around it is not abridged for that. The point is that obstacles are not removed by asking in passing. You stop, you do the whole thing, and then you begin.',
  'Vighneshwara Shodasha Nama Archana':
    'Sixteen names and not one of them is a title. Fair-faced, single-tusked, tawny, elephant-eared, pot-bellied, formidable, curve-trunked, winnow-eared — every one describes a body. The archana does not tell the deity who he outranks; it tells him you have looked at him.',
  'Vighneshwara Naivedyam & Neerajanam':
    'The preliminary Ganesha is fed and shown a light, exactly as the main deity will be an hour later, and the fruit or piece of jaggery that goes to him is not a smaller category of offering. A guest invited for a short errand is still a guest.',
  'Vighneshwara Udvasanam':
    'He is sent back. This is the step most easily skipped and it is the one that makes the rest coherent: something was invoked into a cone of turmeric, and if the pooja simply moved on it would still be there. The turmeric is nudged north, the flowers offered to it are taken back onto your own head, and the invitation is formally closed. Nothing in a pooja is left standing.',
  'Shankha Pooja':
    'The conch is worshipped, not blown. Its water is what sanctifies everything else set out for the pooja, so it is treated as a vessel that holds the sacred waters of the three worlds rather than as an instrument. The book allows the step to be skipped if there is no conch in the house, which is worth reading twice: a household vidhi that expects to be performed by real households says plainly which parts require an object you may not own.',
  'Atma Pooja':
    'The one step in which the worshipper is the worshipped. You hold, for a few seconds, that the self inside you is the same as the one you are about to invoke into clay, and then you put akshatai on your own head. The verse is blunt about it: the body is the temple, the living self is the deity, and what you discard is not flowers but ignorance. Every other step points outward. This one turns around.',
  'Peetha Pooja':
    'The seat is built before the guest arrives, and built from the bottom of the cosmos upward — the power that holds everything, primordial nature, the first tortoise, the first boar, the earth, and only then the jewelled pavilion, the golden pillar, the white parasol, the wish-giving tree. Fourteen names to furnish a spot the size of a plate. The scale is the message.',
  'Guru Dhyanam':
    'The last human link before the divine one. It comes immediately before the deity is meditated on and invoked, and the placement is the argument: whatever is about to happen reaches you through someone who taught it to you, and through whoever taught them. The verse does not say the guru is like Brahma, Vishnu and Maheshwara. It says the guru is them.',
  'Upayana Danam':
    'The pooja ends by giving something away, and the words are careful about whose it was: Ganesha receives and Ganesha gives — I present this to you, and it is not mine. The gift goes to the priest if there is one and to an elder of the house if there is not, which means a household with no priest still performs the step. Nothing is kept back at the end, including the credit.',
};

const REF =
  'Written for this project from what the step does, not taken from a source. The book gives the mantra, the mudra and the substance and assumes a teacher for the rest, so it explains almost nothing; this is the least reviewed prose in the app after the Tamil instructions and should be read as sceptically.';

let failed = false;
console.log('--- building ---\n');
for (const [step, text] of Object.entries(PHILOSOPHY)) {
  if (text.length < 180) {
    failed = true;
    console.error(`  FAIL ${step}: ${text.length} chars, too thin to be worth showing`);
  }
  // The register is prose, not a list of epithets, and not a quotation.
  if (/^["“]/.test(text)) {
    failed = true;
    console.error(`  FAIL ${step}: starts with a quote mark; the viewer adds its own`);
  }
  console.log(`  ${step.padEnd(38)} ${String(text.length).padStart(4)} chars`);
}
if (failed) {
  console.error('\nRefusing to emit.');
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0027_new_step_philosophy.sql');
out('--');
out('-- GENERATED by scripts/build-new-step-philosophy.mjs. Do not hand-edit.');
out('--');
out('-- proofread.mjs blocked on the thirteen steps 0025 added: every other step in');
out('-- both poojas carries a philosophy_en and these did not. The viewer guards the');
out('-- block so nothing rendered broken -- the steps simply had no answer to "why am');
out('-- I doing this", which on a screen that gives one everywhere else reads as an');
out('-- omission rather than a silence.');
out('--');
out('-- This is the project’s own prose. The book gives the mantra, the mudra and the');
out('-- substance and assumes a teacher for the rest.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();
for (const [step, text] of Object.entries(PHILOSOPHY)) {
  out(`update public.pooja_steps set philosophy_en = ${q(text)},`);
  // The provenance goes into the row, not into a console line. A step whose
  // source_ref cites a printed book while a paragraph of unsourced prose sits
  // underneath it is exactly the kind of quiet overclaim this project's
  // source_ref discipline exists to prevent.
  out(`  source_ref = source_ref || ${q(` ${REF}`)},`);
  out('  updated_at = now()');
  out(` where pooja_id = 'ganesha_standard' and step_title_en = ${q(step)}`);
  out(`   and position(${q(REF.slice(0, 40))} in source_ref) = 0;`);
}
out();
out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard'");
out("     and (philosophy_en is null or btrim(philosophy_en) = '');");
out("  if n > 0 then raise exception '% Ganesha steps still have no philosophy_en', n; end if;");
out('  -- No two steps IN THE SAME POOJA may share it: a copy-paste there is');
out('  -- invisible on screen. Across poojas sharing is correct and deliberate --');
out('  -- the purvangam belongs to the act, not the deity, so Achamanam, Anga');
out('  -- Vandanam, Vighneshwara Dhyanam, Pranayamam, Ghanta Pooja and Kalasha Pooja');
out('  -- each carry one explanation used by both. The first version of this check');
out('  -- was unscoped and failed on exactly those six.');
out('  select count(*) into n from (');
out('    select pooja_id, philosophy_en from public.pooja_steps');
out('     where philosophy_en is not null group by 1, 2 having count(*) > 1) x;');
out("  if n > 0 then raise exception '% philosophy texts are shared within one pooja', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0027_new_step_philosophy.sql', sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
