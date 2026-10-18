# Review: hand positions and physical actions — book vs app

*Produced 18 October 2026 from the transcripts, the book's illustrations and the live database. The book settles 12 contradictions (applied for Ganesha, Varalakshmi, Saraswati, Nitya and Sandhyavandanam by migration 0064; Navaratri by its rebuild, 0062). §(4) in each section lists what the book leaves open — those need the owner's or a priest's decision before any visual is drawn.*


*Research note, 18 Oct 2026. Read-only. Resolves (or flags) the conflicts listed in `docs/plans/step-visuals.md` §2.3.*

**Sources, in order of authority**
- **P** = *Sampradaya Vratha Pooja Vidhi* (Giri), Purvanga, transcripts `1-common/pNN.json` (book page = pNN for pp.1–26).
- **S** = *Yajurveda Trikaala Sandhyaavandanam* (Giri), transcripts `6-sandhya-giri/pNN.json` (book page given separately; pdf p12 = book p16, and so on).
- **G** = general instructions, `0-general/pNN.json` (book pp. VIII–XX).
- Deity sections: `2-nitya`, `3-siddhivinayaka`, `4-varalakshmi`, `7-navaratri`.
- Crops are in `G:\My Drive\Pooja Vidhi\extracted\illustrations\`. Where no crop exists, I cropped the page photo; those crops are in this scratchpad folder (`crop-sankalpa-p04.png`, `crop-sankalpa-hands.png`, `sandhya-sankalpa.png`, `sandhya-achamanam.png`, `p12-camphor.png`).
- App text = live `pooja_steps` read on 18 Oct 2026 (anon key).

**Rubric quotes were checked against the page photos** for P pp.4, 12, 20–22, 24–25 and S book pp.16–19.

**Crop-label warnings (these affect the art pipeline).**
- `1-common-p04-1.png` is **not** the sankalpam. It is the anjali figure for *sakala devata vandanam* (step 5). The transcript caption on p04 block 5 is wrong about this. The real sankalpam figure has no crop; see `crop-sankalpa-p04.png`.
- `step-visuals.md` §1 mislabels several crops:

  | Crop | step-visuals.md says | Book actually shows |
  |---|---|---|
  | `p02-6` | temples | Hrishikesha, left shoulder |
  | `p03-1` | temples | Padmanabha, navel |
  | `p03-3` | anjali | Vighneshwara dhyanam, knuckles on the temples |
  | `p04-1` | lamp | anjali (sakala devata vandanam) |
  | `p05-3` | bell | sprinkling the seat (asana pooja) |
  | `p05-4` | (not listed) | the bell (ghanta pooja) |

- The S illustrations named in the S transcripts (`6-sandhya-giri-p12-achamanam`, etc.) **have no crop files**. They exist only on the page photos.

---

## 1. Sankalpam: hand position

### (1) What the book says
- **P p.4, block 4** (Vighneshwara sankalpam, rubric checked on the photo): *"(Hold left palm upright on the right thigh. while the right palm is placed crossed, over the left palm. Take a resolve to perform Ganesha Puja)"*. After the mantra, block 8: *"(Wash the hands)"*.
- **P p.12, block 16** (pranayamam before the pradhana sankalpam): *"(Follow the instruction number 3, page-1. Have some akshata in hand, touch the right ear with right hand)"*. P p.13 has no further hand rubric, only *"(Use appropriate sankalpa for the main puja)"*.
- **Every deity section points back to the purvanga:**
  - Nitya p.28: *"After performing Purvanga puja steps 1-3 (see page 1-4)"*.
  - Siddhivinayaka p.55, Varalakshmi p.115, Navaratri p.286, Saraswati p.307: *"After performing Purvanga puja (steps 1 to10. see page 1 to 12) continue the main sankalpa given here."*
  - None of them gives a different posture.
- **S book p.19 (pdf p15), block 4:** *"Clasp the right palm over the left, as shown in the figure and place them on the right thigh and chant the following mantra"*. S book p.31 (japa sankalpam) repeats the same mamopaatta frame and gives no new rubric.
- **Illustrations:**
  - P p.4: a seated man, both hands together resting on his right thigh near the knee, with the left forearm crossing the body (`crop-sankalpa-p04.png`; zoom `crop-sankalpa-hands.png`). This is consistent with the rubric. At this size you cannot see which palm is on top.
  - S p.19: one hand's fingers wrap over the other hand, resting on the thigh (`sandhya-sankalpa.png`).

**Book verdict.** Left palm below, facing up, on the right thigh. Right palm crossed over it. For the pradhana sankalpam, akshatai is held in the hands. Wash the hands afterwards.

**What the book does not say:**
- whether the akshatai sits in the left (lower) palm, which is implied but not stated;
- whether a flower or water is added;
- where the akshatai goes at the end.

### (2) App, step by step

| Step | App text (essence) | Verdict |
|---|---|---|
| ganesha #5 Vighneshwara Sankalpam | left palm upright on right thigh, right palm crossed over it; wash hands | **AGREES** |
| ganesha #13 Sankalpam | akshatai + drop of water in **right** palm, **close it with left hand**, on right thigh. (Also: the EN text includes "perform pranayamam once more… touching the right ear", but the TA text drops that sentence.) | **CONTRADICTS** (palm order; water not in book) |
| navaratri #6 | akshatai + flower in right hand, **cover with left**, right thigh; place akshatai north, wash | **CONTRADICTS** (palm order); flower/north SILENT in book |
| saraswati #6 | same as navaratri #6 | **CONTRADICTS** |
| varalakshmi #6 | "Hold **water** in the right palm… Release the water" | **CONTRADICTS** (book: akshata, palms crossed on thigh) |
| nitya #5 | "Hold akshatai in the right hand"; discard north, rinse | **SILENT** on posture (incomplete, not contrary); north SILENT in book |
| sandhyavandanam #5–7 | clasp right palm over left, on right thigh | **AGREES** |
| sandhyavandanam #28–30 | "as for the first Sankalpam" | **AGREES** |

### (3) Proposed canonical text
- **EN:** Put a few grains of akshatai in your left palm and rest it, palm up, on your right thigh. Cover it with your right palm, crossed over the left, and keep both hands there while you recite. At the end, wash your hands.
- **TA:** இடது உள்ளங்கையில் சிறிது அக்ஷதை வைத்து, அதை மேல்நோக்கியபடி வலது தொடையின் மேல் வைக்கவும். வலது உள்ளங்கையை அதன் மேல் குறுக்காக வைத்து மூடி, சொல்லி முடியும் வரை அப்படியே வைத்திருக்கவும். முடிவில் கைகளைக் கழுவவும்.
- **Sandhyavandanam:** keep the current text, which needs no akshatai. Add "rest both on the right thigh" to #28–30 for clarity.

### (4) Needs a human decision
- **Akshatai placement.** Is the akshatai in the lower (left) palm? The book only says "have some akshata in hand". The proposal above assumes the left palm.
- **Extras.** Flower (navaratri, saraswati), drop of water (ganesha #13) and "place the akshatai to the north" (navaratri, saraswati, nitya) are not in the book. Keep them as practice, or drop them?

---

## 2. Pranayamam: finger shape and breath

### (1) What the book says
- **P p.3, block 8:** *"(While chanting the following mantra, draw breath through left nostril while closing the right nostril with the Right thumb. Hold the breath by pressing the left nostril too with right little and ring fingers . Slowly release the breath through right nostril while closing the left nostril with right ring and little finger. These are called Puraka, Kumbhaka and Rechaka stages.)"*
- **P p.4, block 1** marks the breath phases inside the mantra:
  - *(Puraka - Inhale)* after "Ogum satyam";
  - *(Kumbhaka - Hold)* after "prachOdayaat";
  - *(Rechaka - Exhale)* after "bhoor-bhuvas-suvarOm".
- **P p.4, block 2:** *"(Touch the right ear with right hand)"*.
- **P p.12, block 16:** the same again, *"touch the right ear with right hand"*.
- **S book p.18 (pdf p14), block 7:** *"Fold the index and the middle fingers. Press the right nostril with the thumb and the left with the ring and little fingers. … Inhale through the left nostril chanting mentally, the first part of the mantra. Hold the breath during the second part and breathe out through the right nostril chanting the third part."*
- **S book p.19 (pdf p15), block 1:** *"(touch the right ear.)"*
- **Illustrations:**
  - `1-common-p03-pranayama.png` (profile): right thumb on the right nostril, index and middle fingers curled into the palm, the remaining fingers on the far side of the nose.
  - S book p.18 profile drawing: same pose.

**Book verdict.** Right hand. Fold the index and middle fingers. The thumb closes the right nostril; the ring and little fingers close the left.
- Inhale (left nostril) through the seven vyahritis.
- Hold (both nostrils closed) through the Gayatri.
- Exhale (right nostril) through *om aapo… suvarom*.
- Then touch the right ear with the right hand.

The two books agree. P names only the fingers that close the nostrils, and its drawing matches S.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #4, navaratri #4, saraswati #4, varalakshmi #4, nitya #4: "Close the right nostril with the thumb, inhale through the left. Close both, hold breath and mentally chant the mantra. Exhale through the right." | **CONTRADICTS** on timing: the whole mantra is said in the hold, but the book splits it across the three phases. **SILENT** on the folded fingers, on ring+little and on the ear touch. |
| sandhyavandanam #4 | **AGREES** (SILENT on the ear touch) |
| sandhyavandanam #27 | **AGREES** (SILENT on the ear touch) |
| ganesha #13 (pranayama before the main sankalpam, EN only) | **AGREES** (ear touch present in EN, missing in TA) |

### (3) Proposed canonical text
- **EN:** With the right hand, fold the index and middle fingers into the palm. Close the right nostril with the thumb and breathe in through the left while saying the seven worlds (om bhuh … om satyam). Close the left nostril with the ring and little fingers and hold through the Gayatri, then open the right nostril and breathe out through om aapo … suvarom. Finally, touch your right ear with your right hand.
- **TA:** வலது கையில் ஆள்காட்டி விரலையும் நடுவிரலையும் உள்ளங்கையில் மடக்கவும். கட்டைவிரலால் வலது நாசியை மூடி, "ஓம் பூ꞉ … ஓம் ஸத்யம்" சொல்லியபடி இடது நாசி வழியாக மூச்சை இழுக்கவும். மோதிர விரல், சுண்டு விரல்களால் இடது நாசியையும் மூடி, காயத்ரீ முடியும் வரை மூச்சை நிறுத்தவும். பின் வலது நாசியைத் திறந்து "ஓமாபோ … ஸுவரோம்" சொல்லியபடி மூச்சை வெளியிடவும். இறுதியில் வலது கையால் வலது காதைத் தொடவும்.

### (4) Needs a human decision
None on the hand shape. The book settles it.

---

## 3. Achamanam: hand shape and sipping

### (1) What the book says
- **P p.1, block 3:** *"(Take an uddharani of water from pancha-patra; hold it in right palm; and sip water every time while chanting the following mantras. This is for inner purification.)"*
- **P p.1 illustration** `1-common-p01-2.png`, caption *"Sipping the water from the right palm"*: a man and a woman in profile, each raising the cupped right palm to the lips. The fingers are too small to read.
- **S book p.16 (pdf p12), block 3:** *"Aachamanam is performed in a sitting posture, facing north or east. Fold the forefinger of the right hand and join it with the thumb as shown in the figure. Bend the other three fingers to form space enough for a uddharani (spoon type) full of water. Sip the water from the palm each time uttering the following three mantras. (one sip per mantra)"*. Also: *"Perform aachamanam and angavandanam thrice in a row."*
- **S illustration** (no crop file; see `sandhya-achamanam.png` from page photo p12): profile, the palm hollowed with the fingers curled, the water lifted to the lips.

**Book verdict.**
- Sit facing north or east.
- Right hand: fold the forefinger against the thumb and curl the other three fingers so the palm holds one uddharani of water.
- One sip per name, three names.

P says nothing that contradicts this.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #1, navaratri #1, saraswati #1, varalakshmi #1, nitya #1: "Sit facing East… spoonful… in your right palm and sip it after chanting each name. Swallow without the lips touching the hand." | **SILENT** on hand shape. "East" only: **CONTRADICTS mildly**, since the book allows north or east. "Lips not touching the hand" is not in the book. |
| sandhyavandanam #1, #20 | **AGREES** |
| sandhyavandanam #51 ("as before") | **AGREES** |

### (3) Proposed canonical text
- **EN:** Sit facing east or north. Fold the forefinger of your right hand against the thumb and curl the other three fingers so the palm holds one spoonful of water from the uddharani. Sip it once at each of the three names.
- **TA:** கிழக்கு அல்லது வடக்கு நோக்கி அமரவும். வலது கையின் ஆள்காட்டி விரலைக் கட்டைவிரலுடன் சேர்த்து மடக்கி, மற்ற மூன்று விரல்களையும் குவித்து, உள்ளங்கையில் ஒரு உத்தரிணி நீர் நிற்கும்படி வைக்கவும். ஒவ்வொரு நாமத்திற்கும் ஒரு முறை அந்த நீரை உட்கொள்ளவும்.

### (4) Needs a human decision
- **"Without the lips touching the hand."** Keep it as common practice, or drop it? The book does not say this.

---

## 4. Anga Vandanam: the twelve touches

### (1) What the book says
- **P p.1, block 8:** *"While chanting the following mantras touch the various limbs with the right respective fingers."*
- **P pp.1–3:** one rubric and one drawing per name (table below).
- **S book p.16 (pdf p12), block 7:** *"Uttering the following six pairs of mantras, touch the various parts of the body with the respective fingers of the right hand, written against each pair. (Make sure the tip of the forefinger touches the thumb while doing the 1st pair of mantra and the thumb touching the respective fingers while doing the remaining pairs.)"*
- **S table, pdf p12–13 / book pp.16–17:** pair 6 = *"Navel and head with all the fingers"*.
- **S illustration** (book p.17, 12 panels; no crop file): panel 6 shows the flat hand at the navel, then on the crown.
- **The S gloss contradicts its own rubric.** The prose gloss on the same page (pdf p13, block 1, a translation note, not a rubric) says *"Inside of the hand is deemed to be God and should, as such, touch the heart and the peak of the head"*. The rubric table and the drawing both say navel. P also says navel, and the P drawing `1-common-p03-1.png` shows the palm across the navel, well below the chest. **Rubric and drawing in both books outrank the gloss: navel.**

| # | Name (book prints bare names) | Body part | Finger (right hand) | Crop |
|---|---|---|---|---|
| 1 | kEshava | right cheek | thumb | `1-common-p01-3` |
| 2 | naaraayaNa | left cheek | thumb | `1-common-p01-4` |
| 3 | maadhava | right eye | ring finger | `1-common-p01-5` |
| 4 | gOvinda | left eye | ring finger | `1-common-p01-6` |
| 5 | viSHNO | right nostril | index finger | `1-common-p02-1` |
| 6 | madhusoodana | left nostril | index finger | `1-common-p02-2` |
| 7 | trivikrama | right ear | little finger | `1-common-p02-3` |
| 8 | vaamana | left ear | little finger | `1-common-p02-4` |
| 9 | shreedhara | right shoulder | middle finger | `1-common-p02-5` |
| 10 | hRSHeekEsha | left shoulder | middle finger | `1-common-p02-6` |
| 11 | padmanaabha | **navel** | all fingers (flat palm) | `1-common-p03-1` |
| 12 | daamOdara | head (crown) | all fingers (palm on crown) | `1-common-p03-2` |

The drawings for the left-side touches (`p01-4`, `p01-6`, `p02-2`, `p02-4`, `p02-6`) show the **right** arm crossing the body. Nothing in either book uses the left hand.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #2, navaratri #2, saraswati #2, varalakshmi #2, nitya #2: names 1–10 correct; **#11 Padmanabha "Chest, all fingers"**; #12 crown | **CONTRADICTS** on #11. Also says "Keshavaya Namaha…", where the book prints bare names (P p.1 finding); not a hand issue. |
| sandhyavandanam #2 (navel and crown) | **AGREES** |
| sandhyavandanam #21 ("heart and the crown") | **CONTRADICTS** (follows the gloss) |
| sandhyavandanam #52 ("heart and the crown") | **CONTRADICTS** (follows the gloss) |
| All steps | **SILENT** on the S rule about the thumb meeting the touching finger |

### (3) Proposed canonical text
- **EN:** Using only the right hand, touch each place as you say its name: thumb to the right and left cheek (Keshava, Narayana); ring finger to the right and left eye (Madhava, Govinda); index finger to the right and left nostril (Vishnu, Madhusudana); little finger to the right and left ear (Trivikrama, Vamana); middle finger to the right and left shoulder (Shridhara, Hrishikesha); then the whole palm to the navel (Padmanabha) and to the crown of the head (Damodara). For the left side, reach across with the right hand.
- **TA:** வலது கையால் மட்டும், ஒவ்வொரு நாமத்தைச் சொல்லும்போதும் அதற்குரிய இடத்தைத் தொடவும்: கட்டைவிரலால் வலது, இடது கன்னங்கள் (கேசவ, நாராயண); மோதிர விரலால் வலது, இடது கண்கள் (மாதவ, கோவிந்த); ஆள்காட்டி விரலால் வலது, இடது நாசிகள் (விஷ்ணோ, மதுஸூதன); சுண்டு விரலால் வலது, இடது காதுகள் (த்ரிவிக்ரம, வாமன); நடுவிரலால் வலது, இடது தோள்கள் (ஶ்ரீதர, ஹ்ருஷீகேஶ); பின் முழு உள்ளங்கையால் நாபி (பத்மநாப), உச்சந்தலை (தாமோதர). இடது பக்கத்தைத் தொட வலது கையைக் குறுக்காகக் கொண்டு செல்லவும்.

### (4) Needs a human decision
- **The S thumb-contact rule.** Exact meaning of: *"tip of the forefinger touches the thumb while doing the 1st pair … the thumb touching the respective fingers while doing the remaining pairs"*. The likely reading: the touching finger is held against the thumb, as in a pinch, rather than pointing alone. The drawings are too small to confirm it. It is S-only (P is silent). Decide whether to adopt it everywhere before drawing the finger poses.
- **Bare names or "…aaya namaha".** Mantra wording, outside this note's scope, but the visual cue table keys on it.

---

## 5. Karpura Neerajanam

### (1) What the book says
- **P p.12, block 12** (Vighneshwara pooja, checked on the photo): *"(Wave the camphor in clock-wise direction in front of the deity)"*. The drawing beside it (no crop; `p12-camphor.png` from the page photo) shows the karta **seated cross-legged**, holding a camphor stand forward in the right hand.
- The main poojas give no more than a bare instruction:
  - Nitya p.44, block 6; Siddhivinayaka p.78; Varalakshmi p.132: *"(Wave camphor light)"*.
  - Navaratri p.303 and Saraswati p.322: *"(Offer camphor light)"*.
  - Dashami/udvasanam pages: *"wave camphor"*.
- **Nitya p.44, block 9:** *"(Showing the hands to the fire, bring them to the eyes in a mark of respect)"*.
- **What no book says:** feet, middle or face; a count ("three times"); standing; ringing the bell during the waving.

**Book verdict.** Wave the camphor clockwise in front of the deity, with water afterwards (the *neeraajanaanantaram aachamaneeyam* line, e.g. Siddhivinayaka p.78). In Nitya, the hands are then shown to the flame and brought to the eyes. Nothing more is settled.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #12 ("waving camphor clockwise") | **AGREES** |
| ganesha #32: "Stand… circle it clockwise… at the feet, then the middle, then the face, ringing the bell with the left hand" | Clockwise **AGREES**. Feet/middle/face, standing and bell are **not in the book** (book SILENT). Standing is at odds with the only drawing, which shows a seated karta. |
| varalakshmi #22: "three times clockwise, at the feet, then the middle, then the face. Ring the bell with the left hand" | Clockwise **AGREES**; the rest is book SILENT |
| navaratri #23, saraswati #21: "three times clockwise… ringing the bell" | Clockwise **AGREES**; "three times" and the bell are book SILENT |
| nitya #31: wave; hands to flame, then to eyes; water | **AGREES** (SILENT on clockwise) |

**The book does not settle the feet/middle/face vs "three times" conflict.** Neither form is printed.

### (3) Proposed canonical text (book-only core)
- **EN:** Light the camphor and wave it clockwise in front of the deity. Then hold your palms over the flame and bring them to your eyes, and offer a spoonful of water.
- **TA:** கற்பூரம் ஏற்றி, ஸ்வாமியின் முன் வலமாகச் சுற்றிக் காட்டவும். பின் இரு கைகளையும் தீபத்தின் மேல் காட்டிக் கண்களில் ஒற்றிக்கொள்ளவும்; ஒரு உத்தரிணி ஜலம் சமர்ப்பிக்கவும்.
- The "hands to the eyes" sentence is printed only in Nitya. Using it in every pooja is part of decision (b) below.

### (4) Needs a human decision
- **(a) The waving pattern.** One pattern for all poojas: feet, then middle, then face? A plain clockwise circle three times? Or both (three circles at each height)? The book is silent; the animation needs one answer.
- **(b) Hands to the eyes.** Add the Nitya "hands to the flame, to the eyes" to every pooja, or keep it Nitya-only?
- **(c) Standing or seated.** The only book drawing (P p.12) shows a seated karta.
- **(d) Bell during the neerajanam, and in which hand.** Not in the book.

---

## 6. Ghanta Pooja

### (1) What the book says
- **P p.5, block 11:** *"(Apply Sandal to the Bell handle. Then ring the bell for welcoming the deity)"*.
- Nitya p.29 refers back to "See page: 5".
- **Illustration** `1-common-p05-4.png`: a fist gripping the bell's handle, the bell swinging. Hand drawn alone; I could not tell left from right. **Note:** `p05-3` is the asana-pooja sprinkle, not the bell.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #9, navaratri #8, nitya #7, saraswati #8, varalakshmi #8: "Worship the bell with **akshatai**, then ring it with the **left** hand" | **CONTRADICTS** on the offering (book: sandal on the handle). **Book SILENT** on the hand. |

### (3) Proposed canonical text
- **EN:** Apply sandal paste to the handle of the bell, then ring it to welcome the deity. The verse says what the sound is for: to call the devas and send away what should not be here.
- **TA:** மணியின் கைப்பிடியில் சந்தனம் இட்டு, பின் தேவதையை வரவேற்க மணியை அடிக்கவும். அந்த ஒலி எதற்கு என்பதை ஸ்லோகமே சொல்கிறது: தேவர்களை அழைக்கவும், இருக்கக் கூடாதவற்றை விலக்கவும்.

### (4) Needs a human decision
- **Which hand rings the bell?** "Left hand" is common practice and is in the current app, but it is not printed. The drawing does not settle it.
- **Akshatai as well?** Add akshatai as well as sandal, or sandal only?

---

## 7. Pradakshina and Namaskaram

### (1) What the book says
- **G p.XVI, block 0, entry 19:** *"Circumambulating 3 times to the deity and prostrating (saashtaanga (by men) (Panchanga (by women) namaskaram)"*.
- **Nitya p.46; Siddhivinayaka p.79; Navaratri p.300; Saraswati p.322:** *"(Circumambulate (go around the deity) the deity with palms cupped together or go around in the same place as you stand.)"*. Then: *"(Offer your prayers and prostrate before deity)"* (Nitya p.47, Siddhivinayaka p.79; folded into the Navaratri p.300 note).
- **Varalakshmi p.133:** the same rubric, ending *"…as you stand and prostrate before deity."*
- No drawing of a prostration.

**Book verdict.**
- Three rounds, clockwise (pradakshina by definition).
- Go round the deity, or turn on the spot **standing**, palms together.
- Then prostrate: men with eight limbs (saashtaanga), women with five (panchanga).

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #33: "turn clockwise in place three times… prostrate **full length**" | **CONTRADICTS** for a woman karta (full length = saashtaanga). SILENT on palms. Omits "go around the deity". |
| navaratri #25 | **AGREES**; SILENT on count and on the men/women rule |
| nitya #33 | **AGREES** (has the men 8 / women 5 rule) |
| saraswati #22 | **AGREES**; SILENT on count and prostration (the book's Saraswati rubric also omits the prostration) |
| varalakshmi #24: "turn in place **where you are sitting**" | **CONTRADICTS** (book: as you stand) |
| varalakshmi #25 (women five limbs) | **AGREES** |

### (3) Proposed canonical text
- **EN:** With palms joined, go round the deity clockwise three times, or stand and turn clockwise three times where you are. Then prostrate: men with eight limbs touching the ground (saashtaanga), women with five (panchanga).
- **TA:** கைகூப்பியபடி ஸ்வாமியை மூன்று முறை வலம் வரவும்; இடமில்லையெனில் நின்ற இடத்திலேயே மூன்று முறை வலமாகச் சுற்றவும். பின் நமஸ்கரிக்கவும் — ஆண்கள் ஸாஷ்டாங்கமாக (எட்டு அங்கங்கள் தரையில் பட), பெண்கள் பஞ்சாங்கமாக (ஐந்து அங்கங்கள்).

### (4) Needs a human decision
- **"Palms cupped together."** Joined in anjali, or cupped as if holding flowers? I proposed "joined" (கைகூப்பி), as the app already has.
- **Which limbs?** The book does not list the five and eight limbs, so the prostration silhouettes need a reviewer. A common listing: eight = feet, knees, chest, hands, forehead (with shoulders/chin in some lists); five = feet (knees), hands, forehead.

---

## 8. Prana Pratishtha: touching, kara nyasa, anga nyasa

### (1) What the book says
- **P p.19, block 8:** *"(Infusing life into the Kalasha / Picture / Image of deity)"*.
- **Varalakshmi p.115, Navaratri p.286, Saraswati p.307, Siddhivinayaka:** *"* Then perform Pranapratishtha (step 18 - See page.19). Then continue the pradhana puja."*. The same full nyasa applies to every pooja.
- **Rubrics on P pp.20–22**, checked on the photos. Each is printed in italics with its own small drawing.

| Line | Rubric (verbatim) | Crop |
|---|---|---|
| RSHayaha | (Place right palm on head) | `1-common-p20-1` |
| CHandaamsi | (Place right palm on nostrils) | `p20-2` |
| paraadEvataa | (Place right palm on chest) | `p20-3` |
| aam beejam | (Place right palm on right chest) | `p20-4` |
| hreem shaktihi | (Place right palm on left chest) | `p20-5` |
| krOm keelakam | (Place right palm on middle of the chest) | `p20-6` |
| viniyOgaha | (Join the palms) | `p20-7` |
| anguSHTHaabhyaam | (Roll the index finger from the base of thumb till its tip) | `p20-8` |
| tarjanee / madhyamaa / anaamikaa / kaniSHTHikaa | (Roll the thumb finger from the base of [index / middle / ring / little] finger till its tip) | `p21-2` … `p21-5` |
| karatalakarapRSHTHaabhyaam | (Rub both the palm) | `p21-palms` (4-stage strip) |
| hRdayaaya | (Touch the chest with right palm) | `p21-7` |
| shirasE | (Touch the forehead with right palm) | `p22-shirase` |
| shikhaayai | (Touch back of the head(tuft) with right thumb) | `p22-shikhayai` |
| kavachaaya | (Cross the hands and touch right shoulder with left hand and vice versa) | `p22-kavachaya` |
| nEtratrayaaya | (With index, middle and ring fingers, touch left eye,brow centre and right eye.) | `p22-netratraya` |
| astraaya | (With right index and middle fingers, strike the left palm) | `p22-astraya` |
| digbandhaha | (Roll the right hand around the head, clockwise) | `p22-1` |

- **P p.24, block 4:** *"(If the deity is male chant the following from table to the left with appropriate hand gestures…)"*. The nine bhava gestures on pp.24–25 are **drawings only, with no printed captions** (checked on the photo). The `instruction` strings in the transcript (e.g. "Both palms held open and upright") are the transcriber's descriptions, not the book's.
- **Nothing in the book says to touch the kalasha, image or books.**

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #21 | Viniyoga, bija, kara-nyasa rubbing, anga-nyasa order, dig-bandha: **AGREES**. Thumb rule, shikha and netratraya: see below. |
| navaratri #11: "Touch the kalasham or the image with the fingertips of the right hand…" | **CONTRADICTS.** The book prescribes the full step-18 nyasa, done on one's own body. A fingertip touch on the kalasha is not printed. |
| saraswati #11 (fingertips on books/picture) | **CONTRADICTS** (same reason) |
| varalakshmi #13 (fingertips on kalasham) | **CONTRADICTS** (same reason) |

Details of ganesha #21:
- **Kara nyasa thumb rule.** The app says "roll the thumb from the base of each finger". **Minor CONTRADICTION** for *anguSHTHaabhyaam*, where the book rolls the **index finger along the thumb**.
- **Shikha.** The app says "tuft" without "with the right thumb": **SILENT**.
- **Netratraya.** The app says "the three eyes" without the fingers (index, middle, ring) or the order (left eye, brow centre, right eye): **SILENT**.
- **Avahanadi mudras.** The app mentions the nine bhava lines but not their gestures: **SILENT**.

### (3) Proposed canonical text
**ganesha #21 (and the template for the others):**
- **EN:** Place the right palm on the head, the nostrils and the chest for the three opening lines, then on the right chest, left chest and middle of the chest for aam, hreem, krom; join the palms for the viniyoga. For the fingers, roll the index finger up the thumb, then the thumb up the index, middle, ring and little fingers in turn, and rub the palms together, front and back. Then touch the chest and forehead with the right palm, the tuft with the right thumb, cross the arms to touch both shoulders, touch the left eye, brow centre and right eye with the index, middle and ring fingers, and strike the left palm with the right index and middle fingers. Circle the right hand clockwise around the head.
- **TA:** முதல் மூன்று வரிகளுக்கு வலது உள்ளங்கையைத் தலை, நாசி, மார்பு மீது வைக்கவும்; ஆம், ஹ்ரீம், க்ரோம் என்பதற்கு வலது மார்பு, இடது மார்பு, மார்பின் நடு; விநியோகத்திற்குக் கைகூப்பவும். கர ந்யாஸத்தில், கட்டைவிரலின் அடியிலிருந்து நுனி வரை ஆள்காட்டி விரலை உருட்டவும்; பின் ஆள்காட்டி, நடு, மோதிர, சுண்டு விரல்கள் ஒவ்வொன்றின் அடியிலிருந்து நுனி வரை கட்டைவிரலை உருட்டவும்; இரு உள்ளங்கைகளையும் முன்னும் பின்னும் தேய்க்கவும். பின் வலது உள்ளங்கையால் மார்பு, நெற்றி; வலது கட்டைவிரலால் குடுமி; கைகளைக் குறுக்காக்கி இரு தோள்கள்; ஆள்காட்டி, நடு, மோதிர விரல்களால் இடது கண், புருவ மத்தி, வலது கண் ஆகியவற்றைத் தொடவும்; வலது ஆள்காட்டி, நடு விரல்களால் இடது உள்ளங்கையில் தட்டவும். வலது கையைத் தலையைச் சுற்றி வலமாகச் சுழற்றவும்.

**navaratri #11, saraswati #11, varalakshmi #13:** use the same nyasa text, keeping the existing deity-specific sentences (the feminine bhava forms, and "the books are not opened until Vijayadashami").

### (4) Needs a human decision
- **Fingertip touch.** Keep the fingertip touch on the kalasha, books or image *in addition to* the nyasa (a widespread practice), or drop it? The book neither prints nor forbids it.
- **The nine avahanadi gestures.** These need a reviewer to name or describe them. The book only draws them; the transcriber's descriptions are not authoritative.

---

## 9. Vighneshwara Dhyanam (same body-map engine)

### (1) What the book says
- **P p.3, block 3** and **P p.6, block 5:** *"(Gently tap the two temples (five times ) with both hands knuckled while chanting the following mantras.)"*
- **S book p.18 (pdf p14), block 1:** *"Gently tap both sides of the forehead with the knuckles (fists) five times"*.
- **Illustrations:** `1-common-p03-3.png` and the S p.18 drawing: both fists at the temples.

### (2) App, step by step

| Step | Verdict |
|---|---|
| ganesha #3, navaratri #3, saraswati #3, varalakshmi #3, nitya #3 | **SILENT** on "five times". The TA "நெரிக்கும் விரல் மூட்டுகளால்" is unidiomatic. |
| sandhyavandanam #3, #26 | **AGREES** |

### (3) Proposed canonical text
- **EN:** Make loose fists and gently tap both temples with the knuckles five times while reciting.
- **TA:** இரு கைகளையும் லேசாக மடக்கி, விரல் முட்டிகளால் இரு நெற்றிப் பொட்டுகளிலும் மெதுவாக ஐந்து முறை குட்டியபடி சொல்லவும்.

### (4) Needs a human decision
None.

---

## Count

**Contradictions the book settles: 12**
1. Sankalpam palm order: right over left (ganesha #13, navaratri #6, saraswati #6 have it reversed).
2. Sankalpam: akshatai, not water (varalakshmi #6).
3. Pranayamam finger shape: index and middle folded; thumb and ring+little close the nostrils.
4. Pranayamam breath timing: the mantra is split across inhale, hold and exhale (purvangam ×5).
5. Achamanam hand shape and direction: forefinger to the thumb; east or north (purvangam ×5).
6. Padmanabha = navel, not chest or heart (purvangam ×5, sandhya #21 and #52).
7. Ghanta: sandal on the handle, not akshatai (×5).
8. Namaskaram: men eight limbs, women five (ganesha #33 says "full length" for everyone).
9. Pradakshina standing, not sitting (varalakshmi #24).
10. Prana Pratishtha: the full nyasa, not a fingertip touch (navaratri #11, saraswati #11, varalakshmi #13).
11. Kara nyasa anguSHTHa: the index finger rolls along the thumb (ganesha #21).
12. Vighneshwara dhyanam: five taps (purvangam ×5 silent, sandhya says five).

The ear touch after pranayamam is a book-settled **omission** across all pranayamam steps. It is not counted above.

**Left open (needs a human decision): 8**
1. Which hand rings the bell (ghanta pooja and neerajanam).
2. Neerajanam pattern: feet/middle/face vs a plain three times clockwise.
3. Neerajanam: standing vs seated, and the bell during it.
4. Sankalpam extras: which palm holds the akshatai; flower; drop of water; releasing to the north.
5. Prana Pratishtha: whether to also touch the kalasha, image or books.
6. Pradakshina: "palms cupped together" = anjali or cupped.
7. The S Anga Vandanam thumb-contact rule: its meaning, and whether to apply it everywhere.
8. The nine avahanadi gestures and the 5/8 prostration limbs: drawn or named in the book but not described; a reviewer must describe them.

**Smaller things noticed in passing**
- ganesha #13: the EN and TA texts differ (TA drops the pranayama/ear sentence).
- The `step-visuals.md` crop map mislabels `p03-3`, `p04-1`, `p05-3`, `p02-6` and `p03-1` (see the top of this file).
