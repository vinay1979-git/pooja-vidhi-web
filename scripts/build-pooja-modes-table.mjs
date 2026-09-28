#!/usr/bin/env node
/**
 * Make a pooja's modes data rather than three strings in a component.
 *
 *   node scripts/build-pooja-modes-table.mjs          # validate
 *   node scripts/build-pooja-modes-table.mjs --emit   # write it
 *
 * pooja_steps.modes has been a free text[] since 0009 and its three values --
 * main, punar, udvasana -- were hardcoded in PoojaViewer along with their
 * labels, their Tamil and their one-line hints. That worked while every pooja
 * that had modes was a multi-day observance.
 *
 * Sandhyavandanam is not. Its three modes are the three sittings: praatah,
 * maadhyaahnika, saayam. Same machinery, completely different words, and the
 * picker cannot know them because they are written in a .tsx file.
 *
 * WHY A TABLE AND NOT A SECOND HARDCODED MAP. The labels are content: they are
 * bilingual, they need the same Tamil review as every other string, and the
 * next rite to arrive will have its own. A map in the component means the Tamil
 * for a mode lives somewhere no proofread gate can see it, which is how
 * step_title_ta came to be empty on eighteen rows before 0006.
 *
 * ORDER IS STORED, because it is not alphabetical and it is not insertion
 * order: main before punar before udvasana, morning before noon before
 * evening. A picker that sorted these itself would put maadhyaahnika first.
 */
import { emitMigration } from './_migration.mjs';

const MODES = [
  // The existing three, moved out of the component verbatim.
  {
    pooja: 'ganesha_standard', mode: 'main', seq: 1,
    en: 'Main Pooja', ta: 'பிரதான பூஜை',
    hint_en: 'First day. Full vidhi, the idol is installed.',
    hint_ta: 'முதல் நாள். முழு விதி, விக்கிரகம் பிரதிஷ்டை செய்யப்படுகிறது.',
  },
  {
    pooja: 'ganesha_standard', mode: 'punar', seq: 2,
    en: 'Punar Pooja', ta: 'புனர் பூஜை',
    hint_en: 'A later day. Shorter: the deity is already installed.',
    hint_ta: 'அடுத்த நாட்கள். சுருக்கமானது: மூர்த்தி ஏற்கனவே பிரதிஷ்டை செய்யப்பட்டுள்ளது.',
  },
  {
    pooja: 'ganesha_standard', mode: 'udvasana', seq: 3,
    en: 'Udvasanam only', ta: 'உத்வாசனம்',
    hint_en: 'Final day. Closing and release, before immersion.',
    hint_ta: 'இறுதி நாள். நிறைவும் உத்வாசனமும், விசர்ஜனத்திற்கு முன்.',
  },
  {
    pooja: 'varalakshmi_vratham', mode: 'main', seq: 1,
    en: 'Main Pooja', ta: 'பிரதான பூஜை',
    hint_en: 'First day. Full vidhi, the kalasham is dressed and installed.',
    hint_ta: 'முதல் நாள். முழு விதி, கலசம் அலங்கரித்து பிரதிஷ்டை செய்யப்படுகிறது.',
  },
  {
    pooja: 'varalakshmi_vratham', mode: 'punar', seq: 2,
    en: 'Punar Pooja', ta: 'புனர் பூஜை',
    hint_en: 'The next day. Shorter: the goddess is already installed.',
    hint_ta: 'மறுநாள். சுருக்கமானது: தாயார் ஏற்கனவே பிரதிஷ்டை செய்யப்பட்டுள்ளார்.',
  },
  {
    pooja: 'varalakshmi_vratham', mode: 'udvasana', seq: 3,
    en: 'Udvasanam only', ta: 'உத்வாசனம்',
    hint_en: 'Closing and release, before the kalasham is dismantled.',
    hint_ta: 'நிறைவும் உத்வாசனமும், கலசம் கலைக்கப்படுவதற்கு முன்.',
  },

  // The daily rite has exactly one mode and the picker hides itself for it --
  // see the modesTagged / offeredModes split in PoojaViewer. Declared anyway,
  // because its steps CLAIM 'main' and the assertion below refuses a mode that
  // is claimed and not declared. Relaxing that assertion to let this one
  // through would have made it useless for the case it exists to catch.
  {
    pooja: 'nitya_panchayatana', mode: 'main', seq: 1,
    en: 'Daily', ta: 'தினசரி',
    hint_en: 'Performed every morning. There is no second day.',
    hint_ta: 'தினமும் காலையில் செய்யப்படுவது. இரண்டாம் நாள் கிடையாது.',
  },

  // The three sittings of the sandhyavandanam.
  //
  // Named for what the book's own sankalpas call them -- praatah sandhyaam
  // upaasishye, maadhyaahnikam karishye, saayam sandhyaam upaasishye -- rather
  // than morning, noon and evening, because the sankalpa says the Sanskrit
  // aloud and a reader who has just recited it should meet the same word.
  {
    pooja: 'sandhyavandanam', mode: 'pratah', seq: 1,
    en: 'Prātaḥ — morning', ta: 'ப்ராதஃ — காலை',
    hint_en: 'At dawn. Gayatri japa 108 times, facing east.',
    hint_ta: 'விடியற்காலை. காயத்ரி ஜபம் 108 முறை, கிழக்கு நோக்கி.',
  },
  {
    pooja: 'sandhyavandanam', mode: 'madhyahnika', seq: 2,
    en: 'Mādhyāhnika — noon', ta: 'மாத்யாஹ்நிகம் — உச்சி',
    hint_en: 'At midday. Gayatri japa 32 times, facing east.',
    hint_ta: 'நண்பகல். காயத்ரி ஜபம் 32 முறை, கிழக்கு நோக்கி.',
  },
  {
    pooja: 'sandhyavandanam', mode: 'sayam', seq: 3,
    en: 'Sāyam — evening', ta: 'ஸாயம் — மாலை',
    hint_en: 'At dusk. Gayatri japa 64 times, facing west before sunset and east after.',
    hint_ta: 'அந்தி வேளை. காயத்ரி ஜபம் 64 முறை; சூரியன் மறைவதற்கு முன் மேற்கு, பின் கிழக்கு.',
  },
];

let failed = false;
const fail = (m) => { failed = true; console.error('  FAIL ' + m); };

console.log('--- modes per pooja ---');
const byPooja = {};
for (const m of MODES) (byPooja[m.pooja] ??= []).push(m);
for (const [p, list] of Object.entries(byPooja)) {
  console.log(`  ${p.padEnd(22)} ${list.map((x) => x.mode).join(', ')}`);
  const seqs = list.map((x) => x.seq).sort((a, b) => a - b);
  seqs.forEach((n, i) => { if (n !== i + 1) fail(`${p}: seq is not 1..n, got ${seqs.join(',')}`); });
  if (new Set(list.map((x) => x.mode)).size !== list.length) fail(`${p}: a mode appears twice`);
}
for (const m of MODES) {
  for (const f of ['en', 'ta', 'hint_en', 'hint_ta']) {
    if (!m[f] || !String(m[f]).trim()) fail(`${m.pooja}/${m.mode}: ${f} is empty`);
  }
  // Every other user-facing string in this app carries Tamil, and a mode label
  // is the most visible one on the preparation screen.
  if (!/[஀-௿]/.test(m.ta)) fail(`${m.pooja}/${m.mode}: label_ta is not Tamil`);
  if (!/[஀-௿]/.test(m.hint_ta)) fail(`${m.pooja}/${m.mode}: hint_ta is not Tamil`);
  if (/[ऀ-ॿ꣠-ꣿ]/.test(m.en + m.ta + m.hint_en + m.hint_ta)) {
    fail(`${m.pooja}/${m.mode}: a label carries Devanagari`);
  }
}
if (failed) { console.error('\nnot emitting'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0047_pooja_modes_table.sql');
out('--');
out('-- GENERATED by scripts/build-pooja-modes-table.mjs. Do not hand-edit.');
out('--');
out('-- A pooja\'s modes become data. pooja_steps.modes has been a free text[] since');
out('-- 0009, but the three values it held -- main, punar, udvasana -- were hardcoded');
out('-- in PoojaViewer along with their labels, their Tamil and their hints. Fine');
out('-- while every pooja with modes was a multi-day observance.');
out('--');
out('-- Sandhyavandanam is not. Its modes are three SITTINGS: praatah, maadhyaahnika,');
out('-- saayam. Same machinery, different words, and the picker cannot know them');
out('-- because they live in a .tsx file.');
out('--');
out('-- A TABLE RATHER THAN A SECOND HARDCODED MAP, because these are content: they');
out('-- are bilingual, they need the same Tamil review as every other string, and the');
out('-- next rite will bring its own. A map in the component puts Tamil somewhere no');
out('-- proofread gate can see it, which is how step_title_ta came to be empty on');
out('-- eighteen rows before 0006.');
out('--');
out('-- seq is stored because the order is neither alphabetical nor insertion order:');
out('-- main before punar before udvasana, morning before noon before evening. A');
out('-- picker that sorted for itself would put maadhyaahnika first.');
out('-- =============================================================================');
out();
out('begin;');
out();
out('create table if not exists public.pooja_modes (');
out('  pooja_id   text not null references public.poojas(id) on delete cascade,');
out('  mode       text not null,');
out('  seq        integer not null,');
out('  label_en   text not null,');
out('  label_ta   text not null,');
out('  hint_en    text not null,');
out('  hint_ta    text not null,');
out('  created_at timestamptz not null default now(),');
out('  updated_at timestamptz not null default now(),');
out('  primary key (pooja_id, mode)');
out(');');
out();
out('comment on table public.pooja_modes is');
out(`  ${q('The modes a pooja offers, with their labels. A mode string here must match the values used in pooja_steps.modes. seq orders the picker.')};`);
out();
out('-- Read-only through the API like every other content table. Same reasoning as');
out('-- 0038: the app only reads, and migrations run as the owner, so enable rather');
out('-- than force.');
out('alter table public.pooja_modes enable row level security;');
out('do $$ begin');
out("  if not exists (select 1 from pg_policies where schemaname = 'public'");
out("                  and tablename = 'pooja_modes' and policyname = 'public read pooja_modes') then");
out("    create policy \"public read pooja_modes\" on public.pooja_modes for select using (true);");
out('  end if;');
out('end $$;');
out();
for (const m of MODES) {
  out('insert into public.pooja_modes (pooja_id, mode, seq, label_en, label_ta, hint_en, hint_ta)');
  out(`values (${q(m.pooja)}, ${q(m.mode)}, ${m.seq}, ${q(m.en)}, ${q(m.ta)}, ${q(m.hint_en)}, ${q(m.hint_ta)})`);
  out('on conflict (pooja_id, mode) do update set');
  out('       seq = excluded.seq, label_en = excluded.label_en, label_ta = excluded.label_ta,');
  out('       hint_en = excluded.hint_en, hint_ta = excluded.hint_ta, updated_at = now();');
  out();
}
out('-- --- assert ------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
for (const [p, list] of Object.entries(byPooja)) {
  out(`  select count(*) into n from public.pooja_modes where pooja_id = ${q(p)};`);
  out(`  if n <> ${list.length} then raise exception '${p} has % modes, expected ${list.length}', n; end if;`);
}
out();
out('  -- Every mode a STEP claims must be declared here, or the picker will filter');
out('  -- on a value it cannot name and the step will be unreachable. This is the');
out('  -- assertion that makes the table worth having.');
out('  select count(*) into n from (');
out('    select distinct s.pooja_id, unnest(s.modes) as mode from public.pooja_steps s');
out('  ) claimed');
out('  where not exists (');
out('    select 1 from public.pooja_modes m');
out('     where m.pooja_id = claimed.pooja_id and m.mode = claimed.mode');
out('  );');
out("  if n > 0 then raise exception '% step mode(s) are not declared in pooja_modes', n; end if;");
out();
out('  -- ...and nothing is declared that no step uses, which would put a dead button');
out('  -- on the preparation screen.');
out('  select count(*) into n from public.pooja_modes m');
out('   where exists (select 1 from public.pooja_steps s where s.pooja_id = m.pooja_id)');
out('     and not exists (');
out('       select 1 from public.pooja_steps s');
out('        where s.pooja_id = m.pooja_id and m.mode = any(s.modes)');
out('     );');
out("  if n > 0 then raise exception '% declared mode(s) have no steps', n; end if;");
out('end $$;');
out();
out('commit;');

const sql = lines.join('\n') + '\n';
if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0047_pooja_modes_table.sql', sql);
  console.log('\nwrote supabase/migrations/0047_pooja_modes_table.sql');
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
