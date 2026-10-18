# Plan: one seamless sequence, grounded in the book

*Status: proposed 18 October 2026, awaiting the owner's go-ahead on the decisions
in §5. Rules this implements: `docs/PROJECT-GUIDE.md` §2.1 and §2.2.*

## 1. The complaint

Users find the app clunky "sometimes". The owner's requirement: a sequential
series of steps, one after another, with **no back and forth even once** — unlike
the book, which sends its reader to different pages at different points.

## 2. What the audit found (18 Oct 2026, live data, phone viewport 375×812)

### 2.1 Bundled steps force scrolling up and down
55 steps across five rites put 2–16 separate offerings on one screen:

| Rite | Steps | Bundled | Worst |
|---|---|---|---|
| Ganesha | 37 | 10 | Vighneshwara Pooja (16 offerings), Naivedyam (6+) |
| Nitya Panchayatana | 39 | 14 | Samasta Upachara (5), Vastram/Upaveetam/Gandham (4) |
| Navaratri | 31 | 11 | Navakanya Pooja (8), Kanya Neerajanam (7), Gandham… (5) |
| Varalakshmi | 31 | 10 | Naivedyam (6), Gandham, Akshatai & Pushpam (5) |
| Saraswati | 26 | 10 | Naivedyam (5), Asanam…Achamaniyam (4) |
| Sandhyavandanam | 53 | 0 | — |

On such a step all the actions are one paragraph at the top and all the verses
one block below, so the reader goes: read actions → scroll to verse 1 → offer →
scroll back up for action 2 → scroll down to verse 2… The book does not do this:
it prints verse, then its rubric "(Offer water)", then the next verse.

### 2.2 The mantra is below the fold on almost every step
Order on screen today: instruction → **"Why we do this" (expanded)** → mantra →
meaning. On a phone the mantra starts 575–1,160 px down (viewport ≈ 650 px
usable), so every step begins with a scroll past commentary. The Sankalpam step
also shows the sentence twice (a dynamic card, then the mantra).

### 2.3 The preparation page is 5.3 phone screens
Why-we-do-it → step list → day / karta / date / place / name / gotra → samagri
(1,500 px) → naivedyam, with the Begin button floating over all of it.

### 2.4 The 108 names need a tap per name while scrolling
Each name has its own small "🌸 Offer" button in a long list.

### 2.5 Content that still sends the reader elsewhere
- Sandhyavandanam *Abhivadanam* and *Samarpanam*: `अभिवादये ............` — the
  reader must supply their own pravara from somewhere else.
- "This is properly learnt from a teacher" (Sandhyavandanam ×3), "Then return and
  continue", "exactly as before".
- Ganesha Ashtottaram: "If time is short the twenty-one-name Pushpa Pooja already
  done stands in its place".

### 2.6 Not grounded in the book
The book's Purvanga is 18 numbered steps (book pp.1–26): Achamanam & Anga
Vandanam, Vighneshwara Dhyanam, Pranayama, Sankalpa, Sakala Devata Vandanam &
Deepa mantra, Asana Pooja, Ghanta Pooja, a full Vighneshwara Pooja (dhyana,
upacharas, 16-name archana, naivedya), Pranayama, Pradhana Sankalpa, Vighneshwara
Udyapanam, Kalasha, Shankha, Atma, Peetha, Guru Dhyanam, the rite's own
Dhyana/Avahana, and Prana Pratishtha (with separate *svāmī* and *devī* columns,
p.24). Every main rite says "perform Purvanga steps 1–10, then the sankalpa
here, then steps 11–16, then dhyana and avahana here, then step 18".

- **Ganesha** follows this, but 16 steps still carry StotraNidhi/practice text.
- **Varalakshmi, Navaratri, Saraswati** use a short substitute (StotraNidhi
  Vighneshwara Dhyanam, Pranayamam, Kalasha, Ghanta; a "Manjal Pillaiyar" step
  from StotraNidhi; Varalakshmi's Prana Pratishtha from a Lalitha vidhanam) and
  skip Sakala Devata Vandanam, Asana, the Vighneshwara Pooja, Shankha, Atma,
  Peetha and Guru Dhyanam.
- **Nitya Panchayatana** follows the book's Nitya section but borrows the same
  StotraNidhi purvangam steps.
- **Sandhyavandanam** is 100% book.

## 3. The design

### 3.1 One book unit = one screen
Split every bundled step at the book's rubrics, so each screen is exactly one
action and its words: *"Offer water for the feet"* + the padyam verse. A short
section label keeps orientation: **"Shodashopachara · 3 of 9"**.

Implementation: split into separate `pooja_steps` rows (recommended — modes,
saved progress, the step list, proofread and a future guided mode all already
work per row), with a new nullable `section_en`/`section_ta` column for the
label. Rite step counts roughly double (Navaratri ≈ 31 → ≈ 60) but each screen
is small and the reader only ever presses Next.

### 3.2 Screen layout: do, say, then (optionally) understand
1. Step title + section label.
2. **What to do** — one or two sentences.
3. **What to say** — the mantra, large, in the chosen script, roman beneath.
4. Collapsed toggles: *Meaning*, *Why we do this*. Remembered per user.
5. Fixed footer: Previous · progress · **Next** (large, thumb-reachable).

Acceptance: on 375×812 the instruction and the start of the mantra are visible
without scrolling on every non-list step; a single-verse mantra is visible in
full.

Sankalpam: one rendering only (the mantra with the day spliced in), with a small
"date · place" chip that opens the setting inline.

### 3.3 Lists: one name at a time
Namavali and archana steps get a focus view: the current name large, a big
*Offered* button (or tap anywhere) advances, "23 / 108" progress, the full list
behind a toggle. This is also the natural unit for guided mode's voice.

### 3.4 Preparation: three short screens, then begin
1. **This pooja** — which day (mode), who performs it (karta); date and place
   pre-filled (today, last place used / GPS) with a one-tap change.
2. **Gather** — the samagri checklist, and naivedyam to prepare.
3. **Begin.** (Name and gotra are asked only if a step uses them, as now.)
"Why we do it" becomes a collapsed card on screen 1.

### 3.5 Nothing to look up elsewhere
- Abhivadanam: a gotra picker built from the book's own Gotra/Pravara tables
  (Giri Sandhyavandanam pp.65–80; photographed, **not yet transcribed** — the
  transcripts stop at book p.48; pravaras are an ordered list of 3 or 5),
  filling the blanks so the full sentence is shown.
- Remove "learnt from a teacher", "as before", "return and continue",
  "stands in its place" from reader-facing text; show the action itself
  (visuals plan) or repeat it in full.
- Add a **proofread gate** that fails on cross-reference phrases and on `....`
  blanks in mantras, so this cannot regress.

### 3.6 Ground every rite in the book
Build one generator for the book's Purvanga (`1-common`, steps 1–18) that emits
the shared steps for every rite, inlined in the order each rite's rubric gives
(1–10, the rite's pradhana sankalpa, 11–16, the rite's dhyana/avahana, 18 with
the svāmī or devī column). Replace the StotraNidhi/practice purvangam steps in
all rites with it. Then retire the remaining non-book main-section text in
Ganesha (Siddhivinayaka book) and Varalakshmi (book pp.110–137).

## 4. Order of work

| Phase | What | Needs a migration | Risk |
|---|---|---|---|
| 1 | Screen layout (§3.2), Sankalpam single rendering, lists focus view (§3.3), prep in three screens (§3.4) | No — viewer code only | Low; every rite benefits at once |
| 2 | Proofread gate for cross-references; fix the flagged texts (§3.5 bullets 2–3) | Small | Low |
| 3 | Book Purvanga generator, applied to all rites (§3.6) | Yes, per rite | Medium: changes what is recited |
| 4 | Split bundled steps at book rubrics (§3.1), with section labels | Yes, per rite | Medium: step numbers change; saved progress for in-flight users resets |
| 5 | Transcribe the gotra/pravara tables, then the Abhivadanam picker | Yes (gotra table) + viewer | Medium |
| 6 | Non-book main-section text in Ganesha and Varalakshmi | Yes | Medium |

Phases 3 and 4 are done together per rite (one migration each, Navaratri first
as the most recently built), each walked in the browser before the next.

## 5. Decisions for the owner

1. **Purvanga length.** Following the book in full adds the Vighneshwara Pooja
   (with 16-name archana), Sakala Devata Vandanam, Asana, Shankha, Atma, Peetha
   and Guru Dhyanam to Varalakshmi, Navaratri and Saraswati. Faithful, but
   longer. Option: offer a "Short purvanga" mode for days 2–9 of Navaratri — only
   if the book itself allows it; otherwise full every time.
2. **Split rows vs. sub-steps** (§3.1). Recommended: split rows.
3. **Saved progress** resets for anyone mid-pooja when a rite's steps are
   renumbered. Acceptable, or ship rite changes outside festival days.
4. **Order**: Phase 1 first (fast, visible, no data change), then 3+4 per rite.
