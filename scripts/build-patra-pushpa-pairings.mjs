#!/usr/bin/env node
/**
 * The twenty-one leaves and the twenty-one flowers, checked against the book.
 *
 *   node scripts/build-patra-pushpa-pairings.mjs          # validate + diff
 *   node scripts/build-patra-pushpa-pairings.mjs --emit   # write it
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), pp.63-65, ekavimshati
 * patrapoojaa and ekavimshati puSHpapoojaa.
 *
 * THE OPEN QUESTION THIS CLOSES.
 *
 * docs/sources.md has carried this for weeks: "The 21 leaves are paired with 21
 * names. 14 of the 21 pairs alliterate, which suggests the pairing is intended
 * and that the other 7 may be mismatched."
 *
 * The book settles it, and the answer is more interesting than either yes or
 * no. The alliteration IS the design -- the book pairs kapila with karaveera,
 * amala with aamalakee, arjunadanta with arjuna, bhRngaraajatkaTa with
 * bhRngaraaja, viSHNustuta with viSHNukraanta. But only ONE of the seven
 * non-alliterating pairs is an error in this app. The other six alliterate in
 * neither list: umaaputra/maachee, hEramba/bRhatee, lambOdara/bilva,
 * dvaimaatura/tulasee, gajaanana/jaatee and Ekadanta/daaDimee are paired that
 * way in the book too, deliberately.
 *
 * So the hypothesis was right about the principle and wrong about the count.
 * Six of the seven are correct as they stand. The seventh is:
 *
 *     bhRngaraajatkaTaaya namaha -> ashvattha patram        (this app)
 *     bhRngaraajatkaTaaya namaha -> bhRngaraaja patram      (the book)
 *
 * A name that means "he whose matted hair is the bhringaraja" was being given a
 * peepal leaf.
 *
 * FOUR MORE DIFFERENCES the comparison turned up, none of which alliteration
 * would have caught:
 *
 *   dhoomakEtu   app dhattoora    book durdhoora   (same plant, both are Datura)
 *   sindhura     app sindhuvaara  book sindhoora
 *   gaNDagalanmada  app gaNDavee  book gaNDalee
 *   shankarapriya                 book shankareepriya
 *
 * and the ORDER: the app has Ekadanta/daaDimee at position 12, the book at 21,
 * so everything from 12 down was shifted by one.
 *
 * TWO IN THE FLOWERS, and the second is the clearest transcription error found
 * in this project so far:
 *
 *   vidyaa gaNapati   app dhattoora   book durdhoora
 *   viSHNu gaNapati   app shamyaaka   book shyaamaka
 *
 * shamyaaka and shyaamaka are the same four syllables in a different order.
 *
 * BOTANICALS. Where the plant is unchanged the Latin name stays. Where the book
 * gives a different plant it is set only when the identification is secure --
 * bhRngaraaja is Eclipta prostrata, which is not in doubt. gaNDalee is not a
 * name this project can identify with confidence, and the value it currently
 * holds describes gaNDavee, a different word; carrying it across would be
 * transferring an unsupported identification onto a new plant, so it is cleared
 * and asked about on the review sheet instead.
 */
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { checkScripts } from './_sources.mjs';
import { emitMigration } from './_migration.mjs';

let failed = false;
const fail = (m) => {
  failed = true;
  console.error(`  FAIL ${m}`);
};

const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';
const PHOTO =
  'Transcribed from a photograph of the printed page; no round-trip proof, diffed against the previous pairing before it was written.';

/**
 * The book's order, by the name each offering is made to. The offering text
 * itself is only restated where it CHANGES -- the other seventeen keep the
 * wording they already have, so this migration cannot quietly restyle the
 * nineteen pairs it is not about.
 */
/*
 * Spelt as the ROWS spell them, not as the book prints them: these are match
 * keys, and the book writes lambOdara with a conjunct where the stored rows use
 * an anusvara. The diff caught that on the first run -- "live row लंबोदराय is
 * not in the book order" -- which is the whole reason the diff runs before the
 * emit. A key list that is almost right silently reorders the wrong rows.
 */
const PATRA_ORDER = [
  'उमापुत्राय',
  'हेरंबाय',
  'लंबोदराय',
  'द्विरदाननाय',
  'धूमकेतवे',
  'बृहते',
  'अपवर्गदाय',
  'द्वैमातुराय',
  'चिरंतनाय',
  'कपिलाय',
  'विष्णुस्तुताय',
  'अमलाय',
  'महते',
  'सिंधूराय',
  'गजाननाय',
  'गंडगळन्मदाय',
  // Matches both spellings: this row is RENAMED to shankareepriyaaya earlier in
  // the same migration, so a key of the full old name stops matching halfway
  // through and the row is left parked. The harness caught exactly that.
  'शंकर',
  'भृंगराजत्कटाय',
  'अर्जुनदंताय',
  'अर्कप्रभाय',
  'एकदंताय',
];

/** Offering changes, keyed by the fragment of the invoked name that identifies the row. */
const PATRA_FIX = [
  {
    name: 'धूमकेतवे',
    deva: 'दुर्धूरपत्रं समर्पयामि',
    en: 'Durdhura leaf',
    // durdhoora and dhattoora are two names for Datura metel, so the plant in
    // the hand does not change; only what the book calls it.
    botanical: 'Datura metel',
    was: 'धत्तूरपत्रं समर्पयामि',
  },
  {
    name: 'सिंधूराय',
    deva: 'सिंधूरपत्रं समर्पयामि',
    en: 'Sindhura leaf',
    botanical: 'Vitex negundo',
    was: 'सिंधुवार पत्रं समर्पयामि',
  },
  {
    name: 'गंडगळन्मदाय',
    deva: 'गंडलीपत्रं समर्पयामि',
    en: 'Gandali leaf',
    botanical: null, // see the header
    was: 'गंडवी पत्रं समर्पयामि',
  },
  {
    name: 'भृंगराजत्कटाय',
    deva: 'भृंगराजपत्रं समर्पयामि',
    en: 'Bhringaraja leaf',
    botanical: 'Eclipta prostrata',
    was: 'अश्वत्थ पत्रं समर्पयामि',
  },
];

const PUSHPA_FIX = [
  {
    name: 'विद्या गणपतये',
    deva: 'दुर्धूर पुष्पं समर्पयामि',
    en: 'Durdhura flower',
    botanical: 'Datura metel',
    was: 'धत्तूर पुष्पं समर्पयामि',
  },
  {
    name: 'विष्णु गणपतये',
    deva: 'श्यामक पुष्पं समर्पयामि',
    en: 'Shyamaka flower',
    botanical: 'Echinochloa frumentacea',
    was: 'शम्याक पुष्पं समर्पयामि',
  },
];

/** The one name that differs, not just the offering. */
const NAME_FIX = {
  from: 'ॐ शंकरप्रियाय नमः',
  to: 'ॐ शंकरीप्रियाय नमः',
};

/**
 * The deity row keeps its own list of permitted leaves, and it agrees with
 * neither the book nor the archana rows: it has devadaaru where the archana has
 * aamalakee, and gaNDakee where the archana has gaNDavee and the book has
 * gaNDalee. Three lists that should be one. This makes it the book's.
 */
const DEITY_LEAVES = [
  'macī', 'bṛhatī', 'bilva', 'dūrvā', 'durdhūra', 'badarī', 'apāmārga',
  'tulasī', 'cūta', 'karavīra', 'viṣṇukrānta', 'āmalakī', 'maruvaka',
  'sindhūra', 'jātī', 'gaṇḍalī', 'śamī', 'bhṛṅgarāja', 'arjuna', 'arka',
  'dāḍimī',
];

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------

const scripts = (deva) => ({
  deva,
  ta: transliterate(Sanscript, deva, 'tamil'),
  iast: transliterate(Sanscript, deva, 'iast'),
});

console.log('--- building ---\n');

if (PATRA_ORDER.length !== 21) fail(`patra order has ${PATRA_ORDER.length} entries, expected 21`);
if (new Set(PATRA_ORDER).size !== PATRA_ORDER.length) fail('the patra order repeats a name');
if (DEITY_LEAVES.length !== 21) fail(`deity leaf list has ${DEITY_LEAVES.length}, expected 21`);

const built = { patra: [], pushpa: [] };
for (const [key, list] of [['patra', PATRA_FIX], ['pushpa', PUSHPA_FIX]]) {
  for (const f of list) {
    const o = scripts(f.deva);
    checkScripts(`${key}/${f.name}`, o, fail);
    built[key].push({ ...f, ...o });
    console.log(`  ${key.padEnd(7)} ${f.name.padEnd(16)} ${f.was}  ->  ${f.deva}`);
  }
}
const nameFix = { from: scripts(NAME_FIX.from), to: scripts(NAME_FIX.to) };
checkScripts('name fix', nameFix.to, fail);
console.log(`  name    ${NAME_FIX.from}  ->  ${NAME_FIX.to}`);

if (failed) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Diff against live
// -----------------------------------------------------------------------------

async function printDiff() {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
  const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!U || !K) return console.log('\n(no .env.local; skipping the diff)');
  const g = async (p) =>
    (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } })).json();
  const st = await g(
    `pooja_steps?select=id&pooja_id=eq.ganesha_standard&step_title_en=eq.${encodeURIComponent('Patra Pooja (21 Leaves)')}`,
  );
  const rows = await g(
    `archana_items?select=seq,invoked_name_deva,offering_deva&pooja_step_id=eq.${st[0].id}&order=seq`,
  );
  console.log('\n  Patra Pooja, current order -> book order');
  for (const r of rows) {
    const shortName = r.invoked_name_deva.replace(/^ॐ /, '').replace(/ नमः$/, '');
    const to = PATRA_ORDER.findIndex((k) => shortName.includes(k)) + 1;
    const moved = to !== r.seq ? `  seq ${r.seq} -> ${to}` : '';
    const fix = PATRA_FIX.find((f) => f.name === shortName);
    const offer = fix ? `   OFFERING ${fix.was} -> ${fix.deva}` : '';
    if (to === 0) fail(`live row "${shortName}" is not in the book order`);
    if (moved || offer) console.log(`    #${String(r.seq).padStart(2)} ${shortName.padEnd(16)}${moved}${offer}`);
  }
}

if (!process.argv.includes('--no-diff')) await printDiff();
if (failed) process.exit(1);

// -----------------------------------------------------------------------------
// SQL
// -----------------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);
const STEP = (t) =>
  `(select id from public.pooja_steps where pooja_id = 'ganesha_standard' and step_title_en = ${q(t)})`;
const PATRA = STEP('Patra Pooja (21 Leaves)');
const PUSHPA = STEP('Pushpa Pooja (21 Flowers)');

out('-- =============================================================================');
out('-- 0028_patra_pushpa_pairings.sql');
out('--');
out('-- GENERATED by scripts/build-patra-pushpa-pairings.mjs. Do not hand-edit.');
out('--');
out('-- Closes the oldest open question in docs/sources.md: the 21 leaves are paired');
out('-- with 21 names, 14 of the pairs alliterate, and the other 7 looked mismatched.');
out('--');
out('-- The alliteration IS the design -- but only ONE of the seven is an error here.');
out('-- The other six are paired the same way in the book, deliberately. The seventh:');
out('--   bhRngaraajatkaTaaya namaha -> ashvattha patram     (this app)');
out('--   bhRngaraajatkaTaaya namaha -> bhRngaraaja patram   (the book)');
out('-- A name meaning "he whose matted hair is the bhringaraja" was getting a peepal');
out('-- leaf.');
out('--');
out('-- Four more differences alliteration would never have caught, plus the order:');
out('-- the app had Ekadanta/daaDimee at 12 where the book has it at 21. And two in');
out('-- the flowers, of which shamyaaka -> shyaamaka is the clearest transcription');
out('-- error found in this project: the same four syllables in a different order.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 1. the offerings that change --------------------------------------------');
for (const [label, list, step] of [['patra', built.patra, PATRA], ['pushpa', built.pushpa, PUSHPA]]) {
  for (const f of list) {
    out(`-- ${label}: ${f.was} -> ${f.deva}`);
    out('update public.archana_items set');
    out(`  offering_deva = ${q(f.deva)},`);
    out(`  offering_ta = ${q(f.ta)},`);
    out(`  offering_en = ${q(f.en)},`);
    out(`  botanical = ${q(f.botanical)}`);
    out(` where pooja_step_id = ${step}`);
    out(`   and position(${q(f.name)} in invoked_name_deva) > 0;`);
    out();
  }
}

out('-- --- 2. the one name that changes --------------------------------------------');
out('update public.archana_items set');
out(`  invoked_name_deva = ${q(nameFix.to.deva)},`);
out(`  invoked_name_ta = ${q(nameFix.to.ta)},`);
out(`  invoked_name_translit = ${q(nameFix.to.iast)}`);
out(` where pooja_step_id = ${PATRA} and invoked_name_deva = ${q(nameFix.from.deva)};`);
out();

out('-- --- 3. the order ------------------------------------------------------------');
out('-- Park first: seq is unique per step, so an in-place shuffle always has an');
out('-- intermediate state with two rows on one number. Same reason 0025 parked the');
out('-- step numbers above 1000.');
out(`update public.archana_items set seq = seq + 1000 where pooja_step_id = ${PATRA} and seq < 1000;`);
PATRA_ORDER.forEach((name, i) => {
  out(
    `update public.archana_items set seq = ${i + 1} where pooja_step_id = ${PATRA}` +
      ` and position(${q(name)} in invoked_name_deva) > 0;`,
  );
});
out();

out('-- --- 4. the deity’s own list of permitted leaves ---------------------------');
out('-- It agreed with neither the book nor the archana rows: devadaaru where the');
out('-- archana has aamalakee, gaNDakee where the archana has gaNDavee and the book');
out('-- has gaNDalee. Three lists that should be one.');
out('update public.deities set');
out(
  `  permitted_offerings = jsonb_set(permitted_offerings::jsonb, '{leaves}', ${q(
    JSON.stringify(DEITY_LEAVES),
  )}::jsonb),`,
);
out('  updated_at = now()');
out(" where id = 'ganesha';");
out();

out('-- --- 5. record what changed and why ------------------------------------------');
out('update public.pooja_steps set');
out(
  `  source_ref = ${q(
    `${BOOK}, p.63-64, ekavimshati patrapoojaa. Order and pairing follow the book, which puts ekadanta/daaDimee last where this app had it twelfth. Four offerings corrected: durdhoora for dhattoora (two names for Datura metel), sindhoora for sindhuvaara, gaNDalee for gaNDavee, and bhRngaraaja for ashvattha -- the last being the only one of the seven non-alliterating pairs that was actually wrong, the other six being paired the same way in the book. gaNDalee is left without a botanical identification rather than inheriting the one recorded for gaNDavee, which is a different word. ${PHOTO}`,
  )},`,
);
out('  verified_by = null, verified_at = null, updated_at = now()');
out(" where pooja_id = 'ganesha_standard' and step_title_en = 'Patra Pooja (21 Leaves)';");
out();
out('update public.pooja_steps set');
out(
  `  source_ref = ${q(
    `${BOOK}, p.65, ekavimshati puSHpapoojaa. Order confirmed identical. Two offerings corrected: durdhoora for dhattoora, and shyaamaka for shamyaaka -- the same four syllables in a different order. ${PHOTO}`,
  )},`,
);
out('  verified_by = null, verified_at = null, updated_at = now()');
out(" where pooja_id = 'ganesha_standard' and step_title_en = 'Pushpa Pooja (21 Flowers)';");
out();

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out('  -- Nothing parked, 1..21, no gap, no repeat.');
out(`  select count(*) into n from public.archana_items where pooja_step_id = ${PATRA} and seq >= 1000;`);
out("  if n > 0 then raise exception '% leaf offerings were left parked', n; end if;");
out('  select (max(seq) - min(seq) + 1) - count(*) into n from public.archana_items');
out(`   where pooja_step_id = ${PATRA};`);
out("  if n <> 0 then raise exception 'the leaf sequence is not dense'; end if;");
out(`  select count(*) into n from public.archana_items where pooja_step_id = ${PATRA};`);
out("  if n <> 21 then raise exception 'expected 21 leaves, found %', n; end if;");
out('  -- The one real mismatch is gone, in all three scripts.');
out('  select count(*) into n from public.archana_items');
out(`   where pooja_step_id = ${PATRA} and offering_deva like '%अश्वत्थ%';`);
out("  if n > 0 then raise exception 'the ashvattha leaf is still paired with bhringarajatkata'; end if;");
out('  select count(*) into n from public.archana_items');
out(`   where pooja_step_id = ${PATRA}`);
out("     and position('भृंगराजत्कटाय' in invoked_name_deva) > 0");
out("     and offering_deva like '%भृंगराज%';");
out("  if n <> 1 then raise exception 'bhringarajatkata is not paired with the bhringaraja leaf'; end if;");
out('  -- Ekadanta is last, as the book has it.');
out('  select seq into n from public.archana_items');
out(`   where pooja_step_id = ${PATRA} and position('एकदंताय' in invoked_name_deva) > 0;`);
out("  if n <> 21 then raise exception 'ekadanta/dadimi is at seq %, expected 21', n; end if;");
out('  -- The flower transcription error is gone.');
out('  select count(*) into n from public.archana_items');
out(`   where pooja_step_id = ${PUSHPA} and offering_deva like '%शम्याक%';`);
out("  if n > 0 then raise exception 'shamyaaka is still in the flower list'; end if;");
out('  select count(*) into n from public.archana_items');
out(`   where pooja_step_id = ${PUSHPA} and offering_deva like '%श्यामक%';`);
out("  if n <> 1 then raise exception 'shyaamaka is not in the flower list'; end if;");
out('  -- Neither list still calls the plant dhattoora.');
out('  select count(*) into n from public.archana_items');
out(`   where pooja_step_id in (${PATRA}, ${PUSHPA}) and offering_deva like '%धत्तूर%';`);
out("  if n > 0 then raise exception '% offerings still say dhattoora', n; end if;");
out('  -- The deity list and the archana rows now agree, 21 to 21.');
out("  select jsonb_array_length(permitted_offerings::jsonb -> 'leaves') into n");
out("    from public.deities where id = 'ganesha';");
out("  if n <> 21 then raise exception 'the deity leaf list has % entries', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out('--   select seq, invoked_name_translit, offering_en from archana_items');
out(`--    where pooja_step_id = ${PATRA} order by seq;`);

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0028_patra_pushpa_pairings.sql', sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
