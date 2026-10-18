# Sanskrit TTS bake-off

The listening test from `docs/plans/guided-mode.md` §4.5. It decides which
voice reads the mantras in Guided mode. It runs on your machine only; nothing
here ships to users or touches the database.

It renders **5 test mantras** (`mantras.json`, copied from the live app) with
**7 voice variants**, one clip per recitation line, and builds a page where you
hear them in a random order without knowing which is which, and rate them.

| Variant | Provider · model · voice | Text sent |
|---|---|---|
| `gemini-deva` | Gemini `gemini-3.8-flash-tts`, voice `Charon`, style prompt | Devanagari |
| `gemini-knda` | same | Kannada script |
| `sarvam-v4-hi-devotional` | Sarvam `bulbul:v4-flash`, `mani_hi_devotional`, hi-IN | Devanagari |
| `sarvam-v4-hi-devotional-echo` | same | Devanagari, final visarga echoed (नमः → नमह) |
| `sarvam-v4-kn` | Sarvam `bulbul:v4-flash`, `chetan_kn_conversation`, kn-IN | Kannada script |
| `sarvam-v3-kn` | Sarvam `bulbul:v3`, `mani`, kn-IN | Kannada script |
| `parler-aryan` | Indic Parler-TTS, speaker Aryan (only if you host it) | Devanagari |
| `sarvam-v4-hi-homorganic` *(off unless asked for)* | as `sarvam-v4-hi-devotional` | anusvara → nasal (शंकर → शङ्कर) |

Before anything is sent, every line goes through `sanskrit-prep.mjs`: Vedic
svara marks are removed, ꣳ becomes गुं ("gum"), and the mantra is split at
। ॥ and line breaks.

## 1. Add the keys

Put them in `.env.local` at the repo root (the same file that holds the
Supabase keys; it is never committed). Any you leave out are skipped.

```
GEMINI_API_KEY=...        # https://aistudio.google.com/apikey — use a paid-tier key
SARVAM_API_KEY=...        # https://dashboard.sarvam.ai — API subscription key
# Optional, only if you have deployed Indic Parler-TTS yourself:
# PARLER_URL=https://your-endpoint
# PARLER_TOKEN=...
```

Optional overrides, to audition other voices without editing code:
`GEMINI_VOICE` (default `Charon`; e.g. `Iapetus`, `Algenib`, `Orus`),
`GEMINI_TTS_MODEL` (e.g. `gemini-3.8-flash-lite-tts`),
`SARVAM_HI_VOICE` (default `mani_hi_devotional`; e.g. `anand_hi_documentary`),
`SARVAM_KN_VOICE` (default `chetan_kn_conversation`), `SARVAM_V3_VOICE`
(default `mani`), `SARVAM_PACE` (default `0.85`), `SARVAM_DICT_ID`
(a Sarvam pronunciation dictionary).

A self-hosted Parler endpoint must accept `POST {"text", "description"}` and
answer with audio bytes or `{"audio": "<base64>", "format": "wav"}`; see
`providers/parler.mjs`.

## 2. Run it

From the repo root:

```bash
node scripts/tts-bakeoff/run.mjs --dry-run    # optional: shows what would be sent and the cost, calls nothing
node scripts/tts-bakeoff/run.mjs              # makes the audio
```

It prints a dot per clip. When it finishes it writes, into
`scripts/tts-bakeoff/out/` (not committed):

- `audio/<variant>/…wav`: the clips
- `manifest.json`: every clip with its text, length, time taken and estimated cost
- `ab.html`: the rating page

Clips already made are reused, so running it again costs nothing. You can add
the Sarvam key on one day and the Gemini key the next: each run rebuilds the
page from everything on disk. Other flags: `--only=sarvam`,
`--variants=gemini-deva,sarvam-v4-kn`, `--mantras=gayatri`, `--show-text`
(print every line exactly as sent), `--force` (make them again).

If a provider fails 3 times in a row, that variant stops and the first error
is printed (usually a wrong key, a renamed voice, or no credit).

## 3. Rate

Open `scripts/tts-bakeoff/out/ab.html` in Chrome, Edge or Firefox (double-click
it; no server needed). Ideally the judge knows Vedic recitation; the owner
should rate too, each in their own browser.

For each mantra the text is shown in Devanagari, Kannada script and roman.
Below it are the voices, labelled **A, B, C…** in a random order.

1. Type your name at the top.
2. Press **▶ Play all** (or a line number to hear one line).
3. Rate **Pronunciation** 1–5 and **Voice** 1–5 (does it sound like a calm,
   reverent pandit?).
4. Under **Mistakes**, write one per line: the word, then what was wrong
   ("धीमहि — said dhimhi", "नमः — visarga dropped").
5. Anything else goes in **Notes**.

Ratings are saved in the browser as you go, so you can stop and come back.
Press **Reveal** only once you have finished: it shows which voice is which.

## 4. Send back

Press **Download JSON** (or **Download CSV** to open in a spreadsheet) and send
the file, plus `out/manifest.json`. Each row is one mantra × one voice, with
the scores, mistakes, notes, total length, average time per clip and
estimated cost.

**Reading the results:** for each kind of text (Vedic line, shloka, name list)
pick the variant with the best pronunciation score, using the voice score to
break ties. The plan expects the winner may differ by kind, and that is fine.
A variant whose mistakes repeat the same pattern (e.g. every final "a"
dropped) is a candidate for a normaliser rule or a Sarvam dictionary rather
than a reject.

## Cost

About **$0.10 for the whole run** at 18 Oct 2026 prices (the dry run prints the
estimate per variant): the 5 mantras are 21 lines, about 550 characters per
variant.

- Gemini 3.8 Flash TTS: $9 per million audio tokens (25 per second), so about
  1.5¢ per variant. The price doubles on 1 Jan 2027.
- Sarvam: ₹20 per 10,000 characters on v4-flash, ₹30 on v3, so about 1¢ per
  variant. New accounts get free credit.
- Parler: your own GPU time.

Even re-running with several other voices stays far under the plan's $5 limit.

## Files

| File | What |
|---|---|
| `sanskrit-prep.mjs` | Text preparation (pure functions); tests in `sanskrit-prep.test.mjs` |
| `mantras.json` | The 5 test texts and where each came from in the live DB |
| `variants.mjs` | The candidate list and the cost estimate |
| `providers/*.mjs` | One adapter per provider; the vendor docs each was checked against are in its header |
| `run.mjs` | The runner |
| `ab.html` | The rating page template (`run.mjs` fills it into `out/`) |

Tests: `node --test scripts/tts-bakeoff/*.test.mjs`
