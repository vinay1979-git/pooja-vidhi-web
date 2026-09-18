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

---

## The purvangam, and the last of the placeholders

Migration 0020. After it, **one** step in the whole database still carries
`Tamil draft, pending vaidika review`, and it is the Sankalpam, deliberately.

The eighteen that were left were not equally wrong, and lumping them together
would have hidden that:

**Already correct, just uncited.** Achamanam, Anga Vandanam, Pranayamam. The
mantras are right. Only their `source_ref` changes.

**Materially incomplete.** Kalasha Pooja had `gaṅge ca yamune` alone where the
paddhati has six sections — no `kalaśasya mukhe viṣṇuḥ`, no `āpo vā idaṃ
sarvaṃ`, no pancha ganga, and **no samprokshana**, which is the point of the
step: the water is charged so it can be sprinkled on the materials, the deity
and the performer. Ganesha's Padyam & Arghyam, Snanam & Vastram and
Gandham/Kumkumam/Pushpam were bare `samarpayāmi` tags with no verse at all —
three or four upacharas compressed to a line each.

**Wrong.**

| | was | is |
|---|---|---|
| Ghanta Pooja | `देवताव्हान` | `देवताह्वान` |
| Ghanta Pooja | `घन्टा` | `घण्टा` |
| Avahanam & Asanam | `अस्मिन् हरिद्रा बिम्बे` | invoked into the idol |

`āhvāna` is invocation; **`vhāna` is not a word**. Both spellings were in
production in both poojas from the first migration. And `asmin haridrā bimbe`
invoked Ganesha into a turmeric cone — that is the Haridra Ganapati rite, and
on Chaturthi he is invoked into the idol that was just installed.

### The recension call

StotraNidhi's Smartha purvangam gives the achamanam as `keśavāya svāhā,
nārāyaṇāya svāhā, mādhavāya svāhā` and twenty-one further names. Ours is
`acyutāya namaḥ, anantāya namaḥ, govindāya namaḥ`.

**Ours is not replaced.** That page is Telugu Smartha; this app is for Tamil
Smartha households, where the achamanam is the acyuta-ananta-govinda form and
the keshava names come afterwards touching the limbs — which is exactly what the
Anga Vandanam does. Taking the better-cited text would have swapped a correct
Tamil achamanam for a correct Telugu one. `source_ref` records the difference
instead of hiding it, and the harness asserts the Tamil form survives.

### The Sankalpam is not touched

It carries the `[DYNAMIC_PANCHANGAM_DATA]` slot the panchangam engine renders
into, and the published version is a form with blanks. Swapping text under a
live template is how a sankalpam breaks silently. The harness asserts the slot
is still there.

### Three traps in reading these pages

Recorded because each produced wrong output that looked plausible:

- **A section that is last on its page has no heading after it.** `ghaṇṭānādam`
  and the kalpam's `samarpaṇaṃ` ran on into the site footer, and the round-trip
  check dutifully reported that converting *"Support this Dharma Karya"* to
  Devanagari and back had lost text. True, and useless. Sections that can run off
  the end now name the line they stop on.
- **The Vedic guttural nasal** is written `g` with a macron below
  (`chandā̱g̱syāpo`) and `g` plus anusvara (`ogṃ`, `idagṃ`). Left as a bare `g`
  after the accent strip, Sanscript renders `इदग्ं` and `छन्दाग्स्यापो`, which are
  not words. Folded to the anusvara before stripping.
- **`āyāntu śrī ____ pūjārthaṃ`** is a form blank. It is filled per pooja. A
  generator check now refuses any mantra containing a run of underscores, and
  the harness checks it with `position()` rather than `LIKE '%__%'` — in SQL `_`
  is a single-character wildcard, so that pattern asks whether the string is at
  least two characters long and matches everything.

### Consolidation

`scripts/_sources.mjs` now holds the page readers, the round-trip proofs and the
fault-class checks. They were written inline in `build-upachara-mantras.mjs`,
and the moment a second generator needed them there were two copies — which is
the situation `_tamil.mjs` exists to prevent. `0019` was re-emitted after the
refactor and is byte-identical.

---

## Prana Pratishtha, and how to tell a truncated mantra from a short one

Reported as *"all main mantras are so truncated that research needs to be done
again. Prana prathishta one example — just says I will perform pran prathishta."*

Correct. Prana Pratishtha held one verse and a samarpayami tag, under
`source_ref` that named a video chapter and a tradition but **no text**. It is in
none of the cached pages: it was typed from memory in migration 0010. Udvasanam
was a worse truncation — it held the **first half** of `yajñena yajñamayajanta`
and stopped mid-verse, with none of the closing `śobhanārthe kṣemāya
punarāgamanāya ca | oṃ śāntiḥ śāntiḥ śāntiḥ`, which is the last thing said in
the whole pooja.

Migration 0021 replaces both from published text, in **both genders**:

| | source | tail |
|---|---|---|
| masculine (Ganesha) | Sri Haridra Ganapati Puja (Telugu, svara) | `sthiro bhava varado bhava` |
| feminine (Varalakshmi) | Sri Lalitha Shodasopachara Puja Vidhanam (IAST) | `āvāhitā bhava sthāpitā bhava, varadā bhava` |

Both share the Vedic core — `asunīte punarasmāsu cakṣuḥ` (Rigveda 10.59.6) and
`amṛtaṃ vai prāṇāḥ` — and differ exactly where Sanskrit gender makes them differ.
The old text handled gender by swapping `asya` for `asyai`, which was the right
instinct; this keeps the care and sources it. The Varalakshmi Vrata Kalpam has no
prana pratishtha of its own, which is why the Lalitha vidhanam is used.

### Two more ways the Telugu page lies to a converter

Both found by generator checks, not by reading:

- **A latin `o` for the anusvara.** The page sets `amṛtaṃ vai prāṇāḥ` as
  `అమృతo వై ప్రాణా` and `gaṇānāṃ tvā` as `గణానాo త్వా`. Left alone the `o` survives
  conversion and sits as a latin letter inside a Devanagari mantra.
- **An ASCII colon for the visarga**: `చక్షు:` for `చక్షుః`. The Ganesha output
  read `चक्षु:` with a colon where the visarga belongs while the Varalakshmi one,
  coming through the roman path which already folded colons, read `चक्षुः`. Two
  spellings of the same word, one screen apart.

### A mistake repeated

The new `source_ref` quoted the old one verbatim — and so matched the gate that
hunts for survivors of the old one, failing the migration. **This is the same
mistake 0019 made and documented.** Writing it down was not enough; the gate
catching it twice is what actually worked.

### The inventory, and what "truncated" means

Counting nulls does not answer "is this truncated" — a step can have a mantra in
all three scripts and still be a tag line. The harness now prints section `[11]`,
a per-step inventory of **length, line count and origin**, so the thin ones are
visible in CI rather than discovered in a pooja.

After 0020 and 0021 it flags **8** steps as a line or two, and the flag conflates
two different things:

**Not truncated, just not line-broken.** Anga Vandanam (204 chars on one line),
both Sankalpams, Manjal Pillaiyar. These carry their full text; they are stored
as a single run, and now that the viewer honours line breaks they would read
better split.

**Short because the rite is short.** Achamanam is three names and three sips.
Sharadu Dharanam, Varalakshmi's Karpura Neerajanam, Pushpanjali and Namaskaram
are each the one verse their kalpam gives.

**Actually outstanding: the Ganesha Sankalpam.** It is the last step carrying
`Tamil draft, pending vaidika review`, it is 275 characters against
Varalakshmi's 509, and it holds the `[DYNAMIC_PANCHANGAM_DATA]` slot, so it
needs care rather than a regenerate.

---

## The Sankalpam, and a second implementation nobody was using

Migration 0022. After it **no step in either pooja is an unreviewed draft**.

### The Ganesha Sankalpam

It was the last one, at 275 characters against Varalakshmi's 509, and it had
**literal ellipses in it** — `भरत खण्डे ... [DYNAMIC_PANCHANGAM_DATA] ... मम उपात्त`
— which is the exact truncation marker `proofread.mjs` exists to catch, sitting
in the one step that could not be regenerated without care.

Against the kalpam's own sankalpam it was missing the rest of the geography
(`meroḥ dakṣiṇe pārśve asmin vartamāne vyāvahārike`) and **every** purpose
clause: `asmākaṃ sahakuṭumbānāṃ kṣema sthairya dhairya`, the `caturvidha
puruṣārtha`, `putrapautrābhivṛddhi`, `iṣṭakāmyārtha siddhi`, `samasta
duritopaśānti`, `samasta maṅgaḷāvāpti`, and the deity's own `uddiśya` /
`prītyarthaṃ` pair.

**Two things from the kalpam are deliberately not used.** It fixes the date as
`bhādrapada śukla caturthī puṇyakāle` — the **lunar** month, where Tamil Smartha
recites the **solar** one, which the panchangam engine computes into the slot.
Taking it would have hardcoded one day *and* used the wrong reckoning. And its
`mama upātta ………. sametasya` carries a form blank for family names; the standard
opener is used instead.

### The duplicate this exposed

Varalakshmi's opens with `pūrvokta evaṃ guṇa viśeṣaṇa viśiṣṭāyāṃ śubhatithau` —
"at the tithi qualified by the **aforesaid** attributes". In the kalpam that is a
back-reference: the section is headed *punaḥ* saṅkalpam. Here there is nothing to
refer back to, and the slot supplies those attributes in full, so the sentence
said the same phrase twice — once computed, once as a reference to itself.
Dropped.

### PoojaViewer was rendering its own, worse sankalpam

The real find. `getDynamicMantra` assembled the panchangam **field by field**,
and assembled a shorter sentence than `src/lib/sankalpam.ts` renders three
inches up the same screen. It left out:

- the **yoga**
- the **karana**
- the **second tithi** when the tithi turns during the day

which are precisely the three things the engine was written to add. It also
spelt `गोत्रोत्भवस्य` for `गोत्रोद्भवस्य` (*udbhava*), and used the masculine
ending for everyone.

So the Sankalpam step showed the sentence **twice** — complete in its own card,
degraded inside the mantra box — and **the degraded one is what a person
reciting from the mantra would have said**. It now inserts the engine's `core`,
and the person clause comes from a new `renderPerson()` in `sankalpam.ts` which
is gender-correct and spelt right. Verified live: `prīti nāma yoga`, `vaṇija
karaṇa yuktāyām` and `saptamyām upari aṣṭamyām` all appear now, and
`gotrodbhava` replaces the typo.

### Line breaks

Done as a string replace on whatever is in the column, not by restating the
text, and only where the mantra is currently one line — so it breaks the data
rather than what the script believes the data is. Idempotent: after one run
there is no `danda space` left to split on. The Anga Vandanam is twelve lines
now, one name per limb; the Achamanam is three, one per sip.

### Where the inventory stands

Section `[11]` of the harness flagged **8** thin steps before this and flags
**1** after: Sharadu Dharanam, which is the single verse its kalpam gives.

Two splitting traps worth keeping:

- Commas are not clause boundaries in a sankalpam. The Varalakshmi purposes are
  set without a single comma, so a comma split left them as one 300-character
  line. The clauses end in `-arthaṃ`.
- Matching `अर्थं` finds nothing. The clauses read `-yarthaṃ`, `-ptyarthaṃ`,
  where the *a* of *artha* is the inherent vowel of the preceding consonant and
  no standalone `अ` exists in the string. The match is on `र्थं`.

## How the mantras reach the database, and what the transport does to them

Running the live gate after 0022 -- `node scripts/proofread.mjs` -- returned
**not ready**: 681 carriage returns across 17 steps and the three script
columns, plus 5 in `archana_items` and 6 in `deities`.

### The diagnosis in 0016 was wrong

0016 stripped the same junk in March and concluded: *"Git's core.autocrlf
rewrote the migration files to CRLF on checkout ... .gitattributes now pins
*.sql to LF so this cannot recur."* The pinning worked. `git ls-files --eol`
reports `w/lf` for every migration, and there is not one carriage return in
0017 through 0022 on disk. The carriage returns arrived anyway.

They are not in the file. They are in the **transport**. The SQL is applied by
pasting it into a browser SQL editor, and a `<textarea>` normalises every
newline it holds to CRLF before submitting. Each line of each multi-line string
literal in the pasted text picks one up.

The data proves it, and proves it inside a single migration. 0022 gave two
steps their line breaks by two different routes:

| Step | How it got its line breaks | Result |
| --- | --- | --- |
| Achamanam | `replace(mantra_sanskrit, '। ', '।' \|\| chr(10))` -- the **server** computed them | clean |
| Karpura Neerajanam | literal newlines inside a quoted literal in the pasted file | CRLF throughout |

Same migration, same run, same session. Only the transport differs.

### Why it had been invisible

Every earlier gate looked at the wrong artefact. The PGlite harness reads the
`.sql` files off disk, and those are LF, so a carriage return can never appear
there spontaneously -- which is why the harness passed clean through 0022 while
production held 681 of them. `proofread.mjs` reads the live database and caught
it on the first run. That difference is the whole argument for keeping a gate
that talks to production rather than to a fixture.

On screen they render as nothing: a browser treats CRLF as one segment break, so
`whitespace-pre-line` shows exactly the intended lines. Nobody reciting from the
app would have seen anything. They still break every exact-text comparison, and
they are not what the published page says.

### The fix, and why it is not a setting

No setting in this repo can prevent it, because the corruption happens after the
file leaves the repo. So the migration repairs itself instead: `CR_GUARD` in
`scripts/_migration.mjs` is spliced in before the closing `commit;` of every
generated migration, and strips CR from every text column in the schema. It is
idempotent, costs nothing when the SQL was applied some other way -- `psql -f`
never introduces the problem -- and does not care which way it was.

0023 is the same sweep applied once to the whole schema, to clear what 0017
through 0022 left. It sweeps `information_schema` rather than a list of columns:
the list is precisely what failed last time, since 0016 enumerated
`pooja_steps`, `archana_items` and `namavali_items`, missed `deities`, and left
four carriage returns sitting in `dhyana_sloka_deva` through every release
since.

Harness section `[9ab]` injects the corruption the paste would have caused --
the harness cannot observe it otherwise -- and then proves 0023 removes it
without eating the line breaks it sat beside.

## The review sheet

`npm run review` reads the live database and writes `review/pooja-review-sheet.html`
-- every step of both poojas, print-ready on A4.

It exists because of what is now true of this project and what is not. Every
mantra traces to a published text, the inventory flags one thin step, and
`proofread.mjs` passes. **None of it has been read by a vaidika.** That is the
only thing between here and the beta, and no amount of further sourcing work
substitutes for it.

Four decisions in the sheet, each one a thing that would otherwise lose a
correction:

- **Numbered lines.** A correction needs an address. "The third line of step 20"
  can be applied exactly; "the camphor one, near the end" cannot, and that is the
  form corrections take when the reviewer has no line numbers to point at.
- **Three scripts across, on the same line.** The Tamil and the transliteration
  are generated from the Devanagari, so the question worth putting in front of a
  reviewer is not "is this good Tamil" but "do these three still say the same
  thing". Where the three fields do not even have the same number of lines, the
  sheet says so in red: that is a defect, not a preference.
- **The open questions printed at the step, not gathered at the end.** Asked at
  the end whether the neerajanam should carry *na tatra sūryo bhāti*, a reviewer
  has to page back to see what it currently carries. Asked beside the mantra,
  they answer in ten seconds.
- **Ruled space under every step.** A reviewer with nowhere to write writes
  nothing.

The questions are duplicated: they live in `QUESTIONS` in the script and under
the "Open for practitioners" headings in this file. That is a known drift risk
and is accepted for now, because the alternative -- a column in the database --
puts a question about the content inside the content. When one is answered,
change both.

The sheet is generated, not committed; `/review/` is gitignored. It is a
snapshot of live data and goes stale the moment a migration runs, which is why
it prints its own date and refuses to be quiet about it: if the database still
carries the carriage returns 0023 removes, the sheet says so at the top, because
nothing else on the page would reveal them.
