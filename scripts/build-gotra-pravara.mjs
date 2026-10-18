#!/usr/bin/env node
/**
 * The gotra/pravara tables, and an Abhivadanam with no blanks in it.
 *
 *   node scripts/build-gotra-pravara.mjs          # validate
 *   node scripts/build-gotra-pravara.mjs --emit   # write 0065
 *
 * SOURCE: Giri *Yajurveda Trikaala Sandhyaavandanam*, Gotra & Pravara tables,
 * book pp.65-80, transcribed to
 * G:\My Drive\Pooja Vidhi\extracted\transcripts\6-sandhya-giri\p60-p73.json
 * (each page carries a structured `gotras` array). Book pp.74-75 are missing
 * from the photographs: the end of the Vishvamitra table and the start of the
 * Kashyapa table are not here yet. The picker therefore also offers "my gotra
 * is not listed", with the rishis typed in.
 *
 * THE FAULT THIS REMOVES. The book's Abhivadanam (p.43) is printed with dotted
 * blanks and the rubric "refer 'gotra pravara' table (page no. 65 - 80) ... and
 * fill up the relevant names". The app copied the blanks, so a reader had to
 * leave the screen to find their own pravara -- the back-and-forth the app must
 * never do (docs/PROJECT-GUIDE.md §2.2). And the Samarpanam (p.48) printed only
 * "अभिवादये..... अस्मि भोः", meaning "say it again".
 *
 * Now both mantras carry tokens -- [PRAVARA_RISHIS] [ARSHEYA] [GOTRA] [NAME] --
 * which the viewer fills from the gotra chosen once before the rite begins
 * (src/lib/abhivadanam.ts). Unchosen, they render as the book's own blanks.
 * The Samarpanam carries the whole sentence again, in full.
 */
import { readFileSync, readdirSync } from 'node:fs';
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { emitMigration } from './_migration.mjs';

const DIR = 'G:/My Drive/Pooja Vidhi/extracted/transcripts/6-sandhya-giri/';
const BOOK = 'Yajurveda Trikaala Sandhyaavandanam (Giri)';
const MIGRATION = 'supabase/migrations/0065_gotra_pravara.sql';

// --- the tables --------------------------------------------------------------
const pages = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(DIR + f, 'utf8')))
  .filter((d) => Array.isArray(d.gotras) && d.gotras.length)
  .sort((a, b) => Number(a.book_page) - Number(b.book_page));

const iast = (d) => transliterate(Sanscript, d, 'iast');
const rows = pages.flatMap((p) =>
  p.gotras.map((g, i) => ({
    id: `p${p.book_page}-${String(i + 1).padStart(2, '0')}`,
    book_page: Number(p.book_page),
    gotra_deva: g.gotra_deva,
    gotra_main_deva: g.gotra_main_deva,
    gotra_alt_deva: g.gotra_alt_deva ?? null,
    gotra_iast: iast(g.gotra_main_deva),
    pravaras_deva: g.pravaras_deva,
    pravaras_iast: g.pravaras_deva.map(iast),
    pravara_count: g.pravara_count,
    alt_pravaras_deva: g.alt_pravaras_deva ?? null,
    alt_pravaras_label: g.alt_pravaras_label ?? null,
    rishi_group: g.rishi_group ?? null,
    variant: g.variant ?? null,
    bold_in_book: Boolean(g.bold_in_book),
  })),
);

// --- the two mantras ---------------------------------------------------------
const SENTENCE = [
  'अभिवादये [PRAVARA_RISHIS]',
  '[ARSHEYA] प्रवरान्वित [GOTRA] गोत्रः आपस्तम्ब सूत्रः',
  'यजुः शाखाऽध्यायी श्री [NAME] शर्मा नामाहं अस्मि भोः',
].join('\n');
const SAMARPANAM_REST = [
  'कायेन वाचा मनसेन्द्रियैर्वा बुध्याऽऽत्मना वा प्रकृतेः स्वभावात्।',
  'करोमि यद्यत् सकलं परस्मै नारायणायेति समर्पयामि॥',
  'मन्त्रहीनं क्रियाहीनं भक्तिहीनं जनार्दन।',
  'यत् कृतं तु मया देव परिपूर्णं तदस्तु ते॥',
  'प्रायश्चित्तान्यशेषाणि तपःकर्मात्मकानि वै।',
  'यानि तेषामशेषाणां श्री कृष्णानुस्मरणं परम्॥',
  'श्री कृष्ण कृष्ण कृष्ण',
].join('\n');

const STEPS = {
  Abhivadanam: {
    deva: SENTENCE,
    instruction_en:
      'Cover both ears with the hands and recite, then touch the floor at the end. Your pravara rishis, gotra and name are filled in from the gotra you chose before beginning.',
    instruction_ta:
      'இரு காதுகளையும் கைகளால் மூடிச் சொல்லி, இறுதியில் தரையைத் தொடவும். தொடங்கும் முன் நீங்கள் தேர்ந்தெடுத்த கோத்ரத்திலிருந்து உங்கள் ப்ரவர ரிஷிகள், கோத்ரம், பெயர் நிரப்பப்பட்டுள்ளன.',
    philosophy_en:
      'The one sentence in the rite that is about the reciter rather than the deity: the rishis of the lineage, the gotra, the Apastamba sutra and the Yajus recension, and finally one\'s own name. The ears are covered because one\'s own name and lineage are about to be said aloud.',
  },
  Samarpanam: {
    deva: `${SENTENCE}\n${SAMARPANAM_REST}`,
    instruction_en:
      'Cover both ears with the hands, say the Abhivadanam once more in full, then touch the floor and prostrate, and recite the offering verses.',
    instruction_ta:
      'மீண்டும் இரு காதுகளையும் கைகளால் மூடி, அபிவாதனத்தை முழுமையாக ஒரு முறை சொல்லி, தரையைத் தொட்டு நமஸ்கரித்து, சமர்ப்பண ஸ்லோகங்களைச் சொல்லவும்.',
  },
};

// --- validate ----------------------------------------------------------------
let failed = false;
const fail = (m) => { failed = true; console.error('FAIL ' + m); };
const counts = {};
for (const r of rows) {
  counts[r.pravara_count] = (counts[r.pravara_count] ?? 0) + 1;
  if (!r.gotra_main_deva || /[A-Za-z]/.test(r.gotra_main_deva)) fail(`${r.id}: gotra name`);
  if (r.pravaras_deva.length !== r.pravara_count) fail(`${r.id}: ${r.pravaras_deva.length} pravaras, count says ${r.pravara_count}`);
  if (![1, 2, 3, 5].includes(r.pravara_count)) fail(`${r.id}: unexpected pravara count ${r.pravara_count}`);
  if (new Set(rows.map((x) => x.id)).size !== rows.length) { fail('duplicate ids'); break; }
}
console.log(`  ${pages.length} pages (book ${pages[0]?.book_page}-${pages.at(-1)?.book_page}), ${rows.length} rows; pravaras: ${JSON.stringify(counts)}`);
if (rows.length < 300) fail('fewer gotra rows than the transcripts hold');
for (const [title, s] of Object.entries(STEPS)) {
  for (const t of ['[PRAVARA_RISHIS]', '[ARSHEYA]', '[GOTRA]', '[NAME]']) {
    if (!s.deva.includes(t)) fail(`${title}: no ${t}`);
  }
  if (/\.{3,}/.test(s.deva)) fail(`${title}: still has a blank`);
  const ta = transliterate(Sanscript, s.deva, 'tamil');
  if (!ta.includes('[GOTRA]')) fail(`${title}: the token did not survive into Tamil`);
}
if (failed) process.exit(1);
if (!process.argv.includes('--emit')) { console.log('(no SQL written; pass --emit)'); process.exit(0); }

// --- emit ----------------------------------------------------------------------
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => (a == null ? 'null' : `array[${a.map(q).join(', ')}]::text[]`);

const sql = `-- The gotra/pravara tables, and an Abhivadanam with no blanks in it.
-- Generated by scripts/build-gotra-pravara.mjs; see its header.

begin;

create table if not exists public.gotras (
  id                 text primary key,
  book_page          integer not null,
  gotra_deva         text not null,
  gotra_main_deva    text not null,
  gotra_alt_deva     text,
  gotra_iast         text not null,
  pravaras_deva      text[] not null,
  pravaras_iast      text[] not null,
  pravara_count      integer not null check (pravara_count in (1, 2, 3, 5)),
  alt_pravaras_deva  text[],
  alt_pravaras_label text,
  rishi_group        text,
  variant            text,
  bold_in_book       boolean not null default false
);
comment on table public.gotras is
  'Gotra and pravara rows from the Giri Sandhyavandanam tables (book pp.65-80; pp.74-75 not yet photographed). A gotra repeats once per pravara set the book gives it. Read by the Abhivadanam picker.';

alter table public.gotras enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                  and tablename = 'gotras' and policyname = 'public read gotras') then
    create policy "public read gotras" on public.gotras for select using (true);
  end if;
end $$;

insert into public.gotras
  (id, book_page, gotra_deva, gotra_main_deva, gotra_alt_deva, gotra_iast,
   pravaras_deva, pravaras_iast, pravara_count, alt_pravaras_deva,
   alt_pravaras_label, rishi_group, variant, bold_in_book)
values
${rows.map((r) => `  (${q(r.id)}, ${r.book_page}, ${q(r.gotra_deva)}, ${q(r.gotra_main_deva)}, ${q(r.gotra_alt_deva)}, ${q(r.gotra_iast)}, ${arr(r.pravaras_deva)}, ${arr(r.pravaras_iast)}, ${r.pravara_count}, ${arr(r.alt_pravaras_deva)}, ${q(r.alt_pravaras_label)}, ${q(r.rishi_group)}, ${q(r.variant)}, ${r.bold_in_book})`).join(',\n')}
on conflict (id) do update set
  book_page = excluded.book_page, gotra_deva = excluded.gotra_deva,
  gotra_main_deva = excluded.gotra_main_deva, gotra_alt_deva = excluded.gotra_alt_deva,
  gotra_iast = excluded.gotra_iast, pravaras_deva = excluded.pravaras_deva,
  pravaras_iast = excluded.pravaras_iast, pravara_count = excluded.pravara_count,
  alt_pravaras_deva = excluded.alt_pravaras_deva, alt_pravaras_label = excluded.alt_pravaras_label,
  rishi_group = excluded.rishi_group, variant = excluded.variant, bold_in_book = excluded.bold_in_book;

${Object.entries(STEPS).map(([title, s]) => `-- sandhyavandanam / ${title}
update public.pooja_steps set
  mantra_sanskrit = ${q(s.deva)},
  mantra_tamil = ${q(transliterate(Sanscript, s.deva, 'tamil'))},
  mantra_translit = ${q(transliterate(Sanscript, s.deva, 'iast'))},
  instruction_en = ${q(s.instruction_en)},
  instruction_ta = ${q(s.instruction_ta)},${s.philosophy_en ? `
  philosophy_en = ${q(s.philosophy_en)},` : ''}
  source_ref = ${q(`${BOOK}, ${title === 'Abhivadanam' ? 'p.43' : 'p.48'}; gotra and pravara filled from the tables, pp.65-80`)},
  updated_at = now()
 where pooja_id = 'sandhyavandanam' and step_title_en = ${q(title)};`).join('\n\n')}

do $$
declare n int;
begin
  select count(*) into n from public.gotras;
  if n < ${rows.length} then raise exception 'gotras: expected at least ${rows.length} rows, found %', n; end if;
  select count(*) into n from public.pooja_steps
   where pooja_id = 'sandhyavandanam' and step_title_en in ('Abhivadanam', 'Samarpanam')
     and position('[GOTRA]' in mantra_sanskrit) > 0 and position('[GOTRA]' in mantra_tamil) > 0
     and position('[GOTRA]' in mantra_translit) > 0 and mantra_sanskrit !~ '\\.{3,}';
  if n <> 2 then raise exception 'Abhivadanam/Samarpanam: tokens missing or blanks left'; end if;
end $$;

commit;
`;
emitMigration(MIGRATION, sql);
