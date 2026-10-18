# Plan: visuals for the physical actions

*Status: researched 18 October 2026, awaiting the owner's decisions (§2.3 and Phase 0). Tool facts marked [V] were checked that day on official pages; [U] is unverified. Re-check model names and prices before buying anything — image models were being retired and replaced within weeks of this research.*


Legend: **[V]** = checked today on an official page (URL in Sources). **[U]** = unverified (my own judgement, a secondary source, or something to test in the pilot).

---

## 0. TL;DR

- **Recommendation: a hybrid with deterministic animation.** Use one stylised SVG figure (a seated, front-facing karta) plus a small library of SVG hand-pose pictograms. Animate them in the app with the `framer-motion` package the app already uses, driven by data: a cue table that maps each mantra line to a touch point, a finger and a motion.
- **Nano Banana's job is limited.** It produces the **base artwork** (character sheet and hand poses) in a cleaned-up version of the book's line style, using the book's own illustrations as references. That artwork is then **traced into SVG and corrected by hand**. Generative output never ships directly into a ritual step.
- **Veo is not recommended** for the core ritual gestures. It is the wrong tool for exact finger positions: finger accuracy is not controllable, it cannot sync to a TTS cursor, it adds 0.5–2 MB per clip, it cannot be themed, and every re-render costs money. It might later be used for 1–2 non-precise "ambience" clips (camphor flame, bell), and even then it is optional.
- **The book is a big asset.** About 70 crops already cover almost every shared purvangam action: Achamanam, all six Anga Vandanam pairs, Vighneshwara Dhyanam, Pranayamam, Sankalpam with uddharani, Prana Pratishtha nyasa, kara nyasa, anga nyasa, and the avahanadi mudras. These crops are the **ground-truth references** for the redraw and for the reviewers.
- **Pilot:** Anga Vandanam, Achamanam and Pranayamam. Together they cover 22 step instances across all 6 poojas, and they are the daily-use Sandhyavandanam core.
- **Blocking issue: the DB text contradicts itself on hand positions.** See §2.3. A picture forces one answer, so the ritual reviewer must settle these before any art is made.

---

## 1. What the source material looks like

**Book crops** (`G:\My Drive\Pooja Vidhi\extracted\illustrations`, 71 PNGs):

- **Style:** 1970s–80s Indian devotional line art with halftone/stipple shading. The male figure wears a veshti and an angavastram, has three horizontal lines of vibhuti, and wears a rudraksha mala. The female figure has a braid and a saree.
- **Scan defects:** grey paper, show-through ("bleed-through") of Devanagari and English from the reverse page, blur, and low resolution (most crops are 200–700 px wide).
- **Drawing quality:** the hands are drawn competently but schematically. Fingers are often ambiguous at this size: in `p01-2` the Achamanam hand shape cannot be read reliably.

What the crops cover:

| Crop(s) | Shows | Maps to |
|---|---|---|
| `p01-2` | Man and woman sipping from the palm (profile) | Achamanam |
| `p01-3 … p02-4` (~11 crops) | Front-facing man touching cheek, eye, nostril, ear, shoulder, chest, crown | Anga Vandanam (near-complete set) |
| `p02-1`, `p03-pranayama` | Thumb/fingers on the nostrils (front and profile) | Pranayamam |
| `p02-6`, `p03-1`, `p20-1` | Knuckles on the temples, palm on the crown | Vighneshwara Dhyanam; viniyoga touches |
| `p03-3` | Anjali (joined palms) | Prarthana, Namaskaram |
| `p04-1` | Lamp | Deepa Pooja |
| `p05-1`, `p11-3` | Sprinkling water/akshatai with the fingers | Asana Pooja, prokshanam |
| `p05-3` | Hand holding and ringing the bell | Ghanta Pooja |
| `p07-3/4`, `p11-6`, `p15-3` | Uddharani and panchapatra; pouring into a plate; hand on the thigh with uddharani | Arghya/padya; Sankalpam |
| `p09-3` | Garland | Pushpam |
| `p11-4`, `p11-7` | Seated karta at naivedyam; svaha | Naivedyam (pranadi offering) |
| `p17-3` | Akshatai on one's own head | Atma Pooja |
| `p20-2 … p20-7` | Head, nostrils, chest, R/L chest, mid-chest | Prana Pratishtha (viniyoga, bija/shakti/kilaka) |
| `p20-8`, `p21-*` (incl. `p21-palms`) | Thumb rolling along a finger; palm rubbing and striking (4-panel) | Kara nyasa |
| `p22-*` (shirase, shikhayai, kavachaya, netratraya, astraya) | Anga nyasa touches | Anga nyasa |
| `p24-*`, `p25-*` | Avahana, sthapana, sannidhapana, sannirodha, avakunthana, sumukha, suprasanna, supreeta, varada mudras | Prana Pratishtha mudras |
| `p26-ksheeram` | Milk pouring | Ksheera Arghyam |
| `2-nitya-p01/p23/p26`, `3-siddhivinayaka-p03/p27/p31/p32`, `varalakshmi-113/114` | Panchayatana layout, linga, lamps, full-scene worship, pushpanjali, upayana, udvasanam, kalasha dressing | Setup and illustrative scenes |

**`illustrations-proposed/3-siddhivinayaka`** (~100 auto-proposed crops): the one I sampled (`p10-3`) is a **text false positive** (the words "(feet) (ankle) (shank) (knee)"). This set needs manual triage before anything is reused from it. [V: viewed]

**Not covered in the book crops:** camphor waving pattern, pradakshina, 8-limb and 5-limb prostration, Navakanya pooja, kalasha hand-on-mouth, Gayatri japa finger-joint counting, Gayatri upasthanam hand lock, abhivadanam (ears covered), naivedyam five-breath gestures as hand close-ups. [U: based on a sample; the crop names suggest this, but I did not open every crop.]

---

## 2. Step inventory

**Data source.** Live DB, `pooja_steps`: 217 steps across 6 poojas (sandhyavandanam 53, nitya_panchayatana 39, ganesha_standard 37, navaratri_pooja 31, varalakshmi_vratham 31, saraswati_pooja 26).

**How to read the table.**
- **Freq** = step instances in the DB / number of poojas that contain the step.
- **Sandhyavandanam** is done **daily, three times**. Its steps therefore weigh more in real use than their row count suggests.
- **Complexity** (1–5) means how hard the action is to convey and to get right visually: 5 = finger-precise and sequenced; 1 = obvious from the text.
- **Book** = a usable book illustration exists (y / partial / n).

### 2.1 Ranked by priority (complexity × frequency)

| # | Step (where) | Physical action | Freq | Cx | Book | Visual form proposed |
|---|---|---|---|---|---|---|
| 1 | **Anga Vandanam** (all 6; sandhya ×3: steps 2/21/52) | 12 names, 6 pairs; a specific finger of the right hand to a specific body point (thumb→cheeks, ring→eyes, index→nostrils, little→ears, middle→shoulders, all→chest/crown) | 8 / 6 | 5 | **y** (≈11 crops) | Body map; the active point pulses in sync with the current line; inset finger pictogram |
| 2 | **Pranayamam** (all 6; sandhya 4, 27, plus "do one/ten pranayamas" inside 14–17, 31) | Fold index+middle; thumb on the right nostril, ring+little on the left; inhale L, hold, exhale R, timed to the 3 parts of the mantra | 7 / 6 (+5 implicit) | 5 | **y** | Face close-up with the hand; nostril airflow arrow; IN/HOLD/OUT phase bar synced to the mantra parts |
| 3 | **Achamanam** (all 6; sandhya ×3: 1/20/51) | Right hand in gokarna shape (index folded to the thumb base, palm cupped); uddharani of water; sip at each of 3 names; lips do not touch the hand | 8 / 6 | 4 | partial (`p01-2`, finger shape unreadable) | Hand close-up: shape → fill → sip; 3 sip counters synced to the names |
| 4 | **Sankalpam** (all 6; ganesha ×2; sandhya ×6 incl. japa) | Akshatai (± water/flower) in the right palm, covered by the other hand, resting on the right thigh; release to the north at the end | 12 / 6 | 3 | partial (`p15-3`) | Still pose plus a 2-frame "release" at the end. **Text conflicts (§2.3)** |
| 5 | **Prana Pratishtha** (ganesha 21 full nyasa; navaratri/saraswati/varalakshmi: fingertip touch) | Ganesha: viniyoga touches head/nostrils/chest; bija/shakti/kilaka on R/L/mid chest; kara nyasa thumb-roll per finger; anga nyasa sequence; dig-bandha around the head; 9 avahanadi mudras. Others: fingertips on the kalasha/books | 4 / 4 | 5 (ganesha) / 2 | **y** (`p20–p25`) | Same body map as Anga Vandanam (new touch-point set) + hand-pose cards for kara nyasa and the mudras |
| 6 | **Vighneshwara Dhyanam** (all 6; sandhya ×2) | Tap both temples with the knuckles (5 times in sandhya) | 7 / 6 | 2 | **y** | Body map: temples flash ×5 |
| 7 | **Karpura Neerajanam** (5 poojas) | Stand; circle camphor clockwise ×3 at feet → middle → face; bell in the left hand; then palms to flame → eyes (nitya) | 5 / 5 | 3 | n | Deity silhouette + a path animation showing the clockwise direction and 3 heights |
| 8 | **Pradakshina & Namaskaram** (5 poojas; varalakshmi has 2 steps) | Turn clockwise in place ×3; prostrate: men ashtanga (8 limbs), women panchanga (5) | 6 / 5 | 3 | n | Top-down turn diagram; two prostration silhouettes chosen by `gender_rule` / karta toggle, with the limbs that touch highlighted |
| 9 | **Kalasha Pooja** (5) | Sandal, kumkum, akshatai on the vessel; right palm over the mouth while reciting; Vishnu at the mouth, Rudra at the neck, Brahma at the base | 5 / 5 | 2 | partial (`varalakshmi-113-kalasha` shows a dressed kalasha, not the hand) | Kalasha diagram; zones (mouth/neck/base) highlight as the verse names them |
| 10 | **Ghanta Pooja** (5) | Akshatai on the bell; ring with the LEFT hand | 5 / 5 | 1 | **y** (`p05-3`) | Still image (left hand emphasised) |
| 11 | **Naivedyam** (5 poojas, 6 steps) | Sprinkle with the vyahritis; circle water around the plate clockwise ×3; water beneath; the "feeding" gesture at each of 5 svahas (pranaya, apanaya…), each traditionally with its own finger combination [U] | 6 / 5 | 4 | partial (`p09-2`, `p11-4`, `p11-7`) | Top-down plate + circling arrow; 5 hand-gesture cards synced to the svaha lines |
| 12 | **Pushpanjali / Mantra Pushpam** (5) | Flowers in both cupped palms, offered at the feet | 5 / 5 | 1 | **y** (`3-siddhivinayaka-p27`) | Still |
| 13 | **Dhoopam & Deepam** (5) | Circle incense, then the lamp, ringing the bell; water after | 5 / 5 | 2 | partial (`p04-1`) | Reuse the circling path from #7 |
| 14 | **Udvasanam / Yathasthanam / Visarjanam** (5 poojas, 6 steps) | Move the idol/kalasha slightly north; nitya: arms spread then crossed to the chest | 6 / 5 | 2 | **y** (`3-siddhivinayaka-p32`) | Small directional diagram (north arrow); nitya: 2-frame embrace |
| 15 | **Arghya / Padya / Achamaniya** (5 poojas, 10 steps) | Pour from the uddharani into the plate (not back into the panchapatra); sandhya: water from both cupped hands falls from the fingertips | 10 / 5 | 2 | **y** (`p07-3/4`) | Still + "into the plate, not the panchapatra" callout |
| 16 | **Anga Pooja** (4) | Flower at each named limb of the deity, feet upward | 4 / 4 | 2 | n | Deity body map; reuses the touch-point engine (deity figure, not karta) |
| 17 | **Manjal Pillaiyar / Vighneshwara Pooja** (4) | Shape a turmeric cone on a betel leaf | 4 / 4 | 2 | n | Still (how-to-shape, 3 frames) |
| 18 | **Asana Pooja** (2) | Sprinkle water on the seat while sitting OUTSIDE it, then sit | 2 / 2 | 2 | **y** (`p05-1`) | Still |
| 19 | **Shankha Pooja / Teertham** (nitya 9, 38; ganesha 16) | Conch on a stand; nitya: circle the conch ×3, shift hands, sprinkle | 3 / 2 | 3 | n | Path animation |
| 20 | **Atma Pooja** (2) | Akshatai on one's own head | 2 / 2 | 1 | **y** (`p17-3`) | Still |
| 21 | **Ksheera Arghyam** (ganesha 35, varalakshmi 29) | Milk in the uddharani; pour ×3 per verse (12 in all) | 2 / 2 | 2 | **y** (`p26-ksheeram`) | Still + pour counter synced to "idam arghyam" |
| 22 | **Navakanya Pooja** (navaratri 29–30) | Seat a girl; padya, cloth, sandal, flowers at 9 names | 2 / 1 | 2 | n | Stylised still only. **Never AI-generate a realistic child** (§7) |
| 23 | **Sharadu Dharanam** (varalakshmi 27) | Husband ties the thread on the wife's right wrist, 3 knots | 1 / 1 | 2 | n | Still |
| 24 | **Gayatri Japa** (sandhya 35–37) | Count on the finger joints with the right thumb: clockwise circuit of 10, then anticlockwise | 3 / 1 (daily) | 5 | n | Hand diagram with numbered joints and an animated thumb path; counter synced to recitations |
| 25 | **Gayatri Upasthanam** (sandhya 38–40) | Lock the hands right-over-left, rotate, release; ring finger to the floor, then to the brow | 3 / 1 (daily) | 4 | n | 3-frame hand sequence |
| 26 | **Marjanam / Punar Marjanam** (sandhya 9, 13) | Ring finger sprinkles on the head at lines 1–7; touch the thighs at 8; sprinkle at 9; water around the head clockwise | 2 / 1 (daily) | 4 | partial | Body map, per-line cues (same engine as #1) |
| 27 | **Pranava Japa / Gayatri Avahanam / Nyasa / Asana Mantra** (sandhya 25, 31–33) | Head, nostrils, chest for rishi/chandas/devata; palms before the face turned inward; ring finger floor→brow | 4 / 1 (daily) | 3 | **y** (`p20-1/2/3`) | Body map (reuse the viniyoga touch set from #5) |
| 28 | **Abhivadanam / Samarpanam** (sandhya 45, 50) | Cover both ears with the hands, say the pravara, touch the floor | 2 / 1 (daily) | 2 | n | Still |
| 29 | **Samashti Abhivadanam / Dig Vandanam / Yama, Harihara, Surya Vandanam** (sandhya 44, 46–49) | Turn to face each quarter as named | 5 / 1 (daily) | 2 | n | Compass rose; the active direction highlighted per line |
| 30 | **Surya Namaskara postures** (sandhya 23) | Ten postures with the breath | 1 / 1 | 4 | n | 10-frame silhouette strip |
| 31 | **Surya Prarthana noon** (sandhya 42) | Look at the sun through locked hands | 1 / 1 | 3 | n | Still. The text itself says "properly learnt from a teacher" |
| — | Remaining ~120 steps (archana lists, avahanam, vastram, gandham, prarthana, kshama, opening the panchayatana, rajopachara, tarpanam, etc.) | Offer a flower/akshatai/water, or no physical action | — | 1 | — | None, or a shared generic "offer at each name" icon |

### 2.2 Coverage math

- **Group A** (rows 1–6) is the shared purvangam plus Prana Pratishtha: about **50 step instances**, every pooja, and daily via Sandhyavandanam. One body-map engine plus one hand-pose library covers rows 1, 2, 3, 5, 6, 26 and 27.
- **Group B** (rows 7–16) is the shared upachara steps: about **55 instances**. These are mostly stills plus 2 path animations (circling, pradakshina).
- **Groups A + B together come to roughly 105 of the 217 steps (~48%)**, and in practice almost all the physical actions a newcomer gets wrong.

### 2.3 Data inconsistencies a visual will expose (resolve before drawing)

1. **Sankalpam hand position differs across poojas:**
   - ganesha 5: "left palm upright on the right thigh with the right palm crossed over it"
   - ganesha 13, navaratri 6, saraswati 6: "right hand … close/cover it with the left … right thigh"
   - sandhyavandanam 5–7: "Clasp the right palm over the left"
   - nitya 5: "Hold akshatai in the right hand" (no covering)
   - varalakshmi 6: "Hold water in the right palm"

   The brief says "right palm covered by the left". One canonical pose (or explicit per-tradition variants) must be chosen by the reviewer.
2. **Pranayamam:** the purvangam text ("Close the right nostril with the thumb… close both") gives no finger shape. Sandhyavandanam 4/27 specifies "fold the index and middle fingers…" (the common Vishnu-mudra form). The visual should use the sandhya form everywhere, and the purvangam text should be updated to match. [Reviewer to confirm.]
3. **Achamanam:** the purvangam text never describes the hand shape. Sandhyavandanam 1 does ("fold the forefinger … against the thumb and curl the other three"). The same unification applies.
4. **Anga Vandanam #11 Padmanabha** = "Chest, all fingers" in the DB. Some traditions use the navel (nabhi) [U]. Check against book crop `p02-4`/`p02-5` and the reviewer's sampradaya.
5. **Karpura Neerajanam:** ganesha and varalakshmi say circle "at the feet, then the middle, then the face". Navaratri and saraswati say "three times clockwise". Decide whether it is one pattern or two.

---

## 3. Current facts on the tools (verified 2026-10-18)

### 3.1 Google image models ("Nano Banana") — Gemini API [V]

| Name | API id | Std price (per image) | Batch | Character refs | Notes |
|---|---|---|---|---|---|
| **Nano Banana 2.1** (GA 6 Oct 2026) | `gemini-nano-banana-2.1` | $0.0336 (1K) · $0.0504 (2K) · $0.113 (4K) | half | up to 4 characters; up to 10 objects; 14 refs total | Newest Flash tier; Google cites improved multi-turn character consistency |
| Nano Banana 2 (Gemini 3.1 Flash Image) | `gemini-3.1-flash-image` | $0.045 (0.5K) · $0.067 (1K) · $0.101 (2K) · $0.151 (4K) | half | 4 chars | **Shuts down 29 Oct 2026** per changelog as quoted by a secondary source [U] — do not build on it |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | $0.0336 (1K only) | half | none | No character refs; unsuitable here |
| **Nano Banana Pro** (Gemini 3 Pro Image) | `gemini-3-pro-image` | $0.134 (1K/2K) · $0.24 (4K) | $0.067 / $0.12 | up to 5 characters, 6 objects, **3 style refs** | Only model with explicit style references; best fit for matching the book's line style |
| Nano Banana (Gemini 2.5 Flash Image) | `gemini-2.5-flash-image` | $0.039 | $0.0195 | — | **Deprecated; shut down 2 Oct 2026** (already past) |

Other image-model facts:
- All outputs carry an invisible **SynthID** watermark [V].
- The docs page does not mention **transparent-background** output [V: not found]. Plan on white backgrounds and remove them in the vectorisation step.
- A secondary source quotes the 2.1 4K price as $0.0756. Google's pricing page says $0.113 [V: Google page used].
- The **Gemini consumer app** (where the owner may be using "Nano Banana") may add a **visible** watermark on some plans and has different data terms [U]. For production art, use **AI Studio / the paid Gemini API**. Paid-services terms: Google "doesn't use your prompts … or responses to improve our products", and "Google won't claim ownership" of the output. On unpaid services, inputs and outputs may be read by human reviewers [V]. The book scans are copyrighted material, so feeding them as references through a paid key is preferable.

### 3.2 Google video (Veo 3.1) [V]

| Model | id | $/s (with audio) | Durations | Refs | Notes |
|---|---|---|---|---|---|
| Veo 3.1 | `veo-3.1-generate-preview` | $0.40 (720p/1080p), $0.60 (4K) | 4/6/8 s (8 s forced with refs/1080p/4K) | ≤3 style/content ref images | First + last frame interpolation; extension |
| Veo 3.1 Fast | `veo-3.1-fast-generate-preview` | $0.10 (720p), $0.12 (1080p), $0.30 (4K) | same | ≤3 refs | Cheapest model that accepts reference images |
| Veo 3.1 Lite | `veo-3.1-lite-generate-preview` | $0.05 (720p), $0.08 (1080p) | 4/6/8 | **no refs** | Image-to-video only |

Other video facts:
- **Aspect ratios:** 16:9 or 9:16 only. Frame rate is 24 fps.
- **Audio** is always generated, so it must be stripped.
- **SynthID** is applied to every clip.
- **personGeneration:** image-to-video, interpolation and reference images allow only `allow_adult` (so no children, which rules out Navakanya). Latency ranges from 11 s to 6 min.
- The models are still `-preview` IDs, which risks pricing and behaviour changes.
- The pricing page also lists **Gemini Omni Flash** at about $0.10/s video [V], which was not evaluated.

### 3.3 Vector/animation tooling

- **framer-motion `^13.2.0`** is **already a dependency** of the app [V: package.json]. It needs no new runtime, animates SVG attributes and paths, and supports `useReducedMotion`.
- **Rive:**
  - Free plan exports `.riv` with a splash screen. Cadet is $9/seat/mo and removes it [V].
  - Web canvas runtime: ~567 KB brotli, lite ~222 KB; most of that is WASM (Rive docs, Jan 2026) [V via search snippet; not opened].
  - It is overkill when the state machine is "highlight point N".
- **Lottie / dotLottie:** the ThorVG-based dotlottie-web runtime is "~150 KB" (vendor claim) [U]. It is good for designer-authored timelines, but per-line sync means driving frames from code anyway.
- **Vectorisation:**
  - Recraft vectorise API ≈ $0.01/image [V, official pricing doc via search].
  - Open-source VTracer/Potrace cost $0 [U: not re-checked today].
  - Adobe Illustrator Image Trace if the owner has it.
  - All of them need hand clean-up for hands.

---

## 4. Comparison of approaches

| Criterion | 1. AI keyframe stills (Nano Banana) → frame animation | 2. AI video (Veo 3.1) | 3. Deterministic SVG body map + hand pictograms (framer-motion) | 4. Clean up / redraw the book's illustrations |
|---|---|---|---|---|
| **Finger accuracy** | Medium–low. Hands are the known weak point; Pro + reference images help, but each frame needs inspection; extra/merged fingers and wrong-hand errors are typical [U, expected] | **Low and uncontrollable.** Fingers drift between frames; a correct start/end frame does not guarantee the in-between; fixes need a full re-render | **Exact by construction.** Once a pose is drawn right it stays right; points come from data | High (the book is the authority), but the originals are small and ambiguous at finger level |
| **Consistency across ~60 visuals** | Medium: character refs (4–5) and style refs (Pro, 3) help, but drift accumulates | Low–medium | Perfect (one figure, one stroke style) | Medium: the book itself varies (different hands drew the figures) |
| **Sync with Guided mode / TTS line highlight** | Poor–ok: fixed frame per line is possible if a still is made per line | **Poor:** fixed-length clip, cannot follow variable TTS speed | **Native:** `activeLine → cue → highlight`; follows any speed, pause or seek | Ok as a per-step still; no per-line sync |
| **Phone payload** | 30–80 KB per WebP frame; 300 KB–1 MB per animated WebP [U] | 0.5–2 MB per 6 s H.264/AV1 clip at 720p [U] | 5–25 KB per SVG (gzip), reused everywhere; 0 KB new runtime | 20–60 KB per cleaned SVG/WebP |
| **Dark/light theme** | Raster: needs two renders or a CSS `invert` hack | None (baked colours) | `currentColor` and CSS tokens; free | Free if vectorised; awkward if raster |
| **Accessibility** | alt text per frame; reduced motion = show the key frame | Captions needed; reduced motion = poster | Text equivalents are generated from the same cue data ("Ring finger → right eye"); `prefers-reduced-motion` = static highlight; colour and shape both used | alt text |
| **Ritual-review burden** | High: every frame, every regeneration | Very high: every frame of every clip | **Low: review each pose once and each cue table once (plain data)** | Medium: once |
| **Cost** (cash) | Low: about $5–$30 for the whole set (§6) | Moderate: $0.60–$3.20 per attempt; realistically $100–$400 with retries | ~$0 tools; time cost is the main cost | ~$0–$10 |
| **Licensing** | You own outputs per the API terms; SynthID embedded; copyrightability of pure AI output is weak [U] | Same, plus "preview" models | Owner's own traced artwork; cleanest position | The book is © the publisher (Giri). Redrawing in a new style still derives from it, so **ask permission or credit it** [U: legal check] |
| **Effort** | Prompting + selection + QA | Prompting + many retries | Authoring the engine (~2–4 days) + art (~1–2 weeks part-time) | Low–medium |
| **Verdict** | Use as **art source**, not as shipped animation | **Not for ritual gestures.** Optional for ambience | **Primary delivery** | **Primary reference** and fallback for rare steps |

---

## 5. Recommended hybrid (and why)

### The pipeline

**Book crop (ground truth)**
→ **Nano Banana Pro or 2.1**: redraw in a clean, consistent line style, using the book crop and the character sheet as references
→ **Human selection**: reject anatomically wrong hands
→ **Vectorise** (VTracer / Recraft / Illustrator) and **hand-correct the SVG**: fingers, stroke weight, `currentColor`
→ **Ritual review** of the static pose
→ **Commit the SVG to the repo**
→ **Animate in code** (framer-motion) from **cue data in Supabase**, synced to the active line.

### What gets drawn

1. **One karta figure** (front-facing, seated, waist-up), in male and female variants. The book has both styles (`p01-2`).
   - Named **touch-point anchors** sit in the SVG: `cheek_r`, `cheek_l`, `eye_r`, `eye_l`, `nostril_r`, `nostril_l`, `ear_r`, `ear_l`, `shoulder_r`, `shoulder_l`, `chest`, `chest_r`, `chest_l`, `navel`, `crown`, `forehead`, `shikha`, `temples`, `thigh_r`, `thigh_l`, `head`, `brow`.
   - Mirror convention: **the figure faces the user**, so the figure's right is on screen-left. Show a small "your right" label, because this is a classic confusion.
2. **Hand-pose library (~25 SVGs).** Each pose is drawn once and reused:
   - Thumb-out, ring-finger-point, index-point, little-finger-point, middle-finger-point, all-fingers
   - Gokarna (achamana)
   - Pranayama (index and middle folded, in left-close, right-close and both-closed states)
   - Sankalpa (palms covered on the thigh)
   - Anjali, cupped palms (pushpanjali/arghya), knuckles (temple tap)
   - Kara-nyasa thumb-roll per finger, palm strike (astra)
   - Bell in the left hand, uddharani pour
   - The 9 avahanadi mudras
   - The 5 pranadi naivedya gestures
   - Japa finger-joint map
3. **Small diagram set:** kalasha zones, plate-circling path, camphor path (3 heights), pradakshina top-down, compass rose, ashtanga/panchanga silhouettes.
4. **Book stills (cleaned) for the long tail:** remove bleed-through, vectorise or keep as a 1-bit WebP, and show them as reference images ("as shown in the book") where no custom visual exists.

### Why this hybrid

- **Correctness first.** Ritual accuracy is the product's core promise, and the app already has `verified_by`/`verified_at` and a "reviewed_by is the gate" principle for audio (migration 0001 comment). Deterministic visuals keep the reviewable unit small and stable. A cue row "Govindaya → eye_l, ring" can be checked by a pandit in a spreadsheet. A 6-second AI clip cannot be checked that way.
- **Guided mode needs per-line control.** TTS speed varies, users pause, and Sandhyavandanam repeats. Only code-driven visuals can follow `activeLineIndex`.
- **Scale through reuse.** Anga Vandanam appears 8 times, Pranayamam 7 times plus implicit repeats, and Prana Pratishtha shares the same body points. One engine plus data covers about 50 step instances.
- **Nano Banana is used where it is strong.** It produces a consistent, attractive, culturally appropriate style quickly, from book references. Hands are fixed once by a human in vector.

---

## 6. Model/tool choices and cost estimate

| Use | Choice | Why | Est. cost |
|---|---|---|---|
| Character sheet + style exploration | **Nano Banana Pro** (`gemini-3-pro-image`) at 2K, via AI Studio / paid API | Only model with style refs (3) plus 5 character refs; best fidelity to the book style | ~40 images × $0.134 ≈ **$5.40** |
| Bulk hand poses and diagrams | **Nano Banana 2.1** (`gemini-nano-banana-2.1`) at 2K; **Batch** for bulk | Cheaper, GA, newest; character consistency improved [V Google claim] | ~25 poses × ~8 attempts = 200 × $0.0504 ≈ **$10** (batch ≈ $5) |
| Book clean-up (bleed-through removal, redraw) | Nano Banana 2.1 image editing | Single-image edit | ~70 × 2 × $0.0504 ≈ **$7** |
| Vectorisation | VTracer (free) first; Recraft vectorise ($0.01/img) as a fallback | Hand clean-up needed anyway | ≈ **$0–$2** |
| Animation | **framer-motion (already installed)** + inline SVG React components | Zero new runtime; themeable; code-driven sync | $0 |
| Optional authoring tool | Rive (Cadet $9/mo) only if a designer prefers a timeline editor | Not needed for the pilot | $0–$9/mo |
| Optional ambience video | Veo 3.1 Fast, 720p, 4–6 s, audio stripped | Non-precise moments only (camphor flame) | ~$0.60/clip; budget $20 |
| **Total cash for the pilot + full roll-out** | | | **≈ $30–$60** (plus human time: art clean-up ~20–40 h, engine ~20–30 h, review ~6–10 h) [U: estimates] |

Do **not** build on `gemini-3.1-flash-image` (secondary report of shutdown on 29 Oct 2026) or `gemini-2.5-flash-image` (shut down 2 Oct 2026).

---

## 7. Accuracy-verification workflow

1. **Canonical text first.** The reviewer resolves the §2.3 conflicts. Instruction text and cue data are updated together, in the same migration.
2. **Two-key review per artefact.**
   - (a) **Ritual reviewer:** a practising priest or vaidika from the family's sampradaya (Tamil Smarta, matching the book), or at minimum an elder who performs these daily. They check pose, finger, side, order and count.
   - (b) **Owner:** checks consistency with the book crops and the DB text.
   - Record `reviewed_by` and `reviewed_at`, reusing the `media_assets` convention.
   - The UI shows only rows where `reviewed_at is not null` (the same gate as audio).
3. **Review on device.** Use a hidden `/review/visuals` page that steps through every cue line at real size on a phone, in light and dark mode, with the book crop side by side. The reviewer ticks or comments per cue.
4. **Regression tests.** A unit test asserts that each Anga Vandanam cue's `finger` and `point` equal a fixture table. Extend the existing verify-live check (commit `153828f`) so that every step with a `visual_sequence_id` has a cue count equal to its number of mantra lines.
5. **AI output is never final.** Every Nano Banana image is a draft, and only a human-corrected SVG is committed. The prompt, model ID, seed/refs and source crop are logged in `step_visuals.provenance` for audit.
6. **Variant handling.** Where sampradayas differ (Padmanabha chest vs navel; Sankalpam hand cover), store a `variant` on the cue and show "some families…" text instead of picking silently.

## 8. Accessibility, performance, theming

- **Text parity.** Every visual has a generated caption from the cue data, e.g. "Ring finger of the right hand → left eye", in en/ta like the rest of the app. Screen readers get the caption via `aria-live="polite"` in Guided mode, and the SVG is `aria-hidden`.
- **Motion.**
  - Respect `prefers-reduced-motion`: static highlight, no pulsing or path drawing.
  - No auto-looping visuals outside Guided mode; tap to play.
  - Loops: ≤ 3 cycles, then rest.
- **Colour.**
  - The highlight uses shape as well as colour (ring + filled dot), plus the step's accent token.
  - Lines use `currentColor`, so dark mode works through the existing theme tokens. Avoid pure-white fills (use `var(--surface)`).
- **Size budget.**
  - Body figure ≤ 25 KB gzip; each hand pose ≤ 6 KB; the whole visuals bundle ≤ 150 KB gzip, lazy-loaded per step with `next/dynamic` or inline components.
  - Book stills as 1-bit/greyscale WebP ≤ 40 KB.
  - Video, if ever used: ≤ 600 KB, `preload="none"`, poster frame.
- **Layout.**
  - Sticky visual above the mantra on phones (≈ 40% of viewport height), collapsible.
  - The "your right / your left" label must stay visible.
  - Large touch targets to replay each line.
- **Offline (later).** SVGs in the bundle cache naturally; this matters for pooja rooms with poor signal.

## 9. Sync with the future Guided mode

- **Line source.** Mantra lines currently live as newline-separated text in `pooja_steps.mantra_sanskrit` / `mantra_tamil` / `mantra_translit`. Anga Vandanam has **no `archana_items` rows** [V]. Archana-style steps do use `archana_items(seq)`.
- **Cursor contract.** Guided mode emits `{stepId, lineIndex, phase: 'start' | 'end'}` (the `lineIndex` is either a mantra-line index or an `archana_items.seq`). The visual component subscribes and looks up the cue for `(sequence, lineIndex)`.
- **TTS boundaries.**
  - Web Speech API `SpeechSynthesisUtterance` `onboundary` is unreliable for Sanskrit/Tamil voices on mobile [U].
  - Speak **one utterance per line** and advance on `onend`. Pre-recorded audio (already modelled in `media_assets` with `audio`) can use per-line timestamps instead.
- **Timed sub-cues** (Pranayamam IN/HOLD/OUT; Achamanam sip after each name): the cue has `at: 'start' | 'end'` and an optional `hold_ms`. The pranayama phase bar follows the three mantra parts ("breathe IN … reciting s…") rather than wall-clock time.
- **Repeats.** Sandhyavandanam steps 20/21 and 51/52 point to the same `visual_sequence` as steps 1/2, so they need zero new data.

---

## 10. Data model change

Prefer **reusable sequences** over per-step copies, because Anga Vandanam, Achamanam and Pranayamam are identical across 6 poojas. This also fits the existing comment in 0001: "mudra animations are reusable across poojas", and the existing `media_kind` enum already has `'mudra'`.

```sql
-- Reusable visual assets (SVG components or files)
create table public.visual_assets (
  id            text primary key,              -- 'hand.ring_point', 'figure.karta_m', 'book.p05-3'
  kind          text not null check (kind in ('figure','hand_pose','diagram','book_still','video')),
  storage_path  text,                          -- null when it is an in-repo React SVG component
  alt_en        text not null,
  alt_ta        text,
  source        text not null,                 -- 'book p02-3' | 'nano-banana-pro→traced' | 'original'
  provenance    jsonb,                         -- model id, prompt, refs, date; for audit
  reviewed_by   text,
  reviewed_at   timestamptz
);

-- A reusable sequence such as 'anga_vandanam_12', 'achamanam_3', 'pranayamam'
create table public.visual_sequences (
  id            text primary key,
  figure_asset  text references public.visual_assets(id),
  title_en      text not null,
  reviewed_by   text,
  reviewed_at   timestamptz
);

-- One cue per mantra line (or archana seq)
create table public.visual_cues (
  sequence_id   text not null references public.visual_sequences(id) on delete cascade,
  line_index    integer not null,              -- 0-based mantra line, or archana seq
  touch_point   text,                          -- 'eye_l', 'nostril_r', 'temples', null
  hand          text check (hand in ('right','left','both')),
  finger        text check (finger in ('thumb','index','middle','ring','little','all','knuckles','palm')),
  pose_asset    text references public.visual_assets(id),
  motion        text,                          -- 'tap','tap_x5','hold','roll_base_to_tip','circle_cw_x3','sip'
  at            text not null default 'start' check (at in ('start','end')),
  hold_ms       integer,
  karta_gender  text,                          -- null = all; 'male'/'female' for prostration etc.
  variant       text,                          -- sampradaya variant key, null = canonical
  caption_en    text not null,                 -- generated text equivalent, reviewed
  caption_ta    text,
  primary key (sequence_id, line_index, coalesce(variant,''))  -- or a surrogate id + unique index
);

-- Link steps to a sequence (or a single still)
alter table public.pooja_steps
  add column visual_sequence_id text references public.visual_sequences(id),
  add column visual_asset_id    text references public.visual_assets(id);  -- simple still for the long tail
```

Notes on the schema:
- **Primary key:** Postgres does not allow an expression in a primary key. Use a surrogate `id` plus `unique (sequence_id, line_index, variant) nulls not distinct`, which is PG15+ (Supabase supports it) [U: check the project's PG version].
- **RLS:** read-only for anon, matching migration `0038_rls_read_only.sql`.
- **Integrity check:** add to the verify-live script: for every step with `visual_sequence_id`, `count(cues where variant is null) = number of lines in mantra_sanskrit`.
- **Alternative (lighter):** put `touch_point`/`finger` columns on `archana_items`. Rejected, because Anga Vandanam has no archana rows and the data would be duplicated 8 times.

---

## 11. Phased plan

### Phase 0 — Decisions (½ day of owner time + reviewer)

- Resolve §2.3: Sankalpam hand, pranayama finger form in purvangam, achamana hand text, Padmanabha point, camphor pattern.
- Pick the reviewer(s).
- Decide whether to ask the publisher (Giri Trading) for permission or credit for book-derived art [U legal].

### Phase 1 — Pilot: Anga Vandanam + Achamanam + Pranayamam (≈ 1.5–2 weeks part-time)

1. **Style frame.**
   - Feed Nano Banana Pro 3 style refs (`p01-3`, `p02-3`, `p03-pranayama`) and generate a clean line-art front-facing seated karta (male), plus a female variant.
   - Generate ~10 candidates and pick 1.
   - Prompt pattern: *"Clean black line art in the style of the reference images, no halftone, no text, white background, front-facing seated South Indian man, veshti and angavastram, three lines of vibhuti, hands at rest, symmetrical, 2K."*
2. **Hand poses.** Use Nano Banana 2.1 with the chosen figure as a character ref and the book crop as an object ref, one pose at a time:
   - 6 Anga Vandanam finger poses
   - gokarna (achamanam), at 3 stages
   - pranayama (L closed / R closed / both)

   For each pose, generate ≥ 6 candidates. Reject any with a wrong finger count or the wrong hand.
3. **Vectorise and correct.** Use VTracer and then hand-correct in Inkscape or Illustrator. Add anchors and `currentColor`. Commit to `src/components/visuals/`.
4. **Engine.**
   - Write a `<StepVisual sequenceId lineIndex />` component: framer-motion pulse on the anchor, the hand-pose inset, the caption, reduced-motion fallback, and dark/light.
   - Until Guided mode exists, `lineIndex` comes from tapping a mantra line in `StepSheet`.
5. **Data.** Migration with the 3 tables, 3 sequences (`anga_vandanam_12`, `achamanam_3`, `pranayamam`) and their cues. Link the 22 step instances.
6. **Review.**
   - Run the `/review/visuals` page with the reviewer on a phone.
   - Fix issues, then set `reviewed_at`.
   - Test locally plus a browser click-through before merging to main (main auto-deploys to Vercel).

**Pilot success criteria (all required):**
- [ ] The reviewer signs off on 100% of the 12 + 3 + 3 cues and all poses, with **zero** finger/side/order errors.
- [ ] 5 newcomer testers (unfamiliar with the ritual) perform Anga Vandanam from the app alone; ≥ 4 of 5 hit all 12 points with the correct finger, as judged by the reviewer or on video.
- [ ] The visual follows a manual line cursor with < 100 ms lag on a mid-range Android; no layout shift.
- [ ] Payload added for the pilot ≤ 60 KB gzip; Lighthouse mobile performance does not drop by more than 2 points.
- [ ] Correct in light, dark and reduced-motion modes; the screen-reader caption is announced per line.
- [ ] The art pipeline yields a usable pose in ≤ 10 generations on average. If not, drop AI and trace the book crops directly. This is the decision point for how much Nano Banana is used in roll-out.

### Phase 2 — Group A remainder (≈ 1–2 weeks)

- Vighneshwara Dhyanam (temples ×5) and the Sankalpam pose.
- Prana Pratishtha (ganesha): viniyoga, bija/shakti/kilaka, kara nyasa (5 fingers + palms), anga nyasa (6), dig-bandha, 9 avahanadi mudras.
- The other Prana Pratishtha steps: fingertip touch still.
- Sandhyavandanam: Marjanam, the nyasa touches, Pranava/Gayatri avahanam.

### Phase 3 — Group B diagrams (≈ 1 week)

- Camphor path (3 heights, clockwise), dhoopam/deepam reuse.
- Pradakshina + ashtanga/panchanga silhouettes, driven by the karta toggle and `gender_rule`.
- Kalasha zones, plate circling + 5 pranadi gestures.
- Ghanta, arghya, pushpanjali stills (cleaned book art).

### Phase 4 — Sandhyavandanam daily specials and the long tail

- Gayatri japa joint map (animated thumb path + counter), upasthanam hand lock, dig-vandanam compass, abhivadanam, Surya namaskara strip.
- Navakanya pooja: stylised still only, no realistic child imagery.
- Cleaned book stills for the remaining steps.

### Phase 5 — Guided mode integration

- Wire the TTS/audio line cursor to `<StepVisual>`. Add the timed sub-cues (pranayama phases, sip timing).
- Optional: one Veo ambience clip if testers ask for "real" footage. Mark it clearly as illustrative.

---

## 12. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Wrong finger/side shipped (AI hand errors, mirror confusion) | Med | Deterministic SVG; two-key review; fixture tests; "your right" label |
| Sampradaya disagreement (users from other traditions say "that's wrong") | High | `variant` on cues; state "as taught in Giri's Sampradaya Vratha Pooja Vidhi"; feedback link |
| DB text contradicts the visual (§2.3) | Certain today | Resolve in Phase 0; integrity check in verify-live |
| Book copyright for derived art | Med [U] | Ask the publisher; credit; the final art is a substantial redraw; don't ship raw crops without permission |
| Model churn (2.5 Flash Image already shut down; 3.1 Flash Image reportedly ending 29 Oct 2026; Veo still preview) | High | Art is generated once and frozen as SVG, so the runtime has no AI dependency |
| Nano Banana style drift / can't match the line style | Med | Pro with 3 style refs; fallback is tracing the book crops directly |
| Children imagery (Navakanya) | — | Never generate realistic minors; stylised icon only (Veo also blocks this: `allow_adult` only for image-to-video) |
| Cultural/religious sensitivity of AI-generated deity images | Med | Don't AI-generate deity faces; use simple outline or symbol placeholders; reviewer approval |
| Mobile perf / battery from animation | Low | SVG transforms only; pause when off-screen (IntersectionObserver); reduced motion |
| Reviewer bottleneck | Med | Small reviewable units (cue tables); batch review sessions on the review page |
| TTS boundary events unreliable for Sanskrit/Tamil | Med [U] | One utterance per line; prefer recorded audio with timestamps |

---

## 13. Sources

Google, verified 2026-10-18:
- Gemini API pricing (image + Veo prices, model IDs, deprecations): https://ai.google.dev/gemini-api/docs/pricing
- Image generation docs (models, reference-image limits, resolutions, SynthID): https://ai.google.dev/gemini-api/docs/image-generation
- Nano Banana 2.1 model page: https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1
- Veo 3.1 docs (durations, refs, interpolation, personGeneration, audio, SynthID): https://ai.google.dev/gemini-api/docs/veo
- Gemini API Additional Terms (ownership, paid vs unpaid data use): https://ai.google.dev/gemini-api/terms

Secondary (release date, 3.1 Flash Image shutdown date) [U]:
- https://letsdatascience.com/news/google-rolls-out-nano-banana-21-image-model-c6ac3b89
- https://www.orcarouter.ai/fr/blog/gemini-nano-banana-2-1-ga

Animation/vector tooling:
- Rive pricing: https://rive.app/pricing
- Rive runtime sizes: https://rive.app/docs/runtimes/runtime-sizes.md
- dotLottie runtimes (vendor): https://lottiefiles.com/runtimes
- Recraft API pricing (vectorise $0.01): https://www.recraft.ai/docs/api-reference/pricing

Local sources:
- Live DB `pooja_steps` (217 rows, read with the anon key)
- `supabase/migrations/0001_core_tables.sql` (`media_assets`, `media_kind` enum incl. `'mudra'`, `archana_items`)
- `src/types/pooja.ts`, `package.json` (framer-motion ^13.2.0, next 16.3.5)
- Book crops in `G:\My Drive\Pooja Vidhi\extracted\illustrations` (contact sheet viewed: `p01–p20`; individually viewed: `p01-2`, `p02-1`, `p03-pranayama`, `p11-4`, `p20-1`, `p21-palms`, `p22-kavachaya`, `p25-sumukho`, `varalakshmi-113-kalasha`) and `illustrations-proposed\3-siddhivinayaka\…p10-3` (a text false positive)

## 14. Unverified claims (to test in the pilot)

- Nano Banana hand accuracy on these specific poses; the ≤ 10 generations/pose target.
- Visible watermark on the consumer Gemini app output.
- Payload sizes for animated WebP and Veo clips (rule-of-thumb figures).
- Padmanabha chest vs navel, and the naivedya pranadi finger forms, as sampradaya variants.
- Web Speech `onboundary` reliability for Sanskrit/Tamil voices.
- Copyright position on redrawing the book's illustrations.
- The supported Postgres version for `nulls not distinct`.
- The 29 Oct 2026 shutdown of `gemini-3.1-flash-image` (secondary source only).
