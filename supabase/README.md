# Database

## How to apply

Run these in order in the Supabase SQL editor. They are **additive**: nothing on
`main` stops working after 0001 to 0003, because the legacy columns stay in place
until the cutover.

| File | What it does | Safe to run now |
|---|---|---|
| `0001_core_tables.sql` | Creates the new tables and enums. Touches nothing existing. | yes |
| `0002_extend_existing.sql` | Adds columns to `poojas` and `pooja_steps`, wires foreign keys. | yes |
| `0003_backfill.sql` | Moves the jsonb blobs into real tables, fixes the duplicate `step_number`. | yes |
| `0004_drop_legacy.sql` | Drops the legacy columns. | **no, after cutover only** |

All three of 0001 to 0003 are idempotent, so a partial run can be repeated.

Before running 0004, confirm nothing reads the old columns:

```bash
grep -rn "archana_list\|samagri_list\|naivedyam_suggestions\|gender_target" src/
```

## What changes

`archana_list`, `samagri_list` and `naivedyam_suggestions` were jsonb blobs. They
become `archana_items`, `samagri_items` and `naivedyam_items`. The blob is why only
20 of 108 names exist today: Ganesha Chaturthi alone needs 189 enumerated archana
rows, and each one needs its own ordering, its own botanical identification and its
own audio file.

`gender_target` becomes `gender_rule`, which distinguishes two behaviours that were
previously one. A **filter** removes the screen entirely and renumbers around it, as
for Pranayamam. A **variant** keeps the screen and swaps the mantra, as for the
svaha and namah endings in achamanam. Dropping yajnopavitam for a woman would be as
wrong as showing her Pranayamam, so the two cannot share a flag.

New tables carry the things the old shape had nowhere to put: `deities` (which is
where "tulasi is forbidden for Ganesha, required for Perumal" lives),
`upachara_templates` (the shared Purvangam and Shodashopachara, so the second deity
does not mean retyping the first), calendar rules on `poojas`, and `user_sessions`
so a refresh does not lose a two-hour ritual.

## Tests

```bash
npm i -D @electric-sql/pglite
node supabase/tests/migrations.test.mjs
```

Spins up Postgres in WASM, recreates the **current** production schema, loads the
real rows from `DB Extract/`, runs the migrations and asserts the outcome. It also
re-runs them to prove idempotency, and applies 0004 on a throwaway basis.

Two bugs were caught this way and are already fixed: policy names need `%I` rather
than `%L` in `format()`, and a UNIQUE constraint also creates an index, so
re-running raises `duplicate_table` which a `when duplicate_object` handler does not
catch.

## Known gaps after migration

The migration moves what exists. It does not invent what is missing.

- 9 of the 27 screens are absent: Shuchi and Prarthana, Deeparadhanam, Manjal
  Pillaiyar, Yathasthanam, Prana Pratishtha, the 21 leaves, the 21 durva, the 108
  names, and Udvasanam.
- The Tamil layer is empty on all 18 rows: `step_title_ta`, `instruction_ta` and
  `mantra_tamil`. Generate these from `mantra_sanskrit` with
  `@indic-transliteration/sanscript` rather than typing them a third time.
- `meaning_en` is empty on all 18 rows; `philosophy_en` on 11 of 18.
- The step titled "Pushpa Pooja (Archana)" holds the 16-name Shodashanama stotra
  plus 4 appended names. It is neither the 21 flowers nor the 108-name Ashtottara.
- The Sankalpam mantra has `mama upatta samasta durita kshayadvara` at the end. In
  the published Smartha paddhati it is the opening phrase, and there is no gotra or
  name slot at all.
