#!/usr/bin/env node
/**
 * Give every rite a few lines on why it is kept at all.
 *
 *   node scripts/build-why-we-do-it.mjs          # validate
 *   node scripts/build-why-we-do-it.mjs --emit   # write it
 *
 * The app explains every STEP and has never explained the RITE. A reader could
 * learn why the seat is consecrated before you sit on it and still not know why
 * anyone keeps the Varalakshmi vratham, or what the panchayatana arrangement is
 * answering. The step philosophy is the close reading; this is the thing you
 * would say if someone asked at the door.
 *
 * WHERE THE CONTENT COMES FROM. Each of these books opens its chapter with
 * exactly this, and the prose below is written FROM those pages rather than
 * copied off them -- the English in all three is the editor's, and this project
 * has taken the mantras and written its own explanations since the Ganesha
 * corrections.
 *
 *   Varalakshmi   book pp.110-112. 'Sri' in the Rigveda as the basic goods of a
 *                 life; Shiva and Parvati at dice; Chitranemi's curse;
 *                 Charumati and Shyama Bala.
 *   Ganesha       book p.52. Adipujya, first worship by the consent of all the
 *                 deities; the boy fashioned from turmeric paste.
 *   Nitya         book p.27. The placement verse -- Shankara in the centre,
 *                 Sripati north-east, Surya south-east, Parvati's son
 *                 south-west, Bhavani north-west.
 *
 * FOUR TO SIX SENTENCES, checked below. Longer and nobody reads it before a
 * pooja; shorter and it says nothing the one-line description did not.
 *
 * The four planned nitya karmas are NOT here. They have no steps, no prep
 * screen and nowhere to show this, and writing it before transcribing the rite
 * would be writing about a book I have not read yet.
 */
import { emitMigration } from './_migration.mjs';

const WHY = [
  {
    id: 'ganesha_standard',
    en:
      'Ganesha is Adipujya, the first to be worshipped, and the book is careful to say the ' +
      'position was given to him by the other deities rather than taken. So a Ganesha pooja is ' +
      'what you do before the thing you actually came to do: before a vratham, before a journey, ' +
      'before anything begun for the first time. He removes obstacles, and the older texts are ' +
      'equally clear that he places them, which is why the rite asks rather than instructs. ' +
      'Most households invoke him not in a bronze but in a cone of turmeric paste made that ' +
      'morning — the same substance Parvati is said to have fashioned him from — and send him ' +
      'off again at the end. Nothing is kept. What is asked for is a clear road, not a favour.',
    ta:
      'கணபதி ஆதிபூஜ்யர் — முதலில் வணங்கப்பட வேண்டியவர். அந்த இடத்தை அவர் பிடித்துக் கொள்ளவில்லை, ' +
      'மற்ற தேவர்களே ஒருமித்து அளித்தனர் என்பதை நூல் தெளிவாகச் சொல்கிறது. எனவே எந்த ஒரு ' +
      'முக்கியமான செயலுக்கும் — விரதம், பயணம், புதிய தொடக்கம் — அதற்கு முன் செய்யப்படுவது இந்தப் ' +
      'பூஜை. விக்னங்களை நீக்குபவர் அவரே; அவற்றை வைப்பவரும் அவரே என்பதால், இந்த வழிபாடு ' +
      'கட்டளையிடுவதில்லை, வேண்டுகிறது. பெரும்பாலான வீடுகளில் அன்றைக்கே பிசைந்த மஞ்சள் ' +
      'பிள்ளையாரில் ஆவாஹனம் செய்து, இறுதியில் உத்வாசனம் செய்து விடுகிறார்கள். எதுவும் ' +
      'வைத்துக்கொள்ளப்படுவதில்லை. கேட்கப்படுவது வரம் அல்ல — தடையற்ற வழி.',
  },
  {
    id: 'varalakshmi_vratham',
    en:
      'The Rigveda uses one word, Sri, for the things a life needs to go well: enough food, a ' +
      'steady mind, a house worth living in, and standing among the people around you. Lakshmi ' +
      'is that word personified, which is why this vratham is a household observance rather than ' +
      'a temple one — it is kept for the house, by the women of the house, who the book says are ' +
      'looked upon as Lakshmi already. It falls on the Friday before the Shravana full moon. The ' +
      'goddess is invited into a kalasham dressed as her, worshipped through the day, and a ' +
      'nine-knotted turmeric thread is tied on the wrist so that the vow is something you can ' +
      'see. The stories the book tells to explain it — Charumati, and Shyama Bala whose mother ' +
      'insulted an old woman at the door — all turn on the same point: prosperity arrives where ' +
      'it is treated as a guest rather than a possession.',
    ta:
      'நல்ல வாழ்க்கைக்குத் தேவையான அனைத்தையும் — உணவு, மன நிறைவு, வாழத் தகுந்த இல்லம், ' +
      'சமூகத்தில் மதிப்பு — ரிக் வேதம் "ஸ்ரீ" என்ற ஒரே சொல்லால் குறிக்கிறது. அந்தச் சொல்லின் ' +
      'உருவமே லக்ஷ்மி. அதனால்தான் இது கோயில் வழிபாடு அல்ல, இல்லத்து விரதம் — வீட்டுக்காக, ' +
      'வீட்டுப் பெண்களால் அனுஷ்டிக்கப்படுவது; அவர்களே லக்ஷ்மியின் வடிவம் என்று நூல் கூறுகிறது. ' +
      'ஶ்ராவண பௌர்ணமிக்கு முந்தைய வெள்ளிக்கிழமை இது கொண்டாடப்படுகிறது. தாயாரை அலங்கரித்த ' +
      'கலசத்தில் ஆவாஹனம் செய்து நாள் முழுவதும் வழிபட்டு, ஒன்பது முடிச்சுகளிட்ட மஞ்சள் ' +
      'நோன்புக் கயிறு கையில் கட்டப்படுகிறது — விரதம் கண்ணுக்குத் தெரியும் வகையில். சாருமதி, ' +
      'ஶ்யாமபாலா ஆகியோரின் கதைகள் ஒரே கருத்தைச் சொல்கின்றன: செல்வத்தை உடைமையாக அல்ல, ' +
      'விருந்தாளியாக நடத்தும் இடத்திலேயே அது தங்குகிறது.',
  },
  {
    id: 'nitya_panchayatana',
    en:
      'This is the rite of an ordinary morning, and its shape is an argument. Instead of one ' +
      'god it worships five — Shiva at the centre, Vishnu to the north-east, Surya to the ' +
      'south-east, Vinayaka to the south-west and Devi to the north-west — and the household ' +
      'puts its own chosen deity in the middle, so the arrangement holds whichever that is. ' +
      'That is the Smartha answer to sectarian quarrel: none of the five outranks the others, ' +
      'and the one you love most is placed at the centre without the other four being demoted. ' +
      'It has no date because it has no occasion; the occasion is that it is morning. What it ' +
      'is for is not a request at all — it is the household beginning its day at its own altar ' +
      'rather than at its own business.',
    ta:
      'இது ஒரு சாதாரண காலைப் பொழுதின் வழிபாடு; ஆனால் அதன் அமைப்பே ஒரு கருத்தைச் சொல்கிறது. ' +
      'ஒரு தெய்வம் அல்ல, ஐந்து தெய்வங்கள் — நடுவில் சிவன், ஈஶான்யத்தில் விஷ்ணு, ஆக்னேயத்தில் ' +
      'சூரியன், நைருதியில் விநாயகர், வாயுவ்யத்தில் தேவி. வீட்டாரின் இஷ்ட தெய்வம் எதுவோ அதுவே ' +
      'நடுவில் வைக்கப்படும்; அமைப்பு மாறுவதில்லை. மத வேறுபாடுகளுக்கு ஸ்மார்த்த மரபு தரும் ' +
      'பதில் இதுதான் — ஐவரில் எவரும் உயர்ந்தவர் அல்ல, நமக்குப் பிடித்தவரை நடுவில் வைத்தாலும் ' +
      'மற்ற நால்வரும் தாழ்த்தப்படுவதில்லை. இதற்குத் திதியோ நாளோ இல்லை; காலை விடிந்ததே ' +
      'காரணம். இது ஏதோ ஒன்றைக் கேட்பதற்கானது அல்ல — நாளை வியாபாரத்தில் அல்ல, ' +
      'வீட்டுப் பூஜையறையில் தொடங்குவதற்கானது.',
  },
];

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 2).length;

console.log('--- why we do it ---');
const seenEn = new Set();
for (const w of WHY) {
  const n = sentences(w.en);
  console.log(`  ${w.id.padEnd(22)} ${String(w.en.length).padStart(4)} ch en / ${String(w.ta.length).padStart(4)} ch ta   ${n} sentences`);
  if (seenEn.has(w.en)) fail(`${w.id}: duplicates another rite's text`);
  seenEn.add(w.en);
  // Long enough to say something, short enough to read before a pooja.
  if (n < 4 || n > 7) fail(`${w.id}: ${n} sentences; wanted four to seven`);
  if (w.en.length < 350) fail(`${w.id}: English is too short to be worth a section`);
  if (!/[஀-௿]/.test(w.ta)) fail(`${w.id}: Tamil is not Tamil`);
  // The gate that caught an earlier fault project-wide. The visarga is not a
  // colon, and prose has no business carrying one either way.
  if (/[ऀ-ॿ]/.test(w.en)) fail(`${w.id}: English carries Devanagari`);
  if (/\bperformer\b/i.test(w.en)) fail(`${w.id}: says "performer"; this project says karta`);
}
if (WHY.length !== 3) fail(`expected the three published poojas, have ${WHY.length}`);
if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0044_why_we_do_it.sql');
out('--');
out('-- GENERATED by scripts/build-why-we-do-it.mjs. Do not hand-edit.');
out('--');
out('-- The app has explained every STEP since 0014 and has never explained the RITE.');
out('-- A reader could learn why the seat is consecrated before you sit on it and');
out('-- still not know why anyone keeps the Varalakshmi vratham. The step philosophy');
out('-- is the close reading; this is what you would say if someone asked at the door.');
out('--');
out('-- Written FROM the books rather than copied off them -- the English in all three');
out('-- is the editor\'s. Varalakshmi from book pp.110-112, Ganesha from p.52, the');
out('-- daily rite from p.27 and its placement verse.');
out('--');
out('-- The four PLANNED nitya karmas are deliberately absent. They have no steps, no');
out('-- preparation screen and nowhere to show this, and writing it before the rite is');
out('-- transcribed would be writing about a book nobody has read yet.');
out('-- =============================================================================');
out();
out('begin;');
out();
out('alter table public.poojas');
out('  add column if not exists why_en text,');
out('  add column if not exists why_ta text;');
out();
out('comment on column public.poojas.why_en is');
out(`  ${q('Four to seven sentences on why the rite is kept at all: purpose, the idea behind its shape, and what it is for. Pooja-level, distinct from pooja_steps.philosophy_en which explains one step.')};`);
out();
for (const w of WHY) {
  out('update public.poojas set');
  out(`       why_en     = ${q(w.en)},`);
  out(`       why_ta     = ${q(w.ta)},`);
  out('       updated_at = now()');
  out(` where id = ${q(w.id)};`);
  out();
}
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- Every PUBLISHED pooja has both. Planned ones must not: nothing shows it.');
out('  select count(*) into n from public.poojas');
out("   where status = 'published'");
out("     and (coalesce(trim(why_en), '') = '' or coalesce(trim(why_ta), '') = '');");
out("  if n <> 0 then raise exception '% published pooja(s) have no why text', n; end if;");
out();
out('  select count(*) into n from public.poojas');
out("   where status = 'planned' and coalesce(trim(why_en), '') <> '';");
out("  if n <> 0 then raise exception '% planned pooja(s) carry why text with nowhere to show it', n; end if;");
out();
out('  -- No two rites share it. One template filled three times is how the five');
out('  -- nitya archanas ended up with one paragraph between them; see 0040.');
out('  select count(distinct why_en) into n from public.poojas where why_en is not null;');
out("  if n <> 3 then raise exception 'the why texts are not distinct: % of 3', n; end if;");
out();
out('  -- Tamil is Tamil, and English is not Devanagari.');
out("  select count(*) into n from public.poojas where why_ta is not null and why_ta !~ '[஀-௿]';");
out("  if n <> 0 then raise exception '% why_ta value(s) carry no Tamil', n; end if;");
out("  select count(*) into n from public.poojas where why_en ~ '[ऀ-ॿ]';");
out("  if n <> 0 then raise exception '% why_en value(s) carry Devanagari', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0044_why_we_do_it.sql', sql);
  console.log('\nwrote supabase/migrations/0044_why_we_do_it.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
