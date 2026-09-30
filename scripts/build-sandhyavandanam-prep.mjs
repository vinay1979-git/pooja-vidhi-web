#!/usr/bin/env node
/**
 * What to set out for the sandhyavandanam, and why it is kept at all.
 *
 *   node scripts/build-sandhyavandanam-prep.mjs          # validate
 *   node scripts/build-sandhyavandanam-prep.mjs --emit   # write it
 *
 * The last two things proofread wanted after 0049: samagri, and the
 * "why we do it" text every published pooja carries.
 *
 * THE SAMAGRI IS THE BOOK'S OWN LIST, book pages 7 and 8, items 1 to 10. The
 * book splits its list at item 11 and says so -- "additional items required for
 * Samidaadhanam and other homams" -- so the kundam, the samidha sticks, the
 * darba and the fire-making materials belong to the Samidadhanam placeholder
 * and not here.
 *
 * TWO ITEMS ARE OPTIONAL AND BOTH ARE LEARNING AIDS: a recording and a booklet
 * of instructions. Everything else is an object you hold. Marked not-required
 * so the checklist does not tell a beginner they cannot start without a CD --
 * and worth noticing that item 10, "Sandhyavandanam text with instructions
 * booklet", is a fair description of this app. It is item 10, not a replacement
 * for items 1 to 9.
 *
 * THE UNDERLINED PREFERENCE is the book's own convention and the schema already
 * models it: "silver, copper, brass or five metals (underlined preferred)".
 *
 * THERE IS NO note COLUMN ON samagri_items. The first draft of this generator
 * invented one and would have failed at run time. The columns are id, pooja_id,
 * seq, item_en, item_ta, quantity, category, is_required, is_substitutable and
 * substitute_with -- that is all. The book's qualifications therefore ride in
 * `quantity`, which is already free text elsewhere ("1 set", "2 to 3", "7 to
 * 8"), and the alternatives in substitute_with where they belong.
 *
 * That is the 0033 lesson for the third time, and the third time it was caught
 * by looking at an existing row rather than by remembering.
 */
import { emitMigration } from './_migration.mjs';

const POOJA = 'sandhyavandanam';
const SRC = 'Yajurveda Trikaala Sandhyaavandanam (Giri), pp.7-8';

const SAMAGRI = [
  {
    en: 'Panchapatram', ta: 'பஞ்ச பாத்திரம்', qty: '1',
    qty2: 'silver preferred', cat: 'vessel',
    sub: 'copper, brass or panchaloha',
  },
  {
    en: 'Uddharani (Aachamani)', ta: 'உத்தரிணி', qty: '1',
    qty2: 'the spoon', cat: 'vessel',
    sub: 'copper or brass',
  },
  {
    en: 'Theertha patram (thambalam)', ta: 'தீர்த்த பாத்திரம் (தாம்பாளம்)', qty: '1',
    qty2: '10 to 12 inches across', cat: 'vessel',
    sub: 'copper or brass',
  },
  {
    en: 'Aasanam', ta: 'ஆசனம்', qty: '1',
    qty2: 'wood, wool or jute', cat: 'core',
    sub: null,
  },
  {
    en: 'Jalapatram', ta: 'ஜல பாத்திரம்', qty: '1',
    qty2: 'for the spare water', cat: 'vessel',
    sub: 'any vessel that holds enough',
  },
  {
    en: 'Yajnopaveetam (poonal)', ta: 'யஜ்ஞோபவீதம் (பூணூல்)', qty: '1',
    qty2: 'the sacred thread', cat: 'core',
    sub: null,
  },
  {
    en: 'Vastram (dhoti)', ta: 'வஸ்திரம் (வேஷ்டி)', qty: '1',
    qty2: 'cream or white; 2 yards brahmachari, 4 grihastha', cat: 'core',
    sub: null,
  },
  {
    en: 'Upavastram (uttareeyam)', ta: 'உபவஸ்திரம் (உத்தரீயம்)', qty: '1',
    qty2: 'the upper cloth', cat: 'core',
    sub: null,
  },
  {
    en: 'A recording of the mantras', ta: 'மந்திரங்களின் ஒலிப்பதிவு', qty: '1', optional: true,
    qty2: 'for the svaras', cat: 'core',
    sub: 'a teacher, whom the book names first',
  },
  {
    en: 'A printed sandhyavandanam text', ta: 'அச்சிடப்பட்ட ஸந்த்யாவந்தன நூல்', qty: '1', optional: true,
    qty2: 'or this app', cat: 'core',
    sub: null,
  },
];

const WHY_EN =
  'Sandhya means the junctures — the seams of the day where night turns to morning, morning to ' +
  'afternoon, afternoon to night — and this is the rite kept at each of them. It is nitya: there ' +
  'is no occasion and no date, which is why its resolution names no year, month, tithi or star, ' +
  'only which of the three sittings you are in. The centre of it is eight words, and the book ' +
  'says so plainly: that sun is Brahman, I am Brahman. Everything before that prepares the ' +
  'reciter and everything after it worships, and it is that identification which keeps the rest ' +
  'from being sun-worship — the water poured toward the sun, the Gayatri repeated a hundred and ' +
  'eight times, the sun looked at through locked fingers at noon. Each sitting also cleans the ' +
  'stretch of time behind it: the morning absolves the night, the evening absolves the day, and ' +
  'the whole rite ends by asking Savitr for children, for bad dreams to stop, and for whatever ' +
  'is good.';

const WHY_TA =
  'ஸந்தி என்பது பகலும் இரவும் சந்திக்கும் இணைப்பு வேளை — இரவு காலையாகும் இடம், காலை உச்சியாகும் இடம், ' +
  'உச்சி மாலையாகும் இடம். அந்த மூன்று வேளைகளிலும் செய்யப்படும் வழிபாடே இது. இது நித்யம்: இதற்குத் ' +
  'தனிச் சந்தர்ப்பமோ திதியோ இல்லை. அதனால்தான் இதன் ஸங்கல்பத்தில் வருடமோ மாதமோ திதியோ நட்சத்திரமோ ' +
  'சொல்லப்படுவதில்லை; எந்த வேளை என்பது மட்டுமே சொல்லப்படுகிறது. இதன் மையம் எட்டே சொற்கள் — அந்த ' +
  'சூரியனே ப்ரம்மம், நானும் ப்ரம்மமே. அதற்கு முன் உள்ளவை சொல்பவரைத் தயார்படுத்துகின்றன, அதற்குப் ' +
  'பின் உள்ளவை வழிபடுகின்றன. அந்த ஒன்றுபடுத்தலே மற்றவற்றைச் சூரிய வழிபாடாக மட்டும் இருக்கவிடாமல் ' +
  'காக்கிறது. ஒவ்வொரு வேளையும் தனக்கு முந்தைய காலத்தைச் சுத்தி செய்கிறது: காலை இரவையும், மாலை ' +
  'பகலையும். இறுதியில் ஸவிதாவிடம் சந்ததி, தீய கனவுகள் நீங்குதல், நன்மை ஆகியவை வேண்டப்படுகின்றன.';

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- samagri ---');
SAMAGRI.forEach((x, i) => {
  console.log(`  ${String(i + 1).padStart(2)}  ${x.en.padEnd(34)} ${x.optional ? 'optional' : 'required'}`);
  for (const f of ['en', 'ta', 'qty', 'qty2', 'cat']) {
    if (!x[f] || !String(x[f]).trim()) fail(`${x.en}: ${f} is empty`);
  }
  if (!/[஀-௿]/.test(x.ta)) fail(`${x.en}: Tamil name is not Tamil`);
});
if (SAMAGRI.length !== 10) fail(`expected the book's ten items, have ${SAMAGRI.length}`);
if (SAMAGRI.filter((x) => x.optional).length !== 2) fail('exactly two items are optional in the book');

console.log('--- why we do it ---');
const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 2).length;
console.log(`  ${WHY_EN.length} ch en, ${WHY_TA.length} ch ta, ${sentences(WHY_EN)} sentences`);
if (sentences(WHY_EN) < 4 || sentences(WHY_EN) > 7) {
  fail(`why_en has ${sentences(WHY_EN)} sentences; wanted four to seven`);
}
if (!/[஀-௿]/.test(WHY_TA)) fail('why_ta is not Tamil');
if (/[ऀ-ॿ꣠-ꣿ]/.test(WHY_EN)) fail('why_en carries Devanagari');
if (/\bperformer\b/i.test(WHY_EN)) fail('why_en says "performer"; this project says karta');
if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0050_sandhyavandanam_prep.sql');
out('--');
out('-- GENERATED by scripts/build-sandhyavandanam-prep.mjs. Do not hand-edit.');
out('--');
out('-- The last two things proofread wanted after 0049: samagri, and the');
out('-- "why we do it" text every published pooja carries.');
out('--');
out('-- THE SAMAGRI IS THE BOOK\'S OWN LIST, book pages 7 and 8, items 1 to 10. The');
out('-- book splits its list at item 11 and says so -- "additional items required for');
out('-- Samidaadhanam and other homams" -- so the kundam, the samidha sticks and the');
out('-- fire-making materials belong to the Samidadhanam placeholder, not here.');
out('--');
out('-- Two items are optional and both are learning aids: a recording, because the');
out('-- svaras cannot be learnt from a page, and a printed text. Marked not-required');
out('-- so the checklist does not tell a beginner they cannot start without a CD.');
out('-- Item 10 is, fairly read, this app -- which makes it item 10 rather than a');
out('-- replacement for items 1 to 9.');
out('--');
out('-- NO NAIVEDYAM, and that is not an omission. Sandhyavandanam offers water and');
out('-- nothing else; there is no naivedyam anywhere in its forty-five steps.');
out('-- proofread used to demand naivedyam of every pooja, which was true of the');
out('-- three it had; it now asks only of a rite that has a step offering it.');
out('-- =============================================================================');
out();
out('begin;');
out();
out(`delete from public.samagri_items where pooja_id = ${q(POOJA)};`);
out();
SAMAGRI.forEach((x, i) => {
  out('insert into public.samagri_items');
  out('  (pooja_id, seq, item_en, item_ta, quantity, category, is_required, is_substitutable, substitute_with)');
  out('values');
  out(`  (${q(POOJA)}, ${i + 1}, ${q(x.en)}, ${q(x.ta)}, ${q(x.qty + ' — ' + x.qty2)}, ${q(x.cat)},`);
  out(`   ${x.optional ? 'false' : 'true'}, ${x.sub ? 'true' : 'false'}, ${q(x.sub)});`);
});
out();
out('update public.poojas set');
out(`       why_en     = ${q(WHY_EN)},`);
out(`       why_ta     = ${q(WHY_TA)},`);
out(`       source_ref = ${q(SRC)},`);
out('       updated_at = now()');
out(` where id = ${q(POOJA)};`);
out();
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.samagri_items where pooja_id = ${q(POOJA)};`);
out(`  if n <> ${SAMAGRI.length} then raise exception 'expected ${SAMAGRI.length} samagri items, found %', n; end if;`);
out();
out('  select count(*) into n from public.samagri_items');
out(`   where pooja_id = ${q(POOJA)} and item_ta !~ '[஀-௿]';`);
out("  if n > 0 then raise exception '% samagri item(s) carry no Tamil', n; end if;");
out();
out('  -- Exactly two optional, and both are learning aids rather than implements.');
out('  select count(*) into n from public.samagri_items');
out(`   where pooja_id = ${q(POOJA)} and is_required = false;`);
out("  if n <> 2 then raise exception 'expected 2 optional items, found %', n; end if;");
out();
out('  -- Seq dense from 1, which the checklist relies on.');
out('  select count(*) into n from (');
out('    select seq, row_number() over (order by seq) as rn');
out(`      from public.samagri_items where pooja_id = ${q(POOJA)}`);
out('  ) t where t.seq <> t.rn;');
out("  if n > 0 then raise exception '% samagri item(s) are not numbered 1..n', n; end if;");
out();
out('  select count(*) into n from public.poojas');
out(`   where id = ${q(POOJA)} and coalesce(trim(why_en), '') <> '' and coalesce(trim(why_ta), '') <> '';`);
out("  if n <> 1 then raise exception 'sandhyavandanam has no why text'; end if;");
out();
out('  -- Every published pooja now has one. This is the state proofread wants.');
out('  select count(*) into n from public.poojas');
out("   where status = 'published' and (coalesce(trim(why_en), '') = '' or coalesce(trim(why_ta), '') = '');");
out("  if n <> 0 then raise exception '% published pooja(s) still have no why text', n; end if;");
out();
out('  -- No two rites share it; see 0040 for why this is checked.');
out('  select count(distinct why_en) into n from public.poojas where why_en is not null;');
out("  if n <> 4 then raise exception 'the why texts are not distinct: % of 4', n; end if;");
out();
out('  -- And it still offers no naivedyam, which is correct for this rite.');
out(`  select count(*) into n from public.naivedyam_items where pooja_id = ${q(POOJA)};`);
out("  if n <> 0 then raise exception 'sandhyavandanam should have no naivedyam, found %', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0050_sandhyavandanam_prep.sql', sql);
  console.log('\nwrote supabase/migrations/0050_sandhyavandanam_prep.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
