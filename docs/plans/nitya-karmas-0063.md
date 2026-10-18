# Nitya karmas from the book (0063)

*Samidadhanam, Brahma Yajnam and Bhojana Vidhi, published from the Giri
Yajurveda Trikaala Sandhyaavandanam, book pp.49-61. Generator:
`scripts/build-nitya-karmas-from-the-book.mjs`. Migration:
`supabase/migrations/0063_nitya_karmas_from_the_book.sql`. Written 18 Oct 2026.*

## 1. What was built

| Rite | Rows | Modes (steps per mode) | Deity | Lists |
|---|---|---|---|---|
| `samidadhanam` | 35 | `pratah` 33 (from 0:00), `sayam` 33 (from 12:00) | `agni` | Raksha Mantra 7 |
| `brahma_yajnam` | 26 | `main` 26 | `brahma` (new deity row) | Deva 5, Rishi 14, Rishi (Vedas) 9, Pitru 5 |
| `bhojana_vidhi` | 9 | `day` 8 (from 0:00), `night` 8 (from 18:00) | `agni` | Pranahuti 6 |

Rules applied:

- **One action and its words per screen.** Each of the twelve homa mantras is
  its own step under the section label "Homa". Lists said with one repeated
  gesture (tarpanams, the seven ash marks, the six pranahutis) are
  `archana_items`, shown one line at a time, with "Twice" / "Three times" /
  the body part as the per-line offering.
- **Nothing is referred elsewhere.** The book opens Samidaadhaanam and Brahma
  Yajnam with "aachamanam & angavandanam (twice)", dhyanam, pranayama and
  sankalpa as page references (pp.16-19). All are inlined in full: four steps for
  the pair done twice, the dhyanam, the pranayama (breath split and right-ear
  touch), and the p.19 sankalpa stem joined to each rite's own ending. The
  closing "aachamanam, angavandanam once" is two real steps.
- **Hand positions** follow the 18 Oct 2026 book review (achamanam fold,
  pranayama fingers and breath split, sankalpa left palm up with right palm over,
  Padmanabha at the navel).
- No step has more than one offering verb (offer, pour, sprinkle, sip,
  swallow) in its instruction; there are **no exceptions**. Asserted in the
  migration test.

`proofread` changes: six new `EXPECT_ARCHANA` / `EXPECT_PROSE_COUNT` entries;
four words added to `SHOPPABLE` (sticks, husk, dung, charcoal); and `SHARED_OK`
now also covers *repeats* of a shared step ("Achamanam (closing)" in two rites
carries the same text for the same reason "Achamanam" does).

## 2. Step tables

### Samidadhanam

| # | Section | Title | Modes | Book page |
|---|---|---|---|---|
| 1 |  | Prepare the Fire — morning | pratah | p.49 |
| 2 |  | Prepare the Fire — evening | sayam | p.49 |
| 3 | Achamanam and Anga Vandanam | Achamanam | pratah, sayam | pp.16-17 (called for on p.49) |
| 4 | Achamanam and Anga Vandanam | Anga Vandanam | pratah, sayam | pp.16-17 |
| 5 | Achamanam and Anga Vandanam | Achamanam (second round) | pratah, sayam | pp.16-17 |
| 6 | Achamanam and Anga Vandanam | Anga Vandanam (second round) | pratah, sayam | pp.16-17 |
| 7 |  | Vighneshwara Dhyanam | pratah, sayam | p.18 |
| 8 |  | Pranayamam | pratah, sayam | pp.18-19 |
| 9 |  | Sankalpam — morning | pratah | pp.19 and 49 |
| 10 |  | Sankalpam — evening | sayam | pp.19 and 49 |
| 11 |  | Agni Prarthana | pratah, sayam | p.49 |
| 12 |  | Parishechanam — before the homa | pratah, sayam | p.50 |
| 13 | Homa | Homa — Agnaye Samidham | pratah, sayam | p.50 |
| 14 | Homa | Homa — Edhosi | pratah, sayam | p.50 |
| 15 | Homa | Homa — Samidasi | pratah, sayam | p.50 |
| 16 | Homa | Homa — Tejosi | pratah, sayam | p.50 |
| 17 | Homa | Homa — Apo Adya | pratah, sayam | p.50 |
| 18 | Homa | Homa — Sam Ma Agne | pratah, sayam | p.51 |
| 19 | Homa | Homa — Vidyun Me | pratah, sayam | p.51 |
| 20 | Homa | Homa — Agnaye Brihate Nakaya | pratah, sayam | p.51 |
| 21 | Homa | Homa — Dyavaprithivibhyam | pratah, sayam | p.51 |
| 22 | Homa | Homa — Esha Te Agne Samit | pratah, sayam | p.51 |
| 23 | Homa | Homa — Yo Ma Agne | pratah, sayam | p.51 |
| 24 | Homa | Homa — Samidham Adhaya | pratah, sayam | p.51 |
| 25 |  | Parishechanam — after the homa | pratah, sayam | p.51 |
| 26 |  | The Last Samidh | pratah, sayam | p.52 |
| 27 | Agni Upasthanam | Resolve to Worship Agni | pratah, sayam | p.52 |
| 28 | Agni Upasthanam | Agni Upasthanam | pratah, sayam | p.52 |
| 29 | Agni Upasthanam | Prayer for Pardon | pratah, sayam | p.52 |
| 30 |  | Bhasma from the Fire | pratah, sayam | p.53 |
| 31 |  | Raksha Mantra (7 lines) | pratah, sayam | pp.53-54 |
| 32 |  | Prarthana | pratah, sayam | p.54 |
| 33 | Achamanam and Anga Vandanam | Achamanam (closing) | pratah, sayam | pp.16-17 (called for on p.54) |
| 34 | Achamanam and Anga Vandanam | Anga Vandanam (closing) | pratah, sayam | pp.16-17 |
| 35 |  | Brahmarpanam | pratah, sayam | p.54 |

### Brahma Yajnam

| # | Section | Title | Modes | Book page |
|---|---|---|---|---|
| 1 | Achamanam and Anga Vandanam | Achamanam | main | pp.16-17 (called for on p.55) |
| 2 | Achamanam and Anga Vandanam | Anga Vandanam | main | pp.16-17 |
| 3 | Achamanam and Anga Vandanam | Achamanam (second round) | main | pp.16-17 |
| 4 | Achamanam and Anga Vandanam | Anga Vandanam (second round) | main | pp.16-17 |
| 5 |  | Vighneshwara Dhyanam | main | p.18 |
| 6 |  | Pranayamam | main | pp.18-19 |
| 7 |  | Sankalpam | main | pp.19 and 55 |
| 8 | Veda Japa | Vidyudasi — cleansing the palms | main | p.55 |
| 9 | Veda Japa | Gayatri in Three Forms | main | pp.55-56 |
| 10 | Veda Japa | Rig Veda — Agnim Ile | main | pp.55-56 |
| 11 | Veda Japa | Yajur Veda — Ishe Tva | main | pp.55-56 |
| 12 | Veda Japa | Sama Veda — Agna Ayahi | main | pp.55-56 |
| 13 | Veda Japa | Atharva Veda — Shanno Devih | main | pp.55-56 |
| 14 | Veda Japa | Satyam Tapah | main | p.56 |
| 15 | Veda Japa | Namo Brahmane | main | p.56 |
| 16 | Veda Japa | Vrishtirasi — cleansing the palms | main | p.57 |
| 17 |  | Tarpana Sankalpam | main | p.57 |
| 18 | Tarpanam — Devas | Deva Tarpanam (5 lines) | main | p.57 |
| 19 | Tarpanam — Rishis | Rishi Tarpanam (14 lines) | main | pp.57-58 |
| 20 | Tarpanam — Rishis | Brahma Svayambhu Tarpanam | main | p.58 |
| 21 | Tarpanam — Rishis | Rishi Tarpanam — the Vedas (9 lines) | main | p.59 |
| 22 | Tarpanam — Pitrs | Pitru Tarpanam (5 lines) | main | p.59 |
| 23 | Tarpanam — Pitrs | Urjam Vahantih | main | p.60 |
| 24 | Achamanam and Anga Vandanam | Achamanam (closing) | main | pp.16-17 (called for on p.60) |
| 25 | Achamanam and Anga Vandanam | Anga Vandanam (closing) | main | pp.16-17 |
| 26 |  | Brahmarpanam | main | p.60 |

### Bhojana Vidhi

| # | Section | Title | Modes | Book page |
|---|---|---|---|---|
| 1 | Parishechanam | Parishechanam — Om Bhur Bhuvah Suvah | day, night | p.60 |
| 2 | Parishechanam | Prokshanam — Gayatri | day, night | p.60 |
| 3 | Parishechanam | Parishechanam — Deva Savitah | day, night | p.61 |
| 4 | Parishechanam | Parishechanam — day | day | p.61 |
| 5 | Parishechanam | Parishechanam — night | night | p.61 |
| 6 |  | Amritopastaranam | day, night | p.61 |
| 7 |  | Pranahuti (6 lines) | day, night | p.61 |
| 8 |  | Brahmani Ma Atma | day, night | p.61 |
| 9 |  | Amritapidhanam | day, night | p.61 |

## 3. Repairs and readings

Repairs (each settled by the roman on the same page; asserted in the migration):

- p.50 `समिध-माहार्षं` → `समिधमाहार्षं` (roman "samidham-aahaarsham").
- p.57 `कृष्णद्वैपायनादयःये` → `कृष्णद्वैपायनादयः ये` (roman "...aadayaha ye").

Not repairs: the p.55 sankalpa blank "..........." is replaced by the p.19 stem it
stands for; "(३)" after namo brahmane (p.56) is moved out of the mantra into the
instruction ("three times"); quotation marks around two mantras are dropped;
runs of spaces collapsed.

Kept as printed: the third "vishvaan devaan kaandarsheegmstarpayaami" at the top
of p.59 (see 4.4); the hyphen in `शं यो-रभिस्रवन्तु`; `मय्यग्निःतेजो`; the comma
and full stop in `कृष्ण, कृष्ण कृष्ण.`

The transcript's p.54 finding says the homa is "eleven svaahaa offerings plus
one bare svaahaa". The pages print **twelve** svaahaa mantras (five on p.50,
seven on p.51) plus the bare svaahaa on p.52: thirteen samidhs. The samagri list
says 13 or more. The finding should be corrected in the transcript.

## 4. Ambiguities in the book, and what was chosen

1. **Facing in the evening Samidadhanam.** The rite is kept "facing east and west
   respectively" (p.49), but the achamanam rubric it points to says "facing north
   or east" (p.16). The facing is set on the first screen per sitting ("Prepare
   the Fire — morning/evening": east / west), and Samidadhanam's achamanam
   omits a direction. Brahma Yajnam's achamanam keeps "east or north".
2. **The fire.** The book's preparation paragraph (light the fire in the kundam
   with husk, dung cakes and charcoal) is a no-mantra first step, split by
   sitting because of the facing. No source of flame (matches, camphor) is
   named; none is added.
3. **Agni Prarthana (p.49) has no rubric.** The instruction says only "Face the
   fire and recite".
4. **Third Vishvaan Devaan (p.59).** Printed twice in succession across the page
   break (end of the p.58 list, then top of p.59). Whether it is meant twice is
   not settled by the page; both are kept as printed. A vaidika should say
   whether to drop one. (Rishi list = 14 + 1 + 9.)
5. **"Lift the hand up and allow the water to flow down" (p.58)** is printed
   immediately before brahmaanam svayambhuvam and is read as applying to that one
   offering only; it is its own step between the two rishi lists. The p.59
   continuation is read as resuming the rishi manner (garland, twice, palm to the
   left).
6. **"Continue the japa in the same posture" (p.56)** for namo brahmane does not
   say which posture. The instruction says "Staying as you are".
7. **Tarpana Sankalpam (p.57)** has no rubric; the instruction says only to
   recite it before the tarpanam.
8. **Pitru tarpanam thread position.** The book says "hang the yajnopaveetam on
   the left side"; the instruction says exactly that, without naming the
   shoulder.
9. **Urjam vahanteeh (p.60)** is "only by those who do not have their fathers".
   Kept in the single mode with the condition in the instruction ("If your father
   is living, leave this out and press Next"). Alternative for the owner: two
   modes (father living / father departed), which hides the step instead.
10. **Bhojana parishechanam order.** p.60-61: circle with om bhuh bhuvah suvah;
    sprinkle with the Gayatri; "perform the circumambulation of the plate with
    water twice again" with deva savitah prasuva and then the day/night formula.
    Read as two more circuits: one with deva savitah prasuva, one with the
    day or night formula.
11. **Bhojana hands.** The general instruction (right ring finger on the plate
    while food is served, then the left ring finger while the right hand does
    the mantras, "repeated alternatively along the mantra") is folded into step 1.
    The "alternatively" is not fully clear and is rendered as: switch to the
    left ring finger and keep it there.
12. **Mode hours.** Samidadhanam evening from 12:00 and Bhojana night from
    18:00 are guesses for the picker's opening choice; one tap changes them.
13. **Deities.** proofread requires every published rite to name an existing
    deity. Brahma Yajnam has none in the usual sense; a new `brahma` deity row
    was added (the rite waters "the devas beginning with Brahma" and "Brahma the
    self-born"). Bhojana Vidhi is set to `agni` (the pranahuti treats the body as
    the fire), which the book does not say. The deity is not shown anywhere in
    the UI. Owner may prefer to relax the gate for nitya rites instead.
14. **Brahmachari only?** p.49 says Samidaadhaanam is for brahmacharis.
    `eligibility` stays 'all' and `karta_recommended` null (as for
    Sandhyavandanam); the description says it.

## 5. Meanings to review

These pages carry no English gloss; every meaning_en is written here. Plain
renderings, conservative. Those a reviewer should check first:

- **Agni Prarthana** (pari tvaagne...): "I tend you all around" for pari
  mrjaami (literally "wipe/cleanse around"); "well protected by a protector" for
  supatih patyaa (could be "a good lord through lordship"); "rich in sacred
  learning through students of the Veda" for subrahmaa brahmachaaribhih.
- **Homa 1**: "the great knower of all beings" for brhate jaatavedase; "gain"
  for sanyaa.
- **Homa 5 (apo adya)**: "Today I have followed the waters; we have been joined
  with their essence. Full of strength (payasvaan), Agni, I have come."
- **Homa 7 (vidyun me asya devaah)**: read as "may the gods know this of mine;
  may Indra know it, with the seers". Uncertain.
- **Homa 8 (agnaye brhate naakaaya)**: "the vault of heaven" for naaka. Uncertain
  whether naaka is in apposition to Agni.
- **Homa 11 (yo maagne bhaaginam...)**: "shareless / one who has a share".
- **Agni Upasthanam**: haras as "fierce heat ... strong"; bhraajas as "splendour".
- **Vidyudasi / Vrishtirasi**: "split open my wrong" (vidya) and "cut away my
  wrong" (vrshcha); "from the right I come to the truth" for rtaat satyam upaimi.
- **Ishe tvorje tvaa**: "You are the winds, you are the ones that come near"
  for vaayavastha upaayavastha. The traditional reading (the calves sent to
  pasture) is not given.
- **Satyam tapah shraddhaayaam juhomi**: "I offer truth and austerity into faith".
- **Rishi tarpanam**: kaandarshi as "seer of a section of the Veda";
  "the deities of the Samhita, of the sacrificial texts and of Varuna, with their
  Upanishads" for saamhitir / yaajnikir / vaarunir devataa upanishadah; the
  Arunas as "seers of sections" (aruna kaandarshi). All need a vaidika.
- **Urjam vahanteeh**: kilaalam as "sweet drink", parisrutam as "the overflowing
  draught".
- **Satyam tvartena / rtam tvaa satyena**: "I sprinkle around you, who are
  truth, with the right" and the reverse.
- **Amritopastaranam / amritaapidhanam**: "the spread beneath the nectar" /
  "the covering over the nectar".
- **Brahmani ma aatmaa amrtatvaaya**: "My self is in Brahman, for immortality."

Tamil prose (instructions, why_ta, section and mode labels) has not been read by
a native reader.

## 6. Yajnopaveeta Dharana Vidhi (pp.62-63)

**Recommendation: make it a rite of its own, not part of any of these three.**

- It is a separate unit in the book: its own heading, its own sankalpa ("shrauta
  smaarta vihita nityakarmaanushthaana... yajnopaveeta dhaaranam karishye"), its
  own nyasa (rishi, chandas, devata touched to head, nostrils, chest), and its own
  colophon, iti yajnopaveeta dhaarana vidhih.
- It is not daily. It is done when the thread is new or changed (Upakarma,
  after impurity, when it breaks), so it does not belong on the Nitya Karmas
  shelf next to daily rites. As a catalogue entry it fits as a short rite
  (ritual_class 'nitya' is wrong; something like 'domestic' or a new class).
- It has a natural mode split the app already supports: the book says grihasthas
  wearing two or three threads repeat the wearing mantra "separately for each
  sacred thread", so modes "one thread / two / three" (or a count in the
  instruction) and the removal of the old thread as the closing step.
- Shape: achamanam and anga vandanam (inlined; once, see below), dhyanam, pranayama, sankalpa, nyasa, viniyoga, wearing mantra (with the
  hand position on p.63), achamanam, removal mantra for the old thread,
  achamanam. About 14-16 steps.
- Note p.62 lists "aachamanam & angavandanam" without "(twice)", unlike pp.49
  and 55.
