# Navaratri rebuilt from the book (migration 0062)

*18 October 2026. Generator: `scripts/build-navaratri-from-the-book.mjs`.
Migration: `supabase/migrations/0062_navaratri_from_the_book.sql` (not yet
applied). Rules it implements: `docs/PROJECT-GUIDE.md` §2.1 and §2.2;
`docs/plans/ux-seamless-flow.md` §2.6, §3.1 and §3.6.*

## What changed

The `navaratri_pooja` rite is replaced wholesale (its steps deleted and
re-inserted, as 0057 did). The pooja row, its three modes and their labels, the
namavalis, samagri and naivedyam are not touched, and no other rite is.

1. **The Purvanga is the book's, inlined.** All 18 numbered steps of the common
   section (book pp.1–26) are now in the rite, in the order every Navaratri page
   gives: Purvanga 1–9, Pranayama (9), the Navaratri sankalpa (10), Purvanga
   11–16, the Navaratri dhyana and avahana (17), Prana Pratishtha (18), then
   the pradhana pooja. The StotraNidhi/practice steps (Vighneshwara Dhyanam with
   agajanana, Pranayamam, Kalasha, Ghanta, the Manjal Pillaiyar step) are gone;
   every mantra is read from the transcripts by page and block.
2. **One action and its words per screen.** Every bundled step is cut at the
   book's rubrics. Each screen carries a section label (`section_en/_ta`, 0061).
3. **Instructions follow the hand-position review** (scratchpad
   `hand-positions.md`): sankalpam palms (left up on the right thigh, right
   crossed over), the pranayama finger shape and the mantra split across
   breathe-in / hold / breathe-out with the ear touch, the achamanam hand,
   Padmanabha at the navel, sandal on the bell handle, three rounds and the
   8-limb/5-limb prostration, the nyasa done on one's own body, five taps for
   the Vighneshwara dhyanam. Where the book is silent (which hand rings the bell,
   the camphor pattern) nothing specific is said.

## Step counts per mode

| Mode | Label | Before (0057, live) | After (0062) |
|---|---|---|---|
| main | First Day | 29 | 109 |
| punar | Days 2 to 9 | 26 | 99 |
| udvasana | Vijayadashami – Punah Pooja | 11 | 22 |
| all rows | | 31 | 112 |

Days 2 to 9 = First Day minus the ten installation steps (Dhyanam, Avahanam,
and the eight Prana Pratishtha screens). Vijayadashami keeps the composition it
had (Achamanam, Ghanta, Sankalpam, the Durga 108, incense and lamp, the
naivedyam, camphor, pushpanjali, pradakshina, prarthana, punah pooja), each now
in its book form and split at the rubrics; it gains the archana's closing line
(Patra Pushpa Samarpanam) because that is how the book closes the Durga 108.

Archana rows: Vighneshwara 16 (new), Anga Pooja 18, Navadurga 9, Navakanya 9.
The Durga, Lakshmi and Saraswati 108 still point at their namavalis.

## The new step list

| # | Section | Title | Modes | Source (book page) |
|---|---|---|---|---|
| 1 | Purvangam | Achamanam | main, punar, udvasana | Purvanga p.1, step 1, aachamanam |
| 2 | Purvangam | Anga Vandanam | main, punar | Purvanga pp.1-3, step 1, angavandanam; bare names as printed, each with its limb and finger |
| 3 | Purvangam | Vighneshwara Dhyanam | main, punar | Purvanga p.3, step 2, vighnEshvara dhyaanam |
| 4 | Purvangam | Pranayamam | main, punar | Purvanga pp.3-4, step 3, praaNaayaamaha; lines cut at the book's Puraka, Kumbhaka and Rechaka marks |
| 5 | Purvangam | Vighneshwara Sankalpam | main, punar | Purvanga p.4, step 4, sankalpaha |
| 6 | Purvangam | Sakala Devata Vandanam | main, punar | Purvanga p.4, step 5, sakala dEvataa vandanam |
| 7 | Purvangam | Deepa Pooja | main, punar | Purvanga p.5, step 5, deepa mantraha |
| 8 | Purvangam | Asana Pooja | main, punar | Purvanga p.5, step 6, aasana poojaa |
| 9 | Purvangam | Ghanta Pooja | main, punar, udvasana | Purvanga p.5, step 7, ghaNTaa poojaa |
| 10 | Purvangam — Vighneshwara Pooja | Vighneshwara Dhyanam (again) | main, punar | Purvanga p.6, step 8, vighnEshvara dhyaanam |
| 11 | Purvangam — Vighneshwara Pooja | Vighneshwara Avahanam | main, punar | Purvanga pp.6-7, step 8, praarthanaa: the Vedic verse for those who know its intonation, and the verse for everyone else |
| 12 | Purvangam — Vighneshwara Pooja | Vighneshwara Asanam | main, punar | Purvanga p.7, step 8, aasanam |
| 13 | Purvangam — Vighneshwara Pooja | Vighneshwara Padyam | main, punar | Purvanga p.7, step 8, paadyam |
| 14 | Purvangam — Vighneshwara Pooja | Vighneshwara Arghyam | main, punar | Purvanga p.7, step 8, arghyam |
| 15 | Purvangam — Vighneshwara Pooja | Vighneshwara Achamaniyam | main, punar | Purvanga p.8, step 8, aachamaneeyam |
| 16 | Purvangam — Vighneshwara Pooja | Vighneshwara Snanam | main, punar | Purvanga p.8, step 8, snaanam |
| 17 | Purvangam — Vighneshwara Pooja | Vighneshwara Achamaniyam after Snanam | main, punar | Purvanga p.8, step 8, snaanaanantaram aachamaneeyam |
| 18 | Purvangam — Vighneshwara Pooja | Vighneshwara Vastram | main, punar | Purvanga p.8, step 8, vastrayugmam |
| 19 | Purvangam — Vighneshwara Pooja | Vighneshwara Upaveetam | main, punar | Purvanga p.8, step 8, yajnyOpaveetam |
| 20 | Purvangam — Vighneshwara Pooja | Vighneshwara Gandham | main, punar | Purvanga p.8, step 8, gandhaan dhaarayaami; one rubric for sandal and kunkum |
| 21 | Purvangam — Vighneshwara Pooja | Vighneshwara Abharanam | main, punar | Purvanga p.9, step 8, aabharaNam |
| 22 | Purvangam — Vighneshwara Pooja | Vighneshwara Akshatai | main, punar | Purvanga p.9, step 8, akSHataan |
| 23 | Purvangam — Vighneshwara Pooja | Vighneshwara Pushpam | main, punar | Purvanga p.9, step 8, puSHpamaalaam; one rubric for garland and flowers |
| 24 | Purvangam — Vighneshwara Pooja | Vighneshwara Shodasha Nama Archana | main, punar | Purvanga pp.9-10, step 8, archanaa, sixteen names |
| 25 | Purvangam — Vighneshwara Pooja | Vighneshwara Patra Pushpa Samarpanam | main, punar | Purvanga p.9, step 8, the close of the archana |
| 26 | Purvangam — Vighneshwara Pooja | Vighneshwara Dhoopam | main, punar | Purvanga p.10, step 8, dhoopam; the printed line holds dhoopa and deepa, cut at its comma |
| 27 | Purvangam — Vighneshwara Pooja | Vighneshwara Deepam | main, punar | Purvanga p.10, step 8, deepam |
| 28 | Purvangam — Vighneshwara Pooja | Vighneshwara Dhoopa Deepa Achamaniyam | main, punar | Purvanga p.10, step 8, dhoopa deepaanantaram aachamaneeyam |
| 29 | Purvangam — Vighneshwara Pooja | Vighneshwara Naivedya Prokshanam | main, punar | Purvanga p.11, step 8, naivEdyamantraaha: the sprinkling and the threefold circling |
| 30 | Purvangam — Vighneshwara Pooja | Vighneshwara Parishechanam | main, punar | Purvanga p.11, step 8, the morning and evening parishechana lines |
| 31 | Purvangam — Vighneshwara Pooja | Vighneshwara Amritopastaranam | main, punar | Purvanga p.11, step 8, amRtOpastaraNamasi |
| 32 | Purvangam — Vighneshwara Pooja | Vighneshwara Pranahuti | main, punar | Purvanga pp.11-12, step 8, the six praaNaahutis |
| 33 | Purvangam — Vighneshwara Pooja | Vighneshwara Amritapaniyam | main, punar | Purvanga p.12, step 8, madhyE madhyE amRtapaaneeyam |
| 34 | Purvangam — Vighneshwara Pooja | Vighneshwara Amritapidhanam | main, punar | Purvanga p.12, step 8, amRtaapidhaanamasi |
| 35 | Purvangam — Vighneshwara Pooja | Vighneshwara Uttaraposhanam | main, punar | Purvanga p.12, step 8, uttaraapOshanam |
| 36 | Purvangam — Vighneshwara Pooja | Vighneshwara Karpura Neerajanam | main, punar | Purvanga p.12, step 8, karpoora neeraajanam |
| 37 | Purvangam | Pranayamam (again) | main, punar | Purvanga p.12, step 9, praaNaayaamaha, printed in short as the full pranayama of step 3 (pp.3-4), shown here in full |
| 38 | Purvangam | Sankalpam | main, punar, udvasana | Purvanga pp.12-13 step 10, pradhaana poojaa sankalpaha (frame and purposes), with the Navaratri clause and its rubric from p.286 |
| 39 | Purvangam | Vighneshwara Udyapanam | main, punar | Purvanga p.14, step 11, vighnEshvara udyaapanam, with apa upaspRshya |
| 40 | Purvangam | Kalasha Gandham | main, punar | Purvanga p.14, step 12, kalasha poojaa; one rubric for sandal and vermilion |
| 41 | Purvangam | Kalasha Tirtha Avahanam | main, punar | Purvanga p.15, step 12, the seven rivers |
| 42 | Purvangam | Kalasha Abhimantranam | main, punar | Purvanga pp.15-16, step 12, kalashasya mukhE; the feminine of the book's dEva(dEvee) alternative |
| 43 | Purvangam | Shankha Pooja | main, punar | Purvanga pp.16-17, step 13, shankha poojaa; may be skipped if there is no conch |
| 44 | Purvangam | Shankha Archana | main, punar | Purvanga p.17, step 13, the names, and the sprinkling |
| 45 | Purvangam | Atma Pooja | main, punar | Purvanga p.18, step 14, aatma poojaa |
| 46 | Purvangam | Peetha Pooja | main, punar | Purvanga pp.18-19, step 15, peeTHa poojaa, fourteen names |
| 47 | Purvangam | Guru Dhyanam | main, punar | Purvanga p.19, step 16, guru dhyaanam |
| 48 | Dhyanam & Avahanam | Dhyanam | main | Navaratri Puja p.286, dhyaanam (Purvanga step 17) |
| 49 | Dhyanam & Avahanam | Avahanam | main | Navaratri Puja p.287, aavaahanam (Purvanga step 17) |
| 50 | Prana Pratishtha | Prana Pratishtha Viniyoga | main | Purvanga pp.19-20, step 18, praaNapratiSHTHaa: rishi, chandas, devata, bija, shakti, kilaka, viniyoga, with the rubric for each |
| 51 | Prana Pratishtha | Kara Nyasa | main | Purvanga pp.20-21, step 18, kara nyaasa, with the rubric for each finger |
| 52 | Prana Pratishtha | Anga Nyasa & Digbandha | main | Purvanga pp.21-22, step 18, anga nyaasa and digbandha, with the rubric for each line |
| 53 | Prana Pratishtha | Prana Shakti Dhyanam | main | Purvanga p.23, step 18, dhyaanam of the Prana Shakti |
| 54 | Prana Pratishtha | Prana Pratishtha | main | Purvanga pp.23-24, step 18, the bija and the praaNastiSHTHatu |
| 55 | Prana Pratishtha | Asunite Mantra | main | Purvanga p.24, step 18, asuneetE, with the rubric to chant Om fifteen times first |
| 56 | Prana Pratishtha | Avahita Bhava | main | Purvanga pp.24-25, step 18, the dEvee column (the feminine forms), and dEvi sarvajagannaayikE |
| 57 | Prana Pratishtha | Ksheera Naivedyam | main | Purvanga p.26, after praaNapratiSHTHaa, kSHeeram nivEdayaami |
| 58 | Shodashopachara | Asanam | main, punar | Navaratri Puja p.288, aasanam |
| 59 | Shodashopachara | Padyam | main, punar | Navaratri Puja p.288, paadyam |
| 60 | Shodashopachara | Arghyam | main, punar | Navaratri Puja p.288, arghyam |
| 61 | Shodashopachara | Achamaniyam | main, punar | Navaratri Puja pp.288-289, aachamaneeyam |
| 62 | Shodashopachara | Snanam | main, punar | Navaratri Puja p.289, snaanam |
| 63 | Shodashopachara | Vastram | main, punar | Navaratri Puja p.289, vastrayugmam |
| 64 | Shodashopachara | Upaveetam | main, punar | Navaratri Puja pp.289-290, upaveetam |
| 65 | Shodashopachara | Gandham | main, punar | Navaratri Puja p.290, gandham |
| 66 | Shodashopachara | Manjal (Saubhagya Dravyam) | main, punar | Navaratri Puja p.290, saubhaagyadravyaaNi, rubric: offer turmeric paste |
| 67 | Shodashopachara | Kumkumam | main, punar | Navaratri Puja p.290, kunkumam |
| 68 | Shodashopachara | Kanmai (Kajjalam) | main, punar | Navaratri Puja p.290, kajjalam |
| 69 | Shodashopachara | Abharanam | main, punar | Navaratri Puja p.290, aabharaNaani |
| 70 | Shodashopachara | Akshatai | main, punar | Navaratri Puja p.291, akSHataan |
| 71 | Shodashopachara | Pushpam | main, punar | Navaratri Puja p.291, puSHpamaalaam; one rubric for garland and flowers |
| 72 | Archana | Anga Pooja | main, punar | Navaratri Puja pp.291-292, angapoojaa |
| 73 | Archana | Durga Ashtottara Shatanamavali | main, punar, udvasana | Navaratri Puja pp.293-296, durgaaSHTOttarashatanaamaavalihi, count markers verified in both scripts |
| 74 | Archana | Lakshmi Ashtottara Shatanamavali | main, punar | Navaratri Puja p.296, rubric: the Lakshmi ashtottaram (book p.123), as carried for Varalakshmi |
| 75 | Archana | Saraswati Ashtottara Shatanamavali | main, punar | Navaratri Puja p.296, rubric: the Saraswati ashtottaram, pp.315-318 |
| 76 | Archana | Patra Pushpa Samarpanam | main, punar, udvasana | Navaratri Puja p.294, the close of the archana; the roman (p.296) reads puSHpaaNi |
| 77 | Uttaranga Pooja | Dhoopam | main, punar, udvasana | Navaratri Puja p.297, uttaraanga poojaa, dhoopam |
| 78 | Uttaranga Pooja | Deepam | main, punar, udvasana | Navaratri Puja p.297, deepam |
| 79 | Uttaranga Pooja | Dhoopa Deepa Achamaniyam | main, punar, udvasana | Navaratri Puja p.297, dhoopa deepaanantaram aachamaneeyam |
| 80 | Uttaranga Pooja | Naivedya Prokshanam | main, punar, udvasana | Navaratri Puja p.298, naivEdyamantraaha: the sprinkling and the threefold circling |
| 81 | Uttaranga Pooja | Parishechanam | main, punar, udvasana | Navaratri Puja p.298, the morning and evening parishechana lines |
| 82 | Uttaranga Pooja | Amritopastaranam | main, punar, udvasana | Navaratri Puja p.298, amRtOpastaraNamasi |
| 83 | Uttaranga Pooja | Pranahuti | main, punar, udvasana | Navaratri Puja p.298, the six praaNaahutis |
| 84 | Uttaranga Pooja | Mahanaivedyam | main, punar, udvasana | Navaratri Puja pp.298-299, mahaanaivEdyam |
| 85 | Uttaranga Pooja | Amritapaniyam | main, punar, udvasana | Navaratri Puja p.299, madhyE madhyE amRtapaaneeyam |
| 86 | Uttaranga Pooja | Achamaniyam after Naivedyam | main, punar, udvasana | Navaratri Puja p.299, nivEdanaanantaram aachamaneeyam |
| 87 | Uttaranga Pooja | Tambulam | main, punar, udvasana | Navaratri Puja p.299, karpoorataamboolam |
| 88 | Uttaranga Pooja | Karpura Neerajanam | udvasana | Navaratri Puja p.304 rubric for dashami (wave camphor); verse from p.321, addressed to the same three goddesses |
| 89 | Uttaranga Pooja | Achamaniyam after Neerajanam | udvasana | Saraswati Puja p.322, neeraajanaanantaram aachamaneeyam, with the camphor above |
| 90 | Uttaranga Pooja | Pushpanjali | main, punar, udvasana | Navaratri Puja p.299, puSHpaanjali |
| 91 | Uttaranga Pooja | Pradakshina & Namaskaram | main, punar, udvasana | Navaratri Puja p.300, pradakSHiNa namaskaaraan; three rounds and the eight- and five-limbed prostration from the general instructions, p.XVI |
| 92 | Uttaranga Pooja | Navadurga Pooja | main, punar | Navaratri Puja p.300, navadurgaa poojaa; two-column list read in the canonical order of the nine forms |
| 93 | Uttaranga Pooja | Jyoti Pooja | main, punar | Navaratri Puja pp.300-301, jyOti poojaa |
| 94 | Uttaranga Pooja | Prarthana | main, punar, udvasana | Navaratri Puja p.301, praarthanaa |
| 95 | Navakanya Pooja | Kanya Avahanam | main, punar | Navaratri Puja p.301, navakanyaa poojaa, the invocation |
| 96 | Navakanya Pooja | Kanya Padyam | main, punar | Navaratri Puja p.302, paadyam, said to kulakumaarikaa |
| 97 | Navakanya Pooja | Kanya Arghyam | main, punar | Navaratri Puja p.302, arghyam |
| 98 | Navakanya Pooja | Kanya Achamaniyam | main, punar | Navaratri Puja p.302, aachamaneeyam |
| 99 | Navakanya Pooja | Kanya Vastram | main, punar | Navaratri Puja p.302, vastram |
| 100 | Navakanya Pooja | Kanya Gandham | main, punar | Navaratri Puja p.302, gandham |
| 101 | Navakanya Pooja | Kanya Haridra Kumkumam | main, punar | Navaratri Puja p.302, haridraakunkumam |
| 102 | Navakanya Pooja | Kanya Abharanam | main, punar | Navaratri Puja p.302, bhooSHaNaani |
| 103 | Navakanya Pooja | Kanya Pushpam | main, punar | Navaratri Puja p.302, puSHpaaNi |
| 104 | Navakanya Pooja | Navakanya Pooja | main, punar | Navaratri Puja pp.302-303, archanaa; the nine names read in the order of the maidens' ages, Kumari to Subhadra |
| 105 | Navakanya Pooja | Kanya Dhoopam | main, punar | Navaratri Puja p.303, dhoopam |
| 106 | Navakanya Pooja | Kanya Deepam | main, punar | Navaratri Puja p.303, deepam |
| 107 | Navakanya Pooja | Kanya Naivedyam | main, punar | Navaratri Puja p.303, naivEdyam |
| 108 | Navakanya Pooja | Kanya Achamaniyam after Naivedyam | main, punar | Navaratri Puja p.303, nivEdanaanantaram aachamaneeyam |
| 109 | Navakanya Pooja | Kanya Neerajanam | main, punar | Navaratri Puja p.303, karpoora neeraajanam, rubric: offer camphor light |
| 110 | Navakanya Pooja | Kanya Achamaniyam after Neerajanam | main, punar | Navaratri Puja p.303, neeraajanaanantaram aachamaneeyam |
| 111 | Navakanya Pooja | Kanya Prarthana | main, punar | Navaratri Puja p.303, praarthanaam samarpayaami |
| 112 | Uttaranga Pooja | Punah Pooja & Yathasthanam | udvasana | Navaratri Puja p.304, punah poojaa - yathaasthaanam |

## Decisions for the owner to check

1. **Length.** Following the book in full makes the First Day 109 screens and
   each of days 2–9 99 screens (from 29 and 26). Most screens are one short line
   and one action, so the time is closer to the book's than the count suggests,
   but it is a big change to how the rite feels. `poojas.duration_mins` is left
   at 75; it is probably low now.
2. **Days 2–9 repeat the whole Purvanga**, including the full Vighneshwara pooja
   (27 screens) and its udyapanam, every day. That is what the book's rubric
   says for every pooja; only the Goddess's dhyana, avahana and Prana
   Pratishtha are dropped on days 2–9, since she is already installed. A
   "short purvanga" for those days would need a source.
3. **Pranayama step 9** (before the sankalpa). The book prints it in short
   ("ओंभूः + भूर्भुवस्सुवरोम्", "follow instruction number 3, page 1"). The app
   shows the full pranayama again as "Pranayamam (again)", with the akshatai in
   hand and the ear touch the p.12 rubric adds. Like every Pranayamam in the app
   it is `filter_male_only`, so a woman karta sees neither.
4. **The pranayama mantra is set as three lines**, cut exactly at the book's
   Puraka / Kumbhaka / Rechaka marks, so the instruction can say "breathe in on
   the first line, hold through the second, breathe out on the third".
5. **Shankha.** Split into Shankha Pooja (the verses; anoint and fill) and
   Shankha Archana (the names; then sprinkle the pooja articles and refill).
   Both instructions open "If there is no conch in the house, skip this", as
   the book allows; the screens are still shown.
6. **Prana Pratishtha uses the devi column of p.24–25** (आवाहिता भव …
   सुमुखी भव … वरदा भव, देवि सर्वजगन्नायिके). The book's own text has no
   deity-name line, so the 0057 line "श्रीदुर्गा लक्ष्मी सरस्वती देव्यै नमः" and
   0057's "अमृतं वै प्राणा …" (not on these pages) are gone. The last line keeps
   the book's bracketed alternatives — बिंबेऽस्मिन् (कलशेऽस्मिन् /प्रतिमायां) —
   and the instruction says which to choose.
7. **No fingertip touch on the kalasham** in Prana Pratishtha: the book prints
   the nyasa on one's own body and nothing else. Prana Pratishtha is eight
   screens: viniyoga, kara nyasa, anga nyasa and digbandha, Prana Shakti
   dhyana, the bija and "asyam murtau", the asunite verse (after fifteen Oms),
   the nine bhava lines, and the milk offered after it (p.26).
8. **The nine avahanadi gestures** of p.24–25 are drawings without captions in
   the book; the instruction does not describe them. A reviewer should.
9. **Kalasha Pooja is the panchapatram.** The book's step 12 anoints "the water
   vessel (Panchapaatra)". The instructions say so. The book has no sprinkling
   in step 12 (the conch water does that in step 13), so none is invented.
   The verse's "आयान्तु देव(देवी)पूजार्थ" takes the book's feminine alternative.
10. **Vighneshwara invocation.** Both of the book's invocations are on one
    screen: the Vedic गणानां त्वा (for those who know its intonation) and
    अगजानन … आवाहयामि for everyone else, as Ganesha's row 10 does. The
    instruction tells the reader which to say.
11. **Anga Vandanam is the bare twelve names** (केशव, नारायण …), as the book
    prints them, not "ॐ केशवाय नमः". This differs from every other rite in the
    app.
12. **Sankalpam.** The frame is now read from pp.12–13 (it was typed in 0057):
    it opens ममोपात्त, keeps शकाब्दे and "प्रभवादीनां षष्ट्याः संवत्सराणां मध्ये"
    before the dynamic slot, and the book's order of clauses. The book's menu of
    extra purposes (सत्सन्तान प्राप्त्यर्थं …, "use appropriate sankalpa") is not
    added; the Navaratri page gives none. The akshatai is held in the lower
    (left) palm — the book says only "have some akshata in hand" — and is
    dropped to the north at the end, which the Navaratri page does print. The
    0057 flower is gone (not in the book).
13. **Kanya upacharas are said to the maiden by name.** The book prints
    "ॐ क्लीं कुलकुमारिकायै नमः" once above the list; each split screen carries it
    before its upachara (पाद्यं समर्पयामि …). The kanya prarthana does not.
14. **Udyapanam and hand-washing on one screen.** Step 11's "अप उपस्पृश्य" (wash
    the hands) has its own rubric but is two words; it stays on the udyapanam
    screen.
15. **Four screens keep two offering verbs**, because the book puts both under
    one rubric: Vighneshwara Gandham (gandha + haridra-kunkuma), Vighneshwara
    Pushpam and Pushpam (garland + "pushpaih poojayami"), Kalasha Gandham. The
    0062 test allows exactly these four.
16. **Dhoopa and deepa of the Vighneshwara pooja** are one printed line with one
    rubric ("offer incense and wave lamp"); the app cuts it at its comma into two
    screens, because they are two actions.
17. **Karpura Neerajanam stays Vijayadashami-only**, as in 0057 (the main rite
    prints no neerajanam for the Goddess), now split from its achamaniyam.
    "Three times" and "ringing the bell" are dropped (not in the book).
18. **Achamanam** says "east or north" and drops "without the lips touching the
    hand" (not in the book).
19. **Proofread.** `SHARED_OK` gains Sakala Devata Vandanam, Deepa Pooja,
    Vighneshwara Sankalpam and Vighneshwara Shodasha Nama Archana, whose prose
    is the Ganesha rite's; `EXPECT_ARCHANA`/`EXPECT_PROSE_COUNT` gain
    `navaratri_pooja/Vighneshwara Shodasha Nama Archana` (16, "sixteen").
20. **When to apply.** Navaratri 2026 is under way as this is written (Vijayadashami falls around 20 October). Applying 0062 now changes the rite mid-festival and resets saved progress for anyone mid-pooja, since every step number changes. Applying it after Vijayadashami avoids both.
21. **Tamil** for all new instructions is written fresh and has not been read by
    a native reader.

## Repairs to the print (recorded in the generator header)

- p.3 ओँ → ओꣳ (the roman reads Ogum), twice in the pranayama.
- p.13 दुरितोप / शान्त्यर्थं rejoined (roman duritOpashaantyartham).
- p.15 देव(देवी)पूजार्थ → देवीपूजार्थं (feminine alternative; anusvara from the roman).
- p.24 पुनररस्मासु → पुनरस्मासु (roman punarasmaasu).
- p.286 लक्ष्मि → लक्ष्मी (roman lakSHmee), as 0055.
- p.294 पुष्पानि → पुष्पाणि (roman puSHpaaNi, p.296).
- The book's en dash is printed between words and inside compounds; it becomes a
  space or a hyphen respectively.

Not repaired: मृलया (p.24), printed so in both scripts.

## Where the book is ambiguous

- **The naivedya rubrics** (p.11 and p.298) sit between the lines: ओं भूर्भुवस्सुवः
  "(sprinkle)", the Gayatri "(circle the plate three times)", देवसवितः …
  "(again circle)", अमृतोपस्तरणमसि "(offer water)". Whether each rubric belongs
  to the line before or after it is not printed. The app sprinkles with the
  vyahriti and circles three times during the Gayatri (one screen,
  "Prokshanam"), circles again with देवसवितः (morning and evening lines on one
  screen, the instruction saying which), and pours water with
  अमृतोपस्तरणमसि.
- **The purvanga naivedya has no naivedyam line** (no "naivedyam nivedayami"
  between the pranahutis and the water); the app follows the print.
- **The Navadurga two-column list** is read in the canonical order, as 0055.
- **Lakshmi 108** is still the StotraNidhi recension the app carries for
  Varalakshmi; the book's own list (p.123, which the Navaratri page points to) is not the
  one the app shows.
- **The kanya prarthana's** "प्रार्थनां समर्पयामि" is printed on the verse's last
  line, kept as printed.
