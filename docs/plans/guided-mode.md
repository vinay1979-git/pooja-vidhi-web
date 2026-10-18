# Plan: Guided mode (the Vidvaan Pandit voice)

*Status: researched 18 October 2026, awaiting the owner's go-ahead for the Sanskrit bake-off in §4.5. Re-check model names and prices before building — TTS models and prices were changing month to month (e.g. Gemini TTS output price doubles on 1 Jan 2027).*


Researched 2026-10-18. Everything marked **[verified]** was read today on the vendor's own docs or pricing page. **[unverified]** marks things I could not confirm: claims from my own knowledge, third-party sources, or estimates.

## TL;DR

- **No major commercial TTS lists Sanskrit as a supported language** as of today. That covers Sarvam Bulbul (v2, v3 and v4-flash), Google Gemini TTS (3.8 Flash), Google Cloud Chirp 3 HD, ElevenLabs (v3 and v4) and Azure. Every route to Sanskrit through a commercial API is therefore a workaround: send Devanagari to a Hindi or Marathi voice, or send a Kannada- or Telugu-script transliteration to a Kannada or Telugu voice. Only a listening test can tell which one works.
- **Two open models support Sanskrit explicitly:**
  - **AI4Bharat Indic Parler-TTS** (Apache-2.0). Sanskrit is official, with one speaker ("Aryan").
  - **Vāgdhenu** (Prathosh A.P., arXiv June 2026; code Apache-2.0). It is built for metrical shloka chanting, has a single voice (the author's own), and needs a GPU.
- **None of the options handles Vedic svara marks.** Neither does any of them document support for ꣳ ("gum"). Both have to be pre-processed out of the text before synthesis.
- **Recommendation:** use a provider-agnostic server route, generate audio one line at a time, and cache every clip permanently. Bake off Gemini 3.8 Flash TTS (provisional primary) against Sarvam Bulbul (fallback, and the owner's preferred vendor) on 5 test mantras. Keep Indic Parler-TTS in reserve as the Sanskrit-only specialist.
- **Cost:** about $1 per *uncached* pooja walk-through. With caching it is essentially $0 per walk-through, plus a one-time generation cost for each (pooja × UI language).

---

## 1. Comparison table

Workload for one pooja: 30 steps, 15,000 characters of instruction text and 25,000 characters of Sanskrit (Devanagari).
- Audio-length assumptions for token-billed models: instructions run about 14 chars/s, which gives about 18 min. Slow, reverent Sanskrit runs about 8 chars/s, which gives about 52 min. Total: about 70 min, or 4,200 s. **[unverified estimate]**
- Exchange rate: ₹88 = $1 **[assumption]**.

| | **Sarvam Bulbul v4-flash / v3** | **Gemini 3.8 Flash TTS** (Gemini API) | **Google Cloud Chirp 3 HD** | **ElevenLabs v3 / v4** | **Azure Neural TTS** | **AI4Bharat Indic Parler-TTS** (self-host) | **Vāgdhenu** (self-host) |
|---|---|---|---|---|---|---|---|
| **Sanskrit officially** | No. Codes: bn, en, gu, hi, kn, ml, mr, od, pa, ta, te (-IN) [verified] | No. Not in the list of 130+ languages [verified] | No [verified] | No [verified] | No sa-IN TTS voices in the language table [verified] | **Yes**, speaker "Aryan"; NSS 99.7% [verified, model card] | **Yes**: metrical shlokas, expert MOS about 4.6 [verified, paper] |
| **Sanskrit workaround** | Devanagari through hi-IN or mr-IN; or Kannada-script transliteration through kn-IN; plus a pronunciation dictionary (`dict_id`) | Devanagari plus a style prompt ("recite in Sanskrit, slow Vedic pace") | kn-IN or hi-IN transliteration trick (the old `sanskrit_tts` PyPI package does this with Kannada) | Devanagari through a Hindi-capable model | hi-IN or mr-IN voice | n/a | n/a |
| **Instruction languages** (ta, te, kn, ml, hi, en) | All 6. v4-flash has **no Malayalam (or Odia) personas yet**, so ml stays on v3 [verified] | All 6 [verified] | All 6 [verified] | All 6 on v3 and v4; v2 and Flash cover only hi and ta [verified] | All 6 [verified for hi, kn, ml, ta, te, en] | All 6, plus 15 more [verified] | Sanskrit only |
| **Voice character** | v4-flash: 200+ personas `name_lang_style`. Includes **`mani_hi_devotional`** (the only devotional one) and `*_narration` / `*_documentary` styles. Personas are language-bound; no age metadata [verified] | 30 prebuilt voices plus an extended library, Voice Design and Voice Replication; free-text `speech_metadata.style` [verified]. The **same voice works across all languages** | Fixed voices per locale | Voice Design can describe "elderly Indian priest" [unverified for v4] | Fixed voices per locale; male voices exist (e.g. ta-IN-ValluvarNeural, hi-IN-MadhurNeural) [verified] | Free-text caption: gender, pace, pitch, expressivity, "very clear audio" [verified] | One fixed voice (the author's). The README asks users not to impersonate it [verified] |
| **Pace / pauses** | pace 0.5–2.0 (v3/v4); pitch and loudness only on v2 per the API reference. **No SSML**: use punctuation and line breaks [verified] | Style prompt, plus inline `<short pause>`-type tags [verified] | `speaking_rate` 0.25–2.0; `[pause long]` markup (not in streaming) [verified] | Audio tags (v3 / v4 Turbo); no SSML documented [verified] | Full SSML `<break>` and `<prosody rate>` [standard Azure feature, unverified today] | Commas create pauses; pace set in the caption [verified] | Meter-driven durations |
| **Streaming** | WebSocket `wss://api.sarvam.ai/text-to-speech/ws`, MP3. REST max 2,500 chars per request. TTFA under 250 ms (v4-flash) [verified] | `stream: true`, raw PCM 24 kHz [verified] | Yes (PCM / OGG_OPUS) [verified] | Yes (WebSocket) | Yes | Possible (inference guide); you build it | No (CLI or Gradio only) |
| **Key server-side?** | Yes. The WebSocket needs an `Api-Subscription-Key` header, which browsers can't set → proxy | Yes → proxy | Yes (service account) | Yes | Yes | Your own endpoint | Your own endpoint |
| **Price** | v4-flash ₹20/10k chars; v3 ₹30/10k (pay-as-you-go) [verified]. Launch promo ₹10/10k until 12 Nov [third-party, unverified] | $0.50/M input tokens + **$9/M audio-out tokens** until 31 Dec 2026, then **$18/M** from 1 Jan 2027. Lite: $6/M, then $12/M. 25 audio tokens/s. Free tier exists [verified] | $30/M chars after **1M free chars per month** [verified via cached pricing pages] | $0.08/1k chars (v3, v4, v2); $0.04/1k (v4 Turbo, Flash) [verified] | about $15–16/M chars for neural [unverified] | GPU time: Modal L4 $0.80/h, HF Endpoint L4 $0.70–0.80/h [verified] | GPU time; ZeroGPU demo only |
| **Uncached cost per pooja** (40k chars, about 70 min audio) | **v4-flash ₹80 ≈ $0.91**; v3 ₹120 ≈ $1.36 | **≈ $0.97** now (105k audio tokens × $9/M + input). **≈ $1.91** from 2027. Lite ≈ $0.65 / $1.28 | ≈ $1.20 (first ~25 poojas per month free) | **$3.20** (v3/v4); $1.60 (Turbo) | ≈ $0.62 [unverified] | ≈ $0.30–0.80 GPU time + cold starts [RTF unverified] | n/a |
| **Cached cost per walk-through** | ≈ $0.003 egress (about 30 MB of MP3) | same | same | same | same | same | same |

**Cache arithmetic:**
- The 25k Sanskrit characters are the same for every UI language. Mantra audio is generated once and shared by Tamil, English, Telugu and other users.
- For a catalogue of 20 poojas in 6 UI languages: 20×25k + 20×15k×6 = **2.3M characters, about $52 one-time** on Sarvam v4-flash, or about $56 on Gemini 3.8 Flash at 2026 prices.
- Recurring cost after that is only storage and egress: about 30–35 MB per pooja-language at 64 kbps MP3.
- Caching also gives **deterministic, reviewable audio**. A take that pronounces a mantra correctly can be approved and pinned, so it never regresses. Of everything above, this matters most for Sanskrit.

---

## 2. Per-provider notes

### Sarvam AI: Bulbul
- **Current models [verified]:**
  - `bulbul:v4-flash` is "recommended for new integrations".
  - `bulbul:v3` is still the API default when `model` is omitted.
  - `bulbul:v2` is legacy.
- **Languages [verified]:** 11 codes. **There is no `sa-IN`.** v4-flash has no Malayalam or Odia personas, and the best-practice guide says to keep that traffic on v3. Kannada, Punjabi, Tamil and Telugu have only 3–4 personas each.
- **Voices:**
  - v3 has 37 named speakers (shubh, aditya, anand, gokul, vijay, mani, …).
  - v4-flash has about 224 voice×style personas, e.g. `mani_hi_devotional`, `anand_hi_documentary`, `ratan_hi_documentary`, `gokul_ta_narration`, `vijay_ta_narration`, `kavitha_te_narration`.
  - The docs give no "older male" label, so audition the voices to choose.
- **Controls:**
  - pace is 0.5–2.0 on v3 and v4-flash.
  - There is a conflict on pitch and loudness. The API reference says they are v2-only. The v4-flash best-practice guide mentions controlling rhythm with "pace, pitch, loudness". [conflict, unverified]
  - There is **no SSML**: pauses come from punctuation and line breaks.
  - `dict_id` pronunciation dictionaries are supported on v3 and v4-flash. They are useful for fixing recurring Sanskrit words such as नमः, स्वाहा and ॐ.
- **Streaming:** WebSocket only, MP3 output, header auth. REST returns base64 audio; max 2,500 chars per request on v3 and v4-flash. TTFA under 250 ms (vendor claim).
- **Sanskrit evidence:** none. Sarvam's materials don't mention Sanskrit or devotional recitation. The `mani_hi_devotional` persona is the closest fit. Sarvam's Hindi voices are trained on Hindi, so expect **Hindi schwa deletion** (नमः → "namah" might become "nam-ah", and गणपतये could lose vowels), dropped visargas, and Hindi-style nasalised anusvara. **The Kannada-script route is the main hope.** Transliterate Devanagari to Kannada script and send it to a kn-IN voice. Kannada orthography keeps the inherent vowel and has all the aspirates. Vāgdhenu and EdgeSanskrit-TTS use this trick for exactly this reason.
- **Pricing [verified]:** v4-flash ₹20/10k chars and v3 ₹30/10k on pay-as-you-go. Prices are slightly lower on the Pro and Growth plans. Free credits on signup (amount not stated). Rate limits are not published.

### Google Gemini native TTS (Gemini API)
- **Models [verified]:**
  - `gemini-3.8-flash-tts` (130+ languages) and `gemini-3.8-flash-lite-tts` (100+).
  - `gemini-3.1-flash-tts-preview`, which is superseded.
  - `gemini-2.5-pro-preview-tts` and `gemini-2.5-flash-preview-tts`, which are still priced.
- **Languages:** hi, ta, te, kn, ml, mr, bn, gu, pa, or, as are listed. **Sanskrit is not listed.**
- **Control [verified]:**
  - `speech_metadata.style` takes free-text delivery direction, e.g. "slow, reverent Vedic recitation by an elderly scholar, every syllable distinct".
  - Inline tags such as `<short pause>`.
  - The `text` field is spoken verbatim.
  - Voice Design and Voice Replication can create a consistent custom "pandit" voice. Stateful custom voices have a 1-year TTL that refreshes on use.
- **Why it's a strong candidate:** one voice speaks *every* UI language and the Sanskrit, so the "same pandit" stays consistent from instruction to mantra. Sarvam's personas, by contrast, are bound to one language each. The LLM-based model may also read Devanagari Sanskrit better than a Hindi-only voice, though **I found no evidence of this** and it is the key thing to A/B test.
- **Output:** WAV or PCM at 24 kHz. Transcode to MP3 or Opus before caching.
- **Pricing [verified]:**
  - 3.8 Flash TTS: input $0.50/M, audio output $9/M until 31 Dec 2026, **doubling to $18/M on 1 Jan 2027**.
  - Lite: $6/M, rising to $12/M.
  - Audio is 25 tokens/s, so 1 hour costs about $0.81 now and $1.62 in 2027.
  - A free tier exists. **[Unverified]** free-tier data may be used for product improvement, so use paid tier in production.

### Google Cloud TTS: Chirp 3 HD
- No sa-IN. Supported Indian locales: bn, en, gu, hi, kn, ml, mr, pa (preview), ta, te, ur. [verified]
- `speaking_rate` 0.25–2.0. Pause markup `[pause]`, `[pause short]` and `[pause long]` works in the `markup` field (not for pa-IN, and not in streaming). [verified]
- $30/M chars with 1M chars free per month [verified via cached pricing pages; the live page did not render].
- Good, inexpensive choice for *instructions*. Sanskrit is possible only through the kn-IN transliteration trick, with no style control.

### ElevenLabs
- **Models:** Eleven v4, v4 Turbo, v3, Multilingual v2 and Flash v2.5. v3 and v4 cover hi, ta, te, kn, ml and mr. Multilingual v2 and Flash cover only hi and ta. **No Sanskrit.** [verified]
- **Pricing:** $0.08 per 1k chars (v4, v3, v2) and $0.04 (v4 Turbo, Flash). This makes it the most expensive option: $3.20 per uncached pooja. [verified]
- **Voice:** Voice Design / Voice Library would make an "elderly pandit" voice easy [unverified for v4]. No SSML. Audio tags on v4 Turbo.
- **Sanskrit quality:** no evidence found.

### Microsoft Azure AI Speech
- There is **no sa-IN text-to-speech voice** in the language-support table. [verified: Indian TTS locales include hi, bn, kn, ml, mr, gu, or, pa, as, ta, te, en]
- Male voices exist, e.g. ta-IN-ValluvarNeural, te-IN-MohanNeural, hi-IN-MadhurNeural, ml-IN-MidhunNeural, kn-IN-GaganNeural.
- Full SSML. Pricing is not checked today. [unverified]
- Not recommended unless other services are already on Azure.

### AI4Bharat Indic Parler-TTS
- **Licence:** Apache-2.0 (Hugging Face card). AIKosh says MIT; the HF card is authoritative.
- **Model:** 0.9B parameters. 21 official languages **including Sanskrit** (speaker "Aryan", NSS 99.71%), plus all six instruction languages (e.g. Tamil "Jaya", Telugu "Prakash", Kannada "Suresh", Malayalam "Harish", Hindi "Rohit").
- **Control:** caption-controlled ("Aryan speaks slowly with a deep, low-pitched voice, very clear audio").
- **Weaknesses:**
  - Only one Sanskrit voice. Its age and timbre are unknown until you listen.
  - The Vāgdhenu paper says Parler "introduced content drift", meaning it may skip or hallucinate words on long inputs. Keep inputs to one line.
  - No managed API. A community Replicate model exists (sruthiselvaraj/indicparlertts) but its maintenance is unknown.
- **Hosting:**
  - Modal (L4 $0.80/h, billed per second, $30/month free credit, scales to zero; cold start of tens of seconds [unverified]).
  - Or a HF Inference Endpoint (L4 $0.70–0.80/h, billed per minute, supports scale-to-zero).
  - Batch pre-generation fits Modal well. A real-time-factor figure for Parler on an L4 was **not verified**: measure it.

### Sanskrit-specialised projects
- **Vāgdhenu** (arXiv 2608.26146, June 2026; github.com/prathoshap/vagdhenu; demo at huggingface.co/spaces/prathoshap/vagdhenu-demo):
  - A meter-aware shloka-to-chant system: IndicF5 / F5-TTS plus BigVGAN-v2. Its Devanagari→Kannada frontend avoids schwa deletion.
  - Handles anusvāra (homorganic nasal) and visarga sandhi, with echo before a daṇḍa.
  - Code is Apache-2.0; weights carry the base models' licences.
  - A July 2026 Advaita-l mailing-list post calls it "quite good".
  - **Limits:**
    - Single speaker (the author's voice; impersonation is discouraged).
    - It needs a `meter` and pāda-split input, so prose Vedic mantras and name lists are out of scope.
    - It needs a CUDA GPU and has no API.
    - **No Vedic svara handling, and ꣳ is not mentioned.**
  - Best used offline for the anuṣṭubh shlokas.
- **EdgeSanskrit-TTS** (HF Hari7718, MIT): an IndicF5 fine-tune that runs on CPU (RTF about 0.8). The same anusvāra and visarga rules apply. Its chant quality comes from a reference clip. It is a single-author hobby project, so treat it as experimental.
- **IIT Madras Indic TTS / Bhashini (Dhruva) / IIIT-H Indic-TTS API:** I could **not verify** Sanskrit voices in any of them. The IITM voices page timed out, and the Bhashini language lists weren't found. These licences are also restrictive for commercial use [unverified].

### Vedic accents, anusvara, visarga, ꣳ: what to expect
- **Svara marks** (U+0951 udātta, U+0952 anudātta, U+1CD0–1CFF Vedic extensions): **no TTS uses them.** Strip them before synthesis and keep them for display. Accent-correct Vedic recitation from TTS is not realistic today. Phrase it as "clear recitation", not "Vedic svara chanting".
- **ꣳ (U+A8F3):**
  - No TTS documents it.
  - Pre-replace it with an explicit **"गुं"** (Kannada route: "ಗುಂ") before synthesis. The often-seen spelling "ग्ं" also works.
  - Taittirīya example: स भूमिꣳ → स भूमिगुं.
- **Anusvāra:** Hindi-trained voices nasalise the vowel. For a correct reading, convert ं before a stop consonant into the homorganic nasal plus virama (शंकर → शङ्कर, संध्या → सन्ध्या). Keep it before य र ल व श ष स ह, and test there.
- **Visarga:** Hindi voices often drop it or render it as a weak "h". Option: pausal echo, sending "नमः" as "नमह" and "स्वाहा"-style text unchanged. A/B both forms.
- **Schwa deletion** is the biggest risk with Hindi or Marathi voices. Mitigations, best first:
  1. Kannada or Telugu script to a kn-IN or te-IN voice. Both mappings from Devanagari are lossless.
  2. A Sarvam `dict_id` for frequent words.
  3. For Gemini, a style note such as "Sanskrit pronunciation: pronounce every inherent 'a'".
- **Do not use the app's Tamil-script transliteration for synthesis.** Tamil script collapses aspirated and voiced stops (क ख ग घ → க), so it loses information. Generate Kannada or Telugu script from the Devanagari, for example with the `@indic-transliteration/sanscript` npm package (JS port) or Aksharamukha. [check package]

---

## 3. Recommendation

**Primary: Gemini 3.8 Flash TTS** (provisional, pending the bake-off).
- One designed or replicated "elderly pandit" voice covers every UI language and the Sanskrit, so the persona stays consistent.
- Free-text style direction for a slow, reverent delivery.
- Cheapest per minute through 2026; still about $1 per uncached pooja after the 2027 price doubling. With caching, the doubling barely matters.

**Fallback (and co-primary candidate the owner asked about): Sarvam Bulbul.**
- Use v4-flash for hi, ta, te, kn and en, and **v3 for ml**.
- Sanskrit goes through the **Kannada-script → kn-IN** route or **Devanagari → `mani_hi_devotional`**, whichever wins the A/B test.
- Advantages: Indian vendor, INR billing, low latency, pronunciation dictionaries.
- Disadvantages: the voice is bound to one language, so the instruction voice and the mantra voice may differ. No SSML. No Sanskrit claims.

**Specialist reserve: AI4Bharat Indic Parler-TTS ("Aryan").** It is the only option that officially supports Sanskrit. Use it if both commercial options fail the pandit listening test, as a batch pre-generation job on Modal: Sanskrit only, one line per call. Revisit **Vāgdhenu** later for metrical shlokas.

**Not recommended:**
- ElevenLabs: about 3× the price, with no Sanskrit advantage shown.
- Azure: no advantage over the others.
- Chirp 3 HD: a reasonable cheap *instruction-only* alternative, but it has no style control for Sanskrit.

**Why "provisional":** no source shows any commercial model reading Sanskrit correctly. The 5-mantra bake-off in §4.5 decides the matter, and it should be judged by someone who knows Vedic recitation.

---

## 4. Proposed architecture

### 4.1 Units of audio ("clips")
- Each step becomes an instruction clip followed by N mantra-line clips.
- Split mantras:
  - on `॥`, `।`, and stored line breaks;
  - for name lists (`ॐ … नमः`), at **one clip per name**;
  - for long Vedic lines, at the stored pāda or line breaks. Do not split mid-word.
- Short clips (about 300 characters or fewer) give:
  - pacing control between lines;
  - small, fast TTS calls (no streaming needed);
  - high cache reuse. "ॐ गणेशाय नमः" or the Gayatri is rendered once and reused by every pooja.
  - smaller blast radius: one mispronounced line can be regenerated or overridden on its own.

### 4.2 Server route (Next.js route handler, keys server-side)
```
GET /api/tts/clip?id=<sha256>          → 302 to the cached public URL (or stream the bytes)
POST /api/tts/clip  {kind: "instruction"|"mantra", text, lang, voiceProfile}
  1. normalize text (NFC; for mantra: strip svara marks, ꣳ→गुं, optional anusvara/visarga rules,
     optional Devanagari→Kannada transliteration depending on provider profile)
  2. key = sha256(provider + model + voice + style + pace + normalizerVersion + normalizedText)
  3. look up the tts_clips table (Supabase): hit → return its URL
  4. miss → call the provider (Gemini / Sarvam / Parler adapter), transcode to MP3 or Opus (~64 kbps mono),
     upload to Supabase Storage bucket `tts/` (or Vercel Blob) at `<key>.mp3`, insert row
     {key, provider, model, voice, text, lang, duration_ms, status: 'auto'|'approved'|'rejected'}
  5. return {url, durationMs}
```
- Check the route against `node_modules/next/dist/docs/` for the route-handler conventions, per AGENTS.md.
- Rate-limit the route. Only allow texts that exist in the DB (look them up by step and line id rather than accepting arbitrary text), so the endpoint can't be used as a free public TTS proxy.
- **Pre-generate** each pooja with a script or admin action ("Warm audio for this pooja / language"), so no user ever waits on synthesis. Generate on the fly only as a fallback.
- **Status column:** a reviewer can mark a clip `approved` or `rejected`. Rejected clips are regenerated, either with a different seed or temperature, or routed to the fallback provider.
- **Manual override:** the same table can point a key at a hand-recorded or pandit-recorded file for the rare line no TTS gets right.

### 4.3 Client playback (pauses and auto-advance in the client, not the audio)
- A simple player state machine: `instruction → gap(afterInstruction) → line1 → gap(afterMantraLine) → line2 … → gap(afterSection) → next step (if autoAdvance) / wait for "Next"`.
- Use one `HTMLAudioElement` and `setTimeout` gaps, or Web Audio for gapless scheduling.
- Prefetch the next 2–3 clip URLs, using `<link rel=preload>` or `new Audio().preload='auto'`.
- User settings live in local state or the profile (X seconds after each mantra, Y after each section, auto-advance on/off, playback rate), so changing them never re-synthesises anything.
- Highlight the current line in all three scripts while its clip plays. Durations come from the DB row.
- Controls: pause/resume, repeat line, repeat step (useful for learning).
- iOS/Safari requires a user gesture before audio plays, so start Guided mode with a "Begin" tap.

### 4.4 Voice profiles
Keep the provider choice in a config table, `voice_profiles`:

`{id, provider, model, voice, style_prompt, pace, sanskrit_strategy: 'devanagari'|'kannada'|'telugu', normalizer_version}`

with separate profiles for instructions (per UI language) and for Sanskrit. Switching vendors only changes the profile; the cache is keyed per profile, so old and new audio can coexist during A/B testing.

### 4.5 Prototype: Sanskrit A/B bake-off (about 1 day)

1. Write a script, e.g. `scripts/tts-bakeoff.ts`. It runs locally and stays out of the deployed app, in keeping with the "test locally before main" rule. It renders **5 test mantras** with each candidate:
   - **Gayatri** (ॐ भूर्भुवः स्वः …): tests visarga, conjuncts (त्स, र्ग), and ॐ.
   - **Rigveda 10.59.6** (or another ṛk already in the DB): long Vedic line; strip svaras.
   - **A Taittirīya line with ꣳ**: tests the "gum" rule. Example: Puruṣa-sūkta *sa bhūmiꣳ viśvato vṛtvā*.
   - **An anuṣṭubh shloka** (e.g. शुक्लाम्बरधरं विष्णुं …): tests anusvāra before a stop, meter rhythm and schwa retention.
   - **5 lines from a 108-names list** (e.g. Varalakshmi's): checks short-clip consistency and "namaḥ" endings.
2. Candidates (about 8 variants):
   - Gemini 3.8 Flash (Devanagari, with a style prompt);
   - Gemini 3.8 Flash (Kannada-script input);
   - Sarvam v4-flash `mani_hi_devotional` (Devanagari);
   - Sarvam v3 or v4-flash kn-IN narration voice (Kannada script);
   - Sarvam with visarga echo on vs off;
   - Indic Parler "Aryan" (HF Space or a Modal one-off);
   - optionally Vāgdhenu (anuṣṭubh only) and ElevenLabs v4 as a quality ceiling.
3. Output a static `bakeoff.html` that plays the variants in **blind randomised order**, with the Devanagari, Kannada and IAST text alongside. Score each on 1–5 for pronunciation, 1–5 for gravitas or voice, and a list of specific mistakes (word, error).
4. Ideally the judge is a person trained in Vedic recitation, or at least someone fluent in Sanskrit, plus the owner. Pick the winning profile per content type (Vedic line, shloka, name list). The winner can differ by type.
5. Also record latency (time to full clip) and cost per variant for the same text.
- Cost of the whole bake-off: well under $5, and a large part may fall within free tiers.

---

## 5. Risks

1. **Sanskrit pronunciation (highest risk).** No commercial vendor supports Sanskrit, so a Hindi- or Kannada-trained model may mispronounce aspirates, sibilants (श / ष / स), the vocalic ṛ (ऋ: Hindi "ri" vs South Indian "ru"), visarga and long vowels. Mitigations: the bake-off, the normaliser rules, per-clip review with approval, manual override clips, and Indic Parler as the specialist fallback. Regional variation, e.g. the South Indian "ru" for ṛ, can be another profile setting.
2. **Vedic svaras can't be reproduced.** Set expectations in the UI: "recitation guide", not authoritative Vedic chant.
3. **Nondeterminism and drift.** LLM-style TTS such as Gemini, ElevenLabs v3/v4 and Parler can skip words, add words or change emphasis between runs. Caching with approved takes prevents regressions. Keep clips short.
4. **Price and model churn.**
   - Gemini 3.8 Flash TTS output price doubles on 1 Jan 2027.
   - Sarvam's model generations (v2 → v3 → v4-flash) and speaker IDs change. Speaker IDs differ between models, and v2/v3 defaults are invalid on v4-flash.
   - Preview models get retired.
   - Pin the model and voice in the profile, include them in the cache key, and keep generated audio permanently.
5. **Persona consistency.** Sarvam personas are bound to one language. A Tamil-instruction voice and a Hindi-devotional Sanskrit voice will sound like two different people. Gemini custom voices avoid this. With Parler, use the caption plus the same speaker name for consistency.
6. **Religious and cultural sensitivity.** A synthetic voice reciting mantras may be unwelcome to some users. Label it ("AI-generated voice"), don't imitate a real, named pandit, and don't clone a real person's voice without consent. Vāgdhenu's single voice is its author's own, and he asks that it not be impersonated.
7. **Licensing.**
   - Indic Parler is Apache-2.0, which is fine.
   - Vāgdhenu's weights inherit their base models' licences; IndicF5 is MIT, but check BigVGAN and F5-TTS before commercial use.
   - Gemini's free tier may use data for training [unverified]; use paid tier.
   - ElevenLabs requires a paid plan for commercial use [unverified].
8. **Abuse and cost blow-up.** The TTS route must only synthesise DB-known text, with rate limits and pre-generation. Never expose provider keys to the browser. Sarvam's WebSocket needs a header that browsers can't send anyway.
9. **Vercel limits.** Synthesis and transcoding inside a function add latency and need an encoder (`ffmpeg-static`, or a pure-JS MP3 encoder) [unverified on the current Vercel runtime]. Pre-generating from a local or CI script avoids this.
10. **Storage.** About 30–35 MB per pooja-language at 64 kbps. Fine for Supabase Storage or Vercel Blob. Exact plan quotas and egress prices were **not verified** today.

---

## 6. Could not verify (summary)
- Sanskrit pronunciation quality of *any* commercial engine: no demos or reviews found.
- Sarvam: free-credit amount, rate limits, the pitch/loudness support conflict on v4-flash, the ₹10 promotion (third-party report only), and the ages of the voices.
- Gemini: the Voice Design specifics for an "elderly pandit", whether free-tier data is used for training, and request size and rate limits.
- Google Cloud TTS: the live pricing page didn't render; I used cached copies.
- Azure: current neural pricing.
- Indic Parler: latency and RTF on an L4 or T4, the age and timbre of the Aryan voice, and the state of the Replicate model.
- IIT Madras / Bhashini / IIIT-H: whether a Sanskrit voice exists, and its licence.
- Audio-length assumptions (14 and 8 chars/s) behind the token-based cost estimates, and the ₹88/$ rate.

## 7. Sources
- Sarvam TTS API reference (models, languages, speakers, pace, limits): https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert
- Sarvam streaming WebSocket: https://docs.sarvam.ai/api-reference-docs/text-to-speech/stream
- Sarvam Bulbul v4-flash best-practice guide (personas, no SSML, ml/od on v3): https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/best-practice-guide-for-bulbul-v-4-flash
- Sarvam Bulbul v4-flash blog (TTFA, 83 voices / 224 combos, ₹20): https://www.sarvam.ai/blogs/bulbul-v4-flash/
- Sarvam pricing: https://www.sarvam.ai/api-pricing
- Promo report (third-party): https://runtimewire.com/article/sarvam-bulbul-v4-flash-pricing-launch
- Gemini speech generation: https://ai.google.dev/gemini-api/docs/speech-generation
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Cloud Chirp 3 HD: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- Google Cloud TTS pricing: https://cloud.google.com/text-to-speech/pricing
- ElevenLabs models: https://elevenlabs.io/docs/overview/models
- ElevenLabs API pricing: https://elevenlabs.io/pricing/api
- Azure Speech language support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- Indic Parler-TTS model card: https://huggingface.co/ai4bharat/indic-parler-tts
- Indic Parler on AIKosh: https://aikosh.indiaai.gov.in/home/models/details/ai4bharat_indic_parler_tts_text_to_speech_model.html
- Indic Parler on Replicate (community): https://replicate.com/sruthiselvaraj/indicparlertts
- Vāgdhenu paper: https://arxiv.org/abs/2608.26146 (HTML: https://arxiv.org/html/2608.26146)
- Vāgdhenu code: https://github.com/prathoshap/vagdhenu
- Vāgdhenu demo: https://huggingface.co/spaces/prathoshap/vagdhenu-demo
- Advaita-l post on Vāgdhenu: https://advaita-vedanta.org/archives/advaita-l/2026-July/065049.html
- EdgeSanskrit-TTS: https://huggingface.co/Hari7718/EdgeSanskrit-TTS
- sanskrit_tts (Kannada-voice workaround): https://pypi.org/project/sanskrit-tts
- IIT Madras Indic TTS: https://www.iitm.ac.in/donlab/indictts/voices
- IIIT-H Indic TTS API: https://bhaasha.iiit.ac.in/indic-tts/api/doc
- Modal pricing: https://modal.com/pricing
- HF Inference Endpoints pricing: https://huggingface.co/docs/inference-endpoints/pricing
