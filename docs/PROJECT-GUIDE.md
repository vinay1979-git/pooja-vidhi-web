# Pooja Vidhi — project guide

*The grounding for anyone (or any Claude session) picking this project up. Read
this first. It is loaded automatically into every Claude Code session through
`CLAUDE.md`, so it survives a change of account or machine: everything needed to
continue is in this repo, not in anyone's chat history.*

*Last updated: 18 October 2026.*

---

## 1. What this app is for

A guided pooja companion for the **newer generation of Hindus** who want to
perform poojas correctly but lack the confidence to. The owner's words: the
experience has to be **as simple as possible**.

Live: <https://pooja-vidhi-web.vercel.app/> · Repo:
<https://github.com/vinay1979-git/pooja-vidhi-web>

## 2. The rules every change must follow

### 2.1 The book is the golden source

The printed Giri editions are the authority for **what** is said and done, in
**what order**:

| Slug | Book | Covers |
|---|---|---|
| `0-general` | General pooja instructions | conventions |
| `1-common` | *Sampradaya Vratha Pooja Vidhi*, Purvanga (steps 1–18, book pp.1–25) | the opening every pooja shares |
| `2-nitya` | Nitya Pooja | Nitya Panchayatana |
| `3-siddhivinayaka` | Siddhivinayaka Vratha Pooja | Ganesha Chaturthi |
| `4-varalakshmi` | Varalakshmi Vratha Pooja | Varalakshmi Vratham |
| `6-sandhya-giri` | *Yajurveda Trikaala Sandhyaavandanam* | Sandhyavandanam |
| `7-navaratri` | Navaratri Puja (pp.283–304) and Sri Saraswati Puja (pp.305–324) | two separate rites |

`5-sandhyavandanam` (Bhavan 1974) is a **cross-check only**, never a source.
StotraNidhi, YouTube vadyars and "common practice" were used before the book was
transcribed; they are **legacy**, to be replaced by the book wherever the book
has the text (see §6). Where the book is silent, say so in `source_ref` and keep
the gap visible; do not fill it from memory.

Rules carried over from the transcription work (details in
`G:\My Drive\Pooja Vidhi\extracted\README-transcription-pipeline.md`):

- **Transcribe, do not edit.** Copy the book's roman exactly (its ITRANS-like
  capitals), record contradictions as `warning` blocks.
- **Repair a misprint only when the book itself settles it** — the other script
  on the same page, or the photograph. Record every repair in the generator
  header and, for a transcription slip, as a `finding` in the transcript.
- **Never retype a mantra.** Generators read Devanagari out of the page
  transcripts by book page and block index.
- **Verify against the book's own evidence** (count markers in namavalis, the
  roman under the Devanagari).

### 2.2 One seamless sequence — never send the reader anywhere

The book sends its reader back and forth ("perform Purvanga steps 1 to 10, see
pages 1 to 12", "proceed with steps 11 to 16", "see page 123 for the
ashtottaram"). **The app must never do this, not even once.** Every
cross-reference in the book is resolved by *inlining* what it points to, in the
place the book says it belongs, so the user only ever presses Next.

What that means on screen (phone first — most users are on a phone):

- **One action and its words per screen.** The book prints each upachara as
  verse + rubric ("(Offer water)"). A step that bundles four upacharas forces the
  reader to read four actions at the top, then scroll to verse one, then scroll
  back up for action two. Don't bundle.
- **What to do, then what to say, visible without scrolling** on a normal step.
  Commentary ("Why we do this", meaning) is available but never sits between the
  instruction and the mantra.
- **No prerequisite hunting.** Anything a step needs (place, date, name, gotra,
  pravara for Abhivadanam) is asked once, up front or inline, never "fill this in
  from elsewhere". No blank `......` in a mantra the user must complete from
  another source.
- **No "as before", "see above", "learnt from a teacher"** in reader-facing text.
  If a repeat is needed, show it again in full.
- Reader-facing prose never cites the source ("the book says…"). Provenance
  lives in `source_ref`, which is never shown. `proofread` fails on citations.

### 2.3 Main is production

`main` auto-deploys to Vercel. **Nothing reaches main untested**:

```bash
npx tsc --noEmit
npm run lint                     # 3 pre-existing set-state-in-effect errors are known
npm run test:db                  # replays every migration in PGlite
node scripts/verify-live.mjs     # after a migration is applied
npm run proofread                # after a migration is applied
```

…and click through every affected rite on the local dev server (`npm run dev`,
launch config `pooja-vidhi-dev`, port 3000), every mode, phone width included.
Local `next build` (Turbopack) fails on Windows over `next/font/google`; use
`npx next build --webpack` as the production-build check.

Commit/push only when the owner asks. Commit messages: short title, a body that
explains *why*, and the attribution line the session asks for.

## 3. How content gets into the app

All content lives in Supabase (`bnygnjbwkwxoipdynugp`). The repo's anon key is
**read-only** (RLS); nothing in a Claude session can write to the database.

1. Write or edit a generator, `scripts/build-*.mjs`. It reads transcripts from
   `G:\My Drive\Pooja Vidhi\extracted\transcripts\<slug>\pNN.json`, validates,
   and writes the next numbered `supabase/migrations/NNNN_*.sql` through
   `emitMigration()` (`scripts/_migration.mjs`), which splices in the CR-guard
   the browser SQL editor needs. Generators **refuse to write** on failure.
2. Add a section to `supabase/tests/migrations.test.mjs` (apply, re-run,
   assertions) and run `npm run test:db`.
3. Optional pre-apply check: dump the replayed PGlite tables and run
   `proofread` against the dump with a `fetch` shim (done several times in the
   Oct 2026 sessions; scratch files only).
4. **The owner pastes the migration into the Supabase SQL editor.** Then run
   `verify-live`, `proofread`, and the browser walk-through.
5. When a migration replaces a rite wholesale (e.g. `build-navaratri-saraswati`),
   never edit an applied migration: re-emit to the next number.

Tamil and IAST are always **derived** from the Devanagari
(`scripts/_tamil.mjs` `transliterate()`), never typed.

## 4. Where things are

| Path | What |
|---|---|
| `src/components/PoojaViewer.tsx` | The rite: preparation, modes, karta, steps, saved progress |
| `src/components/Catalog.tsx` | Home (Pooja Vidhis) and `/nitya` |
| `src/app/sankalpam/` | Today's Sankalpam page |
| `src/lib/panchangam.ts`, `sankalpam.ts` | Drik-ganita panchangam and the Sankalpam sentence; `OCCASION_BY_POOJA` names a festival only where one applies |
| `src/lib/queries.ts` | DB → viewer shape |
| `scripts/build-*.mjs` | Migration generators (one per change) |
| `scripts/proofread.mjs`, `verify-live.mjs` | Live-content and live-schema gates |
| `supabase/tests/migrations.test.mjs` | The whole migration chain replayed in PGlite |
| `G:\My Drive\Pooja Vidhi\` | Book PDFs, `extracted/pages`, `extracted/transcripts`, illustrations, reviews |
| `docs/sources.md` | History of sources (legacy video/web references) |
| `docs/plans/` | Open plans (UX, guided mode, visuals) |

## 5. State at last update

Published: Ganesha Chaturthi, Varalakshmi Vratham, Navaratri Pooja, Saraswati
Pooja (Pooja Vidhis); Nitya Panchayatana, Sandhyavandanam (Nitya Karmas).
Planned cards: Samidadhanam, Brahma Yajnam, Bhojana Vidhi. Their book pages
(after book p.48 of `6-sandhya-giri`, with the Gotra/Pravara tables to p.80) are
photographed but **not yet transcribed**; the transcripts stop at book p.48.

Latest migration: `0059`. Today's Sankalpam page live at `/sankalpam`.

Open review items: the Tamil prose written for 0055–0059 and the Navaratri and
Saraswati rites has not been checked by a native reader.

## 6. Backlog, in priority order

Plans with detail live in `docs/plans/`.

1. **Seamless flow (§2.2)** — `docs/plans/ux-seamless-flow.md`. Audit (18 Oct
   2026): 55 steps across five rites bundle 2–16 offerings on one screen; on a
   phone the mantra starts below the fold on almost every step because the
   expanded "Why we do this" sits above it; the Sankalpam step shows the sentence
   twice; Sandhyavandanam's Abhivadanam leaves the gotra/pravara blank.
2. **Ground every rite in the book (§2.1)** — the shared purvangam steps
   (Vighneshwara Dhyanam, Pranayamam, Kalasha, Ghanta, Anga Vandanam, Manjal
   Pillaiyar) are still StotraNidhi/practice text in every rite; Ganesha has 16
   non-book steps, Varalakshmi 12. Replace from `1-common` and the rite's own
   section, inlined per the book's rubrics.
3. **Guided mode** — an AI "Vidvaan Pandit" voice: instructions in the chosen
   language, mantras always in Sanskrit, configurable pauses, optional
   auto-advance. No hand-made sound files. `docs/plans/guided-mode.md`.
4. **Visuals for actions** — short animations/diagrams for Anga Vandanam,
   Achamanam, Pranayamam, nyasa, etc. `docs/plans/step-visuals.md`.
5. Native Tamil review; more instruction languages.
