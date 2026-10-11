#!/usr/bin/env node
/**
 * Varalakshmi: make the prose describe the mantras that are actually shown.
 *
 *   node scripts/build-varalakshmi-meanings.mjs          # validate
 *   node scripts/build-varalakshmi-meanings.mjs --emit   # write the migration
 *
 * THE FAULT. 0032 replaced the wording of fifteen Varalakshmi steps with the
 * Giri book's, and moved only the three mantra columns. meaning_en and
 * philosophy_en were left describing the StotraNidhi verses that had just been
 * deleted. So the Pradakshina step showed "sarvamangala laabhaaya ... namo'stu
 * naaleeka nibhaananaayai" over a paragraph translating "papo'ham
 * papakarmaham", and the Udvasanam's meaning opened with the Purusha Sukta
 * ("By sacrifice the gods sacrificed") above a two-line leave-taking that does
 * not contain it. Every gate passed: the fields were present, untruncated and
 * well-formed English. They were the wrong English.
 *
 * WHAT WAS AUDITED. Every one of the 31 steps, live, field by field: meaning_en
 * against mantra_translit; every phrase philosophy_en quotes, looked for in the
 * mantra; instruction_en and instruction_ta against the mantra and the archana
 * rows. Only what disagrees is changed. Steps whose meaning is a deliberate
 * summary of a longer mantra (Kalasha Pooja renders only the river verse, the
 * Sankalpam only its purpose clause) are summaries, not mismatches, and stay.
 *
 * WHAT IS NOT TOUCHED. No mantra. Two words in the Vayana Dhanam mantra read
 * as transcription slips (saumangalyavaaim, saadugunyam) and the meaning below
 * renders what they plainly mean, but correcting Devanagari is a job for a
 * pass that has the page open, not for a prose migration.
 *
 * EVERY QUOTED PHRASE IS CHECKED BY THE DATABASE. A philosophy that quotes the
 * mantra is only right while the mantra says it, which is exactly how these
 * went stale. So the migration asserts, for each quote, that the roman mantra
 * still contains it -- and fails, rolling back, if it does not.
 */
import { emitMigration } from './_migration.mjs';

const POOJA = 'varalakshmi_vratham';
const MIGRATION = 'supabase/migrations/0056_varalakshmi_meanings.sql';

// --- the corrections, step title -> field -> new text ------------------------
// Each carries the gist of what was wrong, for the migration's comments.
const FIX = [
  {
    step: 'Peeta Pooja',
    why: 'meaning was a "ten thousand suns" seat verse; the mantra is aneka ratnakhacitam',
    meaning_en:
      'Studded with many jewels: daughter of the ocean of milk, goddess, beloved of Hari, accept this golden throne. To Sri Varalakshmi, salutations: I offer the seat.',
  },
  {
    step: 'Dhyanam',
    why: 'meaning was the old one-verse dhyanam with its avahanam; the mantra is three verses. The instruction still had her being invited here, and the philosophy quoted "susthira bhava me gehe", which is not in it',
    meaning_en:
      'Lakshmi, daughter of the king of the ocean of milk, queen of the house of Sri Ranga, served by all the wives of the gods as their maids, the one small flame that lights the world, by whose gentle glance Brahma, Indra and Shiva gained their glory: I salute you, born of the lotus, mistress of the household of the three worlds, dear to Mukunda. She who sits on the lotus, broad-hipped, with eyes as long as lotus petals, deep-navelled, full-breasted, in a white upper cloth; Lakshmi, bathed by the great elephants of heaven from golden pots set with jewels; lotus in hand and joined with every auspiciousness: may she always live in my house. Seated on the lotus, lotus in hand, garlanded with lotuses, risen from the ocean of milk, shining the colour of milk and dressed in cloth as white as milk, beloved of Hari: with devotion I picture her in this lovely kalasham. In this kalasham I meditate on Sri Varalakshmi.',
    instruction_en:
      'Close your eyes and hold the form in mind as the three verses draw it: risen from the ocean of milk, seated on the lotus with a lotus in her hand, bathed by elephants from golden pots, dressed in white, dear to Hari. The last line pictures her in this kalasham; she is invited two steps later, once the thread is in place. Done once, on the first day only.',
    instruction_ta:
      'கண்களை மூடி, மூன்று ஸ்லோகங்களும் வர்ணிக்கும் வடிவத்தை மனதில் நிறுத்தவும் — பாற்கடலில் தோன்றியவள், தாமரையில் அமர்ந்து கையில் தாமரை ஏந்தியவள், யானைகளால் பொற்குடங்களில் நீராட்டப்படுபவள், வெண்ணிற ஆடை அணிந்தவள், ஹரிக்குப் பிரியமானவள். கடைசி வரி அவளை இந்தக் கலசத்தில் தியானிக்கிறது; சரடு வைக்கப்பட்ட பின், இரண்டு படிகள் கழித்து ஆவாஹனம் செய்யப்படுகிறது. இது முதல் நாளில் மட்டும் ஒரு முறை.',
    philosophy_en:
      'Mama vasatu grihe, "may she live in my house". The dhyanam asks for residence, not a visit, and asks it before she has even been invited. That is why the next day needs a step of its own to send her back: she was never asked to leave.',
    quotes: ['vasatu gṛhe'],
  },
  {
    step: 'Padyam, Arghyam & Achamaniyam',
    why: 'meaning paraphrased other verses and left out the madhuparkam; instruction and philosophy counted three courtesies where the mantra offers four',
    meaning_en:
      'Brought from the Ganga and the other rivers, with sandal and flowers: I give you water for the feet, goddess; be gracious, supreme mistress. Brought from the river Ganga and held in a golden pot: receive the arghyam I give, you who grant the blessing of sons and grandsons. Clear, cool water, you whose lotus face is serene: receive it to sip, beloved of the one whose banner is Garuda. Mahalakshmi, great goddess, joined with honey, ghee and curd: receive this madhuparkam, beloved of Madhusudana. To Sri Varalakshmi, salutations: I offer each in turn.',
    instruction_en:
      'The courtesies given to any guest who arrives on foot: water for the feet, water for the hands, water to sip, and then the madhuparkam, honey and curd with ghee. Pour a spoonful into the uddharani at each and empty it into the plate.',
    instruction_ta:
      'நடந்து வரும் விருந்தினருக்குச் செய்யும் உபசாரங்கள் — பாதம் கழுவ ஜலம், கை கழுவ ஜலம், பருக ஜலம், பின் தேனும் தயிரும் நெய்யும் கலந்த மதுபர்க்கம். ஒவ்வொன்றிலும் உத்தரிணியில் ஒரு ஸ்பூன் எடுத்து தாம்பாளத்தில் ஊற்றவும்.',
    philosophy_en:
      'The first three are older than any temple: they are what a household in a hot country did for anyone who reached the door. The madhuparkam, honey mixed with curd and ghee, is the honour beyond them, set before the guest the house most wished to receive. The pooja keeps all four unchanged.',
    quotes: ['madhuparkaṃ'],
  },
  {
    step: 'Panchamrita & Shuddhodaka Snanam',
    why: 'meaning had "you who dwell in the lotus" and a Ganga verse "on the head of Mahadeva"; philosophy quoted "ganga jalam maya anitam". None of it is in the mantra',
    meaning_en:
      'Milk and curd with ghee, together with sugar and honey: receive this bath of the five nectars, Varalakshmi; salutations to you. Clear water held in a golden pot, brought from the Ganga and the other rivers: receive it for your bath, goddess, daughter of the ocean. To Sri Varalakshmi, salutations: I offer the bath, and after the bath, water to sip.',
    philosophy_en:
      'Gangadi saridahritam, "brought from the Ganga and the other rivers". Whatever is actually in the vessel, the sentence says what it is being treated as, and the treating is the rite.',
    quotes: ['gaṅgādi saridāhṛtam'],
  },
  {
    step: 'Vastram, Abharanam & Mangalyam',
    why: 'meaning was the old cloth / ornament / heated-gold verses; instruction put the ornaments before the mangalyam, which the mantra offers second',
    meaning_en:
      'A fine pair of heavenly garments and a lovely bodice: Varalakshmi, great goddess, receive what I offer. Set with the auspicious gem, with pearls and coral: receive the mangalasutra given to you, beloved of Hari. You who are adorned with jewelled earrings, armlets, necklaces and bangles: receive these precious ornaments, treasury of compassion. To Sri Varalakshmi, salutations: I offer the cloth, the thread for the neck, and the ornaments.',
    instruction_en:
      'Offer the two cloths, then the mangalyam, then the ornaments. A small new blouse-piece and whatever gold the house has are what is usually used. This is the sequence that makes the kalasham a married woman of the household rather than a vessel.',
    instruction_ta:
      'இரண்டு வஸ்திரங்கள், பின் மாங்கல்யம், பின் ஆபரணங்கள் சமர்ப்பிக்கவும். பொதுவாக ஒரு புதிய ரவிக்கைத் துணியும், வீட்டில் உள்ள தங்க நகைகளும் பயன்படுத்தப்படுகின்றன. இந்த வரிசைதான் கலசத்தை ஒரு பாத்திரமாக அல்லாமல், வீட்டுச் சுமங்கலியாக ஆக்குகிறது.',
  },
  {
    step: 'Gandham, Akshatai & Pushpam',
    why: 'meaning was the old sandal / rice / flower verses; philosophy listed six flowers (jaji, champaka, shatapatra, kalhara) the mantra does not name',
    meaning_en:
      'Blended with camphor and sandal, with musk and kumkumam: receive today every fragrance, you who grant all that is auspicious. To Sri Varalakshmi, salutations: I apply the sandal, and over it I offer turmeric powder. Grains of rice, moon-white, glossy as pearls: receive these akshatai, goddess, beloved of the lotus-eyed one. With mandara, parijata and lotus, with ketaki, water-lily and patala, with jasmine, jati and vakula flowers I worship you. I offer the garland, and I worship you with flowers.',
    philosophy_en:
      'Mandara, parijata, lotus, ketaki, water-lily, patala, jasmine, jati, vakula. The verse names nine flowers, two of them from the gardens of heaven, and expects none of them in particular; it is a way of saying "the best that is in the garden".',
    quotes: ['mandārapārijātābjaiḥ', 'mallikā jāti vakulaiḥ'],
  },
  {
    step: 'Anga Pooja',
    why: 'instruction_ta said fourteen names and a fifteenth for the body; there are twenty-four',
    instruction_ta:
      'இருபத்து நான்கு நாமங்கள், ஒவ்வொன்றும் ஒரு அங்கத்தைக் குறிக்கும், பாதத்திலிருந்து சிரசு வரை; இருபத்து நான்காவது உடல் முழுவதற்கும். ஒவ்வொன்றிலும் ஒரு புஷ்பமோ சிறிது அக்ஷதையோ சமர்ப்பித்து, கலசத்தின் அல்லது படத்தின் அந்தந்த இடத்தைத் தொடவும்.',
  },
  {
    step: 'Dhoopam & Deepam',
    why: 'meaning was ten-ingredient incense and a darkness-destroying wick; the mantra is guggulu and aloe, and a lamp of three wicks',
    meaning_en:
      'I give you this pleasing incense, with guggulu and aloe: receive it, Mahalakshmi, who grant what your devotees wish. With ghee and three wicks, giver of all that is desired: receive this lamp, Kamala, and give me all that I long for. To Sri Varalakshmi, salutations: I offer the incense and show the lamp, and after them, water to sip.',
  },
  {
    step: 'Karpura Neerajanam',
    why: 'meaning was "the lamp is brought ... beloved of Vishnu"; the mantra is niraajanam nirajaskam',
    meaning_en:
      'This waving of light, without blemish, made by me with camphor: Lakshmi, I wave it before you, who light the worlds for ever. To Sri Varalakshmi, salutations: I show the camphor flame, and after it, water to sip.',
  },
  {
    step: 'Pushpanjali & Mantra Pushpam',
    why: 'meaning was the old dhyana verse and philosophy said "the same verse as the dhyanam"; the mantra is the jaati-champaka pushpanjali',
    meaning_en:
      'With jati, champaka, punnaga, jasmine, vakula and other flowers I offer you a double handful of flowers: receive it, beloved of Hari. To Sri Varalakshmi, salutations: I offer the mantra-flower; I offer the golden flower.',
    philosophy_en:
      'Jati, jasmine and vakula were each named at the Gandham step and offered there one at a time. Here they come back in a single handful from both palms. The worship that began by itemising ends by giving everything at once.',
    quotes: ['jātī caṃpaka', 'puṣpāñjaliṃ'],
  },
  {
    step: 'Pradakshina',
    why: 'meaning and philosophy translated "papo\'ham papakarmaham"; the mantra is sarvamangala laabhaaya ... namo\'stu naaleeka nibhaananaayai',
    meaning_en:
      'For the gaining of everything auspicious and the turning away of every wrong, I go round you today: be gracious, supreme goddess. Salutations to her whose face is like the lotus; salutations to the beloved of Narayana; salutations to her who was born of the ocean; salutations to Lakshmi, mother of the worlds. To Sri Varalakshmi, salutations: I offer circumambulation and prostration.',
    philosophy_en:
      'Sarvamangala labhaya, sarva papa nivrittaye, "for gaining every good, for the turning away of every wrong". The circuit asks for both in one breath, and it is recited while walking rather than sitting, so that the whole body does the asking and not only the voice.',
    quotes: ['sarvamaṅgala lābhāya', 'sarva pāpanivṛttaye'],
  },
  {
    step: 'Namaskaram & Varalakshmi Prarthana',
    why: 'meaning was "salutations to you, mother of the world" and philosophy argued from "lokajanani"; the mantra is aayuraarogyam aishvaryam and the royal courtesies',
    meaning_en:
      'Long life, health and prosperity, sons and grandsons, cattle and wealth, and the end of enemies: grant them, Mahalakshmi, treasury of compassion. The parasol and the fan, dance, song and music, and the rest: every courtesy, those within my means and those fit for a god, I offer to you.',
    philosophy_en:
      'Chhatra, chamara, nritta, gita, vadya: the parasol, the fan, dance, song and music, the honours of a royal court. No household has these to give, so they are offered in words. The prayer just before them is plain about what the household wants: long life, health, children and grandchildren, cattle and wealth.',
    quotes: ['cāmara', 'āyurārogyamaiśvaryaṃ'],
  },
  {
    step: 'Sharadu Dharanam',
    why: 'meaning asked for children and good fortune of "Rama"; the mantra receives the thread and ties it. Philosophy quoted "badhnami", the mantra says "badhniyam"',
    meaning_en:
      'Auspiciousness of all auspicious things, destroyer of every wrong: I receive this thread; be well pleased always. Of nine strands, with nine knots: let me tie this thread on my right hand, beloved of Hari.',
    philosophy_en:
      'Badhniyam dakshine haste, "let me tie it on the right hand". The verb is first person, because a vidhi text is written for whoever is reciting it; it is not a ruling that the tying must be done alone. In most Tamil households the husband ties it, with three knots, and the older women tie it for the girls. Nine knots were worshipped a moment ago and three are made now, and the two counts belong to different things: the nine are the thread, the three are the tying.',
    quotes: ['badhnīyāṃ dakṣiṇe haste', 'navagranthi'],
  },
  {
    step: 'Vayana Dhanam',
    why: 'meaning was a rubric about twelve cakes; philosophy quoted "indira pratigrihnatu indirayai dadati". The mantra is the seat, the hiranyagarbha verse, "indira pratigrihnati indira vai dadati" and the upayana formula',
    meaning_en:
      'This seat is for the brahmana, who stands here in the form of Varalakshmi; this sandal and the rest are honoured with every worship. The golden seed of fire, held within Hiranyagarbha, gives the fruit of endless merit: so grant me peace. Indira receives, and Indira indeed gives; Indira carries both across: salutations, salutations to Indira. This gift, with dakshina and with betel, I give to you, and it is no longer mine, desiring the full fruit of the Varalakshmi pooja, long and happy married life, the increase of good sons and grandsons, and the favour of Varalakshmi.',
    philosophy_en:
      'Indira pratigrihnati, indira vai dadati cha, "Lakshmi receives, and Lakshmi gives". The verse refuses to let either party be the superior one, which is the only way a gift between neighbours survives being ritualised.',
    quotes: ['indirā pratigṛhṇāti', 'na mama'],
  },
  {
    step: 'Ksheera Arghyam',
    why: 'meaning was a water-arghyam verse; the mantra is the sankalpa for the milk arghyam, and the verse itself lives in the archana row',
    meaning_en:
      'For the wearing away of every wrong I carry, for the pleasure of the supreme lord, and so that the fruit of the Varalakshmi pooja may be complete, I shall offer the arghyam of milk.',
    quotes: ['kṣīrārghyaṃ'],
  },
  {
    step: 'Udvasanam',
    why: 'meaning opened with the Purusha Sukta ("By sacrifice the gods sacrificed") and closed "peace, peace, peace"; the mantra is two lines of leave-taking',
    meaning_en:
      'From this vessel I return Sri Varalakshmi to her own place: for what is good, for well-being, and for her coming again.',
  },
];

// The Ksheera Arghyam verse is an archana row, and its meaning_en was the same
// stale water verse as the step's.
const ARCHANA_FIX = {
  step: 'Ksheera Arghyam',
  seq: 1,
  meaning_en:
    'Mixed with cow\'s milk, with sandal and flowers: receive this arghyam, goddess, giver of boons; Varalakshmi, salutations to you. To Sri Varalakshmi, salutations: this is the arghyam, this is the arghyam, this is the arghyam.',
};

const FIELDS = ['meaning_en', 'philosophy_en', 'instruction_en', 'instruction_ta'];

// --- validate ---------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };
const CITES_SOURCE = /\b(the book|this book|the edition|this edition|Bhavan|the author|the manual)\b/i;
const DEVA = /[ऀ-ॿ꣠-ꣿ]/;
const TAMIL = /[஀-௿]/;

let n = 0;
for (const f of FIX) {
  for (const k of FIELDS) {
    const v = f[k];
    if (v === undefined) continue;
    n++;
    const at = `${f.step}.${k}`;
    if (v !== v.trim()) fail(`${at}: leading or trailing whitespace`);
    if (/[ \t]{2,}/.test(v)) fail(`${at}: double space`);
    if (/\s+[.,;]/.test(v)) fail(`${at}: space before punctuation`);
    if (/\.\.\.|…/.test(v)) fail(`${at}: ellipsis`);
    if (/\r|\n/.test(v)) fail(`${at}: line break`);
    if (/[⁰¹²³⁴-⁹]/.test(v)) fail(`${at}: superscript numeral`);
    if (/\bperformers?\b/i.test(v)) fail(`${at}: says performer; this project says karta`);
    if (k.endsWith('_ta')) {
      if (!TAMIL.test(v)) fail(`${at}: Tamil prose with no Tamil`);
      if (DEVA.test(v)) fail(`${at}: Devanagari in Tamil prose`);
    } else {
      if (CITES_SOURCE.test(v)) fail(`${at}: cites the source`);
      if (DEVA.test(v) || TAMIL.test(v)) fail(`${at}: Indic script in English prose`);
    }
  }
  if (f.philosophy_en && !f.quotes?.length) fail(`${f.step}: a new philosophy with no quote check`);
}
// The prose-count gate in proofread reads all three English fields.
const anga = FIX.find((f) => f.step === 'Anga Pooja');
if (!/இருபத்து நான்கு/.test(anga.instruction_ta)) fail('Anga Pooja: Tamil does not say twenty-four');
if (/பதினான்கு|பதினைந்/.test(anga.instruction_ta)) fail('Anga Pooja: Tamil still counts fourteen or fifteen');

console.log(`${FIX.length} steps, ${n} fields, plus 1 archana row`);
for (const f of FIX) {
  console.log(`  ${f.step.padEnd(36)} ${FIELDS.filter((k) => f[k] !== undefined).join(', ')}`);
}
if (failed) { console.error('\nnot emitting'); process.exit(1); }
if (!process.argv.includes('--emit')) { console.log('\n(no SQL written; pass --emit)'); process.exit(0); }

// --- emit -------------------------------------------------------------------
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const out = [];
const o = (s = '') => out.push(s);
const KEY = (t) => `pooja_id = ${q(POOJA)} and step_title_en = ${q(t)}`;

o('-- =============================================================================');
o('-- 0056_varalakshmi_meanings.sql');
o('--');
o('-- GENERATED by scripts/build-varalakshmi-meanings.mjs. Do not hand-edit.');
o('--');
o('-- 0032 replaced the wording of fifteen Varalakshmi steps and moved only the');
o('-- mantra columns, so the meaning and philosophy of most of them went on');
o('-- describing verses that were no longer there. This rewrites, from the mantra');
o('-- actually shown, every reader-facing field that disagrees with it, and');
o('-- nothing else. No mantra changes.');
o('--');
o('-- Idempotent: each UPDATE writes only where the field differs from the new');
o('-- text, so a second run changes no rows. The assertions at the end fail the');
o('-- transaction if any step was not found or any quoted phrase has left its');
o('-- mantra.');
o('-- =============================================================================');
o();
o('begin;');
o();
for (const f of FIX) {
  o(`-- ${f.step}: ${f.why}.`);
  for (const k of FIELDS) {
    if (f[k] === undefined) continue;
    o(`update public.pooja_steps set ${k} = ${q(f[k])}, updated_at = now()`);
    o(` where ${KEY(f.step)}`);
    o(`   and ${k} is distinct from ${q(f[k])};`);
  }
  o();
}
o(`-- ${ARCHANA_FIX.step} archana ${ARCHANA_FIX.seq}: the verse is gokshirena yutam, not a water verse.`);
o(`update public.archana_items set meaning_en = ${q(ARCHANA_FIX.meaning_en)}`);
o(' where pooja_step_id = (select id from public.pooja_steps');
o(`                         where ${KEY(ARCHANA_FIX.step)})`);
o(`   and seq = ${ARCHANA_FIX.seq}`);
o(`   and meaning_en is distinct from ${q(ARCHANA_FIX.meaning_en)};`);
o();
o('-- --- assert ------------------------------------------------------------------');
o('do $$');
o('declare n int;');
o('begin');
o('  -- Every field landed, which also proves every step title was found.');
for (const f of FIX) {
  for (const k of FIELDS) {
    if (f[k] === undefined) continue;
    o(`  select count(*) into n from public.pooja_steps where ${KEY(f.step)} and ${k} = ${q(f[k])};`);
    o(`  if n <> 1 then raise exception ${q(`${f.step}.${k} was not written`)}; end if;`);
  }
}
o('  select count(*) into n from public.archana_items a join public.pooja_steps s on s.id = a.pooja_step_id');
o(`   where s.pooja_id = ${q(POOJA)} and s.step_title_en = ${q(ARCHANA_FIX.step)}`);
o(`     and a.seq = ${ARCHANA_FIX.seq} and a.meaning_en = ${q(ARCHANA_FIX.meaning_en)};`);
o(`  if n <> 1 then raise exception ${q(`${ARCHANA_FIX.step} archana meaning was not written`)}; end if;`);
o();
o('  -- Each phrase the new prose leans on is still in the mantra it describes.');
for (const f of FIX) {
  for (const needle of f.quotes ?? []) {
    o(`  select count(*) into n from public.pooja_steps where ${KEY(f.step)}`);
    o(`     and mantra_translit like ${q('%' + needle + '%')};`);
    o(`  if n <> 1 then raise exception ${q(`${f.step}: the mantra no longer says ${needle}`)}; end if;`);
  }
}
o();
o('  -- Still 31 steps; prose changes must not move anything.');
o(`  select count(*) into n from public.pooja_steps where pooja_id = ${q(POOJA)};`);
o(`  if n <> 31 then raise exception 'varalakshmi has % steps, expected 31', n; end if;`);
o('end $$;');
o();
o('commit;');

emitMigration(MIGRATION, out.join('\n') + '\n');
