# Pooja Vidhi

A guided Tamil Smartha pooja vidhanam: every step of a rite in order, with the
mantra in Devanagari, Tamil or transliteration, a live Sankalpam computed from
the date and place, and an explanation of why each step is done.

Live at <https://pooja-vidhi-web.vercel.app/>. Pushing to `main` deploys there.

## What it holds

Two shelves, split by `ritual_class`:

- **Pooja Vidhis** (`/`): rites for a particular day, such as Ganesha Chaturthi,
  the Varalakshmi Vratham, the Navaratri Pooja and the Saraswati Pooja.
- **Nitya Karmas** (`/nitya`): the daily observances, such as Sandhyavandanam
  and the Nitya Panchayatana Pooja.

A rite with `status = 'planned'` shows as a "being transcribed" card and cannot
be opened.

**Today's Sankalpam** (`/sankalpam`, linked from the home page) shows only the
part of the Sankalpam that changes with the day, samvatsara to karana, for any
date and place. It opens on today at Pune.

The content comes from Giri's printed *Sampradaya Vratha Pooja Vidhi* and
*Yajurveda Trikaala Sandhyaavandanam*, transcribed page by page, with the Bhavan
edition of the Sandhyavandanam as a second witness. The sources and the decisions
taken about them are in [`docs/sources.md`](docs/sources.md).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and anon key
npm run dev                  # http://localhost:3000
```

The app refuses to start with missing or placeholder Supabase values
(`src/lib/env.ts`). Use the **anon** key only. The service_role key bypasses
row level security and never belongs in this repo.

## How it is put together

| Where | What |
|---|---|
| `src/app/` | Routes: the two catalogue pages, `pooja/[id]`, `sankalpam`, and the `api/geocode` proxy |
| `src/components/PoojaViewer.tsx` | The rite itself: preparation, modes, karta, step navigation, saved progress |
| `src/lib/queries.ts` | Reads a rite and its steps from Supabase into the shape the viewer expects |
| `src/lib/panchangam.ts`, `sankalpam.ts` | The tithi, nakshatra and the rest of the Sankalpam |
| `supabase/migrations/` | Every schema change and every piece of content, in order |
| `scripts/build-*.mjs` | The generators that write those migrations |

All content lives in the database. There is no local fallback: if Supabase
cannot be read, the page fails rather than showing stale rites.

## Changing content

Migrations are **generated, not written by hand**. To change content, edit or
add a `scripts/build-*.mjs` generator, run it to write the next numbered file in
`supabase/migrations/`, then apply that file in the Supabase SQL editor. Each
generator validates its inputs and refuses to write a migration that fails.

The SQL editor turns every newline into CRLF, so every generated migration ends
by stripping carriage returns. See `scripts/_migration.mjs`.

More on the schema in [`supabase/README.md`](supabase/README.md).

## Before pushing to main

`main` is production. Run these first, and click through every rite the change
touches on the local dev server:

```bash
npx tsc --noEmit
npm run lint
npm run test:db                  # migrations, against Postgres in WASM
node scripts/verify-live.mjs     # the live schema answers the app's queries
npm run proofread                # the live content: scripts, truncation, counts
```

`verify-live` and `proofread` read the live database, so run them **after** a
migration has been applied.
