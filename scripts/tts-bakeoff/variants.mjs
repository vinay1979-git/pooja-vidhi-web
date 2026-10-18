/**
 * The candidate list from docs/plans/guided-mode.md §4.5 step 2. Each variant
 * is one (provider, model, voice, script, rules) combination; every test
 * mantra is rendered once per variant, one clip per recitation line.
 *
 * Voices can be swapped from .env.local without editing this file (see
 * README). Model ids and voice ids were checked on the vendors' docs on
 * 18 Oct 2026; see the provider files for the URLs.
 */

const GEMINI_STYLE =
  'Slow, reverent recitation of a Sanskrit mantra by an elderly South Indian Vedic scholar. ' +
  'Calm, deep, steady voice; unhurried, with a short pause at the end. ' +
  'Sanskrit pronunciation: pronounce every inherent "a" (no Hindi schwa deletion), ' +
  'sound every aspirate (kh, gh, th, dh, ph, bh), keep long vowels long, ' +
  'say a final visarga as a soft echo of the vowel before it, and read "gum" as "gum". ' +
  'Devotional and quiet, never dramatic.';

const GEMINI_STYLE_KANNADA =
  GEMINI_STYLE + ' The text is Sanskrit written in Kannada script: read it as Sanskrit, not as Kannada.';

const PARLER_CAPTION =
  'Aryan speaks slowly and clearly in a deep, calm, reverent voice, reciting a Sanskrit mantra. ' +
  'The recording is of very high quality, with very clear audio and no background noise.';

/** @param {Record<string, string|undefined>} env */
export function variants(env) {
  const geminiModel = env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
  const geminiVoice = env.GEMINI_VOICE || 'Charon';
  const sarvamPace = Number(env.SARVAM_PACE || 0.85);
  return [
    {
      id: 'gemini-deva',
      provider: 'gemini',
      model: geminiModel,
      voice: geminiVoice,
      script: 'devanagari',
      style: GEMINI_STYLE,
      note: 'Gemini, Devanagari input, style prompt',
    },
    {
      id: 'gemini-knda',
      provider: 'gemini',
      model: geminiModel,
      voice: geminiVoice,
      script: 'kannada',
      style: GEMINI_STYLE_KANNADA,
      note: 'Gemini, Kannada-script input, style prompt',
    },
    {
      id: 'sarvam-v4-hi-devotional',
      provider: 'sarvam',
      model: 'bulbul:v4-flash',
      voice: env.SARVAM_HI_VOICE || 'mani_hi_devotional',
      language: 'hi-IN',
      pace: sarvamPace,
      script: 'devanagari',
      note: 'Sarvam v4-flash, Hindi devotional persona, Devanagari',
    },
    {
      id: 'sarvam-v4-hi-devotional-echo',
      provider: 'sarvam',
      model: 'bulbul:v4-flash',
      voice: env.SARVAM_HI_VOICE || 'mani_hi_devotional',
      language: 'hi-IN',
      pace: sarvamPace,
      script: 'devanagari',
      visargaEcho: true,
      note: 'As above, with pausal visarga echo (नमः → नमह)',
    },
    {
      id: 'sarvam-v4-kn',
      provider: 'sarvam',
      model: 'bulbul:v4-flash',
      voice: env.SARVAM_KN_VOICE || 'chetan_kn_conversation',
      language: 'kn-IN',
      pace: sarvamPace,
      script: 'kannada',
      note: 'Sarvam v4-flash, Kannada persona, Kannada-script input',
    },
    {
      id: 'sarvam-v3-kn',
      provider: 'sarvam',
      model: 'bulbul:v3',
      voice: env.SARVAM_V3_VOICE || 'mani',
      language: 'kn-IN',
      pace: sarvamPace,
      script: 'kannada',
      note: 'Sarvam v3 (speaker not language-bound), kn-IN, Kannada-script input',
    },
    {
      id: 'parler-aryan',
      provider: 'parler',
      model: 'ai4bharat/indic-parler-tts',
      voice: 'Aryan',
      script: 'devanagari',
      style: PARLER_CAPTION,
      note: 'Indic Parler-TTS (self-hosted), Sanskrit speaker Aryan, Devanagari',
    },
    // Off by default: run with --variants=sarvam-v4-hi-homorganic to add it.
    {
      id: 'sarvam-v4-hi-homorganic',
      provider: 'sarvam',
      model: 'bulbul:v4-flash',
      voice: env.SARVAM_HI_VOICE || 'mani_hi_devotional',
      language: 'hi-IN',
      pace: sarvamPace,
      script: 'devanagari',
      homorganic: true,
      optional: true,
      note: 'Sarvam Hindi devotional with anusvara → homorganic nasal (शंकर → शङ्कर)',
    },
  ];
}

/**
 * Rough cost of one clip in USD, from the prices in the plan (§1, verified
 * 18 Oct 2026). Gemini bills audio-out tokens at 25 tokens/s; Sarvam bills
 * input characters. Parler is your own GPU time, so 0 here.
 */
export function estimateCostUsd(variant, { chars, durationS, date = new Date() }) {
  const INR_PER_USD = 88;
  if (variant.provider === 'gemini') {
    const lite = /lite/.test(variant.model);
    const after2026 = date >= new Date('2027-01-01T00:00:00Z');
    const perM = (lite ? 6 : 9) * (after2026 ? 2 : 1);
    const seconds = durationS ?? chars / 8; // plan's slow-Sanskrit estimate: 8 chars/s
    return (seconds * 25 * perM) / 1e6 + (chars * 0.5) / 1e6; // input tokens ≈ chars, negligible
  }
  if (variant.provider === 'sarvam') {
    const inrPer10k = variant.model === 'bulbul:v3' ? 30 : 20;
    return ((chars / 10000) * inrPer10k) / INR_PER_USD;
  }
  return 0;
}
