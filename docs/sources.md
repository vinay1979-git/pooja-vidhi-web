# Ritual sources

## Primary: Sathya Vadyar (Sri Sathyanarayana Vadyar, Mumbai)

YouTube channel **Sathya Vadyar**. Tamil Smartha (Iyer) practice, step by step,
with the mantras recited in full. Treated as the primary reference for sequence
and for what is actually done in a household, over the printed paddhatis, which
disagree with each other on ordering.

What can and cannot be taken from it: the **chapter lists and samagri lists are
extracted below and are reliable**. The mantra text itself is spoken in the
video and has not been transcribed. YouTube's caption endpoint is gated and
returns nothing, and the auto-captions are speech recognition on Tamil anyway.
So the sequence below is sourced; the wording of any step not already in the
database still needs a printed text or a transcription pass.

---

## Ganesha Chaturthi

`GANESHA CHATHURTHI POOJA 2026 | STEP BY STEP`
https://www.youtube.com/watch?v=VwLiVPEFSkc

### Sequence, from the video chapters

| Time | Chapter |
|---|---|
| 13:01 | Achamanam |
| 22:48 | Sankalpam |
| 29:47 | Kalasha Pooja |
| 32:19 | Ganapathi Avahanam |
| 34:36 | Praana Prathishta |
| 45:36 | **21 type Pathra Archana** |
| 48:44 | **21 type Pushpa Archana** |
| 52:03 | **21 times Doorva Archana** |
| 54:58 | **Ganapathi Ashtothram** |
| 1:03:08 | Dhoopam, Deepam, Nivedanam |
| 1:07:52 | Deeparadhana |
| 1:10:19 | Manthra Pushpam |
| 1:14:34 | **Argya Pradhanam** |
| 1:20:30 | **Punar Pooja** |

Four things this settles.

1. **The 21 patra, 21 pushpa, 21 durva and the 108 names are all real and all
   present.** They were the four largest gaps in the database.
2. **The Pushpa Archana is genuine.** It was absent from the original
   specification and I had flagged it as an addition; the video has it.
3. **Durva comes before the Ashtottaram**, not after Neerajanam. That settles
   the ordering variance flagged earlier between the two printed recensions.
4. **Argya Pradhanam sits after Mantra Pushpam**, near the very end, which
   matches the ksheerarghya placement found in the Tamil paddhati.

### Samagri, from the video description

Manjal powder, chandanam, kumkumam, akshadai, panchamirtham, **pacha paal
(milk)**, mixed flowers 1.5kg, arugam pul, maalai 1, thoduttha pushpam 5 feet,
agarbatti, thiri nool, kalpooram, ghee 100g, til oil, **single poonal for
Ganapati**, vetrilai 15, paakku 10, banana 1 dozen, mixed fruits, coconut 2,
vasthram for Ganapati.

Vessels: pancha pathram, thambalam 2-3, kinnam 5-6, mani (pooja bell), vilakku.

### Leaves actually used for the archana

Maavilai, **thulasi**, bilvam, mari kozundu, nellikkai elai, arali poo elai,
arugam pul, erukka elai, vanni elai.

Nine, not twenty-one, and **tulasi is included**. That answers the open question
about whether to keep tulasi at leaf eight: this vadyar uses it. The twenty-one
is the recited name count; the leaves actually gathered are fewer, with
substitution, which is what the diaspora substitution rule anticipated.

### Naivedyam

Modakam (kozhukattai), appam, idli, vadai, annam, payasam, any sundal.

---

## Varalakshmi Vratham

`VARALAKSHMI POOJAI 2026 STEP BY STEP INSTRUCTIONS`
https://youtu.be/rXwBruwAAr0

### Sequence, from the video chapters

| Time | Chapter |
|---|---|
| 04:02 | Ganesh Pooja |
| 14:00 | Varalakshmi Pooja Sankalpam |
| 17:15 | Thithi, Varam, Nakshathram details |
| 22:13 | Kalasha Pooja |
| 24:54 | Peeta Pooja |
| 25:57 | Pradhana Pooja |
| 29:26 | Prana Prathishta |
| 32:25 | Upachara Pooja |
| 38:32 | Anga Pooja |
| 40:49 | Lakshmi Ashtothram |
| 47:34 | Dhoopam, Deepam, Nivedanam |
| 51:18 | Karpoora Deeparadhana |
| 53:31 | Pushpanjali, Mathra Pushpam |
| 54:49 | Pradakshina Namaskaram |
| 55:44 | Varalakshmi Prarthana |
| 57:08 | **Nonbu Sharadu Pooja** |
| 59:38 | **Sharadu Dharana Shlokam** |
| 1:02:16 | Dakshina Dhana Shlokam |
| 1:05:34 | **Ksheera Argyam** |
| 1:08:43 | **Next day Poonar Pooja** |

This is the composition model in the wild. Ganesh Pooja, Sankalpam, Kalasha,
Prana Prathishta, Upachara, Anga Pooja, Ashtottaram, Dhoopam/Deepam/Nivedanam,
Deeparadhana, Mantra Pushpam, Pradakshina, Prarthana, Ksheera Argyam and Punar
Pooja are all shared with Ganesha Chaturthi. What is unique to Varalakshmi is
**Peeta Pooja**, the **Nonbu Sharadu** thread rite and its **Dharana shloka**.

### Samagri specific to it

Kalasham with a Lakshmi face, or a Lakshmi photo. Thazam poo, **thamarai poo
(must)**, bilvam, doorvai, thulasi. Eka aarathi and pancha aarathi (optional).
**Raw milk for argyam, half a glass.**

---

## Ksheera Argyam, confirmed

Both videos list **raw milk for the argyam** in their samagri, and both give it
its own chapter near the end. That is the same rite the Tamil paddhati calls
**க்ஷீரார்க்ய ப்ரதானம்**, offered to the deity rather than to the moon, after
Mantra Pushpam and before the closing.

The "facing north" detail remains unattested in any written source. See the
research note in the blueprint.

---

## What was built from these, and from what

Migrations 0010 (Ganesha) and 0011 (Varalakshmi) were generated, not hand-written.
The generators are `scripts/build-ganesha-content.mjs` and
`scripts/build-varalakshmi.mjs`, and both refuse to emit if their inputs fail
validation.

### Chapter lists

Both chapter lists above were re-read from YouTube rather than trusted from the
earlier pass. The Varalakshmi list gained four chapters that pass had missed
(INTRO, POOJA TIMINGS, ABOUT THIS YEAR, and **WHAT SHOULD WE KEEP READY** at
2:17, which is the samagri). The Ganesha list was unchanged.

**There is no Vrata Katha chapter in the Varalakshmi video.** The published
kalpam carries the Charumati story at length; the vadyar does not read it. The
katha is therefore not in the database. This was checked against the video's own
chapter list, not inferred.

### Namavalis

`scripts/parse-namavali.mjs` builds both 108-name lists from StotraNidhi, which
publishes each in Devanagari, Tamil and IAST as separately proofed pages. All
three are taken as published; machine transliteration is used only to CHECK that
the three pages are the same list in the same order, and the script exits
non-zero rather than write a list that fails. Nothing recited is generated.

Two recension traps, both recorded in the script so nobody falls into them again:

- sanskritdocuments' `lakShmyaShTottarashatanAmAvaliH` is the **sahasranama-anga**
  recension, opening *brahmajAyai, brahmasukhadAyai*. That is **not** the list
  recited at Varalakshmi Vratham, which opens *prakRityai, vikRityai, vidyAyai*.
- drikpanchang's 21-patra page is the **North Indian** recension (Ber, Sem,
  Bhatakataiya, Kela, Marua, Ketaki). Sathya Vadyar's nine leaves map onto the
  **South** list instead (chuta = maavilai, karavira = arali, shami = vanni,
  arka = erukku, maruvaka = mari kozhundu). Useful site; wrong page for this pooja.

### The 21 patra name pairing is deliberately absent

The leaf list is well sourced and consistent across the South-recension sources.
The **pairing of a Ganesha name to each leaf is not**: drikpanchang and
templepurohit give one pairing, hindutone gives a degenerate one that just
re-uses the leaf name as the deity name, and none agrees with another. Rather
than pick one, the Patra Pooja offers each leaf with the deity's own mantra, and
the step text says why. This is an open item for vaidika review.

### The Varalakshmi kalpam, and why a script conversion was allowed there

StotraNidhi publishes the full Vrata Kalpam **in Telugu only**. There is no
Devanagari or Tamil page to take instead, so
`scripts/parse-varalakshmi-kalpam.mjs` converts it — and proves every line
survives Telugu → Devanagari → Telugu before writing anything. That is safe
because Telugu is a complete abugida for Sanskrit. It is exactly what the
namavali script refuses to do for **Tamil**, where the plain scheme this project
uses folds ka/kha/ga/gha onto one letter and the conversion is not reversible.

So for Varalakshmi: Devanagari and IAST are faithful re-encodings of published
text; Tamil is generated, as everywhere else in this app, and always carries the
transliteration beneath it.

Two edits were made to the published kalpam text, both recorded in the script:
the pranava written `ओं` is normalised to `ॐ`, and the first of the nine knots
reads `गंथिं` where the other eight read `ग्रंथिं`.

The kalpam also confirms the composition model outright. It opens by telling the
reader to perform the shared **Pūrvāṅgam** and the **turmeric Ganapati pooja**
first, and links to them rather than reprinting them — which is why migration
0011 copies six purvangam steps out of the Ganesha pooja by reading its rows
instead of retyping them.

### Still not sourced

- The full Haridra Ganapati vidhi includes **Vedic mantras with svara marks**
  (asunīte, gaṇānāṃ tvā, āpo hi ṣṭhā, yajñopavītam). The app does not render
  accents, so those are omitted rather than shown unaccented. Rendering svara is
  an open feature question.
- ~~`meaning_en` is still null on every step in both poojas~~ — filled for all 53
  by migration 0013; see the Meanings section below.
- Tamil instruction drafts remain pending vaidika review.
- "Facing north" for the arghyam remains unattested in any written source and is
  still not encoded.

---

## The Siddhi Vinayaka Vrata Kalpam, and what it corrected

`Sri Vinayaka Vrata Kalpam (Part 2)` (Telugu)
https://stotranidhi.com/sri-vinayaka-vrata-kalpam-two/

Found by following the cross-reference on StotraNidhi's turmeric-Ganapati page.
This is the vrata kalpam **for Ganesha Chaturthi**, and it carries all four
enumerated archanas in one internally consistent paddhati, where migration 0010
had stitched them together from four separate places. Migration 0012 replaces
them wholesale. Extracted by `scripts/parse-vinayaka-kalpam.mjs` under the same
round-trip rule as the Varalakshmi kalpam.

| | before (0010) | after (0012) |
|---|---|---|
| Anga Pooja | a mantra **truncated mid-list with a literal `...`** after three limbs | 29 limbs as archana rows |
| Patra Pooja | 21 leaves, **no name pairing** — each offered with the deity's own mantra | 21 leaves, each with its own Ganesha name |
| Pushpa Pooja | the 16-name Shodashanama verse | the kalpam's **21 flowers**, which is what the video's "21 type Pushpa Archana" chapter is |
| Durva Pooja | sanskritdocuments' 21 names | the kalpam's 21 names; the other reading is recorded in `source_ref` |

### Why this pairing is trustworthy where the aggregators' were not

Most of the patra names alliterate with their leaf — `dhūmaketave/dhattūra`,
`apavargadāya/apāmārga`, `cirantanāya/cūta`, `kapilāya/karavīra`,
`amalāya/āmalakī`, `sindhūrāya/sindhuvāra`, `śaṅkarapriyāya/śamī`,
`arkaprabhāya/arka`. **Fourteen of the twenty-one**, which is far past
coincidence, though seven pairs — including the first three — do not. The Anga
Pooja alliterates the same way and more completely. That is a mnemonic
structure, and structure survives transmission in a way an editor's guess does
not. The parser asserts it loosely, as an alignment check, not as a rule.

### The detail that proves the old leaf list was wrong

Sathya Vadyar's samagri lists nine leaves. Against the list 0010 used, eight
mapped and **nellikkai elai matched nothing**. This kalpam has `āmalakī`, the
gooseberry, at position 13 where the old list had `devadāru`. All nine now map.
The unmatched leaf should have been read as a signal at the time rather than
noted and passed over.

---

## Meanings

`meaning_en` on all 53 steps, from `scripts/build-meanings.mjs` (migration 0013).

These render the mantra each step actually stores — not a second description of
the step, since `instruction_en` says what to do and `philosophy_en` says why.
The eight steps whose content is a namavali or archana list carry no mantra, so
their meaning says what the list is saying.

**This is the project's own English, not published text**, and carries no
`source_ref` for that reason. A vaidika review should treat the meanings as
editable prose, unlike the mantras, which are published text and must not be
rewritten.

The Meaning block also moved out of the mantra card in `PoojaViewer`, because
inside it those eight list-only steps could never have shown one.

---

## The Ksheera Arghyam, and the correction it forced

Reported by a practitioner as "incomplete, there are 3 steps in offering
arghyam". Chasing it turned up two separate faults, fixed in migration 0018 by
`scripts/build-arghyam-and-thread.mjs`.

### The arghyam is a sequence, and was stored as a paragraph

The published kalpams do not print an arghyam as one recitation. They print a
verse, then a refrain naming how many times to pour, then the next verse:

> అర్ఘ్యం గృహాణ హేరంబ వరప్రద వినాయక …
> ఓం శ్రీ సిద్ధివినాయక స్వామినే నమః **యిదమర్ఘ్యం యిదమర్ఘ్యం యిదమర్ఘ్యమ్**

Both poojas held the whole thing in `mantra_sanskrit` as one run of text, and
**every refrain was missing**, so nothing on screen said how many pourings to
make. The verses are `archana_items` now, which the viewer already renders as a
numbered, tickable list, and each carries its refrain on a second line.

The same publisher's Sankashtahara kalpam prints the identical shape with
`(iti saptavāraṃ)` after each of its three arghyams, which is what confirmed
the pattern rather than a quirk of one page.

### Ganesha's verses traced to no text

Migration 0009 wrote three verses under the `source_ref` *"Sathya Vadyar,
Ganesha Chaturthi 2026; Tamil Smartha ksheerarghya pradanam"* — a video and a
tradition, not a text. The rule at the top of this file is that a video
establishes **sequence** and a published text establishes **wording**, and that
rule was not followed here.

The Siddhi Vinayaka Vrata Kalpam's `పునరర్ఘ్యం` section gives **four** verses:

| | 0009 | the kalpam |
|---|---|---|
| 1 | `arghyaṃ gṛhāṇa heramba` **`sarva siddhi pradāyaka`** | **`varaprada vināyaka`** |
| 2 | — | `namastubhyaṃ gaṇeśāya namaste vighnanāyaka` |
| 3 | — | `namaste bhinnadantāya namaste harasūnave` |
| 4 | `gauryaṅgamala sambhūta` **`jyeṣṭhasvāmin gaṇeśvara`** | **`svāmi jyeṣṭha vināyaka`** |

and 0009's third verse, `vināyaka namaste'stu gandha puṣpākṣatairyutam`, appears
in no published text found. So the step was **short a verse and carrying wording
that traced to nothing at the same time**. All four now come out of the cached
page and are round-trip verified Telugu → Devanagari → Telugu.

One further edit to the source text, recorded in the script: Telugu writes an
epenthetic *y* before a word-initial *i*, so `యిదమర్ఘ్యం` is `ఇదమర్ఘ్యం`. It is
an orthographic convention, not a different word, and Devanagari has no such
form. Without normalising it the round-trip check would have failed on every
refrain — which would have looked like a broken converter rather than a spelling
convention.

Varalakshmi's verse was **not** changed. It is from the kalpam and round-trips;
it only gained the refrain and the structure. The kalpam prints its arghyam once
as an upachara, with `arghyaṃ samarpayāmi`; the threefold `idam arghyam` form
used at the close follows the same publisher's shape for a repeated arghyam, and
the `source_ref` says so.

---

## Who ties the nonbu saradu

`Sharadu Dharanam` said only that "an elder in the house ties it for the younger
women". The practice the vratham is actually known for — **the husband ties the
saradu on his wife's right wrist, making three knots** — was absent.

It is not in the kalpam. The kalpam gives `badhnāmi dakṣiṇe haste`, *"I tie it
on the right hand"*, first person, and says nothing about who ties it or how
many knots. The `philosophy_en` this project had written for the step leaned on
exactly that — *"nobody ties it for you in the text, whatever happens in the
room"* — which is how a normal household practice came to be **excluded rather
than merely unmentioned**. A vidhi text giving a mantra in the first person is
written for whoever is reciting it; it is not a ruling that the tying is done
alone.

Both are recorded now, each labelled. The `source_ref` states plainly that the
three knots are household practice reported by this project's owner and **not**
stated in the kalpam, and flags it for practitioner review.

One thing worth watching in review: the thread carries **nine** granthis, which
the preceding step worships with nine names of Lakshmi, and the tying makes
**three**. Two counts, two screens apart, for different things — the instruction
now says which is which, because otherwise it reads as a contradiction.

### Open for practitioners

- Whether the four-verse punararghyam matches what they were taught, or whether
  their paddhati gives three.
- Whether the husband ties it in their household, and whether three knots is
  what they were taught.

---

## The offering steps were never written

Reported as "naivedyam, karpura neeranjanam etc — single mantra is written that
is wrong". It was, and it was not two steps.

Sixteen of Ganesha's twenty-four steps still carried `source_ref = 'Tamil draft,
pending vaidika review'` — the original app's placeholder content. Every
migration since has gone after the enumerated archanas (0012), the meanings
(0013), the philosophy (0014) and the arghyam (0018), and none of them touched
the plain upacharas. Six of Varalakshmi's twenty-nine carry it too, and they are
the six purvangam steps 0011 copied out of Ganesha, so the same placeholders are
in both poojas.

| step | what was stored |
|---|---|
| Karpura Neerajanam | `karpūra nīrājanaṃ santataṃ darśayāmi` — 38 characters |
| Mantra Pushpam & Namaskaram | one pradakshina verse standing in for the mantrapushpam, the pradakshina, the sashtanga namaskaram **and** the prarthana |
| Dhoopam & Deepam | three samarpayami tags, no verse at all |
| Naivedyam | the five pranas, and nothing else |

### A naivedyam is a sequence, not a verse

This is the one worth spelling out. The Smartha naivedyam is:

1. the vyahritis and the Gayatri
2. `deva savitaḥ prasuva`
3. `satyaṃ tvā ṛtena pariṣiñcāmi` — water sprinkled in a circle around the food
4. `amṛtamastu । amṛtopastaraṇamasi` — water as the **bed beneath** the nectar
5. the five breaths fed one at a time
6. **then** the naming of what is offered
7. `amṛtāpidhānamasi` — water as the **cover over** it
8. `uttarāpośanaṃ`, the hands and the mouth rinsed

Ganesha had step 5. Varalakshmi had 5 and 6, from its kalpam, and none of the
frame. Migration 0019 gives both the whole thing.

The order matters and is not the published page's. StotraNidhi prints the verse
and its samarpayami first and the frame after; the frame-first order is what the
owner reported and it is the only order in which water-below / feed / water-above
is a sequence rather than a list. `source_ref` says which is which, and the
harness asserts the naming falls between the fifth breath and the covering.

### Where the text comes from, and the seam in it

Two sources, joined where the seam is real:

- **the deity's verses** — Sri Siddhi Vinayaka Vrata Kalpam (Telugu), the same
  cached page 0012 and 0018 used
- **the naivedyam frame** — Sri Maha Ganapathi Shodashopachara Puja (IAST)

The frame is the same in the Ganapati vidhanam, in the Purusha Sukta vidhanam
and in every Smartha paddhati, because it belongs to the act of feeding rather
than to the deity. So it is used in **both** poojas — the composition model this
project already applies to the purvangam, applied to an upachara.

`deva savitaḥ prasuva` is in **neither** published page. It is Apastamba prayoga
and it is what the owner recites, so it is included and flagged in `source_ref`,
the same treatment the three knots got.

### Two decisions that reverse earlier ones

**Svara is stripped.** This file previously said accented Vedic mantras would be
omitted rather than shown unaccented. That was written when the question was
whether to *add* them; it is not a reason to ship a naivedyam with no Gayatri in
it. The vyahritis, the Gayatri and the prana mantras are shown unaccented, the
instruction says they carry svara, and rendering svara stays open.

**Ganesha gains a tambulam.** It had none anywhere, though the kalpam puts one
between the naivedyam and the nirajanam. Folded into the naivedyam step, which
is renamed `Naivedyam & Tambulam` to match Varalakshmi's.

### Still placeholders after 0019

The purvangam — Achamanam, Anga Vandanam, Vighneshwara Dhyanam, Pranayamam,
Kalasha Pooja, Ghanta Pooja — and Ganesha's Avahanam & Asanam, Padyam & Arghyam,
Snanam & Vastram, Gandham/Kumkumam/Pushpam, Sankalpam and Kshama Prarthana.
`pv_en.html` (StotraNidhi, *Puja Vidhanam — Poorvangam, Smartha Paddhati*) is
the source for the first six and is already cached.

### Open for practitioners

- Whether `deva savitaḥ prasuva` belongs where it is put here, between the
  Gayatri and the sprinkling.
- Whether the karpura neerajanam should be more than the one verse every
  published source gives it. `na tatra sūryo bhāti` and `karpūragauraṃ` are sung
  at deeparadhana in many houses and are in **none** of the four cached
  vidhanams, so they are not encoded.
